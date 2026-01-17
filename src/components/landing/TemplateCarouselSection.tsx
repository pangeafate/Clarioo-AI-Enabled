/**
 * TemplateCarouselSection Component
 *
 * @purpose Display template cards in a carousel format on landing page
 * @features
 * - Category filter showing only categories with templates
 * - Carousel with 3 cards visible on desktop, 1 on mobile
 * - Same navigation pattern as CardCarousel (arrows + dots, manual only)
 * - Clicking card opens CriteriaPreviewModal (same as TemplatesModal)
 *
 * @integration Inserted above CardCarousel in LandingPage
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { CategoryFilter } from '../templates/CategoryFilter';
import { TemplateCard } from '../templates/TemplateCard';
import { CriteriaPreviewModal } from '../templates/CriteriaPreviewModal';
import { EmailCollectionModal } from '../email/EmailCollectionModal';
import { createProjectFromTemplate, getTemplatesFromN8n } from '@/services/templateService';
import { hasSubmittedEmail } from '@/services/n8nService';
import type { Template } from '@/types/template.types';
import { Project } from '../VendorDiscovery';

interface TemplateCarouselSectionProps {
  onTemplateProjectCreated?: (project: Project) => void;
}

export const TemplateCarouselSection: React.FC<TemplateCarouselSectionProps> = ({
  onTemplateProjectCreated,
}) => {
  // SP_028: Load templates from n8n
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // SP_028: Load templates from n8n on mount
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const templatesFromN8n = await getTemplatesFromN8n();
        setTemplates(templatesFromN8n);
      } catch (error) {
        console.error('[TemplateCarouselSection] Failed to load templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // Extract unique categories from templates (excluding "All")
  const categories = useMemo(() => {
    const uniqueCategories = new Set(templates.map(t => t.templateCategory));
    return ['All', ...Array.from(uniqueCategories)];
  }, [templates]);

  const { toast } = useToast();

  // State for selected categories (default to "All")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);

  // State for criteria preview modal
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCriteriaPreviewOpen, setIsCriteriaPreviewOpen] = useState(false);

  // State for email collection modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [templateToCreate, setTemplateToCreate] = useState<Template | null>(null);

  // Filter templates based on selected categories
  const filteredTemplates = useMemo(() => {
    if (selectedCategories.includes('All')) {
      return templates;
    }
    return templates.filter(t => selectedCategories.includes(t.templateCategory));
  }, [templates, selectedCategories]);

  // Embla Carousel setup - same configuration for 2+ cards
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    slidesToScroll: 1,
    skipSnaps: false,
    containScroll: false, // Allow scrolling even when all slides fit in viewport (needed for 2 cards on desktop)
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

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

  // Keyboard navigation - same as CardCarousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollPrev();
      if (e.key === 'ArrowRight') scrollNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollPrev, scrollNext]);

  // Handle category selection
  const handleCategoryChange = (newCategories: string[]) => {
    setSelectedCategories(newCategories);
  };

  // Reset carousel when category selection changes
  useEffect(() => {
    if (emblaApi && filteredTemplates.length > 0) {
      requestAnimationFrame(() => {
        emblaApi.reInit();

        // WORKAROUND: When exactly 3 cards appear, reInit() doesn't position them correctly
        // (card 3 appears outside viewport). Triggering scrollNext() forces Embla to
        // recalculate positioning properly. Middle card (index 1) will be focused.
        if (filteredTemplates.length === 3) {
          requestAnimationFrame(() => {
            emblaApi.scrollNext(); // Fixes positioning, lands on middle card
          });
        } else {
          // For other card counts, scroll to first card
          emblaApi.scrollTo(0, true);
        }
      });
    }
  }, [emblaApi, selectedCategories, filteredTemplates.length]);

  // Handle template card click - opens criteria preview modal
  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setIsCriteriaPreviewOpen(true);
  };

  // Handle "Use These Criteria" button click
  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;

    // Check if email has been submitted
    if (!hasSubmittedEmail()) {
      // Show email collection modal first
      setTemplateToCreate(selectedTemplate);
      setIsCriteriaPreviewOpen(false);
      setIsEmailModalOpen(true);
      return;
    }

    // Create project from template
    await createProjectAndNavigate(selectedTemplate);
  };

  // Handle email submission
  const handleEmailSubmitted = async () => {
    setIsEmailModalOpen(false);

    if (templateToCreate) {
      // Create project from template after email collected
      await createProjectAndNavigate(templateToCreate);
      setTemplateToCreate(null);
    }
  };

  // Create project and notify parent component
  const createProjectAndNavigate = async (template: Template) => {
    try {
      const { projectId, success } = await createProjectFromTemplate(template);

      if (success) {
        // Close modals
        setIsCriteriaPreviewOpen(false);

        // Show success toast
        toast({
          title: 'Project created from template',
          description: `${template.projectName} with ${template.criteria.length} criteria loaded`,
          duration: 3000,
        });

        // Notify parent component (LandingPage) to select this project
        if (onTemplateProjectCreated) {
          const newProject = {
            id: projectId,
            name: template.projectName,
            description: template.projectDescription || template.searchedBy || template.projectName,
            status: 'draft' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: template.templateCategory,
          };
          onTemplateProjectCreated(newProject);
        }
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('[TemplateCarouselSection] Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project from template. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <>
      <section className="px-4 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className={`${TYPOGRAPHY.heading.h2} mb-4 max-w-4xl mx-auto`}>
              What others discover...
            </h2>
          </motion.div>

          {/* Category Filter */}
          <div className="mb-8 flex justify-center">
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Loading State */}
          {isLoadingTemplates ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
              <p className={`${TYPOGRAPHY.body.default} text-gray-500 mt-4`}>
                Loading templates...
              </p>
            </div>
          ) : (
          /* Carousel or Single Card */
          filteredTemplates.length > 0 ? (
            filteredTemplates.length === 1 ? (
              // Single card - centered without carousel
              <div className="flex justify-center px-4">
                <div className="w-full md:w-[45%] lg:w-[35%]">
                  <TemplateCard
                    template={filteredTemplates[0]}
                    onClick={() => handleTemplateClick(filteredTemplates[0])}
                  />
                </div>
              </div>
            ) : (
              // Multiple cards (2+) - use carousel
              <div className="relative">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {filteredTemplates.map((template, index) => (
                      <div
                        key={template.templateId}
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
                          <TemplateCard
                            template={template}
                            onClick={() => handleTemplateClick(template)}
                          />
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
                    aria-label="Previous template"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={scrollNext}
                    className="rounded-full border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                    aria-label="Next template"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                  {filteredTemplates.map((_, index) => (
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
                      aria-label={`Go to template ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <p className={`${TYPOGRAPHY.body.default} text-gray-500`}>
                No templates found for selected categories
              </p>
            </div>
          )
          )}
        </div>
      </section>

      {/* Criteria Preview Modal */}
      {selectedTemplate && (
        <CriteriaPreviewModal
          isOpen={isCriteriaPreviewOpen}
          onClose={() => setIsCriteriaPreviewOpen(false)}
          template={selectedTemplate}
          onUseTemplate={handleUseTemplate}
        />
      )}

      {/* Email Collection Modal */}
      <EmailCollectionModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSuccess={handleEmailSubmitted}
      />
    </>
  );
};

export default TemplateCarouselSection;
