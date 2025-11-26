/**
 * AnimatedInputs Component - Landing Page Element 5
 *
 * @prototype Visual demonstration component
 * @purpose Two active input fields with category dropdown and examples (SP_011: registration-free)
 *
 * FEATURES (SP_011):
 * - Element 5: Two always-active input fields (registration removed)
 * - Side-by-side on desktop (≥768px), stacked on mobile
 * - CategoryDropdown: Quick project creation from categories (disabled when inputs have values)
 * - ExamplesBulletPopover: Inspiration examples with question mark icon
 * - "+ New Project" button: Creates project from input values
 *
 * FIXED (GAP-4): Landing input persistence
 * - Saves input to localStorage on every change
 * - Data flows: Landing → localStorage → Step 1 (TechInput)
 * - Enables seamless user journey from landing to workflow
 *
 * DESIGN SPECS:
 * - Border radius: rounded-xl (20px)
 * - Shadow: soft shadow for inputs
 * - Clean, accessible UI
 *
 * BEHAVIOR:
 * - Input fields always enabled (no registration gate)
 * - CategoryDropdown disables when user types in any input
 * - Auto-save: Saves to localStorage on every keystroke
 * - "+ New Project" creates project from input values
 *
 * @see SP_011 Sprint Plan - Phase 3 (CategoryDropdown & ExamplesBulletPopover Integration)
 * @see SP_007 Sprint Plan - Phase 3, Task 3.2 (Hypnotic Input Animations - DEPRECATED)
 * @see SP_009 Sprint Plan - Phase 2 (GAP-4: Landing Input Connection)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { ExamplesBulletPopover } from './ExamplesBulletPopover';
import { SPACING } from '@/styles/spacing-config';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface AnimatedInputsProps {
  isAuthenticated: boolean; // SP_011: Kept for backward compatibility, but inputs always active
  companyInput: string;
  solutionInput: string;
  onCompanyChange: (value: string) => void;
  onSolutionChange: (value: string) => void;
  onCreateProject?: () => void;
  // SP_011: New prop for category/example project creation
  onCreateCategoryProject?: (title: string, description: string) => Promise<void>;
  // SP_016: Loading state for AI project creation
  isCreating?: boolean;
}

export const AnimatedInputs = ({
  isAuthenticated,
  companyInput,
  solutionInput,
  onCompanyChange,
  onSolutionChange,
  onCreateProject,
  onCreateCategoryProject,
  isCreating = false
}: AnimatedInputsProps) => {
  // SP_011: Calculate if user has typed in any input field
  const hasInputValues = companyInput.trim().length > 0 || solutionInput.trim().length > 0;

  // SP_016: Updated validation - at least one field needs 10+ characters for n8n AI
  const hasAnyInput = companyInput.length > 0 || solutionInput.length > 0;
  const hasEnoughCharacters = companyInput.trim().length >= 10 || solutionInput.trim().length >= 10;

  // Debug logging
  console.log('[AnimatedInputs] Validation:', {
    companyLength: companyInput.trim().length,
    solutionLength: solutionInput.trim().length,
    hasEnoughCharacters,
    isCreating,
    buttonDisabled: !hasEnoughCharacters || isCreating
  });
  /**
   * GAP-4 FIX: Save to localStorage on input change
   * Data will be loaded in TechInput.tsx when user starts workflow
   */
  const handleCompanyChange = (value: string) => {
    onCompanyChange(value);
    // Save to localStorage for later retrieval in Step 1
    localStorage.setItem('landing_company_info', value);
  };

  const handleSolutionChange = (value: string) => {
    onSolutionChange(value);
    // Save to localStorage for later retrieval in Step 1
    localStorage.setItem('landing_tech_needs', value);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className={`${SPACING.landing.inputs.section} max-w-5xl mx-auto`}
    >
      <div className={`grid grid-cols-1 md:grid-cols-2 ${SPACING.landing.inputs.grid}`}>
        {/* Left Input: Company Information */}
        <div className="relative">
          <Label htmlFor="company-input" className={`${TYPOGRAPHY.label.large} text-gray-700 mb-3 block max-[420px]:text-sm`}>
            Tell me more about your company
          </Label>

          <div className="relative">
            <Textarea
              id="company-input"
              placeholder="e.g., We are a SaaS company with 50 employees looking to streamline our operations"
              value={companyInput}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className={`relative rounded-xl h-24 ${SPACING.landing.inputs.input} ${TYPOGRAPHY.form.input} resize-none bg-white shadow-soft border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-purple-500/20 transition-[border-color] duration-300 custom-pulse-border`}
            />
          </div>
        </div>

        {/* Right Input: Solution Requirements */}
        <div className="relative">
          <Label htmlFor="solution-input" className={`${TYPOGRAPHY.label.large} text-gray-700 mb-3 block max-[420px]:text-sm`}>
            Feel free to give examples or specify your need
          </Label>

          <div className="relative">
            <Textarea
              id="solution-input"
              placeholder="e.g., CRM system with email integration and mobile app support (currently looking at Pipedrive and Zoho)"
              value={solutionInput}
              onChange={(e) => handleSolutionChange(e.target.value)}
              className={`relative rounded-xl h-24 ${SPACING.landing.inputs.input} ${TYPOGRAPHY.form.input} resize-none bg-white shadow-soft border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-purple-500/20 transition-[border-color] duration-300 custom-pulse-border`}
            />
          </div>
        </div>
      </div>

      {/* New Project Button - Always visible */}
      {onCreateProject && (
        <div className="flex flex-col items-center mt-6 gap-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={() => {
                console.log('[AnimatedInputs] Button clicked!');
                if (onCreateProject) {
                  onCreateProject();
                }
              }}
              disabled={!hasEnoughCharacters || isCreating}
              className={`${TYPOGRAPHY.button.default} flex items-center gap-2 transition-all duration-300 ${
                !hasEnoughCharacters || isCreating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              }`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating with Clarioo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create with Clarioo
                </>
              )}
            </Button>
          </motion.div>
          {/* Helper text for input requirements */}
          {!hasEnoughCharacters && hasAnyInput && (
            <p className="text-xs text-gray-500">
              At least one field needs 10 characters for AI processing
            </p>
          )}
        </div>
      )}

      {/* SP_011: Category Selector and Examples - COMMENTED OUT
      {onCreateCategoryProject && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 space-y-4"
        >
          <div className="flex justify-center">
            <CategorySelector
              onCreateProject={onCreateCategoryProject}
              hasInputValues={hasInputValues}
            />
          </div>
        </motion.div>
      )}
      */}
    </motion.section>
  );
};
