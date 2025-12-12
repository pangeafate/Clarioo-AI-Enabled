/**
 * TemplatesButton Component
 * Sprint: SP_021
 *
 * @purpose Button to open the Templates modal
 *
 * FEATURES:
 * - Same size and styling as ExpertsButton
 * - Violet gradient outline (from-purple-600 to-blue-600)
 * - Fill color matching Clarioo badge
 * - Gradient text color
 * - Clipboard icon from lucide-react
 * - Opens TemplatesModal on click
 *
 * DESIGN SPECS:
 * - Outline: Gradient border
 * - Background: Same as Clarioo badge (from-gray-200 via-blue-200/90 to-purple-200/90)
 * - Text: Gradient text (from-blue-500 to-purple-600)
 * - Typography: Same as ExpertsButton (TYPOGRAPHY.button.small)
 */

import { motion } from 'framer-motion';
import { Clipboard } from 'lucide-react';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface TemplatesButtonProps {
  onClick: () => void;
}

export const TemplatesButton = ({ onClick }: TemplatesButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="relative flex items-center gap-1 xs:gap-2 px-3 xs:px-5 sm:px-8 py-1.5 xs:py-2 sm:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
      aria-label="Open Templates"
    >
      {/* Gradient border effect using pseudo-element */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-[2px]">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-gray-200 via-blue-200/90 to-purple-200/90" />
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-1 xs:gap-2">
        <span className={`${TYPOGRAPHY.button.small} bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-semibold`}>
          Templates
        </span>
        <Clipboard className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-purple-600" />
      </div>
    </motion.button>
  );
};
