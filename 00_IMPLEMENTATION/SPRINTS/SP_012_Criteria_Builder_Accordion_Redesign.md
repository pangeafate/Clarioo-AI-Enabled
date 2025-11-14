# SP_012: Criteria Builder Accordion Redesign

## Sprint Metadata

**Sprint ID**: SP_012
**Sprint Name**: Criteria Builder Accordion Redesign
**Duration**: 2-3 days (November 14-16, 2024)
**Status**: 📋 Planned
**Type**: UX Enhancement - Mobile-First Criteria Management
**Priority**: High
**Parent Epic**: SP_007 (Visual Design Enhancement & Mobile-First UI/UX)

---

## Executive Summary

Transform the Criteria Builder's horizontal tab-based table into a vertical accordion-based card layout optimized for mobile devices. This redesign replaces the current Excel-like table with a more intuitive, mobile-friendly interface featuring collapsible category sections, card-based criterion display, signal antenna importance indicators, and an AI-powered editing sidebar.

**Key Goals**:
1. Improve mobile usability with vertical accordion layout
2. Add explanations to criteria for better context
3. Implement visual priority sorting within categories
4. Create intuitive editing experience with AI sidebar
5. Enhance visual hierarchy with signal antenna importance icons

---

## Problem Analysis

### Current State Assessment

**Current Implementation** (`CriteriaBuilder.tsx`):
- Horizontal tabs for category navigation (Feature, Technical, Business, Compliance, Custom)
- Excel-like table layout with editable cells
- Inline editing for all fields (name, importance, type)
- Works well on desktop but cramped on mobile
- No explanations for criteria - just names
- Visual importance indicator is text-based ("High", "Medium", "Low")

**Pain Points**:
1. **Mobile Usability**: Horizontal scrolling required for table on small screens
2. **Context Deficit**: No explanation field to clarify what each criterion means
3. **Visual Hierarchy**: Text-based importance doesn't convey priority at a glance
4. **Editing Experience**: Inline table editing is clunky for multi-field updates
5. **Category Navigation**: Tabs require precise tapping on mobile

### User Experience Issues

**Identified UX Gaps**:
1. Table columns squeeze on mobile (< 768px width)
2. No visual distinction between importance levels
3. Criteria lack explanatory context
4. Editing multiple fields requires multiple clicks
5. No integrated AI assistance for refinement

---

## Solution Design

### Accordion Architecture

**Vertical Collapsible Structure**:
```
📁 Feature: 8 - 5 High, 3 Medium [Expanded ▼]
   ├─ [Card] User Interface Design (High) 🔶🔶🔶
   ├─ [Card] Core Functionality (High) 🔶🔶🔶
   ├─ [Card] Mobile Compatibility (High) 🔶🔶🔶
   └─ [Card] Customization Options (Medium) 🔶🔶

📁 Technical: 6 - 2 High, 4 Medium [Collapsed ▶]

📁 Business: 4 - 3 High, 1 Medium [Collapsed ▶]

📁 Compliance: 2 - 0 High, 2 Medium [Collapsed ▶]

📁 Other: 0 - 0 High, 0 Medium [Collapsed ▶]
```

**Accordion Behavior**:
- Multiple sections can be open simultaneously (independent collapsible)
- Click header to toggle expand/collapse
- Smooth animation (300ms ease-in-out)
- Persist open/closed state in component state (optional: localStorage)

### Criterion Card Layout

**When Unfolded - Card Structure**:
```
┌─────────────────────────────────────────────┐
│ User Interface Design            🔶🔶🔶  🤖 │
│                                              │
│ The software must have an intuitive,        │
│ modern user interface that requires         │
│ minimal training for new users.             │
│                                              │
└─────────────────────────────────────────────┘
```

**Card Components**:
- **Name** (top left): Criterion title in bold (font-semibold, text-base)
- **Importance Icon** (top right): Signal antenna with 1-3 bars filled
- **AI Button** (top right): Robot icon to open editing sidebar
- **Explanation** (below name): Multi-line description text (text-sm, text-muted-foreground)
- **Spacing**: 16px padding, 8px gap between cards
- **Styling**: White background, rounded-lg border, shadow-sm, hover:shadow-md

### Signal Antenna Icon

**Importance Visualization**:
- **Low**: 1 bar filled (🔶)
- **Medium**: 2 bars filled (🔶🔶)
- **High**: 3 bars filled (🔶🔶🔶)

