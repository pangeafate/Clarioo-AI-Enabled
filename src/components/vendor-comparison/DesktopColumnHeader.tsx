/**
 * DesktopColumnHeader Component
 * Sprint: SP_015 (Desktop Enhancement)
 *
 * Column header for desktop view (≥768px) showing:
 * - Vendor name and match percentage
 * - Navigation arrows to cycle vendors in that column
 * - T-shaped expansion (upward) for vendor details
 * - Placeholder for adding vendors when slot is empty
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Bot, Trash2 } from 'lucide-react';
import { ComparisonVendor } from '../../types/comparison.types';
import { Button } from '../ui/button';

interface DesktopColumnHeaderProps {
  vendor: ComparisonVendor | null;
  currentIndex: number;
  totalVendors: number;
  onNavigate: (direction: 'next' | 'previous') => void;
  onAddVendor?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
  columnPosition?: number; // 0-4 for 5 columns, used for popover positioning
}

export const DesktopColumnHeader: React.FC<DesktopColumnHeaderProps> = ({
  vendor,
  currentIndex,
  totalVendors,
  onNavigate,
  onAddVendor,
  isExpanded,
  onToggleExpand,
  className = '',
  columnPosition = 0,
}) => {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalVendors - 1;
  const popoverRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  // Determine popover alignment based on column position
  // Left columns (0-1): align left, Center column (2): center, Right columns (3-4): align right
  const getPopoverPositionClass = () => {
    if (columnPosition <= 1) {
      return 'left-0'; // Align to left edge
    } else if (columnPosition >= 3) {
      return 'right-0'; // Align to right edge
    } else {
      return 'left-1/2 -translate-x-1/2'; // Center
    }
  };

  // Click outside to close popover
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        cardRef.current &&
        !cardRef.current.contains(target)
      ) {
        onToggleExpand();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, onToggleExpand]);

  // Placeholder card when no vendor
  if (!vendor) {
    return (
      <div className={`desktop-column-header ${className}`}>
        <div className="flex flex-col items-center">
          {/* Empty space for top arrow */}
          <div className="h-5" />

          {/* Placeholder card */}
          <button
            onClick={onAddVendor}
            className="w-full min-h-[60px] border-2 border-dashed border-gray-300 rounded-xl bg-white hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary group"
          >
            <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Add Vendor</span>
          </button>

          {/* Empty space for bottom arrow */}
          <div className="h-5" />
        </div>
      </div>
    );
  }

  return (
    <div className={`desktop-column-header relative ${className}`}>
      {/* Vertical layout: arrow - card - arrow */}
      <div className="flex flex-col items-center">
        {/* Top Arrow (Previous) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('previous')}
          disabled={!hasPrevious}
          className="h-5 w-5 p-0"
        >
          <ChevronLeft className="h-3 w-3 rotate-90" />
        </Button>

        {/* Vendor Card - Clickable for expansion */}
        <motion.button
          ref={cardRef}
          onClick={onToggleExpand}
          style={{
            backgroundColor: vendor.color ? `${vendor.color.hex}15` : '#f3f4f6',
            borderColor: vendor.color?.hex ?? '#d1d5db',
          }}
          className={`w-full border-2 rounded-xl px-2 py-2 min-h-[60px] transition-all hover:shadow-md ${
            isExpanded ? 'ring-2 ring-offset-1' : ''
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div
              style={{ color: vendor.color?.hex ?? '#111827' }}
              className="font-semibold text-sm truncate"
            >
              {vendor.name}
            </div>
            <div
              style={{ color: vendor.color?.hex ?? '#111827' }}
              className="text-xs opacity-80 mt-0.5"
            >
              {vendor.matchPercentage}%
            </div>
          </div>
        </motion.button>

        {/* Bottom Arrow (Next) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('next')}
          disabled={!hasNext}
          className="h-5 w-5 p-0"
        >
          <ChevronRight className="h-3 w-3 rotate-90" />
        </Button>
      </div>

      {/* Popover - appears below the card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full ${getPopoverPositionClass()} mt-2 z-[100] w-72 sm:w-80 lg:w-96`}
          >
            <div
              style={{
                borderColor: vendor.color?.hex ?? '#d1d5db',
              }}
              className="border-2 rounded-xl p-5 sm:p-6 shadow-xl bg-white"
            >
              {/* Vendor Name Header */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <h3
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-lg font-bold"
                  >
                    {vendor.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Handle AI edit for vendor
                      }}
                      className="h-6 w-6 hover:bg-gray-100"
                      title="Edit vendor"
                    >
                      <Bot className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Handle delete vendor
                      }}
                      className="h-6 w-6 hover:bg-red-50"
                      title="Delete vendor"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-sm font-medium"
                  >
                    {vendor.matchPercentage}% Match
                  </span>
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit website
                    </a>
                  )}
                </div>
              </div>

              {/* Killer Feature - temporarily hidden */}
              {/* {vendor.killerFeature && (
                <div className="mb-4">
                  <h4
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-sm font-semibold mb-2"
                  >
                    Key Differentiator
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {vendor.killerFeature}
                  </p>
                </div>
              )} */}

              {/* Executive Summary */}
              {vendor.executiveSummary && (
                <div className="mb-4">
                  <h4
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-sm font-semibold mb-2"
                  >
                    About {vendor.name}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {vendor.executiveSummary}
                  </p>
                </div>
              )}

              {/* Research Insights */}
              {vendor.keyFeatures && vendor.keyFeatures.length > 0 && (
                <div>
                  <h4
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-sm font-semibold mb-2"
                  >
                    Research Insights
                  </h4>
                  <ul className="space-y-2">
                    {vendor.keyFeatures.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span
                          style={{ color: vendor.color?.hex ?? '#6b7280' }}
                          className="text-sm mt-0.5 flex-shrink-0"
                        >
                          •
                        </span>
                        <span className="text-sm text-gray-700 leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
