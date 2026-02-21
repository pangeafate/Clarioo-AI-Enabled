/**
 * ValidationBadges Component
 *
 * Displays small validation badges around matrix cell icons
 * - Vendor validation: Green circle with "V" at 12 o'clock (top)
 * - Buyer validation: Blue circle with "B" at 9 o'clock (left)
 * - Only visible when system validation is OFF
 */

import React from 'react';
import { CellValidation } from '../../types/validation.types';

interface ValidationBadgesProps {
  validation: CellValidation;
  iconSize?: number; // Size of the main icon (badges will be 1/5 of this)
  iconColor?: string; // Color of the orbit (matches icon color)
  fillColor?: string; // Color of the filled ring between icon and orbit
  children: React.ReactNode; // The icon element to wrap
}

export const ValidationBadges: React.FC<ValidationBadgesProps> = ({
  validation,
  iconSize = 20,
  iconColor = 'rgb(156, 163, 175)', // Default gray
  fillColor = 'rgb(243, 244, 246)', // Default light gray
  children,
}) => {
  // Don't show badges if system validation is ON
  if (validation.system) {
    return <>{children}</>;
  }

  const badgeSize = (iconSize / 5) * 1.3; // Badges are 1/5 the size of the icon, increased by 30%

  // Single orbit radius for all badges
  const orbitRadius = iconSize / 2 + badgeSize / 2 + 6;

  // Calculate SVG container size to fit the orbit
  const svgSize = orbitRadius * 2 + badgeSize;

  // Calculate gap size for badges (in degrees)
  const gapAngle = (badgeSize / orbitRadius) * (180 / Math.PI) * 1.5; // Gap for badge

  // Helper to create arc segments with multiple gaps
  const createOrbitWithGaps = () => {
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const gaps = [
      { angle: -90, active: validation.vendorValidation }, // 12 o'clock
      { angle: 0, active: validation.expertValidation },    // 3 o'clock
      { angle: 180, active: validation.buyerValidation },   // 9 o'clock
    ];

    // Filter to only active gaps
    const activeGaps = gaps.filter(g => g.active).map(g => g.angle);

    if (activeGaps.length === 0) {
      // No gaps, draw full circle
      return (
        <circle
          cx={centerX}
          cy={centerY}
          r={orbitRadius}
          fill="none"
          stroke={iconColor}
          strokeWidth="1"
          opacity="0.0875"
        />
      );
    }

    // Sort gaps by angle
    const sortedGaps = [...activeGaps].sort((a, b) => a - b);

    // Create arc segments between gaps
    const segments = [];
    for (let i = 0; i < sortedGaps.length; i++) {
      const currentGapAngle = sortedGaps[i];
      const nextGapAngle = sortedGaps[(i + 1) % sortedGaps.length];

      // End of current gap
      const startAngle = currentGapAngle + gapAngle / 2;
      // Start of next gap
      let endAngle = nextGapAngle - gapAngle / 2;

      // Handle wrap-around
      if (i === sortedGaps.length - 1) {
        endAngle = sortedGaps[0] + 360 - gapAngle / 2;
      }

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + orbitRadius * Math.cos(startRad);
      const y1 = centerY + orbitRadius * Math.sin(startRad);
      const x2 = centerX + orbitRadius * Math.cos(endRad);
      const y2 = centerY + orbitRadius * Math.sin(endRad);

      const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

      segments.push(
        <path
          key={i}
          d={`M ${x1} ${y1} A ${orbitRadius} ${orbitRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
          fill="none"
          stroke={iconColor}
          strokeWidth="1"
          opacity="0.0875"
        />
      );
    }

    return <>{segments}</>;
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Single orbital ring with gaps at badge positions */}
      {(validation.vendorValidation || validation.buyerValidation || validation.expertValidation) && (
        <svg
          className="absolute pointer-events-none"
          style={{
            width: `${svgSize}px`,
            height: `${svgSize}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }}
        >
          <defs>
            {/* Mask to create ring shape (donut) */}
            <mask id={`ring-mask-${iconSize}`}>
              <rect width="100%" height="100%" fill="white" />
              {/* Black circle in center to cut out the hole */}
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={iconSize / 2}
                fill="black"
              />
            </mask>
          </defs>

          {/* Filled ring between icon and orbit */}
          {/* <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={orbitRadius}
            fill={fillColor}
            opacity="0.49"
            mask={`url(#ring-mask-${iconSize})`}
          /> */}

          {createOrbitWithGaps()}
        </svg>
      )}

      {/* Main icon */}
      <div style={{ zIndex: 10, position: 'relative' }}>
        {children}
      </div>

      {/* Vendor Validation Badge - 12 o'clock (top) */}
      {validation.vendorValidation && (
        <div
          className="absolute flex items-center justify-center bg-green-500 text-white rounded-full font-bold"
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            fontSize: `${badgeSize * 0.6}px`,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${orbitRadius}px))`,
          }}
        >
          V
        </div>
      )}

      {/* Buyer Validation Badge - 9 o'clock (left) */}
      {validation.buyerValidation && (
        <div
          className="absolute flex items-center justify-center bg-blue-500 text-white rounded-full font-bold"
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            fontSize: `${badgeSize * 0.6}px`,
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% - ${orbitRadius}px), -50%)`,
          }}
        >
          B
        </div>
      )}

      {/* Expert Validation Badge - 3 o'clock (right) */}
      {validation.expertValidation && (
        <div
          className="absolute flex items-center justify-center bg-orange-500 text-white rounded-full font-bold"
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            fontSize: `${badgeSize * 0.6}px`,
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${orbitRadius}px), -50%)`,
          }}
        >
          E
        </div>
      )}
    </div>
  );
};
