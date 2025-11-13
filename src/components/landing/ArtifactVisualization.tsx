/**
 * ArtifactVisualization Component - Landing Page Element 6
 *
 * @prototype Visual demonstration component
 * @purpose One-viewport graphic showing workflow step → AI processing → artifact output
 *
 * FEATURES (SP_007):
 * - Element 6: Visual representation of how each step produces deliverables
 * - Animated transitions between examples (3-4 second intervals)
 * - Shows: Input → AI Processing (animated) → Output Artifact
 * - Reinforces "no black box" transparency promise
 *
 * DESIGN SPECS:
 * - Single viewport height (min-h-screen or contained section)
 * - Card-based layout with elevated shadows
 * - Animated arrows showing flow
 * - Rotating examples (3 workflow steps showcased)
 *
 * EXAMPLES SHOWCASED:
 * 1. Tech Input → Context Analysis → Requirements Document
 * 2. Requirements → AI Criteria Generation → Evaluation Matrix PDF
 * 3. Criteria → Intelligent Search → Vendor Comparison Table
 *
 * @see SP_007 Sprint Plan - Phase 1, Task 1.2 (Element 6)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FileText, Brain, CheckCircle2, MoveRight, MoveDown } from 'lucide-react';

const artifacts = [
  {
    id: 1,
    input: 'Your Requirements',
    process: 'AI Analysis',
    output: 'Structured Criteria',
    inputIcon: <FileText className="h-8 w-8" />,
    outputIcon: <CheckCircle2 className="h-8 w-8" />,
    description: 'Transform vague needs into clear evaluation criteria'
  },
  {
    id: 2,
    input: 'Evaluation Criteria',
    process: 'Intelligent Search',
    output: 'Vendor Matches',
    inputIcon: <CheckCircle2 className="h-8 w-8" />,
    outputIcon: <FileText className="h-8 w-8" />,
    description: 'Find vendors that perfectly match your requirements'
  },
  {
    id: 3,
    input: 'Selected Vendors',
    process: 'Comparison Analysis',
    output: 'Decision Matrix',
    inputIcon: <FileText className="h-8 w-8" />,
    outputIcon: <CheckCircle2 className="h-8 w-8" />,
    description: 'Compare vendors side-by-side with clear recommendations'
  }
];

export const ArtifactVisualization = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % artifacts.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const current = artifacts[currentIndex];

  return (
    <section className="px-4 py-16 bg-gradient-hero-bg">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-navy mb-4">
            See Every Step of the Process
          </h2>
          <p className="text-lg text-neutral-slate max-w-2xl mx-auto">
            Complete transparency from input to output. Watch how AI transforms your requirements into actionable insights.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row gap-8 items-center justify-center"
          >
            {/* Input Card - Circular */}
            <motion.div
              className="relative bg-white rounded-full w-56 h-56 shadow-elevated-combined flex items-center justify-center"
              whileHover={{ scale: 1.05, shadow: "0 20px 40px rgba(0,0,0,0.12)" }}
            >
              <div className="flex flex-col items-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-3">
                  {current.inputIcon}
                </div>
                <h3 className="font-semibold text-neutral-navy mb-1 text-sm">
                  {current.input}
                </h3>
                <p className="text-xs text-neutral-slate">
                  What you provide
                </p>
              </div>
            </motion.div>

            {/* Arrow 1 - Horizontal (Desktop) */}
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                x: { duration: 1, repeat: Infinity, repeatType: "reverse" },
                opacity: { duration: 0.5 }
              }}
              className="hidden md:block"
            >
              <MoveRight className="h-10 w-10 text-brand-blue" strokeWidth={2.5} />
            </motion.div>

            {/* Arrow 1 - Vertical (Mobile) */}
            <motion.div
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                y: { duration: 1, repeat: Infinity, repeatType: "reverse" },
                opacity: { duration: 0.5 }
              }}
              className="block md:hidden -my-4"
            >
              <MoveDown className="h-8 w-12 text-brand-blue" strokeWidth={2.5} />
            </motion.div>

            {/* Processing Card - Rounded Square */}
            <motion.div
              className="relative bg-gradient-button rounded-2xl w-44 h-44 shadow-button-glow flex items-center justify-center"
              animate={{
                boxShadow: [
                  '0 4px 14px rgba(99,102,241,0.4)',
                  '0 8px 20px rgba(99,102,241,0.6)',
                  '0 4px 14px rgba(99,102,241,0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex flex-col items-center text-center text-white px-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mb-3"
                >
                  <Brain className="h-10 w-10" />
                </motion.div>
                <h3 className="font-semibold mb-1">
                  {current.process}
                </h3>
                <p className="text-sm opacity-90">
                  AI at work
                </p>
              </div>
            </motion.div>

            {/* Arrow 2 - Horizontal (Desktop) */}
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                x: { duration: 1, repeat: Infinity, repeatType: "reverse" },
                opacity: { duration: 0.5 }
              }}
              className="hidden md:block"
            >
              <MoveRight className="h-10 w-10 text-brand-blue" strokeWidth={2.5} />
            </motion.div>

            {/* Arrow 2 - Vertical (Mobile) */}
            <motion.div
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                y: { duration: 1, repeat: Infinity, repeatType: "reverse" },
                opacity: { duration: 0.5 }
              }}
              className="block md:hidden -my-4"
            >
              <MoveDown className="h-8 w-12 text-brand-blue" strokeWidth={2.5} />
            </motion.div>

            {/* Output Card - Circular */}
            <motion.div
              className="relative bg-white rounded-full w-56 h-56 shadow-elevated-combined flex items-center justify-center"
              whileHover={{ scale: 1.05, shadow: "0 20px 40px rgba(0,0,0,0.12)" }}
            >
              <div className="flex flex-col items-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-brand-blueLight/10 flex items-center justify-center text-brand-blueLight mb-3">
                  {current.outputIcon}
                </div>
                <h3 className="font-semibold text-neutral-navy mb-1 text-sm">
                  {current.output}
                </h3>
                <p className="text-xs text-neutral-slate">
                  What you get
                </p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Description */}
        <AnimatePresence mode="wait">
          <motion.p
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center text-lg text-neutral-slate mt-8"
          >
            {current.description}
          </motion.p>
        </AnimatePresence>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {artifacts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${index === currentIndex
                  ? 'w-8 bg-brand-blue'
                  : 'bg-brand-blue/30 hover:bg-brand-blue/50'
                }
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
