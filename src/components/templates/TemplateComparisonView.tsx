/**
 * TemplateComparisonView Component
 * Read-only template preview version of VendorComparisonNew
 *
 * Displays pre-generated comparison data from templates:
 * - Vendor cards with navigation
 * - Vertical bar charts with scores
 * - Score detail popups
 * - Battlecards matrix
 * - Share/download functionality
 *
 * REMOVED (Modification Controls):
 * - useTwoStageComparison hook
 * - All retry functionality
 * - Auto-generation of summaries
 * - Shortlisting
 * - Continue to Invite button
 * - localStorage persistence
 * - n8n webhook calls
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { ComparisonVendor, CriterionScoreDetail } from '../../types/comparison.types';
import { Criterion } from '../../types';
import { Template } from '../../types/template.types';
import { VendorCard } from '../vendor-comparison/VendorCard';
import { VerticalBarChart } from '../vendor-comparison/VerticalBarChart';
import { TemplateBattlecardsView } from './TemplateBattlecardsView';
import { Button } from '../ui/button';
import { TYPOGRAPHY } from '../../styles/typography-config';

// ===========================================
// Props Interface
// ===========================================

interface TemplateComparisonViewProps {
  template: Template;
  comparisonVendors: ComparisonVendor[];
}

export const TemplateComparisonView: React.FC<TemplateComparisonViewProps> = ({
  template,
  comparisonVendors,
}) => {
  // ===========================================
  // State for UI Interactions
  // ===========================================

  const [selectedScoreDetail, setSelectedScoreDetail] = useState<{
    vendorName: string;
    criterionName: string;
    detail: CriterionScoreDetail;
  } | null>(null);
  const [expandedCriterion, setExpandedCriterion] = useState<Criterion | null>(null);

  // Mobile state (3 vendor carousels)
  const [vendor1Index, setVendor1Index] = useState(0);
  const [vendor2Index, setVendor2Index] = useState(Math.min(1, comparisonVendors.length - 1));
  const [vendor3Index, setVendor3Index] = useState(Math.min(2, comparisonVendors.length - 1));

  // Desktop state (5 columns with screen pagination)
  const [desktopScreen, setDesktopScreen] = useState(0);
  const [desktopColumnIndices, setDesktopColumnIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [expandedColumnIndex, setExpandedColumnIndex] = useState<number | null>(null);

  // ===========================================
  // Derived Data
  // ===========================================

  // Use template criteria and map explanation to description for VerticalBarChart
  const criteria: Criterion[] = useMemo(() => {
    return (template.criteria || []).map(criterion => ({
      ...criterion,
      description: criterion.description || criterion.explanation || ''
    }));
  }, [template.criteria]);

  // Calculate total screens for desktop (5 vendors per screen)
  const totalDesktopScreens = Math.ceil(comparisonVendors.length / 5) || 1;
  const isFirstScreen = desktopScreen === 0;
  const isLastScreen = desktopScreen === totalDesktopScreens - 1;

  // ===========================================
  // Desktop Vendor Management
  // ===========================================

  const getDesktopVendors = (): (ComparisonVendor | null)[] => {
    const vendors: (ComparisonVendor | null)[] = [];

    for (let i = 0; i < 5; i++) {
      const actualIndex = desktopColumnIndices[i];
      if (actualIndex !== undefined && actualIndex < comparisonVendors.length) {
        vendors.push(comparisonVendors[actualIndex]);
      } else {
        vendors.push(null);
      }
    }

    return vendors;
  };

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
      setExpandedColumnIndex(null);
    }
  };

  const handleDesktopColumnNavigate = (columnIndex: number, direction: 'next' | 'previous') => {
    setDesktopColumnIndices(prev => {
      const newIndices = [...prev];
      const currentIdx = newIndices[columnIndex];

      if (direction === 'next') {
        newIndices[columnIndex] = (currentIdx + 1) % comparisonVendors.length;
      } else {
        newIndices[columnIndex] = currentIdx === 0 ? comparisonVendors.length - 1 : currentIdx - 1;
      }

      return newIndices;
    });
  };

  const handleColumnToggleExpand = (columnIndex: number) => {
    setExpandedColumnIndex(prev => prev === columnIndex ? null : columnIndex);
  };

  // ===========================================
  // Mobile Vendor Navigation
  // ===========================================

  const vendor1 = comparisonVendors[vendor1Index] ?? null;
  const vendor2 = comparisonVendors[vendor2Index] ?? null;
  const vendor3 = comparisonVendors[vendor3Index] ?? null;

  const handleVendor1Navigate = (direction: 'next' | 'previous') => {
    setVendor1Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % comparisonVendors.length;
      } else {
        return prev === 0 ? comparisonVendors.length - 1 : prev - 1;
      }
    });
  };

  const handleVendor2Navigate = (direction: 'next' | 'previous') => {
    setVendor2Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % comparisonVendors.length;
      } else {
        return prev === 0 ? comparisonVendors.length - 1 : prev - 1;
      }
    });
  };

  const handleVendor3Navigate = (direction: 'next' | 'previous') => {
    setVendor3Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % comparisonVendors.length;
      } else {
        return prev === 0 ? comparisonVendors.length - 1 : prev - 1;
      }
    });
  };

  // ===========================================
  // Criterion Expansion Popup
  // ===========================================

  const handleCriterionClick = (criterionId: string) => {
    const criterion = criteria.find(c => c.id === criterionId);
    if (criterion) {
      setExpandedCriterion(criterion);
    }
  };

  // ===========================================
  // Score Detail Popup
  // ===========================================

  const handleScoreClick = (vendorId: string, criterionId: string, vendorName: string, criterionName: string) => {
    const vendor = comparisonVendors.find(v => v.id === vendorId);
    if (!vendor || !vendor.scoreDetails) return;

    const detail = vendor.scoreDetails[criterionId];
    if (!detail) return;

    setSelectedScoreDetail({
      vendorName,
      criterionName,
      detail
    });
  };

  // ===========================================
  // Empty State
  // ===========================================

  if (comparisonVendors.length === 0) {
    return (
      <div className="vendor-comparison-container flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center px-6 py-12">
          <h3 className="text-lg font-medium text-gray-900">No vendors in template</h3>
          <p className="mt-2 text-sm text-gray-500">
            This template does not contain vendor comparison data.
          </p>
        </div>
      </div>
    );
  }

  // Get desktop vendors for display
  const desktopVendors = getDesktopVendors();

  // Dummy handlers for removed functionality
  const dummyToggleShortlist = () => {};
  const dummyRetryVendor = () => {};
  const dummyAddVendor = () => {};

  // Use template's comparison matrix if available, otherwise use empty state
  // SP_025: This will include cell summaries if they exist in the template JSON
  const comparisonState = template.comparisonMatrix || {
    criteria: {},
    isPaused: false,
    isComplete: true
  };

  return (
    <div className="vendor-comparison-container bg-gray-50 min-h-screen">
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
                totalVendors={comparisonVendors.length}
                onNavigate={handleVendor1Navigate}
                isShortlisted={false}
                onToggleShortlist={dummyToggleShortlist}
                onRetryVendor={dummyRetryVendor}
                isLoadingSummary={false}
              />
            )}

            {/* Vendor 2 Card (only show if 2+ vendors) */}
            {comparisonVendors.length >= 2 && vendor2 && (
              <VendorCard
                vendor={vendor2}
                currentIndex={vendor2Index}
                totalVendors={comparisonVendors.length}
                onNavigate={handleVendor2Navigate}
                isShortlisted={false}
                onToggleShortlist={dummyToggleShortlist}
                onRetryVendor={dummyRetryVendor}
                isLoadingSummary={false}
              />
            )}

            {/* Vendor 3 Card (only show if 3+ vendors) */}
            {comparisonVendors.length >= 3 && vendor3 && (
              <VendorCard
                vendor={vendor3}
                currentIndex={vendor3Index}
                totalVendors={comparisonVendors.length}
                onNavigate={handleVendor3Navigate}
                isShortlisted={false}
                onToggleShortlist={dummyToggleShortlist}
                onRetryVendor={dummyRetryVendor}
                isLoadingSummary={false}
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
              projectId={template.templateId}
              onCriterionClick={handleCriterionClick}
              onScoreClick={handleScoreClick}
              onRetryVendor={dummyRetryVendor}
              comparisonState={comparisonState}
              isGeneratingVendorSummaries={false}
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
              projectId={template.templateId}
              columnCount={5}
              desktopVendors={desktopVendors}
              desktopColumnIndices={desktopColumnIndices}
              expandedColumnIndex={expandedColumnIndex}
              onCriterionClick={handleCriterionClick}
              onColumnNavigate={handleDesktopColumnNavigate}
              onColumnToggleExpand={handleColumnToggleExpand}
              onAddVendor={dummyAddVendor}
              totalVendors={comparisonVendors.length}
              isFirstScreen={isFirstScreen}
              isLastScreen={isLastScreen}
              onScreenChange={handleDesktopScreenChange}
              shortlistedVendorIds={new Set()}
              onToggleShortlist={dummyToggleShortlist}
              onScoreClick={handleScoreClick}
              onRetryVendor={dummyRetryVendor}
              comparisonState={comparisonState}
              isGeneratingVendorSummaries={false}
            />
          </motion.div>
        </div>

        {/* ========================================= */}
        {/* VENDOR BATTLECARDS SECTION               */}
        {/* ========================================= */}
        {template.battlecards && template.battlecards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-16 border-t-2 border-gray-200 pt-8"
          >
            <TemplateBattlecardsView
              battlecardsRows={template.battlecards}
              comparisonVendors={comparisonVendors}
            />
          </motion.div>
        )}

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

        {/* Criterion Expansion Popup */}
        <AnimatePresence>
          {expandedCriterion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setExpandedCriterion(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {expandedCriterion.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${expandedCriterion.importance === 'high' ? 'bg-red-100 text-red-800' :
                          expandedCriterion.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {expandedCriterion.importance.charAt(0).toUpperCase() + expandedCriterion.importance.slice(1)} Priority
                      </span>
                      <span className="text-xs text-gray-500">
                        {expandedCriterion.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedCriterion(null)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Full Description */}
                {expandedCriterion.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {expandedCriterion.description}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
