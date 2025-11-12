/**
 * CardCarousel Component - Landing Page Element 8
 *
 * @prototype Visual demonstration component
 * @purpose Interactive card carousel showcasing 5-step workflow
 *
 * FEATURES (SP_007):
 * - Element 8: HubSpot-style interactive carousel
 * - 5 cards (one per workflow step)
 * - 3 visible on desktop, 1 on mobile
 * - Auto-rotation: 4-second intervals with pause/play control
 * - Navigation: Left/right arrows + keyboard support + swipe gestures
 * - Each card: screenshot, title+icon, description, process flow, artifact, CTA
 *
 * DESIGN SPECS:
 * - Card: White bg, 16px border-radius, shadow, 24px padding
 * - Center focus: Middle card scaled 1.05x, side cards 0.7 opacity
 * - Screenshot: 280px height, device frame effect
 * - Value props above: "How Vendora AI Works" + 3 benefit badges
 *
 * CARD STRUCTURE:
 * 1. Tech Exploration: Company + solution input
 * 2. Criteria Building: AI-generated evaluation matrix
 * 3. Vendor Discovery: Intelligent search with match scores
 * 4. Vendor Comparison: Interactive comparison matrix
 * 5. Vendor Engagement: Automated outreach and tracking
 *
 * @see SP_007 Sprint Plan - Phase 3, Task 3.3 (Interactive Card Carousel)
 */

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, ArrowRight, Search, FileCheck, Users, MessageSquare, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const workflowCards = [
  {
    id: 1,
    step: 'Step 1',
    title: 'Technology Exploration',
    icon: <Search className="h-6 w-6" />,
    description: 'Tell us about your company and what solution you\'re looking for. Our AI understands context and requirements.',
    processFlow: {
      input: 'Company profile + Requirements',
      aiProcessing: 'Context analysis',
      output: 'Structured requirements'
    },
    artifact: 'Requirements Document',
    ctaText: 'Try Now',
    gradient: 'from-blue-500/10 to-purple-500/10'
  },
  {
    id: 2,
    step: 'Step 2',
    title: 'Criteria Building',
    icon: <FileCheck className="h-6 w-6" />,
    description: 'AI generates comprehensive evaluation criteria tailored to your industry and needs. Review, refine, and prioritize.',
    processFlow: {
      input: 'Requirements',
      aiProcessing: 'Criteria generation',
      output: 'Evaluation matrix'
    },
    artifact: 'Criteria Matrix PDF',
    ctaText: 'See Example',
    gradient: 'from-purple-500/10 to-pink-500/10'
  },
  {
    id: 3,
    step: 'Step 3',
    title: 'Vendor Discovery',
    icon: <Users className="h-6 w-6" />,
    description: 'Intelligent search across thousands of vendors. Get match scores, key features, and AI-powered recommendations.',
    processFlow: {
      input: 'Evaluation criteria',
      aiProcessing: 'Intelligent matching',
      output: 'Ranked vendor list'
    },
    artifact: 'Vendor Matches',
    ctaText: 'Explore',
    gradient: 'from-pink-500/10 to-red-500/10'
  },
  {
    id: 4,
    step: 'Step 4',
    title: 'Vendor Comparison',
    icon: <MessageSquare className="h-6 w-6" />,
    description: 'Compare vendors side-by-side with detailed matrices. See strengths, weaknesses, and get clear recommendations.',
    processFlow: {
      input: 'Selected vendors',
      aiProcessing: 'Comparison analysis',
      output: 'Decision matrix'
    },
    artifact: 'Comparison Report',
    ctaText: 'View Matrix',
    gradient: 'from-red-500/10 to-orange-500/10'
  },
  {
    id: 5,
    step: 'Step 5',
    title: 'Vendor Engagement',
    icon: <Mail className="h-6 w-6" />,
    description: 'Send professional outreach emails to vendors. Track responses and schedule demos - all in one place.',
    processFlow: {
      input: 'Vendor selection',
      aiProcessing: 'Email generation',
      output: 'Outreach campaigns'
    },
    artifact: 'Email Templates',
    ctaText: 'Get Started',
    gradient: 'from-orange-500/10 to-yellow-500/10'
  }
];

export const CardCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    slidesToScroll: 1,
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // Auto-play functionality
  useEffect(() => {
    if (!emblaApi || !isPlaying) return;

    const timer = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);

    return () => clearInterval(timer);
  }, [emblaApi, isPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollPrev();
      if (e.key === 'ArrowRight') scrollNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollPrev, scrollNext]);

  return (
    <section className="px-4 py-16 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-navy mb-6">
            How Clarioo AI Works
          </h2>
          <p className="text-lg text-neutral-slate mb-8 max-w-2xl mx-auto">
            From requirements to vendor selection in 5 intelligent steps
          </p>

          {/* Value proposition badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium">
              ⚡ 90% of routine work automated
            </span>
            <span className="px-4 py-2 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium">
              ✓ No doubts in decisions
            </span>
            <span className="px-4 py-2 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium">
              🚀 &lt;24 hours from start to selection
            </span>
          </div>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {workflowCards.map((card, index) => (
                <div
                  key={card.id}
                  className="flex-[0_0_100%] md:flex-[0_0_45%] lg:flex-[0_0_35%] px-4"
                >
                  <motion.div
                    animate={{
                      scale: index === selectedIndex ? 1.05 : 1,
                      opacity: index === selectedIndex ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      bg-white rounded-2xl p-6 shadow-elevated-combined
                      border border-gray-100 h-full
                      ${index === selectedIndex ? 'ring-2 ring-brand-blue/30' : ''}
                    `}
                  >
                    {/* Card content */}
                    <div className="space-y-4">
                      {/* Step badge and icon */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-brand-blue">
                          {card.step}
                        </span>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-brand-blue`}>
                          {card.icon}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-neutral-navy">
                        {card.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-neutral-slate leading-relaxed">
                        {card.description}
                      </p>

                      {/* Process Flow */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-neutral-slate">
                          <span className="font-medium">Input:</span>
                          <span>{card.processFlow.input}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-brand-blue font-medium">
                          <ArrowRight className="h-3 w-3" />
                          <span>{card.processFlow.aiProcessing}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-slate">
                          <span className="font-medium">Output:</span>
                          <span>{card.processFlow.output}</span>
                        </div>
                      </div>

                      {/* Artifact */}
                      <div className="pt-2">
                        <span className="text-xs text-neutral-slate">Deliverable:</span>
                        <p className="text-sm font-semibold text-neutral-navy mt-1">
                          📄 {card.artifact}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                      >
                        {card.ctaText}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="rounded-full border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded-full border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
              aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="rounded-full border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {workflowCards.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${index === selectedIndex
                    ? 'w-8 bg-brand-blue'
                    : 'w-2 bg-brand-blue/30 hover:bg-brand-blue/50'
                  }
                `}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
