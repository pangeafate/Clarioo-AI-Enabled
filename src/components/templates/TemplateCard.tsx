/**
 * TemplateCard Component
 *
 * Displays a single project template with visual category identification
 * and metadata preview.
 *
 * SP_028: Added admin-only delete functionality
 *
 * @module components/templates/TemplateCard
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryColor } from '@/constants/templateCategories';
import type { TemplateCardProps } from '@/types/template.types';
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
 * - Delete button (admin only, top-right corner)
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
 *   isAdminMode={isAdmin}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  isAdminMode = false,
  onDelete
}) => {
  const categoryColor = getCategoryColor(template.category);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.(template.templateId);
    setShowDeleteDialog(false);
  };

  return (
    <>
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
        {/* Delete button (admin only) */}
        {isAdminMode && onDelete && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Category tag */}
        <div className="mb-3">
          <span
            className="inline-block text-xs font-bold uppercase tracking-wide px-2 py-1 rounded"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
            }}
          >
            {template.templateCategory}
          </span>
        </div>

      {/* Template title - Project Name */}
      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">{template.projectName}</h3>

      {/* Searched By (company type + size) */}
      {template.searchedBy && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">SEARCHED BY:</p>
          <p className="text-base text-gray-700">{template.searchedBy}</p>
        </div>
      )}

      {/* Key features */}
      {template.keyFeatures && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">KEY FEATURES:</p>
          <div className="flex flex-wrap gap-1">
            {template.keyFeatures.split(',').map((feature, idx) => (
              <span
                key={`${template.templateId}-feature-${feature.trim()}-${idx}`}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {feature.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Client quote */}
      {template.clientQuote && (
        <div className="mb-3 mt-4">
          <p className="text-sm text-gray-600 italic line-clamp-2">
            "{template.clientQuote}"
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.projectName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TemplateCard;
