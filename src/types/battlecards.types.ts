/**
 * Battlecards Type Definitions
 * Sprint: SP_023 - Vendor Battlecards
 *
 * Types for frontend battlecard state management and UI rendering
 */

import { BattlecardCell } from './n8n.types';

/**
 * Status of a single battlecard row
 */
export type BattlecardRowStatus = 'pending' | 'loading' | 'completed' | 'failed';

/**
 * Individual cell state with UI metadata
 */
export interface BattlecardCellState extends BattlecardCell {
  is_expanded: boolean; // For expandable text UI
}

/**
 * Battlecard row state for progressive loading
 */
export interface BattlecardRowState {
  row_id: string;
  category_title: string;
  category_definition?: string;
  status: BattlecardRowStatus;
  cells: BattlecardCellState[];
  error?: string;
  error_code?: string;
  retry_count: number;
  timestamp?: string;
}

/**
 * Overall battlecard generation state
 */
export interface BattlecardsState {
  rows: BattlecardRowState[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  current_row_index: number;
  total_rows_target: number; // 8-12 rows
  already_filled_categories: string[];
  error?: string;
}

/**
 * Mandatory battlecard categories (always generated first)
 * SP_024: Expanded from 3 to 7 mandatory categories
 */
export const MANDATORY_BATTLECARD_CATEGORIES = [
  'Ideal For',
  'Target Verticals',
  'Key Customers',
  'Pricing Model',
  'Company Stage',
  'Primary Geo',
  'Main Integrations',
] as const;

/**
 * Dynamic category pool for AI selection
 * SP_024: Removed 'Pricing Model' (now mandatory)
 */
export const DYNAMIC_BATTLECARD_CATEGORIES = [
  'Company Size/Maturity',
  'Geographic Focus',
  'Implementation Complexity',
  'Support Model',
  'Security/Compliance',
  'Deployment Options',
  'Contract Terms',
  'Target Company Size',
  'Industry Vertical Specialization',
] as const;

/**
 * Configuration for battlecard generation
 */
export interface BattlecardsConfig {
  min_rows: number; // Exactly 10 rows (7 mandatory + 3 dynamic)
  max_rows: number; // Exactly 10 rows (7 mandatory + 3 dynamic)
  mandatory_categories: readonly string[];
  max_retries_per_row: number; // Default 3
  timeout_per_row: number; // Default 90000ms (90 seconds)
}

/**
 * Default battlecards configuration
 * SP_024: Exactly 10 rows (7 mandatory + 3 AI-generated dynamic)
 */
export const DEFAULT_BATTLECARDS_CONFIG: BattlecardsConfig = {
  min_rows: 10, // 7 mandatory + 3 dynamic AI-selected categories
  max_rows: 10, // Exactly 10 rows total
  mandatory_categories: MANDATORY_BATTLECARD_CATEGORIES,
  max_retries_per_row: 3,
  timeout_per_row: 90000, // 90 seconds
};
