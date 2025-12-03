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
import { VendorCard } from './vendor-comparison/VendorCard';
import { VerticalBarChart } from './vendor-comparison/VerticalBarChart';
import { ShareDialog } from './vendor-discovery/ShareDialog';
import { ExecutiveSummaryDialog } from './vendor-comparison/ExecutiveSummaryDialog';
import { Button } from './ui/button';
import { TechRequest, Vendor as WorkflowVendor, Criteria as WorkflowCriteria } from './VendorDiscovery';
import { TYPOGRAPHY } from '../styles/typography-config';
import { useTwoStageComparison } from '../hooks/useTwoStageComparison';
import { useVendorTransformation, useCriteriaTransformation } from '../hooks/useVendorTransformation';
import { calculateMatchPercentage } from '../utils/vendorComparison';
import {
  generateExecutiveSummary,
  getExecutiveSummaryFromStorage,
  clearExecutiveSummaryFromStorage,
  ExecutiveSummaryData,
  ComparedVendor
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
  } = useTwoStageComparison({
    projectId: projectId || '',
    vendors: workflowVendors || [],
    criteria: workflowCriteria || [],
    techRequest: techRequest || {} as TechRequest,
    autoStart: true, // Auto-start comparison on mount
  });

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

      // Build ComparedVendor data structure
      const comparedData: ComparedVendor = {
        id: vendor.id,
        name: vendor.name,
        website: vendor.website,
        description: vendor.description || '',
        matchPercentage,
        scores,
        scoreDetails,
        // These fields may not be available in two-stage mode yet, but we keep them for compatibility
        killerFeature: undefined,
        keyFeatures: [],
        executiveSummary: undefined,
      };

      states[vendor.id] = {
        status,
        comparedData,
        error: hasFailedCells ? 'Some criteria failed to load' : undefined,
        errorCode: hasFailedCells ? 'CELL_FAILED' : undefined,
      };
    }

    return states;
  }, [workflowVendors, workflowCriteria, comparisonState]);

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
    detail: CriterionScoreDetail;
  } | null>(null);

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

  // Track if we've checked cache for this project
  const [cacheChecked, setCacheChecked] = useState(false);

  // Load cached executive summary when dialog opens
  useEffect(() => {
    if (isExecutiveSummaryOpen && projectId && !cacheChecked) {
      const cached = getExecutiveSummaryFromStorage(projectId);
      if (cached) {
        setExecutiveSummaryData(cached);
      }
      setCacheChecked(true);
    }
  }, [isExecutiveSummaryOpen, projectId, cacheChecked]);

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
      // Vendor list changed - clear cached executive summary
      clearExecutiveSummaryFromStorage(projectId);
      setExecutiveSummaryData(null);
      setCacheChecked(false);
    }

    vendorIdsRef.current = workflowVendors.map(v => v.id);
  }, [workflowVendors, projectId]);

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

    // Get compared vendors - only include vendors that are in the current workflow
    // Update matchPercentage with client-side calculated value
    const comparedVendors: ComparedVendor[] = [];
    if (workflowVendors) {
      for (const vendor of workflowVendors) {
        const state = vendorComparisonStates[vendor.id];
        if (state?.status === 'completed' && state.comparedData) {
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
      setSummaryError('No compared vendors available. Please wait for comparison to complete.');
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

      setExecutiveSummaryData(result);
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
      // Start comparison after a small delay to allow state to update
      setTimeout(() => {
        startComparison();
      }, 100);
    };

    window.addEventListener('regenerateComparison', handleRegenerateComparison);
    return () => {
      window.removeEventListener('regenerateComparison', handleRegenerateComparison);
    };
  }, [resetComparison, startComparison]);

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
      detail
    });
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
              vendors={[vendor1, vendor2, vendor3].filter(Boolean)}
              criteria={criteria}
              onScoreClick={handleScoreClick}
              onRetryVendor={retryVendor}
              comparisonState={comparisonState}
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
              vendors={desktopVendors}
              criteria={criteria}
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
            />
          </motion.div>
        </div>

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
