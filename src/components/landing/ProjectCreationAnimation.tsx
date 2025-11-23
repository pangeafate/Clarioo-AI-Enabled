/**
 * ProjectCreationAnimation Component - Magic Wand Creation Animation
 *
 * @purpose Full-screen overlay animation for project creation
 *
 * FEATURES:
 * - Magic wand animation with sparkles (4-5 seconds)
 * - Success state with confetti animation
 * - Smooth transitions between states
 * - Auto-closes and triggers navigation after success
 *
 * STATES:
 * 1. Creating: Magic wand with sparkles + "Magic in progress!"
 * 2. Success: Green badge with checkmark + confetti + "I have created 20+ selection criteria for your task"
 * 3. Auto-navigate to project after brief delay
 *
 * @see LandingPage.tsx - Parent component that manages this animation
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Check, Sparkles } from 'lucide-react';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface ProjectCreationAnimationProps {
  isOpen: boolean;
  onComplete: () => void;
  isApiComplete?: boolean; // When true, animation can proceed to success state
}

type AnimationState = 'creating' | 'success' | 'completed';

export const ProjectCreationAnimation = ({ isOpen, onComplete, isApiComplete = false }: ProjectCreationAnimationProps) => {
  const [state, setState] = useState<AnimationState>('creating');
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setState('creating');
      setMinTimePassed(false);
      return;
    }

    // Minimum animation time (4.5 seconds) before allowing success state
    const minTimeTimer = setTimeout(() => {
      setMinTimePassed(true);
    }, 4500);

    return () => clearTimeout(minTimeTimer);
  }, [isOpen]);

  // Transition to success when BOTH minimum time passed AND API is complete
  useEffect(() => {
    if (minTimePassed && isApiComplete && state === 'creating') {
      setState('success');
    }
  }, [minTimePassed, isApiComplete, state]);

  useEffect(() => {
    if (state === 'success') {
      // State 2: Success (confetti) - show for 2 seconds, then auto-navigate
      const successTimer = setTimeout(() => {
        setState('completed');
        onComplete();
      }, 2000);

      return () => clearTimeout(successTimer);
    }
  }, [state, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          {/* Confetti particles */}
          {state === 'success' && (
            <>
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    y: '50%',
                    x: '50%',
                    opacity: 1,
                    scale: 0
                  }}
                  animate={{
                    y: [0, -200, -400],
                    x: Math.random() * 400 - 200,
                    opacity: [1, 1, 0],
                    scale: [0, 1, 0.5],
                    rotate: Math.random() * 720
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 0.3,
                    ease: 'easeOut'
                  }}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][
                        Math.floor(Math.random() * 5)
                      ],
                    }}
                  />
                </motion.div>
              ))}
            </>
          )}

          {/* Main animation container */}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative flex flex-col items-center"
          >
            {/* Creating State - Magic Wand */}
            <AnimatePresence mode="wait">
              {state === 'creating' && (
                <motion.div
                  key="creating"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Magic Wand Badge */}
                  <div className="relative">
                    <motion.div
                      animate={{
                        rotate: [0, -15, 15, -15, 0],
                        scale: [1, 1.1, 1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-2xl"
                    >
                      <Wand2 className="w-16 h-16 text-white" strokeWidth={2} />
                    </motion.div>

                    {/* Sparkles around wand */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                          x: Math.cos((i * Math.PI * 2) / 8) * 60,
                          y: Math.sin((i * Math.PI * 2) / 8) * 60,
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: 'easeOut'
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      >
                        <Sparkles className="w-6 h-6 text-yellow-400" fill="currentColor" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Creating Text */}
                  <motion.p
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`${TYPOGRAPHY.heading.h4} text-white text-center`}
                  >
                    Magic in progress!
                  </motion.p>
                </motion.div>
              )}

              {/* Success State - Green Badge with Confetti */}
              {state === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Success Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl"
                  >
                    <Check className="w-20 h-20 text-white" strokeWidth={3} />
                  </motion.div>

                  {/* Success Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center max-w-md px-6"
                  >
                    <p className={`${TYPOGRAPHY.heading.h4} text-white mb-2`}>
                      Success!
                    </p>
                    <p className={`${TYPOGRAPHY.body.default} text-gray-200`}>
                      I have created 20+ selection criteria for your task
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
