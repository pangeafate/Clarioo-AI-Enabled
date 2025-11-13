/**
 * AnimatedInputs Component - Landing Page Element 5
 *
 * @prototype Visual demonstration component
 * @purpose Two inactive input fields with hypnotic animations (registration-gated)
 *
 * FEATURES (SP_007):
 * - Element 5: Two input fields showing "Register to unlock"
 * - Side-by-side on desktop (≥768px), stacked on mobile
 * - Hypnotic animations: pulsing glow (2s), floating (3s), shimmer (4s)
 * - Post-registration: smooth unlock animation, auto-focus
 * - Visual cue: "Register to unlock" with lock icon
 *
 * FIXED (GAP-4): Landing input persistence
 * - Saves input to localStorage on every change
 * - Data flows: Landing → localStorage → Step 1 (TechInput)
 * - Enables seamless user journey from landing to workflow
 *
 * DESIGN SPECS:
 * - Border radius: rounded-xl (20px)
 * - Shadow: elevated-combined when inactive
 * - Animations: pulse-glow, float, shimmer (defined in Tailwind)
 * - Gradient shimmer overlay at 4s cycle
 *
 * BEHAVIOR:
 * - Inactive: Shows placeholder examples, disabled, animated
 * - Active: After registration, input fields unlock with smooth transition
 * - Auto-focus: First input field gets focus post-registration
 * - Auto-save: Saves to localStorage on every keystroke
 *
 * @see SP_007 Sprint Plan - Phase 3, Task 3.2 (Hypnotic Input Animations)
 * @see SP_009 Sprint Plan - Phase 2 (GAP-4: Landing Input Connection)
 */

import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AnimatedInputsProps {
  isAuthenticated: boolean;
  companyInput: string;
  solutionInput: string;
  onCompanyChange: (value: string) => void;
  onSolutionChange: (value: string) => void;
  onCreateProject?: () => void;
}

export const AnimatedInputs = ({
  isAuthenticated,
  companyInput,
  solutionInput,
  onCompanyChange,
  onSolutionChange,
  onCreateProject
}: AnimatedInputsProps) => {
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
      transition={{ duration: 0.5, delay: 0.4 }}
      className="px-4 py-12 max-w-5xl mx-auto"
    >
      {/* Value proposition badges */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3 mb-8"
      >
        <span className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-brand-blue border border-brand-blue/20 shadow-sm hover:shadow-md transition-shadow">
          90% of routine work automated
        </span>
        <span className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-brand-blue border border-brand-blue/20 shadow-sm hover:shadow-md transition-shadow">
          Clear comparison criteria
        </span>
        <span className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-brand-blue border border-brand-blue/20 shadow-sm hover:shadow-md transition-shadow">
          Follows your business needs
        </span>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Input: Company Information */}
        <div className="relative">
          <Label htmlFor="company-input" className="text-sm font-medium text-neutral-slate mb-2 block">
            Tell me more about your company
          </Label>

          <div className={`relative ${!isAuthenticated ? 'animate-pulse-glow animate-float' : ''}`}>
            <Textarea
              id="company-input"
              placeholder={isAuthenticated ? "e.g., We are a SaaS company with 50 employees looking to streamline our operations" : "I work at Zapier in HR function"}
              disabled={!isAuthenticated}
              value={companyInput}
              onChange={(e) => handleCompanyChange(e.target.value)}
              autoFocus={isAuthenticated}
              className={`
                relative rounded-xl h-24 px-4 text-base resize-none
                ${!isAuthenticated
                  ? 'bg-white/60 backdrop-blur-sm cursor-not-allowed shadow-elevated-combined border-brand-blue/30'
                  : 'bg-white shadow-soft border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20'
                }
                transition-all duration-500
              `}
            />
          </div>
        </div>

        {/* Right Input: Solution Requirements */}
        <div className="relative">
          <Label htmlFor="solution-input" className="text-sm font-medium text-neutral-slate mb-2 block">
            Tell me what solution you're looking for
          </Label>

          <div className={`relative ${!isAuthenticated ? 'animate-pulse-glow animate-float' : ''}`}
            style={{ animationDelay: '0.5s' }}
          >
            <Textarea
              id="solution-input"
              placeholder={isAuthenticated ? "e.g., CRM system with email integration and mobile app support" : "Looking for HR management software"}
              disabled={!isAuthenticated}
              value={solutionInput}
              onChange={(e) => handleSolutionChange(e.target.value)}
              className={`
                relative rounded-xl h-24 px-4 text-base resize-none
                ${!isAuthenticated
                  ? 'bg-white/60 backdrop-blur-sm cursor-not-allowed shadow-elevated-combined border-brand-blue/30'
                  : 'bg-white shadow-soft border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20'
                }
                transition-all duration-500
              `}
            />
          </div>
        </div>
      </div>

      {/* Helper text */}
      {isAuthenticated && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-neutral-slate text-center mt-4"
        >
          Fill in your details to start discovering perfect vendors with AI assistance
        </motion.p>
      )}

      {/* New Project Button */}
      {isAuthenticated && onCreateProject && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-6"
        >
          <Button
            onClick={onCreateProject}
            disabled={!companyInput.trim() || !solutionInput.trim()}
            className={`flex items-center gap-2 ${
              !companyInput.trim() || !solutionInput.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                : ''
            }`}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </motion.div>
      )}
    </motion.section>
  );
};
