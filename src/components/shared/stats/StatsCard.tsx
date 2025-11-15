import React from 'react';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface StatsCardProps {
  /**
   * The main value to display (can be string or number)
   */
  value: string | number;

  /**
   * Label describing the stat
   */
  label: string;

  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;

  /**
   * Color theme for the icon background
   */
  iconColor?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';

  /**
   * Optional trend indicator
   */
  trend?: {
    value: number;
    isPositive: boolean;
  };

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * StatsCard - Reusable statistics card component
 *
 * A consistent card component for displaying key metrics and statistics
 * with optional trend indicators.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <StatsCard
 *   value="1,234"
 *   label="Total Users"
 *   icon={Users}
 * />
 *
 * // With trend indicator
 * <StatsCard
 *   value="$45,231"
 *   label="Revenue"
 *   icon={DollarSign}
 *   iconColor="success"
 *   trend={{ value: 12.5, isPositive: true }}
 * />
 *
 * // With warning color
 * <StatsCard
 *   value="42"
 *   label="Open Issues"
 *   icon={AlertTriangle}
 *   iconColor="warning"
 *   trend={{ value: 8.1, isPositive: false }}
 * />
 * ```
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  value,
  label,
  icon: Icon,
  iconColor = 'primary',
  trend,
  className,
}) => {
  const iconColorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    destructive: 'bg-red-100 text-red-600',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className={cn(className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              iconColorClasses[iconColor]
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-1">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>

            {/* Trend Indicator */}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
