/**
 * Vendor Comparison Types
 *
 * Shared types for vendor comparison state management
 * Used by both old and new comparison implementations
 */

/**
 * State for a single vendor × criterion cell (two-stage system)
 */
export interface CellState {
  status: 'pending' | 'loading' | 'completed' | 'failed';
  value?: 'yes' | 'no' | 'unknown' | 'star';
  evidenceUrl?: string;
  evidenceDescription?: string;
  comment?: string;
  error?: string;
  errorCode?: string; // 'TIMEOUT' | 'HTTP_400' | etc
  retryCount?: number;
}

/**
 * State for a single criterion row (two-stage system)
 */
export interface CriterionRowState {
  criterionId: string;
  stage1Complete: boolean;
  stage2Status: 'pending' | 'loading' | 'completed' | 'failed';
  stage2Error?: string;
  cells: Record<string, CellState>; // vendorId -> CellState
  criterionInsight?: string;
  starsAwarded?: number;
}

/**
 * Complete comparison state (two-stage system)
 */
export interface ComparisonState {
  criteria: Record<string, CriterionRowState>; // criterionId -> CriterionRowState
  activeWorkflows: number; // Current concurrent workflows
  isPaused: boolean;
  currentCriterionIndex: number; // Which criterion we're processing
  lastUpdated: string;
}

/**
 * localStorage persistence structure for Stage 1 results
 */
export interface Stage1StorageData {
  projectId: string;
  results: Record<string, Record<string, CellState>>; // criterionId -> vendorId -> CellState
  timestamp: string;
}

/**
 * localStorage persistence structure for Stage 2 results
 */
export interface Stage2StorageData {
  projectId: string;
  results: Record<string, {
    criterionId: string;
    criterionInsight: string;
    starsAwarded: number;
    vendorUpdates: Record<string, Partial<CellState>>; // vendorId -> updates from Stage 2
  }>;
  timestamp: string;
}

/**
 * Vendor comparison state (legacy single-stage system)
 */
export interface VendorComparisonState {
  status: 'pending' | 'loading' | 'completed' | 'failed';
  comparedData?: any; // ComparedVendor type
  error?: string;
  errorCode?: string;
}