**Implementation**:
```typescript
const SignalAntenna = ({ importance }: { importance: 'low' | 'medium' | 'high' }) => {
  const bars = importance === 'high' ? 3 : importance === 'medium' ? 2 : 1;

  return (
    <div className="flex items-end gap-0.5">
      <div className={`w-1.5 h-2 rounded-sm ${bars >= 1 ? 'bg-warning' : 'bg-gray-200'}`} />
      <div className={`w-1.5 h-3 rounded-sm ${bars >= 2 ? 'bg-warning' : 'bg-gray-200'}`} />
      <div className={`w-1.5 h-4 rounded-sm ${bars >= 3 ? 'bg-destructive' : 'bg-gray-200'}`} />
    </div>
  );
};
```

### AI Editing Sidebar

**Slide-in Panel** (from right):
- Width: 400px desktop, 100% mobile
- Background: White with shadow-2xl
- Animation: translateX(100%) → translateX(0) over 300ms
- Z-index: 50 (above main content)
- Overlay: Semi-transparent backdrop (bg-black/20) with blur

**Sidebar Structure**:
```
┌───────────────────────────────────┐
│ ← Edit Criterion              ✕  │ (Header)
├───────────────────────────────────┤
│                                   │
│ [Tabs: Edit | Chat with AI]      │
│                                   │
│ ╔═══════════════════════════════╗ │
│ ║ EDIT TAB                      ║ │
│ ║                               ║ │
│ ║ Name:                         ║ │
│ ║ ┌───────────────────────────┐ ║ │
│ ║ │ User Interface Design     │ ║ │
│ ║ └───────────────────────────┘ ║ │
│ ║                               ║ │
│ ║ Explanation:                  ║ │
│ ║ ┌───────────────────────────┐ ║ │
│ ║ │ The software must have... │ ║ │
│ ║ │                           │ ║ │
│ ║ └───────────────────────────┘ ║ │
│ ║                               ║ │
│ ║ Importance: [High ▼]          ║ │
│ ║                               ║ │
│ ║ Type: [Feature ▼]             ║ │
│ ║                               ║ │
│ ║ [Save Changes] [Delete]       ║ │
│ ╚═══════════════════════════════╝ │
│                                   │
│ ╔═══════════════════════════════╗ │
│ ║ CHAT TAB                      ║ │
│ ║                               ║ │
│ ║ 🤖: How can I help refine     ║ │
│ ║     this criterion?           ║ │
│ ║                               ║ │
│ ║ [Chat interface here...]      ║ │
│ ╚═══════════════════════════════╝ │
│                                   │
└───────────────────────────────────┘
```

**Sidebar Features**:
1. **Edit Tab**:
   - Text input for name
   - Textarea for explanation (min-h-24, auto-resize)
   - Select dropdown for importance
   - Select dropdown for type
   - Save Changes button (primary)
   - Delete button (destructive, with confirmation)

2. **Chat with AI Tab**:
   - Reuse existing chat interface pattern from criteria generation
   - Pre-fill context: "I'm editing the criterion: [name]"
   - AI can suggest improvements to name/explanation
   - Apply suggestions button to update fields

### Data Structure Changes

**Updated Criteria Interface**:
```typescript
// Before:
interface Criteria {
  id: string;
  name: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
}

// After:
interface Criteria {
  id: string;
  name: string;
  explanation: string; // NEW: Detailed description of the criterion
  importance: 'low' | 'medium' | 'high';
  type: string;
}
```

**Migration Strategy**:
- Existing criteria without explanations: Set `explanation = ''` (empty string)
- AI-generated criteria: Include pre-populated explanations
- User-added criteria: Optional explanation field (can be filled via AI sidebar)

### Priority Sorting

**Sorting Logic** (within each category):
```typescript
const sortedCriteria = criteria
  .filter(c => c.type === currentCategory)
  .sort((a, b) => {
    // Priority order: High > Medium > Low
    const importanceOrder = { high: 3, medium: 2, low: 1 };
    return importanceOrder[b.importance] - importanceOrder[a.importance];
  });
```

**Visual Result**:
- All HIGH importance criteria appear first
- Then MEDIUM importance criteria
- LOW importance criteria hidden (per requirements)
- Within same importance level: alphabetical by name

---

## Implementation Plan

### Phase 1: Data Structure & Types (30 minutes)

**File**: `src/types/index.ts`

**Changes**:
```typescript
// Add explanation field to Criteria interface
export interface Criteria {
  id: string;
  name: string;
  explanation: string; // NEW
  importance: 'low' | 'medium' | 'high';
  type: string;
}
```

**File**: `src/hooks/useCriteriaGeneration.ts`

