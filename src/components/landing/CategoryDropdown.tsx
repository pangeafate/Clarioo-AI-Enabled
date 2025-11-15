/**
 * CategoryDropdown Component - SP_011
 *
 * @purpose Single-select dropdown for quick project creation from software categories
 *
 * FEATURES:
 * - Label: "Doing a general research? Just pick up a category."
 * - Single-select dropdown with 15+ software categories
 * - Confirmation dialog before project creation
 * - Automatic project creation with category label as title
 * - Disabled state when user types in input fields
 * - Clean, accessible UI with clear visual states
 *
 * DESIGN SPECS:
 * - Full-width dropdown on mobile, max-width on desktop
 * - Gray background when enabled, lighter when disabled
 * - Smooth transitions between states
 * - Consistent with design system styling
 *
 * BEHAVIOR:
 * - Select category → Show confirmation dialog
 * - Confirm → Create project + switch to project view
 * - Cancel → Reset selection
 * - Disabled when hasInputValues = true
 *
 * @see SP_011 Sprint Plan - Phase 2, Task 2 (CategoryDropdown)
 * @see /src/data/categories.ts - Category data source
 * @see /src/components/landing/ProjectConfirmationDialog.tsx - Confirmation dialog
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SOFTWARE_CATEGORIES } from '@/data/categories';
import { ProjectConfirmationDialog } from './ProjectConfirmationDialog';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface CategoryDropdownProps {
  onCreateProject: (title: string, description: string) => Promise<void>;
  isDisabled?: boolean;
  hasInputValues?: boolean;
}

export const CategoryDropdown = ({
  onCreateProject,
  isDisabled = false,
  hasInputValues = false
}: CategoryDropdownProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    const category = SOFTWARE_CATEGORIES.find(c => c.id === selectedCategory);
    if (!category) return;

    setIsCreating(true);

    try {
      await onCreateProject(
        category.label,
        `Quick start project for ${category.label.toLowerCase()}`
      );
      setIsConfirmDialogOpen(false);
      setSelectedCategory('');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setIsConfirmDialogOpen(false);
    setSelectedCategory('');
  };

  const category = SOFTWARE_CATEGORIES.find(c => c.id === selectedCategory);
  const isComponentDisabled = isDisabled || hasInputValues;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-2xl mx-auto px-4"
      >
        {/* Label */}
        <label
          htmlFor="category-dropdown"
          className={`block mb-3 transition-colors ${TYPOGRAPHY.label.large} ${
            isComponentDisabled
              ? 'text-gray-400'
              : 'text-gray-800'
          }`}
        >
          Doing a general research? Just pick up a category.
          {hasInputValues && (
            <span className={`ml-2 ${TYPOGRAPHY.muted.xs} text-gray-500`}>
              (Clear input fields to use this dropdown)
            </span>
          )}
        </label>

        {/* Dropdown */}
        <Select
          value={selectedCategory}
          onValueChange={handleCategorySelect}
          disabled={isComponentDisabled}
        >
          <SelectTrigger
            id="category-dropdown"
            className={`w-full transition-all ${
              isComponentDisabled
                ? 'bg-gray-100 cursor-not-allowed opacity-60'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <SelectValue placeholder="Select a software category..." />
          </SelectTrigger>
          <SelectContent>
            {SOFTWARE_CATEGORIES.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div>
                  <div className={TYPOGRAPHY.label.default}>{category.label}</div>
                  <div className={`${TYPOGRAPHY.muted.xs} text-gray-500`}>
                    {category.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Confirmation Dialog */}
      {category && (
        <ProjectConfirmationDialog
          isOpen={isConfirmDialogOpen}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          projectTitle={category.label}
          projectDescription={category.description}
          isCreating={isCreating}
        />
      )}
    </>
  );
};
