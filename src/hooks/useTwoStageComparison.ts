/**
 * useTwoStageComparison Hook
 *
 * Core orchestration hook for the new two-stage progressive comparison system
 *
 * Features:
 * - Stage 1: Individual vendor × criterion research (parallel, max 5 concurrent total)
 * - Stage 2: Comparative ranking with star allocation (per criterion, after Stage 1 complete)
 * - Progressive cell-by-cell population of comparison matrix
 * - Pause/resume functionality with localStorage persistence
 * - Individual cell retry for Stage 1, row-level retry for Stage 2
 * - Stage 2 can update Stage 1 data if better evidence found
 *
 * Workflow:
 * 1. Process criteria sequentially (criterion-by-criterion)
 * 2. Within each criterion, vendors process in parallel (up to 5 concurrent workflows)
 * 3. When all Stage 1 complete for a criterion, trigger Stage 2
 * 4. Stage 2 runs in background while Stage 1 continues with next criterion
 * 5. Both stages persist results to separate localStorage keys
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ComparisonState,
  CriterionRowState,
  CellState,
  Stage1StorageData,
  Stage2StorageData,
} from '../types/vendorComparison.types';
import {
  loadStage1Results,
  loadStage2Results,
  saveStage2Results,
  loadComparisonState,
  clearAllComparisonData,
} from '../utils/comparisonStorage';
import {
  compareVendorCriterion,
  rankCriterionResults,
  summarizeCriterionRow,
  Stage1Response,
  Stage2Response,
} from '../services/n8nService';
import { useCriteriaOrder } from './useCriteriaOrder';

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

interface UseTwoStageComparisonParams {
  projectId: string;
  vendors: WorkflowVendor[];
  criteria: WorkflowCriteria[];
  techRequest: TechRequest;
  autoStart?: boolean; // Auto-start comparison on mount
}

interface UseTwoStageComparisonReturn {
  comparisonState: ComparisonState;
  isRunning: boolean;
  startComparison: () => void;
  pauseComparison: () => void;
  resumeComparison: () => void;
  retryCellStage1: (criterionId: string, vendorId: string) => Promise<void>;
  retryRowStage2: (criterionId: string) => Promise<void>;
  resetComparison: () => void;
}

const MAX_CONCURRENT_WORKFLOWS = 5;

export const useTwoStageComparison = ({
  projectId,
  vendors,
  criteria,
  techRequest,
  autoStart = false,
}: UseTwoStageComparisonParams): UseTwoStageComparisonReturn => {
  // ===========================================
  // State Management
  // ===========================================

  const [comparisonState, setComparisonState] = useState<ComparisonState>({
    criteria: {},
    activeWorkflows: 0,
    isPaused: false,
    currentCriterionIndex: 0,
    lastUpdated: new Date().toISOString(),
  });

  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);
  const activeWorkflowsRef = useRef(0);
  const comparisonStateRef = useRef(comparisonState); // Keep ref in sync with state
  const hasAutoStartedRef = useRef(false); // Track if autoStart has already been triggered

  // ✅ Use criteria ordering hook to respect manual sorting from builder
  const { getOrderedCriteria } = useCriteriaOrder(projectId);

  // Update ref whenever state changes
  useEffect(() => {
    comparisonStateRef.current = comparisonState;
  }, [comparisonState]);

  // ===========================================
  // Load Persisted State on Mount
  // ===========================================

  // Track if we've initialized to prevent re-initialization on vendor/criteria changes
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once per projectId
    if (initializedRef.current) {
      console.log('[useTwoStageComparison] Already initialized, skipping');
      return;
    }

    const savedState = loadComparisonState(projectId);
    const stage1Data = loadStage1Results(projectId);
    const stage2Data = loadStage2Results(projectId);

    if (savedState && stage1Data) {
      console.log('[useTwoStageComparison] Restoring from localStorage', {
        currentCriterionIndex: savedState.currentCriterionIndex,
        criteriaCount: Object.keys(savedState.criteria).length,
        stage1Criteria: Object.keys(stage1Data.results).length,
      });

      // Merge Stage 1 and Stage 2 data into state
      const mergedState: ComparisonState = {
        ...savedState,
        criteria: {},
      };

      // Rebuild criteria state from Stage 1 and Stage 2 data
      for (const criterion of criteria) {
        const stage1Row = stage1Data.results[criterion.id];
        const stage2Row = stage2Data?.results[criterion.id];

        mergedState.criteria[criterion.id] = {
          criterionId: criterion.id,
          stage1Complete: stage1Row ? Object.keys(stage1Row).length === vendors.length : false,
          stage2Status: stage2Row ? 'completed' : 'pending',
          cells: stage1Row || {},
          criterionInsight: stage2Row?.criterionInsight,
          starsAwarded: stage2Row?.starsAwarded,
        };

        // Initialize missing vendor cells as pending
        // This ensures all cells exist even if not yet saved to localStorage
        for (const vendor of vendors) {
          if (!mergedState.criteria[criterion.id].cells[vendor.id]) {
            mergedState.criteria[criterion.id].cells[vendor.id] = {
              status: 'pending',
            };
          }
        }

        // Apply Stage 2 updates to Stage 1 cells if available
        if (stage2Row?.vendorUpdates) {
          for (const [vendorId, updates] of Object.entries(stage2Row.vendorUpdates)) {
            if (mergedState.criteria[criterion.id].cells[vendorId]) {
              mergedState.criteria[criterion.id].cells[vendorId] = {
                ...mergedState.criteria[criterion.id].cells[vendorId],
                ...updates,
              };
            }
          }
        }

        // Apply summaries from Stage 2 storage (SP_025)
        if (stage2Row?.vendorSummaries) {
          for (const [vendorId, summary] of Object.entries(stage2Row.vendorSummaries)) {
            if (mergedState.criteria[criterion.id].cells[vendorId]) {
              mergedState.criteria[criterion.id].cells[vendorId].summary = summary;
            }
          }
        }
      }

      console.log('[useTwoStageComparison] Restored state:', {
        totalCells: Object.values(mergedState.criteria).reduce((sum, row) =>
          sum + Object.keys(row.cells).length, 0
        ),
        completedCells: Object.values(mergedState.criteria).reduce((sum, row) =>
          sum + Object.values(row.cells).filter(c => c.status === 'completed').length, 0
        ),
        failedCells: Object.values(mergedState.criteria).reduce((sum, row) =>
          sum + Object.values(row.cells).filter(c => c.status === 'failed').length, 0
        ),
        isPaused: mergedState.isPaused,
      });

      if (mergedState.isPaused) {
        console.log('[useTwoStageComparison] ⏸️  Comparison is PAUSED - will not auto-resume. Click Resume to continue.');
      }

      setComparisonState(mergedState);
    } else {
      console.log('[useTwoStageComparison] No saved state, initializing fresh');

      // Initialize fresh state
      const initialState: ComparisonState = {
        criteria: {},
        activeWorkflows: 0,
        isPaused: false,
        currentCriterionIndex: 0,
        lastUpdated: new Date().toISOString(),
      };

      for (const criterion of criteria) {
        initialState.criteria[criterion.id] = {
          criterionId: criterion.id,
          stage1Complete: false,
          stage2Status: 'pending',
          cells: {},
        };

        // Initialize all cells as pending
        for (const vendor of vendors) {
          initialState.criteria[criterion.id].cells[vendor.id] = {
            status: 'pending',
          };
        }
      }

      setComparisonState(initialState);
    }

    initializedRef.current = true;
  }, [projectId, vendors, criteria]);

  // Reset initialized flag when projectId changes
  useEffect(() => {
    initializedRef.current = false;
  }, [projectId]);

  // ===========================================
  // Persistence Removed - Now Handled in VendorComparisonNew.tsx
  // ===========================================
  // All localStorage saving is now centralized in the component layer
  // This hook focuses purely on business logic (orchestration, API calls)

  // ===========================================
  // Stage 1: Individual Vendor × Criterion Research
  // ===========================================

  const runStage1Cell = useCallback(async (
    criterionId: string,
    vendorId: string,
    criterion: WorkflowCriteria,
    vendor: WorkflowVendor
  ): Promise<void> => {
    // Mark cell as loading
    setComparisonState(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criterionId]: {
          ...prev.criteria[criterionId],
          cells: {
            ...prev.criteria[criterionId].cells,
            [vendorId]: {
              ...prev.criteria[criterionId].cells[vendorId],
              status: 'loading',
            },
          },
        },
      },
      lastUpdated: new Date().toISOString(),
    }));

    try {
      // Cell is already marked as loading in orchestrateComparison before this function is called
      // activeWorkflowsRef is already incremented there too

      const projectDescription = `${techRequest.companyContext || ''} ${techRequest.solutionRequirements || ''}`.trim();
      const validProjectDescription = projectDescription.length >= 10
        ? projectDescription
        : 'Software comparison for evaluating vendor capabilities';

      console.log('[Stage1] Starting research:', {
        vendor: vendor.name,
        criterion: criterion.name,
      });

      const response: Stage1Response = await compareVendorCriterion(
        projectId,
        techRequest.companyContext?.split('.')[0] || 'Project',
        validProjectDescription,
        criterion.type || 'software',
        {
          id: vendor.id,
          name: vendor.name,
          website: vendor.website,
        },
        {
          id: criterionId,
          name: criterion.name,
          importance: criterion.importance,
          description: criterion.explanation,
        }
      );

      // Check if the response was successful
      if (!response.success || !response.result) {
        throw new Error(response.error?.message || 'Stage 1 workflow failed');
      }

      // Use evidence_strength directly (already 'yes' | 'unknown' | 'no')
      const cellValue = response.result.evidence_strength as 'yes' | 'no' | 'unknown';

      // Update cell with results (store all Stage 1 fields)
      setComparisonState(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criterionId]: {
            ...prev.criteria[criterionId],
            cells: {
              ...prev.criteria[criterionId].cells,
              [vendorId]: {
                status: 'completed',
                value: cellValue,
                evidenceUrl: response.result!.evidence_url,
                evidenceDescription: response.result!.evidence_description,
                vendorSiteEvidence: response.result!.vendor_site_evidence,
                thirdPartyEvidence: response.result!.third_party_evidence,
                researchNotes: response.result!.research_notes,
                searchCount: response.result!.search_count,
                comment: response.result!.research_notes, // Backwards compatibility
                retryCount: (prev.criteria[criterionId].cells[vendorId]?.retryCount || 0),
              },
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      }));

      // Update ref immediately to prevent race condition in Stage 2 validation
      comparisonStateRef.current = {
        ...comparisonStateRef.current,
        criteria: {
          ...comparisonStateRef.current.criteria,
          [criterionId]: {
            ...comparisonStateRef.current.criteria[criterionId],
            cells: {
              ...comparisonStateRef.current.criteria[criterionId].cells,
              [vendorId]: {
                status: 'completed',
                value: cellValue,
                evidenceUrl: response.result!.evidence_url,
                evidenceDescription: response.result!.evidence_description,
                vendorSiteEvidence: response.result!.vendor_site_evidence,
                thirdPartyEvidence: response.result!.third_party_evidence,
                researchNotes: response.result!.research_notes,
                searchCount: response.result!.search_count,
                comment: response.result!.research_notes,
                retryCount: (comparisonStateRef.current.criteria[criterionId]?.cells[vendorId]?.retryCount || 0),
              },
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      };

      // Persist Stage 1 results
      const stage1Data: Stage1StorageData = {
        projectId,
        results: {},
        timestamp: new Date().toISOString(),
      };

      // Collect all Stage 1 cells from current state (before update)
      // Only save completed and failed cells - discard loading/pending
      for (const [cid, row] of Object.entries(comparisonState.criteria)) {
        stage1Data.results[cid] = {};

        for (const [vid, cell] of Object.entries(row.cells)) {
          if (cell.status === 'completed' || cell.status === 'failed') {
            stage1Data.results[cid][vid] = cell;
          }
        }
      }

      // Add the just-completed cell (this cell is fresh, not in comparisonState yet)
      if (!stage1Data.results[criterionId]) {
        stage1Data.results[criterionId] = {};
      }

      stage1Data.results[criterionId][vendorId] = {
        status: 'completed',
        value: cellValue,
        evidenceUrl: response.result!.evidence_url,
        evidenceDescription: response.result!.evidence_description,
        vendorSiteEvidence: response.result!.vendor_site_evidence,
        thirdPartyEvidence: response.result!.third_party_evidence,
        researchNotes: response.result!.research_notes,
        searchCount: response.result!.search_count,
        comment: response.result!.research_notes, // Backwards compatibility
        retryCount: comparisonState.criteria[criterionId]?.cells[vendorId]?.retryCount || 0,
      };

      // Save removed - now handled in VendorComparisonNew.tsx
      // saveStage1Results(stage1Data);

      console.log('[Stage1] Completed:', {
        vendor: vendor.name,
        criterion: criterion.name,
        evidenceStrength: response.result!.evidence_strength,
        cellValue,
      });
    } catch (error: any) {
      console.error('[Stage1] Error:', error);

      // Mark cell as failed
      setComparisonState(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criterionId]: {
            ...prev.criteria[criterionId],
            cells: {
              ...prev.criteria[criterionId].cells,
              [vendorId]: {
                ...prev.criteria[criterionId].cells[vendorId],
                status: 'failed',
                error: error.message || 'Stage 1 workflow failed',
                errorCode: error.code || 'UNKNOWN',
              },
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      }));

      // Update ref immediately to prevent race condition in Stage 2 validation
      comparisonStateRef.current = {
        ...comparisonStateRef.current,
        criteria: {
          ...comparisonStateRef.current.criteria,
          [criterionId]: {
            ...comparisonStateRef.current.criteria[criterionId],
            cells: {
              ...comparisonStateRef.current.criteria[criterionId].cells,
              [vendorId]: {
                status: 'failed',
                error: error.message || 'Stage 1 workflow failed',
                errorCode: error.code || 'UNKNOWN',
                retryCount: (comparisonStateRef.current.criteria[criterionId]?.cells[vendorId]?.retryCount || 0),
              },
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      };

      // Persist failed cell to Stage 1 results
      const stage1Data: Stage1StorageData = {
        projectId,
        results: {},
        timestamp: new Date().toISOString(),
      };

      // Collect all Stage 1 cells from current state
      for (const [cid, row] of Object.entries(comparisonState.criteria)) {
        stage1Data.results[cid] = {};

        for (const [vid, cell] of Object.entries(row.cells)) {
          if (cell.status === 'completed' || cell.status === 'failed') {
            stage1Data.results[cid][vid] = cell;
          }
        }
      }

      // Add the just-failed cell
      if (!stage1Data.results[criterionId]) {
        stage1Data.results[criterionId] = {};
      }

      stage1Data.results[criterionId][vendorId] = {
        status: 'failed',
        error: error.message || 'Stage 1 workflow failed',
        errorCode: error.code || 'UNKNOWN',
        retryCount: comparisonState.criteria[criterionId]?.cells[vendorId]?.retryCount || 0,
      };

      // Save removed - now handled in VendorComparisonNew.tsx
      // saveStage1Results(stage1Data);
    } finally {
      // Decrement active workflows
      activeWorkflowsRef.current--;
      console.log('[Stage1] Cell completed (success or error):', {
        vendor: vendor.name,
        criterion: criterion.name,
        activeWorkflows: activeWorkflowsRef.current
      });
      setComparisonState(prev => ({
        ...prev,
        activeWorkflows: activeWorkflowsRef.current,
      }));
    }
  }, [projectId, techRequest, comparisonState.criteria]);

  // ===========================================
  // Stage 2: Comparative Ranking
  // ===========================================

  const runStage2Row = useCallback(async (
    criterionId: string,
    criterion: WorkflowCriteria
  ): Promise<void> => {
    console.log('[Stage2] Starting ranking for criterion:', criterion.name);

    // Mark Stage 2 as loading
    setComparisonState(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criterionId]: {
          ...prev.criteria[criterionId],
          stage2Status: 'loading',
        },
      },
      lastUpdated: new Date().toISOString(),
    }));

    try {
      // Increment active workflows
      activeWorkflowsRef.current++;
      setComparisonState(prev => ({
        ...prev,
        activeWorkflows: activeWorkflowsRef.current,
      }));

      const projectDescription = `${techRequest.companyContext || ''} ${techRequest.solutionRequirements || ''}`.trim();
      const validProjectDescription = projectDescription.length >= 10
        ? projectDescription
        : 'Software comparison for evaluating vendor capabilities';

      // Collect Stage 1 results for this criterion
      // Use ref to get latest state (not stale closure value)
      const stage1Results = vendors.map(v => {
        const cell = comparisonStateRef.current.criteria[criterionId]?.cells[v.id];

        // Defensive check: Ensure cell exists and has required data
        if (!cell || !cell.value) {
          console.error('[Stage2] Cell missing or incomplete for vendor:', {
            vendorId: v.id,
            vendorName: v.name,
            criterionId,
            cellExists: !!cell,
            hasValue: cell?.value,
          });
          throw new Error(
            `Stage 2 triggered prematurely - cell data not ready for vendor ${v.name} (${v.id}). ` +
            `This indicates Stage 1 may not have completed successfully.`
          );
        }

        return {
          vendor_id: v.id,
          vendor_name: v.name,
          vendor_website: v.website,
          criterion_id: criterionId,
          evidence_strength: (cell.value === 'star' ? 'yes' : cell.value) as 'yes' | 'unknown' | 'no',
          evidence_url: cell.evidenceUrl || '',
          evidence_description: cell.evidenceDescription || '',
          vendor_site_evidence: cell.vendorSiteEvidence || cell.comment || '',
          third_party_evidence: cell.thirdPartyEvidence || '',
          research_notes: cell.researchNotes || cell.comment || '',
          search_count: cell.searchCount || 0,
        };
      });

      const response: Stage2Response = await rankCriterionResults(
        projectId,
        techRequest.companyContext?.split('.')[0] || 'Project',
        validProjectDescription,
        criterion.type || 'software',
        {
          id: criterionId,
          name: criterion.name,
          importance: criterion.importance,
          description: criterion.explanation,
        },
        stage1Results
      );

      // Check if the response was successful
      if (!response.success || !response.result) {
        throw new Error(response.error?.message || 'Stage 2 workflow failed');
      }

      // Update state with Stage 2 results
      setComparisonState(prev => {
        const updatedCells = { ...prev.criteria[criterionId].cells };

        // Apply vendor rankings from Stage 2 (smart evidence update)
        for (const ranking of response.result!.vendor_rankings) {
          if (updatedCells[ranking.vendor_id]) {
            const currentCell = updatedCells[ranking.vendor_id];

            updatedCells[ranking.vendor_id] = {
              ...currentCell,
              value: ranking.state, // Always update state (yes/star/no/unknown)

              // Only update evidence if Stage 2 provides better data
              evidenceUrl: ranking.evidence_url || currentCell.evidenceUrl,
              evidenceDescription: ranking.evidence_description || currentCell.evidenceDescription,

              // Preserve Stage 1 fields (Stage 2 doesn't overwrite these)
              vendorSiteEvidence: currentCell.vendorSiteEvidence,
              thirdPartyEvidence: currentCell.thirdPartyEvidence,
              researchNotes: currentCell.researchNotes,
              searchCount: currentCell.searchCount,

              // Merge comments if both exist, showing progression from Stage 1 → Stage 2
              comment: ranking.comment && currentCell.comment
                ? `${currentCell.comment}\n\n[Stage 2 Update] ${ranking.comment}`
                : ranking.comment || currentCell.comment,
            };
          }
        }

        return {
          ...prev,
          criteria: {
            ...prev.criteria,
            [criterionId]: {
              ...prev.criteria[criterionId],
              stage2Status: 'completed',
              cells: updatedCells,
              criterionInsight: response.result!.criterion_insight,
              starsAwarded: response.result!.stars_awarded,
            },
          },
          lastUpdated: new Date().toISOString(),
        };
      });

      // Persist Stage 2 results
      const stage2Data: Stage2StorageData = loadStage2Results(projectId) || {
        projectId,
        results: {},
        timestamp: new Date().toISOString(),
      };

      stage2Data.results[criterionId] = {
        criterionId,
        criterionInsight: response.result!.criterion_insight,
        starsAwarded: response.result!.stars_awarded,
        vendorUpdates: {},
      };

      for (const ranking of response.result!.vendor_rankings) {
        stage2Data.results[criterionId].vendorUpdates[ranking.vendor_id] = {
          value: ranking.state,
          evidenceUrl: ranking.evidence_url,
          evidenceDescription: ranking.evidence_description,
          comment: ranking.comment,
        };
      }

      stage2Data.timestamp = new Date().toISOString();

      // Save removed - now handled in VendorComparisonNew.tsx
      // saveStage2Results(stage2Data);

      console.log('[Stage2] Completed:', {
        criterion: criterion.name,
        starsAwarded: response.result!.stars_awarded,
      });

      // SP_025: Generate cell summaries after Stage 2 completion
      generateSummariesForRow(criterionId, criterion).catch(err => {
        console.error('[Summarization] Failed for criterion:', criterion.name, err);
        // Silently fail - summaries are enhancement only, don't block workflow
      });
    } catch (error: any) {
      console.error('[Stage2] Error:', error);

      // Mark Stage 2 as failed
      setComparisonState(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criterionId]: {
            ...prev.criteria[criterionId],
            stage2Status: 'failed',
            stage2Error: error.message || 'Stage 2 workflow failed',
          },
        },
        lastUpdated: new Date().toISOString(),
      }));
    } finally {
      // Decrement active workflows
      activeWorkflowsRef.current--;
      setComparisonState(prev => ({
        ...prev,
        activeWorkflows: activeWorkflowsRef.current,
      }));
    }
  }, [projectId, techRequest, vendors]); // Removed comparisonState.criteria - using ref instead

  // ===========================================
  // Helper: Get Criteria in Visual Order (Top to Bottom)
  // ===========================================

  /**
   * Get criteria in the same order as displayed in VerticalBarChart
   * This ensures orchestration processes criteria top-to-bottom, left-to-right
   */
  const getCriteriaInVisualOrder = useCallback((): WorkflowCriteria[] => {
    // Group criteria by category (type)
    const groups: Record<string, WorkflowCriteria[]> = {};

    criteria.forEach((criterion) => {
      const category = criterion.type || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(criterion);
    });

    // Apply manual ordering within each category
    Object.keys(groups).forEach((category) => {
      groups[category] = getOrderedCriteria(groups[category], category);
    });

    // Standard categories in display order (same as VerticalBarChart)
    const standardCategories = ['feature', 'technical', 'business', 'compliance'];

    // Custom categories (anything not in standard list)
    const customCategories = Object.keys(groups).filter(
      (cat) => !standardCategories.includes(cat.toLowerCase())
    );

    // Flatten in display order: Feature → Technical → Business → Compliance → Custom
    const orderedCriteria: WorkflowCriteria[] = [];
    [...standardCategories, ...customCategories].forEach((category) => {
      if (groups[category]) {
        orderedCriteria.push(...groups[category]);
      }
    });

    console.log('[getCriteriaInVisualOrder] Ordered criteria:', orderedCriteria.map(c => c.name));
    return orderedCriteria;
  }, [criteria, getOrderedCriteria]);

  // ===========================================
  // Main Orchestration Loop
  // ===========================================

  const orchestrateComparison = useCallback(async () => {
    console.log('[orchestrateComparison] Starting orchestration');

    // ✅ Get criteria in visual order (top-to-bottom as displayed)
    const orderedCriteria = getCriteriaInVisualOrder();
    console.log('[orchestrateComparison] Criteria (visual order):', orderedCriteria.length);
    console.log('[orchestrateComparison] Ref state criteria count:', Object.keys(comparisonStateRef.current.criteria).length);
    setIsRunning(true);
    abortRef.current = false;

    // Use ref to get latest state
    const currentState = comparisonStateRef.current;

    // Process criteria sequentially in visual order
    // ✅ Always start from 0 - the skip logic at line 669 handles completed criteria
    for (let i = 0; i < orderedCriteria.length; i++) {
      if (abortRef.current || comparisonStateRef.current.isPaused) {
        console.log('[useTwoStageComparison] Paused at criterion index:', i);
        setComparisonState(prev => ({ ...prev, currentCriterionIndex: i }));
        break;
      }

      const criterion = orderedCriteria[i];
      console.log('[orchestrateComparison] Processing criterion (visual order):', criterion.id, criterion.name);
      console.log('[orchestrateComparison] Available criteria in ref:', Object.keys(comparisonStateRef.current.criteria));
      const criterionRow = comparisonStateRef.current.criteria[criterion.id];

      // Skip if criterionRow doesn't exist (shouldn't happen, but defensive)
      if (!criterionRow) {
        console.warn('[useTwoStageComparison] Criterion row not found:', criterion.id);
        console.warn('[useTwoStageComparison] This likely means resetComparison used different criteria than orchestration');
        continue;
      }

      // Skip if Stage 1 already complete for this criterion
      if (criterionRow.stage1Complete && criterionRow.stage2Status === 'completed') {
        continue;
      }

      console.log('[useTwoStageComparison] Processing criterion:', criterion.name);

      // Run Stage 1 for all vendors in this criterion (with concurrency limit)
      // Store running promises to track completion
      const runningPromises: Map<string, Promise<void>> = new Map();

      for (const vendor of vendors) {
        // Always read from ref to get the latest cell status
        const latestCriterionRow = comparisonStateRef.current.criteria[criterion.id];
        const cell = latestCriterionRow?.cells[vendor.id];

        // Debug: Log if cell doesn't exist
        if (!cell) {
          console.warn('[orchestrateComparison] Cell not found for vendor:', {
            vendor: vendor.name,
            vendorId: vendor.id,
            criterion: criterion.name,
            availableCellIds: Object.keys(latestCriterionRow?.cells || {})
          });
        }

        // Skip if already completed or currently loading
        if (cell?.status === 'completed' || cell?.status === 'loading') {
          console.log('[orchestrateComparison] Skipping cell (already processed):', {
            vendor: vendor.name,
            criterion: criterion.name,
            status: cell.status
          });
          continue;
        }

        // Wait if we hit the concurrency limit
        console.log('[orchestrateComparison] Checking concurrency:', {
          active: activeWorkflowsRef.current,
          max: MAX_CONCURRENT_WORKFLOWS,
          vendor: vendor.name
        });

        while (activeWorkflowsRef.current >= MAX_CONCURRENT_WORKFLOWS) {
          console.log('[orchestrateComparison] Waiting for slot:', {
            active: activeWorkflowsRef.current,
            vendor: vendor.name
          });
          await new Promise(resolve => setTimeout(resolve, 100));

          if (abortRef.current || comparisonStateRef.current.isPaused) break;
        }

        if (abortRef.current || comparisonStateRef.current.isPaused) break;

        console.log('[orchestrateComparison] Starting cell:', {
          vendor: vendor.name,
          criterion: criterion.name,
          activeWorkflows: activeWorkflowsRef.current
        });

        // Mark cell as loading BEFORE starting the workflow
        // This prevents race condition where multiple cells start before any are marked loading
        setComparisonState(prev => ({
          ...prev,
          criteria: {
            ...prev.criteria,
            [criterion.id]: {
              ...prev.criteria[criterion.id],
              cells: {
                ...prev.criteria[criterion.id].cells,
                [vendor.id]: {
                  status: 'loading',
                },
              },
            },
          },
          activeWorkflows: activeWorkflowsRef.current + 1,
        }));

        // Increment active workflows BEFORE starting
        activeWorkflowsRef.current++;

        // Start the workflow (don't await immediately)
        const promise = runStage1Cell(criterion.id, vendor.id, criterion, vendor);
        runningPromises.set(vendor.id, promise);

        // Remove from running promises when complete
        promise.finally(() => {
          runningPromises.delete(vendor.id);
        });
      }

      // Wait for all Stage 1 workflows for this criterion to complete
      await Promise.all(Array.from(runningPromises.values()));

      // Mark Stage 1 as complete for this criterion
      setComparisonState(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criterion.id]: {
            ...prev.criteria[criterion.id],
            stage1Complete: true,
          },
        },
      }));

      // Validate all cells have data before triggering Stage 2
      const allCellsReady = vendors.every(v => {
        const cell = comparisonStateRef.current.criteria[criterion.id]?.cells[v.id];
        return cell && cell.value !== undefined;
      });

      // Trigger Stage 2 (runs in background)
      console.log('[orchestrateComparison] Stage 1 complete for criterion:', criterion.name, {
        aborted: abortRef.current,
        isPaused: comparisonStateRef.current.isPaused,
        allCellsReady,
        willTriggerStage2: !abortRef.current && !comparisonStateRef.current.isPaused && allCellsReady
      });

      if (!abortRef.current && !comparisonStateRef.current.isPaused && allCellsReady) {
        runStage2Row(criterion.id, criterion);
      } else if (!allCellsReady) {
        console.warn('[orchestrateComparison] Skipping Stage 2 - not all cells ready:', {
          criterion: criterion.name,
          vendors: vendors.map(v => ({
            id: v.id,
            name: v.name,
            hasCell: !!comparisonStateRef.current.criteria[criterion.id]?.cells[v.id],
            hasValue: !!comparisonStateRef.current.criteria[criterion.id]?.cells[v.id]?.value,
          }))
        });
      }
    }

    setIsRunning(false);
    console.log('[useTwoStageComparison] Orchestration complete');
  }, [getCriteriaInVisualOrder, vendors, runStage1Cell, runStage2Row]); // ✅ Using getCriteriaInVisualOrder for ordered processing

  // ===========================================
  // Public API
  // ===========================================

  const startComparison = useCallback(() => {
    setComparisonState(prev => ({ ...prev, isPaused: false }));
    // Update ref immediately to prevent race condition in orchestration
    comparisonStateRef.current = { ...comparisonStateRef.current, isPaused: false };
    orchestrateComparison();
  }, [orchestrateComparison]);

  const pauseComparison = useCallback(() => {
    abortRef.current = true;
    setComparisonState(prev => ({ ...prev, isPaused: true }));
    setIsRunning(false);
  }, []);

  const resumeComparison = useCallback(() => {
    setComparisonState(prev => ({ ...prev, isPaused: false }));
    // Update ref immediately to prevent race condition in orchestration
    comparisonStateRef.current = { ...comparisonStateRef.current, isPaused: false };
    orchestrateComparison();
  }, [orchestrateComparison]);

  const retryCellStage1 = useCallback(async (criterionId: string, vendorId: string) => {
    const criterion = criteria.find(c => c.id === criterionId);
    const vendor = vendors.find(v => v.id === vendorId);

    if (!criterion || !vendor) {
      console.error('[retryCellStage1] Criterion or vendor not found');
      return;
    }

    // Increment retry count
    setComparisonState(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criterionId]: {
          ...prev.criteria[criterionId],
          cells: {
            ...prev.criteria[criterionId].cells,
            [vendorId]: {
              ...prev.criteria[criterionId].cells[vendorId],
              retryCount: (prev.criteria[criterionId].cells[vendorId]?.retryCount || 0) + 1,
            },
          },
        },
      },
    }));

    await runStage1Cell(criterionId, vendorId, criterion, vendor);

    // If this was the last failed cell, re-run Stage 2
    // Use ref for consistency (not stale closure value)
    const allCellsComplete = vendors.every(v =>
      comparisonStateRef.current.criteria[criterionId]?.cells[v.id]?.status === 'completed'
    );

    if (allCellsComplete) {
      await runStage2Row(criterionId, criterion);
    }
  }, [criteria, vendors, runStage1Cell, runStage2Row]); // Removed comparisonState.criteria - using ref instead

  const retryRowStage2 = useCallback(async (criterionId: string) => {
    const criterion = criteria.find(c => c.id === criterionId);

    if (!criterion) {
      console.error('[retryRowStage2] Criterion not found');
      return;
    }

    await runStage2Row(criterionId, criterion);
  }, [criteria, runStage2Row]);

  const resetComparison = useCallback(() => {
    console.log('[resetComparison] Starting reset with', criteria.length, 'criteria');

    // Clear all localStorage data for this project
    clearAllComparisonData(projectId);
    console.log('[resetComparison] Cleared all localStorage data');

    // Reset state to initial
    const initialState: ComparisonState = {
      criteria: {},
      activeWorkflows: 0,
      isPaused: false,
      currentCriterionIndex: 0,
      lastUpdated: new Date().toISOString(),
    };

    for (const criterion of criteria) {
      console.log('[resetComparison] Initializing criterion:', criterion.id, criterion.name);
      initialState.criteria[criterion.id] = {
        criterionId: criterion.id,
        stage1Complete: false,
        stage2Status: 'pending',
        cells: {},
      };

      for (const vendor of vendors) {
        initialState.criteria[criterion.id].cells[vendor.id] = {
          status: 'pending',
        };
      }
    }

    console.log('[resetComparison] Initial state created with', Object.keys(initialState.criteria).length, 'criteria');

    setComparisonState(initialState);
    comparisonStateRef.current = initialState; // Update ref immediately

    console.log('[resetComparison] Ref updated, criteria count:', Object.keys(comparisonStateRef.current.criteria).length);

    // State update will trigger the save effect automatically
    // No need to manually save since the effect handles it

    setIsRunning(false);
    abortRef.current = false;
    activeWorkflowsRef.current = 0;
    hasAutoStartedRef.current = false; // Allow auto-start after reset
  }, [criteria, vendors, projectId]);

  // Auto-start on mount if enabled
  useEffect(() => {
    // Only start if criteria are initialized (not empty)
    const hasCriteria = Object.keys(comparisonState.criteria).length > 0;

    console.log('[autoStart] Effect triggered:', {
      autoStart,
      isRunning,
      isPaused: comparisonState.isPaused,
      hasCriteria,
      hasAutoStarted: hasAutoStartedRef.current,
      criteriaCount: Object.keys(comparisonState.criteria).length
    });

    // Only auto-start ONCE on mount when criteria are ready
    if (autoStart && !hasAutoStartedRef.current && !isRunning && !comparisonState.isPaused && hasCriteria) {
      console.log('[autoStart] Starting comparison with', Object.keys(comparisonState.criteria).length, 'criteria');
      hasAutoStartedRef.current = true; // Mark as auto-started to prevent infinite loop
      startComparison();
    } else if (autoStart && !hasCriteria) {
      console.log('[autoStart] Skipping - criteria not initialized yet');
    }
  }, [autoStart, isRunning, comparisonState.isPaused, comparisonState.criteria]); // ✅ Keep criteria to detect initialization, but use ref guard

  // ===========================================
  // SP_025: Generate Summaries After Stage 2
  // ===========================================

  /**
   * Generate 2-3 word summaries for all vendors in a criterion row
   * Called automatically after Stage 2 completes
   */
  const generateSummariesForRow = useCallback(async (
    criterionId: string,
    criterion: WorkflowCriteria
  ) => {
    console.log('[Summarization] Generating summaries for criterion:', criterion.name);

    try {
      // Get current row state
      const rowState = comparisonStateRef.current.criteria[criterionId];
      if (!rowState) {
        console.warn('[Summarization] Row not found:', criterionId);
        return;
      }

      // Build vendor data for summarization
      const vendorsData = vendors.map(v => ({
        vendor_id: v.id,
        vendor_name: v.name,
        match_status: (rowState.cells[v.id]?.value || 'unknown') as 'yes' | 'no' | 'unknown' | 'star',
        evidence_description: rowState.cells[v.id]?.evidenceDescription || '',
        research_notes: rowState.cells[v.id]?.researchNotes || '',
      }));

      // Call summarization service
      const response = await summarizeCriterionRow(
        projectId,
        criterionId,
        criterion.name,
        criterion.explanation,
        vendorsData
      );

      if (!response.success || !response.summaries) {
        console.warn('[Summarization] Failed or returned no summaries:', response.error);
        return;
      }

      console.log('[Summarization] Received summaries:', response.summaries);

      // Update state with summaries
      setComparisonState(prev => {
        const updatedCells = { ...prev.criteria[criterionId].cells };

        for (const [vendorId, summary] of Object.entries(response.summaries)) {
          if (updatedCells[vendorId]) {
            updatedCells[vendorId] = {
              ...updatedCells[vendorId],
              summary, // Add summary to cell state
            };
          }
        }

        return {
          ...prev,
          criteria: {
            ...prev.criteria,
            [criterionId]: {
              ...prev.criteria[criterionId],
              cells: updatedCells,
            },
          },
          lastUpdated: new Date().toISOString(),
        };
      });

      // Persist summaries to localStorage (Stage 2 storage)
      const stage2Data: Stage2StorageData = loadStage2Results(projectId) || {
        projectId,
        results: {},
        timestamp: new Date().toISOString(),
      };

      // Create Stage 2 result entry if it doesn't exist yet (timing issue with VendorComparisonNew.tsx save)
      if (!stage2Data.results[criterionId]) {
        stage2Data.results[criterionId] = {
          criterionId,
          criterionInsight: '',
          starsAwarded: 0,
          vendorUpdates: {},
          vendorSummaries: {},
        };
      }

      // Save summaries
      stage2Data.results[criterionId].vendorSummaries = response.summaries;
      stage2Data.timestamp = new Date().toISOString();

      // Save to localStorage
      saveStage2Results(stage2Data);
      console.log('[Summarization] Saved summaries to localStorage:', {
        criterionId,
        summaryCount: Object.keys(response.summaries).length,
      });

      console.log('[Summarization] Completed for criterion:', criterion.name);
    } catch (error) {
      console.error('[Summarization] Error:', error);
      // Don't throw - let caller handle silently
      throw error;
    }
  }, [projectId, vendors]);

  return {
    comparisonState,
    isRunning,
    startComparison,
    pauseComparison,
    resumeComparison,
    retryCellStage1,
    retryRowStage2,
    resetComparison,
    generateSummariesForRow, // SP_025: Export for Continue button to trigger summarization
    // Export projectId for persistence layer
    projectId,
  };
};
