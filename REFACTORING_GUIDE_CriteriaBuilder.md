# Refactoring Guide: CriteriaBuilder.tsx

**Current File**: `/src/components/vendor-discovery/CriteriaBuilder.tsx` (1,276 lines)
**Status**: CRITICAL - God Component - Multiple responsibilities mixed
**Complexity**: Very High - 11+ state variables, 8+ handlers, 3+ hooks
**Impact**: HIGH - Core feature of application

---

## Problem Statement

The CriteriaBuilder component violates GL-RDD's Single Responsibility Principle by handling **5 distinct concerns**:

1. **Form UI** (inputs, selects, tabs, buttons)
2. **State Management** (11+ useState calls)
3. **File Upload Processing** (XLSX parsing, validation)
4. **Chat Interface** (messaging, message rendering)
5. **Business Logic** (criteria CRUD, reordering, categorization)

This makes the component:
- 1,276 lines - difficult to understand
- 11 state variables - hard to track data flow
- Mixed concerns - impossible to test parts independently
- Monolithic - can't reuse logic elsewhere

---

## Current Architecture (Incorrect)

```
CriteriaBuilder.tsx (1,276 lines)
├── Props Interface (4 properties)
├── State Management (11 useState calls)
│   ├── criteria
│   ├── newCriterion
│   ├── customTypes
│   ├── newCustomType
│   ├── isUploading
│   ├── expandedSections
│   ├── editingCriterion
│   ├── editingInitialTab
│   ├── newCriterionCategory
│   ├── isCreatingCategory
│   ├── newCategoryName
│   └── isShareDialogOpen
├── Custom Hooks (3)
│   ├── useCriteriaOrder()
│   ├── useCriteriaGeneration()
│   └── useCriteriaChat()
├── Handlers & Logic (8+ functions)
│   ├── handleCriteriaAction()
│   ├── handleSortingToggle()
│   ├── handleSendMessage()
│   ├── addCustomType()
│   ├── removeCustomType()
│   ├── addCriterion()
│   ├── removeCriterion()
│   ├── updateCriterion()
│   ├── handleFileUpload()
│   ├── handleComplete()
│   └── utility functions
├── Utilities (3+ functions)
│   ├── highlightKeywords()
│   ├── generateDetailedSummary()
│   └── getImportanceColor()
└── JSX Rendering (500+ lines)
    ├── Chat interface section
    ├── Criteria list section
    ├── Form inputs section
    ├── Dialogs & modals
    └── Various UI elements
```

---

## Target Architecture (Correct)

```
vendor-discovery/
├── CriteriaBuilder.tsx             # Main orchestrator (250-300 lines)
│   └── Responsibilities:
│       - Manage overall flow
│       - Coordinate sub-components
│       - Handle completion callback
│
├── hooks/
│   ├── useCriteriaBuilderState.ts (200-250 lines)
│   │   └── Consolidated all state management
│   └── useCriteriaActions.ts (150-200 lines)
│       └── Criteria CRUD operations
│
├── criteria/
│   ├── CriteriaForm.tsx (200-250 lines)
│   │   └── Form inputs for creating/editing
│   ├── CriteriaList.tsx (150-200 lines)
│   │   └── Display & manage criteria list
│   ├── CriteriaImporter.tsx (150-180 lines)
│   │   └── File upload & parsing
│   └── CriteriaCard.tsx (Already exists? 563 lines - consider further split)
│
├── chat/
│   ├── CriteriaChatPanel.tsx (250-300 lines)
│   │   └── Chat UI & interaction
│   ├── ChatMessageRenderer.tsx (100-120 lines)
│   │   └── Message formatting
│   └── ChatActions.ts (80-100 lines)
│       └── Message handling logic
│
├── utils/
│   ├── criteriaUtils.ts (100-150 lines)
│   │   ├── highlightKeywords()
│   │   ├── generateDetailedSummary()
│   │   └── Criteria-specific utilities
│   ├── formattingUtils.ts (80-100 lines)
│   │   ├── getImportanceColor()
│   │   └── Format utilities
│   └── types.ts (50-80 lines)
│       └── Local type definitions
│
└── README.md
    └── Component documentation
```

