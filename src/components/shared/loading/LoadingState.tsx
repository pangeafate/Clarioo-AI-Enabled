import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export interface LoadingStateProps {
  /**
   * The message to display. Defaults to "Loading..."
   */
  message?: string;

  /**
   * Optional description text shown below the message
   */
  description?: string;

  /**
   * Custom icon component. Defaults to Loader2
   */
  icon?: LucideIcon;

  /**
   * Whether to show a progress bar
   */
  showProgress?: boolean;

  /**
   * Progress value (0-100). Only used when showProgress is true
   */
  progress?: number;

  /**
   * Size variant for the loading indicator
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * LoadingState - Reusable loading indicator component
 *
 * A consistent loading state component with optional progress tracking
 * and customizable appearance.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingState />
 *
 * // With custom message
 * <LoadingState message="Loading vendors..." />
 *
 * // With description
 * <LoadingState
 *   message="Processing data"
 *   description="This may take a moment"
 * />
 *
 * // With progress bar
 * <LoadingState
 *   message="Uploading..."
 *   showProgress={true}
 *   progress={75}
 * />
 *
 * // Custom icon and size
 * <LoadingState
 *   icon={Clock}
 *   size="lg"
 *   message="Please wait"
 * />
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  description,
  icon: Icon = Loader2,
  showProgress = false,
  progress = 0,
  size = 'md',
  className,
}) => {
  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={cn(
        'flex flex-col items-center justify-center',
        spacingClasses[size],
        className
      )}
    >
      <Icon
        className={cn(
          iconSizeClasses[size],
          'text-muted-foreground animate-spin'
        )}
        aria-hidden="true"
        role="img"
      />

      <div className="flex flex-col items-center gap-1">
        <p className={cn('font-medium', textSizeClasses[size])}>
          {message}
        </p>

        {description && (
          <p className="text-sm text-muted-foreground text-center">
            {description}
          </p>
        )}
      </div>

      {showProgress && (
        <div className="w-full max-w-xs mt-2">
          <Progress
            value={progress}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
    </div>
  );
};