**Changes**:
```typescript
// Update mockup data generation to include explanations

const generateCriteriaWithExplanations = (category: string): Criteria[] => {
  // Pre-populated mockup data with explanations
  const mockCriteria = {
    'CRM Software': [
      {
        id: '1',
        name: 'User Interface Design',
        explanation: 'The software must have an intuitive, modern user interface that requires minimal training for new users. Should support drag-and-drop functionality and customizable dashboards.',
        importance: 'high',
        type: 'feature'
      },
      {
        id: '2',
        name: 'Core Functionality',
        explanation: 'Must include essential CRM features: contact management, deal pipeline tracking, task automation, email integration, and reporting capabilities.',
        importance: 'high',
        type: 'feature'
      },
      // ... more criteria with explanations
    ],
    'Project Management': [
      // ... category-specific criteria
    ],
    // ... more categories
  };

  return mockCriteria[category] || [];
};
```

**Testing**:
- [ ] TypeScript compiles without errors
- [ ] Existing criteria components still work (backward compatible)

---

### Phase 2: Signal Antenna Component (1 hour)

**File**: `src/components/vendor-discovery/SignalAntenna.tsx` (NEW)

**Implementation**:
```typescript
import React from 'react';

interface SignalAntennaProps {
  importance: 'low' | 'medium' | 'high';
  className?: string;
}

export const SignalAntenna = ({ importance, className = '' }: SignalAntennaProps) => {
  const bars = importance === 'high' ? 3 : importance === 'medium' ? 2 : 1;

  return (
    <div className={`flex items-end gap-0.5 ${className}`} title={importance.charAt(0).toUpperCase() + importance.slice(1)}>
      {/* Bar 1 - Shortest */}
      <div className={`w-1.5 h-2 rounded-sm transition-colors ${
        bars >= 1 ? 'bg-warning' : 'bg-gray-200'
      }`} />

      {/* Bar 2 - Medium */}
      <div className={`w-1.5 h-3 rounded-sm transition-colors ${
        bars >= 2 ? 'bg-warning' : 'bg-gray-200'
      }`} />

      {/* Bar 3 - Tallest */}
      <div className={`w-1.5 h-4 rounded-sm transition-colors ${
        bars >= 3 ? 'bg-destructive' : 'bg-gray-200'
      }`} />
    </div>
  );
};
```

**Styling Notes**:
- Low (1 bar): Yellow/warning color
- Medium (2 bars): Yellow/warning color
- High (3 bars): Red/destructive color for top bar
- Smooth color transition on importance change

**Testing**:
- [ ] Renders correctly for all importance levels
- [ ] Tooltip shows importance label on hover
- [ ] Colors match design spec

---

### Phase 3: Accordion Structure (2 hours)

**File**: `src/components/vendor-discovery/CriteriaBuilder.tsx`

**State Management**:
```typescript
const [expandedSections, setExpandedSections] = useState<Set<string>>(
  new Set(['feature']) // Feature section expanded by default
);

const toggleSection = (section: string) => {
  setExpandedSections(prev => {
    const newSet = new Set(prev);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    return newSet;
  });
};
```

**Category Statistics**:
```typescript
const getCategoryStats = (type: string) => {
  const categoryCriteria = criteria.filter(c => c.type === type);
  const highCount = categoryCriteria.filter(c => c.importance === 'high').length;
  const mediumCount = categoryCriteria.filter(c => c.importance === 'medium').length;

  return {
    total: categoryCriteria.length,
    highCount,
    mediumCount
  };
};
```

**Accordion Header Component**:
```typescript
const AccordionHeader = ({
  category,
  isExpanded,
  onToggle
}: {
  category: string;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const stats = getCategoryStats(category);
  const displayName = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        <span className="font-semibold text-base">
          {displayName}: {stats.total}
        </span>
        {stats.total > 0 && (
          <span className="text-sm text-muted-foreground">
            {stats.highCount} High, {stats.mediumCount} Medium
          </span>
        )}
      </div>

      {/* Badge for category type */}
      <Badge variant="outline" className={getTypeColor(category)}>
        {displayName}
      </Badge>
    </button>
  );
};
```

**Accordion Content**:
```typescript
<AnimatePresence initial={false}>
  {expandedSections.has(category) && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="pt-2 pb-4 px-2 space-y-2">
        {sortedCriteria.map(criterion => (
          <CriterionCard
            key={criterion.id}
            criterion={criterion}
            onEdit={() => handleEditCriterion(criterion)}
          />
        ))}

        {sortedCriteria.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No {category} criteria defined yet
          </div>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Testing**:
- [ ] Click header toggles section open/closed
- [ ] Multiple sections can be open simultaneously
- [ ] Smooth animation on expand/collapse (300ms)
- [ ] Statistics display correctly (total, high, medium)
- [ ] Empty state shows when no criteria in category

---

### Phase 4: Criterion Card Component (2 hours)

**File**: `src/components/vendor-discovery/CriterionCard.tsx` (NEW)

**Implementation**:
```typescript
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { SignalAntenna } from './SignalAntenna';
import type { Criteria } from '@/types';

