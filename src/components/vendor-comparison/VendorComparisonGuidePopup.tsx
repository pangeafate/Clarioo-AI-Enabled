/**
 * VendorComparisonGuidePopup Component
 *
 * Educational popup explaining the vendor comparison process
 * Shows on first visit when no vendor summaries exist
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, HelpCircle, Minus, X } from 'lucide-react';

interface VendorComparisonGuidePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VendorComparisonGuidePopup: React.FC<VendorComparisonGuidePopupProps> = ({
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
                  Vendor Comparison
                </h2>
                <p className="text-sm text-gray-500">
                  Understanding how we analyze and compare vendors
                </p>
              </div>

              {/* Main content sections */}
              <div className="space-y-6">
                {/* What we're doing section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Here is what we are doing:
                  </h3>
                  <ol className="space-y-3 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        1
                      </span>
                      <span>
                        For each criterion you selected, we check if there is evidence that the vendor satisfies this criterion
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        2
                      </span>
                      <span>We share the evidence with you</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        3
                      </span>
                      <span>
                        We cross-compare the vendors, understand the insights about them
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        4
                      </span>
                      <span>
                        We prepare the summaries for each vendor and one summary for all findings
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        5
                      </span>
                      <span>
                        In the Executive Summary we will prep you for a call with the vendor (what to ask, where to focus)
                      </span>
                    </li>
                  </ol>
                </section>

                {/* Ranking legend section */}
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    In the table we display the following rankings:
                  </h3>
                  <div className="space-y-3">
                    {/* Star */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Exceptional performance
                        </p>
                        <p className="text-xs text-gray-500">
                          Vendor excels in this criterion vs competitors
                        </p>
                      </div>
                    </div>

                    {/* Yes/Check */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Feature confirmed/present
                        </p>
                        <p className="text-xs text-gray-500">
                          Evidence found that vendor has this feature
                        </p>
                      </div>
                    </div>

                    {/* Unknown */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Unclear or no evidence found
                        </p>
                        <p className="text-xs text-gray-500">
                          Insufficient information to make a determination
                        </p>
                      </div>
                    </div>

                    {/* No/Minus */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Minus className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Feature explicitly absent
                        </p>
                        <p className="text-xs text-gray-500">
                          Evidence shows vendor doesn't have this feature
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Next steps section */}
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Next steps:
                  </h3>
                  <ol className="space-y-3 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                        1
                      </span>
                      <span>
                        You shortlist the vendors you'd like to continue with (click on the star in vendor's card)
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                        2
                      </span>
                      <span>
                        Will reach out to those vendors that you selected and ask them to validate the evidence and provide comments for each criterion
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                        3
                      </span>
                      <span>
                        You will also have an opportunity to request the demo
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
