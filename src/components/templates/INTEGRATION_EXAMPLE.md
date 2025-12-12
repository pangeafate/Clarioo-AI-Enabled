# Template System Integration Guide

This guide shows how to integrate the CriteriaPreviewModal and templateService with your application.

## Overview

The template system allows users to:
1. Browse pre-configured project templates
2. Preview template criteria in a read-only modal
3. Create a new project from a template
4. Navigate to vendor discovery with pre-populated criteria

## Components Created

### 1. `templateService.ts` (`/src/services/templateService.ts`)

Service functions:
- `getTemplates()` - Load all templates
- `getTemplateById(id)` - Get specific template
- `getTemplateCategories()` - Get unique categories
- `filterTemplatesByCategories(templates, categories)` - Filter templates
- `createProjectFromTemplate(template)` - Create project from template

### 2. `CriteriaPreviewModal.tsx` (`/src/components/templates/CriteriaPreviewModal.tsx`)

Full viewport modal showing:
- Template name and description
- Criteria grouped by category (Feature, Technical, Business, Compliance, Custom)
- Read-only accordion sections (using AccordionSection with `readOnly={true}`)
- Download/Share button (opens ShareDialog)
- "Use These Criteria to Start a Project" button

### 3. `AccordionSection` with `readOnly` prop

Updated to support read-only mode:
- Disables drag-and-drop
- Disables swipe gestures
- Hides "Add Criterion" button
- Hides category edit button
- Makes SignalAntenna non-interactive

### 4. `CriterionCard` with `readOnly` prop

Updated to support read-only mode:
- Hides AI Chat button
- Hides Edit button
- Makes SignalAntenna non-interactive

## Integration Example

### Example 1: Using with TemplatesModal

```typescript
// TemplatesModal.tsx
import React, { useState, useEffect } from 'react';
import { CriteriaPreviewModal } from './CriteriaPreviewModal';
import { createProjectFromTemplate, getTemplates } from '@/services/templateService';
import type { Template } from '@/types/template.types';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const TemplatesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load templates on mount
  useEffect(() => {
    getTemplates().then(setTemplates);
  }, []);

  // Check if user has submitted email
  useEffect(() => {
    const emailData = localStorage.getItem('email_collection');
    if (emailData) {
      try {
        const parsed = JSON.parse(emailData);
        setHasSubmittedEmail(!!parsed.email);
      } catch {
        setHasSubmittedEmail(false);
      }
    }
  }, []);

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;

    // Check if email submitted
    if (!hasSubmittedEmail) {
      setShowEmailModal(true);
      return;
    }

    try {
      // Create project from template
      const result = await createProjectFromTemplate(selectedTemplate);

      if (result.success) {
        // Close modals
        setIsPreviewOpen(false);
        onClose();

        // Show success toast
        toast({
          title: 'Project created',
          description: `Project "${selectedTemplate.name}" created successfully`,
          duration: 3000,
        });

        // Navigate to vendor discovery
        navigate(`/vendor-discovery/${result.projectId}`);
      } else {
        toast({
          title: 'Error creating project',
          description: result.error || 'Failed to create project from template',
          variant: 'destructive',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error using template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project from template',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleEmailSubmitted = () => {
    setHasSubmittedEmail(true);
    setShowEmailModal(false);
    // Retry template usage
    handleUseTemplate();
  };

  return (
    <>
      {/* Templates List Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Select a template to start with pre-configured criteria
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateClick(template)}
                >
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.lookingFor}
                    </p>
                    <Badge variant="outline">
                      {template.criteria.length} criteria
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Criteria Preview Modal */}
      {selectedTemplate && (
        <CriteriaPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          template={selectedTemplate}
          onUseTemplate={handleUseTemplate}
        />
      )}

      {/* Email Collection Modal */}
      {showEmailModal && (
        <EmailCollectionModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSuccess={handleEmailSubmitted}
        />
      )}
    </>
  );
};
```

### Example 2: Direct Usage in VendorDiscovery

```typescript
// VendorDiscovery.tsx
import { useEffect } from 'react';
import { getCriteriaFromStorage } from '@/services/n8nService';

const VendorDiscovery = ({ projectId }: { projectId: string }) => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);

  useEffect(() => {
    // Load criteria from localStorage (works for both n8n and template projects)
    const loadedCriteria = getCriteriaFromStorage(projectId);
    if (loadedCriteria) {
      setCriteria(loadedCriteria);
    }
  }, [projectId]);

  // Rest of component...
};
```

## localStorage Structure

When a project is created from a template, the following data is stored:

```typescript
// Project list
localStorage.setItem('clarioo_projects', JSON.stringify([
  {
    id: 'generated-uuid',
    name: 'Template Name',
    description: 'Template looking for text',
    category: 'Template Category',
    status: 'in-progress',
    created_at: 'ISO timestamp',
    updated_at: 'ISO timestamp',
  }
]));

// Criteria for the project
localStorage.setItem('criteria_${projectId}', JSON.stringify([
  {
    id: 'crit_001',
    name: 'Criterion Name',
    explanation: 'Detailed explanation',
    importance: 'high',
    type: 'feature',
    isArchived: false,
  }
]));

// Workflow state
localStorage.setItem('workflow_${projectId}', JSON.stringify({
  currentStep: 'criteria-builder',
  techRequest: {
    category: 'Template Category',
    description: 'Template looking for text',
    companyInfo: 'Template metadata',
  },
  criteria: [...],
  selectedVendors: [],
}));
```

## Key Features

### 1. Read-Only Mode
- No editing capabilities
- SignalAntenna visible but non-interactive
- No drag-and-drop or swipe gestures
- No "Add Criterion" buttons

### 2. Email Collection Check
- Before creating project, check if email submitted
- Show EmailCollectionModal if needed
- Retry project creation after email submitted

### 3. Automatic Navigation
- After project creation, navigate to `/vendor-discovery/${projectId}`
- VendorDiscovery automatically loads criteria from localStorage
- User lands on criteria-builder step to review/modify

### 4. Success Feedback
- Toast notification on successful project creation
- Clear error messages on failure

## Testing Checklist

- [ ] Templates load correctly
- [ ] Template card shows correct information
- [ ] CriteriaPreviewModal opens when template clicked
- [ ] Criteria grouped by category correctly
- [ ] All categories display (Feature, Technical, Business, Compliance, Custom)
- [ ] Accordion sections expand/collapse
- [ ] SignalAntenna shows importance but is not interactive
- [ ] No edit buttons visible on criterion cards
- [ ] No "Add Criterion" buttons visible
- [ ] Download/Share button opens ShareDialog
- [ ] ShareDialog can download criteria as Excel
- [ ] Email collection check works
- [ ] EmailCollectionModal shows if needed
- [ ] Project created successfully after email submitted
- [ ] Navigation to vendor discovery works
- [ ] Criteria load in vendor discovery
- [ ] Toast notifications work
- [ ] Error handling works for failed project creation

## Error Handling

The system handles errors at multiple levels:

1. **Template Loading**: Returns empty array on error
2. **Project Creation**: Returns `{ success: false, error: 'message' }`
3. **localStorage Access**: Try-catch blocks with console.error
4. **Navigation**: Check for successful project creation before navigating

## Future Enhancements

Potential improvements:
- [ ] Template search/filtering
- [ ] Template categories for organization
- [ ] Template preview images
- [ ] Custom template creation
- [ ] Template sharing
- [ ] Template versioning
- [ ] Analytics on template usage
