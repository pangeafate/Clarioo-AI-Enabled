/**
 * AccordionSection Component - Collapsible Criteria Category
 *
 * @purpose Collapsible section for grouping criteria by category
 * @design Vertical accordion with count display and card-based content
 *
 * COLLAPSED STATE (SP_012):
 * Feature: 10 - 5 High, 3 Medium  [▼]
 *
 * EXPANDED STATE:
 * Feature: 10 - 5 High, 3 Medium  [▲]
 * ┌──────────────────────────────────┐
 * │ Criterion Card 1 (High)          │
 * ├──────────────────────────────────┤
 * │ Criterion Card 2 (High)          │
 * ├──────────────────────────────────┤
 * │ Criterion Card 3 (Medium)        │
 * └──────────────────────────────────┘
 *
 * FEATURES:
 * - Multiple sections can be open simultaneously
 * - Count display: Total - X High, Y Medium
 * - Criteria sorted by priority (High → Medium → Low)
 * - Low-importance criteria hidden
 * - Smooth expand/collapse animation
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { CriterionCard } from './CriterionCard';
import type { Criteria } from '../VendorDiscovery';

export interface AccordionSectionProps {
  title: string;
  criteria: Criteria[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditCriterion: (criterion: Criteria) => void;
  onAddCriterion: (categoryType: string) => void;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  criteria,
  isExpanded,
  onToggle,
  onEditCriterion,
  onAddCriterion
}) => {
  // Filter out low-importance criteria
  const visibleCriteria = criteria.filter(c => c.importance !== 'low');

  // Sort by importance: High → Medium
  const sortedCriteria = [...visibleCriteria].sort((a, b) => {
    const importanceOrder = { high: 3, medium: 2, low: 1 };
    return importanceOrder[b.importance] - importanceOrder[a.importance];
  });

  // Count by importance
  const highCount = visibleCriteria.filter(c => c.importance === 'high').length;
  const mediumCount = visibleCriteria.filter(c => c.importance === 'medium').length;
  const totalCount = visibleCriteria.length;

  if (totalCount === 0) {
    return null; // Don't render empty sections
  }

  // Get category color scheme (modern, subtle tones)
  const getCategoryColors = (category: string) => {
    const normalized = category.toLowerCase();

    // Feature = Blue/Indigo
    if (normalized.includes('feature')) {
      return {
        border: 'border-l-indigo-400',
        bg: 'bg-indigo-50/50',
        text: 'text-indigo-700'
      };
    }

    // Technical = Purple/Violet
    if (normalized.includes('technical')) {
      return {
        border: 'border-l-violet-400',
        bg: 'bg-violet-50/50',
        text: 'text-violet-700'
      };
    }

    // Business = Teal/Cyan
    if (normalized.includes('business')) {
      return {
        border: 'border-l-teal-400',
        bg: 'bg-teal-50/50',
        text: 'text-teal-700'
      };
    }

    // Compliance = Amber/Orange
    if (normalized.includes('compliance')) {
      return {
        border: 'border-l-amber-400',
        bg: 'bg-amber-50/50',
        text: 'text-amber-700'
      };
    }

    // Other/Custom = Slate/Gray
    return {
      border: 'border-l-slate-400',
      bg: 'bg-slate-50/50',
      text: 'text-slate-700'
    };
  };

  const colors = getCategoryColors(title);

  return (
    <div className={`border rounded-lg overflow-hidden bg-white border-l-4 ${colors.border}`}>
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className={`w-full px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex items-center justify-between transition-colors ${colors.bg} hover:opacity-80`}
      >
        {/* Title and Count */}
        <div className="flex items-center gap-1.5 xs:gap-2">
          <h3 className="font-semibold text-sm xs:text-base">{title}</h3>
          <span className="text-xs xs:text-sm text-muted-foreground">
            {totalCount} - {highCount} High, {mediumCount} Medium
          </span>
        </div>

        {/* Expand/Collapse Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-500" />
        </motion.div>
      </button>

      {/* Content - Collapsible */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-2 xs:p-3 sm:p-4 pt-0 space-y-2 xs:space-y-2.5 sm:space-y-3">
              {sortedCriteria.map((criterion) => (
                <CriterionCard
                  key={criterion.id}
                  criterion={criterion}
                  onEdit={onEditCriterion}
                />
              ))}

              {/* Add New Criterion Button */}
              <button
                onClick={() => onAddCriterion(title.toLowerCase())}
                className="w-full border border-dashed border-gray-300 rounded-lg bg-white hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex items-center justify-center gap-1.5 xs:gap-2 text-muted-foreground hover:text-primary group">
                  <Plus className="h-4 w-4 xs:h-5 xs:w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-xs xs:text-sm sm:text-base">Add {title} Criterion</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionSection;
