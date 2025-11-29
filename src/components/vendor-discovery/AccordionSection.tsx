/**
 * AccordionSection Component - Collapsible Criteria Category with Reordering
 *
 * @purpose Collapsible section for grouping criteria by category
 * @design Vertical accordion with count display and card-based content
 *
 * COLLAPSED STATE (SP_012):
 * Feature: 10 - 5 High, 3 Medium  [▼]
 *
 * EXPANDED STATE:
 * Feature: 10 - 5 High, 3 Medium  [▲]
 * ┌──────────────────────────────────┐
 * │ Criterion Card 1 (High)          │
 * ├──────────────────────────────────┤
 * │ Criterion Card 2 (High)          │
 * ├──────────────────────────────────┤
 * │ Criterion Card 3 (Medium)        │
 * ├──────────────────────────────────┤
 * │ Criterion Card 4 (Low)           │
 * ├──────────────────────────────────┤
 * │ [Archived] Card 5 (greyed)       │
 * └──────────────────────────────────┘
 *
 * FEATURES:
 * - Multiple sections can be open simultaneously
 * - Count display: Total - X High, Y Medium, Z Low
 * - Criteria sorted by priority (High → Medium → Low → Archived)
 * - Smooth card reordering animation (SP_014)
 * - Archived criteria shown at bottom
 * - Smooth expand/collapse animation
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ChevronDown, Plus, GripVertical, SquarePen } from 'lucide-react';
import { CriterionCard } from './CriterionCard';
import type { Criteria } from '../VendorDiscovery';
import { SPACING } from '@/styles/spacing-config';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export interface AccordionSectionProps {
  title: string;
  criteria: Criteria[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditCriterion: (criterion: Criteria, initialTab?: 'chat' | 'edit') => void;
  onAddCriterion: (categoryType: string) => void;
  onImportanceChange?: (id: string, importance: 'low' | 'medium' | 'high', isArchived: boolean) => void;
  // SP_014: Sorting and drag-and-drop props
  isSortedByImportance?: boolean;
  getOrderedCriteria?: (criteria: Criteria[], category: string) => Criteria[];
  onOrderChange?: (orderedIds: string[]) => void;
  // Category editing (only for custom categories)
  onEditCategory?: (oldName: string, newName: string) => void;
  onDeleteCategory?: (categoryName: string) => void;
  isCustomCategory?: boolean;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  criteria,
  isExpanded,
  onToggle,
  onEditCriterion,
  onAddCriterion,
  onImportanceChange,
  isSortedByImportance = true,
  getOrderedCriteria,
  onOrderChange,
  onEditCategory,
  onDeleteCategory,
  isCustomCategory = false
}) => {
  // Track which item is being dragged for visual feedback
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // State for category editing dialog
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editedCategoryName, setEditedCategoryName] = useState(title);

  const { toast } = useToast();

  /**
   * SP_014: Get ordered criteria based on sorting mode
   * - When sorted: High → Medium → Low → Archived
   * - When manual: Use saved custom order from getOrderedCriteria
   */
  const orderedCriteria = useMemo(() => {
    // If getOrderedCriteria is provided and we're in manual mode, use it
    if (getOrderedCriteria && !isSortedByImportance) {
      return getOrderedCriteria(criteria, title.toLowerCase());
    }

    // Default: Sort by importance (existing behavior)
    const active = criteria.filter(c => !c.isArchived);
    const archived = criteria.filter(c => c.isArchived);

    const importanceOrder = { high: 3, medium: 2, low: 1 };
    const sortedActive = [...active].sort((a, b) =>
      importanceOrder[b.importance] - importanceOrder[a.importance]
    );

    return [...sortedActive, ...archived];
  }, [criteria, isSortedByImportance, getOrderedCriteria, title]);

  // Local state for drag-and-drop reordering
  const [localOrder, setLocalOrder] = useState<Criteria[]>(orderedCriteria);

  // Sync local order with orderedCriteria when it changes (e.g., mode switch, criteria update)
  useEffect(() => {
    setLocalOrder(orderedCriteria);
  }, [orderedCriteria]);

  /**
   * Handle reorder during drag - update local state immediately
   */
  const handleReorder = (newOrder: Criteria[]) => {
    setLocalOrder(newOrder);
    // Persist the new order to parent
    if (onOrderChange) {
      const orderedIds = newOrder.map(c => c.id);
      onOrderChange(orderedIds);
    }
  };

  // Count by importance (only count active criteria)
  const activeCriteria = criteria.filter(c => !c.isArchived);
  const highCount = activeCriteria.filter(c => c.importance === 'high').length;
  const mediumCount = activeCriteria.filter(c => c.importance === 'medium').length;
  const lowCount = activeCriteria.filter(c => c.importance === 'low').length;
  const totalCount = activeCriteria.length;

  // Allow empty sections to render (user can add criteria to them)

  // Get category color scheme (modern, subtle tones)
  const getCategoryColors = (category: string) => {
    const normalized = category.toLowerCase();

    // Feature = Blue/Indigo
    if (normalized.includes('feature')) {
      return {
        border: 'border-l-indigo-400',
        bg: 'bg-indigo-50/50',
        text: 'text-indigo-700'
      };
    }

    // Technical = Purple/Violet
    if (normalized.includes('technical')) {
      return {
        border: 'border-l-violet-400',
        bg: 'bg-violet-50/50',
        text: 'text-violet-700'
      };
    }

    // Business = Teal/Cyan
    if (normalized.includes('business')) {
      return {
        border: 'border-l-teal-400',
        bg: 'bg-teal-50/50',
        text: 'text-teal-700'
      };
    }

    // Compliance = Amber/Orange
    if (normalized.includes('compliance')) {
      return {
        border: 'border-l-amber-400',
        bg: 'bg-amber-50/50',
        text: 'text-amber-700'
      };
    }

    // Other/Custom = Slate/Gray
    return {
      border: 'border-l-slate-400',
      bg: 'bg-slate-50/50',
      text: 'text-slate-700'
    };
  };

  const colors = getCategoryColors(title);

  // Handle category rename
  const handleRenameCategory = () => {
    if (!editedCategoryName.trim()) {
      toast({
        title: "Invalid name",
        description: "Category name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    if (editedCategoryName.toLowerCase() === title.toLowerCase()) {
      setIsEditingCategory(false);
      return;
    }

    onEditCategory?.(title.toLowerCase(), editedCategoryName.toLowerCase());
    setIsEditingCategory(false);

    toast({
      title: "Category renamed",
      description: `"${title}" has been renamed to "${editedCategoryName}".`
    });
  };

  // Handle category delete with confirmation
  const handleDeleteCategory = () => {
    if (!onDeleteCategory) return;

    const criteriaCount = criteria.length;
    const message = criteriaCount > 0
      ? `This will delete "${title}" and all ${criteriaCount} criteria in it. This action cannot be undone.`
      : `This will delete the "${title}" category.`;

    if (window.confirm(message)) {
      onDeleteCategory(title.toLowerCase());
      setIsEditingCategory(false);

      toast({
        title: "Category deleted",
        description: `"${title}" and all its criteria have been removed.`
      });
    }
  };

  return (
    <div className={`border rounded-lg bg-white border-l-4 ${colors.border}`}>
      {/* Header - Always Visible */}
      <div className={`w-full ${SPACING.vendorDiscovery.accordion.header} flex items-center justify-between transition-colors ${colors.bg}`}>
        {/* Title and Count (clickable to toggle) */}
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 xs:gap-2 flex-1 text-left hover:opacity-80"
        >
          <h3 className={TYPOGRAPHY.heading.h6}>{title}</h3>
          <span className={TYPOGRAPHY.muted.small}>
            {totalCount} - {highCount} High, {mediumCount} Medium, {lowCount} Low
          </span>
        </button>

        {/* Right side: Edit icon (custom categories only, when expanded) + Chevron */}
        <div className="flex items-center gap-1">
          {isCustomCategory && isExpanded && onEditCategory && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingCategory(true);
              }}
              className={SPACING.vendorDiscovery.criterion.iconButton}
              title="Edit category"
            >
              <SquarePen className={SPACING.vendorDiscovery.criterion.icon} />
            </Button>
          )}

          {/* Expand/Collapse Icon */}
          <button onClick={onToggle}>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Content - Collapsible */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`${SPACING.vendorDiscovery.accordion.content} ${SPACING.vendorDiscovery.accordion.spacing}`}>
              {/* SP_014: Drag-and-drop mode when sorting is off */}
              {!isSortedByImportance && onOrderChange ? (
                <Reorder.Group
                  axis="y"
                  values={localOrder}
                  onReorder={handleReorder}
                  className="space-y-3"
                >
                  {localOrder.map((criterion) => (
                    <Reorder.Item
                      key={criterion.id}
                      value={criterion}
                      onDragStart={() => setDraggingId(criterion.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className={cn(
                        'relative rounded-lg',
                        draggingId === criterion.id && 'z-50'
                      )}
                      style={{
                        backgroundColor: '#ffffff',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        isolation: 'isolate'
                      }}
                      whileDrag={{
                        scale: 1.02,
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                        cursor: 'grabbing'
                      }}
                    >
                      <div className="flex items-stretch gap-2 bg-white rounded-lg p-1">
                        {/* Drag Handle */}
                        <div className="flex items-center justify-center px-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        {/* Criterion Card - swipe disabled in drag-and-drop mode */}
                        <div className="flex-1">
                          <CriterionCard
                            criterion={criterion}
                            onEdit={onEditCriterion}
                            onImportanceChange={onImportanceChange}
                            disableSwipe={true}
                          />
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                /* SP_014: Sorted mode - animated card list with layout animation */
                <AnimatePresence mode="popLayout">
                  {orderedCriteria.map((criterion) => (
                    <motion.div
                      key={criterion.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        layout: {
                          type: 'spring',
                          stiffness: 300,
                          damping: 30
                        },
                        opacity: { duration: 0.2 },
                        y: { duration: 0.2 }
                      }}
                    >
                      <CriterionCard
                        criterion={criterion}
                        onEdit={onEditCriterion}
                        onImportanceChange={onImportanceChange}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Add New Criterion Button */}
              <button
                onClick={() => onAddCriterion(title.toLowerCase())}
                className="w-full border border-dashed border-gray-300 rounded-lg bg-white hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className={`${SPACING.vendorDiscovery.accordion.addButton} flex items-center justify-center gap-1.5 xs:gap-2 text-muted-foreground hover:text-primary group`}>
                  <Plus className="h-4 w-4 xs:h-5 xs:w-5 group-hover:scale-110 transition-transform" />
                  <span className={TYPOGRAPHY.button.default}>Add {title} Criterion</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Category Dialog */}
      {isCustomCategory && (
        <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Rename or delete this custom category
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={editedCategoryName}
                  onChange={(e) => setEditedCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameCategory();
                    }
                  }}
                />
              </div>

              {criteria.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  This category contains {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}.
                </p>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteCategory}
                className="w-full sm:w-auto"
              >
                Delete Category
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingCategory(false);
                    setEditedCategoryName(title);
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRenameCategory}
                  className="flex-1 sm:flex-none"
                >
                  Save
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AccordionSection;
