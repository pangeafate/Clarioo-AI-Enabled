/**
 * RegistrationToggle Component - Landing Page Element 3
 *
 * @prototype Visual demonstration component
 * @purpose iOS-style toggle switch for Sign In / Sign Up
 *
 * FEATURES (SP_007):
 * - Element 3: Single iOS-style toggle switch
 * - Large, touch-friendly toggle (≥60px height)
 * - Label above: "Sign In / Sign Up"
 * - Opens authentication modal on interaction
 * - Smooth animations and transitions
 *
 * DESIGN SPECS:
 * - Toggle: 240px width x 60px height
 * - Background: Gradient when Sign Up, white when Sign In
 * - Shadow: elevated-combined for depth
 * - Border radius: rounded-full (pill shape)
 * - Knob: 52px circle with smooth slide animation
 *
 * BEHAVIOR:
 * - Toggle left (Sign In) or right (Sign Up)
 * - Clicking toggle opens AuthModal with selected mode
 * - Post-registration: input fields unlock with animation
 * - Hidden when user is authenticated
 *
 * @see SP_007 Sprint Plan - Phase 1, Task 1.3 (iOS-Style Toggle)
 * @see /src/components/landing/AuthModal.tsx - Authentication modal
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AuthModal } from './AuthModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(isSignUp ? 'signup' : 'signin');

  // Don't show toggle if already authenticated
  if (isAuthenticated) {
    return null;
  }

  /**
   * PROTOTYPE: Handle toggle interaction
   * Opens modal and sets authentication mode
   * Waits for animation to complete before showing modal
   */
  const handleToggleClick = () => {
    const newMode = !isSignUp ? 'signup' : 'signin';
    onToggle(!isSignUp);
    setAuthMode(newMode);

    // Wait for toggle animation to complete (spring animation ~400ms)
    setTimeout(() => {
      setIsModalOpen(true);
    }, 400);
  };

  const handleModeChange = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    onToggle(mode === 'signup');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col items-center gap-4 px-4 mb-8"
      >
        {/* Label */}
        <h3 className="text-lg font-semibold text-neutral-warmBlack">
          Sign In / Sign Up
        </h3>

        {/* Simple iOS-Style Toggle Switch */}
        <button
          onClick={handleToggleClick}
          className={`
            relative w-[70px] h-[36px] rounded-full transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-4 focus:ring-brand-purple/20
            ${isSignUp
              ? 'bg-gradient-to-r from-brand-purple to-brand-purpleLight'
              : 'bg-gray-200'
            }
          `}
          aria-label={`Switch to ${isSignUp ? 'Sign In' : 'Sign Up'}`}
        >
          {/* Sliding Circle Knob */}
          <motion.div
            animate={{
              x: isSignUp ? 38 : 2,
            }}
            transition={{
              type: 'spring',
              stiffness: 700,
              damping: 30,
            }}
            className="absolute top-[2px] w-[32px] h-[32px] bg-white rounded-full shadow-md"
          />
        </button>

        {/* Helper Text */}
        <p className="text-sm text-neutral-warmGray text-center max-w-md">
          Toggle to {isSignUp ? 'sign in' : 'create an account'} and unlock the full vendor discovery experience
        </p>
      </motion.div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={authMode}
        onModeChange={handleModeChange}
      />
    </>
  );
};
