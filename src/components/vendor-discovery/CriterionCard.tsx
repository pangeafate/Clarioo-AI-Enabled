/**
 * CriterionCard Component - Individual Criterion Display
 *
 * @purpose Card-based display for a single evaluation criterion
 * @design Mobile-optimized card with all criterion details
 *
 * LAYOUT (SP_012):
 * ┌────────────────────────────────────┐
 * │ Criterion Name            🛜 [AI] │
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
 * - Hover effect: Elevated shadow
 * - Card-based for mobile responsiveness
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { SignalAntenna } from './SignalAntenna';
import type { Criteria } from '../VendorDiscovery';
import { SPACING } from '@/styles/spacing-config';
import { TYPOGRAPHY } from '@/styles/typography-config';

export interface CriterionCardProps {
  criterion: Criteria;
  onEdit: (criterion: Criteria) => void;
}

export const CriterionCard: React.FC<CriterionCardProps> = ({ criterion, onEdit }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className={SPACING.vendorDiscovery.criterion.content}>
        {/* Header: Name, Priority, AI Button */}
        <div className={`flex items-start justify-between ${SPACING.vendorDiscovery.criterion.headerGap} mb-1.5 xs:mb-2`}>
          <h4 className={`${TYPOGRAPHY.card.title} flex-1`}>
            {criterion.name}
          </h4>

          <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
            {/* Signal Antenna - Priority Indicator */}
            <SignalAntenna importance={criterion.importance} />

            {/* AI Edit Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(criterion)}
              className={SPACING.vendorDiscovery.criterion.iconButton}
              title="Edit with AI"
            >
              <Bot className={SPACING.vendorDiscovery.criterion.icon} />
            </Button>
          </div>
        </div>

        {/* Explanation */}
        {criterion.explanation && (
          <p className={TYPOGRAPHY.card.description}>
            {criterion.explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CriterionCard;
