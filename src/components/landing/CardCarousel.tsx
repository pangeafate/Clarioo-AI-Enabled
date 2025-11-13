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
    bgGradient: 'from-blue-50 via-blue-50/50 to-white',
    accentColor: 'text-brand-blue',
    iconBg: 'bg-brand-blue/10'
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
    bgGradient: 'from-indigo-50 via-indigo-50/50 to-white',
    accentColor: 'text-indigo-600',
    iconBg: 'bg-indigo-100'
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
    bgGradient: 'from-sky-50 via-sky-50/50 to-white',
    accentColor: 'text-brand-blueLight',
    iconBg: 'bg-sky-100'
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
    bgGradient: 'from-cyan-50 via-cyan-50/50 to-white',
    accentColor: 'text-cyan-600',
    iconBg: 'bg-cyan-100'
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
    bgGradient: 'from-blue-50 via-blue-50/50 to-white',
    accentColor: 'text-brand-blueDark',
    iconBg: 'bg-blue-100'
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
    <section className="px-4 py-16 bg-gradient-to-b from-gray-50 to-white">
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
            <span className="px-6 py-3 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium border border-brand-blue/20">
              90% of routine work automated
            </span>
            <span className="px-6 py-3 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium border border-brand-blue/20">
              Clear comparison criteria
            </span>
            <span className="px-6 py-3 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium border border-brand-blue/20">
              Follows your business needs
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
                      scale: index === selectedIndex ? 1 : 0.95,
                      opacity: index === selectedIndex ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <div
                      className={`
                        rounded-3xl overflow-hidden h-full
                        ${index === selectedIndex ? 'shadow-2xl' : 'shadow-lg'}
                        transition-all duration-300 flex flex-col
                      `}
                    >
                      {/* Visual Mockup Area with Gradient Background */}
                      <div className={`relative h-64 bg-gradient-to-br ${card.bgGradient} overflow-hidden`}>
                        {/* Decorative background elements */}
                        <div className="absolute inset-0">
                          <div className={`absolute top-10 right-10 w-32 h-32 rounded-full ${card.iconBg} blur-3xl opacity-40`} />
                          <div className={`absolute bottom-10 left-10 w-40 h-40 rounded-full ${card.iconBg} blur-3xl opacity-30`} />
                        </div>

                        {/* Icon mockup */}
                        <div className="relative h-full flex items-center justify-center">
                          <div className={`w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center ${card.accentColor} transform hover:scale-110 transition-transform duration-300`}>
                            {card.icon}
                          </div>
                        </div>

                        {/* Step badge */}
                        <div className="absolute top-6 left-6">
                          <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md">
                            <span className={`text-sm font-bold ${card.accentColor}`}>
                              {card.step}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="bg-white p-8 flex-1 flex flex-col">
                        {/* Title */}
                        <h3 className="text-2xl font-bold text-neutral-navy mb-3">
                          {card.title}
                        </h3>

                        {/* Description */}
                        <p className="text-neutral-slate mb-6 leading-relaxed flex-1">
                          {card.description}
                        </p>

                        {/* Process Flow - Compact */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-sm text-neutral-slate">
                            <span className="font-medium">Input:</span>
                            <span className="text-xs">{card.processFlow.input}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm font-semibold ${card.accentColor}`}>
                            <ArrowRight className="h-4 w-4" />
                            <span className="text-xs">{card.processFlow.aiProcessing}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-slate">
                            <span className="font-medium">Output:</span>
                            <span className="text-xs">{card.processFlow.output}</span>
                          </div>
                        </div>

                        {/* Deliverable */}
                        <div className="mb-6 pb-6 border-b border-gray-100">
                          <p className="text-xs text-neutral-slate mb-1">Deliverable:</p>
                          <p className="text-sm font-semibold text-neutral-navy">
                            📄 {card.artifact}
                          </p>
                        </div>

                        {/* CTA Button */}
                        <Button
                          className="w-full bg-gradient-to-r from-brand-blue to-brand-blueLight text-white hover:shadow-lg transition-all duration-300 rounded-xl h-12 text-base font-semibold"
                        >
                          {card.ctaText}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
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
