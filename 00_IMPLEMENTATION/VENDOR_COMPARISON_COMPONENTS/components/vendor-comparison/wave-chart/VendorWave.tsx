/**
 * VendorWave Component
 * Sprint: SP_015
 *
 * Renders a single vendor's wave path using Catmull-Rom spline interpolation
 * Displays smooth curve passing through all criterion score points
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  WavePoint,
  ChartDimensions,
  SplineConfig,
  DEFAULT_SPLINE_CONFIG,
  WaveAnimationConfig,
  DEFAULT_ANIMATION_CONFIG,
} from '../../../types/comparison.types';
import { generateCatmullRomPath } from '../../../utils/splineInterpolation';
import { Criterion } from '../../../types';

interface VendorWaveProps {
  vendorId: string;
  vendorName: string;
  criteria: Criterion[];
  scores: Map<string, number>; // Map<criterionId, score (0-100)>
  dimensions: ChartDimensions;
  color: string;
  splineConfig?: SplineConfig;
  animationConfig?: WaveAnimationConfig;
  opacity?: number;
  strokeWidth?: number;
  showDataPoints?: boolean; // Show dots at each criterion point
  onPointHover?: (point: WavePoint | null) => void;
  onPointClick?: (criterionId: string) => void;
}

export const VendorWave: React.FC<VendorWaveProps> = ({
  vendorId,
  vendorName,
  criteria,
  scores,
  dimensions,
  color,
  splineConfig = DEFAULT_SPLINE_CONFIG,
  animationConfig = DEFAULT_ANIMATION_CONFIG,
  opacity = 0.9,
  strokeWidth = 3,
  showDataPoints = true,
  onPointHover,
  onPointClick,
}) => {
  const { paddingLeft, paddingTop, chartWidth, chartHeight } = dimensions;

  // Generate wave points from criteria and scores
  const wavePoints: WavePoint[] = useMemo(() => {
    const numCriteria = criteria.length;

    return criteria.map((criterion, index) => {
      const score = scores.get(criterion.id) ?? 50; // Default to 50% if score missing

      // Calculate X position (evenly distributed)
      const x = (chartWidth / (numCriteria - 1)) * index;

      // Calculate Y position (inverted: 100% at top, 0% at bottom)
      const y = chartHeight - (score / 100) * chartHeight;

      return {
        x,
        y,
        criterionId: criterion.id,
        criterionName: criterion.name,
        score,
        vendorId,
      };
    });
  }, [criteria, scores, chartWidth, chartHeight, vendorId]);

  // Generate smooth SVG path using Catmull-Rom spline
  const pathData = useMemo(() => {
    return generateCatmullRomPath(wavePoints, splineConfig);
  }, [wavePoints, splineConfig]);

  // Animation variants for framer-motion
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity,
      transition: {
        pathLength: {
          duration: animationConfig.duration / 1000,
          ease: animationConfig.easing === 'spring' ? [0.4, 0, 0.2, 1] : animationConfig.easing,
        },
        opacity: {
          duration: 0.2,
        },
      },
    },
  };

  const springTransition = animationConfig.easing === 'spring' ? {
    type: 'spring',
    stiffness: animationConfig.stiffness ?? 300,
    damping: animationConfig.damping ?? 30,
  } : undefined;

  return (
    <g className="vendor-wave" data-vendor-id={vendorId} data-vendor-name={vendorName}>
      {/* Wave path */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        transform={`translate(${paddingLeft}, ${paddingTop})`}
        variants={pathVariants}
        initial="hidden"
        animate="visible"
        transition={springTransition}
      />

      {/* Data points at each criterion */}
      {showDataPoints &&
        wavePoints.map((point, index) => (
          <motion.circle
            key={`${vendorId}-point-${point.criterionId}`}
            cx={paddingLeft + point.x}
            cy={paddingTop + point.y}
            r={4}
            fill={color}
            stroke="#ffffff"
            strokeWidth={2}
            className="cursor-pointer hover:r-6 transition-all"
            data-criterion-id={point.criterionId}
            data-score={point.score}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.05,
              duration: 0.3,
              ...springTransition,
            }}
            whileHover={{ scale: 1.5 }}
            onHoverStart={() => onPointHover?.(point)}
            onHoverEnd={() => onPointHover?.(null)}
            onClick={() => onPointClick?.(point.criterionId)}
          />
        ))}
    </g>
  );
};