---

## Detailed Refactoring Steps

### Phase 1: Extract State Management Hook

**File**: `src/components/vendor-discovery/hooks/useCriteriaBuilderState.ts` (200-250 lines)

This hook consolidates all 11+ state variables into a single, manageable hook:

```typescript
/**
 * Criteria Builder State Management Hook
 *
 * Consolidates all state management for the CriteriaBuilder component
 * Separates state logic from UI rendering
 */

import { useState, useCallback } from 'react';
import type { Criteria } from '../types';

interface CriteriaBuilderState {
  // Criteria data
  criteria: Criteria[];
  newCriterion: {
    name: string;
    explanation: string;
    importance: 'low' | 'medium' | 'high';
    type: string;
  };

  // Custom types
  customTypes: string[];
  newCustomType: string;

  // Upload state
  isUploading: boolean;

  // Accordion state
  expandedSections: Set<string>;

  // Editing state
  editingCriterion: Criteria | null;
  editingInitialTab: 'chat' | 'edit';

  // Category creation
  newCriterionCategory: string | null;
  isCreatingCategory: boolean;
  newCategoryName: string;

  // Dialog state
  isShareDialogOpen: boolean;
}

export const useCriteriaBuilderState = (initialCriteria: Criteria[] = []) => {
  const [criteria, setCriteria] = useState<Criteria[]>(initialCriteria);
  const [newCriterion, setNewCriterion] = useState({
    name: '',
    explanation: '',
    importance: 'medium' as const,
    type: 'feature' as string,
  });

  // ... all other useState calls consolidated here

  const state: CriteriaBuilderState = {
    criteria,
    newCriterion,
    customTypes,
    newCustomType,
    isUploading,
    expandedSections,
    editingCriterion,
    editingInitialTab,
    newCriterionCategory,
    isCreatingCategory,
    newCategoryName,
    isShareDialogOpen,
  };

  const actions = {
    setCriteria,
    setNewCriterion,
    setCustomTypes,
    setNewCustomType,
    setIsUploading,
    setExpandedSections,
    setEditingCriterion,
    setEditingInitialTab,
    setNewCriterionCategory,
    setIsCreatingCategory,
    setNewCategoryName,
    setIsShareDialogOpen,
  };

  return { state, actions };
};
```

### Phase 2: Extract Criteria Actions Hook

**File**: `src/components/vendor-discovery/hooks/useCriteriaActions.ts` (150-200 lines)

Business logic for CRUD operations:

```typescript
/**
 * Criteria Actions Hook
 *
 * Encapsulates business logic for criteria management:
 * - Add, edit, delete criteria
 * - Manage custom types
 * - Handle criteria ordering
 */

import { useCallback } from 'react';
import type { Criteria, CriteriaAction } from '../types';

export const useCriteriaActions = (
  criteria: Criteria[],
  setCriteria: (c: Criteria[]) => void
) => {
  const addCriterion = useCallback((newCriterion: Criteria) => {
    // Validation
    if (!newCriterion.name.trim()) {
      throw new Error('Criterion name is required');
    }

    const criterion: Criteria = {
      id: crypto.randomUUID(),
      ...newCriterion,
    };

    setCriteria([...criteria, criterion]);
  }, [criteria, setCriteria]);

  const updateCriterion = useCallback((id: string, updates: Partial<Criteria>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [criteria, setCriteria]);

  const removeCriterion = useCallback((id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  }, [criteria, setCriteria]);

  const addCustomType = useCallback((type: string, customTypes: string[]) => {
    if (!type.trim() || customTypes.includes(type)) {
      return false;
    }
    return true;
  }, []);

  const removeCustomType = useCallback((type: string, customTypes: string[]) => {
    return customTypes.filter(t => t !== type);
  }, []);

  const handleCriteriaActions = useCallback((actions: CriteriaAction[]) => {
    let updated = [...criteria];

    for (const action of actions) {
      switch (action.type) {
        case 'create':
          if (action.criterion) {
            updated.push(action.criterion as Criteria);
          }
          break;
        case 'update':
          if (action.criterion) {
            updated = updated.map(c =>
              c.id === action.criterion_id ? action.criterion : c
            );
          }
          break;
        case 'delete':
          updated = updated.filter(c => c.id !== action.criterion_id);
          break;
      }
    }

    setCriteria(updated);
  }, [criteria, setCriteria]);

  return {
    addCriterion,
    updateCriterion,
    removeCriterion,
    addCustomType,
    removeCustomType,
    handleCriteriaActions,
  };
};
```

