import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  /**
   * The title to display. Defaults to "No items found"
   */
  title?: string;

  /**
   * Optional description text shown below the title
   */
  description?: string;

  /**
   * Custom icon or React node to display
   */
  icon?: React.ReactNode;

  /**
   * Optional action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * EmptyState - Reusable empty state component
 *
 * A consistent empty state component for when there's no data to display,
 * with optional call-to-action button.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <EmptyState />
 *
 * // With custom title and description
 * <EmptyState
 *   title="No vendors found"
 *   description="Start by adding your first vendor"
 * />
 *
 * // With custom icon
 * <EmptyState
 *   icon={<Search className="h-12 w-12 text-muted-foreground" />}
 *   title="No results"
 *   description="Try different search criteria"
 * />
 *
 * // With action button
 * <EmptyState
 *   title="No projects yet"
 *   description="Create your first project to get started"
 *   action={{
 *     label: 'Create Project',
 *     onClick: () => console.log('clicked'),
 *     variant: 'default'
 *   }}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No items found',
  description = 'There are no items to display at this time.',
  icon,
  action,
  className,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-8',
        className
      )}
    >
      {/* Icon */}
      <div className="flex items-center justify-center">
        {icon || (
          <FileQuestion className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-center gap-2 max-w-md">
        <h3 className="text-lg font-semibold text-center">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-muted-foreground text-center">
            {description}
          </p>
        )}
      </div>

      {/* Optional Action Button */}
      {action && (
        <div className="mt-2">
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};
