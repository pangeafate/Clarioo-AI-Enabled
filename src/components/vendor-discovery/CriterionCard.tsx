/**
 * CriterionCard Component - Individual Criterion Display with Swipe Gestures
 *
 * @purpose Card-based display for a single evaluation criterion
 * @design Mobile-optimized card with swipe-to-adjust importance (SP_014)
 *
 * LAYOUT (SP_012):
 * ┌────────────────────────────────────┐
 * │ ← Criterion Name        🛜 [AI] → │
 * │                                    │
 * │ Explanation text describing the    │
 * │ criterion in detail...             │
 * └────────────────────────────────────┘
 *
 * FEATURES:
 * - Name: Bold, prominent display
 * - Explanation: Gray text, multi-line support
 * - SignalAntenna: Visual priority indicator (1-3 bars)
 * - AI Button: Opens editing sidebar
 * - Swipe gestures: Left (decrease) / Right (increase) importance
 * - Visual feedback: Pink/Orange/Grey glows based on swipe direction
 * - Direction indicators: Subtle arrows on card edges
 * - Archived state: Greyed out with "Archived" badge
 * - Hover effect: Elevated shadow
 * - Card-based for mobile responsiveness
 *
 * SWIPE BEHAVIOR (SP_014):
 * - Right swipe: Increase importance (Low → Mid → High)
 * - Left swipe: Decrease importance (High → Mid → Low → Archived)
 * - Pink glow on right swipe
 * - Orange glow on left swipe
 * - Grey glow on archive
 * - Tinder-style card movement
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';
import { SignalAntenna } from './SignalAntenna';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useToast } from '@/hooks/use-toast';
import type { Criteria } from '../VendorDiscovery';
import { SPACING } from '@/styles/spacing-config';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { cn } from '@/lib/utils';

export interface CriterionCardProps {
  criterion: Criteria & { isArchived?: boolean };
  onEdit: (criterion: Criteria) => void;
  onImportanceChange?: (id: string, importance: 'low' | 'medium' | 'high', isArchived: boolean) => void;
}

export const CriterionCard: React.FC<CriterionCardProps> = ({
  criterion,
  onEdit,
  onImportanceChange
}) => {
  const { toast } = useToast();

  /**
   * Handle importance increase (right swipe)
   */
  const handleIncreaseImportance = () => {
    if (!onImportanceChange) return;

    let newImportance: 'low' | 'medium' | 'high';
    let message: string;
    let canIncrease = true;

    if (criterion.isArchived) {
      // Un-archive to low
      newImportance = 'low';
      message = 'Restored to Low importance';
    } else if (criterion.importance === 'low') {
      newImportance = 'medium';
      message = 'Importance Increased';
    } else if (criterion.importance === 'medium') {
      newImportance = 'high';
      message = 'Importance Increased';
    } else {
      // Already at max
      canIncrease = false;
      toast({
        description: 'Already at highest importance',
        duration: 1500
      });
    }

    if (canIncrease) {
      onImportanceChange(criterion.id, newImportance, false);
      toast({
        description: message,
        duration: 2000
      });
    }
  };

  /**
   * Handle importance decrease (left swipe)
   */
  const handleDecreaseImportance = () => {
    if (!onImportanceChange) return;

    let newImportance: 'low' | 'medium' | 'high';
    let message: string;
    let isArchived = false;

    if (criterion.importance === 'high') {
      newImportance = 'medium';
      message = 'Importance Decreased';
    } else if (criterion.importance === 'medium') {
      newImportance = 'low';
      message = 'Importance Decreased';
    } else {
      // Archive on second left swipe from low
      newImportance = 'low';
      message = 'Low importance. Archive.';
      isArchived = true;
    }

    onImportanceChange(criterion.id, newImportance, isArchived);
    toast({
      description: message,
      duration: 2000
    });
  };

  /**
   * Swipe gesture hook
   */
  const { handlers, swipeState } = useSwipeGesture({
    onSwipeLeft: handleDecreaseImportance,
    onSwipeRight: handleIncreaseImportance,
    threshold: 0.4,
    velocityThreshold: 0.5
  });

  /**
   * Side edge gradient glow based on swipe direction and context
   * Only shows when card is half dragged (swipeProgress >= 0.5)
   * Glow appears on left edge when decreasing, right edge when increasing
   */
  const getSideGlowStyle = () => {
    if (!swipeState.isSwiping || swipeState.swipeProgress < 0.5) return '';

    const intensity = Math.min(swipeState.swipeProgress, 1);
    let glowColor = '';

    if (swipeState.swipeDirection === 'right') {
      // Right swipe - orange glow on right edge
      // No glow when already at max importance
      if (criterion.importance !== 'high') {
        glowColor = `rgba(251, 146, 60, ${intensity * 0.5})`;
      }

      if (glowColor) {
        return `linear-gradient(to left, ${glowColor}, transparent)`;
      }
    } else if (swipeState.swipeDirection === 'left') {
      // Left swipe - violet glow on left edge
      // No glow when swiping archived card left
      if (!criterion.isArchived) {
        glowColor = `rgba(139, 92, 246, ${intensity * 0.5})`;
      }

      if (glowColor) {
        return `linear-gradient(to right, ${glowColor}, transparent)`;
      }
    }

    return '';
  };

  /**
   * Get overlay text based on swipe direction and current importance
   */
  const getOverlayText = () => {
    if (!swipeState.isSwiping || swipeState.swipeProgress < 0.5) return null;

    if (swipeState.swipeDirection === 'right') {
      // Show "Maxed out" when already at high importance
      if (criterion.importance === 'high') {
        return 'Maxed out';
      }
      return 'Increase Importance';
    } else if (swipeState.swipeDirection === 'left') {
      if (criterion.importance === 'low' && !criterion.isArchived) {
        return 'Archive';
      }
      return 'Decrease Importance';
    }

    return null;
  };

  /**
   * Get overlay text color based on transition context
   */
  const getOverlayTextColor = () => {
    // Always white text regardless of swipe direction
    return 'text-white';
  };

  return (
    <motion.div
      {...handlers}
      style={{
        transform: swipeState.isSwiping ? swipeState.transform : undefined,
        touchAction: 'pan-y' // Allow vertical scroll, detect horizontal swipe
      }}
      animate={{
        transform: swipeState.isSwiping ? undefined : 'translateX(0) rotate(0deg)'
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      className={cn(
        'relative cursor-grab active:cursor-grabbing',
        swipeState.isSwiping && 'cursor-grabbing'
      )}
    >
      <Card
        className={cn(
          'transition-shadow relative overflow-hidden',
          !swipeState.isSwiping && 'hover:shadow-md',
          criterion.isArchived && 'opacity-60 grayscale cursor-pointer'
        )}
        onClick={() => {
          // Clicking on archived criterion restores it to low importance
          if (criterion.isArchived && onImportanceChange) {
            onImportanceChange(criterion.id, 'low', false);
            toast({
              title: 'Criterion restored',
              description: `"${criterion.name}" restored with low priority`,
              duration: 2000
            });
          }
        }}
      >
        {/* Side Edge Gradient Glow */}
        {getSideGlowStyle() && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
            style={{
              background: getSideGlowStyle()
            }}
          />
        )}

        <CardContent className={cn(SPACING.vendorDiscovery.criterion.content, 'relative z-10')}>
          {/* Archived Badge */}
          {criterion.isArchived && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-xs"
            >
              Archived
            </Badge>
          )}

          {/* Text Overlay - Shows at half-drag with semi-transparent grey rectangle */}
          {getOverlayText() && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  'px-4 py-2 rounded-lg bg-gray-600/65 transition-opacity',
                  swipeState.swipeProgress >= 0.5 ? 'opacity-100' : 'opacity-0'
                )}
              >
                <span className={cn('text-base font-semibold', getOverlayTextColor())}>
                  {getOverlayText()}
                </span>
              </div>
            </div>
          )}

          {/* Header: Name, Priority, AI Button */}
          <div
            className={cn(
              `flex items-start justify-between ${SPACING.vendorDiscovery.criterion.headerGap} mb-1.5 xs:mb-2`,
              criterion.isArchived && 'text-gray-400'
            )}
          >
            <h4 className={`${TYPOGRAPHY.card.title} flex-1`}>
              {criterion.name}
            </h4>

            <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
              {/* Signal Antenna - Priority Indicator with +/- controls */}
              <SignalAntenna
                importance={criterion.importance}
                isInteractive={!criterion.isArchived && !!onImportanceChange}
                onImportanceChange={(newImportance) => {
                  if (!onImportanceChange) return;
                  if (newImportance === 'archive') {
                    onImportanceChange(criterion.id, criterion.importance, true);
                    toast({
                      title: 'Criterion archived',
                      description: `"${criterion.name}" moved to archive`,
                      duration: 2000
                    });
                  } else {
                    onImportanceChange(criterion.id, newImportance, false);
                    toast({
                      title: 'Importance updated',
                      description: `"${criterion.name}" set to ${newImportance} priority`,
                      duration: 2000
                    });
                  }
                }}
              />

              {/* AI Edit Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent swipe interference
                  onEdit(criterion);
                }}
                className={SPACING.vendorDiscovery.criterion.iconButton}
                title="Edit with AI"
              >
                <Bot className={SPACING.vendorDiscovery.criterion.icon} />
              </Button>
            </div>
          </div>

          {/* Explanation */}
          {criterion.explanation && (
            <p
              className={cn(
                TYPOGRAPHY.card.description,
                criterion.isArchived && 'text-gray-400'
              )}
            >
              {criterion.explanation}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CriterionCard;