### Phase 3: Extract Utilities

**File**: `src/components/vendor-discovery/utils/criteriaUtils.ts` (100-150 lines)

```typescript
/**
 * Criteria Utilities
 *
 * Helper functions for criteria-related operations
 */

export const highlightKeywords = (text: string): JSX.Element => {
  const keywords = [
    'generated',
    'analyzed',
    'covering',
    'key factors',
    'compliance',
    'evaluation',
    'important',
  ];

  // Implementation moved from CriteriaBuilder.tsx
  // ~30 lines
};

export const generateDetailedSummary = (category: string): string => {
  return `I've analyzed your requirements for ${category} solutions and generated evaluation criteria covering features, technical capabilities, business factors, and compliance considerations.`;
};

export const validateCriterionInput = (
  name: string,
  explanation: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push('Criterion name is required');
  }
  if (name.trim().length > 100) {
    errors.push('Criterion name must be less than 100 characters');
  }
  if (!explanation.trim()) {
    errors.push('Explanation is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
```

**File**: `src/components/vendor-discovery/utils/formattingUtils.ts` (50-80 lines)

```typescript
/**
 * Formatting Utilities
 *
 * Functions for formatting display values
 */

export const getImportanceColor = (importance: string): string => {
  switch (importance) {
    case 'high':
      return 'bg-destructive';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

export const getImportanceLabel = (importance: string): string => {
  return importance.charAt(0).toUpperCase() + importance.slice(1);
};
```

### Phase 4: Extract CriteriaForm Component

**File**: `src/components/vendor-discovery/criteria/CriteriaForm.tsx` (200-250 lines)

```typescript
/**
 * Criteria Form Component
 *
 * Form for creating and editing individual criteria
 * Responsibilities:
 * - Display form inputs
 * - Handle form validation
 * - Manage form state
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Criteria } from '../types';
import { validateCriterionInput } from '../utils/criteriaUtils';

interface CriteriaFormProps {
  onSubmit: (criterion: Partial<Criteria>) => void;
  onCancel: () => void;
  initialValue?: Partial<Criteria>;
  allTypes: string[];
  isSubmitting?: boolean;
}

export const CriteriaForm = ({
  onSubmit,
  onCancel,
  initialValue,
  allTypes,
  isSubmitting = false,
}: CriteriaFormProps) => {
  const [name, setName] = useState(initialValue?.name || '');
  const [explanation, setExplanation] = useState(initialValue?.explanation || '');
  const [importance, setImportance] = useState(initialValue?.importance || 'medium');
  const [type, setType] = useState(initialValue?.type || 'feature');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const validation = validateCriterionInput(name, explanation);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit({
      name,
      explanation,
      importance: importance as 'low' | 'medium' | 'high',
      type,
    });
  };

  return (
    <div className="space-y-4">
      {/* Form JSX - ~150 lines */}
    </div>
  );
};
```

### Phase 5: Extract CriteriaList Component

**File**: `src/components/vendor-discovery/criteria/CriteriaList.tsx` (150-200 lines)

```typescript
/**
 * Criteria List Component
 *
 * Displays and manages the list of criteria
 * Responsibilities:
 * - Render criteria list
 * - Show/hide detailed views
 * - Handle criteria interactions
 */

import type { Criteria } from '../types';
import { CriterionCard } from './CriterionCard';

interface CriteriaListProps {
  criteria: Criteria[];
  onEdit: (criterion: Criteria) => void;
  onDelete: (id: string) => void;
  onReorder?: (criteria: Criteria[]) => void;
  sortedByImportance?: boolean;
  expandedSections: Set<string>;
  onSectionToggle: (section: string) => void;
}

export const CriteriaList = ({
  criteria,
  onEdit,
  onDelete,
  onReorder,
  sortedByImportance = false,
  expandedSections,
  onSectionToggle,
}: CriteriaListProps) => {
  // Group criteria by type
  const groupedCriteria = groupByCriteriaType(criteria);

  return (
    <div className="space-y-4">
      {Object.entries(groupedCriteria).map(([type, items]) => (
        <AccordionSection
          key={type}
          title={type}
          isExpanded={expandedSections.has(type)}
          onToggle={() => onSectionToggle(type)}
        >
          <div className="space-y-2">
            {items.map(criterion => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                onEdit={() => onEdit(criterion)}
                onDelete={() => onDelete(criterion.id)}
              />
            ))}
          </div>
        </AccordionSection>
      ))}
    </div>
  );
};
```

### Phase 6: Extract CriteriaImporter Component

**File**: `src/components/vendor-discovery/criteria/CriteriaImporter.tsx` (150-180 lines)

```typescript
/**
 * Criteria Importer Component
 *
 * Handles XLSX file upload and parsing
 * Responsibilities:
 * - Display file upload UI
 * - Parse XLSX files
 * - Validate imported data
 * - Emit import results
 */

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import type { Criteria } from '../types';

