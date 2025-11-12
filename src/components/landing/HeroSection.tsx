/**
 * HeroSection Component - Landing Page Elements 1 & 2
 *
 * @prototype Visual demonstration component
 * @purpose Displays main headline and subtitle for landing page
 *
 * FEATURES (SP_007):
 * - Element 1: Large gradient headline with mobile-first typography
 * - Element 2: Clear value proposition subtitle
 * - Responsive: 56px desktop / 36px mobile headline
 * - Gradient text treatment using brand purple colors
 *
 * DESIGN SPECS:
 * - Typography: -0.02em letter-spacing, warm grays
 * - Gradient: bg-gradient-hero text treatment
 * - Mobile-first responsive breakpoints
 *
 * @see SP_007 Sprint Plan - Phase 1, Task 1.2
 */

import { motion } from 'framer-motion';

export const HeroSection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center px-4 py-12 md:py-16"
    >
      {/* Element 1: Title */}
      <h1
        className="
          text-4xl md:text-5xl lg:text-6xl
          font-bold
          bg-gradient-to-r from-brand-blue to-brand-blueLight
          bg-clip-text text-transparent
          mb-6
          tracking-tight
          leading-tight
        "
        style={{ letterSpacing: '-0.02em' }}
      >
        Supercharge your software vendor's selection with AI assistant
      </h1>

      {/* Element 2: Subtitle */}
      <p className="text-lg md:text-xl text-neutral-slate max-w-3xl mx-auto leading-relaxed">
        Discover, evaluate, and select the perfect vendors in minutes, not weeks.
        Let AI guide you through intelligent vendor discovery with transparent, data-driven recommendations.
      </p>

      {/* Value proposition badges */}
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-neutral-navy shadow-soft border border-gray-100">
          ⚡ 90% of routine work automated
        </span>
        <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-neutral-navy shadow-soft border border-gray-100">
          ✓ No doubts in decisions
        </span>
        <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-neutral-navy shadow-soft border border-gray-100">
          🚀 &lt;24 hours from start to selection
        </span>
      </div>
    </motion.section>
  );
};
