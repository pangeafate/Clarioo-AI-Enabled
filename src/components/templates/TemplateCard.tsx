/**
 * TemplateCard Component
 *
 * Displays a single project template with visual category identification
 * and metadata preview.
 *
 * @module components/templates/TemplateCard
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryColor } from '@/constants/templateCategories';
import type { TemplateCardProps } from '@/types/template.types';

/**
 * TemplateCard Component
 *
 * Layout:
 * - Colored left border (4px, category color)
 * - Template name (large, bold)
 * - Metadata (gray, small)
 * - Current solution (optional, bullet point)
 * - Pain points (optional, italic quote, truncated to 2 lines)
 * - Looking for (gray, small)
 * - "Use template" button with arrow
 *
 * Hover effect:
 * - Scale: 1.02
 * - Shadow: elevated-combined
 * - Border glow (category color)
 *
 * @example
 * ```tsx
 * <TemplateCard
 *   template={template}
 *   onClick={() => handleTemplateClick(template)}
 * />
 * ```
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  const categoryColor = getCategoryColor(template.category);

  return (
    <Card
      className={cn(
        'relative overflow-hidden cursor-pointer transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg',
        'border-l-4 p-6'
      )}
      style={{
        borderLeftColor: categoryColor,
      }}
      onClick={onClick}
    >
      {/* Category tag */}
      <div className="mb-3">
        <span
          className="inline-block text-xs font-bold uppercase tracking-wide px-2 py-1 rounded"
          style={{
            backgroundColor: `${categoryColor}20`,
            color: categoryColor,
          }}
        >
          {template.category}
        </span>
      </div>

      {/* Template title - Looking for (trimmed) */}
      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">{template.lookingFor}</h3>

      {/* Company type */}
      {template.companyType && (
        <p className="text-sm text-gray-600 mb-2">{template.companyType}</p>
      )}

      {/* Company details */}
      {template.companyDetails && (
        <p className="text-sm text-gray-600 mb-4">{template.companyDetails}</p>
      )}

      {/* Current tool */}
      {template.currentTool && (
        <div className="mb-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Currently:</span> {template.currentTool}
          </p>
        </div>
      )}

      {/* Pain quote */}
      {template.painQuote && (
        <div className="mb-2">
          <p className="text-sm text-gray-600 italic line-clamp-2">
            "{template.painQuote}"
          </p>
        </div>
      )}

      {/* Click to view hint */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
          Click to view {template.criteria.length} criteria
          <ArrowRight className="h-3 w-3" />
        </p>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-200 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${categoryColor}, transparent)`,
        }}
      />
    </Card>
  );
};

export default TemplateCard;