interface CriteriaImporterProps {
  onImport: (criteria: Criteria[]) => void;
  onError: (error: string) => void;
  isImporting?: boolean;
}

export const CriteriaImporter = ({
  onImport,
  onError,
  isImporting = false,
}: CriteriaImporterProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      onError('Only XLSX files are supported');
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedCriteria = parseCriteriaFromSheet(jsonData);
        onImport(importedCriteria);
      } catch (error) {
        onError(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleFileUpload}
        disabled={isImporting || isProcessing}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting || isProcessing}
        variant="outline"
      >
        <Upload className="w-4 h-4 mr-2" />
        Import from Excel
      </Button>
    </div>
  );
};

const parseCriteriaFromSheet = (data: any[]): Criteria[] => {
  // Implementation moved from CriteriaBuilder.tsx
  // ~40 lines
};
```

### Phase 7: Extract CriteriaChatPanel Component

**File**: `src/components/vendor-discovery/chat/CriteriaChatPanel.tsx` (250-300 lines)

```typescript
/**
 * Criteria Chat Panel Component
 *
 * Provides chat interface for criteria refinement
 * Responsibilities:
 * - Display chat messages
 * - Render chat input
 * - Handle message submission
 * - Show typing indicators
 */

import { useRef, useEffect } from 'react';
import { ChatInterface } from '@/components/shared/chat/ChatInterface';
import { ChatInput } from '@/components/shared/chat/ChatInput';
import type { ChatMessage } from '../types';

interface CriteriaChatPanelProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  category: string;
  criteria: Criteria[];
  onCriteriaAction: (actions: CriteriaAction[]) => void;
  isLoading?: boolean;
  error?: string;
}

