/**
 * Template-related type definitions
 *
 * This file contains all types related to project templates,
 * including template structure and modal component interfaces.
 *
 * @module types/template
 */

import type { Criterion } from './criteria.types';

/**
 * Main template interface
 * Represents a complete project template with all 7 Excel tabs
 * Field names match n8n Data Table schema (camelCase)
 *
 * Updated schema (v2):
 * - searchedBy → projectDescription
 * - lookingFor → projectName
 * - summaryData → executiveSummary
 * - Added: softwareCategory, detailedMatching
 */
export interface Template {
  templateId: string;
  templateCategory: string;
  projectName: string;              // Main template title (from project_name column)
  searchedBy: string;               // Company description for "SEARCHED BY" display (from searched_by column)
  projectDescription?: string;      // Additional project context (from project_description column)
  softwareCategory?: string;        // Specific software type (optional)
  keyFeatures: string;              // Comma-separated list
  clientQuote: string | null;
  currentTool: string | null;
  criteria: Criterion[];            // Tab 1: Evaluation Criteria
  vendors?: any[];                  // Tab 2: Vendor List (optional)
  comparisonMatrix?: any;           // Tab 3: Comparison Matrix (optional)
  detailedMatching?: any;           // Tab 4: Detailed Matching (optional)
  battlecards?: any;                // Tab 5: Battlecards (optional)
  executiveSummary?: any;           // Tab 6: Executive Summary (was summaryData)
  positioningData?: any;            // Tab 7: Vendor Positioning (optional)
  vendorSummaries?: Record<string, {
    vendor_name: string;
    killerFeature?: string;
    executiveSummary?: string;
    keyFeatures?: string[];
  }>;                               // Vendor summary details (killerFeature, executiveSummary, keyFeatures)
  template_data_json?: string;      // SP_030: Complete JSON export data (JSONExportData or ExportProjectData)
}

/**
 * Plural alias for arrays of templates
 */
export type Templates = Template[];

/**
 * TemplatesModal component props
 */
export interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (project: { id: string; name: string; description: string; status: string; created_at: string; updated_at: string; category?: string }) => void;
}

/**
 * CategoryFilter component props
 */
export interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

/**
 * TemplateCard component props
 * SP_028: Added admin mode props for delete functionality
 */
export interface TemplateCardProps {
  template: Template;
  onClick: () => void;
  isAdminMode?: boolean;
  onDelete?: (templateId: string) => void;
}

/**
 * CriteriaPreviewModal component props
 */
export interface CriteriaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onUseTemplate: () => void;
}

/**
 * Category color mappings for visual consistency
 * Keys match template_category field (uppercase)
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'CX PLATFORM': '#10b981', // green
  'PROJECT MANAGEMENT': '#3b82f6', // blue
  'CRM': '#8b5cf6', // purple
  'ERP': '#f59e0b', // orange
  'ATS & RECRUITING': '#ef4444', // red
  'CUSTOMER SUPPORT': '#06b6d4', // cyan
  'AI MEETING ASSISTANT': '#ec4899', // pink
} as const;

/**
 * Get color for a category (with fallback)
 */
export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#6b7280'; // gray as fallback
};
