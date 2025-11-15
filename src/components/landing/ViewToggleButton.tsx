/**
 * ViewToggleButton Component - SP_011
 *
 * @purpose Context-aware navigation button between Landing and Project views
 *
 * FEATURES:
 * - Dynamic label based on current view:
 *   - Landing View: "Projects >" → switches to Project View
 *   - Project View: "< Home" → switches to Landing View
 * - Positioned in upper left of hero section
 * - Smooth animations and transitions
 * - Gradient styling matching design system
 *
 * DESIGN SPECS:
 * - Button: Pill-shaped with gradient background
 * - Icons: ChevronRight for "Projects >", ChevronLeft for "< Home"
 * - Position: Absolute positioning in hero section
 * - Animation: Fade + scale on view change
 *
 * BEHAVIOR:
 * - onClick triggers view toggle callback
 * - Smooth transitions between states
 * - Accessible with aria-labels
 *
 * @see SP_011 Sprint Plan - Phase 1, Task 2 (ViewToggleButton)
 * @see /src/components/landing/LandingPage.tsx - Integration point
 */

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TYPOGRAPHY, TEXT_COLORS } from '@/styles/typography-config';

interface ViewToggleButtonProps {
  currentView: 'landing' | 'project';
  onToggle: () => void;
}

export const ViewToggleButton = ({ currentView, onToggle }: ViewToggleButtonProps) => {
  const isLandingView = currentView === 'landing';

  return (
    <motion.button
      onClick={onToggle}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-1 xs:gap-2 px-3 xs:px-5 sm:px-8 py-1.5 xs:py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 ${TEXT_COLORS.white} rounded-full shadow-md hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105`}
      aria-label={isLandingView ? 'Switch to Projects view' : 'Switch to Home view'}
    >
      {!isLandingView && (
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -5 }}
        >
          <ChevronLeft className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
        </motion.div>
      )}

      <span className={TYPOGRAPHY.button.small}>
        {isLandingView ? 'Projects' : 'Home'}
      </span>

      {isLandingView && (
        <motion.div
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
        >
          <ChevronRight className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
        </motion.div>
      )}
    </motion.button>
  );
};
