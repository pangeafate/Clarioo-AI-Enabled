/**
 * VendorIndicator Component
 * Sprint: SP_015
 *
 * Visual indicator showing current vendor position in shortlist
 * Displays dots/progress bar for visual reference
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ComparisonVendor } from '../../../types/comparison.types';

interface VendorIndicatorProps {
  currentIndex: number;
  totalVendors: number;
  shortlist: ComparisonVendor[];
  onSelect?: (index: number) => void; // Optional: click dot to jump to vendor
  variant?: 'dots' | 'bar'; // Display style
  className?: string;
}

export const VendorIndicator: React.FC<VendorIndicatorProps> = ({
  currentIndex,
  totalVendors,
  shortlist,
  onSelect,
  variant = 'dots',
  className = '',
}) => {
  if (totalVendors === 0) return null;

  // Limit dots to 5 for mobile readability
  const maxDots = 5;
  const showAllDots = totalVendors <= maxDots;

  if (variant === 'bar') {
    const progressPercentage = ((currentIndex + 1) / totalVendors) * 100;

    return (
      <div className={`vendor-indicator-bar ${className}`}>
        {/* Progress bar */}
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Position text */}
        <div className="mt-1 text-center text-xs text-gray-500">
          {currentIndex + 1} / {totalVendors}
        </div>
      </div>
    );
  }

  // Dots variant
  return (
    <div className={`vendor-indicator-dots flex items-center justify-center gap-2 ${className}`}>
      {showAllDots ? (
        // Show all dots if <= 5 vendors
        shortlist.map((vendor, index) => (
          <button
            key={vendor.id}
            onClick={() => onSelect?.(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-indigo-600 w-6'
                : 'bg-gray-300 hover:bg-gray-400'
            } ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
            title={vendor.name}
            disabled={!onSelect}
          />
        ))
      ) : (
        // Show condensed dots for many vendors
        <>
          {/* First dot (always visible) */}
          <button
            onClick={() => onSelect?.(0)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentIndex === 0
                ? 'bg-indigo-600 w-6'
                : 'bg-gray-300 hover:bg-gray-400'
            } ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
            title={shortlist[0]?.name}
            disabled={!onSelect}
          />

          {/* Ellipsis if current is in middle */}
          {currentIndex > 1 && currentIndex < totalVendors - 2 && (
            <span className="text-gray-400 text-xs">···</span>
          )}

          {/* Current dot (if not first or last) */}
          {currentIndex > 0 && currentIndex < totalVendors - 1 && (
            <div
              className="w-2 h-2 rounded-full bg-indigo-600 w-6"
              title={shortlist[currentIndex]?.name}
            />
          )}

          {/* Ellipsis before last */}
          {currentIndex < totalVendors - 2 && (
            <span className="text-gray-400 text-xs">···</span>
          )}

          {/* Last dot (always visible) */}
          <button
            onClick={() => onSelect?.(totalVendors - 1)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentIndex === totalVendors - 1
                ? 'bg-indigo-600 w-6'
                : 'bg-gray-300 hover:bg-gray-400'
            } ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
            title={shortlist[totalVendors - 1]?.name}
            disabled={!onSelect}
          />
        </>
      )}

      {/* Position text */}
      <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
        {currentIndex + 1}/{totalVendors}
      </span>
    </div>
  );
};
