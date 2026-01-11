/**
 * useBattlecardsGeneration Hook
 *
 * Orchestrates progressive row-by-row battlecard generation via n8n AI workflow
 *
 * Features:
 * - Row-by-row generation with real-time UI updates
 * - 7 mandatory categories first (Ideal For, Target Verticals, Key Customers, Pricing Model, Company Stage, Primary Geo, Main Integrations)
 * - 3 dynamic categories selected by AI (total exactly 10 rows)
 * - Duplicate prevention via already_filled_categories array
 * - Pause/resume functionality with localStorage persistence
 * - Individual row retry on failure (max 3 attempts)
 * - Automatic cache restoration on mount
 *
 * Workflow:
 * 1. Generate 7 mandatory categories sequentially (SP_024)
 * 2. AI selects and generates 3 dynamic categories (avoiding duplicates)
 * 3. Each row persisted to localStorage immediately
 * 4. Progress tracked via current_row_index and status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BattlecardsState,
  BattlecardRowState,
  BattlecardCellState,
  MANDATORY_BATTLECARD_CATEGORIES,
  DEFAULT_BATTLECARDS_CONFIG,
} from '../types/battlecards.types';
import {
  loadBattlecardsState,
  saveBattlecardsState,
  loadBattlecardRows,
  saveBattlecardRow,
  clearBattlecardCache,
} from '../utils/battlecardsStorage';
import { generateBattlecardRow } from '../services/n8nService';
import type { BattlecardRowResponse } from '../types/n8n.types';

// Vendor and Criteria types from VendorDiscovery
interface WorkflowVendor {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  criteriaScores: Record<string, 'yes' | 'no' | 'unknown' | 'star'>;
  criteriaAnswers: Record<string, { yesNo: 'yes' | 'no' | 'partial'; comment: string; }>;
  features: string[];
}

interface WorkflowCriteria {
  id: string;
  name: string;
  explanation: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
  isArchived?: boolean;
}

interface TechRequest {
  companyContext: string;
  solutionRequirements: string;
}

interface UseBattlecardsGenerationParams {
  projectId: string;
  vendors: WorkflowVendor[];
  criteria: WorkflowCriteria[];
  techRequest: TechRequest;
  autoStart?: boolean; // Auto-start generation on mount
}

interface UseBattlecardsGenerationReturn {
  battlecardsState: BattlecardsState;
  isRunning: boolean;
  progress: number; // 0-100
  startGeneration: () => void;
  pauseGeneration: () => void;
  resumeGeneration: () => void;
  retryRow: (rowId: string) => Promise<void>;
  resetBattlecards: () => void;
}

export const useBattlecardsGeneration = ({
  projectId,
  vendors,
  criteria,
  techRequest,
  autoStart = false,
}: UseBattlecardsGenerationParams): UseBattlecardsGenerationReturn => {
  // ===========================================
  // State Management
  // ===========================================

  const [battlecardsState, setBattlecardsState] = useState<BattlecardsState>({
    rows: [],
    status: 'idle',
    current_row_index: 0,
    total_rows_target: DEFAULT_BATTLECARDS_CONFIG.min_rows, // Start with minimum 8, AI may generate up to 12
    already_filled_categories: [],
    error: undefined,
  });

  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);
  const battlecardsStateRef = useRef(battlecardsState); // Keep ref in sync with state
  const hasAutoStartedRef = useRef(false); // Track if autoStart has already been triggered

  // Update ref whenever state changes
  useEffect(() => {
    battlecardsStateRef.current = battlecardsState;
  }, [battlecardsState]);

  // ===========================================
  // Load Persisted State on Mount
  // ===========================================

  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once per projectId
    if (initializedRef.current) {
      console.log('[useBattlecards] Already initialized, skipping');
      return;
    }

    const savedState = loadBattlecardsState(projectId);
    const savedRows = loadBattlecardRows(projectId);

    if (savedState && savedRows.length > 0) {
      // SP_024: Cache migration - detect and clear old 3-row data
      const expectedMandatoryCount = MANDATORY_BATTLECARD_CATEGORIES.length; // 7
      const hasOldCacheStructure = savedState.total_rows_target === 3 || savedRows.length === 3;

      if (hasOldCacheStructure) {
        console.log('[useBattlecards] Detected old 3-row cache structure, clearing and starting fresh');
        clearBattlecardCache(projectId);
        // Don't restore old cache, fall through to normal initialization
      } else {
        console.log('[useBattlecards] Restoring from localStorage', {
          rowCount: savedRows.length,
          currentIndex: savedState.current_row_index,
          status: savedState.status,
        });

        setBattlecardsState({
          ...savedState,
          rows: savedRows,
        });

        // Mark as auto-started to prevent re-generation
        hasAutoStartedRef.current = true;

        // Don't auto-resume - user must manually click Resume button
        console.log('[useBattlecards] State restored, user can resume manually if needed');
      }
    }

    initializedRef.current = true;
  }, [projectId]);

  // ===========================================
  // Auto-Start Effect
  // ===========================================

  useEffect(() => {
    if (autoStart && !hasAutoStartedRef.current && battlecardsState.status === 'idle' && battlecardsState.rows.length === 0) {
      console.log('[useBattlecards] Auto-starting generation');
      hasAutoStartedRef.current = true;
      startGeneration();
    }
  }, [autoStart, battlecardsState.status, battlecardsState.rows.length]);

  // ===========================================
  // Progress Calculation
  // ===========================================

  const progress = battlecardsState.rows.length > 0
    ? Math.round((battlecardsState.current_row_index / battlecardsState.total_rows_target) * 100)
    : 0;

  // ===========================================
  // Row Generation Logic
  // ===========================================

  const generateRow = useCallback(async (
    rowIndex: number,
    isMandatory: boolean,
    requestedCategory?: string
  ): Promise<BattlecardRowState | null> => {
    try {
      const projectContext = `${techRequest.companyContext || ''} ${techRequest.solutionRequirements || ''}`.trim();
      const validProjectContext = projectContext.length >= 10
        ? projectContext
        : 'Software comparison project';

      const vendorNames = vendors.map(v => v.name);
      const alreadyFilled = battlecardsStateRef.current.already_filled_categories;

      console.log('[useBattlecards] Generating row', {
        rowIndex,
        isMandatory,
        requestedCategory,
        vendorCount: vendorNames.length,
        alreadyFilled,
      });

      const response: BattlecardRowResponse = await generateBattlecardRow(
        projectId,
        vendorNames,
        validProjectContext,
        criteria,
        alreadyFilled,
        isMandatory,
        requestedCategory
      );

      if (!response.success || !response.row) {
        const errorMessage = response.error?.message || 'Failed to generate battlecard row';
        const errorCode = response.error?.code || 'UNKNOWN';

        console.error('[useBattlecards] Row generation failed:', errorCode, errorMessage);

        // Generate unique row_id for failed rows
        const categorySlug = (requestedCategory || 'Unknown').replace(/\s+/g, '_').toLowerCase();
        const uniqueRowId = `${projectId}_battlecard_${rowIndex}_${categorySlug}`;

        // Return a failed row state
        return {
          row_id: uniqueRowId,
          category_title: requestedCategory || 'Unknown',
          status: 'failed',
          cells: [],
          error: errorMessage,
          error_code: errorCode,
          retry_count: 0,
        };
      }

      // Transform n8n response to BattlecardRowState
      // Generate unique row_id based on project, index, and category to ensure React key uniqueness
      const uniqueRowId = `${projectId}_battlecard_${rowIndex}_${response.row.category_title.replace(/\s+/g, '_').toLowerCase()}`;

      const row: BattlecardRowState = {
        row_id: uniqueRowId,
        category_title: response.row.category_title,
        category_definition: response.row.category_definition,
        status: 'completed',
        cells: response.row.cells.map(cell => ({
          ...cell,
          is_expanded: false, // Default to collapsed for UI
        })),
        retry_count: 0,
        timestamp: response.row.timestamp,
      };

      console.log('[useBattlecards] Row generated successfully:', row.category_title);

      return row;
    } catch (error: any) {
      console.error('[useBattlecards] Row generation error:', error);

      // Generate unique row_id for error case
      const categorySlug = (requestedCategory || 'Unknown').replace(/\s+/g, '_').toLowerCase();
      const uniqueRowId = `${projectId}_battlecard_${rowIndex}_${categorySlug}`;

      return {
        row_id: uniqueRowId,
        category_title: requestedCategory || 'Unknown',
        status: 'failed',
        cells: [],
        error: error.message || 'Unexpected error during generation',
        error_code: 'INTERNAL_ERROR',
        retry_count: 0,
      };
    }
  }, [projectId, vendors, criteria, techRequest]);

  // ===========================================
  // Main Orchestration Loop
  // ===========================================

  const orchestrateGeneration = useCallback(async () => {
    console.log('[useBattlecards] Starting orchestration');

    abortRef.current = false;

    // Phase 1: Generate 7 mandatory categories (SP_024: Ideal For, Target Verticals, Key Customers, Pricing Model, Company Stage, Primary Geo, Main Integrations)
    const mandatoryCategories = [...MANDATORY_BATTLECARD_CATEGORIES];

    for (let i = 0; i < mandatoryCategories.length; i++) {
      if (abortRef.current) {
        console.log('[useBattlecards] Generation aborted by user');
        setBattlecardsState(prev => ({
          ...prev,
          status: 'paused',
        }));
        setIsRunning(false);
        return;
      }

      // Skip if already generated
      if (battlecardsStateRef.current.already_filled_categories.includes(mandatoryCategories[i])) {
        console.log('[useBattlecards] Skipping already generated mandatory category:', mandatoryCategories[i]);
        continue;
      }

      const currentRowIndex = battlecardsStateRef.current.rows.length;

      // Create placeholder loading row
      const categorySlug = mandatoryCategories[i].replace(/\s+/g, '_').toLowerCase();
      const loadingRowId = `${projectId}_battlecard_${currentRowIndex}_${categorySlug}`;
      const loadingRow: BattlecardRowState = {
        row_id: loadingRowId,
        category_title: mandatoryCategories[i],
        status: 'loading',
        cells: [],
        retry_count: 0,
      };

      // Add loading row to state immediately
      setBattlecardsState(prev => ({
        ...prev,
        rows: [...prev.rows, loadingRow],
        status: 'running',
        current_row_index: currentRowIndex,
      }));

      // Update ref
      battlecardsStateRef.current = {
        ...battlecardsStateRef.current,
        rows: [...battlecardsStateRef.current.rows, loadingRow],
        current_row_index: currentRowIndex,
      };

      const row = await generateRow(currentRowIndex, true, mandatoryCategories[i]);

      if (row) {
        // Replace loading row with completed/failed row
        setBattlecardsState(prev => ({
          ...prev,
          rows: prev.rows.map((r, idx) => idx === currentRowIndex ? row : r),
          already_filled_categories: row.status === 'completed'
            ? [...prev.already_filled_categories, row.category_title]
            : prev.already_filled_categories,
          current_row_index: currentRowIndex + 1,
        }));

        // Update ref immediately
        battlecardsStateRef.current = {
          ...battlecardsStateRef.current,
          rows: battlecardsStateRef.current.rows.map((r, idx) => idx === currentRowIndex ? row : r),
          already_filled_categories: row.status === 'completed'
            ? [...battlecardsStateRef.current.already_filled_categories, row.category_title]
            : battlecardsStateRef.current.already_filled_categories,
          current_row_index: currentRowIndex + 1,
        };

        // Persist row immediately
        saveBattlecardRow(projectId, row);
        saveBattlecardsState(projectId, battlecardsStateRef.current);
      }
    }

    // Phase 2: Generate 3 dynamic categories (AI decides) (SP_024: Exactly 3 rows to total 10)
    const minDynamicRows = DEFAULT_BATTLECARDS_CONFIG.min_rows - MANDATORY_BATTLECARD_CATEGORIES.length; // 3
    const maxDynamicRows = DEFAULT_BATTLECARDS_CONFIG.max_rows - MANDATORY_BATTLECARD_CATEGORIES.length; // 3

    for (let i = 0; i < maxDynamicRows; i++) {
      if (abortRef.current) {
        console.log('[useBattlecards] Generation aborted by user');
        setBattlecardsState(prev => ({
          ...prev,
          status: 'paused',
        }));
        setIsRunning(false);
        return;
      }

      const currentRowIndex = battlecardsStateRef.current.rows.length;

      // Stop if we've reached max rows or AI decides to stop (row generation fails gracefully)
      if (currentRowIndex >= DEFAULT_BATTLECARDS_CONFIG.max_rows) {
        console.log('[useBattlecards] Reached max rows:', DEFAULT_BATTLECARDS_CONFIG.max_rows);
        break;
      }

      // Create placeholder loading row (category unknown for dynamic rows)
      const loadingRowId = `${projectId}_battlecard_${currentRowIndex}_loading`;
      const loadingRow: BattlecardRowState = {
        row_id: loadingRowId,
        category_title: 'Loading...',
        status: 'loading',
        cells: [],
        retry_count: 0,
      };

      // Add loading row to state immediately
      setBattlecardsState(prev => ({
        ...prev,
        rows: [...prev.rows, loadingRow],
        status: 'running',
        current_row_index: currentRowIndex,
      }));

      // Update ref
      battlecardsStateRef.current = {
        ...battlecardsStateRef.current,
        rows: [...battlecardsStateRef.current.rows, loadingRow],
        current_row_index: currentRowIndex,
      };

      const row = await generateRow(currentRowIndex, false); // AI selects category

      if (row) {
        // SP_024: Frontend duplicate detection - safety check in case n8n returns duplicate
        const isDuplicate = row.status === 'completed' &&
          battlecardsStateRef.current.already_filled_categories.some(
            cat => cat.toLowerCase() === row.category_title.toLowerCase()
          );

        if (isDuplicate) {
          console.warn('[useBattlecards] DUPLICATE DETECTED:', row.category_title, 'already in', battlecardsStateRef.current.already_filled_categories);
          console.warn('[useBattlecards] Marking as failed and retrying with different category');

          // Mark as failed with duplicate error
          const failedRow: BattlecardRowState = {
            ...row,
            status: 'failed',
            error: `Duplicate category detected: "${row.category_title}" - n8n should have avoided this`,
            error_code: 'DUPLICATE_CATEGORY',
          };

          // Replace loading row with failed row
          setBattlecardsState(prev => ({
            ...prev,
            rows: prev.rows.map((r, idx) => idx === currentRowIndex ? failedRow : r),
            current_row_index: currentRowIndex + 1,
          }));

          battlecardsStateRef.current = {
            ...battlecardsStateRef.current,
            rows: battlecardsStateRef.current.rows.map((r, idx) => idx === currentRowIndex ? failedRow : r),
            current_row_index: currentRowIndex + 1,
          };

          // Don't persist failed duplicate row
          // Continue to next iteration - AI will try again with updated already_filled
          continue;
        }

        // Replace loading row with completed/failed row
        setBattlecardsState(prev => ({
          ...prev,
          rows: prev.rows.map((r, idx) => idx === currentRowIndex ? row : r),
          already_filled_categories: row.status === 'completed'
            ? [...prev.already_filled_categories, row.category_title]
            : prev.already_filled_categories,
          current_row_index: currentRowIndex + 1,
        }));

        // Update ref immediately
        battlecardsStateRef.current = {
          ...battlecardsStateRef.current,
          rows: battlecardsStateRef.current.rows.map((r, idx) => idx === currentRowIndex ? row : r),
          already_filled_categories: row.status === 'completed'
            ? [...battlecardsStateRef.current.already_filled_categories, row.category_title]
            : battlecardsStateRef.current.already_filled_categories,
          current_row_index: currentRowIndex + 1,
        };

        // Persist row immediately
        saveBattlecardRow(projectId, row);
        saveBattlecardsState(projectId, battlecardsStateRef.current);

        // If we've reached min rows and row failed, stop (AI couldn't find more categories)
        if (currentRowIndex >= DEFAULT_BATTLECARDS_CONFIG.min_rows - 1 && row.status === 'failed') {
          console.log('[useBattlecards] AI stopped category selection at', currentRowIndex + 1, 'rows');
          break;
        }
      }
    }

    // Mark as completed
    console.log('[useBattlecards] Generation complete');
    setBattlecardsState(prev => ({
      ...prev,
      status: 'completed',
      total_rows_target: prev.rows.length,
    }));
    setIsRunning(false);

    // Save final state
    saveBattlecardsState(projectId, {
      ...battlecardsStateRef.current,
      status: 'completed',
      total_rows_target: battlecardsStateRef.current.rows.length,
    });
  }, [projectId, generateRow]);

  // ===========================================
  // Public API
  // ===========================================

  const startGeneration = useCallback(() => {
    console.log('[useBattlecards] Starting generation');
    setIsRunning(true);
    setBattlecardsState(prev => ({
      ...prev,
      status: 'running',
    }));
    orchestrateGeneration();
  }, [orchestrateGeneration]);

  const pauseGeneration = useCallback(() => {
    console.log('[useBattlecards] Pausing generation');
    abortRef.current = true;
    setIsRunning(false); // Immediately stop running state for UI
    setBattlecardsState(prev => ({
      ...prev,
      status: 'paused',
    }));
    saveBattlecardsState(projectId, {
      ...battlecardsStateRef.current,
      status: 'paused',
    });
  }, [projectId]);

  const resumeGeneration = useCallback(() => {
    console.log('[useBattlecards] Resuming generation');
    setIsRunning(true);
    setBattlecardsState(prev => ({
      ...prev,
      status: 'running',
    }));
    orchestrateGeneration();
  }, [orchestrateGeneration]);

  const retryRow = useCallback(async (rowId: string) => {
    console.log('[useBattlecards] Retrying row:', rowId);

    const rowIndex = battlecardsState.rows.findIndex(r => r.row_id === rowId);
    if (rowIndex === -1) {
      console.error('[useBattlecards] Row not found for retry:', rowId);
      return;
    }

    const existingRow = battlecardsState.rows[rowIndex];

    // Check retry limit
    if (existingRow.retry_count >= DEFAULT_BATTLECARDS_CONFIG.max_retries_per_row) {
      console.error('[useBattlecards] Max retries reached for row:', rowId);
      return;
    }

    // Mark row as loading
    setBattlecardsState(prev => ({
      ...prev,
      rows: prev.rows.map((r, i) =>
        i === rowIndex
          ? { ...r, status: 'loading', retry_count: r.retry_count + 1 }
          : r
      ),
    }));

    // Determine if this is a mandatory category
    const isMandatory = MANDATORY_BATTLECARD_CATEGORIES.includes(existingRow.category_title);

    // Retry generation
    const newRow = await generateRow(rowIndex, isMandatory, existingRow.category_title);

    if (newRow) {
      setBattlecardsState(prev => ({
        ...prev,
        rows: prev.rows.map((r, i) =>
          i === rowIndex
            ? { ...newRow, retry_count: existingRow.retry_count + 1 }
            : r
        ),
        already_filled_categories: newRow.status === 'completed'
          ? [...prev.already_filled_categories.filter(c => c !== existingRow.category_title), newRow.category_title]
          : prev.already_filled_categories,
      }));

      // Persist updated row
      saveBattlecardRow(projectId, { ...newRow, retry_count: existingRow.retry_count + 1 });
      saveBattlecardsState(projectId, battlecardsStateRef.current);
    }
  }, [battlecardsState, projectId, generateRow]);

  const resetBattlecards = useCallback(() => {
    console.log('[useBattlecards] Resetting battlecards');
    abortRef.current = true;
    setIsRunning(false);
    hasAutoStartedRef.current = false; // Reset auto-start flag to allow regeneration
    setBattlecardsState({
      rows: [],
      status: 'idle',
      current_row_index: 0,
      total_rows_target: DEFAULT_BATTLECARDS_CONFIG.min_rows,
      already_filled_categories: [],
      error: undefined,
    });
    clearBattlecardCache(projectId);
  }, [projectId]);

  // ===========================================
  // Auto-Resume Effect
  // ===========================================
  // NOTE: Removed this effect as it caused infinite loops.
  // Orchestration is now only triggered explicitly via startGeneration/resumeGeneration

  return {
    battlecardsState,
    isRunning,
    progress,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    retryRow,
    resetBattlecards,
  };
};
