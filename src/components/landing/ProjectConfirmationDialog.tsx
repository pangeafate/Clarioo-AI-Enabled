/**
 * ProjectConfirmationDialog Component - SP_011
 *
 * @purpose Reusable confirmation dialog for project creation from categories/examples
 *
 * FEATURES:
 * - Confirms user intent before creating project
 * - Shows project details (title, description)
 * - Cancel/Confirm actions
 * - Accessible with keyboard navigation
 * - Smooth animations
 *
 * DESIGN SPECS:
 * - Modal overlay with blur backdrop
 * - Centered dialog box
 * - Clear action buttons (Cancel, Create Project)
 * - Gradient primary button matching design system
 *
 * USAGE:
 * - CategoryDropdown: Confirms category-based project creation
 * - ExamplesBulletPopover: Confirms example-based project creation
 *
 * BEHAVIOR:
 * - Opens via isOpen prop
 * - Closes via onClose callback
 * - Confirms via onConfirm callback
 * - ESC key closes dialog
 *
 * @see SP_011 Sprint Plan - Phase 2, Task 3 (ProjectConfirmationDialog)
 * @see /src/components/landing/CategoryDropdown.tsx - Usage example
 * @see /src/components/landing/ExamplesBulletPopover.tsx - Usage example
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface ProjectConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
  projectDescription?: string;
  isCreating?: boolean;
}

export const ProjectConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  projectDescription,
  isCreating = false
}: ProjectConfirmationDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Project?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You're about to create a new project:
            </p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className={TYPOGRAPHY.label.default}>
                {projectTitle}
              </p>
              {projectDescription && (
                <p className={`${TYPOGRAPHY.muted.small} mt-1`}>
                  {projectDescription}
                </p>
              )}
            </div>
            <p className={TYPOGRAPHY.body.small}>
              This will switch you to the project view where you can start configuring your search criteria.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCreating}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isCreating}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
