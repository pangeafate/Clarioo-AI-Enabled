/**
 * RegistrationToggle Component - Landing Page Element 3
 *
 * @prototype Visual demonstration component
 * @purpose Sign In / Sign Up toggle positioned above inputs
 *
 * FEATURES (SP_007):
 * - Element 3: Registration toggle to enable input fields
 * - Smooth transition between Sign In and Sign Up modes
 * - Gradient button styling with colored shadows
 * - Mobile-friendly touch targets (≥44x44px)
 *
 * DESIGN SPECS:
 * - Button gradient: #6366F1 → #8B5CF6
 * - Shadow: button-glow (0 4px 14px rgba(99,102,241,0.4))
 * - Border radius: rounded-xl (20px)
 * - Hover: lift effect (-2px transform)
 *
 * BEHAVIOR:
 * - Opens auth modal/form when clicked
 * - Post-registration: input fields unlock with animation
 *
 * @see SP_007 Sprint Plan - Phase 1, Task 1.2
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

interface RegistrationToggleProps {
  isSignUp: boolean;
  onToggle: (value: boolean) => void;
  onOpenAuth: () => void;
  isAuthenticated?: boolean;
}

export const RegistrationToggle = ({
  isSignUp,
  onToggle,
  onOpenAuth,
  isAuthenticated = false
}: RegistrationToggleProps) => {
  // Don't show toggle if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex justify-center gap-3 px-4 mb-8"
    >
      {/* Sign In Button */}
      <Button
        variant={!isSignUp ? "default" : "outline"}
        size="lg"
        onClick={() => {
          onToggle(false);
          onOpenAuth();
        }}
        className={`
          min-w-[140px] h-12 rounded-xl font-semibold transition-all duration-300
          ${!isSignUp
            ? 'bg-gradient-button text-white shadow-button-glow hover:shadow-elevated-combined hover:-translate-y-0.5'
            : 'border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5'
          }
        `}
      >
        <LogIn className="h-4 w-4 mr-2" />
        Sign In
      </Button>

      {/* Sign Up Button */}
      <Button
        variant={isSignUp ? "default" : "outline"}
        size="lg"
        onClick={() => {
          onToggle(true);
          onOpenAuth();
        }}
        className={`
          min-w-[140px] h-12 rounded-xl font-semibold transition-all duration-300
          ${isSignUp
            ? 'bg-gradient-button text-white shadow-button-glow hover:shadow-elevated-combined hover:-translate-y-0.5'
            : 'border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5'
          }
        `}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Sign Up
      </Button>
    </motion.div>
  );
};
