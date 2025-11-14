/**
 * Criteria-related type definitions
 *
 * This file contains all types related to evaluation criteria,
 * including criterion structure, importance levels, and related
 * data types.
 *
 * Naming Convention:
 * - Criterion (singular) - A single evaluation criterion
 * - Criteria (plural) - Array of criteria (type alias)
 *
 * @module types/criteria
 */

/**
 * Importance level for criterion weighting
 * Used to prioritize criteria during vendor evaluation
 */
export type ImportanceLevel = 'low' | 'medium' | 'high';

/**
 * Main criterion interface
 * Represents a single evaluation criterion used to assess vendors
 */
export interface Criterion {
  id: string;
  name: string;
  description?: string;
  explanation?: string; // Detailed explanation of the criterion
  importance: ImportanceLevel;
  type: string; // e.g., 'Features', 'Performance', 'Security', 'Integration'
  weight?: number; // Numeric weight (0-100) derived from importance
}

/**
 * Plural alias for arrays of criteria
 * Use this type when working with criterion collections
 */
export type Criteria = Criterion[];

/**
 * Criterion builder configuration
 * Used in criteria builder UI for creating/editing criteria
 */
export interface CriterionBuilderConfig {
  defaultTypes: string[];
  customTypes: string[];
  maxCriteria?: number;
  allowCustomTypes: boolean;
}

/**
 * Criterion validation result
 */
export interface CriterionValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Criterion creation request
 */
export interface CreateCriterionRequest {
  name: string;
  description?: string;
  importance: ImportanceLevel;
  type: string;
  project_id?: string;
}

/**
 * Criterion update request
 */
export interface UpdateCriterionRequest {
  name?: string;
  description?: string;
  importance?: ImportanceLevel;
  type?: string;
  weight?: number;
}

/**
 * Criterion with scoring data
 * Extended interface including vendor-specific scores
 */
export interface CriterionWithScores extends Criterion {
  averageScore: number; // Average score across all vendors
  highestScore: number;
  lowestScore: number;
  vendorScores: Record<string, number>; // vendor ID -> score
}

/**
 * Criterion filter options
 */
export interface CriterionFilters {
  importance?: ImportanceLevel;
  type?: string;
  projectId?: string;
  search?: string;
}

/**
 * Criterion sort options
 */
export type CriterionSortBy = 'name' | 'importance' | 'type' | 'weight';

export type CriterionSortOrder = 'asc' | 'desc';

/**
 * Criterion query parameters
 */
export interface CriterionQueryParams {
  filters?: CriterionFilters;
  sortBy?: CriterionSortBy;
  sortOrder?: CriterionSortOrder;
  limit?: number;
  offset?: number;
}

/**
 * Default criterion types available in the system
 */
export const DEFAULT_CRITERION_TYPES = [
  'Features',
  'Performance',
  'Security',
  'Integration',
  'Support',
  'Cost',
  'Scalability',
  'Usability',
  'Compliance',
  'Reliability'
] as const;

/**
 * Type for default criterion type values
 */
export type DefaultCriterionType = typeof DEFAULT_CRITERION_TYPES[number];
