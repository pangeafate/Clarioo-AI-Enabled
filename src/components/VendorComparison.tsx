/**
 * VendorComparison Component
 * Sprint: SP_015 (Revised) - Integrated into workflow
 *
 * Mobile-first vendor comparison screen with vertical bar chart
 * Layout: Horizontal vendor cards at top + vertical bar chart below
 *
 * Can be used in two modes:
 * 1. Standalone mode: Load from mockAIdata.json (for /comparison route)
 * 2. Workflow mode: Accept vendors/criteria from workflow (vendor-comparison step)
 *
 * Features:
 * - Progressive loading: Researches each vendor sequentially via n8n
 * - Score popup: Shows evidence URL and AI comment for each score
 * - Retry functionality: Failed vendors can be retried individually
 * - localStorage persistence: Compared vendors persist per project
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
import {
  compareVendor,
  ComparedVendor,
  VendorForComparison
} from '../services/n8nService';

// ===========================================
// Types for Progressive Loading
// ===========================================

type VendorComparisonStatus = 'pending' | 'loading' | 'completed' | 'failed';

interface VendorComparisonState {
  status: VendorComparisonStatus;
  comparedData?: ComparedVendor;
  error?: string;
}

// localStorage key prefix for compared vendors
const COMPARED_VENDORS_STORAGE_PREFIX = 'compared_vendors_';

interface VendorComparisonProps {
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

export const VendorComparison: React.FC<VendorComparisonProps> = ({
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
  // Progressive Loading State
  // ===========================================

  // Track comparison state for each vendor
  const [vendorComparisonStates, setVendorComparisonStates] = useState<Record<string, VendorComparisonState>>({});

  // Track if comparison has started
  const [comparisonStarted, setComparisonStarted] = useState(false);

  // Track if all comparisons are complete (for sorting)
  const [allComparisonsComplete, setAllComparisonsComplete] = useState(false);

  // Track if generation is currently in progress (for Stop Generation button)
  const [isGenerating, setIsGenerating] = useState(false);

  // Ref to signal abortion of generation
  const abortGenerationRef = useRef(false);

  // Score detail popup state
  const [selectedScoreDetail, setSelectedScoreDetail] = useState<{
    vendorName: string;
    criterionName: string;
    detail: CriterionScoreDetail;
  } | null>(null);

  // localStorage key for this project's compared vendors
  const comparedVendorsStorageKey = projectId ? `${COMPARED_VENDORS_STORAGE_PREFIX}${projectId}` : null;

  // ===========================================
  // Load persisted comparison data
  // ===========================================

  useEffect(() => {
    if (!comparedVendorsStorageKey || !isWorkflowMode) return;

    const stored = localStorage.getItem(comparedVendorsStorageKey);
    if (stored) {
      try {
        const parsedStates: Record<string, VendorComparisonState> = JSON.parse(stored);
        setVendorComparisonStates(parsedStates);

        // Check if all vendors have been compared
        if (workflowVendors) {
          const allComplete = workflowVendors.every(v =>
            parsedStates[v.id]?.status === 'completed' ||
            parsedStates[v.id]?.status === 'failed'
          );
          if (allComplete) {
            setComparisonStarted(true);
            setAllComparisonsComplete(true);
          }
        }
      } catch {
        console.error('[VendorComparison] Failed to parse stored comparison data');
      }
    }
  }, [comparedVendorsStorageKey, isWorkflowMode, workflowVendors]);

  // ===========================================
  // Save comparison data to localStorage
  // ===========================================

  useEffect(() => {
    if (!comparedVendorsStorageKey || !isWorkflowMode) return;
    if (Object.keys(vendorComparisonStates).length === 0) return;

    localStorage.setItem(comparedVendorsStorageKey, JSON.stringify(vendorComparisonStates));
  }, [vendorComparisonStates, comparedVendorsStorageKey, isWorkflowMode]);

  // ===========================================
  // Compare a single vendor via n8n
  // ===========================================

  const compareOneVendor = useCallback(async (vendor: WorkflowVendor) => {
    if (!techRequest || !workflowCriteria || !projectId) return;

    // Set vendor to loading state
    setVendorComparisonStates(prev => ({
      ...prev,
      [vendor.id]: { status: 'loading' }
    }));

    try {
      // Prepare vendor for comparison
      const vendorForComparison: VendorForComparison = {
        id: vendor.id,
        name: vendor.name,
        website: vendor.website,
        description: vendor.description || '',
        features: vendor.features || []
      };

      // Get project details from techRequest
      // Note: TechRequest has: category, description, companyInfo
      const projectName = techRequest.companyInfo?.substring(0, 50) || 'Vendor Evaluation';
      const projectDescription = techRequest.description || '';
      const projectCategory = techRequest.category || 'Software';

      // Call n8n workflow
      const response = await compareVendor(
        projectId,
        projectName,
        projectDescription,
        projectCategory,
        vendorForComparison,
        workflowCriteria.filter(c => !c.isArchived).map(c => ({
          id: c.id,
          name: c.name,
          explanation: c.explanation || '',
          importance: c.importance,
          type: c.type || 'other',
          isArchived: false
        }))
      );

      if (response.success && response.vendor) {
        setVendorComparisonStates(prev => ({
          ...prev,
          [vendor.id]: {
            status: 'completed',
            comparedData: response.vendor
          }
        }));
      } else {
        setVendorComparisonStates(prev => ({
          ...prev,
          [vendor.id]: {
            status: 'failed',
            error: response.error?.message || 'Comparison failed'
          }
        }));
      }
    } catch (error) {
      setVendorComparisonStates(prev => ({
        ...prev,
        [vendor.id]: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Comparison failed'
        }
      }));
    }
  }, [techRequest, workflowCriteria, projectId]);

  // ===========================================
  // Start progressive comparison
  // ===========================================

  const startComparison = useCallback(async () => {
    if (!workflowVendors || comparisonStarted) return;

    setComparisonStarted(true);
    setAllComparisonsComplete(false);
    setIsGenerating(true);
    abortGenerationRef.current = false;

    // Compare vendors sequentially
    for (const vendor of workflowVendors) {
      // Check if generation was stopped
      if (abortGenerationRef.current) {
        break;
      }

      // Skip if already completed
      if (vendorComparisonStates[vendor.id]?.status === 'completed') {
        continue;
      }

      await compareOneVendor(vendor);
    }

    setIsGenerating(false);
    setAllComparisonsComplete(true);
  }, [workflowVendors, comparisonStarted, vendorComparisonStates, compareOneVendor]);

  // ===========================================
  // Retry failed vendor
  // ===========================================

  const retryVendor = useCallback(async (vendorId: string) => {
    const vendor = workflowVendors?.find(v => v.id === vendorId);
    if (!vendor) return;

    await compareOneVendor(vendor);

    // Check if all are now complete
    if (workflowVendors) {
      const allComplete = workflowVendors.every(v => {
        const state = v.id === vendorId
          ? vendorComparisonStates[v.id]
          : vendorComparisonStates[v.id];
        return state?.status === 'completed' || state?.status === 'failed';
      });
      if (allComplete) {
        setAllComparisonsComplete(true);
      }
    }
  }, [workflowVendors, compareOneVendor, vendorComparisonStates]);

  // ===========================================
  // Auto-start comparison in workflow mode
  // ===========================================

  useEffect(() => {
    if (isWorkflowMode && workflowVendors && workflowVendors.length > 0 && !comparisonStarted) {
      // Check if we have any uncompleted vendors
      const hasUncompleted = workflowVendors.some(v =>
        !vendorComparisonStates[v.id] ||
        vendorComparisonStates[v.id]?.status === 'pending' ||
        vendorComparisonStates[v.id]?.status === 'failed'
      );

      if (hasUncompleted) {
        // Small delay to allow component to render
        const timer = setTimeout(() => {
          startComparison();
        }, 500);
        return () => clearTimeout(timer);
      } else {
        // All vendors already compared
        setComparisonStarted(true);
        setAllComparisonsComplete(true);
      }
    }
  }, [isWorkflowMode, workflowVendors, comparisonStarted, vendorComparisonStates, startComparison]);

  // Standalone mode now returns empty - all data should come from n8n workflow
  const standaloneCriteria: Criterion[] = useMemo(() => {
    return [];
  }, []);

  const standaloneShortlist: ComparisonVendor[] = useMemo(() => {
    return [];
  }, []);

  // Convert workflow vendors to ComparisonVendor format
  // Uses compared data when available, falls back to basic vendor info
  const workflowShortlist: ComparisonVendor[] = useMemo(() => {
    if (!workflowVendors) return [];

    let vendors = workflowVendors.map((v, index) => {
      const comparisonState = vendorComparisonStates[v.id];
      const comparedData = comparisonState?.comparedData;

      // If we have compared data, use it
      if (comparedData) {
        return {
          id: v.id,
          name: comparedData.name,
          logo: `https://logo.clearbit.com/${comparedData.website.replace(/^https?:\/\//, '')}`,
          website: comparedData.website,
          killerFeature: comparedData.killerFeature,
          executiveSummary: comparedData.executiveSummary,
          keyFeatures: comparedData.keyFeatures,
          matchPercentage: comparedData.matchPercentage,
          scores: new Map(Object.entries(comparedData.scores)),
          scoreDetails: comparedData.scoreDetails,
          color: VENDOR_COLOR_PALETTE[index % VENDOR_COLOR_PALETTE.length],
          // Additional state info for UI
          comparisonStatus: comparisonState.status,
        };
      }

      // Use basic vendor info (pending/loading/failed state)
      const scores = v.criteriaScores || {};
      return {
        id: v.id,
        name: v.name,
        logo: `https://logo.clearbit.com/${v.website.replace(/^https?:\/\//, '')}`,
        website: v.website,
        killerFeature: v.description || '',
        executiveSummary: v.description || '',
        keyFeatures: v.features || [],
        matchPercentage: Math.round((v.rating / 5) * 100),
        scores: new Map(Object.entries(scores)),
        color: VENDOR_COLOR_PALETTE[index % VENDOR_COLOR_PALETTE.length],
        // Additional state info for UI
        comparisonStatus: comparisonState?.status || 'pending',
        comparisonError: comparisonState?.error,
      };
    });

    // Sort by matchPercentage after all comparisons complete
    if (allComparisonsComplete) {
      vendors = [...vendors].sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    return vendors;
  }, [workflowVendors, vendorComparisonStates, allComparisonsComplete]);

  // Convert workflow criteria to Criterion format
  const workflowCriteriaFormatted: Criterion[] = useMemo(() => {
    if (!workflowCriteria) return [];

    // Filter out archived criteria
    return workflowCriteria
      .filter(c => !c.isArchived)
      .map(c => ({
        id: c.id,
        name: c.name,
        description: c.explanation || '',
        importance: c.importance,
        type: c.type || 'other',
      }));
  }, [workflowCriteria]);

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
      // Clear all comparison states
      setVendorComparisonStates({});
      setComparisonStarted(false);
      setAllComparisonsComplete(false);
      abortGenerationRef.current = false;

      // Re-trigger comparison after a small delay to allow state to clear
      setTimeout(() => {
        if (workflowVendors && workflowVendors.length > 0) {
          setComparisonStarted(true);
          setAllComparisonsComplete(false);
          setIsGenerating(true);

          // Compare vendors sequentially
          (async () => {
            for (const vendor of workflowVendors) {
              // Check if generation was stopped
              if (abortGenerationRef.current) {
                break;
              }
              await compareOneVendor(vendor);
            }
            setIsGenerating(false);
            setAllComparisonsComplete(true);
          })();
        }
      }, 100);
    };

    window.addEventListener('regenerateComparison', handleRegenerateComparison);
    return () => {
      window.removeEventListener('regenerateComparison', handleRegenerateComparison);
    };
  }, [workflowVendors, compareOneVendor]);

  // Listen for custom event to stop generation
  useEffect(() => {
    const handleStopGeneration = () => {
      abortGenerationRef.current = true;
      setIsGenerating(false);
      // Mark all loading vendors as having their current state preserved
      // The loop will break on next iteration
    };

    window.addEventListener('stopComparisonGeneration', handleStopGeneration);
    return () => {
      window.removeEventListener('stopComparisonGeneration', handleStopGeneration);
    };
  }, []);

  // Broadcast generation status to parent
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('comparisonGenerationStatus', {
      detail: { isGenerating }
    }));
  }, [isGenerating]);

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
          criteria={workflowCriteria || standaloneCriteria.map(c => ({
            id: c.id,
            name: c.name,
            explanation: c.description,
            importance: c.importance,
            type: c.type,
            isArchived: false
          }))}
          projectId={projectId || 'comparison'}
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
