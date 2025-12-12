/**
 * CategoryFilter Component
 *
 * Provides category filtering for templates with tag-based selection.
 * Supports "All" (mutually exclusive) and multiple category selection.
 *
 * @module components/templates/CategoryFilter
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS } from '@/constants/templateCategories';
import type { CategoryFilterProps } from '@/types/template.types';

/**
 * CategoryFilter Component
 *
 * Features:
 * - "All" selected by default
 * - "All" is mutually exclusive with other categories
 * - Multiple categories selectable (except "All")
 * - Active styling: filled background with category color, white text
 * - Inactive styling: outline only, gray text
 * - Hover effects: subtle scale and shadow
 *
 * @example
 * ```tsx
 * const categories = ['All', 'CX Platform', 'CRM', 'ERP'];
 * const [selected, setSelected] = useState<string[]>([]);
 *
 * <CategoryFilter
 *   categories={categories}
 *   selectedCategories={selected}
 *   onCategoryChange={setSelected}
 * />
 * ```
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategories,
  onCategoryChange,
}) => {
  /**
   * Handle category click
   * - Clicking "All" selects only "All" (mutually exclusive)
   * - Clicking any other category deselects "All"
   * - Multiple non-"All" categories can be selected
   */
  const handleCategoryClick = (category: string) => {
    if (category === 'All') {
      // Clicking "All" selects only "All"
      onCategoryChange(['All']);
    } else {
      // Clicking a category
      if (selectedCategories.includes(category)) {
        // Remove if already selected
        const updated = selectedCategories.filter((c) => c !== category);
        // If no categories left, default to "All"
        onCategoryChange(updated.length === 0 ? ['All'] : updated);
      } else {
        // Add to selection (and remove "All" if present)
        const updated = [...selectedCategories.filter((c) => c !== 'All'), category];
        onCategoryChange(updated);
      }
    }
  };

  /**
   * Check if a category is active
   * - "All" is active when in the selection array
   * - Other categories are active when explicitly in the selection
   */
  const isActive = (category: string): boolean => {
    return selectedCategories.includes(category);
  };

  /**
   * Get the color for a category
   */
  const getCategoryColor = (category: string): string => {
    return CATEGORY_COLORS[category] || '#6b7280';
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => {
        const active = isActive(category);
        const color = getCategoryColor(category);

        return (
          <Badge
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={cn(
              'cursor-pointer transition-all duration-200 px-4 py-2 text-sm font-medium',
              'hover:scale-105 hover:shadow-md',
              active
                ? // Active state: filled with category color
                  category === 'All'
                  ? 'bg-gradient-primary text-white border-transparent'
                  : 'text-white border-transparent'
                : // Inactive state: outline only
                  'bg-transparent text-gray-600 border-gray-300 hover:border-gray-400'
            )}
            style={
              active && category !== 'All'
                ? {
                    backgroundColor: color,
                    borderColor: color,
                  }
                : undefined
            }
          >
            {category}
          </Badge>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
