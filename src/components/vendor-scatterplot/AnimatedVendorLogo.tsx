/**
 * AnimatedVendorLogo Component
 * Sprint: SP_026
 *
 * Individual vendor logo with animations:
 * - Circling: Rotates around chart center during loading
 * - Flying: Animates to final position after n8n returns
 * - Selection: Blue halo when selected
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { AnimatedVendorLogoProps } from '../../types/vendorScatterplot.types';

const SELECTION_COLOR = '#3B82F6'; // Blue-500 for selection halo

export const AnimatedVendorLogo: React.FC<AnimatedVendorLogoProps> = ({
  vendor,
  position,
  isSelected,
  isCircling,
  circleAngle = 0,
  onClick,
  logoSize,
  circleRadius,
  labelFontSize,
}) => {
  // Calculate inner image size (70% of logo container)
  const innerImageSize = Math.round(logoSize * 0.7);

  // Calculate circling position (continuous rotation around center point)
  // Circling happens at chart center, position.x/y will be center coordinates
  const circlingX = position.x + Math.cos(circleAngle * Math.PI / 180) * circleRadius;
  const circlingY = position.y + Math.sin(circleAngle * Math.PI / 180) * circleRadius;

  // Animation variants
  const variants = {
    circling: {
      x: circlingX - logoSize / 2, // Center logo on point
      y: circlingY - logoSize / 2,
      scale: 0.9,
      opacity: 0.8,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
    positioned: {
      x: position.x - logoSize / 2, // Center logo on final position
      y: position.y - logoSize / 2,
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
        duration: 1.2,
      },
    },
  };

  return (
    <motion.div
      initial={isCircling ? 'circling' : 'positioned'}
      animate={isCircling ? 'circling' : 'positioned'}
      variants={variants}
      onClick={() => onClick(vendor.id)}
      className="absolute cursor-pointer"
      style={{
        width: logoSize,
        height: logoSize, // Keep square
      }}
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1 },
      }}
    >
      {/* Outer container with selection border */}
      <div
        className={`
          w-full h-full rounded-full
          flex items-center justify-center
          bg-white shadow-md
          transition-all duration-200
        `}
        style={{
          borderWidth: isSelected ? Math.max(Math.round(logoSize * 0.045), 2) : Math.max(Math.round(logoSize * 0.03), 1),
          borderColor: isSelected ? SELECTION_COLOR : '#E5E7EB',
          boxShadow: isSelected
            ? `0 0 0 ${Math.max(Math.round(logoSize * 0.06), 2)}px rgba(59, 130, 246, 0.6)`
            : undefined,
        }}
      >
        {/* Logo image */}
        {vendor.website && (
          <img
            src={`https://img.logo.dev/${vendor.website.replace(/^https?:\/\//, '').split('/')[0]}?token=pk_Fvbs8Zl6SWiC5WEoP8Qzbg`}
            alt={`${vendor.name} logo`}
            className="rounded-full object-contain bg-white"
            style={{ width: innerImageSize, height: innerImageSize }}
            onError={(e) => {
              // Fallback to initials if logo fails to load
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLDivElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
        )}

        {/* Fallback: Vendor initials */}
        <div
          className="rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold"
          style={{
            display: 'none',
            width: innerImageSize,
            height: innerImageSize,
            fontSize: Math.max(innerImageSize * 0.3, 10), // Scale font size
          }}
        >
          {vendor.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)}
        </div>
      </div>

      {/* Vendor name below bubble (always visible, same grey as grid descriptions) */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none text-center overflow-hidden"
        style={{
          top: logoSize + 4,
          maxWidth: `${logoSize * 3}px`, // Limit width to 3x logo diameter
        }}
      >
        <p
          className="font-normal text-muted-foreground truncate"
          style={{ fontSize: `${labelFontSize}px` }}
        >
          {vendor.name}
        </p>
      </div>
    </motion.div>
  );
};
