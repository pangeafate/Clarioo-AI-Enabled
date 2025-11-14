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

export interface CriterionCardProps {
  criterion: Criteria;
  onEdit: (criterion: Criteria) => void;
}

export const CriterionCard: React.FC<CriterionCardProps> = ({ criterion, onEdit }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-2 xs:p-3 sm:p-4">
        {/* Header: Name, Priority, AI Button */}
        <div className="flex items-start justify-between gap-2 xs:gap-3 sm:gap-4 mb-1.5 xs:mb-2">
          <h4 className="font-semibold text-sm xs:text-base flex-1 leading-snug">
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
              className="h-7 w-7 xs:h-8 xs:w-8"
              title="Edit with AI"
            >
              <Bot className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
            </Button>
          </div>
        </div>

        {/* Explanation */}
        {criterion.explanation && (
          <p className="text-xs xs:text-sm text-muted-foreground leading-relaxed">
            {criterion.explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CriterionCard;
