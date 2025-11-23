/**
 * VerticalBarChart Component
 * Sprint: SP_015 (Revised)
 *
 * Vertical bar chart showing vendor scores for each criterion
 * Replicates category structure from CriteriaBuilder with accordion sections
 * Categories: Feature, Technical, Business, Compliance, + Custom
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronDown, ChevronRight, ChevronLeft, Star, HelpCircle, Check, Minus, Loader2 } from 'lucide-react';
import { ComparisonVendor, CriterionState } from '../../types/comparison.types';
import { Criterion } from '../../types';
import { SignalAntenna } from '../vendor-discovery/SignalAntenna';
import { Button } from '../ui/button';
import { TYPOGRAPHY } from '../../styles/typography-config';
import { DesktopColumnHeader } from './DesktopColumnHeader';

interface VerticalBarChartProps {
  vendors: (ComparisonVendor | null)[];
  criteria: Criterion[];
  onCriterionClick?: (criterionId: string) => void;
  className?: string;
  columnCount?: 3 | 5; // Number of columns (3 for mobile, 5 for desktop)
  // Desktop header props
  desktopVendors?: (ComparisonVendor | null)[];
  desktopColumnIndices?: number[];
  expandedColumnIndex?: number | null;
  onColumnNavigate?: (columnIndex: number, direction: 'next' | 'previous') => void;
  onColumnToggleExpand?: (columnIndex: number) => void;
  onAddVendor?: () => void;
  totalVendors?: number;
  isFirstScreen?: boolean;
  isLastScreen?: boolean;
  onScreenChange?: (direction: 'next' | 'previous') => void;
  // Shortlist props
  shortlistedVendorIds?: Set<string>;
  onToggleShortlist?: (vendorId: string) => void;
  // Progressive loading props
  onScoreClick?: (vendorId: string, criterionId: string, vendorName: string, criterionName: string) => void;
  onRetryVendor?: (vendorId: string) => void;
}

/**
 * Render icon/text for 4-state criterion evaluation
 * - yes: Green checkmark with green circle background
 * - no: Gray minus with gray circle background
 * - unknown: Gray ? icon with gray circle background
 * - star: Gold star with yellow circle background
 * - loading: Rotating loader icon (when vendor is being researched)
 * - pending: Empty/dim state (when vendor hasn't started yet)
 */
const renderCriterionState = (
  state: CriterionState,
  criterionIndex: number,
  vendorIndex: number,
  comparisonStatus?: 'pending' | 'loading' | 'completed' | 'failed'
) => {
  const baseDelay = criterionIndex * 0.05 + vendorIndex * 0.1;

  // Show loading spinner for vendors being researched
  if (comparisonStatus === 'loading') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 lg:bg-blue-50/70 flex items-center justify-center">
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-spin" />
        </div>
      </motion.div>
    );
  }

  // Show empty/pending state for vendors not yet started
  if (comparisonStatus === 'pending') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100/50 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      </div>
    );
  }

  switch (state) {
    case 'yes':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: baseDelay }}
          className="flex items-center justify-center h-full"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 lg:bg-green-100/70 flex items-center justify-center">
            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </div>
        </motion.div>
      );

    case 'no':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: baseDelay }}
          className="flex items-center justify-center h-full"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 lg:bg-gray-100/70 flex items-center justify-center">
            <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
        </motion.div>
      );

    case 'unknown':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: baseDelay }}
          className="flex items-center justify-center h-full"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 lg:bg-gray-100/70 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
        </motion.div>
      );

    case 'star':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.4, delay: baseDelay }}
          className="flex items-center justify-center h-full"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 lg:bg-yellow-100/70 flex items-center justify-center">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-yellow-500" />
          </div>
        </motion.div>
      );

    default:
      return null;
  }
};

