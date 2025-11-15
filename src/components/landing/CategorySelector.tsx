/**
 * CategorySelector Component - Modern Category Popup Selector
 *
 * @purpose Gradient-styled button with dropdown panel for category selection
 *
 * FEATURES:
 * - Gradient outline text and button matching site design
 * - Dropdown panel (below button) with list of categories
 * - "category" text with chevron icon
 * - Minimalistic, modern design
 * - Click outside to close
 * - Confirmation dialog before project creation
 *
 * DESIGN SPECS:
 * - Text: Gradient outline with purple-blue gradient
 * - Button: Gradient background (purple-blue) with rounded corners
 * - Panel: White background, soft shadow, rounded corners
 * - Categories: List layout, single column, hover effects
 *
 * BEHAVIOR:
 * - Click button → Open panel below
 * - Click category → Show confirmation dialog
 * - Click outside → Close panel
 * - Confirm → Create project + switch to project view
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { SOFTWARE_CATEGORIES } from '@/data/categories';
import { ProjectConfirmationDialog } from './ProjectConfirmationDialog';
import { SPACING } from '@/styles/spacing-config';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface CategorySelectorProps {
  onCreateProject: (title: string, description: string) => Promise<void>;
  isDisabled?: boolean;
  hasInputValues?: boolean;
}

export const CategorySelector = ({
  onCreateProject,
  isDisabled = false,
  hasInputValues = false
}: CategorySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isComponentDisabled = isDisabled || hasInputValues;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsOpen(false);
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative"
        ref={containerRef}
      >
        {/* Outer Gradient Outline Wrapping Both Containers */}
        <div
          className={`rounded-full ${SPACING.landing.categorySelector.outline} inline-flex ${
            isComponentDisabled
              ? 'bg-gray-300'
              : 'bg-gradient-to-r from-purple-600 to-blue-600'
          }`}
        >
          {/* Two-Container Design - Touching Pills */}
          <div className="flex items-center">
            {/* Left Container: Text */}
            <div className={`bg-white rounded-l-full ${SPACING.landing.categorySelector.textContainer} flex items-center`}>
              <span
                className={`${TYPOGRAPHY.button.default} leading-none whitespace-nowrap ${
                  isComponentDisabled
                    ? 'text-gray-400'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'
                }`}
              >
                Doing a general research? Just pick a
              </span>
            </div>

            {/* Right Container: Gradient Button */}
            <button
              onClick={() => !isComponentDisabled && setIsOpen(!isOpen)}
              disabled={isComponentDisabled}
              className={`flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 ${SPACING.landing.categorySelector.buttonContainer} rounded-r-full ${TYPOGRAPHY.button.default} text-white leading-none whitespace-nowrap transition-all ${
                isComponentDisabled
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              }`}
            >
              <span>category</span>
              <ChevronDown
                className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Helper Text */}
        {hasInputValues && (
          <p className={`${TYPOGRAPHY.muted.small} mt-2 text-center`}>
            Clear input fields to use this selector
          </p>
        )}

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && !isComponentDisabled && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2 w-full max-w-2xl bg-white rounded-2xl shadow-large border border-gray-100 overflow-hidden"
            >
              {/* Categories List */}
              <div className="max-h-96 overflow-y-auto">
                {SOFTWARE_CATEGORIES.map((cat, index) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`w-full ${SPACING.landing.categorySelector.panel} flex items-start gap-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-colors border-b border-gray-50 last:border-0 text-left`}
                  >
                    {/* Check Icon Placeholder */}
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                      {selectedCategory === cat.id && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>

                    {/* Category Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`${TYPOGRAPHY.card.title} mb-1`}>
                        {cat.label}
                      </h4>
                      <p className={`${TYPOGRAPHY.muted.small} line-clamp-1`}>
                        {cat.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
