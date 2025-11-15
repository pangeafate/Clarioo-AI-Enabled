/**
 * HeroSection Component - Landing Page Elements 1 & 2 (Redesigned)
 *
 * @prototype Visual demonstration component
 * @purpose Modern centered hero section with gradient background
 *
 * FEATURES:
 * - Centered layout with large logo/icon
 * - Clean typography hierarchy: Title → Subtitle → Toggle
 * - Balanced gradient background (gray-50 to blue-50)
 * - Value proposition badges
 * - Integrated authentication toggle
 *
 * DESIGN SPECS:
 * - Background: Subtle gradient with overlay
 * - Typography: Large centered title, descriptive subtitle
 * - Spacing: Generous vertical rhythm
 * - Mobile-first responsive
 *
 * @see Modern SaaS landing page redesign
 */

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ViewToggleButton } from './ViewToggleButton';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface HeroSectionProps {
  children?: React.ReactNode; // For RegistrationToggle (SP_011: temporarily disabled)
  // SP_011: View toggle props
  currentView?: 'landing' | 'project';
  onViewToggle?: () => void;
}

export const HeroSection = ({ children, currentView, onViewToggle }: HeroSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative flex flex-col items-center justify-center px-4 py-16 md:py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 pointer-events-none" />

      {/* SP_011: View Toggle Button - Upper left corner */}
      {currentView && onViewToggle && (
        <div className="absolute top-4 left-4 z-10">
          <ViewToggleButton currentView={currentView} onToggle={onViewToggle} />
        </div>
      )}

      <div className="relative max-w-5xl mx-auto text-center space-y-4">
        {/* Clarioo Brand Badge - Centered */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-4 xs:mb-6 sm:mb-8"
        >
          <div className="px-5 py-2.5 xs:px-6 xs:py-3 sm:px-8 sm:py-4 bg-gradient-to-br from-gray-200 via-blue-200/90 to-purple-200/90 rounded-xl xs:rounded-2xl">
            <span className={TYPOGRAPHY.special.brandGradient}>
              Clarioo
            </span>
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`${TYPOGRAPHY.heading.h1} text-gray-900 leading-[1.1]`}
          style={{ letterSpacing: '-0.03em' }}
        >
          Software Selection Expert
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`${TYPOGRAPHY.special.subtitle} text-gray-500 max-w-3xl mx-auto`}
        >
          Supercharge your software vendor's selection with AI assistant. Discover and evaluate software based on your business needs and company context.
        </motion.p>

        {/* Explore Link with Text */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className={`${TYPOGRAPHY.muted.default} text-gray-600 text-center pt-4`}
        >
          <button
            onClick={() => {
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
              });
            }}
            className="font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-purple-700 transition-all duration-300 cursor-pointer inline"
          >
            Explore
          </button>
          <ChevronRight className="inline h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-blue-500 mx-1" />
          software comparison and criteria templates
        </motion.p>

        {/* Authentication Toggle (passed as children) */}
        {children && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-2"
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};
