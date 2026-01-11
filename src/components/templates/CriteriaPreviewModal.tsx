/**
 * CriteriaPreviewModal Component
 *
 * Full viewport modal for previewing template criteria before using them
 * to create a new project.
 *
 * Features:
 * - Full viewport size (matches ExecutiveSummaryDialog)
 * - Read-only accordion view (reuses AccordionSection)
 * - Criteria grouped by category (Feature, Technical, Business, Compliance, Custom)
 * - SignalAntenna visible but NOT interactive
 * - NO drag-and-drop, NO swipe gestures, NO edit functionality
 * - Click criterion card to expand and view full explanation
 * - Download/Share button (opens ShareDialog)
 * - "Use These Criteria to Start a Project" primary button
 *
 * @module components/templates/CriteriaPreviewModal
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AccordionSection } from '@/components/vendor-discovery/AccordionSection';
import { ShareDialog } from '@/components/vendor-discovery/ShareDialog';
import type { Template } from '@/types/template.types';
import type { Criterion } from '@/types/criteria.types';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { cn } from '@/lib/utils';

export interface CriteriaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onUseTemplate: () => void;
}

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

export const CriteriaPreviewModal: React.FC<CriteriaPreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  onUseTemplate,
}) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['feature']));

  // Group criteria by category
  const groupedCriteria = useMemo(() => {
    return groupCriteriaByCategory(template.criteria);
  }, [template.criteria]);

  // Get sorted category names (feature, technical, business, compliance, other)
  const sortedCategories = useMemo(() => {
    const categoryOrder = ['feature', 'technical', 'business', 'compliance'];
    const categories = Object.keys(groupedCriteria);

    return categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.toLowerCase());
      const bIndex = categoryOrder.indexOf(b.toLowerCase());

      // If both are in the order list, sort by index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only a is in the order list, it comes first
      if (aIndex !== -1) return -1;

      // If only b is in the order list, it comes first
      if (bIndex !== -1) return 1;

      // Otherwise, sort alphabetically
      return a.localeCompare(b);
    });
  }, [groupedCriteria]);

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

  // Dummy handlers for read-only mode (won't be called)
  const handleEditCriterion = () => {
    // No-op in read-only mode
  };

  const handleAddCriterion = () => {
    // No-op in read-only mode
  };

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
            {/* Close Button - Fixed in top right */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Content - Now scrollable */}
                <div className="pr-12">
                  <h2 className={cn(TYPOGRAPHY.heading.h4, 'mb-2')}>
                    {template.lookingFor}
                  </h2>

                  {/* Company type */}
                  {template.companyType && (
                    <p className="text-sm text-gray-600 mb-2">{template.companyType}</p>
                  )}

                  {/* Company details */}
                  {template.companyDetails && (
                    <p className="text-sm text-gray-600 mb-3">{template.companyDetails}</p>
                  )}

                  {/* Current tool */}
                  {template.currentTool && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Currently:</span> {template.currentTool}
                    </p>
                  )}

                  {/* Pain quote */}
                  {template.painQuote && (
                    <p className="text-sm text-gray-600 italic mb-3">
                      "{template.painQuote}"
                    </p>
                  )}
                </div>

                {/* Criteria Sections */}
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
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4 md:p-6">
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
                  Use These Criteria to Start a Project
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Share Dialog */}
          <ShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            criteria={template.criteria}
            projectId={template.templateId}
            title="Download Template Criteria"
            description="Download the criteria list or share via link"
            downloadButtonText="Download Criteria Template"
            downloadDescription="Download as Excel file (.xlsx)"
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default CriteriaPreviewModal;
