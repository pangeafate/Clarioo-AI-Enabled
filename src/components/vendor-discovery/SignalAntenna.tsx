/**
 * SignalAntenna Component - Priority Visual Indicator
 *
 * @purpose Visual representation of criterion importance using signal bars
 * @design 1-3 vertical bars filled based on importance level
 *
 * VISUAL DESIGN (SP_012):
 * - Low:    ■ ▢ ▢ (1 bar filled - gray/low priority)
 * - Medium: ■ ■ ▢ (2 bars filled - yellow/warning)
 * - High:   ■ ■ ■ (3 bars filled - red/high priority)
 *
 * IMPLEMENTATION:
 * - Bar heights: 8px, 12px, 16px (ascending)
 * - Bar width: 6px each
 * - Gap: 2px between bars
 * - Colors: Low=#94A3B8, Medium=#F59E0B, High=#EF4444
 */

import React from 'react';

export interface SignalAntennaProps {
  importance: 'low' | 'medium' | 'high';
  className?: string;
}

export const SignalAntenna: React.FC<SignalAntennaProps> = ({ importance, className = '' }) => {
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

  return (
    <div
      className={`flex items-end gap-0.5 ${className}`}
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
  );
};

export default SignalAntenna;
