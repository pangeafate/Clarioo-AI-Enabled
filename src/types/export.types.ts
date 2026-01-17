/**
 * Export-related Type Definitions
 * Sprint: SP_027 - Excel & JSON Export Feature
 *
 * Types for exporting project data to Excel and JSON formats
 */

import { Criterion, ImportanceLevel } from './criteria.types';
import { Vendor, ComparisonVendor, CriterionState } from './comparison.types';
import { BattlecardRowState } from './battlecards.types';
import type { VendorSummaryData } from '../services/n8nService';

/**
 * Export format types
 */
export type ExportFormat = 'excel' | 'json';

/**
 * Excel export status
 */
export type ExportStatus = 'idle' | 'generating' | 'completed' | 'failed';

/**
 * Project stage for progressive export
 */
export type ProjectStage =
  | 'criteria_only'           // Stage 1: Just criteria
  | 'vendors_selected'        // Stage 2: Vendors selected
  | 'comparison_matrix'       // Stage 3: Comparison matrix filled
  | 'detailed_matching'       // Stage 4: Detailed matching complete
  | 'executive_summary'       // Stage 5: Executive summary generated
  | 'battlecards_complete';   // Stage 6: Battlecards generated

/**
 * Options for Excel export
 */
export interface ExcelExportOptions {
  projectId: string;
  projectName: string;
  includeArchived?: boolean;  // Include archived criteria (default: true per spec)
  skipPrompt?: boolean;        // Skip incomplete data prompt (for testing)
  stage?: ProjectStage;        // Current project stage (auto-detected if not provided)
}

/**
 * Options for JSON export
 */
export interface JSONExportOptions {
  projectId: string;
  projectName: string;
  prettyPrint?: boolean;       // Default: true
  includeMetadata?: boolean;   // Default: true
}

/**
 * Match status for comparison cells
 * Stage 1: yes, partial, unknown, pending
 * Stage 2: star, no (can also update Stage 1 values)
 */
export type MatchStatus = 'yes' | 'partial' | 'unknown' | 'pending' | 'star' | 'no';

/**
 * Match status icon mapping (Stage 1 + Stage 2)
 */
export const MATCH_STATUS_ICONS: Record<MatchStatus, string> = {
  yes: '✓',
  partial: '+/-',
  unknown: '?',
  pending: '🔄',
  star: '⭐',
  no: 'X',
};

/**
 * Match status background colors
 */
export const MATCH_STATUS_COLORS: Record<MatchStatus, string> = {
  yes: '#E5EBFB',
  partial: '#F0EFFC',
  unknown: '#F4F5F7',
  pending: '#FFFFFF',
  star: '#FFFFFF',
  no: '#FFFFFF',
};

/**
 * Importance level text colors (for Excel)
 */
export const IMPORTANCE_COLORS: Record<ImportanceLevel, string> = {
  high: '#DC2626',    // Red-600
  medium: '#F97316',  // Orange-500
  low: '#22C55E',     // Green-500
};

/**
 * Vendor data for Excel export (simplified from ComparisonVendor)
 */
export interface ExportVendor {
  id: string;
  name: string;
  description: string;
  website: string;
  logo?: string;
  matchPercentage: number;
  rank?: number;                // Final ranking position
  executiveSummary?: string;    // Brief overview
  killerFeature?: string;       // Main differentiator
}

/**
 * Criterion for export with match status
 */
export interface ExportCriterion extends Criterion {
  isArchived?: boolean;
  matches?: Record<string, MatchStatus>; // vendor ID -> match status
  evidence?: Record<string, ExportEvidence>; // vendor ID -> evidence
}

/**
 * Evidence for detailed matching tab
 */
export interface ExportEvidence {
  status: MatchStatus;
  evidenceDescription?: string;
  researchNotes?: string;
  sources?: string[];           // Array of source URLs
}

/**
 * Executive summary data
 * Supports both simple format (projectSummary only) and structured format (from n8n)
 */
export interface ExportExecutiveSummary {
  // Simple format (fallback)
  projectSummary: string;
  overallRecommendation?: string;
  keyInsights?: string[];
  generatedAt?: string;

  // Structured format (from n8n Pre-Demo Brief)
  keyCriteria?: Array<{
    name: string;
    importance?: string;
    description?: string;
  }>;

  vendorRecommendations?: Array<{
    rank: number;
    name: string;
    matchPercentage?: number;
    overallAssessment?: string;
    keyStrengths?: string[];
    keyWeaknesses?: string[];
    bestFor?: string;
  }>;

  keyDifferentiators?: Array<{
    category: string;
    leader: string;
    details?: string;
  }>;

  riskFactors?: {
    vendorSpecific?: Array<{
      vendor: string;
      questions: string[];
    }>;
    generalConsiderations?: string[];
  };

  recommendation?: {
    topPick?: string;
    reason?: string;
    considerations?: string[];
  };
}

/**
 * Battlecard cell for export
 */
export interface ExportBattlecardCell {
  vendorId: string;
  vendorName: string;
  content: string;
  sources?: string[];
}

/**
 * Battlecard row for export
 */
export interface ExportBattlecardRow {
  categoryTitle: string;
  categoryDefinition?: string;
  cells: ExportBattlecardCell[];
}

/**
 * Scatter plot positioning data
 */
