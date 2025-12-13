/**
 * MobileMenu Component
 *
 * Slide-out navigation menu for mobile devices with animated hamburger icon.
 * Uses CSS-only hamburger animation inspired by WebDevSimplified.
 *
 * Features:
 * - Animated hamburger icon (3 bars -> X)
 * - Slide-out panel from left
 * - Dark backdrop overlay
 * - Click outside to close
 * - Gradient text for Projects item
 * - Icon + text layout for menu items
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Users, FileText } from 'lucide-react';

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
  const [isOverWhite, setIsOverWhite] = useState(false);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Track scroll to change icon color when over white content
  useEffect(() => {
    const handleScroll = () => {
      // Change to charcoal when scrolled past hero section (approximately 600px)
      // Adjust this value based on your hero section height
      const heroHeight = 600;
      setIsOverWhite(window.scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProjectsClick = () => {
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
      {/* Hamburger Menu Button - Desktop and Mobile */}
      <label
        className="hamburger-menu scale-[0.33] sm:scale-50 md:scale-75 lg:scale-100"
        style={{ '--foreground': isOpen ? 'white' : (isOverWhite ? '#374151' : 'white') } as React.CSSProperties}
      >
        <input
          type="checkbox"
          checked={isOpen}
          onChange={(e) => setIsOpen(e.target.checked)}
        />
      </label>

      <style>{`
        .hamburger-menu {
          --bar-width: 60px;
          --bar-height: 8px;
          --hamburger-gap: 6px;
          --foreground: white;
          --background: transparent;
          --hamburger-margin: 16px;
          --animation-timing: 200ms ease-in-out;
          --hamburger-height: calc(var(--bar-height) * 3 + var(--hamburger-gap) * 2);
          --x-width: calc(var(--hamburger-height) * 1.41421356237);

          display: flex;
          flex-direction: column;
          gap: var(--hamburger-gap);
          width: max-content;
          position: fixed;
          top: var(--hamburger-margin);
          left: var(--hamburger-margin);
          z-index: 50;
          cursor: pointer;
          transform-origin: top left;
        }

        .hamburger-menu:has(input:checked) {
          --foreground: white;
          --background: transparent;
        }

        .hamburger-menu input {
          appearance: none;
          padding: 0;
          margin: 0;
          outline: none;
          pointer-events: none;
        }

        .hamburger-menu::before,
        .hamburger-menu::after,
        .hamburger-menu input {
          content: "";
          width: var(--bar-width);
          height: var(--bar-height);
          background-color: var(--foreground);
          border-radius: 9999px;
          transform-origin: left center;
          transition: opacity var(--animation-timing), width var(--animation-timing),
            rotate var(--animation-timing), translate var(--animation-timing),
            background-color var(--animation-timing);
        }

        .hamburger-menu::before {
          content: "";
        }

        .hamburger-menu::after {
          content: "";
        }

        .hamburger-menu:has(input:checked)::before {
          rotate: 45deg;
          width: var(--x-width);
          translate: 0 calc(var(--bar-height) / -2);
        }

        .hamburger-menu:has(input:checked)::after {
          rotate: -45deg;
          width: var(--x-width);
          translate: 0 calc(var(--bar-height) / 2);
        }

        .hamburger-menu input:checked {
          opacity: 0;
          width: 0;
        }
      `}</style>

      {/* Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 41 }}
          />
        )}
      </AnimatePresence>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 left-0 h-full w-64 bg-[#333] shadow-2xl flex flex-col"
            style={{ zIndex: 45 }}
          >
            {/* Menu Items */}
            <nav className="flex-1 p-4 pt-24 space-y-2">
              {/* View Toggle - Gradient text */}
              <button
                onClick={handleProjectsClick}
                className="w-full flex items-center gap-3 md:gap-4 px-4 py-3 md:px-5 md:py-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FolderKanban className="h-5 w-5 md:h-7 md:w-7 text-primary flex-shrink-0" />
                <span className="text-base md:text-xl font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {currentView === 'landing' ? 'Projects' : 'Landing'}
                </span>
              </button>

              {/* Experts - Lighter text */}
              <button
                onClick={handleExpertsClick}
                className="w-full flex items-center gap-3 md:gap-4 px-4 py-3 md:px-5 md:py-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Users className="h-5 w-5 md:h-7 md:w-7 text-gray-400 flex-shrink-0" />
                <span className="text-base md:text-xl text-gray-300">
                  Experts
                </span>
              </button>

              {/* Templates - Lighter text */}
              <button
                onClick={handleTemplatesClick}
                className="w-full flex items-center gap-3 md:gap-4 px-4 py-3 md:px-5 md:py-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FileText className="h-5 w-5 md:h-7 md:w-7 text-gray-400 flex-shrink-0" />
                <span className="text-base md:text-xl text-gray-300">
                  Templates
                </span>
              </button>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileMenu;
