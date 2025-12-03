/**
 * ChartGrid Component
 * Sprint: SP_015
 *
 * Renders visual grid for wave chart with Y-axis (0-100%) and X-axis (criteria labels)
 * Provides visual reference for interpreting vendor match scores
 */

import React from 'react';
import { ChartDimensions, DEFAULT_WAVE_COLORS } from '../../../types/comparison.types';
import { Criterion } from '../../../types';

interface ChartGridProps {
  dimensions: ChartDimensions;
  criteria: Criterion[];
  yAxisSteps?: number; // Number of horizontal grid lines (default 5)
  truncateLabelAt?: number; // Truncate criterion labels at N characters
  colors?: {
    grid?: string;
    axis?: string;
    text?: string;
  };
}

export const ChartGrid: React.FC<ChartGridProps> = ({
  dimensions,
  criteria,
  yAxisSteps = 5,
  truncateLabelAt = 16,
  colors = {},
}) => {
  const {
    paddingLeft,
    paddingTop,
    chartWidth,
    chartHeight,
  } = dimensions;

  const gridColor = colors.grid ?? DEFAULT_WAVE_COLORS.grid;
  const axisColor = colors.axis ?? DEFAULT_WAVE_COLORS.axis;
  const textColor = colors.text ?? DEFAULT_WAVE_COLORS.text;

  // Calculate Y-axis grid lines (horizontal lines at 0%, 25%, 50%, 75%, 100%)
  const yAxisValues: number[] = [];
  for (let i = 0; i <= yAxisSteps; i++) {
    yAxisValues.push((i / yAxisSteps) * 100);
  }

  // Calculate X-axis positions for criterion labels
  const xAxisPositions: { x: number; label: string; criterionId: string }[] = [];
  const numCriteria = criteria.length;

  criteria.forEach((criterion, index) => {
    const x = (chartWidth / (numCriteria - 1)) * index;
    let label = criterion.name;

    // Truncate label if too long for mobile
    if (label.length > truncateLabelAt) {
      label = label.substring(0, truncateLabelAt) + '...';
    }

    xAxisPositions.push({
      x,
      label,
      criterionId: criterion.id,
    });
  });

  return (
    <g className="chart-grid">
      {/* Horizontal grid lines (Y-axis) */}
      {yAxisValues.map((value, index) => {
        const y = chartHeight - (value / 100) * chartHeight;

        return (
          <g key={`y-grid-${index}`}>
            {/* Grid line */}
            <line
              x1={paddingLeft}
              y1={paddingTop + y}
              x2={paddingLeft + chartWidth}
              y2={paddingTop + y}
              stroke={gridColor}
              strokeWidth={value === 0 || value === 100 ? 1.5 : 0.5}
              strokeDasharray={value === 0 || value === 100 ? 'none' : '4 2'}
            />

            {/* Y-axis label */}
            <text
              x={paddingLeft - 8}
              y={paddingTop + y}
              textAnchor="end"
              dominantBaseline="middle"
              fill={textColor}
              fontSize="11"
              fontWeight={value === 0 || value === 100 ? '600' : '400'}
              className="select-none"
            >
              {value}%
            </text>
          </g>
        );
      })}

      {/* Vertical grid lines at criterion positions (X-axis) */}
      {xAxisPositions.map((position, index) => {
        const isFirst = index === 0;
        const isLast = index === xAxisPositions.length - 1;

        return (
          <g key={`x-grid-${position.criterionId}`}>
            {/* Vertical grid line */}
            <line
              x1={paddingLeft + position.x}
              y1={paddingTop}
              x2={paddingLeft + position.x}
              y2={paddingTop + chartHeight}
              stroke={gridColor}
              strokeWidth={isFirst || isLast ? 1.5 : 0.5}
              strokeDasharray={isFirst || isLast ? 'none' : '4 2'}
            />
          </g>
        );
      })}

      {/* X-axis labels (criterion names) */}
      <g className="x-axis-labels">
        {xAxisPositions.map((position, index) => {
          const rotate = xAxisPositions.length > 8; // Rotate labels if many criteria

          return (
            <text
              key={`x-label-${position.criterionId}`}
              x={paddingLeft + position.x}
              y={paddingTop + chartHeight + (rotate ? 32 : 20)}
              textAnchor={rotate ? 'start' : 'middle'}
              dominantBaseline="middle"
              fill={textColor}
              fontSize="10"
              fontWeight="500"
              className="select-none cursor-pointer hover:fill-indigo-600 transition-colors"
              transform={rotate ? `rotate(-45 ${paddingLeft + position.x} ${paddingTop + chartHeight + 32})` : ''}
              data-criterion-id={position.criterionId}
            >
              {position.label}
            </text>
          );
        })}
      </g>

      {/* Y-axis title */}
      <text
        x={paddingLeft - 40}
        y={paddingTop + chartHeight / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize="11"
        fontWeight="600"
        transform={`rotate(-90 ${paddingLeft - 40} ${paddingTop + chartHeight / 2})`}
        className="select-none"
      >
        Match Score (%)
      </text>

      {/* X-axis title */}
      <text
        x={paddingLeft + chartWidth / 2}
        y={paddingTop + chartHeight + (xAxisPositions.length > 8 ? 56 : 36)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize="11"
        fontWeight="600"
        className="select-none"
      >
        Evaluation Criteria
      </text>
    </g>
  );
};
