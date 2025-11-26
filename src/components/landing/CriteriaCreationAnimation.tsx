/**
 * CriteriaCreationAnimation Component - Animated SVG Grid with Flying Phrases
 *
 * @purpose Full-screen overlay animation for AI criteria creation
 *
 * FEATURES (SP_018):
 * - 3x3 grid of SVG icons (checkmarks, crosses, rectangles)
 * - Sequential path drawing animation with staggered delays
 * - Grid shuffling animation during active phase
 * - Flying text phrases with acceleration/deceleration
 * - API-aware graceful transition to success state
 *
 * PHASES:
 * 1. Drawing: SVG paths draw sequentially (~4.5s)
 * 2. Active: Grid shuffles + text phrases fly (until API complete)
 * 3. Success: Green checkmark + confetti + "Criteria prepared"
 *
 * @see SP_018_Criteria_Creation_Animation.md
 * @see LandingPage.tsx - Parent component
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Check } from 'lucide-react';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface CriteriaCreationAnimationProps {
  isOpen: boolean;
  onComplete: () => void;
  isApiComplete?: boolean; // When true, animation completes current motion then transitions
}

type AnimationPhase = 'drawing' | 'active' | 'completing' | 'success';
type IconType = 'checkmark' | 'cross' | 'rectangle';

interface GridIcon {
  id: string;
  type: IconType;
  position: number; // 0-8
  color: string;
}

// 15 phrases for text animation
const PHRASES = [
  'Analyzing requirements',
  'Understanding context',
  'Mapping business needs',
  'Identifying priorities',
  'Evaluating features',
  'Assessing technology fit',
  'Reviewing compliance needs',
  'Structuring criteria',
  'Defining parameters',
  'Building framework',
  'Organizing dimensions',
  'Validating requirements',
  'Finalizing criteria',
  'Preparing recommendations',
  'Framework complete',
];

const PHRASE_TRAVEL_DURATION = 600; // 0.6s travel time (in and out)
const PHRASE_CENTER_PAUSE_MIN = 1400; // 1.4s minimum center pause
const PHRASE_CENTER_PAUSE_MAX = 3300; // 3.3s maximum center pause

export const CriteriaCreationAnimation = ({
  isOpen,
  onComplete,
  isApiComplete = false,
}: CriteriaCreationAnimationProps) => {
  const [phase, setPhase] = useState<AnimationPhase>('drawing');
  const [gridIcons, setGridIcons] = useState<GridIcon[]>([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [swapCount, setSwapCount] = useState(0);
  const [redrawKey, setRedrawKey] = useState(0);
  const [dotCount, setDotCount] = useState(0); // 0-3 dots cycling

  // Generate random grid on mount or redraw
  useEffect(() => {
    if (!isOpen) {
      setPhase('drawing');
      setCurrentPhraseIndex(0);
      setSwapCount(0);
      return;
    }

    // Create random icon distribution (all white now)
    const types: IconType[] = [
      'checkmark', 'checkmark', 'checkmark',
      'cross', 'cross', 'cross',
      'rectangle', 'rectangle', 'rectangle',
    ];

    const shuffled = types.sort(() => Math.random() - 0.5);

    const icons = shuffled.map((type, index) => ({
      id: `icon-${redrawKey}-${index}`, // Unique key per redraw cycle
      type,
      position: index,
      color: '#FFFFFF', // All icons white
    }));

    setGridIcons(icons);

    // Transition to active phase after drawing completes (1/3 faster: ~3s drawing + 0.5s buffer)
    const drawingTimer = setTimeout(() => {
      setPhase('active');
      setSwapCount(0); // Reset swap count when entering active phase
    }, 3500);

    return () => clearTimeout(drawingTimer);
  }, [isOpen, redrawKey]);

  // Pairwise swapping during active phase
  useEffect(() => {
    if (phase !== 'active') return;

    const swapInterval = setInterval(() => {
      // Check if we've done 3 swaps
      if (swapCount >= 3) {
        // Trigger redraw cycle
        setPhase('drawing');
        setRedrawKey(prev => prev + 1);
        return;
      }

      // Perform pairwise swap
      setGridIcons((prev) => {
        const icons = [...prev];

        // Pick two random different indices
        const i = Math.floor(Math.random() * icons.length);
        let j = Math.floor(Math.random() * icons.length);
        while (j === i) {
          j = Math.floor(Math.random() * icons.length);
        }

        // Swap their positions
        const tempPosition = icons[i].position;
        icons[i] = { ...icons[i], position: icons[j].position };
        icons[j] = { ...icons[j], position: tempPosition };

        return icons;
      });

      setSwapCount(prev => prev + 1);
    }, 1000); // Swap every 1 second (reduced by 1/2)

    return () => clearInterval(swapInterval);
  }, [phase, swapCount]);

  // Text phrase cycling with variable center pause
  // Total time per phrase: 0.6s (travel in) + random 1.4-3.3s (center pause) + 0.6s (travel out)
  useEffect(() => {
    if (!isOpen) return;

    const timeoutIds: NodeJS.Timeout[] = [];

    const scheduleNextPhrase = (currentIndex: number) => {
      if (currentIndex >= PHRASES.length - 1) return; // Stop at last phrase

      // Random center pause duration (1.4s to 3.3s)
      const centerPauseDuration =
        PHRASE_CENTER_PAUSE_MIN +
        Math.random() * (PHRASE_CENTER_PAUSE_MAX - PHRASE_CENTER_PAUSE_MIN);

      // Total duration = travel in (0.6s) + center pause (variable) + travel out (0.6s)
      const totalDuration = PHRASE_TRAVEL_DURATION + centerPauseDuration + PHRASE_TRAVEL_DURATION;

      const timeoutId = setTimeout(() => {
        setCurrentPhraseIndex(currentIndex + 1);
        setDotCount(0); // Reset dots for new phrase
        scheduleNextPhrase(currentIndex + 1); // Schedule next with new random center pause
      }, totalDuration);

      timeoutIds.push(timeoutId);
    };

    scheduleNextPhrase(0);

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
    };
  }, [isOpen]);

  // Dot animation cycling (0 -> 1 -> 2 -> 3 -> 0) every 300ms during center pause
  useEffect(() => {
    if (!isOpen) return;

    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4); // Cycle through 0, 1, 2, 3
    }, 300);

    return () => clearInterval(dotInterval);
  }, [isOpen]);

  // API completion handling - complete current motion then transition
  useEffect(() => {
    if (isApiComplete && phase === 'active') {
      setPhase('completing');

      // Wait for current animation to complete
      setTimeout(() => {
        setPhase('success');
      }, 1000); // Max wait for shuffle/text to complete
    }
  }, [isApiComplete, phase]);

  // Success state auto-close
  useEffect(() => {
    if (phase === 'success') {
      const successTimer = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => clearTimeout(successTimer);
    }
  }, [phase, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          {/* Confetti for success state */}
          {phase === 'success' && (
            <>
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    y: '50%',
                    x: '50%',
                    opacity: 1,
                    scale: 0,
                  }}
                  animate={{
                    y: [0, -200, -400],
                    x: Math.random() * 400 - 200,
                    opacity: [1, 1, 0],
                    scale: [0, 1, 0.5],
                    rotate: Math.random() * 720,
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 0.3,
                    ease: 'easeOut',
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
            <AnimatePresence mode="wait">
              {/* Drawing/Active Phase - SVG Grid */}
              {(phase === 'drawing' || phase === 'active' || phase === 'completing') && (
                <motion.div
                  key="grid-animation"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-10"
                >
                  {/* SVG Grid - Use div grid instead of SVG for layout animations */}
                  <div
                    className="relative grid grid-cols-3 gap-3"
                    style={{ width: '115px', height: '115px' }}
                  >
                    {[...gridIcons]
                      .sort((a, b) => a.position - b.position)
                      .map((icon, index) => {
                        return (
                          <motion.div
                            key={icon.id}
                            layout
                            transition={{
                              type: 'spring',
                              damping: 25,
                              stiffness: 200,
                            }}
                            className="flex items-center justify-center"
                            style={{ width: '31px', height: '31px' }}
                          >
                            <svg
                              width="31"
                              height="31"
                              viewBox="0 0 45 45"
                              className="relative"
                            >
                              {icon.type === 'checkmark' && (
                                <motion.path
                                  d="M 10 25 L 20 35 L 35 10"
                                  stroke={icon.color}
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  fill="transparent"
                                  variants={drawVariants}
                                  custom={icon.position}
                                  initial="hidden"
                                  animate="visible"
                                />
                              )}

                              {icon.type === 'cross' && (
                                <>
                                  <motion.path
                                    d="M 10 10 L 35 35"
                                    stroke={icon.color}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    variants={drawVariants}
                                    custom={icon.position}
                                    initial="hidden"
                                    animate="visible"
                                  />
                                  <motion.path
                                    d="M 35 10 L 10 35"
                                    stroke={icon.color}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    variants={drawVariants}
                                    custom={icon.position + 0.5}
                                    initial="hidden"
                                    animate="visible"
                                  />
                                </>
                              )}

                              {icon.type === 'rectangle' && (
                                <motion.rect
                                  width="35"
                                  height="35"
                                  x="5"
                                  y="5"
                                  rx="8"
                                  stroke={icon.color}
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  fill="transparent"
                                  variants={drawVariants}
                                  custom={icon.position}
                                  initial="hidden"
                                  animate="visible"
                                />
                              )}
                            </svg>
                          </motion.div>
                        );
                      })}
                  </div>

                  {/* Flying Text Phrases - shown during all phases */}
                  <div className="h-8 flex items-center justify-center w-96 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentPhraseIndex}
                        variants={textVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute flex items-center"
                        style={{ left: '50%' }}
                      >
                        <span className="text-xl font-semibold text-white whitespace-nowrap" style={{ marginLeft: '-50%' }}>
                          {PHRASES[currentPhraseIndex]}
                        </span>
                        <span className="text-xl font-semibold text-white inline-block min-w-[24px]">
                          {'.'.repeat(dotCount)}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Success Phase - Green Checkmark */}
              {phase === 'success' && (
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
                    <p className={`${TYPOGRAPHY.heading.h4} text-white mb-2`}>Success!</p>
                    <p className={`${TYPOGRAPHY.body.default} text-gray-200`}>
                      Criteria prepared according to your request
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

/**
 * SVG Path Drawing Variants
 * Sequential drawing with staggered delays (0.33s increment - 1/3 faster)
 */
const drawVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => {
    const delay = i * 0.33; // 1/3 faster
    return {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay, type: 'spring', duration: 1.0, bounce: 0 }, // 1/3 faster
        opacity: { delay, duration: 0.01 },
      },
    };
  },
};

/**
 * Text Animation Variants
 * Accelerate in from left → slow in center → accelerate out right
 * With blur effect: blurred when fast (edges), sharp when slow (center)
 * Fixed travel time: 0.6s in and 0.6s out
 */
const textVariants: Variants = {
  enter: {
    x: -200,
    opacity: 0,
    filter: 'blur(8px)', // Moderate blur at entry
  },
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)', // Sharp at center
    transition: {
      duration: 0.6, // Fixed 0.6s travel in
      ease: 'easeIn',
    },
  },
  exit: {
    x: 200,
    opacity: 0,
    filter: 'blur(8px)', // Moderate blur at exit
    transition: {
      duration: 0.6, // Fixed 0.6s travel out
      ease: 'easeOut',
    },
  },
};