export const CriteriaChatPanel = ({
  projectId,
  projectName,
  projectDescription,
  category,
  criteria,
  onCriteriaAction,
  isLoading = false,
  error,
}: CriteriaChatPanelProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // ... implementation

  return (
    <div className="flex flex-col h-full gap-4">
      <ChatInterface
        messages={chatMessages}
        isLoading={isLoading}
        error={error}
        onMessageClick={handleMessageClick}
      />
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder="Ask for criteria refinement..."
      />
    </div>
  );
};
```

### Phase 8: Create Main Orchestrator Component

**File**: `src/components/vendor-discovery/CriteriaBuilder.tsx` (Refactored - 250-300 lines)

```typescript
/**
 * Criteria Builder - Main Orchestrator
 *
 * Coordinates the criteria building workflow
 * Responsibilities:
 * - Orchestrate sub-components
 * - Manage overall flow
 * - Handle completion callback
 *
 * Removed responsibilities (moved to sub-components/hooks):
 * - State management → useCriteriaBuilderState hook
 * - Criteria CRUD logic → useCriteriaActions hook
 * - Form rendering → CriteriaForm component
 * - List rendering → CriteriaList component
 * - File upload → CriteriaImporter component
 * - Chat interface → CriteriaChatPanel component
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCriteriaBuilderState } from './hooks/useCriteriaBuilderState';
import { useCriteriaActions } from './hooks/useCriteriaActions';
import { useCriteriaGeneration } from '@/hooks/useCriteriaGeneration';
import { useCriteriaChat } from '@/hooks/useCriteriaChat';
import { CriteriaForm } from './criteria/CriteriaForm';
import { CriteriaList } from './criteria/CriteriaList';
import { CriteriaImporter } from './criteria/CriteriaImporter';
import { CriteriaChatPanel } from './chat/CriteriaChatPanel';
import type { TechRequest, Criteria } from '../VendorDiscovery';

interface CriteriaBuilderProps {
  techRequest: TechRequest;
  onComplete: (criteria: Criteria[]) => void;
  initialCriteria?: Criteria[];
  projectId: string;
  projectName: string;
  projectDescription: string;
}

export const CriteriaBuilder = ({
  techRequest,
  onComplete,
  initialCriteria,
  projectId,
  projectName,
  projectDescription,
}: CriteriaBuilderProps) => {
  const { toast } = useToast();
  const { state, actions } = useCriteriaBuilderState(initialCriteria);
  const criteriaActions = useCriteriaActions(state.criteria, actions.setCriteria);

  const { generateInitialCriteria, isGenerating } = useCriteriaGeneration();
  const { sendMessage, isGeneratingChat } = useCriteriaChat(/* ... */);

  // Initialize criteria on mount
  useEffect(() => {
    if (state.criteria.length === 0) {
      // Load initial criteria
    }
  }, [projectId]);

  const handleImport = (imported: Criteria[]) => {
    actions.setCriteria(imported);
    toast({
      title: 'Success',
      description: `Imported ${imported.length} criteria`,
    });
  };

  const handleAddCriterion = (criterion: Partial<Criteria>) => {
    try {
      criteriaActions.addCriterion(criterion as Criteria);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add criterion',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = () => {
    if (state.criteria.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one criterion',
        variant: 'destructive',
      });
      return;
    }

    onComplete(state.criteria);
  };

  const isGenerating_ = isGenerating || isGeneratingChat;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Define Evaluation Criteria</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chat" className="w-full">
          <TabsList>
            <TabsTrigger value="chat">Chat with AI</TabsTrigger>
            <TabsTrigger value="edit">Manual Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <CriteriaChatPanel
              projectId={projectId}
              projectName={projectName}
              projectDescription={projectDescription}
              category={techRequest.category}
              criteria={state.criteria}
              onCriteriaAction={criteriaActions.handleCriteriaActions}
              isLoading={isGenerating_}
            />
          </TabsContent>

          <TabsContent value="edit">
            <div className="space-y-4">
              <div className="flex gap-2">
                <CriteriaImporter
                  onImport={handleImport}
                  onError={(error) =>
                    toast({ title: 'Import Error', description: error, variant: 'destructive' })
                  }
                />
              </div>

              <CriteriaForm
                onSubmit={handleAddCriterion}
                onCancel={() => actions.setEditingCriterion(null)}
                allTypes={['feature', 'technical', 'business', 'compliance', ...state.customTypes]}
              />

              <CriteriaList
                criteria={state.criteria}
                onEdit={(criterion) => actions.setEditingCriterion(criterion)}
                onDelete={criteriaActions.removeCriterion}
                expandedSections={state.expandedSections}
                onSectionToggle={(section) => {
                  const updated = new Set(state.expandedSections);
                  if (updated.has(section)) {
                    updated.delete(section);
                  } else {
                    updated.add(section);
                  }
                  actions.setExpandedSections(updated);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleComplete} disabled={isGenerating_} className="mt-4">
          Complete Criteria Definition
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Phase 9: Create README Documentation

**File**: `src/components/vendor-discovery/README.md`

```markdown
# Criteria Builder Module

The Criteria Builder allows users to define evaluation criteria for vendor selection through AI chat or manual entry.

## Components

- **CriteriaBuilder**: Main orchestrator component
- **CriteriaForm**: Form for creating/editing criteria
- **CriteriaList**: Displays criteria grouped by type
- **CriteriaImporter**: XLSX file upload and parsing
- **CriteriaChatPanel**: AI chat interface for criteria refinement

## Hooks

- **useCriteriaBuilderState**: Manages all component state
- **useCriteriaActions**: Business logic for criteria operations
- **useCriteriaGeneration**: AI criteria generation
- **useCriteriaChat**: n8n chat integration

## Utilities

- **criteriaUtils**: Utility functions
- **formattingUtils**: Display formatting

## Architecture

Each component has a single responsibility:
- Form input handling
- List rendering
- File import
- Chat interaction
- State management

This separation allows for independent testing and reuse.
```

---

## Update Import Statements

Update all files importing CriteriaBuilder:

### Before:
```typescript
import { CriteriaBuilder } from '@/components/vendor-discovery/CriteriaBuilder';
```

### After:
```typescript
import { CriteriaBuilder } from '@/components/vendor-discovery/CriteriaBuilder';
// No change needed - internal structure is abstracted
```

---

## Testing Strategy

Create focused test files:

- `src/components/vendor-discovery/hooks/useCriteriaBuilderState.test.ts`
- `src/components/vendor-discovery/hooks/useCriteriaActions.test.ts`
- `src/components/vendor-discovery/criteria/CriteriaForm.test.tsx`
- `src/components/vendor-discovery/criteria/CriteriaList.test.tsx`
- `src/components/vendor-discovery/criteria/CriteriaImporter.test.tsx`
- `src/components/vendor-discovery/chat/CriteriaChatPanel.test.tsx`

Benefits:
- Test each piece independently
- Easier to mock dependencies
- Better error isolation

---

## Benefits After Refactoring

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Component Size | 1,276 lines | 300 lines | 76% reduction |
| State Variables | 11 | 12 (encapsulated) | Better organization |
| Complexity | Very High | Moderate | Much clearer |
| Testability | Poor | Excellent | Each piece testable |
| Reusability | None | High | Logic separated |

---

## Migration Checklist

- [ ] Create directory structure
- [ ] Extract useCriteriaBuilderState hook
- [ ] Extract useCriteriaActions hook
- [ ] Extract utility functions
- [ ] Extract CriteriaForm component
- [ ] Extract CriteriaList component
- [ ] Extract CriteriaImporter component
- [ ] Extract CriteriaChatPanel component
- [ ] Refactor CriteriaBuilder.tsx
- [ ] Create README.md
- [ ] Write unit tests for each piece
- [ ] Update existing tests
- [ ] Code review
- [ ] Merge

---

## Estimated Effort

- **Planning & Analysis**: 1 hour
- **Component Extraction**: 8-10 hours
- **Hook Extraction**: 2-3 hours
- **Testing & Validation**: 2-3 hours
- **Documentation**: 1 hour
- **Code Review**: 1-2 hours
- **Total**: 15-20 hours (2-2.5 days)

---

**Status**: Ready for implementation
**Difficulty**: HIGH - Extensive refactoring
**Risk**: MEDIUM - Breaking changes possible, good test coverage helps

