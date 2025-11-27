/**
 * ExpertsModal Component
 *
 * @purpose Modal dialog for expert information with collapsible sections
 *
 * FEATURES:
 * - Two collapsible sections: "For Users" and "For Experts"
 * - Smooth expand/collapse animations
 * - Click outside to close
 * - Inactive "Start Application Process" button for experts
 *
 * SECTIONS:
 * - For Users: Information about expert support during software discovery
 * - For Experts: Invitation to join Clarioo network with application button
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { useState } from 'react';

interface ExpertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpertsModal = ({ isOpen, onClose }: ExpertsModalProps) => {
  const [expandedSection, setExpandedSection] = useState<'users' | 'experts' | null>(null);

  const toggleSection = (section: 'users' | 'experts') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gray-100 border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className={`${TYPOGRAPHY.heading.h3} bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}>
                  Clarioo Experts
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* For Users Section */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('users')}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-xl font-semibold text-gray-700">
                      For Users
                    </span>
                    {expandedSection === 'users' ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'users' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                          <p className={`${TYPOGRAPHY.body.default} text-gray-700 leading-relaxed`}>
                            When you discover software solutions with Clarioo, at each stage you will be able to request expert support. Clarioo has a number of trusted in-house and 3rd party experts to assist your software discovery journey.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* For Experts Section */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('experts')}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-xl font-semibold text-gray-700">
                      For Experts
                    </span>
                    {expandedSection === 'experts' ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'experts' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 pt-2 border-t border-gray-100 space-y-4">
                          <p className={`${TYPOGRAPHY.body.default} text-gray-700 leading-relaxed`}>
                            Join the Clarioo network of trusted experts and help businesses make better software decisions. Share your expertise and earn income while making a real impact.
                          </p>
                          <Button
                            disabled
                            className="w-full bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
                          >
                            Start Application Process
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
