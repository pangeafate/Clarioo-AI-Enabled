/**
 * TemplatePreviewModal Component
 *
 * Full-featured template preview with multi-stage navigation
 * Replaces CriteriaPreviewModal (SP_031)
 *
 * Features:
 * - Full viewport modal with stage navigation tabs
 * - 5 stages: Criteria Builder, Vendor Discovery, Vendor Comparison (default), Executive Summary, Battlecards
 * - Read-only mode: No editing, no AI generation, just viewing
 * - Interactive elements: Click to view evidence, expand battlecards, etc.
 * - "Use this template for my project" button on all stages
 * - Share button on all stages
 * - Default view: Vendor Comparison Matrix with Battlecards underneath
 *
 * @module components/templates/TemplatePreviewModal
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShareDialog } from '@/components/vendor-discovery/ShareDialog';
import { AccordionSection } from '@/components/vendor-discovery/AccordionSection';
import { TemplateComparisonView } from '@/components/templates/TemplateComparisonView';
import { TemplateBattlecardsView } from '@/components/templates/TemplateBattlecardsView';
import type { Template } from '@/types/template.types';
import type { Criterion } from '@/types/criteria.types';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { cn } from '@/lib/utils';
import { VENDOR_COLOR_PALETTE, ComparisonVendor } from '@/types/comparison.types';

export interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onUseTemplate: () => void;
}

type PreviewStage = 'criteria' | 'vendors' | 'comparison' | 'executive-summary' | 'battlecards';

interface StageConfig {
  id: PreviewStage;
  label: string;
  shortLabel?: string;
}

const STAGES: StageConfig[] = [
  { id: 'criteria', label: 'Criteria Builder', shortLabel: 'Criteria' },
  { id: 'vendors', label: 'Vendor Discovery', shortLabel: 'Vendors' },
  { id: 'comparison', label: 'Vendor Comparison', shortLabel: 'Comparison' },
  { id: 'executive-summary', label: 'Pre-Demo Brief', shortLabel: 'Brief' },
  { id: 'battlecards', label: 'Battlecards', shortLabel: 'Battlecards' },
];

/**
 * Group criteria by category type
 */
const groupCriteriaByCategory = (criteria: Criterion[]): Record<string, Criterion[]> => {
  const groups: Record<string, Criterion[]> = {};

  criteria.forEach(criterion => {
    const category = criterion.type || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(criterion);
  });

  return groups;
};

/**
 * Capitalize first letter of category name
 */
const capitalizeCategory = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Transform template comparison matrix data into ComparisonVendor format
 * for rendering in VerticalBarChart
 */
