/**
 * TemplatesModal Component
 * Sprint: SP_021, SP_028
 *
 * Full viewport modal displaying project templates with category filters
 * and template cards grid. Allows users to browse and select templates
 * to quick-start projects.
 *
 * SP_028 Updates:
 * - Load templates from n8n Data Tables
 * - Admin mode support (upload, delete)
 * - Template upload button (admin only)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { TYPOGRAPHY } from '../../styles/typography-config';
import { CategoryFilter } from './CategoryFilter';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { EmailCollectionModal } from '../email/EmailCollectionModal';
import { TemplateUploadButton } from './TemplateUploadButton';
import { AdminModeToggle } from '../admin/AdminModeToggle';
import {
  createProjectFromTemplate,
  getTemplatesFromN8n,
  deleteTemplate,
  getUserId
} from '../../services/templateService';
import { hasSubmittedEmail } from '../../services/n8nService';
import type { TemplatesModalProps, Template } from '../../types/template.types';

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { toast } = useToast();

  // SP_028: Load templates from n8n only (no legacy templates)
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start loading immediately
  const [isAdminMode, setIsAdminMode] = useState(
    localStorage.getItem('clarioo_admin_mode') === 'true'
  );

  // SP_029: Listen for admin mode changes from toggle
  useEffect(() => {
    const checkAdminMode = () => {
      const adminMode = localStorage.getItem('clarioo_admin_mode') === 'true';
      setIsAdminMode(adminMode);
    };

    // Check on mount
    checkAdminMode();

    // Listen for storage changes (when toggle is clicked)
    window.addEventListener('storage', checkAdminMode);

    // Also listen for custom event for same-window updates
    const handleAdminModeChange = () => checkAdminMode();
    window.addEventListener('adminModeChanged', handleAdminModeChange);

    return () => {
      window.removeEventListener('storage', checkAdminMode);
      window.removeEventListener('adminModeChanged', handleAdminModeChange);
    };
  }, []);

  // Extract unique categories from templates
  const categories = useMemo(() => {
    const uniqueCategories = new Set(templates.map(t => t.templateCategory));
    return ['All', ...Array.from(uniqueCategories)];
  }, [templates]);

  // State for selected categories (default to "All")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);

  // State for template preview modal
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isTemplatePreviewOpen, setIsTemplatePreviewOpen] = useState(false);

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

  // Handle category selection (delegated to CategoryFilter)
  const handleCategoryChange = (newCategories: string[]) => {
    setSelectedCategories(newCategories);
  };

  // Handle template card click - opens criteria preview modal
  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setIsTemplatePreviewOpen(true);
  };

  // Handle "Use These Criteria" button click
  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;

    // Check if email has been submitted
    if (!hasSubmittedEmail()) {
      // Show email collection modal first
      setTemplateToCreate(selectedTemplate);
      setIsTemplatePreviewOpen(false);
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

  // SP_028: Load templates from n8n when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // SP_028: Load templates from n8n
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const templatesFromN8n = await getTemplatesFromN8n();
      setTemplates(templatesFromN8n);
    } catch (error) {
      console.error('[TemplatesModal] Failed to load templates:', error);
      toast({
        title: '❌ Failed to load templates',
        description: 'Please check your connection and try again',
        variant: 'destructive',
        duration: 3000
      });
      // SP_028: No fallback - templates remain empty
    } finally {
      setIsLoading(false);
    }
  };

  // SP_028: Handle template deletion (admin only)
  const handleDeleteTemplate = async (templateId: string) => {
    const userId = getUserId();
    setIsLoading(true);

    try {
      const result = await deleteTemplate(templateId, userId);

      if (result.success) {
        toast({
          title: '✅ Template deleted',
          duration: 2000
        });
        // Reload templates
        await loadTemplates();
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: '❌ Delete failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create project and notify parent component
  const createProjectAndNavigate = async (template: Template) => {
    try {
      const { projectId, success } = await createProjectFromTemplate(template);

      if (success) {
        // Close modals
        setIsTemplatePreviewOpen(false);
        onClose();

        // Show success toast
        toast({
          title: 'Project created from template',
          description: `${template.projectName} with ${template.criteria.length} criteria loaded`,
          duration: 3000,
        });

        // Notify parent component (LandingPage) to select this project
        if (onProjectCreated) {
          const newProject = {
            id: projectId,
            name: template.projectName,
            description: template.searchedBy || template.projectName,
            status: 'draft' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: template.templateCategory,
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
            {/* Close Button - Fixed at top-right */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close"
                className="h-8 w-8 bg-white hover:bg-gray-100 rounded-full shadow-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content - Now includes header */}
            <ScrollArea className="flex-1 px-4 sm:px-6 md:px-10 py-4 sm:py-6">
              <div className="mx-auto pr-8">
                {/* Header Content - Now scrollable */}
                <div className="mb-6">
                  <h2 className={`${TYPOGRAPHY.heading.h5} text-gray-900 mb-1`}>
                    Software Selection Templates from Industry Experts
                  </h2>
                  <p className={`${TYPOGRAPHY.muted.default} text-gray-500`}>
                    Explore evaluation criteria created by other companies and consultants and apply them to your own software selection process.
                  </p>

                  {/* SP_028: Admin Upload Button */}
                  {isAdminMode && (
                    <div className="mt-4">
                      <TemplateUploadButton onUploadSuccess={loadTemplates} />
                    </div>
                  )}
                </div>

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
                      key={template.templateId}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                      isAdminMode={isAdminMode}
                      onDelete={handleDeleteTemplate}
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

            {/* Footer with Admin Mode Toggle (SP_029) */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-gray-50">
              <div className="text-sm text-gray-500">
                {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} available
              </div>
              <AdminModeToggle />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Template Preview Modal - Separate AnimatePresence to avoid key conflicts */}
    {selectedTemplate && (
      <TemplatePreviewModal
        isOpen={isTemplatePreviewOpen}
        onClose={() => setIsTemplatePreviewOpen(false)}
        template={selectedTemplate}
        onUseTemplate={handleUseTemplate}
      />
    )}

    {/* Email Collection Modal - Separate from AnimatePresence */}
    <EmailCollectionModal
      isOpen={isEmailModalOpen}
      onClose={() => setIsEmailModalOpen(false)}
      onSuccess={handleEmailSubmitted}
    />
    </>
  );
};

export default TemplatesModal;
