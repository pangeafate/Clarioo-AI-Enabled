/**
 * MobileMenu Component
 *
 * Hamburger menu for mobile view containing:
 * - Projects (View Toggle)
 * - Experts
 * - Templates
 *
 * Desktop: Hidden (buttons shown directly)
 * Mobile: Hamburger icon with dropdown overlay
 *
 * @module components/landing/MobileMenu
 */

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewToggleButton } from './ViewToggleButton';
import { ExpertsButton } from './ExpertsButton';
import { TemplatesButton } from './TemplatesButton';

interface MobileMenuProps {
  currentView: 'landing' | 'project';
  onViewToggle: () => void;
  onExpertsClick: () => void;
  onTemplatesClick: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  currentView,
  onViewToggle,
  onExpertsClick,
  onTemplatesClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleViewToggle = () => {
    onViewToggle();
    setIsOpen(false);
  };

  const handleExpertsClick = () => {
    onExpertsClick();
    setIsOpen(false);
  };

  const handleTemplatesClick = () => {
    onTemplatesClick();
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Icon - Mobile Only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-4 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-3 flex flex-col gap-2"
          >
            <ViewToggleButton currentView={currentView} onToggle={handleViewToggle} />
            <ExpertsButton onClick={handleExpertsClick} />
            <TemplatesButton onClick={handleTemplatesClick} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop - Close menu when clicking outside */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/20 z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
};
