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
  saveStage1Results,
  loadStage2Results,
  saveStage2Results,
  loadComparisonState,
  saveComparisonState,
  clearAllComparisonData,
} from '../utils/comparisonStorage';
import {
  compareVendorCriterion,
  rankCriterionResults,
  Stage1Response,
  Stage2Response,
} from '../services/n8nService';

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

  // Update ref whenever state changes
  useEffect(() => {
    comparisonStateRef.current = comparisonState;
  }, [comparisonState]);

  // ===========================================
  // Load Persisted State on Mount
  // ===========================================

  useEffect(() => {
    const savedState = loadComparisonState(projectId);
    const stage1Data = loadStage1Results(projectId);
    const stage2Data = loadStage2Results(projectId);

    if (savedState && stage1Data) {
      console.log('[useTwoStageComparison] Restoring from localStorage', {
        currentCriterionIndex: savedState.currentCriterionIndex,
        criteriaCount: Object.keys(savedState.criteria).length,
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
      }

      setComparisonState(mergedState);
    } else {
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
  }, [projectId, vendors, criteria]);

  // ===========================================
  // Persist State to localStorage
  // ===========================================

  useEffect(() => {
    if (Object.keys(comparisonState.criteria).length === 0) return;

    saveComparisonState(projectId, comparisonState);
  }, [comparisonState, projectId]);

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

      // Map evidence_strength to cell value
      const mapEvidenceToValue = (strength: string): 'yes' | 'no' | 'unknown' | 'star' => {
        switch (strength) {
          case 'confirmed':
            return 'yes';
          case 'not_found':
            return 'no';
          default:
            return 'unknown';
        }
      };

      const cellValue = mapEvidenceToValue(response.result.evidence_strength);

      // Update cell with results
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
                comment: response.result!.research_notes,
                retryCount: (prev.criteria[criterionId].cells[vendorId]?.retryCount || 0),
              },
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      }));

      // Persist Stage 1 results
      const stage1Data: Stage1StorageData = {
        projectId,
        results: {},
        timestamp: new Date().toISOString(),
      };

      // Collect all Stage 1 cells
      for (const [cid, row] of Object.entries(comparisonState.criteria)) {
        stage1Data.results[cid] = row.cells;
      }

      // Update with latest cell
      stage1Data.results[criterionId] = {
        ...stage1Data.results[criterionId],
        [vendorId]: {
          status: 'completed',
          value: cellValue,
          evidenceUrl: response.result!.evidence_url,
          evidenceDescription: response.result!.evidence_description,
          comment: response.result!.research_notes,
        },
      };

      saveStage1Results(stage1Data);

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
      const stage1Results = vendors.map(v => {
        const cell = comparisonState.criteria[criterionId].cells[v.id];
        return {
          vendor_id: v.id,
          vendor_name: v.name,
          vendor_website: v.website,
          criterion_id: criterionId,
          evidence_strength: cell.value === 'yes' ? 'confirmed' as const :
                           cell.value === 'no' ? 'not_found' as const :
                           'unclear' as const,
          evidence_url: cell.evidenceUrl || '',
          evidence_description: cell.evidenceDescription || '',
          vendor_site_evidence: cell.comment || '',
          third_party_evidence: '',
          research_notes: cell.comment || '',
          search_count: 0,
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

        // Apply vendor rankings from Stage 2
        for (const ranking of response.result!.vendor_rankings) {
          if (updatedCells[ranking.vendor_id]) {
            updatedCells[ranking.vendor_id] = {
              ...updatedCells[ranking.vendor_id],
              value: ranking.state,
              evidenceUrl: ranking.evidence_url,
              evidenceDescription: ranking.evidence_description,
              comment: ranking.comment,
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
      saveStage2Results(stage2Data);

      console.log('[Stage2] Completed:', {
        criterion: criterion.name,
        starsAwarded: response.result!.stars_awarded,
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
  }, [projectId, techRequest, vendors, comparisonState.criteria]);

  // ===========================================
  // Main Orchestration Loop
  // ===========================================

  const orchestrateComparison = useCallback(async () => {
    console.log('[orchestrateComparison] Starting orchestration');
    console.log('[orchestrateComparison] Criteria from params:', criteria.length);
    console.log('[orchestrateComparison] Ref state criteria count:', Object.keys(comparisonStateRef.current.criteria).length);
    setIsRunning(true);
    abortRef.current = false;

    // Use ref to get latest state
    const currentState = comparisonStateRef.current;

    // Process criteria sequentially
    for (let i = currentState.currentCriterionIndex; i < criteria.length; i++) {
      if (abortRef.current || comparisonStateRef.current.isPaused) {
        console.log('[useTwoStageComparison] Paused at criterion index:', i);
        setComparisonState(prev => ({ ...prev, currentCriterionIndex: i }));
        break;
      }

      const criterion = criteria[i];
      console.log('[orchestrateComparison] Looking for criterion:', criterion.id, criterion.name);
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

      // Trigger Stage 2 (runs in background)
      if (!abortRef.current && !comparisonState.isPaused) {
        runStage2Row(criterion.id, criterion);
      }
    }

    setIsRunning(false);
    console.log('[useTwoStageComparison] Orchestration complete');
  }, [criteria, vendors, runStage1Cell, runStage2Row]); // Removed comparisonState - using ref instead

  // ===========================================
  // Public API
  // ===========================================

  const startComparison = useCallback(() => {
    setComparisonState(prev => ({ ...prev, isPaused: false }));
    orchestrateComparison();
  }, [orchestrateComparison]);

  const pauseComparison = useCallback(() => {
    abortRef.current = true;
    setComparisonState(prev => ({ ...prev, isPaused: true }));
    setIsRunning(false);
  }, []);

  const resumeComparison = useCallback(() => {
    setComparisonState(prev => ({ ...prev, isPaused: false }));
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
    const allCellsComplete = vendors.every(v =>
      comparisonState.criteria[criterionId].cells[v.id].status === 'completed'
    );

    if (allCellsComplete) {
      await runStage2Row(criterionId, criterion);
    }
  }, [criteria, vendors, runStage1Cell, runStage2Row, comparisonState.criteria]);

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

    setIsRunning(false);
    abortRef.current = false;
    activeWorkflowsRef.current = 0;
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
      criteriaCount: Object.keys(comparisonState.criteria).length
    });

    if (autoStart && !isRunning && !comparisonState.isPaused && hasCriteria) {
      console.log('[autoStart] Starting comparison with', Object.keys(comparisonState.criteria).length, 'criteria');
      startComparison();
    } else if (autoStart && !hasCriteria) {
      console.log('[autoStart] Skipping - criteria not initialized yet');
    }
  }, [autoStart, comparisonState.criteria]); // Re-run when criteria are initialized

  return {
    comparisonState,
    isRunning,
    startComparison,
    pauseComparison,
    resumeComparison,
    retryCellStage1,
    retryRowStage2,
    resetComparison,
  };
};
