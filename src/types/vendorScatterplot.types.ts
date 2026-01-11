/**
 * Vendor Scatterplot Type Definitions
 *
 * Types for the vendor positioning scatter plot feature that visualizes
 * vendors along two strategic dimensions using AI analysis.
 *
 * @module types/vendorScatterplot
 */

import type { Vendor, Criteria } from './index';

/**
 * Request format for n8n vendor scatterplot webhook
 */
export interface VendorScatterplotRequest {
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  vendors: {
    id: string;
    name: string;
    description: string;
    website: string;
  }[];
  timestamp: string;
}

/**
 * Individual vendor positioning from n8n (raw scores 0-100)
 */
export interface VendorScatterplotPosition {
  vendor_id: string;
  vendor_name: string;
  x_score: number;        // Solution Scope: 0-100 (0=Single-Purpose, 100=Multi-Function)
  y_score: number;        // Industry Focus: 0-100 (0=Vertical-Specific, 100=Multiple Verticals)
  reasoning?: string;     // Optional explanation of positioning
}

/**
 * Response format from n8n vendor scatterplot webhook
 */
export interface VendorScatterplotResponse {
  success: boolean;
  positionings: VendorScatterplotPosition[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Vendor position with normalized pixel coordinates
 * Used for rendering logos on the chart
 */
export interface VendorPosition {
  vendor_id: string;
  vendor_name: string;
  x: number;              // Pixel coordinate (after normalization)
  y: number;              // Pixel coordinate (after normalization)
  raw_x_score: number;    // Original 0-100 score from n8n
  raw_y_score: number;    // Original 0-100 score from n8n
  reasoning?: string;     // Optional explanation
}

/**
 * Scatterplot cache stored in localStorage
 */
export interface VendorScatterplotCache {
  project_id: string;
  vendor_ids: string[];   // Array of vendor IDs for cache validation
  positions: VendorScatterplotPosition[];
  timestamp: string;
}

/**
 * Component props for VendorPositioningScatterPlot
 */
export interface VendorPositioningScatterPlotProps {
  vendors: Vendor[];
  selectedVendorIds: string[];
  onSelectionChange: (vendorIds: string[]) => void;
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectCategory?: string;
  criteria: Criteria[];
}

/**
 * Component props for AnimatedVendorLogo
 */
export interface AnimatedVendorLogoProps {
  vendor: Vendor;
  position: { x: number; y: number };
  isSelected: boolean;
  isCircling: boolean;
  circleAngle?: number;   // Starting angle for circle animation (0-360)
  onClick: (vendorId: string) => void;
  logoSize: number;       // Dynamic logo size (responsive)
  circleRadius: number;   // Dynamic circle radius for loading animation (responsive)
  labelFontSize: number;  // Dynamic font size for vendor name label (responsive)
}

/**
 * Collision detection result
 */
export interface CollisionDetectionResult {
  hasCollisions: boolean;
  adjustedPositions: VendorPosition[];
}

/**
 * Chart dimensions configuration
 */
export interface ChartDimensions {
  width: number;
  height: number;
  padding: number;        // Padding from edges (px)
  logoSize: number;       // Logo diameter (px)
  minDistance: number;    // Minimum distance between logos (px)
}
