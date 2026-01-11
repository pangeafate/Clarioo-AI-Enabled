/**
 * Battlecards Storage Utilities
 * Sprint: SP_023 - Vendor Battlecards
 *
 * localStorage utilities for caching battlecard data
 */

import { BattlecardRowState, BattlecardsState } from '../types/battlecards.types';

// Storage keys
const BATTLECARDS_STATE_KEY = 'clarioo_battlecards_state';
const BATTLECARDS_ROWS_KEY = 'clarioo_battlecards_rows';

/**
 * Generate project-specific storage key
 */
function getStorageKey(baseKey: string, projectId: string): string {
  return `${baseKey}_${projectId}`;
}

// ===========================================
// Battlecards State Storage
// ===========================================

/**
 * Save battlecards generation state to localStorage
 */
export function saveBattlecardsState(projectId: string, state: BattlecardsState): void {
  try {
    const key = getStorageKey(BATTLECARDS_STATE_KEY, projectId);
    const data = {
      ...state,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log('[BattlecardsStorage] Saved state:', {
      projectId,
      rowCount: state.rows.length,
      status: state.status,
      currentIndex: state.current_row_index,
    });
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to save state:', error);
  }
}

/**
 * Load battlecards generation state from localStorage
 */
export function loadBattlecardsState(projectId: string): BattlecardsState | null {
  try {
    const key = getStorageKey(BATTLECARDS_STATE_KEY, projectId);
    const data = localStorage.getItem(key);

    if (!data) {
      console.log('[BattlecardsStorage] No cached state found');
      return null;
    }

    const state = JSON.parse(data) as BattlecardsState;
    console.log('[BattlecardsStorage] Loaded state:', {
      projectId,
      rowCount: state.rows.length,
      status: state.status,
    });

    return state;
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to load state:', error);
    return null;
  }
}

// ===========================================
// Individual Row Storage
// ===========================================

/**
 * Save a single battlecard row to localStorage
 */
export function saveBattlecardRow(projectId: string, row: BattlecardRowState): void {
  try {
    const key = getStorageKey(BATTLECARDS_ROWS_KEY, projectId);

    // Load existing rows
    const existingData = localStorage.getItem(key);
    const rows: BattlecardRowState[] = existingData ? JSON.parse(existingData) : [];

    // Find and update or append
    const existingIndex = rows.findIndex(r => r.row_id === row.row_id);
    if (existingIndex >= 0) {
      rows[existingIndex] = row;
    } else {
      rows.push(row);
    }

    localStorage.setItem(key, JSON.stringify(rows));
    console.log('[BattlecardsStorage] Saved row:', {
      projectId,
      rowId: row.row_id,
      category: row.category_title,
      status: row.status,
    });
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to save row:', error);
  }
}

/**
 * Load all battlecard rows for a project
 */
export function loadBattlecardRows(projectId: string): BattlecardRowState[] {
  try {
    const key = getStorageKey(BATTLECARDS_ROWS_KEY, projectId);
    const data = localStorage.getItem(key);

    if (!data) {
      console.log('[BattlecardsStorage] No cached rows found');
      return [];
    }

    const rows = JSON.parse(data) as BattlecardRowState[];
    console.log('[BattlecardsStorage] Loaded rows:', {
      projectId,
      count: rows.length,
      completed: rows.filter(r => r.status === 'completed').length,
    });

    return rows;
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to load rows:', error);
    return [];
  }
}

/**
 * Load a specific battlecard row
 */
export function loadBattlecardRow(projectId: string, rowId: string): BattlecardRowState | null {
  try {
    const rows = loadBattlecardRows(projectId);
    return rows.find(r => r.row_id === rowId) || null;
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to load row:', error);
    return null;
  }
}

// ===========================================
// Cache Management
// ===========================================

/**
 * Clear all battlecard data for a project
 */
export function clearBattlecardCache(projectId: string): void {
  try {
    const stateKey = getStorageKey(BATTLECARDS_STATE_KEY, projectId);
    const rowsKey = getStorageKey(BATTLECARDS_ROWS_KEY, projectId);

    localStorage.removeItem(stateKey);
    localStorage.removeItem(rowsKey);

    console.log('[BattlecardsStorage] Cleared cache for project:', projectId);
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to clear cache:', error);
  }
}

/**
 * Clear all battlecard data across all projects
 */
export function clearAllBattlecardCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const battlecardKeys = keys.filter(
      key => key.startsWith(BATTLECARDS_STATE_KEY) || key.startsWith(BATTLECARDS_ROWS_KEY)
    );

    battlecardKeys.forEach(key => localStorage.removeItem(key));

    console.log('[BattlecardsStorage] Cleared all battlecard cache:', {
      keysRemoved: battlecardKeys.length,
    });
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to clear all cache:', error);
  }
}

/**
 * Check if battlecard cache exists for a project
 */
export function hasBattlecardCache(projectId: string): boolean {
  try {
    const stateKey = getStorageKey(BATTLECARDS_STATE_KEY, projectId);
    return localStorage.getItem(stateKey) !== null;
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to check cache:', error);
    return false;
  }
}

/**
 * Get battlecard cache metadata
 */
export function getBattlecardCacheMetadata(projectId: string): {
  exists: boolean;
  rowCount: number;
  completedCount: number;
  lastUpdated?: string;
} {
  try {
    const state = loadBattlecardsState(projectId);
    const rows = loadBattlecardRows(projectId);

    if (!state) {
      return {
        exists: false,
        rowCount: 0,
        completedCount: 0,
      };
    }

    return {
      exists: true,
      rowCount: rows.length,
      completedCount: rows.filter(r => r.status === 'completed').length,
      lastUpdated: (state as any).timestamp,
    };
  } catch (error) {
    console.error('[BattlecardsStorage] Failed to get cache metadata:', error);
    return {
      exists: false,
      rowCount: 0,
      completedCount: 0,
    };
  }
}
