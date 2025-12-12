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
 * Represents a project template with pre-configured criteria
 * Field names match Excel column headers (camelCase)
 */
export interface Template {
  templateId: string;
  category: string;
  companyType: string;
  companyDetails: string;
  currentTool: string | null;
  painQuote: string | null;
  lookingFor: string;
  criteria: Criterion[];
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
 */
export interface TemplateCardProps {
  template: Template;
  onClick: () => void;
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
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'CX Platform': '#10b981', // green
  'Project Management': '#3b82f6', // blue
  'CRM': '#8b5cf6', // purple
  'ERP': '#f59e0b', // orange
  'ATS & Recruiting': '#ef4444', // red
  'Customer Support': '#06b6d4', // cyan
  'AI Meeting Assistant': '#ec4899', // pink
} as const;

/**
 * Get color for a category (with fallback)
 */
export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#6b7280'; // gray as fallback
};
