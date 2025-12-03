/**
 * Comparison Storage Utilities
 *
 * Shared localStorage utilities for vendor comparison persistence
 * Used by both VendorComparison.tsx (old) and VendorComparisonNew.tsx (new)
 *
 * Storage Keys:
 * - compared_vendors_{projectId}: Legacy single-stage comparison results
 * - stage1_results_{projectId}: Stage 1 (individual research) results
 * - stage2_results_{projectId}: Stage 2 (comparative ranking) results
 * - comparison_state_{projectId}: Overall comparison orchestration state
 */

import {
  ComparisonState,
  Stage1StorageData,
  Stage2StorageData,
  VendorComparisonState
} from '../types/vendorComparison.types';

// ===========================================
// Storage Key Generators
// ===========================================

export const getComparedVendorsKey = (projectId: string) => `compared_vendors_${projectId}`;
export const getStage1Key = (projectId: string) => `stage1_results_${projectId}`;
export const getStage2Key = (projectId: string) => `stage2_results_${projectId}`;
export const getComparisonStateKey = (projectId: string) => `comparison_state_${projectId}`;

// ===========================================
// Legacy Comparison Storage (Old System)
// ===========================================

/**
 * Load legacy compared vendors from localStorage
 * Used by VendorComparison.tsx (old single-stage system)
 */
export const loadComparedVendors = (
  projectId: string
): Record<string, VendorComparisonState> | null => {
  try {
    const key = getComparedVendorsKey(projectId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.error('[comparisonStorage] Error loading compared vendors:', error);
    return null;
  }
};

/**
 * Save legacy compared vendors to localStorage
 * Used by VendorComparison.tsx (old single-stage system)
 */
export const saveComparedVendors = (
  projectId: string,
  states: Record<string, VendorComparisonState>
): void => {
  try {
    const key = getComparedVendorsKey(projectId);
    localStorage.setItem(key, JSON.stringify(states));
  } catch (error) {
    console.error('[comparisonStorage] Error saving compared vendors:', error);
  }
};

/**
 * Clear legacy compared vendors from localStorage
 */
export const clearComparedVendors = (projectId: string): void => {
  try {
    const key = getComparedVendorsKey(projectId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[comparisonStorage] Error clearing compared vendors:', error);
  }
};

// ===========================================
// Stage 1 Storage (New Two-Stage System)
// ===========================================

/**
 * Load Stage 1 results from localStorage
 * Used by VendorComparisonNew.tsx
 */
export const loadStage1Results = (projectId: string): Stage1StorageData | null => {
  try {
    const key = getStage1Key(projectId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed: Stage1StorageData = JSON.parse(stored);

    // Validate structure
    if (!parsed.projectId || !parsed.results || !parsed.timestamp) {
      console.warn('[comparisonStorage] Invalid Stage 1 data structure');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[comparisonStorage] Error loading Stage 1 results:', error);
    return null;
  }
};

/**
 * Save Stage 1 results to localStorage
 * Used by VendorComparisonNew.tsx
 */
export const saveStage1Results = (data: Stage1StorageData): void => {
  try {
    const key = getStage1Key(data.projectId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[comparisonStorage] Error saving Stage 1 results:', error);
  }
};

/**
 * Clear Stage 1 results from localStorage
 */
export const clearStage1Results = (projectId: string): void => {
  try {
    const key = getStage1Key(projectId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[comparisonStorage] Error clearing Stage 1 results:', error);
  }
};

// ===========================================
// Stage 2 Storage (New Two-Stage System)
// ===========================================

/**
 * Load Stage 2 results from localStorage
 * Used by VendorComparisonNew.tsx
 */
export const loadStage2Results = (projectId: string): Stage2StorageData | null => {
  try {
    const key = getStage2Key(projectId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed: Stage2StorageData = JSON.parse(stored);

    // Validate structure
    if (!parsed.projectId || !parsed.results || !parsed.timestamp) {
      console.warn('[comparisonStorage] Invalid Stage 2 data structure');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[comparisonStorage] Error loading Stage 2 results:', error);
    return null;
  }
};

/**
 * Save Stage 2 results to localStorage
 * Used by VendorComparisonNew.tsx
 */
export const saveStage2Results = (data: Stage2StorageData): void => {
  try {
    const key = getStage2Key(data.projectId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[comparisonStorage] Error saving Stage 2 results:', error);
  }
};

/**
 * Clear Stage 2 results from localStorage
 */
export const clearStage2Results = (projectId: string): void => {
  try {
    const key = getStage2Key(projectId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[comparisonStorage] Error clearing Stage 2 results:', error);
  }
};

// ===========================================
// Comparison State Storage (New Two-Stage System)
// ===========================================

/**
 * Load comparison orchestration state from localStorage
 * Used by VendorComparisonNew.tsx for pause/resume functionality
 */
export const loadComparisonState = (projectId: string): ComparisonState | null => {
  try {
    const key = getComparisonStateKey(projectId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed: ComparisonState = JSON.parse(stored);

    // Validate structure
    if (!parsed.criteria || typeof parsed.activeWorkflows !== 'number') {
      console.warn('[comparisonStorage] Invalid comparison state structure');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[comparisonStorage] Error loading comparison state:', error);
    return null;
  }
};

/**
 * Save comparison orchestration state to localStorage
 * Used by VendorComparisonNew.tsx for pause/resume functionality
 */
export const saveComparisonState = (projectId: string, state: ComparisonState): void => {
  try {
    const key = getComparisonStateKey(projectId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('[comparisonStorage] Error saving comparison state:', error);
  }
};

/**
 * Clear comparison state from localStorage
 */
export const clearComparisonState = (projectId: string): void => {
  try {
    const key = getComparisonStateKey(projectId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[comparisonStorage] Error clearing comparison state:', error);
  }
};

// ===========================================
// Batch Operations
// ===========================================

/**
 * Clear all comparison-related data for a project
 * Useful when starting fresh comparison or vendor list changes
 */
export const clearAllComparisonData = (projectId: string): void => {
  clearComparedVendors(projectId);
  clearStage1Results(projectId);
  clearStage2Results(projectId);
  clearComparisonState(projectId);
  console.log('[comparisonStorage] Cleared all comparison data for project:', projectId);
};

/**
 * Check if any comparison data exists for a project
 * Useful for determining if we should resume or start fresh
 */
export const hasComparisonData = (projectId: string): {
  legacy: boolean;
  stage1: boolean;
  stage2: boolean;
  state: boolean;
} => {
  return {
    legacy: !!localStorage.getItem(getComparedVendorsKey(projectId)),
    stage1: !!localStorage.getItem(getStage1Key(projectId)),
    stage2: !!localStorage.getItem(getStage2Key(projectId)),
    state: !!localStorage.getItem(getComparisonStateKey(projectId)),
  };
};
