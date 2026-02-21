/**
 * VendorComparisonNew Component
 * Sprint: SP_019 - Two-Stage Progressive Comparison with Original UI
 *
 * Implements the new two-stage workflow system while preserving 100% of the original UI:
 * - Stage 1: Individual vendor × criterion research (parallel, max 5 concurrent)
 * - Stage 2: Comparative ranking with star allocation (per criterion, after all Stage 1 complete)
 *
 * UI preserved from original VendorComparison.tsx:
 * - Same vendor cards, bar charts, score popups, retry buttons
 * - Same mobile/desktop layouts
 * - Same match percentage calculation
 * - Same executive summary integration
 *
 * New backend behavior:
 * - Process criteria sequentially (criterion-by-criterion)
 * - Within each criterion, vendors process in parallel (up to 5 concurrent)
 * - Stage 2 triggers when all Stage 1 complete for a criterion
 * - Both stages persist to separate localStorage keys
 * - Individual cell-level retry for Stage 1
 * - Row-level retry button for Stage 2
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, ArrowRight, X, ExternalLink } from 'lucide-react';
import { ComparisonVendor, VENDOR_COLOR_PALETTE, CriterionScoreDetail } from '../types/comparison.types';
import { Criterion } from '../types';
import { CellValidation, loadCellValidation, saveCellValidation, DEFAULT_VALIDATION } from '../types/validation.types';
import { VendorCard } from './vendor-comparison/VendorCard';
import { VerticalBarChart } from './vendor-comparison/VerticalBarChart';
import { ShareDialog } from './vendor-discovery/ShareDialog';
import { ExecutiveSummaryDialog } from './vendor-comparison/ExecutiveSummaryDialog';
import { VendorComparisonGuidePopup } from './vendor-comparison/VendorComparisonGuidePopup';
import { VendorBattlecardsMatrix } from './vendor-battlecards/VendorBattlecardsMatrix';
import { Button } from './ui/button';
import { TechRequest, Vendor as WorkflowVendor, Criteria as WorkflowCriteria } from './VendorDiscovery';
import { TYPOGRAPHY } from '../styles/typography-config';
import { useTwoStageComparison } from '../hooks/useTwoStageComparison';
import { useVendorTransformation, useCriteriaTransformation } from '../hooks/useVendorTransformation';
import { calculateMatchPercentage } from '../utils/vendorComparison';
import {
  saveComparisonState,
  saveStage1Results,
  saveStage2Results,
  loadStage2Results,
} from '../utils/comparisonStorage';
import type { Stage1StorageData, Stage2StorageData } from '../types/vendorComparison.types';
import {
  generateExecutiveSummary,
  getExecutiveSummaryFromStorage,
  clearExecutiveSummaryFromStorage,
  ExecutiveSummaryData,
  ComparedVendor,
  generateVendorSummaries,
  getVendorSummaryFromStorage,
  VendorSummaryData
} from '../services/n8nService';

// ===========================================
// Types for Progressive Loading (Compatibility)
// ===========================================

type VendorComparisonStatus = 'pending' | 'loading' | 'completed' | 'failed';

interface VendorComparisonState {
  status: VendorComparisonStatus;
  comparedData?: ComparedVendor;
  error?: string;
  errorCode?: string;
}

interface VendorComparisonNewProps {
  // Standalone mode props
  projectId?: string;
  className?: string;

  // Workflow mode props
  vendors?: WorkflowVendor[];
  criteria?: WorkflowCriteria[];
  techRequest?: TechRequest;
  onComplete?: () => void;
  onVendorsGenerated?: (vendors: WorkflowVendor[]) => void;
  shortlistedVendorIds?: string[];
  onShortlistChange?: (shortlistedIds: string[]) => void;
}

export const VendorComparisonNew: React.FC<VendorComparisonNewProps> = ({
  projectId,
  className = '',
  vendors: workflowVendors,
  criteria: workflowCriteria,
  techRequest,
  onComplete,
  onVendorsGenerated,
  shortlistedVendorIds: externalShortlistedIds,
  onShortlistChange,
}) => {
  // Determine if we're in workflow mode or standalone mode
  const isWorkflowMode = !!workflowVendors && !!workflowCriteria;

  // ===========================================
  // Two-Stage Orchestration Hook
  // ===========================================

  const {
    comparisonState,
    isRunning,
    startComparison,
    pauseComparison,
    resumeComparison,
    retryCellStage1,
    retryRowStage2,
    resetComparison,
    generateSummariesForRow, // SP_025: For Continue button to trigger summarization
    projectId: hookProjectId,
  } = useTwoStageComparison({
    projectId: projectId || '',
    vendors: workflowVendors || [],
    criteria: workflowCriteria || [],
    techRequest: techRequest || {} as TechRequest,
    autoStart: false, // ✅ Disabled - only manual buttons trigger comparison
  });

  // ===========================================
  // Vendor Summaries State (Must be declared before useMemo)
  // ===========================================

  const [vendorSummaries, setVendorSummaries] = useState<Map<string, VendorSummaryData>>(new Map());
  const [isGeneratingVendorSummaries, setIsGeneratingVendorSummaries] = useState(false);
  const hasGeneratedSummaries = useRef(false);

  // ===========================================
  // Centralized Persistence (All localStorage Saves)
  // ===========================================

  useEffect(() => {
    if (!hookProjectId) return;

    // Build Stage 1 data from comparisonState
    const stage1Data: Stage1StorageData = {
      projectId: hookProjectId,
      results: {},
      timestamp: new Date().toISOString(),
    };

    // Build Stage 2 data from comparisonState
    // Load existing Stage 2 data to preserve summaries (SP_025)
    const existingStage2Data = loadStage2Results(hookProjectId);
    const stage2Data: Stage2StorageData = existingStage2Data || {
      projectId: hookProjectId,
      results: {},
      timestamp: new Date().toISOString(),
    };

    // Extract Stage 1 results (individual cell data)
    for (const [criterionId, row] of Object.entries(comparisonState.criteria)) {
      stage1Data.results[criterionId] = {};

      for (const [vendorId, cell] of Object.entries(row.cells)) {
        if (cell.status === 'completed' || cell.status === 'failed') {
          stage1Data.results[criterionId][vendorId] = {
            status: cell.status,
            value: cell.value,
            evidenceUrl: cell.evidenceUrl,
            evidenceDescription: cell.evidenceDescription,
            comment: cell.comment,
            error: cell.error,
            errorCode: cell.errorCode,
            retryCount: cell.retryCount,
          };
        }
      }
    }

    // Extract Stage 2 results (criterion-level insights and rankings)
    for (const [criterionId, row] of Object.entries(comparisonState.criteria)) {
      if (row.stage2Status === 'completed' && row.criterionInsight && row.starsAwarded) {
        // Preserve existing vendorSummaries if they exist (SP_025)
        const existingSummaries = stage2Data.results[criterionId]?.vendorSummaries;

        stage2Data.results[criterionId] = {
          criterionId,
          criterionInsight: row.criterionInsight,
          starsAwarded: row.starsAwarded,
          vendorUpdates: {},
          vendorSummaries: existingSummaries, // Preserve summaries
        };

        // Include vendor-level updates from Stage 2
        for (const [vendorId, cell] of Object.entries(row.cells)) {
          if (cell.value) {
            stage2Data.results[criterionId].vendorUpdates[vendorId] = {
              value: cell.value,
              evidenceUrl: cell.evidenceUrl,
              evidenceDescription: cell.evidenceDescription,
              comment: cell.comment,
            };
          }
        }
      }
    }

    // Update timestamp before saving
    stage2Data.timestamp = new Date().toISOString();

    // Save all three data structures to localStorage
    // This is the ONLY place where comparison data is saved
    saveComparisonState(hookProjectId, comparisonState);
    saveStage1Results(stage1Data);
    saveStage2Results(stage2Data);

    // Count summaries for logging
    const summaryCount = Object.values(stage2Data.results).reduce((count, result) => {
      return count + (result.vendorSummaries ? Object.keys(result.vendorSummaries).length : 0);
    }, 0);

    console.log('[VendorComparisonNew] 💾 Saved all comparison data:', {
      projectId: hookProjectId,
      criteriaCount: Object.keys(comparisonState.criteria).length,
      isPaused: comparisonState.isPaused,
      stage1Criteria: Object.keys(stage1Data.results).length,
      stage2Criteria: Object.keys(stage2Data.results).length,
      summariesSaved: summaryCount,
    });
  }, [comparisonState, hookProjectId]);

  // ===========================================
  // Map comparisonState to vendorComparisonStates format
  // ===========================================

  // Build vendorComparisonStates from comparisonState for compatibility with UI components
  const vendorComparisonStates: Record<string, VendorComparisonState> = useMemo(() => {
    if (!workflowVendors || !workflowCriteria) return {};

    const states: Record<string, VendorComparisonState> = {};

    for (const vendor of workflowVendors) {
      // Collect scores from comparison state
      const scores: Record<string, 'yes' | 'no' | 'unknown' | 'star'> = {};
      const scoreDetails: Record<string, CriterionScoreDetail> = {};

      let hasFailedCells = false;
      let hasLoadingCells = false;
      let allCellsComplete = true;

      for (const criterion of workflowCriteria) {
        const cell = comparisonState.criteria[criterion.id]?.cells[vendor.id];

        if (cell?.status === 'failed') {
          hasFailedCells = true;
          allCellsComplete = false;
        } else if (cell?.status === 'loading') {
          hasLoadingCells = true;
          allCellsComplete = false;
        } else if (cell?.status === 'pending') {
          allCellsComplete = false;
        }

        if (cell?.value) {
          scores[criterion.id] = cell.value;
          scoreDetails[criterion.id] = {
            state: cell.value,
            evidence: cell.evidenceUrl || '',
            comment: cell.comment || '',
          };
        }
      }

      // Calculate match percentage (uses shared utility)
      const criteriaForCalc = workflowCriteria
        .filter(c => !c.isArchived)
        .map(c => ({
          id: c.id,
          importance: c.importance,
          type: c.type || 'other',
        }));

      const matchPercentage = calculateMatchPercentage(scores, criteriaForCalc, vendor.name);

      // Determine status
      const status: VendorComparisonStatus =
        hasFailedCells ? 'failed' :
        hasLoadingCells ? 'loading' :
        allCellsComplete ? 'completed' : 'pending';

      // Get vendor summary from generated summaries (if available)
      const vendorSummary = vendor?.name ? vendorSummaries.get(vendor.name) : undefined;

      // Build ComparedVendor data structure
      const comparedData: ComparedVendor = {
        id: vendor.id,
        name: vendor.name,
        website: vendor.website,
        description: vendor.description || '',
        matchPercentage,
        scores,
        scoreDetails,
        // ✅ Use generated vendor summaries from Perplexity workflow
        killerFeature: vendorSummary?.killerFeature,
        keyFeatures: vendorSummary?.keyFeatures || [],
        executiveSummary: vendorSummary?.executiveSummary,
      };

      states[vendor.id] = {
        status,
        comparedData,
        error: hasFailedCells ? 'Some criteria failed to load' : undefined,
        errorCode: hasFailedCells ? 'CELL_FAILED' : undefined,
      };
    }

    return states;
  }, [workflowVendors, workflowCriteria, comparisonState, vendorSummaries.size]);

  // Track if comparison has started
  const comparisonStarted = useMemo(() => {
    return Object.values(comparisonState.criteria).some(row =>
      Object.values(row.cells).some(cell => cell.status !== 'pending')
    );
  }, [comparisonState]);

  // Track if all comparisons are complete
  const allComparisonsComplete = useMemo(() => {
    if (!workflowVendors || !workflowCriteria) return false;

    return workflowVendors.every(vendor => {
      const state = vendorComparisonStates[vendor.id];
      return state?.status === 'completed' || state?.status === 'failed';
    });
  }, [workflowVendors, vendorComparisonStates]);

  // ===========================================
  // Retry functionality (maps to new hook)
  // ===========================================

  const retryVendor = useCallback(async (vendorId: string) => {
    // Retry all failed cells for this vendor
    for (const criterion of workflowCriteria || []) {
      const cell = comparisonState.criteria[criterion.id]?.cells[vendorId];
      if (cell?.status === 'failed') {
        await retryCellStage1(criterion.id, vendorId);
      }
    }
  }, [workflowCriteria, comparisonState, retryCellStage1]);

  // Score detail popup state
  const [selectedScoreDetail, setSelectedScoreDetail] = useState<{
    vendorName: string;
    criterionName: string;
    vendorId: string;
    criterionId: string;
    detail: CriterionScoreDetail;
  } | null>(null);

  // Validation state for the currently selected cell
  const [currentValidation, setCurrentValidation] = useState<CellValidation>(DEFAULT_VALIDATION);

  // Key to force re-render of matrix when validation changes
  const [validationKey, setValidationKey] = useState(0);

  // Load validation state when modal opens
  useEffect(() => {
    if (selectedScoreDetail && projectId) {
      const validation = loadCellValidation(
        projectId,
        selectedScoreDetail.vendorId,
        selectedScoreDetail.criterionId
      );
      setCurrentValidation(validation);
    }
  }, [selectedScoreDetail, projectId]);

  // Standalone mode now returns empty - all data should come from n8n workflow
  const standaloneCriteria: Criterion[] = useMemo(() => {
    return [];
  }, []);

  const standaloneShortlist: ComparisonVendor[] = useMemo(() => {
    return [];
  }, []);

  // Convert workflow vendors to ComparisonVendor format using shared hook
  // Uses compared data when available, falls back to basic vendor info
  const workflowShortlist = useVendorTransformation(
    workflowVendors,
    workflowCriteria,
    vendorComparisonStates,
    allComparisonsComplete
  );

  // Convert workflow criteria to Criterion format using shared hook
  const workflowCriteriaFormatted = useCriteriaTransformation(workflowCriteria);

  // Use workflow data if available, otherwise use standalone data
  const criteria = isWorkflowMode ? workflowCriteriaFormatted : standaloneCriteria;
  const shortlist = isWorkflowMode ? workflowShortlist : standaloneShortlist;

  // === SHORTLIST STATE ===
  // Use external state in workflow mode, local state in standalone mode
  const [localShortlistedIds, setLocalShortlistedIds] = useState<Set<string>>(new Set());

  // In workflow mode, use external state; in standalone mode, use local state
  const shortlistedVendorIds = isWorkflowMode && externalShortlistedIds
    ? new Set(externalShortlistedIds)
    : localShortlistedIds;

  // === SHARE DIALOG STATE ===
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // === EXECUTIVE SUMMARY DIALOG STATE ===
  const [isExecutiveSummaryOpen, setIsExecutiveSummaryOpen] = useState(false);
  const [executiveSummaryData, setExecutiveSummaryData] = useState<ExecutiveSummaryData | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Load executive summary from localStorage on mount
  useEffect(() => {
    if (hookProjectId) {
      try {
        // Use n8nService getter to handle unwrapping
        const data = getExecutiveSummaryFromStorage(hookProjectId);
        if (data) {
          setExecutiveSummaryData(data);
          console.log('[VendorComparisonNew] Loaded executive summary from localStorage:', data);
        }
      } catch (error) {
        console.error('[VendorComparisonNew] Error loading executive summary:', error);
      }
    }
  }, [hookProjectId]);

  // Check if comparison has incomplete data (needed before auto-generating)
  const hasIncompleteData = useMemo(() => {
    if (!workflowVendors || !workflowCriteria) return false;

    // Check vendor-level status
    for (const vendor of workflowVendors) {
      const state = vendorComparisonStates[vendor.id];
      if (state?.status === 'loading' || state?.status === 'pending') {
        return true;
      }
    }

    // Check cell-level status
    for (const criterion of workflowCriteria.filter(c => !c.isArchived)) {
      for (const vendor of workflowVendors) {
        const cell = comparisonState.criteria[criterion.id]?.cells[vendor.id];
        if (cell?.status === 'loading' || cell?.status === 'pending') {
          return true;
        }
      }
    }

    return false;
  }, [workflowVendors, workflowCriteria, vendorComparisonStates, comparisonState]);

  // Track if we've checked cache for this project
  const [cacheChecked, setCacheChecked] = useState(false);

  // === VENDOR COMPARISON GUIDE POPUP STATE ===
  const [isGuidePopupOpen, setIsGuidePopupOpen] = useState(false);

  // Load cached executive summary when dialog opens
  // IMPORTANT: Only load cache if data is complete (hasIncompleteData = false)
  // If data is incomplete, we should show the warning instead of cached data
  useEffect(() => {
    if (isExecutiveSummaryOpen && projectId && !cacheChecked) {
      // Check completeness FIRST before loading cache
      if (!hasIncompleteData) {
        const cached = getExecutiveSummaryFromStorage(projectId);
        if (cached) {
          setExecutiveSummaryData(cached);
        }
      }
      setCacheChecked(true);
    }
  }, [isExecutiveSummaryOpen, projectId, cacheChecked, hasIncompleteData]);

  // Reset cache check when project changes
  useEffect(() => {
    setCacheChecked(false);
  }, [projectId]);

  // Clear executive summary cache when workflow vendors change
  // This ensures the summary reflects the current vendor list
  const vendorIdsRef = useRef<string[]>([]);
  useEffect(() => {
    if (!workflowVendors || !projectId) return;

    const currentVendorIds = workflowVendors.map(v => v.id).sort().join(',');
    const previousVendorIds = vendorIdsRef.current.sort().join(',');

    if (previousVendorIds && currentVendorIds !== previousVendorIds) {
      // Vendor list changed - clear cached executive summary and vendor summaries
      clearExecutiveSummaryFromStorage(projectId);
      setExecutiveSummaryData(null);
      setCacheChecked(false);
      hasGeneratedSummaries.current = false;
      setVendorSummaries(new Map());
    }

    vendorIdsRef.current = workflowVendors.map(v => v.id);
  }, [workflowVendors, projectId]);

  // ===========================================
  // Vendor Summaries Generation
  // ===========================================

  // Load cached vendor summaries on mount
  useEffect(() => {
    if (!projectId || !workflowVendors) return;

    const cachedSummaries = new Map<string, VendorSummaryData>();
    workflowVendors.forEach(vendor => {
      const cached = getVendorSummaryFromStorage(projectId, vendor.name);
      if (cached) {
        cachedSummaries.set(vendor.name, cached);
      }
    });

    if (cachedSummaries.size > 0) {
      console.log('[VendorComparisonNew] Loaded', cachedSummaries.size, 'cached vendor summaries');
      setVendorSummaries(cachedSummaries);
      hasGeneratedSummaries.current = true;
    } else {
      // First time visit - no cached vendor summaries
      // Show the guide popup to explain the comparison process
      console.log('[VendorComparisonNew] First time visit detected - showing guide popup');
      setIsGuidePopupOpen(true);
    }
  }, [projectId, workflowVendors]);

  // Listen for custom event from info button to reopen guide popup
  useEffect(() => {
    const handleOpenGuide = () => {
      console.log('[VendorComparisonNew] Info button clicked - opening guide popup');
      setIsGuidePopupOpen(true);
    };

    window.addEventListener('openComparisonGuide', handleOpenGuide);
    return () => window.removeEventListener('openComparisonGuide', handleOpenGuide);
  }, []);

  // Generate vendor summaries automatically on page load
  useEffect(() => {
    if (!projectId || !workflowVendors || !techRequest) return;
    if (hasGeneratedSummaries.current) return;
    if (isGeneratingVendorSummaries) return;

    const generateSummaries = async () => {
      console.log('[VendorComparisonNew] Starting vendor summary generation on page load');
      setIsGeneratingVendorSummaries(true);

      try {
        const vendorsToGenerate = workflowVendors.map(v => ({
          name: v.name,
          website: v.website
        }));

        const projectContext = `${techRequest.title}\n${techRequest.description || ''}`;

        const summaries = await generateVendorSummaries(
          vendorsToGenerate,
          projectId,
          projectContext,
          3 // Max 3 concurrent requests
        );

        setVendorSummaries(summaries);
        hasGeneratedSummaries.current = true;
        console.log('[VendorComparisonNew] Generated summaries for', summaries.size, 'vendors');
      } catch (error) {
        console.error('[VendorComparisonNew] Failed to generate vendor summaries:', error);
        // Don't block the UI - summaries are optional
      } finally {
        setIsGeneratingVendorSummaries(false);
      }
    };

    generateSummaries();
  }, [projectId, workflowVendors, techRequest, isGeneratingVendorSummaries]);

  // Generate executive summary handler
  const handleGenerateExecutiveSummary = useCallback(async () => {
    if (!projectId || !workflowCriteria || !techRequest) {
      setSummaryError('Missing project data');
      return;
    }

    // Get criteria for match percentage calculation
    const criteriaForCalc = workflowCriteria
      .filter(c => !c.isArchived)
      .map(c => ({
        id: c.id,
        importance: c.importance,
        type: c.type || 'other'
      }));

    // Get compared vendors - include vendors with ANY data (not just completed)
    // Update matchPercentage with client-side calculated value
    const comparedVendors: ComparedVendor[] = [];

    if (workflowVendors) {
      for (const vendor of workflowVendors) {
        const state = vendorComparisonStates[vendor.id];

        // Include vendors that have at least some comparison data
        if (state?.comparedData) {
          // Calculate match percentage client-side
          const calculatedMatchPercentage = calculateMatchPercentage(
            state.comparedData.scores,
            criteriaForCalc,
            vendor.name // Pass vendor name for debugging
          );

          // Create a copy with the calculated match percentage
          comparedVendors.push({
            ...state.comparedData,
            matchPercentage: calculatedMatchPercentage
          });
        }
      }
    }

    if (comparedVendors.length === 0) {
      setSummaryError('No vendor data available. Please start the comparison first.');
      return;
    }

    setIsGeneratingSummary(true);
    setSummaryError(null);

    try {
      const projectName = techRequest.companyInfo?.substring(0, 50) || 'Vendor Evaluation';
      const projectDescription = techRequest.description || '';

      const result = await generateExecutiveSummary(
        projectId,
        projectName,
        projectDescription,
        workflowCriteria.filter(c => !c.isArchived).map(c => ({
          id: c.id,
          name: c.name,
          explanation: c.explanation || '',
          importance: c.importance,
          type: c.type || 'other',
          isArchived: false
        })),
        comparedVendors
      );

      // ✅ Override AI-calculated matchScore with client-calculated matchPercentage
      // This ensures executive summary uses the same percentages as vendor cards
      const syncedResult = {
        ...result,
        vendorRecommendations: result.vendorRecommendations.map(pick => {
          // Find the corresponding vendor's client-calculated percentage
          const vendor = comparedVendors.find(v => v.name === pick.name);
          return {
            ...pick,
            matchPercentage: vendor?.matchPercentage ?? pick.matchPercentage
          };
        })
      };

      setExecutiveSummaryData(syncedResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate summary';
      setSummaryError(message);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [projectId, workflowCriteria, techRequest, vendorComparisonStates, workflowVendors]);

  // Regenerate executive summary handler
  const handleRegenerateExecutiveSummary = useCallback(async () => {
    if (projectId) {
      clearExecutiveSummaryFromStorage(projectId);
      setExecutiveSummaryData(null);
    }
    await handleGenerateExecutiveSummary();
  }, [projectId, handleGenerateExecutiveSummary]);

  // Listen for custom event from parent VendorDiscovery to open Executive Summary
  useEffect(() => {
    const handleOpenExecutiveSummary = () => {
      setIsExecutiveSummaryOpen(true);
    };

    window.addEventListener('openExecutiveSummary', handleOpenExecutiveSummary);
    return () => {
      window.removeEventListener('openExecutiveSummary', handleOpenExecutiveSummary);
    };
  }, []);

  // Listen for custom event from parent VendorDiscovery to regenerate comparison
  useEffect(() => {
    const handleRegenerateComparison = () => {
      resetComparison();

      // Clear executive summary cache when regenerating comparison
      if (projectId) {
        clearExecutiveSummaryFromStorage(projectId);
        setExecutiveSummaryData(null);
        setCacheChecked(false);
      }

      // Start comparison after a small delay to allow state to update
      setTimeout(() => {
        startComparison();
      }, 100);
    };

    window.addEventListener('regenerateComparison', handleRegenerateComparison);
    return () => {
      window.removeEventListener('regenerateComparison', handleRegenerateComparison);
    };
  }, [resetComparison, startComparison, projectId]);

  // Listen for custom event from parent VendorDiscovery to continue comparison
  // Continue populates only pending cells, keeping completed/failed cells intact
  // SP_025: Also triggers summarization for rows missing summaries
  useEffect(() => {
    const handleContinueComparison = async () => {
      // SP_025: Check for missing summaries in completed Stage 2 rows
      const criteriaToSummarize: Array<{ id: string; name: string; explanation: string }> = [];

      for (const [criterionId, row] of Object.entries(comparisonState.criteria)) {
        // Check if Stage 2 is complete
        if (row.stage2Status === 'completed') {
          // Check if any cells are missing summaries
          const hasMissingSummaries = Object.values(row.cells).some(cell => {
            // Only check YES/STAR matches (NO/UNKNOWN don't get summaries)
            return (cell.value === 'yes' || cell.value === 'star') && !cell.summary;
          });

          if (hasMissingSummaries) {
            // Find the criterion details
            const criterion = (workflowCriteria || []).find(c => c.id === criterionId);
            if (criterion) {
              criteriaToSummarize.push({
                id: criterionId,
                name: criterion.name,
                explanation: criterion.explanation,
              });
            }
          }
        }
      }

      // Trigger summarization for rows with missing summaries
      if (criteriaToSummarize.length > 0) {
        console.log('[Continue] Found rows with missing summaries:', criteriaToSummarize.length);

        for (const criterion of criteriaToSummarize) {
          try {
            console.log('[Continue] Generating summaries for:', criterion.name);
            await generateSummariesForRow(criterion.id, criterion as any);
          } catch (error) {
            console.error('[Continue] Failed to generate summaries for:', criterion.name, error);
            // Continue with other rows even if one fails
          }
        }

        console.log('[Continue] Completed summarization for all missing rows');
      }

      // Don't reset - just start/resume comparison which will skip completed/failed cells
      if (comparisonState.isPaused) {
        resumeComparison();
      } else {
        startComparison();
      }
    };

    window.addEventListener('continueComparison', handleContinueComparison);
    return () => {
      window.removeEventListener('continueComparison', handleContinueComparison);
    };
  }, [startComparison, resumeComparison, comparisonState, generateSummariesForRow, workflowCriteria]);

  // Listen for custom event to stop generation
  useEffect(() => {
    const handleStopGeneration = () => {
      pauseComparison();
    };

    window.addEventListener('stopComparisonGeneration', handleStopGeneration);
    return () => {
      window.removeEventListener('stopComparisonGeneration', handleStopGeneration);
    };
  }, [pauseComparison]);

  // Broadcast generation status to parent
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('comparisonGenerationStatus', {
      detail: { isGenerating: isRunning }
    }));
  }, [isRunning]);

  const toggleShortlist = (vendorId: string) => {
    const newSet = new Set(shortlistedVendorIds);
    if (newSet.has(vendorId)) {
      newSet.delete(vendorId);
    } else {
      newSet.add(vendorId);
    }

    // In workflow mode, call external callback; in standalone mode, update local state
    if (isWorkflowMode && onShortlistChange) {
      onShortlistChange(Array.from(newSet));
    } else {
      setLocalShortlistedIds(newSet);
    }
  };

  // Handle score click to show evidence popup
  const handleScoreClick = (vendorId: string, criterionId: string, vendorName: string, criterionName: string) => {
    // Find the vendor and its score details
    const vendor = shortlist.find(v => v.id === vendorId);
    if (!vendor || !vendor.scoreDetails) return;

    const detail = vendor.scoreDetails[criterionId];
    if (!detail) return;

    setSelectedScoreDetail({
      vendorName,
      criterionName,
      vendorId,
      criterionId,
      detail
    });
  };

  // Handle validation toggle changes
  const handleValidationToggle = (field: 'system' | 'vendorValidation' | 'buyerValidation' | 'expertValidation') => {
    if (!selectedScoreDetail || !projectId) return;

    let newValidation = { ...currentValidation };

    if (field === 'system') {
      // When toggling system ON, turn off other validations
      newValidation.system = !newValidation.system;
      if (newValidation.system) {
        newValidation.vendorValidation = false;
        newValidation.buyerValidation = false;
        newValidation.expertValidation = false;
      }
    } else {
      // When toggling vendor/buyer/expert validation, turn off system if it's on
      if (currentValidation.system) {
        newValidation.system = false;
      }
      newValidation[field] = !newValidation[field];
    }

    // Save to localStorage
    saveCellValidation(
      projectId,
      selectedScoreDetail.vendorId,
      selectedScoreDetail.criterionId,
      newValidation
    );

    // Update state
    setCurrentValidation(newValidation);

    // Force matrix re-render to show/hide badges
    setValidationKey(prev => prev + 1);
  };

  // === MOBILE STATE (3 vendor carousels) ===
  const [vendor1Index, setVendor1Index] = useState(0);
  const [vendor2Index, setVendor2Index] = useState(Math.min(1, shortlist.length - 1));
  const [vendor3Index, setVendor3Index] = useState(Math.min(2, shortlist.length - 1));

  // === DESKTOP STATE (5 columns with screen pagination) ===
  const [desktopScreen, setDesktopScreen] = useState(0); // Current screen (0, 1, 2, ...)
  const [desktopColumnIndices, setDesktopColumnIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [expandedColumnIndex, setExpandedColumnIndex] = useState<number | null>(null);

  // Calculate total screens for desktop (5 vendors per screen)
  const totalDesktopScreens = Math.ceil(shortlist.length / 5) || 1;
  const isFirstScreen = desktopScreen === 0;
  const isLastScreen = desktopScreen === totalDesktopScreens - 1;

  // Get vendors for current desktop screen
  const getDesktopVendors = (): (ComparisonVendor | null)[] => {
    const startIdx = desktopScreen * 5;
    const vendors: (ComparisonVendor | null)[] = [];

    for (let i = 0; i < 5; i++) {
      const actualIndex = desktopColumnIndices[i];
      if (actualIndex !== undefined && actualIndex < shortlist.length) {
        vendors.push(shortlist[actualIndex]);
      } else {
        vendors.push(null); // Placeholder
      }
    }

    return vendors;
  };

  // Update column indices when screen changes
  const handleDesktopScreenChange = (direction: 'next' | 'previous') => {
    const newScreen = direction === 'next' ? desktopScreen + 1 : desktopScreen - 1;
    if (newScreen >= 0 && newScreen < totalDesktopScreens) {
      setDesktopScreen(newScreen);
      const startIdx = newScreen * 5;
      setDesktopColumnIndices([
        startIdx,
        startIdx + 1,
        startIdx + 2,
        startIdx + 3,
        startIdx + 4,
      ]);
      setExpandedColumnIndex(null); // Close any expanded card
    }
  };

  // Handle individual column navigation (cycle through all vendors)
  const handleDesktopColumnNavigate = (columnIndex: number, direction: 'next' | 'previous') => {
    setDesktopColumnIndices(prev => {
      const newIndices = [...prev];
      const currentIdx = newIndices[columnIndex];

      if (direction === 'next') {
        newIndices[columnIndex] = (currentIdx + 1) % shortlist.length;
      } else {
        newIndices[columnIndex] = currentIdx === 0 ? shortlist.length - 1 : currentIdx - 1;
      }

      return newIndices;
    });
  };

  // Handle column expansion (only one at a time)
  const handleColumnToggleExpand = (columnIndex: number) => {
    setExpandedColumnIndex(prev => prev === columnIndex ? null : columnIndex);
  };

  // Current mobile vendors (with round-robin allocation)
  const vendor1 = shortlist[vendor1Index] ?? null;
  const vendor2 = shortlist[vendor2Index] ?? null;
  const vendor3 = shortlist[vendor3Index] ?? null;

  // Mobile navigation handlers
  const handleVendor1Navigate = (direction: 'next' | 'previous') => {
    setVendor1Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % shortlist.length;
      } else {
        return prev === 0 ? shortlist.length - 1 : prev - 1;
      }
    });
  };

  const handleVendor2Navigate = (direction: 'next' | 'previous') => {
    setVendor2Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % shortlist.length;
      } else {
        return prev === 0 ? shortlist.length - 1 : prev - 1;
      }
    });
  };

  const handleVendor3Navigate = (direction: 'next' | 'previous') => {
    setVendor3Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % shortlist.length;
      } else {
        return prev === 0 ? shortlist.length - 1 : prev - 1;
      }
    });
  };

  // Placeholder for Add Vendor dialog
  const handleAddVendor = () => {
    // TODO: Open Add Vendor dialog from VendorSelection
    console.log('Add Vendor clicked');
  };

  // Get desktop vendors for display
  const desktopVendors = getDesktopVendors();

  if (shortlist.length === 0) {
    return (
      <div className={`vendor-comparison-container flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="text-center px-6 py-12">
          <h3 className="text-lg font-medium text-gray-900">No vendors to compare</h3>
          <p className="mt-2 text-sm text-gray-500">
            Please select vendors in the previous step.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`vendor-comparison-container bg-gray-50 min-h-screen ${className}`}>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* === MOBILE LAYOUT (< 1024px) === */}
        <div className="lg:hidden">
          {/* Vendor Cards - Stacked Vertically */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 mb-6"
          >
            {/* Vendor 1 Card */}
            {vendor1 && (
              <VendorCard
                vendor={vendor1}
                currentIndex={vendor1Index}
                totalVendors={shortlist.length}
                onNavigate={handleVendor1Navigate}
                isShortlisted={shortlistedVendorIds.has(vendor1.id)}
                onToggleShortlist={toggleShortlist}
                onRetryVendor={retryVendor}
                isLoadingSummary={isGeneratingVendorSummaries && !vendor1.executiveSummary && !vendor1.killerFeature}
              />
            )}

            {/* Vendor 2 Card (only show if 2+ vendors) */}
            {shortlist.length >= 2 && vendor2 && (
              <VendorCard
                vendor={vendor2}
                currentIndex={vendor2Index}
                totalVendors={shortlist.length}
                onNavigate={handleVendor2Navigate}
                isShortlisted={shortlistedVendorIds.has(vendor2.id)}
                onToggleShortlist={toggleShortlist}
                onRetryVendor={retryVendor}
                isLoadingSummary={isGeneratingVendorSummaries && !vendor2.executiveSummary && !vendor2.killerFeature}
              />
            )}

            {/* Vendor 3 Card (only show if 3+ vendors) */}
            {shortlist.length >= 3 && vendor3 && (
              <VendorCard
                vendor={vendor3}
                currentIndex={vendor3Index}
                totalVendors={shortlist.length}
                onNavigate={handleVendor3Navigate}
                isShortlisted={shortlistedVendorIds.has(vendor3.id)}
                onToggleShortlist={toggleShortlist}
                onRetryVendor={retryVendor}
                isLoadingSummary={isGeneratingVendorSummaries && !vendor3.executiveSummary && !vendor3.killerFeature}
              />
            )}
          </motion.div>

          {/* Vertical Bar Chart - Mobile (3 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <VerticalBarChart
              key={validationKey}
              vendors={[vendor1, vendor2, vendor3].filter(Boolean)}
              criteria={criteria}
              projectId={projectId}
              onScoreClick={handleScoreClick}
              onRetryVendor={retryVendor}
              comparisonState={comparisonState}
              isGeneratingVendorSummaries={isGeneratingVendorSummaries}
            />
          </motion.div>
        </div>

        {/* === DESKTOP LAYOUT (≥ 1024px) === */}
        <div className="hidden lg:block">
          {/* Vertical Bar Chart - Desktop (5 columns) with integrated column headers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <VerticalBarChart
              key={validationKey}
              vendors={desktopVendors}
              criteria={criteria}
              projectId={projectId}
              columnCount={5}
              desktopVendors={desktopVendors}
              desktopColumnIndices={desktopColumnIndices}
              expandedColumnIndex={expandedColumnIndex}
              onColumnNavigate={handleDesktopColumnNavigate}
              onColumnToggleExpand={handleColumnToggleExpand}
              onAddVendor={handleAddVendor}
              totalVendors={shortlist.length}
              isFirstScreen={isFirstScreen}
              isLastScreen={isLastScreen}
              onScreenChange={handleDesktopScreenChange}
              shortlistedVendorIds={shortlistedVendorIds}
              onToggleShortlist={toggleShortlist}
              onScoreClick={handleScoreClick}
              onRetryVendor={retryVendor}
              comparisonState={comparisonState}
              isGeneratingVendorSummaries={isGeneratingVendorSummaries}
            />
          </motion.div>
        </div>

        {/* ========================================= */}
        {/* VENDOR BATTLECARDS SECTION (SP_023)      */}
        {/* ========================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-16 border-t-2 border-gray-200 pt-8"
        >
          <VendorBattlecardsMatrix
            projectId={projectId}
            workflowVendors={workflowVendors}
            comparisonVendors={workflowShortlist}
            criteria={workflowCriteria}
            techRequest={techRequest}
            shortlistedVendorIds={shortlistedVendorIds}
            onToggleShortlist={toggleShortlist}
            onRetryVendor={retryVendor}
            isGeneratingVendorSummaries={isGeneratingVendorSummaries}
          />
        </motion.div>

        {/* Download or Share Button */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsShareDialogOpen(true)}
            className={`${TYPOGRAPHY.button.default} gap-2 min-w-[240px]`}
          >
            <Share2 className="h-4 w-4" />
            Download or Share
          </Button>

          {/* Continue to Invite Button - only show in workflow mode */}
          {isWorkflowMode && onComplete && (
            <Button
              onClick={onComplete}
              className={`${TYPOGRAPHY.button.default} gap-2 min-w-[240px]`}
            >
              Continue to Invite
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Share Dialog */}
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          criteria={workflowCriteria || standaloneCriteria.map(c => ({
            id: c.id,
            name: c.name,
            explanation: c.description,
            importance: c.importance,
            type: c.type,
            isArchived: false
          }))}
          projectId={projectId || 'comparison'}
          title="Download or Share"
          description="Download the comparison results or share via link"
          downloadButtonText="Download Comparison Results"
          downloadDescription="Download as Excel file (.xlsx)"
        />

        {/* Executive Summary Dialog */}
        <ExecutiveSummaryDialog
          isOpen={isExecutiveSummaryOpen}
          onClose={() => setIsExecutiveSummaryOpen(false)}
          onOpenChat={() => {
            // TODO: Integrate slide-in chat panel
            console.log('Open chat panel');
          }}
          onRegenerate={handleRegenerateExecutiveSummary}
          criteria={workflowCriteria || standaloneCriteria.map(c => ({
            id: c.id,
            name: c.name,
            explanation: c.description,
            importance: c.importance,
            type: c.type,
            isArchived: false
          }))}
          projectId={projectId || 'comparison'}
          summaryData={executiveSummaryData}
          isLoading={isGeneratingSummary}
          error={summaryError}
          onGenerate={handleGenerateExecutiveSummary}
          cacheChecked={cacheChecked}
          hasIncompleteData={hasIncompleteData}
        />

        {/* Vendor Comparison Guide Popup */}
        <VendorComparisonGuidePopup
          isOpen={isGuidePopupOpen}
          onClose={() => setIsGuidePopupOpen(false)}
        />

        {/* Score Detail Popup */}
        <AnimatePresence>
          {selectedScoreDetail && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedScoreDetail(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedScoreDetail.vendorName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedScoreDetail.criterionName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedScoreDetail(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Score state badge */}
                <div className="mb-4">
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${selectedScoreDetail.detail.state === 'star' ? 'bg-yellow-100 text-yellow-800' :
                      selectedScoreDetail.detail.state === 'yes' ? 'bg-green-100 text-green-800' :
                      selectedScoreDetail.detail.state === 'no' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'}
                  `}>
                    {selectedScoreDetail.detail.state === 'star' ? 'Exceptional' :
                     selectedScoreDetail.detail.state === 'yes' ? 'Meets Criteria' :
                     selectedScoreDetail.detail.state === 'no' ? 'Does Not Meet' :
                     'Unknown'}
                  </span>
                </div>

                {/* AI Comment */}
                <div className="mb-4">
                  <p className="text-sm text-gray-700">
                    {selectedScoreDetail.detail.comment || 'No additional information available.'}
                  </p>
                </div>

                {/* Validation Toggles */}
                <div className="mb-4 border-t border-gray-200 pt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Validation Status</p>
                  <div className="space-y-2">
                    {/* System Toggle */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">
                        System Validated
                      </span>
                      <button
                        onClick={() => handleValidationToggle('system')}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${currentValidation.system ? 'bg-gray-600' : 'bg-gray-300'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${currentValidation.system ? 'translate-x-5' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </label>

                    {/* Vendor Validation Toggle */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 text-white rounded-full text-xs font-bold">
                          V
                        </span>
                        Vendor Validated
                      </span>
                      <button
                        onClick={() => handleValidationToggle('vendorValidation')}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${currentValidation.vendorValidation ? 'bg-green-600' : 'bg-gray-300'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${currentValidation.vendorValidation ? 'translate-x-5' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </label>

                    {/* Buyer Validation Toggle */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full text-xs font-bold">
                          B
                        </span>
                        Buyer Validated
                      </span>
                      <button
                        onClick={() => handleValidationToggle('buyerValidation')}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${currentValidation.buyerValidation ? 'bg-blue-600' : 'bg-gray-300'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${currentValidation.buyerValidation ? 'translate-x-5' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </label>

                    {/* Expert Validation Toggle */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-orange-500 text-white rounded-full text-xs font-bold">
                          E
                        </span>
                        Expert Validated
                      </span>
                      <button
                        onClick={() => handleValidationToggle('expertValidation')}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${currentValidation.expertValidation ? 'bg-orange-600' : 'bg-gray-300'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${currentValidation.expertValidation ? 'translate-x-5' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </label>
                  </div>
                </div>

                {/* Evidence Link */}
                {selectedScoreDetail.detail.evidence && (
                  <a
                    href={selectedScoreDetail.detail.evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Evidence
                  </a>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