const transformTemplateToComparisonVendors = (template: Template): ComparisonVendor[] => {
  if (!template.comparisonMatrix || !template.vendors) {
    return [];
  }

  const { comparisonMatrix } = template;
  const vendors = template.vendors;

  // Build match percentage lookup from Pre-Demo Brief vendorRecommendations
  const matchPercentageMap = new Map<string, number>();
  if (template.executiveSummary?.vendorRecommendations) {
    template.executiveSummary.vendorRecommendations.forEach((rec: any) => {
      if (rec.name && rec.matchPercentage !== undefined) {
        matchPercentageMap.set(rec.name, rec.matchPercentage);
      }
    });
  }

  return vendors.map((vendor: any, index: number) => {
    // Build scores Map from comparisonMatrix criteria cells
    const scoresMap = new Map<string, 'yes' | 'no' | 'unknown' | 'star'>();
    // Build scoreDetails Map for cell evidence data (enables clickable cells)
    const scoreDetailsMap: Record<string, { state: any; evidence: string; comment: string }> = {};

    Object.entries(comparisonMatrix.criteria).forEach(([criterionId, row]: [string, any]) => {
      const cell = row.cells?.[vendor.id];
      if (cell?.value) {
        scoresMap.set(criterionId, cell.value);

        // Extract cell evidence data for popup (matches project view format)
        scoreDetailsMap[criterionId] = {
          state: cell.value,
          evidence: cell.evidenceUrl || '',
          comment: cell.comment || ''
        };
      } else {
        scoresMap.set(criterionId, 'unknown');
      }
    });

    // Get match percentage from Pre-Demo Brief, vendor data, or default to 0
    const matchPercentage = matchPercentageMap.get(vendor.name) ?? vendor.matchPercentage ?? 0;

    // Get vendor summary data from vendorSummaries object (keyed by vendor name)
    const vendorSummary = template.vendorSummaries?.[vendor.name] || {};

    return {
      id: vendor.id,
      name: vendor.name,
      website: vendor.website,
      description: vendor.description || '',
      // Merge vendorSummaries data (preferred) with vendor object data (fallback)
      killerFeature: vendorSummary.killerFeature || vendor.killerFeature,
      executiveSummary: vendorSummary.executiveSummary || vendor.executiveSummary,
      keyFeatures: vendorSummary.keyFeatures || vendor.keyFeatures || [],
      matchPercentage,
      scores: scoresMap,
      scoreDetails: scoreDetailsMap, // Enable clickable cells with evidence
      color: VENDOR_COLOR_PALETTE[index % VENDOR_COLOR_PALETTE.length],
      comparisonStatus: 'completed', // Template data is pre-generated
    };
  });
};

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  onUseTemplate,
}) => {
  // Determine initial stage based on available data
  // Prefer 'comparison' if available, otherwise fall back to first available stage
  const getInitialStage = (): PreviewStage => {
    if (template.comparisonMatrix && template.vendors && Array.isArray(template.vendors) && template.vendors.length > 0) {
      return 'comparison';
    }
    if (template.vendors && Array.isArray(template.vendors) && template.vendors.length > 0) {
      return 'vendors';
    }
    return 'criteria'; // Default fallback to criteria
  };

  const [currentStage, setCurrentStage] = useState<PreviewStage>(getInitialStage());
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['feature']));

  // Group criteria by category
  const groupedCriteria = useMemo(() => {
    return groupCriteriaByCategory(template.criteria);
  }, [template.criteria]);

  // Get sorted category names
  const sortedCategories = useMemo(() => {
    const categoryOrder = ['feature', 'technical', 'business', 'compliance'];
    const categories = Object.keys(groupedCriteria);

    return categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.toLowerCase());
      const bIndex = categoryOrder.indexOf(b.toLowerCase());

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [groupedCriteria]);

  // Transform template data into ComparisonVendor format for rendering
  const comparisonVendors = useMemo(() => {
    return transformTemplateToComparisonVendors(template);
  }, [template]);

  const toggleSection = (category: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Dummy handlers for read-only mode
  const handleEditCriterion = () => {
    // No-op in read-only mode
  };

  const handleAddCriterion = () => {
    // No-op in read-only mode
  };

  // Filter stages based on available data
  const availableStages = useMemo(() => {
    return STAGES.filter(stage => {
      if (stage.id === 'criteria') return template.criteria && template.criteria.length > 0;
      if (stage.id === 'vendors') return template.vendors && Array.isArray(template.vendors) && template.vendors.length > 0;
      if (stage.id === 'comparison') return template.comparisonMatrix && template.vendors && Array.isArray(template.vendors) && template.vendors.length > 0;
      if (stage.id === 'executive-summary') return template.executiveSummary && typeof template.executiveSummary === 'object';
      if (stage.id === 'battlecards') return template.battlecards && Array.isArray(template.battlecards) && template.battlecards.length > 0;
      return false;
    });
  }, [template]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-8 bg-white rounded-lg shadow-2xl z-50 flex flex-col"
          >
            {/* Close Button - Fixed at top-right */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 bg-white hover:bg-gray-100 rounded-full shadow-sm"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable Content - Now includes header */}
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="max-w-6xl mx-auto pr-8">
                {/* Header Content - Now scrollable */}
                <div className="mb-6">
                  {/* Title */}
                  <div className="mb-4">
                    <h2 className={cn(TYPOGRAPHY.heading.h4, 'mb-2')}>
                      {template.projectName}
                    </h2>
                    {template.searchedBy && (
                      <p className="text-sm text-gray-600">{template.searchedBy}</p>
                    )}
                  </div>

                  {/* Navigation Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {availableStages.map((stage) => (
                      <button
                        key={stage.id}
                        onClick={() => setCurrentStage(stage.id)}
                        className={cn(
                          'px-4 py-2 rounded-lg whitespace-nowrap transition-colors',
                          'text-sm font-medium',
                          currentStage === stage.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        <span className="hidden md:inline">{stage.label}</span>
                        <span className="md:hidden">{stage.shortLabel || stage.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Criteria Builder Stage */}
                {currentStage === 'criteria' && (
                  <div className="space-y-4">
                    {sortedCategories.map(category => (
                      <AccordionSection
                        key={category}
                        title={capitalizeCategory(category)}
                        criteria={groupedCriteria[category]}
                        isExpanded={expandedSections.has(category.toLowerCase())}
                        onToggle={() => toggleSection(category.toLowerCase())}
                        onEditCriterion={handleEditCriterion}
                        onAddCriterion={handleAddCriterion}
                        readOnly={true}
                      />
                    ))}
                  </div>
                )}

                {/* Vendor Discovery Stage */}
                {currentStage === 'vendors' && template.vendors && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      {template.vendors.length} vendor{template.vendors.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {template.vendors.map((vendor: any, index: number) => (
                        <div
                          key={vendor.id || index}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <h3 className="font-semibold text-lg">{vendor.name}</h3>
                          {vendor.description && (
                            <p className="text-sm text-gray-600">{vendor.description}</p>
                          )}
                          {vendor.website && (
                            <a
                              href={vendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              Visit website
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vendor Comparison Matrix Stage (Default) */}
                {currentStage === 'comparison' && template.comparisonMatrix && (
                  <TemplateComparisonView
                    template={template}
                    comparisonVendors={comparisonVendors}
                  />
                )}

                {/* Executive Summary Stage */}
                {currentStage === 'executive-summary' && template.executiveSummary && (
                  <div className="prose max-w-none">
                    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 space-y-6">
                      {/* Executive Summary Header */}
                      <div className="border-b pb-4">
                        <h3 className={cn(TYPOGRAPHY.heading.h4, 'mb-2')}>
                          Pre-Demo Brief
                        </h3>
                        <p className="text-sm text-gray-600">{template.projectName}</p>
                      </div>

                      {/* Summary Content */}
                      <div className="space-y-6">
                        {/* Simple format - Overview */}
                        {template.executiveSummary.overview && (
                          <div>
                            <h4 className={cn(TYPOGRAPHY.heading.h6, 'mb-2')}>Overview</h4>
                            <p className="text-gray-700 leading-relaxed">{template.executiveSummary.overview}</p>
                          </div>
                        )}

                        {/* Simple format - Project Summary */}
                        {template.executiveSummary.projectSummary && (
                          <div>
                            <h4 className={cn(TYPOGRAPHY.heading.h6, 'mb-2')}>Project Summary</h4>
                            <p className="text-gray-700 leading-relaxed">{template.executiveSummary.projectSummary}</p>
                          </div>
                        )}

                        {/* Structured format - Top Recommendation */}
                        {template.executiveSummary.recommendation && (
                          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <h4 className={cn(TYPOGRAPHY.heading.h6, 'mb-2 text-blue-900')}>
                              Top Recommendation: {template.executiveSummary.recommendation.topPick}
                            </h4>
                            <p className="text-blue-800 mb-2">{template.executiveSummary.recommendation.reason}</p>
                            {template.executiveSummary.recommendation.considerations && template.executiveSummary.recommendation.considerations.length > 0 && (
                              <ul className="space-y-1 mt-3">
                                {template.executiveSummary.recommendation.considerations.map((consideration: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{consideration}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Structured format - Vendor Recommendations */}
                        {template.executiveSummary.vendorRecommendations && template.executiveSummary.vendorRecommendations.length > 0 && (
                          <div>
                            <h4 className={cn(TYPOGRAPHY.heading.h6, 'mb-3')}>Vendor Rankings</h4>
                            <div className="space-y-4">
                              {template.executiveSummary.vendorRecommendations.map((vendor: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <span className="text-2xl font-bold text-primary">#{vendor.rank}</span>
                                      <span className="ml-3 text-lg font-semibold text-gray-900">{vendor.name}</span>
                                    </div>
                                    {vendor.matchPercentage !== undefined && (
                                      <span className="text-lg font-bold text-green-600">{vendor.matchPercentage}% Match</span>
                                    )}
                                  </div>
                                  {vendor.overallAssessment && (
                                    <p className="text-sm text-gray-700 mb-3">{vendor.overallAssessment}</p>
                                  )}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {vendor.keyStrengths && vendor.keyStrengths.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-green-700 mb-1">Strengths:</p>
                                        <ul className="space-y-1">
                                          {vendor.keyStrengths.map((strength: string, i: number) => (
                                            <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                              <span className="text-green-500">✓</span>
                                              <span>{strength}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {vendor.keyWeaknesses && vendor.keyWeaknesses.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-red-700 mb-1">Weaknesses:</p>
                                        <ul className="space-y-1">
                                          {vendor.keyWeaknesses.map((weakness: string, i: number) => (
                                            <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                              <span className="text-red-500">⚠</span>
                                              <span>{weakness}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                  {vendor.bestFor && (
                                    <p className="text-xs text-gray-600 mt-2 italic">Best for: {vendor.bestFor}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Structured format - Key Differentiators */}
                        {template.executiveSummary.keyDifferentiators && template.executiveSummary.keyDifferentiators.length > 0 && (
                          <div>
                            <h4 className={cn(TYPOGRAPHY.heading.h6, 'mb-3')}>Key Differentiators</h4>
                            <div className="space-y-2">
                              {template.executiveSummary.keyDifferentiators.map((diff: any, idx: number) => (
                                <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                  <p className="font-semibold text-sm text-gray-900">{diff.category}</p>
                                  <p className="text-sm text-gray-700 mt-1">
                                    <span className="font-medium text-yellow-700">Leader:</span> {diff.leader}
                                  </p>
                                  {diff.details && (
                                    <p className="text-xs text-gray-600 mt-1">{diff.details}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Structured format - Key Criteria */}
                        {template.executiveSummary.keyCriteria && template.executiveSummary.keyCriteria.length > 0 && (
                          <div>
                            <h4 className={cn(TYPOGRAPHY.heading.h6, 'mb-3')}>Key Selection Criteria</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {template.executiveSummary.keyCriteria.map((criterion: any, idx: number) => (
                                <div key={idx} className="border rounded p-3 bg-white">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="font-semibold text-sm text-gray-900">{criterion.name}</p>
                                    {criterion.importance && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        criterion.importance.toLowerCase() === 'high'
                                          ? 'bg-red-100 text-red-700'
                                          : criterion.importance.toLowerCase() === 'medium'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {criterion.importance}
                                      </span>
                                    )}
                                  </div>
                                  {criterion.description && (
                                    <p className="text-xs text-gray-600">{criterion.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Simple format - Top Recommendations */}
                        {template.executiveSummary.topRecommendations && template.executiveSummary.topRecommendations.length > 0 && (
                          <div>
                            <h4 className={cn(TYPOGRAPHY.heading.h6, 'mb-2')}>Top Recommendations</h4>
                            <ul className="space-y-2">
                              {template.executiveSummary.topRecommendations.map((rec: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span className="text-gray-700">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Simple format - Key Findings/Insights */}
                        {(template.executiveSummary.keyFindings || template.executiveSummary.keyInsights) && (
                          <div>
                            <h4 className={cn(TYPOGRAPHY.heading.h6, 'mb-2')}>Key Insights</h4>
                            <ul className="space-y-2">
                              {(template.executiveSummary.keyFindings || template.executiveSummary.keyInsights || []).map((finding: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span className="text-gray-700">{finding}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Battlecards Stage (Standalone) */}
                {currentStage === 'battlecards' && template.battlecards && template.battlecards.length > 0 && comparisonVendors.length > 0 && (
                  <div>
                    <TemplateBattlecardsView
                      battlecardsRows={template.battlecards}
                      comparisonVendors={comparisonVendors}
                    />
                  </div>
                )}

                {/* Footer Buttons - At end of content */}
                <div className="mt-8 pt-6 border-t">
                  <div className="max-w-md mx-auto space-y-3">
                    {/* Download/Share Button */}
                    <Button
                      variant="outline"
                      onClick={() => setIsShareDialogOpen(true)}
                      className="w-full justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download or Share
                    </Button>

                    {/* Primary Action Button */}
                    <Button
                      onClick={onUseTemplate}
                      className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium"
                    >
                      Use this template for my project
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>

          {/* Share Dialog */}
          <ShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            criteria={template.criteria}
            projectId={template.templateId}
            title="Download Template"
            description="Download the template data or share via link"
            downloadButtonText="Download Template"
            downloadDescription="Download as Excel file (.xlsx)"
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default TemplatePreviewModal;
