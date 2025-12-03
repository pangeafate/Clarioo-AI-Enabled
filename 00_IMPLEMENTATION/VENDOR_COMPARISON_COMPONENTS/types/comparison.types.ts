/**
 * TypeScript Type Definitions for Vendor Comparison Wave Charts
 * Sprint: SP_015
 * Purpose: Comprehensive type safety for wave chart visualization system
 */

import { Criterion } from './index';

/**
 * Vendor color palette (10 distinct colors)
 */
export const VENDOR_COLOR_PALETTE = [
  { name: 'green', hex: '#22c55e', bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-900' },
  { name: 'orange', hex: '#f97316', bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-900' },
  { name: 'blue', hex: '#3b82f6', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-900' },
  { name: 'purple', hex: '#a855f7', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-900' },
  { name: 'pink', hex: '#ec4899', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-900' },
  { name: 'yellow', hex: '#eab308', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-900' },
  { name: 'teal', hex: '#14b8a6', bg: 'bg-teal-100', border: 'border-teal-200', text: 'text-teal-900' },
  { name: 'indigo', hex: '#6366f1', bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-900' },
  { name: 'red', hex: '#ef4444', bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-900' },
  { name: 'cyan', hex: '#06b6d4', bg: 'bg-cyan-100', border: 'border-cyan-200', text: 'text-cyan-900' },
] as const;

export type VendorColor = typeof VENDOR_COLOR_PALETTE[number];

/**
 * 4-state criterion evaluation
 * - yes: Vendor meets the criterion
 * - no: Vendor does not meet the criterion
 * - unknown: Not enough data for decision
 * - star: Vendor meets the criterion exceptionally well
 */
export type CriterionState = 'yes' | 'no' | 'unknown' | 'star';

/**
 * Score detail with evidence and AI comment
 */
export interface CriterionScoreDetail {
  state: CriterionState;
  evidence: string; // URL to evidence (required for yes/star)
  comment: string; // AI explanation of the score
}

/**
 * Vendor comparison status for progressive loading
 */
export type VendorComparisonStatus = 'pending' | 'loading' | 'completed' | 'failed';

/**
 * Vendor information for comparison
 */
export interface ComparisonVendor {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  killerFeature?: string; // Main differentiator/unique selling point
  executiveSummary?: string; // Brief overview of vendor and product
  keyFeatures?: string[]; // List of key features including killer feature
  matchPercentage: number; // Overall match score (0-100)
  scores: Map<string, CriterionState>; // Map of criterion ID to 4-state evaluation
  color: VendorColor; // Assigned color from palette
  // Progressive loading fields
  scoreDetails?: Record<string, CriterionScoreDetail>; // Detailed scores with evidence
  comparisonStatus?: VendorComparisonStatus; // Status of comparison research
  comparisonError?: string; // Error message if comparison failed
  comparisonErrorCode?: string; // Error code from n8n ('TIMEOUT', etc.)
}

/**
 * Individual data point on the wave chart
 */
export interface WavePoint {
  x: number; // X-axis position (criterion index)
  y: number; // Y-axis position (score 0-100)
  criterionId: string;
  criterionName: string;
  score: number; // Raw score (0-100)
  vendorId: string;
}

/**
 * Complete wave data for a single vendor
 */
export interface VendorWaveData {
  vendor: ComparisonVendor;
  points: WavePoint[];
  interpolatedPath: string; // SVG path data (d attribute)
  color: string; // Wave color (hex)
}

/**
 * Chart dimensions for responsive layouts
 */
export interface ChartDimensions {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  chartWidth: number; // width - paddingLeft - paddingRight
  chartHeight: number; // height - paddingTop - paddingBottom
}

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveBreakpoint {
  minWidth: number; // Minimum screen width in pixels
  maxWidth?: number; // Maximum screen width (undefined for largest breakpoint)
  name: 'mobile' | 'tablet' | 'desktop' | 'wide' | 'xl';
  chartDimensions: Omit<ChartDimensions, 'chartWidth' | 'chartHeight'>;
  truncateLabelAt: number; // Maximum characters for criterion labels
}

/**
 * Catmull-Rom spline configuration
 */
export interface SplineConfig {
  tension: number; // 0 = straight lines, 1 = tight curves (default 0.5)
  smoothness: number; // Number of interpolation points between data points
  alpha: number; // 0 = uniform, 0.5 = centripetal (recommended), 1 = chordal
}

/**
 * Vendor comparison state management
 */
export interface ComparisonState {
  vendor1: ComparisonVendor | null;
  vendor2: ComparisonVendor | null;
  vendor1Index: number; // Current index in shortlist (0-based)
  vendor2Index: number; // Current index in shortlist (0-based)
  shortlist: ComparisonVendor[]; // All vendors available for comparison
  selectedCriterion: Criterion | null; // Criterion selected for detail view
  criteria: Criterion[]; // All evaluation criteria
  isDrawerOpen: boolean; // Criterion detail drawer state
}

/**
 * Chart interaction state
 */
export interface ChartInteractionState {
  hoveredPoint: WavePoint | null;
  tooltipPosition: { x: number; y: number } | null;
  showTooltips: boolean; // Global tooltip visibility toggle
  isPanning: boolean;
  isZooming: boolean;
  zoomLevel: number; // 1 = 100%, 2 = 200%, etc.
  panOffset: { x: number; y: number };
}

/**
 * Vendor navigation action types
 */
export type VendorNavigationAction = 'next' | 'previous' | 'goto';

/**
 * Vendor navigation event
 */
export interface VendorNavigationEvent {
  panel: 'vendor1' | 'vendor2';
  action: VendorNavigationAction;
  targetIndex?: number; // For 'goto' action
}

/**
 * Criterion detail drawer mode
 */
export type DrawerMode = 'view' | 'edit' | 'chat';

/**
 * Criterion detail drawer state
 */
export interface CriterionDrawerState {
  isOpen: boolean;
  criterion: Criterion | null;
  mode: DrawerMode;
  vendor1Score?: number;
  vendor2Score?: number;
}

/**
 * Wave chart animation configuration
 */
export interface WaveAnimationConfig {
  duration: number; // milliseconds
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';
  stiffness?: number; // For spring easing (default 300)
  damping?: number; // For spring easing (default 30)
}

/**
 * Gesture detection configuration for mobile
 */
export interface GestureConfig {
  swipeThreshold: number; // Minimum distance in pixels to register swipe
  swipeVelocity: number; // Minimum velocity for quick swipe
  tapTimeout: number; // Maximum time for tap vs hold (ms)
  doubleTapDelay: number; // Maximum time between taps for double tap (ms)
}

/**
 * Chart tooltip data
 */
export interface TooltipData {
  criterionName: string;
  score: number;
  vendorName: string;
  position: { x: number; y: number };
  visible: boolean;
}

/**
 * Match percentage calculation method
 */
export type MatchCalculationMethod = 'weighted' | 'average' | 'priority-only';

/**
 * Match calculation configuration
 */
export interface MatchCalculationConfig {
  method: MatchCalculationMethod;
  weights?: {
    high: number; // Weight for high-importance criteria (default 3)
    medium: number; // Weight for medium-importance criteria (default 2)
    low: number; // Weight for low-importance criteria (default 1)
  };
}

/**
 * Export options for wave chart
 */
export interface WaveChartExportOptions {
  format: 'png' | 'svg' | 'pdf';
  width: number;
  height: number;
  includeTooltips: boolean;
  backgroundColor: string;
}

/**
 * Color palette for waves
 */
export interface WaveColorPalette {
  vendor1: string; // Primary vendor color
  vendor2: string; // Secondary vendor color
  grid: string; // Grid line color
  background: string; // Chart background
  text: string; // Label text color
  axis: string; // Axis line color
}

/**
 * Default wave color palette (Tailwind-based)
 */
export const DEFAULT_WAVE_COLORS: WaveColorPalette = {
  vendor1: '#6366f1', // Indigo-500
  vendor2: '#ec4899', // Pink-500
  grid: '#e5e7eb', // Gray-200
  background: '#ffffff', // White
  text: '#1f2937', // Gray-800
  axis: '#9ca3af', // Gray-400
};

/**
 * Default responsive breakpoints
 */
export const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoint[] = [
  {
    minWidth: 0,
    maxWidth: 767,
    name: 'mobile',
    chartDimensions: {
      width: 350, // Minimum supported width
      height: 280,
      paddingTop: 20,
      paddingRight: 10,
      paddingBottom: 40,
      paddingLeft: 30,
    },
    truncateLabelAt: 8, // "Security..." for mobile
  },
  {
    minWidth: 768,
    maxWidth: 1023,
    name: 'tablet',
    chartDimensions: {
      width: 700,
      height: 320,
      paddingTop: 24,
      paddingRight: 16,
      paddingBottom: 48,
      paddingLeft: 40,
    },
    truncateLabelAt: 12,
  },
  {
    minWidth: 1024,
    maxWidth: 1439,
    name: 'desktop',
    chartDimensions: {
      width: 480,
      height: 360,
      paddingTop: 28,
      paddingRight: 20,
      paddingBottom: 56,
      paddingLeft: 48,
    },
    truncateLabelAt: 16,
  },
  {
    minWidth: 1440,
    maxWidth: 1919,
    name: 'wide',
    chartDimensions: {
      width: 600,
      height: 400,
      paddingTop: 32,
      paddingRight: 24,
      paddingBottom: 64,
      paddingLeft: 56,
    },
    truncateLabelAt: 20,
  },
  {
    minWidth: 1920,
    name: 'xl',
    chartDimensions: {
      width: 720,
      height: 440,
      paddingTop: 36,
      paddingRight: 28,
      paddingBottom: 72,
      paddingLeft: 64,
    },
    truncateLabelAt: 24,
  },
];

/**
 * Default Catmull-Rom spline configuration
 */
export const DEFAULT_SPLINE_CONFIG: SplineConfig = {
  tension: 0.5, // Balanced smoothness
  smoothness: 20, // 20 interpolation points per segment
  alpha: 0.5, // Centripetal (prevents loops and cusps)
};

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: WaveAnimationConfig = {
  duration: 500,
  easing: 'spring',
  stiffness: 300,
  damping: 30,
};

/**
 * Default gesture configuration for mobile
 */
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  swipeThreshold: 50, // 50px minimum swipe distance
  swipeVelocity: 0.3, // pixels per millisecond
  tapTimeout: 200, // 200ms for tap
  doubleTapDelay: 300, // 300ms between taps
};

/**
 * Default match calculation configuration
 */
export const DEFAULT_MATCH_CONFIG: MatchCalculationConfig = {
  method: 'weighted',
  weights: {
    high: 3,
    medium: 2,
    low: 1,
  },
};