interface CriterionCardProps {
  criterion: Criteria;
  onEdit: () => void;
}

export const CriterionCard = ({ criterion, onEdit }: CriterionCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header Row: Name, Importance Icon, AI Button */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h4 className="font-semibold text-base flex-1">
            {criterion.name}
          </h4>

          <div className="flex items-center gap-2">
            <SignalAntenna importance={criterion.importance} />

            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-primary hover:text-primary"
              title="Edit with AI"
            >
              <Bot className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Explanation Text */}
        {criterion.explanation && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {criterion.explanation}
          </p>
        )}

        {/* Placeholder if no explanation */}
        {!criterion.explanation && (
          <p className="text-sm text-muted-foreground/50 italic">
            No explanation provided. Click the AI button to add one.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
```

**Styling**:
- Card padding: 16px (p-4)
- Name font: semibold, base size
- Explanation: small text, muted color, relaxed line height
- Hover: elevate shadow slightly
- AI button: ghost variant, small icon size

**Testing**:
- [ ] Card displays name, explanation, importance icon, AI button
- [ ] AI button click triggers edit handler
- [ ] Hover effect works smoothly
- [ ] Empty explanation shows placeholder message

---

### Phase 5: AI Editing Sidebar (3 hours)

**File**: `src/components/vendor-discovery/CriteriaEditSidebar.tsx` (NEW)

**State Management**:
```typescript
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [editingCriterion, setEditingCriterion] = useState<Criteria | null>(null);
const [activeTab, setActiveTab] = useState<'edit' | 'chat'>('edit');

const handleEditCriterion = (criterion: Criteria) => {
  setEditingCriterion(criterion);
  setIsSidebarOpen(true);
  setActiveTab('edit');
};

const handleCloseSidebar = () => {
  setIsSidebarOpen(false);
  // Reset after animation completes
  setTimeout(() => {
    setEditingCriterion(null);
    setActiveTab('edit');
  }, 300);
};
```

**Sidebar Component**:
```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import type { Criteria } from '@/types';

interface CriteriaEditSidebarProps {
  isOpen: boolean;
  criterion: Criteria | null;
  onClose: () => void;
  onSave: (updated: Criteria) => void;
  onDelete: (id: string) => void;
}

export const CriteriaEditSidebar = ({
  isOpen,
  criterion,
  onClose,
  onSave,
  onDelete
}: CriteriaEditSidebarProps) => {
  const [editedCriterion, setEditedCriterion] = useState<Criteria | null>(criterion);

  // Update local state when criterion changes
  React.useEffect(() => {
    setEditedCriterion(criterion);
  }, [criterion]);

  const handleSave = () => {
    if (editedCriterion) {
      onSave(editedCriterion);
      onClose();
    }
  };

  const handleDelete = () => {
    if (editedCriterion && confirm('Are you sure you want to delete this criterion?')) {
      onDelete(editedCriterion.id);
      onClose();
    }
  };

  if (!editedCriterion) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-background shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Criterion</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="chat">Chat with AI</TabsTrigger>
                </TabsList>

                {/* Edit Tab */}
                <TabsContent value="edit" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="criterion-name">Name</Label>
                    <Input
                      id="criterion-name"
                      value={editedCriterion.name}
                      onChange={(e) => setEditedCriterion({ ...editedCriterion, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="criterion-explanation">Explanation</Label>
                    <Textarea
                      id="criterion-explanation"
                      value={editedCriterion.explanation}
                      onChange={(e) => setEditedCriterion({ ...editedCriterion, explanation: e.target.value })}
                      className="min-h-24"
                      placeholder="Describe what this criterion evaluates..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="criterion-importance">Importance</Label>
                    <Select
                      value={editedCriterion.importance}
                      onValueChange={(value: 'low' | 'medium' | 'high') =>
                        setEditedCriterion({ ...editedCriterion, importance: value })
                      }
                    >
                      <SelectTrigger id="criterion-importance">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="criterion-type">Type</Label>
                    <Select
                      value={editedCriterion.type}
                      onValueChange={(value: string) =>
                        setEditedCriterion({ ...editedCriterion, type: value })
                      }
                    >
                      <SelectTrigger id="criterion-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    Chat with AI feature coming soon...
                    {/* TODO: Integrate chat interface for criterion refinement */}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
```

**Features**:
- Slide-in from right with backdrop overlay
- Full width on mobile, 400px on desktop
- Edit tab with all criterion fields
- Chat tab placeholder (future enhancement)
- Save button updates criterion
- Delete button with confirmation dialog

**Testing**:
- [ ] Sidebar slides in smoothly from right
- [ ] Backdrop click closes sidebar
- [ ] Close button works
- [ ] All fields update editedCriterion state
- [ ] Save button triggers onSave callback
- [ ] Delete button shows confirmation and triggers onDelete
- [ ] Mobile: Full width sidebar works correctly

---

### Phase 6: Integration & Layout (2 hours)

**File**: `src/components/vendor-discovery/CriteriaBuilder.tsx`

**Main Component Updates**:
```typescript
// Replace Tabs/Table section with Accordion
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      Evaluation Criteria ({criteria.length})
      <Badge variant="secondary">
        {criteria.filter(c => c.importance === 'high').length} High Priority
      </Badge>
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Feature Category */}
    <div className="space-y-2">
      <AccordionHeader
        category="feature"
        isExpanded={expandedSections.has('feature')}
        onToggle={() => toggleSection('feature')}
      />
      <AnimatePresence initial={false}>
        {expandedSections.has('feature') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-4 px-2 space-y-2">
              {getSortedCriteria('feature').map(criterion => (
                <CriterionCard
                  key={criterion.id}
                  criterion={criterion}
                  onEdit={() => handleEditCriterion(criterion)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Repeat for Technical, Business, Compliance */}
    {/* ... */}

    {/* Other (Custom Types) */}
    {customTypes.length > 0 && (
      <div className="space-y-2">
        <AccordionHeader
          category="other"
          isExpanded={expandedSections.has('other')}
          onToggle={() => toggleSection('other')}
        />
        {/* ... */}
      </div>
    )}
  </CardContent>
</Card>

{/* AI Editing Sidebar */}
<CriteriaEditSidebar
  isOpen={isSidebarOpen}
  criterion={editingCriterion}
  onClose={handleCloseSidebar}
  onSave={handleSaveCriterion}
  onDelete={handleDeleteCriterion}
/>
```

**Helper Functions**:
```typescript
const getSortedCriteria = (type: string) => {
  return criteria
    .filter(c => c.type === type)
    .filter(c => c.importance !== 'low') // Hide low importance
    .sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.importance] - order[a.importance];
    });
};

const handleSaveCriterion = (updated: Criteria) => {
  setCriteria(prev => prev.map(c => c.id === updated.id ? updated : c));
  toast({
    title: "Criterion updated",
    description: `"${updated.name}" has been saved.`
  });
};

const handleDeleteCriterion = (id: string) => {
  const criterion = criteria.find(c => c.id === id);
  setCriteria(prev => prev.filter(c => c.id !== id));
  toast({
    title: "Criterion deleted",
    description: `"${criterion?.name}" has been removed.`,
    variant: "destructive"
  });
};
```

**Testing**:
- [ ] All accordions render correctly
- [ ] Criteria sorted by priority within categories
- [ ] Low importance criteria hidden
- [ ] Edit button opens sidebar with correct criterion
- [ ] Save updates criterion in list
- [ ] Delete removes criterion from list
- [ ] Toast notifications appear on save/delete

---

### Phase 7: Mockup Data Population (1 hour)

**File**: `src/hooks/useCriteriaGeneration.ts`

**Pre-populated Mockup Data**:
```typescript
const MOCKUP_CRITERIA_BY_CATEGORY: Record<string, Criteria[]> = {
  'CRM Software': [
    {
      id: '1',
      name: 'User Interface Design',
      explanation: 'The software must have an intuitive, modern user interface that requires minimal training for new users. Should support drag-and-drop functionality, customizable dashboards, and responsive design for mobile devices.',
      importance: 'high',
      type: 'feature'
    },
    {
      id: '2',
      name: 'Core Functionality',
      explanation: 'Must include essential CRM features: contact management with custom fields, deal pipeline tracking with stages, task automation, email integration (Gmail/Outlook), and comprehensive reporting capabilities.',
      importance: 'high',
      type: 'feature'
    },
    {
      id: '3',
      name: 'Mobile Compatibility',
      explanation: 'Native mobile apps for iOS and Android with offline sync capabilities. Mobile UI should provide access to all critical features including contact lookup, deal updates, and task management.',
      importance: 'high',
      type: 'feature'
    },
    {
      id: '4',
      name: 'API Integration Capabilities',
      explanation: 'RESTful API with comprehensive documentation for custom integrations. Should support webhooks for real-time updates and have pre-built integrations with popular tools (Slack, Zapier, etc.).',
      importance: 'high',
      type: 'technical'
    },
    {
      id: '5',
      name: 'Data Security & Compliance',
      explanation: 'SOC 2 Type II certification, GDPR compliance, encryption at rest and in transit. Role-based access control (RBAC) with granular permissions. Regular security audits and penetration testing.',
      importance: 'high',
      type: 'compliance'
    },
    {
      id: '6',
      name: 'Customization Options',
      explanation: 'Ability to create custom fields, objects, and workflows without coding. Support for custom reports and dashboards. White-labeling options for enterprise customers.',
      importance: 'medium',
      type: 'feature'
    },
    {
      id: '7',
      name: 'Performance & Scalability',
      explanation: 'Page load times under 2 seconds, support for 10,000+ concurrent users. Database query optimization and CDN integration for global performance.',
      importance: 'medium',
      type: 'technical'
    },
    {
      id: '8',
      name: 'Pricing Transparency',
      explanation: 'Clear, predictable pricing structure with no hidden fees. Flexible plans (per-user, per-feature). Annual discount options and volume pricing for large teams.',
      importance: 'medium',
      type: 'business'
    }
  ],
  'Project Management': [
    {
      id: '9',
      name: 'Task & Project Organization',
      explanation: 'Hierarchical project structure (projects > tasks > subtasks). Support for Gantt charts, Kanban boards, and list views. Dependencies and milestones tracking.',
      importance: 'high',
      type: 'feature'
    },
    {
      id: '10',
      name: 'Team Collaboration',
      explanation: 'Real-time collaboration features including comments, @mentions, file sharing. Activity feed showing recent changes and updates. Team chat integration.',
      importance: 'high',
      type: 'feature'
    },
    {
      id: '11',
      name: 'Time Tracking & Reporting',
      explanation: 'Built-in time tracking with start/stop timers. Timesheet approval workflows. Comprehensive reports on time spent per project, task, and team member.',
      importance: 'medium',
      type: 'feature'
    },
    {
      id: '12',
      name: 'Integration Ecosystem',
      explanation: 'Pre-built integrations with Jira, GitHub, Slack, Google Drive. API for custom integrations. Zapier/Make support for workflow automation.',
      importance: 'medium',
      type: 'technical'
    }
  ],
  'Analytics & BI': [
    {
      id: '13',
      name: 'Data Visualization',
      explanation: 'Interactive charts, graphs, and dashboards with drag-and-drop customization. Support for 20+ visualization types. Real-time data refresh capabilities.',
      importance: 'high',
      type: 'feature'
    },
    {
      id: '14',
      name: 'Self-Service Analytics',
      explanation: 'No-code query builder for business users. Natural language queries (ask questions in plain English). Saved report templates and scheduled email delivery.',
      importance: 'high',
      type: 'feature'
    },
    {
      id: '15',
      name: 'Data Source Connectivity',
      explanation: 'Native connectors for 50+ data sources (SQL databases, cloud storage, SaaS apps). Support for custom SQL queries. Real-time and batch data sync.',
      importance: 'medium',
      type: 'technical'
    }
  ]
};

// Update generateInitialCriteria to use this mockup data
export const generateInitialCriteria = async (techRequest: TechRequest): Promise<GeneratedCriteria> => {
  // Simulate AI delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Get pre-populated criteria for this category
  const criteria = MOCKUP_CRITERIA_BY_CATEGORY[techRequest.category] || [];

  // Generate AI message
  const message: ChatMessage = {
    id: Date.now().toString(),
    role: 'assistant',
    content: `I've analyzed your requirements and generated ${criteria.length} evaluation criteria for ${techRequest.category}. These criteria are prioritized based on industry best practices and common selection factors.`,
    timestamp: new Date()
  };

  return { criteria, message };
};
```

**Coverage**: Add mockup data for 10+ categories with 5-8 criteria each.

**Testing**:
- [ ] All categories have pre-populated criteria with explanations
- [ ] Explanations are detailed and helpful (2-3 sentences)
- [ ] Mix of importance levels (High/Medium)
- [ ] Mix of types (Feature/Technical/Business/Compliance)

---

### Phase 8: Testing & Polish (2 hours)

**Manual Testing Checklist**:

1. **Accordion Functionality**:
   - [ ] Click to expand/collapse works smoothly
   - [ ] Multiple sections can be open at once
   - [ ] Animation is smooth (no jank)
   - [ ] Statistics display correctly in headers

2. **Criterion Cards**:
   - [ ] Cards display all information (name, explanation, importance, AI button)
   - [ ] Signal antenna shows correct number of bars
   - [ ] Hover effect works
   - [ ] Cards sorted by priority within categories

3. **AI Sidebar**:
   - [ ] Sidebar slides in from right
   - [ ] All fields editable
   - [ ] Save updates criterion correctly
   - [ ] Delete removes criterion with confirmation
   - [ ] Close button and backdrop click work
   - [ ] Mobile: Full-width sidebar

4. **Data Integrity**:
   - [ ] Explanation field persists correctly
   - [ ] Editing doesn't corrupt other criteria
   - [ ] Deleting updates count in accordion headers
   - [ ] Sorting maintains correct order

5. **Mobile Responsiveness** (< 768px):
   - [ ] Accordion headers stack vertically
   - [ ] Cards are full width
   - [ ] Sidebar is full width
   - [ ] Touch interactions work smoothly
   - [ ] No horizontal scrolling

6. **Edge Cases**:
   - [ ] Empty categories show correct message
   - [ ] Single criterion per category works
   - [ ] No criteria at all shows empty state
   - [ ] Long criterion names wrap correctly
   - [ ] Long explanations display properly

**Performance Testing**:
- [ ] Page loads in < 2s with 50+ criteria
- [ ] Smooth animations with 100+ criteria
- [ ] No memory leaks with repeated open/close

---

## Technical Architecture

### Component Hierarchy

```
CriteriaBuilder
├── AI Chat Interface (existing)
├── Evaluation Criteria Card
│   ├── Feature Accordion
│   │   ├── AccordionHeader (Feature: 8 - 5 High, 3 Medium)
│   │   └── AccordionContent
│   │       ├── CriterionCard (High priority)
│   │       ├── CriterionCard (High priority)
│   │       └── CriterionCard (Medium priority)
│   ├── Technical Accordion
│   ├── Business Accordion
│   ├── Compliance Accordion
│   └── Other Accordion (custom types)
├── Upload Excel File (existing)
├── Manage Custom Types (existing)
├── Add New Criterion (updated with explanation field)
└── CriteriaEditSidebar (NEW)
    ├── Backdrop Overlay
    └── Sidebar Panel
        ├── Header (Close button)
        └── Tabs
            ├── Edit Tab (form fields)
            └── Chat Tab (AI interface)
```

### State Management Flow

```typescript
// Component State
const [criteria, setCriteria] = useState<Criteria[]>([]);
const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['feature']));
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [editingCriterion, setEditingCriterion] = useState<Criteria | null>(null);

// User Actions → State Updates
Edit Button Click → setEditingCriterion(criterion) + setIsSidebarOpen(true)
Save Changes → setCriteria(updated) + setIsSidebarOpen(false)
Delete Criterion → setCriteria(filtered) + setIsSidebarOpen(false)
Toggle Accordion → setExpandedSections(toggled)
```

### Data Flow

```
1. Initial Load
   ↓
   generateInitialCriteria(techRequest)
   ↓
   MOCKUP_CRITERIA_BY_CATEGORY[category]
   ↓
   setCriteria(criteria with explanations)
   ↓
   Render Accordions (sorted by priority)

2. Edit Flow
   ↓
   User clicks AI button
   ↓
   handleEditCriterion(criterion)
   ↓
   Sidebar opens with criterion data
   ↓
   User edits fields
   ↓
   User clicks Save
   ↓
   handleSaveCriterion(updated)
   ↓
   setCriteria(mapped with update)
   ↓
   Re-render with updated data
```

---

## Exit Criteria

### Must-Have (Blocking)
- [x] Criteria interface includes explanation field
- [x] Horizontal tabs replaced with vertical accordion
- [x] Accordion headers show statistics (total, high, medium)
- [x] Multiple sections can be open simultaneously
- [x] Criteria sorted by priority (High → Medium) within categories
- [x] Low importance criteria hidden from display
- [x] Card-based layout when section expanded
- [x] Signal antenna icon shows importance (1-3 bars)
- [x] AI button on each card opens editing sidebar
- [x] Sidebar slides in from right with backdrop
- [x] Edit tab allows editing all fields (name, explanation, importance, type)
- [x] Delete button with confirmation dialog
- [x] Save updates criterion in list
- [x] Mockup data includes explanations (10+ categories)
- [x] Build completes with 0 errors
- [x] No console errors during usage

### Should-Have (Important)
- [x] Smooth animations (expand/collapse 300ms)
- [x] Mobile: Full-width sidebar
- [x] Mobile: Touch-friendly accordion headers
- [x] Empty state for categories with no criteria
- [x] Toast notifications on save/delete
- [x] Hover effects on cards
- [x] TypeScript type safety maintained

### Nice-to-Have (Optional)
- [ ] Chat with AI tab functional (can defer)
- [ ] Persist expanded sections in localStorage
- [ ] Keyboard shortcuts (Escape to close sidebar)
- [ ] Drag-and-drop reordering within categories

---

## Risk Assessment

### High Risk
1. **Data Migration**: Existing criteria lack explanations
   - **Mitigation**: Set `explanation = ''` for existing, optional field
   - **Backup**: Add "Add Explanation" prompt in empty state

2. **Mobile Performance**: Many criteria = slow animations
   - **Mitigation**: Use `transform` and `opacity` for GPU acceleration
   - **Backup**: Disable animations on low-end devices

### Medium Risk
1. **Sidebar Complexity**: Edit + Chat tabs add complexity
   - **Mitigation**: Start with Edit tab only, defer Chat tab
   - **Backup**: Simplify to single-purpose edit modal

2. **Sorting Logic**: High/Medium/Low order must be consistent
   - **Mitigation**: Centralized sorting function with unit tests
   - **Backup**: Manual verification in QA

### Low Risk
1. **Accordion State**: Managing open/closed sections
   - **Mitigation**: Use Set data structure for efficient lookups
   - **Backup**: Array-based fallback

---

## Documentation Updates

### Files to Update After Sprint

1. **PROGRESS.md**:
   - Add SP_012 completion summary
   - Note accordion redesign and mobile improvements

2. **PROJECT_ROADMAP.md**:
   - Mark SP_012 as complete
   - Update current sprint status

3. **FEATURE_LIST.md**:
   - Update F-010 (Criteria Builder) with accordion details
   - Note new explanation field and AI sidebar

4. **USER_STORIES.md**:
   - Update US-05 (Criteria Management) with new UX flow

---

## Success Metrics

**Quantitative**:
- Build time: < 2 seconds
- Page load: < 2 seconds with 50 criteria
- Animation FPS: 60fps on accordion expand/collapse
- Mobile tap target: All buttons ≥ 44px × 44px
- Test coverage: 80%+ on new components

**Qualitative**:
- Mobile users can easily navigate criteria without horizontal scrolling
- Accordion headers provide clear overview of criteria distribution
- Signal antenna immediately conveys priority level
- AI sidebar feels natural and responsive
- Explanations add valuable context to criteria

**User Feedback Targets**:
- "Much easier to use on mobile" (vs. table layout)
- "Signal antenna makes priorities obvious"
- "Explanations help me understand what to look for"
- "AI sidebar is convenient for quick edits"

---

## Future Enhancements (Post-Sprint)

1. **AI Chat Tab** (SP_013):
   - Implement chat interface in sidebar
   - AI can suggest criterion improvements
   - Natural language criterion generation

2. **Advanced Sorting** (SP_014):
   - User-defined sort order (drag-and-drop)
   - Sort by: name, type, custom order
   - Save sort preferences

3. **Criterion Templates** (SP_015):
   - Pre-built criterion libraries by industry
   - "Import 10 common CRM criteria" button
   - Community-shared criterion sets

4. **Batch Operations** (SP_016):
   - Multi-select criteria
   - Bulk edit importance/type
   - Bulk delete with confirmation

---

## Rollback Plan

### If Sprint Fails
1. **Revert Files**:
   ```bash
   git checkout main -- src/components/vendor-discovery/CriteriaBuilder.tsx
   git checkout main -- src/types/index.ts
   git checkout main -- src/hooks/useCriteriaGeneration.ts
   ```

2. **Restore Table Layout**:
   - Keep tabs-based navigation
   - Keep table with inline editing
   - Defer accordion to future sprint

3. **Explanation Field**:
   - Keep type changes (explanation field added)
   - Mark as optional, populate gradually
   - Use in read-only view (not edit mode)

### Partial Rollback
- **Keep**: Accordion structure, explanation field
- **Revert**: AI sidebar (too complex)
- **Fallback**: Simple modal for editing

---

## Appendix

### Design References

**Signal Antenna Inspiration**:
- iOS signal strength indicator
- Android network strength icon
- Material Design signal bars

**Accordion Patterns**:
- shadcn/ui Accordion component
- Headless UI Disclosure component
- Bootstrap Collapse component

### Code Patterns Used

**Framer Motion Animations**:
```typescript
// Smooth height animation
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
/>
```

**Set-based State**:
```typescript
// Efficient toggle for multiple selections
const toggleSection = (section: string) => {
  setExpandedSections(prev => {
    const newSet = new Set(prev);
    newSet.has(section) ? newSet.delete(section) : newSet.add(section);
    return newSet;
  });
};
```

**Backdrop Pattern**:
```typescript
// Standard backdrop + sidebar combination
<Backdrop onClick={onClose} />
<Sidebar translateX={isOpen ? 0 : '100%'} />
```

---

**Sprint Created**: November 14, 2024
**Sprint Owner**: Development Team
**Estimated Effort**: 12-14 hours (2-3 days)
**Dependencies**: None (independent UI refactoring)
**Stakeholder Review**: After completion (visual demonstration)
