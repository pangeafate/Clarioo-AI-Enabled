/**
 * ExamplesBulletPopover Component - SP_011
 *
 * @purpose Question mark icon tooltip displaying clickable example projects
 *
 * FEATURES:
 * - Question mark icon (HelpCircle) positioned next to CategoryDropdown
 * - Popover with "Need inspiration? Try these examples:" header
 * - 4 clickable bullet examples from PROJECT_EXAMPLES data
 * - Each click opens ProjectConfirmationDialog
 * - After confirmation, creates project and switches to project view
 *
 * DESIGN SPECS:
 * - Icon: Gray HelpCircle, hover to blue
 * - Popover: White background, shadow, max-width
 * - Bullets: Clickable with hover effect
 * - Clean, accessible UI
 *
 * BEHAVIOR:
 * - Click icon → Open popover
 * - Click example → Open confirmation dialog
 * - Confirm → Create project + switch view
 * - Cancel → Close dialog, keep popover open
 *
 * @see SP_011 Sprint Plan - Phase 3, Task 2 (ExamplesBulletPopover)
 * @see /src/data/projectExamples.ts - Example data source
 * @see /src/components/landing/ProjectConfirmationDialog.tsx - Confirmation dialog
 */

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PROJECT_EXAMPLES } from '@/data/projectExamples';
import { ProjectConfirmationDialog } from './ProjectConfirmationDialog';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface ExamplesBulletPopoverProps {
  onCreateProject: (title: string, description: string) => Promise<void>;
}

export const ExamplesBulletPopover = ({
  onCreateProject
}: ExamplesBulletPopoverProps) => {
  const [selectedExample, setSelectedExample] = useState<string>('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleExampleClick = (exampleId: string) => {
    setSelectedExample(exampleId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    const example = PROJECT_EXAMPLES.find(e => e.id === selectedExample);
    if (!example) return;

    setIsCreating(true);

    try {
      await onCreateProject(example.title, example.description);
      setIsConfirmDialogOpen(false);
      setSelectedExample('');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setIsConfirmDialogOpen(false);
    setSelectedExample('');
  };

  const example = PROJECT_EXAMPLES.find(e => e.id === selectedExample);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Show example projects"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <h3 className={TYPOGRAPHY.label.default}>
              Need inspiration? Try these examples:
            </h3>
            <ul className="space-y-2">
              {PROJECT_EXAMPLES.map((example) => (
                <li key={example.id}>
                  <button
                    onClick={() => handleExampleClick(example.id)}
                    className={`w-full text-left ${TYPOGRAPHY.body.small} hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <span className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{example.title}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </PopoverContent>
      </Popover>

      {/* Confirmation Dialog */}
      {example && (
        <ProjectConfirmationDialog
          isOpen={isConfirmDialogOpen}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          projectTitle={example.title}
          projectDescription={example.description}
          isCreating={isCreating}
        />
      )}
    </>
  );
};