// Category color coding matching CriteriaBuilder
const getCategoryColors = (category: string) => {
  const normalized = category.toLowerCase();

  if (normalized.includes('feature')) {
    return {
      border: 'border-l-indigo-400',
      bg: 'bg-indigo-50/50',
      text: 'text-indigo-700',
      headerBg: 'bg-indigo-50',
    };
  }

  if (normalized.includes('technical')) {
    return {
      border: 'border-l-violet-400',
      bg: 'bg-violet-50/50',
      text: 'text-violet-700',
      headerBg: 'bg-violet-50',
    };
  }

  if (normalized.includes('business')) {
    return {
      border: 'border-l-teal-400',
      bg: 'bg-teal-50/50',
      text: 'text-teal-700',
      headerBg: 'bg-teal-50',
    };
  }

  if (normalized.includes('compliance')) {
    return {
      border: 'border-l-amber-400',
      bg: 'bg-amber-50/50',
      text: 'text-amber-700',
      headerBg: 'bg-amber-50',
    };
  }

  return {
    border: 'border-l-slate-400',
    bg: 'bg-slate-50/50',
    text: 'text-slate-700',
    headerBg: 'bg-slate-50',
  };
};

export const VerticalBarChart: React.FC<VerticalBarChartProps> = ({
  vendors,
  criteria,
  onCriterionClick,
  className = '',
  columnCount = 3,
  // Desktop header props
  desktopVendors,
  desktopColumnIndices,
  expandedColumnIndex,
  onColumnNavigate,
  onColumnToggleExpand,
  onAddVendor,
  totalVendors = 0,
  isFirstScreen = true,
  isLastScreen = true,
  onScreenChange,
  // Shortlist props
  shortlistedVendorIds,
  onToggleShortlist,
  // Progressive loading props
  onScoreClick,
  onRetryVendor,
}) => {
  // Check if desktop headers should be shown
  const showDesktopHeaders = columnCount === 5 && desktopVendors && desktopColumnIndices;
  // Filter out null vendors for display, but keep track of all slots
  const activeVendors = vendors.filter((v): v is ComparisonVendor => v !== null);

  // Grid column classes based on columnCount
  const gridColsClass = columnCount === 5 ? 'grid-cols-5' : 'grid-cols-3';

  // Accordion state - all sections expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Feature', 'Technical', 'Business', 'Compliance'])
  );

  // Group criteria by category (type field)
  const categorizedCriteria = useMemo(() => {
    const groups: Record<string, Criterion[]> = {};

    criteria.forEach((criterion) => {
      // Capitalize first letter of type for display
      const category = criterion.type
        ? criterion.type.charAt(0).toUpperCase() + criterion.type.slice(1)
        : 'Other';

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(criterion);
    });

    // Sort criteria within each category by importance
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => {
        const importanceOrder = { high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      });
    });

    return groups;
  }, [criteria]);

  // Standard categories in order
  const standardCategories = ['Feature', 'Technical', 'Business', 'Compliance'];

  // Custom categories (anything not in standard list)
  const customCategories = Object.keys(categorizedCriteria).filter(
    (cat) => !standardCategories.includes(cat)
  );

  // All categories in display order
  const allCategories = [
    ...standardCategories.filter((cat) => categorizedCriteria[cat]),
    ...customCategories,
  ];

  const toggleSection = (category: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (activeVendors.length === 0) {
    return (
      <div className={`vertical-bar-chart bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <p className="text-sm text-gray-500">Select vendors to compare</p>
      </div>
    );
  }

  // Calculate total high priority count
  const totalHighPriority = criteria.filter(
    (c) => c.importance === 'high'
  ).length;

  return (
    <div className={`vertical-bar-chart bg-white rounded-2xl border-2 border-gray-200 overflow-hidden ${className}`}>
      {/* Header: Evaluation Criteria */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-stretch gap-2 sm:gap-3">
          {/* Title section */}
          <div className="flex-shrink-0 w-40 xs:w-44 sm:w-52 lg:w-60">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Evaluation Criteria ({criteria.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalHighPriority} High Priority
            </p>
          </div>

          {/* Gap matching the layout */}
          <div className="w-2 sm:w-3 flex-shrink-0" />

          {/* Screen navigation - Previous (Desktop only) - right before vendor cards */}
          {showDesktopHeaders && (
            <div className="hidden lg:flex flex-shrink-0 w-8 items-center justify-center">
              {!isFirstScreen && onScreenChange && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onScreenChange('previous')}
                  className="h-7 w-7 rounded-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Desktop Column Headers (hidden on mobile) */}
          {showDesktopHeaders && (
            <div className="hidden lg:grid flex-1 grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2">
              {desktopVendors.map((vendor, idx) => (
                <DesktopColumnHeader
                  key={`desktop-col-${idx}-${vendor?.id ?? 'placeholder'}`}
                  vendor={vendor}
                  currentIndex={desktopColumnIndices[idx] ?? idx}
                  totalVendors={totalVendors}
                  onNavigate={(direction) => onColumnNavigate?.(idx, direction)}
                  onAddVendor={onAddVendor}
                  isExpanded={expandedColumnIndex === idx}
                  onToggleExpand={() => onColumnToggleExpand?.(idx)}
                  columnPosition={idx}
                  isShortlisted={vendor ? shortlistedVendorIds?.has(vendor.id) : false}
                  onToggleShortlist={onToggleShortlist}
                />
              ))}
            </div>
          )}

          {/* Screen navigation - Next (Desktop only) */}
          {showDesktopHeaders && (
            <div className="hidden lg:flex flex-shrink-0 w-8 items-center justify-center">
              {!isLastScreen && onScreenChange && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onScreenChange('next')}
                  className="h-7 w-7 rounded-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Accordion Sections by Category */}
      <div className="divide-y divide-gray-200">
        {allCategories.map((category) => {
          const categoryCriteria = categorizedCriteria[category] || [];
          const isExpanded = expandedSections.has(category);
          const categoryColors = getCategoryColors(category);

          // Count by importance
          const highCount = categoryCriteria.filter(
            (c) => c.importance === 'high'
          ).length;
          const mediumCount = categoryCriteria.filter(
            (c) => c.importance === 'medium'
          ).length;
          const lowCount = categoryCriteria.filter(
            (c) => c.importance === 'low'
          ).length;

          return (
            <div key={category} className={`border-l-4 ${categoryColors.border}`}>
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(category)}
                className={`w-full ${categoryColors.bg} hover:bg-opacity-80 transition-colors px-4 sm:px-6 py-3 flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <h4 className={`${TYPOGRAPHY.heading.h6} ${categoryColors.text}`}>
                    {category}
                  </h4>
                  <span className={`${TYPOGRAPHY.muted.small} text-gray-600`}>
                    {categoryCriteria.length} - {highCount} High, {mediumCount} Medium, {lowCount} Low
                  </span>
                </div>
              </button>

              {/* Accordion Content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 sm:p-4 space-y-3 bg-white relative">
                      {/* Rotated Vendor Names - Spanning entire category section */}
                      {/* Key includes all vendor IDs to force re-render when vendors change */}
                      <div
                        key={`watermarks-${category}-${activeVendors.map(v => v.id).join('-')}`}
                        className="absolute top-0 bottom-0 pointer-events-none flex gap-2 sm:gap-3"
                        style={{ left: '0.75rem', right: '0.75rem' }}
                      >
                        {/* Spacer matching criterion card width */}
                        <div className="flex-shrink-0 w-40 xs:w-44 sm:w-52 lg:w-60" />
                        {/* Left spacers matching criterion row layout - only on desktop when headers are shown */}
                        {showDesktopHeaders && <div className="hidden lg:block w-[52px] sm:w-[60px] flex-shrink-0" />}
                        {/* Vendor columns */}
                        <div className={`flex-1 grid ${gridColsClass} gap-1 xs:gap-1.5 sm:gap-2 h-full overflow-visible`}>
                          {activeVendors.map((vendor, idx) => (
                            <div key={`watermark-${category}-${idx}-${vendor.id}`} className="relative h-full flex items-start justify-center pt-6 sm:pt-8 overflow-visible">
                              <span
                                style={{
                                  color: vendor.color.hex,
                                  writingMode: 'vertical-rl',
                                }}
                                className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold opacity-[0.15] whitespace-nowrap [transform:rotate(180deg)_translateX(-70%)] md:[transform:rotate(180deg)_translateX(-90%)]"
                              >
                                {vendor.name}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Right spacer matching header layout - only on desktop when headers are shown */}
                        {showDesktopHeaders && <div className="hidden lg:block w-10 flex-shrink-0" />}
                      </div>
                      {categoryCriteria.map((criterion, criterionIndex) => {
                        const importance = criterion.importance;

                        return (
                          <div key={criterion.id} className="flex items-stretch gap-2 sm:gap-3">
                            {/* Criterion Card (Left Side) */}
                            <div
                              onClick={() => onCriterionClick?.(criterion.id)}
                              className="flex-shrink-0 w-40 xs:w-44 sm:w-52 lg:w-60 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl px-2 xs:px-3 sm:px-4 py-2 sm:py-3 transition-all hover:shadow-md group cursor-pointer"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onCriterionClick?.(criterion.id);
                                }
                              }}
                            >
                              <div className="flex flex-col gap-1.5 sm:gap-2">
                                {/* Header: Name + Icons */}
                                <div className="flex items-start justify-between gap-1.5">
                                  <h5 className="text-[11px] xs:text-xs sm:text-sm font-semibold text-gray-900 text-left flex-1 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight">
                                    {criterion.name}
                                  </h5>

                                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                    {/* Signal Antenna */}
                                    <SignalAntenna importance={importance} />

                                    {/* AI Edit Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCriterionClick?.(criterion.id);
                                      }}
                                      className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-gray-100"
                                      title="Edit criterion"
                                    >
                                      <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Description */}
                                {criterion.description && (
                                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 text-left line-clamp-2 leading-relaxed">
                                    {criterion.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Left spacers matching header layout - only on desktop when headers are shown */}
                            {/* Gap div (w-2 sm:w-3) + flex gap (gap-2 sm:gap-3) + Navigation button spacer (w-8) + flex gap */}
                            {showDesktopHeaders && <div className="hidden lg:block w-[52px] sm:w-[60px] flex-shrink-0" />}

                            {/* Vendor Columns - Icon/Text Display */}
                            <div className={`flex-1 grid ${gridColsClass} gap-1 xs:gap-1.5 sm:gap-2 items-center min-h-[40px] xs:min-h-[50px] sm:min-h-[60px] relative z-10`}>
                              {activeVendors.map((vendor, vendorIndex) => {
                                const state = vendor.scores.get(criterion.id) ?? 'unknown';
                                const hasScoreDetails = vendor.scoreDetails && vendor.scoreDetails[criterion.id];
                                const comparisonStatus = vendor.comparisonStatus;

                                return (
                                  <div key={`vendor-${vendorIndex}`} className="min-w-0">
                                    {/* Icon Cell - clickable when score details exist */}
                                    <div
                                      className={`w-full h-8 xs:h-9 sm:h-10 flex items-center justify-center ${hasScoreDetails ? 'cursor-pointer hover:bg-gray-100/50 rounded-md transition-colors' : ''}`}
                                      onClick={() => {
                                        if (hasScoreDetails && onScoreClick) {
                                          onScoreClick(vendor.id, criterion.id, vendor.name, criterion.name);
                                        }
                                      }}
                                      title={hasScoreDetails ? 'Click to view evidence' : undefined}
                                    >
                                      {renderCriterionState(state, criterionIndex, vendorIndex, comparisonStatus)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Right spacer matching header layout - only on desktop when headers are shown */}
                            {showDesktopHeaders && <div className="hidden lg:block w-10 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom Legend - All Vendors */}
      <div className="border-t-2 border-gray-200 bg-gray-50 px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex gap-2 xs:gap-3 sm:gap-4 justify-center flex-wrap">
          {activeVendors.map((vendor) => {
            return (
              <div key={vendor.id} className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                <div
                  style={{ backgroundColor: vendor.color.hex }}
                  className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 rounded shadow-sm flex-shrink-0"
                />
                <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium text-gray-700 truncate max-w-[60px] xs:max-w-[80px] sm:max-w-[100px]">
                  {vendor.name}
                </span>
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-500 flex-shrink-0">
                  {vendor.matchPercentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
