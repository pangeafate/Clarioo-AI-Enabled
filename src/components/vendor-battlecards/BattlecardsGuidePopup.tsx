/**
 * BattlecardsGuidePopup Component
 *
 * Educational popup explaining vendor battlecards
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Target, Users, Zap } from 'lucide-react';

interface BattlecardsGuidePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BattlecardsGuidePopup: React.FC<BattlecardsGuidePopupProps> = ({
  isOpen,
  onClose,
}) => {
  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/30 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="relative w-full max-w-lg max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close guide"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Vendor Battlecards
                </h2>
                <p className="text-sm text-gray-500">
                  Quick-reference comparison of key vendor differences
                </p>
              </div>

              {/* Main content sections */}
              <div className="space-y-6">
                {/* What are battlecards */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What are Battlecards?
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Battlecards provide a side-by-side comparison of key vendor differences including pricing models, target industries, notable customers, and integration capabilities. They help you quickly identify which vendors align best with your specific business context.
                  </p>
                </section>

                {/* Key categories */}
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What we compare:
                  </h3>
                  <div className="space-y-3">
                    {/* Target Verticals */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Target Verticals
                        </p>
                        <p className="text-xs text-gray-500">
                          Primary industries and sectors each vendor serves
                        </p>
                      </div>
                    </div>

                    {/* Key Customers */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Key Customers
                        </p>
                        <p className="text-xs text-gray-500">
                          Notable clients showcasing market presence
                        </p>
                      </div>
                    </div>

                    {/* Integrations */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Main Integrations
                        </p>
                        <p className="text-xs text-gray-500">
                          Key platform integrations and compatibility
                        </p>
                      </div>
                    </div>

                    {/* Additional Categories */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Layers className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Dynamic Categories
                        </p>
                        <p className="text-xs text-gray-500">
                          AI-selected categories based on your requirements
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* How it works */}
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    How it works:
                  </h3>
                  <ol className="space-y-3 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        1
                      </span>
                      <span>
                        AI analyzes each vendor's public information, documentation, and case studies
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        2
                      </span>
                      <span>
                        Key differences are extracted and organized into comparison categories
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        3
                      </span>
                      <span>
                        Click any cell to view full details and source citations
                      </span>
                    </li>
                  </ol>
                </section>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
