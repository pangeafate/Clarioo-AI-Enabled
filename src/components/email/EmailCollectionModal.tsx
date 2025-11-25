/**
 * Email Collection Modal
 *
 * A blocking modal that appears when users click "Create with AI" for the first time.
 * Collects user email and sends to n8n/Google Sheets for tracking and analytics.
 *
 * Features:
 * - Unskippable (no close button, can close by clicking outside)
 * - Gradient design matching VISION.md (purple gradients, elevated shadows)
 * - Lottie success animation (cup with sparkles, 1 second)
 * - Mobile-responsive (350px min width)
 * - Email validation on frontend
 * - Silent retry on failed submissions
 *
 * @module components/email/EmailCollectionModal
 */

import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

import { collectEmail } from '@/services/n8nService';
import { TYPOGRAPHY } from '@/styles/typography-config';

export interface EmailCollectionModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export const EmailCollectionModal: React.FC<EmailCollectionModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  /**
   * Validate email format
   */
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  /**
   * Handle email input change with live validation
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Clear error when user starts typing
    if (emailError && value.length > 0) {
      setEmailError('');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);

    // Show success animation IMMEDIATELY (don't wait for API)
    setShowSuccess(true);

    // Call n8n service in background (fire and forget)
    collectEmail(email).catch(err => {
      console.error('[modal] Email collection error:', err);
      // Silent retry will happen on next user action
    });

    // Wait 1.5 seconds for success animation, then proceed to project creation
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="relative w-full max-w-md min-[350px]:max-w-sm"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Animation - Thank You with Confetti and Sparkles */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Container for confetti and sparkles - no background */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    {/* Confetti particles - explosive upward burst */}
                    {[...Array(25)].map((_, i) => (
                      <motion.div
                        key={`confetti-${i}`}
                        initial={{
                          x: (Math.random() - 0.5) * 200,
                          y: 80,
                          opacity: 0,
                          scale: 0
                        }}
                        animate={{
                          x: (Math.random() - 0.5) * 200 + (Math.random() - 0.5) * 150,
                          y: [0, -360, -720],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0.5],
                          rotate: Math.random() * 1080
                        }}
                        transition={{
                          duration: 1.5,
                          delay: Math.random() * 0.2,
                          ease: 'easeOut'
                        }}
                        className="absolute left-1/2 bottom-0"
                      >
                        <div
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                          style={{
                            background: [
                              '#3B82F6',  // blue
                              '#8B5CF6',  // purple
                              '#EC4899',  // pink
                              '#F59E0B',  // orange
                              '#10B981',  // green
                              '#EAB308',  // gold/yellow
                              '#16A34A',  // darker green
                              '#FBBF24',  // lighter gold
                            ][Math.floor(Math.random() * 8)],
                          }}
                        />
                      </motion.div>
                    ))}

                    {/* Sparkles - explosive burst from top of text (gold and green) */}
                    {[...Array(12)].map((_, i) => {
                      const angle = (i * Math.PI * 2) / 12;
                      const colors = ['text-yellow-400', 'text-amber-400', 'text-green-500', 'text-emerald-400'];
                      const colorClass = colors[i % colors.length];
                      return (
                        <motion.div
                          key={`sparkle-${i}`}
                          initial={{
                            opacity: 0,
                            scale: 0,
                            x: 0,
                            y: -20
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.2, 0],
                            x: Math.cos(angle) * 180,
                            y: -20 + Math.sin(angle) * 180,
                          }}
                          transition={{
                            duration: 1.2,
                            delay: 0.05 + i * 0.04,
                            ease: 'easeOut'
                          }}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        >
                          <Sparkles className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} fill="currentColor" />
                        </motion.div>
                      );
                    })}

                    {/* Thank You Text with white gradient background */}
                    <div className="relative">
                      {/* White rounded rectangle background - fades to edges */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          type: 'spring',
                          stiffness: 200
                        }}
                        className="absolute inset-0 -inset-x-12 -inset-y-6 rounded-2xl"
                        style={{
                          background: 'radial-gradient(ellipse 100% 100% at center, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)'
                        }}
                      />

                      {/* Thank You Text - Darker Green Bold */}
                      <motion.h2
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          type: 'spring',
                          stiffness: 200
                        }}
                        className="relative z-10 text-4xl sm:text-5xl font-black text-green-700"
                        style={{
                          textShadow: '0 2px 10px rgba(21, 128, 61, 0.4)',
                          letterSpacing: '0.02em'
                        }}
                      >
                        Thank You!
                      </motion.h2>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-[0_10px_25px_rgba(99,102,241,0.15),0_4px_10px_rgba(99,102,241,0.1)] p-6 sm:p-8 border border-purple-100">
              {/* Clarioo Badge/Logo - Same as Hero Section */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-br from-gray-200 via-blue-200/90 to-purple-200/90 rounded-xl sm:rounded-2xl">
                  <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    Clarioo
                  </span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 sm:mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                Welcome to Clarioo!
              </h2>

              {/* Description */}
              <p className="text-xs sm:text-sm md:text-base text-center mb-6 sm:mb-8 leading-relaxed px-1 sm:px-2">
                <span className="text-gray-600">
                  We can do exciting things helping you to find the right vendors through deep research, evidence-based product comparison and more.
                </span>
                <br /><br />
                <span className="text-gray-400">
                  No registration needed — just your email so we can improve your experience. And don't worry, we'll only reach out thoughtfully.
                </span>
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Email Input */}
                <div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="email@example.com"
                    required
                    disabled={isSubmitting}
                    className={`
                      w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-2
                      text-sm sm:text-base
                      ${emailError ? 'border-red-400' : 'border-purple-200'}
                      focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20
                      transition-all duration-200
                      disabled:bg-gray-50 disabled:cursor-not-allowed
                      text-gray-800 placeholder:text-gray-400
                    `}
                  />
                  {emailError && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email || !!emailError}
                  className="
                    w-full py-2.5 px-4 sm:py-3 sm:px-6 rounded-xl
                    bg-gradient-to-r from-purple-600 to-indigo-600
                    text-white font-semibold text-base sm:text-lg
                    shadow-[0_4px_14px_rgba(99,102,241,0.4)]
                    hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    transition-all duration-200
                  "
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailCollectionModal;
