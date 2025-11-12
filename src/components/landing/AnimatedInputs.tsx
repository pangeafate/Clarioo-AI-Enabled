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
 *
 * @see SP_007 Sprint Plan - Phase 3, Task 3.2 (Hypnotic Input Animations)
 */

import { motion } from 'framer-motion';
import { Lock, Building2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AnimatedInputsProps {
  isAuthenticated: boolean;
  companyInput: string;
  solutionInput: string;
  onCompanyChange: (value: string) => void;
  onSolutionChange: (value: string) => void;
}

export const AnimatedInputs = ({
  isAuthenticated,
  companyInput,
  solutionInput,
  onCompanyChange,
  onSolutionChange
}: AnimatedInputsProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="px-4 py-12 max-w-5xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Input: Company Information */}
        <div className="relative">
          <Label htmlFor="company-input" className="text-sm font-medium text-neutral-slate mb-2 block">
            Tell me more about your company
          </Label>

          <div className={`relative ${!isAuthenticated ? 'animate-pulse-glow animate-float' : ''}`}>
            <div
              className={`
                absolute inset-0 rounded-xl bg-gradient-to-r from-brand-blue/20 to-brand-blueLight/20
                ${!isAuthenticated ? 'animate-shimmer' : 'opacity-0'}
              `}
              style={{
                backgroundSize: '200% 100%'
              }}
            />

            <Input
              id="company-input"
              placeholder={isAuthenticated ? "e.g., We are a SaaS company with 50 employees" : "I work at Zapier in HR function"}
              disabled={!isAuthenticated}
              value={companyInput}
              onChange={(e) => onCompanyChange(e.target.value)}
              autoFocus={isAuthenticated}
              className={`
                relative rounded-xl h-14 px-4 text-base
                ${!isAuthenticated
                  ? 'bg-white/60 backdrop-blur-sm cursor-not-allowed shadow-elevated-combined border-brand-blue/30'
                  : 'bg-white shadow-soft border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20'
                }
                transition-all duration-500
              `}
            />

            {!isAuthenticated && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-brand-blue/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  <Lock className="h-3 w-3" />
                  Register to unlock
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue/40" />
            )}
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
            <div
              className={`
                absolute inset-0 rounded-xl bg-gradient-to-r from-brand-blueLight/20 to-brand-blue/20
                ${!isAuthenticated ? 'animate-shimmer' : 'opacity-0'}
              `}
              style={{
                backgroundSize: '200% 100%',
                animationDelay: '1s'
              }}
            />

            <Input
              id="solution-input"
              placeholder={isAuthenticated ? "e.g., CRM system with email integration" : "Looking for HR management software"}
              disabled={!isAuthenticated}
              value={solutionInput}
              onChange={(e) => onSolutionChange(e.target.value)}
              className={`
                relative rounded-xl h-14 px-4 text-base
                ${!isAuthenticated
                  ? 'bg-white/60 backdrop-blur-sm cursor-not-allowed shadow-elevated-combined border-brand-blue/30'
                  : 'bg-white shadow-soft border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20'
                }
                transition-all duration-500
              `}
            />

            {!isAuthenticated && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-brand-blue/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  <Lock className="h-3 w-3" />
                  Register to unlock
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue/40" />
            )}
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
    </motion.section>
  );
};
