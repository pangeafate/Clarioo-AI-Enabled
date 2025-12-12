/**
 * Template Category Constants
 *
 * Color mappings and utility functions for template categories.
 * These colors are used for visual consistency across the templates feature.
 *
 * @module constants/templateCategories
 */

/**
 * Category color mappings
 * Maps each category to its designated color for borders, tags, and highlights
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
 * Available template categories
 * Used for filtering in the CategoryFilter component
 */
export const TEMPLATE_CATEGORIES = [
  'All',
  'CX Platform',
  'Project Management',
  'CRM',
  'ERP',
  'ATS & Recruiting',
  'Customer Support',
  'AI Meeting Assistant',
] as const;

/**
 * Get color for a category
 * @param category - The category name
 * @returns The hex color code for the category (gray fallback if not found)
 */
export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#6b7280'; // gray as fallback
};
