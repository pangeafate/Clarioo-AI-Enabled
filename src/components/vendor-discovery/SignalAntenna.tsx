/**
 * SignalAntenna Component - Priority Visual Indicator with +/- Controls
 *
 * @purpose Visual representation of criterion importance using signal bars
 * @design 1-3 vertical bars filled based on importance level
 *
 * VISUAL DESIGN (SP_012):
 * - Low:    ■ ▢ ▢ (1 bar filled - gray/low priority)
 * - Medium: ■ ■ ▢ (2 bars filled - yellow/warning)
 * - High:   ■ ■ ■ (3 bars filled - red/high priority)
 *
 * INTERACTION (SP_014):
 * - Click antenna → shows +/- popover
 * - + button: low → medium → high (stops at high)
 * - - button: high → medium → low → archived
 * - Popover auto-hides after 3 seconds
 *
 * IMPLEMENTATION:
 * - Bar heights: 8px, 12px, 16px (ascending)
 * - Bar width: 6px each
 * - Gap: 2px between bars
 * - Colors: Low=#94A3B8, Medium=#F59E0B, High=#EF4444
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SignalAntennaProps {
  importance: 'low' | 'medium' | 'high';
  className?: string;
  onImportanceChange?: (newImportance: 'low' | 'medium' | 'high' | 'archive') => void;
  isInteractive?: boolean;
}

export const SignalAntenna: React.FC<SignalAntennaProps> = ({
  importance,
  className = '',
  onImportanceChange,
  isInteractive = false
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const antennaRef = useRef<HTMLDivElement>(null);

  // Calculate number of filled bars based on importance
  const filledBars = importance === 'high' ? 3 : importance === 'medium' ? 2 : 1;

  // Color scheme based on importance
  const getBarColor = (barIndex: number): string => {
    if (barIndex >= filledBars) {
      return 'bg-gray-200'; // Unfilled bars
    }

    // Filled bars - color based on final importance level
    if (importance === 'high') return 'bg-destructive'; // Red for high
    if (importance === 'medium') return 'bg-warning'; // Yellow for medium
    return 'bg-gray-400'; // Gray for low
  };

  // Reset auto-hide timer
  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 3000);
  };

  // Handle click on antenna
  const handleAntennaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInteractive || !onImportanceChange) return;

    if (!showPopover && antennaRef.current) {
      // Calculate position for portal
      const rect = antennaRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8, // 8px below the antenna
        left: rect.right - 70 // Align right edge (popover is ~70px wide)
      });
      resetTimer();
    }
    setShowPopover(!showPopover);
  };

  // Handle increase importance
  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onImportanceChange) return;

    if (importance === 'low') {
      onImportanceChange('medium');
    } else if (importance === 'medium') {
      onImportanceChange('high');
    }
    // If already high, do nothing
    resetTimer();
  };

  // Handle decrease importance
  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onImportanceChange) return;

    if (importance === 'high') {
      onImportanceChange('medium');
    } else if (importance === 'medium') {
      onImportanceChange('low');
    } else if (importance === 'low') {
      onImportanceChange('archive');
      setShowPopover(false);
    }
    resetTimer();
  };

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both the container and the portal popover
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
      // Check if the click target is inside a popover (portal renders directly to body)
      const isInsidePopover = (target as Element).closest?.('.bg-white.rounded-lg.shadow-lg');

      if (isOutsideContainer && !isInsidePopover) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showPopover]);

  return (
    <div ref={containerRef} className="relative">
      <div
        ref={antennaRef}
        onClick={handleAntennaClick}
        className={`flex items-end gap-0.5 opacity-60 ${isInteractive ? 'cursor-pointer hover:opacity-100' : ''} ${className}`}
        role="img"
        aria-label={`${importance} importance`}
        title={`Priority: ${importance.charAt(0).toUpperCase() + importance.slice(1)}`}
      >
        {/* Bar 1 - Shortest (8px) */}
        <div
          className={`w-1.5 h-2 rounded-sm transition-colors ${getBarColor(0)}`}
        />

        {/* Bar 2 - Medium (12px) */}
        <div
          className={`w-1.5 h-3 rounded-sm transition-colors ${getBarColor(1)}`}
        />

        {/* Bar 3 - Tallest (16px) */}
        <div
          className={`w-1.5 h-4 rounded-sm transition-colors ${getBarColor(2)}`}
        />
      </div>

      {/* +/- Popover - rendered via portal to escape overflow-hidden */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showPopover && isInteractive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -5 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: popoverPosition.top,
                left: popoverPosition.left,
              }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex items-center gap-1 z-[9999]"
            >
              {/* Tooltip arrow pointing up */}
              <div className="absolute bottom-full right-2 mb-[-1px]">
                <div className="border-4 border-transparent border-b-white" />
              </div>

              {/* Minus button */}
              <button
                onClick={handleDecrease}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Decrease importance"
              >
                <Minus className="h-3.5 w-3.5 text-gray-600" />
              </button>

              {/* Plus button */}
              <button
                onClick={handleIncrease}
                disabled={importance === 'high'}
                className={`p-1.5 rounded transition-colors ${
                  importance === 'high'
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
                title="Increase importance"
              >
                <Plus className="h-3.5 w-3.5 text-gray-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default SignalAntenna;