export interface ExportScatterPlotData {
  vendors: Array<{
    id: string;
    name: string;
    x: number;              // Value satisfaction score (0-100)
    y: number;              // Implementation effort score (0-100)
    logo?: string;
  }>;
  chartConfig: {
    width: number;          // 600px
    height: number;         // 400px
    xAxisLabel: string;     // "Value Satisfaction →"
    yAxisLabel: string;     // "Implementation Effort →"
  };
}

/**
 * Complete project data for export
 */
export interface ExportProjectData {
  // Project metadata
  projectId: string;
  projectName: string;
  projectDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  stage: ProjectStage;

  // Metadata for n8n template upload (from INDEX tab)
  metadata?: {
    category?: string;
    softwareCategory?: string;
    searchedBy?: string;
    keyFeatures?: string;
    clientQuote?: string;
    currentTools?: string;
    companyContext?: string;
    solutionRequirements?: string;
  };

  // Tab 1: Criteria
  criteria: ExportCriterion[];

  // Tab 2: Vendors
  vendors: ExportVendor[];
  scatterPlot?: ExportScatterPlotData;
  screeningSummary?: string;

  // Tab 3: Comparison Matrix (only if stage >= 'comparison_matrix')
  comparisonMatrix?: {
    criteria: ExportCriterion[];
    vendors: ExportVendor[];
    rankings?: Array<{ vendorId: string; rank: number; stars: number }>;
  };

  // Tab 4: Detailed Matching (only if stage >= 'detailed_matching')
  detailedMatching?: {
    criteria: ExportCriterion[];
    vendors: ExportVendor[];
  };

  // Tab 5: Executive Summary (only if exists)
  executiveSummary?: ExportExecutiveSummary;

  // Tab 6: Battlecards (only if exists)
  battlecards?: ExportBattlecardRow[];
}

/**
 * JSON export wrapper with metadata
 */
export interface JSONExportData {
  metadata: {
    exportedAt: string;
    exportVersion: string;      // e.g., "1.0.0"
    projectId: string;
    projectName: string;
    projectDescription?: string;
    projectCategory?: string;
    stage: ProjectStage;
    createdAt?: string;         // Project creation timestamp
    updatedAt?: string;         // Project last update timestamp
    createdBy?: string;         // User email
    userId?: string;            // User ID (clarioo_user_id)
    softwareCategory?: string;  // Software category (placeholder)
    searchedBy?: string;        // Searched by (placeholder)
    keyFeatures?: string;       // Key features (placeholder)
    clientQuote?: string;       // Client quote (placeholder)
    currentTools?: string;      // Current tools - comma-separated list (placeholder)
  };
  project: ExportProjectData;
  vendorSummaries?: Record<string, VendorSummaryData>; // Vendor card summaries keyed by vendor name
  rawLocalStorage?: Record<string, any>; // Complete localStorage dump for reconstruction
}

/**
 * Export result
 *
 * NOTE: VendorSummaryData type is defined in @/services/n8nService
 * (matches actual runtime format with camelCase properties)
 */
export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  filename: string;
  blob?: Blob;
  error?: string;
  errorCode?: string;
}

/**
 * Image processing options
 */
export interface ImageProcessingOptions {
  maxWidth: number;           // Default: 1000px
  maxHeight: number;          // Default: 1600px
  quality: number;            // JPEG quality 0-1 (default: 0.85)
  outputFormat: 'jpeg' | 'png';
  circular?: boolean;         // Crop to circular shape
}

/**
 * Screenshot capture options
 */
export interface ScreenshotOptions {
  elementId?: string;         // DOM element ID to capture
  element?: HTMLElement;      // Direct element reference
  width: number;              // Target width (default: 600)
  height: number;             // Target height (400)
  scale: number;              // Device pixel ratio (default: 2 for retina)
  backgroundColor?: string;   // Default: '#FFFFFF'
}

/**
 * File naming configuration
 */
export interface FileNamingConfig {
  projectName: string;
  dateFormat: 'YY_MM_DD' | 'DD_MM_YY' | 'YYYY-MM-DD';
  maxProjectNameLength: number; // Default: 10
  sanitize: boolean;          // Remove special characters
}

/**
 * Incomplete data detection result
 */
export interface IncompleteDataCheck {
  isComplete: boolean;
  missingTabs: string[];      // Names of tabs with incomplete data
  pendingCells: number;       // Count of cells with pending status
  shouldPrompt: boolean;      // Whether to show prompt to user
  message?: string;           // User-friendly message
}

/**
 * Export progress tracking
 */
export interface ExportProgress {
  stage: 'initializing' | 'processing_images' | 'generating_excel' | 'finalizing';
  percentage: number;         // 0-100
  currentTask?: string;       // e.g., "Processing vendor logo 3/5"
  estimatedTimeRemaining?: number; // milliseconds
}

/**
 * Export error codes
 */
export type ExportErrorCode =
  | 'PROJECT_NOT_FOUND'
  | 'INSUFFICIENT_DATA'
  | 'IMAGE_PROCESSING_FAILED'
  | 'EXCEL_GENERATION_FAILED'
  | 'JSON_SERIALIZATION_FAILED'
  | 'FILE_SAVE_FAILED'
  | 'STORAGE_ACCESS_DENIED'
  | 'UNKNOWN_ERROR';

/**
 * Export error with additional context
 */
export interface ExportError {
  code: ExportErrorCode;
  message: string;
  details?: any;
  timestamp: string;
}
