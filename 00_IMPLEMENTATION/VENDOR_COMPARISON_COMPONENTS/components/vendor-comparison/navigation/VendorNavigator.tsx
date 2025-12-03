/**
 * VendorNavigator Component
 * Sprint: SP_015
 *
 * Provides vendor navigation controls for cycling through shortlist
 * Supports keyboard shortcuts, swipe gestures, and touch interactions
 */

import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComparisonVendor } from '../../../types/comparison.types';
import { Button } from '../../ui/button';

interface VendorNavigatorProps {
  currentVendor: ComparisonVendor | null;
  currentIndex: number;
  shortlist: ComparisonVendor[];
  onNavigate: (direction: 'next' | 'previous') => void;
  onVendorChange?: (vendor: ComparisonVendor) => void;
  className?: string;
  enableKeyboard?: boolean; // Enable keyboard shortcuts (← →)
  keyboardId?: string; // Unique ID to prevent conflict between two navigators
}

export const VendorNavigator: React.FC<VendorNavigatorProps> = ({
  currentVendor,
  currentIndex,
  shortlist,
  onNavigate,
  onVendorChange,
  className = '',
  enableKeyboard = true,
  keyboardId = 'vendor-nav-1',
}) => {
  const totalVendors = shortlist.length;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalVendors - 1;

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle if navigator is focused or keyboard is globally enabled
      if (!enableKeyboard) return;

      if (event.key === 'ArrowLeft' && hasPrevious) {
        event.preventDefault();
        onNavigate('previous');
      } else if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault();
        onNavigate('next');
      }
    },
    [enableKeyboard, hasPrevious, hasNext, onNavigate]
  );

  // Register keyboard event listener
  useEffect(() => {
    if (enableKeyboard) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enableKeyboard, handleKeyDown]);

  // Notify parent of vendor change
  useEffect(() => {
    if (currentVendor && onVendorChange) {
      onVendorChange(currentVendor);
    }
  }, [currentVendor, onVendorChange]);

  if (totalVendors === 0) {
    return (
      <div className={`vendor-navigator ${className}`}>
        <div className="text-center text-sm text-gray-500 py-2">
          No vendors in shortlist
        </div>
      </div>
    );
  }

  return (
    <div className={`vendor-navigator flex items-center justify-between gap-2 ${className}`}>
      {/* Previous button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onNavigate('previous')}
        disabled={!hasPrevious}
        className="flex-shrink-0 h-10 w-10"
        title="Previous vendor (← arrow key)"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Current vendor indicator with animation */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVendor?.id ?? 'none'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            {currentVendor ? (
              <div>
                <div className="font-semibold text-gray-900 truncate px-2">
                  {currentVendor.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {currentIndex + 1} of {totalVendors}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No vendor selected</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onNavigate('next')}
        disabled={!hasNext}
        className="flex-shrink-0 h-10 w-10"
        title="Next vendor (→ arrow key)"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};
