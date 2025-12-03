/**
 * WaveChart Component
 * Sprint: SP_015
 *
 * Main container for wave chart visualization
 * Orchestrates ChartGrid, VendorWave, and other sub-components
 * Handles responsive dimensions and user interactions
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChartDimensions,
  ComparisonVendor,
  WavePoint,
  RESPONSIVE_BREAKPOINTS,
  DEFAULT_WAVE_COLORS,
} from '../../../types/comparison.types';
import { Criterion } from '../../../types';
import { ChartGrid } from './ChartGrid';
import { VendorWave } from './VendorWave';

interface WaveChartProps {
  vendor: ComparisonVendor | null;
  criteria: Criterion[];
  scores: Map<string, number>; // Map<criterionId, score>
  onCriterionClick?: (criterionId: string) => void;
  onPointHover?: (point: WavePoint | null) => void;
  className?: string;
}

export const WaveChart: React.FC<WaveChartProps> = ({
  vendor,
  criteria,
  scores,
  onCriterionClick,
  onPointHover,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Determine current breakpoint based on container width
  const currentBreakpoint = useMemo(() => {
    return (
      RESPONSIVE_BREAKPOINTS.find(
        bp =>
          containerWidth >= bp.minWidth &&
          (bp.maxWidth === undefined || containerWidth <= bp.maxWidth)
      ) ?? RESPONSIVE_BREAKPOINTS[0]
    );
  }, [containerWidth]);

  // Calculate chart dimensions based on current breakpoint
  const dimensions: ChartDimensions = useMemo(() => {
    const bp = currentBreakpoint.chartDimensions;
    const width = Math.min(containerWidth, bp.width);
    const height = bp.height;

    return {
      width,
      height,
      paddingTop: bp.paddingTop,
      paddingRight: bp.paddingRight,
      paddingBottom: bp.paddingBottom,
      paddingLeft: bp.paddingLeft,
      chartWidth: width - bp.paddingLeft - bp.paddingRight,
      chartHeight: height - bp.paddingTop - bp.paddingBottom,
    };
  }, [currentBreakpoint, containerWidth]);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Initial measurement
    updateWidth();

    // Resize observer for responsive updates
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle criterion label click
  const handleCriterionClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const target = event.target as SVGElement;
    const criterionId = target.getAttribute('data-criterion-id');

    if (criterionId && onCriterionClick) {
      onCriterionClick(criterionId);
    }
  };

  // Show empty state if no vendor
  if (!vendor) {
    return (
      <div
        ref={containerRef}
        className={`wave-chart-container flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}
        style={{ minHeight: '320px' }}
      >
        <div className="text-center px-6 py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900">No vendor selected</h3>
          <p className="mt-2 text-sm text-gray-500">
            Select a vendor to view match visualization
          </p>
        </div>
      </div>
    );
  }

  // Show loading state if no criteria
  if (criteria.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`wave-chart-container flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ minHeight: '320px' }}
      >
        <div className="text-center px-6 py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-sm text-gray-500">Loading criteria...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`wave-chart-container ${className}`}>
      {/* Vendor header with match percentage */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vendor.logo && (
            <img
              src={vendor.logo}
              alt={vendor.name}
              className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-200 p-1"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
            <p className="text-sm text-gray-500">Match Analysis</p>
          </div>
        </div>

        {/* Overall match percentage */}
        <div className="text-right">
          <div className="text-3xl font-bold text-indigo-600">
            {vendor.matchPercentage}%
          </div>
          <div className="text-xs text-gray-500 font-medium">Overall Match</div>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="wave-chart-svg bg-white rounded-lg border border-gray-200 shadow-sm"
        onClick={handleCriterionClick}
      >
        {/* Chart grid with axes */}
        <ChartGrid
          dimensions={dimensions}
          criteria={criteria}
          truncateLabelAt={currentBreakpoint.truncateLabelAt}
          colors={{
            grid: DEFAULT_WAVE_COLORS.grid,
            axis: DEFAULT_WAVE_COLORS.axis,
            text: DEFAULT_WAVE_COLORS.text,
          }}
        />

        {/* Vendor wave */}
        <VendorWave
          vendorId={vendor.id}
          vendorName={vendor.name}
          criteria={criteria}
          scores={scores}
          dimensions={dimensions}
          color={DEFAULT_WAVE_COLORS.vendor1}
          onPointHover={onPointHover}
          onPointClick={onCriterionClick}
        />
      </svg>

      {/* Breakpoint indicator (dev only - remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          {currentBreakpoint.name} | {containerWidth}px
        </div>
      )}
    </div>
  );
};
