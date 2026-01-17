/**
 * VendorPositioningScatterPlot Component
 * Sprint: SP_026
 *
 * Main scatter plot component that visualizes vendors on a 2x2 strategic matrix:
 * - X-axis: Solution Scope (Single-Purpose ↔ Multi-Function)
 * - Y-axis: Industry Focus (Vertical-Specific ↔ Multiple Verticals)
 *
 * Features:
 * - Animated vendor logos that circle during loading then fly to positions
 * - Selection synchronization with vendor cards
 * - Responsive design (desktop/mobile)
 * - Collision detection and position adjustment
 * - localStorage caching
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatedVendorLogo } from './AnimatedVendorLogo';
import { processVendorPositions } from '../../utils/scatterPlotPositioning';
import { useVendorScatterplot } from '../../hooks/useVendorScatterplot';
import type {
  VendorPositioningScatterPlotProps,
  VendorPosition,
  ChartDimensions,
} from '../../types/vendorScatterplot.types';
import type { Vendor } from '../../types';

// Animation constants
const CIRCLING_DURATION = 3000; // 3 seconds per full rotation
const CIRCLING_UPDATE_INTERVAL = 50; // Update every 50ms for smooth animation

export const VendorPositioningScatterPlot: React.FC<VendorPositioningScatterPlotProps> = ({
  vendors,
  selectedVendorIds,
  onSelectionChange,
  projectId,
  projectName,
  projectDescription,
  projectCategory = '',
  criteria,
}) => {
  // SP_026: Real n8n integration via useVendorScatterplot hook
  const {
    positions: rawPositions,
    isLoading,
    error: hookError,
    retry: retryHook,
  } = useVendorScatterplot({
    projectId,
    projectName,
    projectDescription,
    projectCategory: projectCategory || '',
    vendors,
  });

  // State management
  const [vendorPositions, setVendorPositions] = useState<VendorPosition[]>([]);
  const [circleAngles, setCircleAngles] = useState<Record<string, number>>({});
  const [animationFrame, setAnimationFrame] = useState(0);

  // Responsive chart dimensions
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 900,
    height: 500,
    padding: 40,
    logoSize: 66,
    minDistance: 80,
  });

  // Circle radius for loading animation (scales with chart size)
  const [circleRadius, setCircleRadius] = useState(100);

  // Font size for axis labels (scales with breakpoints)
  const [labelFontSize, setLabelFontSize] = useState(12);

  // Update dimensions based on window size with four breakpoints
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;

      let chartWidth: number;
      let chartHeight: number;
      let padding: number;
      let logoSize: number;
      let minDistance: number;
      let radius: number;
      let fontSize: number;

      if (screenWidth < 400) {
        // Extra Small Mobile: < 400px (iPhone SE, small phones)
        // Very compact square chart, tiny logos, minimal padding
        chartWidth = screenWidth - 32; // Account for component px-4 padding only
        chartHeight = chartWidth;
        padding = 15; // Reduced padding for very small screens
        logoSize = 28;
        minDistance = 38;
        radius = chartWidth * 0.10; // Smaller circle radius
        fontSize = 9; // Smaller font for extra small screens
      } else if (screenWidth < 768) {
        // Mobile: 400px - 768px
        // Square chart, small logos, reduced padding
        chartWidth = Math.min(screenWidth - 48, screenWidth * 0.95);
        chartHeight = chartWidth;
        padding = 20;
        logoSize = 32;
        minDistance = 45;
        radius = chartWidth * 0.12;
        fontSize = 10; // Smaller font for mobile
      } else if (screenWidth < 1024) {
        // Tablet: 768px - 1024px
        // Square chart, medium logos
        chartWidth = 600;
        chartHeight = 600;
        padding = 30;
        logoSize = 48;
        minDistance = 60;
        radius = 75;
        fontSize = 11; // Medium font for tablet
      } else {
        // Desktop: > 1024px
        // Rectangular chart, full size logos
        chartWidth = 900;
        chartHeight = 500;
        padding = 40;
        logoSize = 66;
        minDistance = 80;
        radius = 100;
        fontSize = 12; // Full font for desktop
      }

      setDimensions({
        width: chartWidth,
        height: chartHeight,
        padding,
        logoSize,
        minDistance,
      });

      setCircleRadius(radius);
      setLabelFontSize(fontSize);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize circle angles for each vendor (evenly distributed)
  useEffect(() => {
    const angleStep = 360 / vendors.length;
    const initialAngles: Record<string, number> = {};

    vendors.forEach((vendor, index) => {
      initialAngles[vendor.id] = index * angleStep;
    });

    setCircleAngles(initialAngles);
  }, [vendors]);

  // Circling animation loop (continuous during loading)
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCircleAngles((prev) => {
        const updated: Record<string, number> = {};
        Object.keys(prev).forEach((vendorId) => {
          // Rotate 6 degrees per frame (360 degrees / 3000ms * 50ms = 6 degrees)
          updated[vendorId] = (prev[vendorId] + 6) % 360;
        });
        return updated;
      });
      setAnimationFrame((prev) => prev + 1);
    }, CIRCLING_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Process raw n8n positions: normalize coordinates, detect collisions, adjust
  useEffect(() => {
    if (rawPositions.length > 0 && !isLoading) {
      console.log('[VendorPositioningScatterPlot] Processing positions from n8n:', rawPositions.length);
      const result = processVendorPositions(rawPositions, dimensions, labelFontSize);
      setVendorPositions(result.adjustedPositions);

      if (result.hasCollisions) {
        console.warn('[VendorPositioningScatterPlot] Some collisions could not be fully resolved');
      }
    }
  }, [rawPositions, dimensions, labelFontSize, isLoading]);

  // Handle logo click (toggle selection)
  const handleLogoClick = (vendorId: string) => {
    if (selectedVendorIds.includes(vendorId)) {
      // Deselect
      onSelectionChange(selectedVendorIds.filter((id) => id !== vendorId));
    } else {
      // Select
      onSelectionChange([...selectedVendorIds, vendorId]);
    }
  };

  // Handle retry (delegates to hook's retry function)
  const handleRetry = () => {
    retryHook();
  };

  // Calculate center point for circling animation
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Vendor Positioning (beta)</CardTitle>
        <CardDescription>
          Vendors positioned by function breadth (Single-Purpose ↔ Multi-Function) and industry specialization (Vertical-Specific ↔ Multiple Verticals)
        </CardDescription>
      </CardHeader>

      <div className="w-full flex flex-col items-center px-4 md:px-6 pb-6 overflow-x-hidden">

      {/* Chart Container - ID for screenshot capture in Excel export */}
      <div
        id="scatter-plot-chart"
        className="relative bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden w-full max-w-full"
        style={{ maxWidth: dimensions.width }}
      >
        {/* SVG Chart with Axes */}
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="bg-gradient-to-br from-gray-50 to-white w-full h-auto"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Axis lines */}
          <line
            x1={dimensions.padding}
            y1={dimensions.height / 2}
            x2={dimensions.width - dimensions.padding}
            y2={dimensions.height / 2}
            stroke="#D1D5DB"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <line
            x1={dimensions.width / 2}
            y1={dimensions.padding}
            x2={dimensions.width / 2}
            y2={dimensions.height - dimensions.padding}
            stroke="#D1D5DB"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Axis labels */}
          {/* X-axis labels (horizontal, bold blue, centered in quadrant) */}
          <text
            x={dimensions.padding + (dimensions.width / 2 - dimensions.padding) / 2}
            y={dimensions.height - 10}
            className="font-bold fill-blue-500"
            textAnchor="middle"
            fontSize={labelFontSize}
          >
            Single-Purpose
          </text>
          <text
            x={dimensions.width / 2 + (dimensions.width / 2 - dimensions.padding) / 2}
            y={dimensions.height - 10}
            className="font-bold fill-blue-500"
            textAnchor="middle"
            fontSize={labelFontSize}
          >
            Multi-Function
          </text>

          {/* Y-axis labels (vertical, rotated 90 degrees counter-clockwise, bold blue, centered in quadrant) */}
          {/* Top label: Multiple Verticals */}
          <text
            x={15}
            y={dimensions.padding + (dimensions.height / 2 - dimensions.padding) / 2}
            className="font-bold fill-blue-500"
            textAnchor="middle"
            fontSize={labelFontSize}
            transform={`rotate(-90 15 ${dimensions.padding + (dimensions.height / 2 - dimensions.padding) / 2})`}
          >
            Multiple Verticals
          </text>
          {/* Bottom label: Vertical-Specific */}
          <text
            x={15}
            y={dimensions.height / 2 + (dimensions.height / 2 - dimensions.padding) / 2}
            className="font-bold fill-blue-500"
            textAnchor="middle"
            fontSize={labelFontSize}
            transform={`rotate(-90 15 ${dimensions.height / 2 + (dimensions.height / 2 - dimensions.padding) / 2})`}
          >
            Vertical-Specific
          </text>
        </svg>

        {/* Vendor Logos Layer */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          {vendors.map((vendor) => {
            const position = vendorPositions.find((p) => p.vendor_id === vendor.id);
            const circleAngle = circleAngles[vendor.id] ?? 0;
            const isSelected = selectedVendorIds.includes(vendor.id);

            return (
              <div key={vendor.id} className="pointer-events-auto">
                <AnimatedVendorLogo
                  vendor={vendor}
                  position={
                    isLoading
                      ? { x: centerX, y: centerY } // Circle around center during loading
                      : position
                      ? { x: position.x, y: position.y }
                      : { x: centerX, y: centerY } // Fallback to center
                  }
                  isSelected={isSelected}
                  isCircling={isLoading}
                  circleAngle={circleAngle}
                  onClick={handleLogoClick}
                  logoSize={dimensions.logoSize}
                  circleRadius={circleRadius}
                  labelFontSize={labelFontSize}
                />
              </div>
            );
          })}
        </div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Analyzing vendor positions...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        <AnimatePresence>
          {hookError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center max-w-md px-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-gray-900 font-medium mb-2">Unable to Load Positions</p>
                <p className="text-xs text-gray-600 mb-4">{hookError}</p>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground w-full max-w-[900px]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white"></div>
          <span>Not selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-primary bg-white ring-2 ring-primary ring-opacity-60"></div>
          <span>Selected</span>
        </div>
      </div>
      </div>
    </Card>
  );
};
