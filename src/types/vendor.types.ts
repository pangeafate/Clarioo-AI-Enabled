/**
 * Vendor-related type definitions
 *
 * This file contains all types related to vendors, including
 * vendor data structures, criteria answers, and scoring information.
 *
 * @module types/vendor
 */

/**
 * Criteria answer for yes/no questions with optional comment
 */
export interface CriteriaAnswer {
  yesNo: 'yes' | 'no' | 'partial';
  comment: string;
}

/**
 * Main vendor interface
 * Represents a vendor/solution provider with evaluation data
 */
export interface Vendor {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  criteriaScores: Record<string, number>; // Criterion ID -> score (0-10)
  criteriaAnswers: Record<string, CriteriaAnswer>; // Criterion ID -> answer
  features: string[];
}

/**
 * Extended vendor interface with match percentage
 */
export interface VendorWithMatch extends Vendor {
  matchPercentage: number; // 0-100
}

/**
 * Vendor comparison data for side-by-side view
 */
export interface VendorComparison {
  vendors: Vendor[];
  criteriaIds: string[];
  scores: Record<string, Record<string, number>>; // vendor ID -> criterion ID -> score
  recommendations: {
    best_overall: string; // vendor ID
    best_value: string;
    best_features: string;
    reasoning: string;
  };
}

/**
 * Vendor selection request
 */
export interface VendorSelectionRequest {
  category: string;
  description: string;
  criteria: string[]; // Array of criterion IDs
  companyInfo?: string;
}

/**
 * Vendor filter options
 */
export interface VendorFilters {
  minRating?: number;
  maxPrice?: string;
  requiredFeatures?: string[];
  category?: string;
}

/**
 * Vendor sort options
 */
export type VendorSortBy = 'rating' | 'name' | 'price' | 'matchPercentage';

export type VendorSortOrder = 'asc' | 'desc';

/**
 * Vendor invite data for sending RFP
 */
export interface VendorInvite {
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  projectName: string;
  criteria: string[]; // Array of criterion names
  message: string;
  dueDate?: string;
}

/**
 * Vendor response to RFP
 */
export interface VendorResponse {
  vendorId: string;
  projectId: string;
  responses: Record<string, CriteriaAnswer>; // criterion ID -> answer
  proposalDocument?: string; // URL to proposal
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  submittedAt: string;
}
