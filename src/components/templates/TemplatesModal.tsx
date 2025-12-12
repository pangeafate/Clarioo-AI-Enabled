/**
 * TemplatesModal Component
 * Sprint: SP_021
 *
 * Full viewport modal displaying project templates with category filters
 * and template cards grid. Allows users to browse and select templates
 * to quick-start projects.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { TYPOGRAPHY } from '../../styles/typography-config';
import { CategoryFilter } from './CategoryFilter';
import { TemplateCard } from './TemplateCard';
import { CriteriaPreviewModal } from './CriteriaPreviewModal';
import { EmailCollectionModal } from '../email/EmailCollectionModal';
import { createProjectFromTemplate } from '../../services/templateService';
import { hasSubmittedEmail } from '../../services/n8nService';
import type { TemplatesModalProps, Template } from '../../types/template.types';
import templatesData from '../../data/templates/templates.json';

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  // Load templates from JSON
  const templates = templatesData as Template[];

  // Extract unique categories from templates
  const categories = useMemo(() => {
    const uniqueCategories = new Set(templates.map(t => t.category));
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
    return templates.filter(t => selectedCategories.includes(t.category));
  }, [templates, selectedCategories]);

  // Handle category selection (delegated to CategoryFilter)
  const handleCategoryChange = (newCategories: string[]) => {
    setSelectedCategories(newCategories);
  };

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
        onClose();

        // Show success toast
        toast({
          title: 'Project created from template',
          description: `${template.lookingFor} with ${template.criteria.length} criteria loaded`,
          duration: 3000,
        });

        // Notify parent component (LandingPage) to select this project
        if (onProjectCreated) {
          const newProject = {
            id: projectId,
            name: template.lookingFor,
            description: template.lookingFor,
            status: 'draft' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: template.category,
          };
          onProjectCreated(newProject);
        }
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('[TemplatesModal] Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project from template. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-2 sm:inset-4 md:inset-6 lg:inset-8 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className={`${TYPOGRAPHY.heading.h5} text-gray-900 mb-1`}>
                  Software Selection Templates from Industry Experts
                </h2>
                <p className={`${TYPOGRAPHY.muted.default} text-gray-500`}>
                  Explore evaluation criteria created by other companies and consultants and apply them to your own software selection process.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close"
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 px-5 md:px-10 py-4 sm:py-6">
              <div className="mx-auto">
                {/* Category Filter */}
                <div className="mb-6">
                  <CategoryFilter
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-16">
                    <p className={`${TYPOGRAPHY.body.default} text-gray-500`}>
                      No templates found for selected categories
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Criteria Preview Modal - Separate AnimatePresence to avoid key conflicts */}
    {selectedTemplate && (
      <CriteriaPreviewModal
        isOpen={isCriteriaPreviewOpen}
        onClose={() => setIsCriteriaPreviewOpen(false)}
        template={selectedTemplate}
        onUseTemplate={handleUseTemplate}
      />
    )}

    {/* Email Collection Modal - Separate from AnimatePresence */}
    <EmailCollectionModal
      isOpen={isEmailModalOpen}
      onClose={() => setIsEmailModalOpen(false)}
      onEmailSubmitted={handleEmailSubmitted}
    />
    </>
  );
};

export default TemplatesModal;
