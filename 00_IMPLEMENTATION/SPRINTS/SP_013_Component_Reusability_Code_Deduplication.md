# SP_013: Component Reusability & Code Deduplication

## Sprint Metadata
- **Sprint ID**: SP_013
- **Sprint Name**: Component Reusability & Code Deduplication
- **Duration**: 5-7 days
- **Status**: ✅ Complete (Completed: November 11, 2024)
- **Type**: Code Quality - Component Architecture Improvement
- **Priority**: High
- **Phase**: Phase 0 - Visual Prototype Enhancement
- **Dependencies**: SP_012 (Criteria Builder Accordion Redesign)
- **Follows**: GL-TDD.md, GL-RDD.md

---

## Executive Summary

### Problem Statement
The Clarioo Visual Prototype codebase has evolved through 12 sprints and now contains significant code duplication across components. Analysis reveals:

- **100% duplicate code**: Add Vendor Form appears identically in both `VendorSelection.tsx` and `VendorTable.tsx`
- **5 identical implementations**: Loading states scattered across different components
- **3 identical patterns**: Empty state displays with same structure
- **4 identical structures**: Statistics/summary cards
- **2 chat implementations**: One fully functional, one placeholder awaiting connection

This duplication violates DRY principles, increases maintenance burden, makes UI consistency harder to maintain, and increases bundle size unnecessarily.

### Sprint Goals
1. **Extract duplicate code** into reusable shared components
2. **Create base chat architecture** with specialized wrappers for different contexts
3. **Implement hybrid organization** approach (/components/shared/ + existing structure)
4. **Follow TDD principles**: Write failing tests first for all extracted components
5. **Maintain backward compatibility**: Update all component usages
6. **Improve code maintainability**: Single source of truth for common patterns

### Approach
Three-phase implementation prioritizing high-ROI quick wins:

**Phase 1: Quick Wins (Days 1-2)**
- LoadingState component (5 usages)
- EmptyState component (3 usages)
- StatsCard component (4 usages)
- AddVendorForm component (2 identical implementations)

**Phase 2: Chat Consolidation (Days 3-4)**
- Base chat components (ChatInterface, ChatMessage, ChatInput, TypingIndicator)
- useChat base hook
- useCriterionChat specialized hook
- Connect CriterionEditSidebar chat to AI service

**Phase 3: Form Standardization (Days 5-6)**
- FormDialog component
- FormFieldGroup component
- Validation pattern standardization

**Phase 4: Testing & Documentation (Day 7)**
- Comprehensive test coverage (target 85%+)
- Documentation updates (FEATURE_LIST.md, USER_STORIES.md)
- README files for all shared components

### Expected Outcomes
- **Reduce code duplication by ~800-1000 lines**
- **Improve bundle size** by eliminating redundant code
- **Establish patterns** for future component development
- **Increase test coverage** to 85%+ for new shared components
- **Enable faster feature development** through reusable components
- **Improve UI consistency** through single source of truth

---

## Problem Analysis

### 1. Duplicate Add Vendor Form (100% Identical)

**Location 1**: `src/components/vendor-discovery/VendorSelection.tsx` (lines 225-298)
```typescript
const [showAddVendor, setShowAddVendor] = useState(false);
const [newVendorName, setNewVendorName] = useState("");
const [newVendorWebsite, setNewVendorWebsite] = useState("");

<Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Add Custom Vendor</DialogTitle>
      <DialogDescription>
        Add a vendor that's not in our database
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="vendor-name">Vendor Name</Label>
        <Input
          id="vendor-name"
          value={newVendorName}
          onChange={(e) => setNewVendorName(e.target.value)}
          placeholder="e.g., CustomCRM Inc."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vendor-website">Website</Label>
        <Input
          id="vendor-website"
          value={newVendorWebsite}
          onChange={(e) => setNewVendorWebsite(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowAddVendor(false)}>
        Cancel
      </Button>
      <Button onClick={handleAddCustomVendor}>Add Vendor</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Location 2**: `src/components/vendor-discovery/VendorTable.tsx` (lines 402-459)
- **Identical code** with same structure, same field names, same layout
- Only difference: `handleAddVendor` vs `handleAddCustomVendor` function name

**Impact**: 73 lines × 2 = 146 lines of duplicate code

---

### 2. Loading State Pattern (5 Implementations)

**Pattern appears in**:
1. `ProjectDashboard.tsx` (lines 170-177)
2. `VendorSelection.tsx` (lines 174-190)
3. `VendorTable.tsx` (lines 275-289)
4. `ExecutiveSummary.tsx` (lines 62-78)
5. `CriteriaBuilder.tsx` (lines 551-566)

**Example from VendorSelection.tsx**:
```typescript
{isLoading && (
  <div className="flex flex-col items-center justify-center py-12">
    <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
    <p className="text-lg font-medium">Discovering Vendors...</p>
    <div className="w-full max-w-md mt-4">
      <Progress value={progress} className="h-2" />
    </div>
    <p className="text-sm text-muted-foreground mt-2">
      AI is analyzing your criteria and searching our database
    </p>
  </div>
)}
```

**Common Pattern**:
- Centered flex container
- Spinning icon (RefreshCw, Brain, etc.)
- Loading message
- Optional Progress bar
- Optional descriptive text

**Impact**: ~16 lines × 5 = ~80 lines of duplicate code

---

### 3. Empty State Pattern (3 Implementations)

**Pattern appears in**:
1. `ProjectDashboard.tsx` (lines 271-278) - No projects
2. `VendorSelection.tsx` (lines 361-365) - No vendors
3. `CriteriaBuilder.tsx` (lines 551-555, 928-933) - No criteria

**Example from ProjectDashboard.tsx**:
```typescript
{projects.length === 0 && !loading && (
  <div className="col-span-full text-center py-12">
    <p className="text-muted-foreground mb-4">
      No projects yet. Create your first project to get started! 🚀
    </p>
  </div>
)}
```

**Common Pattern**:
- Centered text container
- Muted text color
- Icon or emoji
- Helpful message

**Impact**: ~7 lines × 3 = ~21 lines of duplicate code

---

### 4. Statistics Card Pattern (4 Implementations)

**Pattern appears in**:
1. `VendorDiscovery.tsx` (lines 410-430) - Request Summary
2. `VendorTable.tsx` (lines 293-341) - Results Summary
3. `ExecutiveSummary.tsx` (lines 136-160) - Key Metrics
4. `VendorInvite.tsx` (lines 338-355) - Vendor Summary

**Example from VendorTable.tsx**:
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{filteredVendors.length}</p>
          <p className="text-sm text-muted-foreground">Total Vendors</p>
        </div>
      </div>
    </CardContent>
  </Card>
  {/* More cards... */}
</div>
```

**Common Pattern**:
- Grid layout (1-4 columns responsive)
- Card wrapper
- Icon with background circle
- Large number (text-2xl font-bold)
- Label (text-sm text-muted-foreground)

**Impact**: ~12 lines × 4 cards × 4 locations = ~192 lines

---

### 5. Chat Interface (2 Implementations, 1 Placeholder)

**Functional Implementation**: `CriteriaBuilder.tsx` (lines 516-601)
- Full chat with localStorage persistence
- AI integration via `useCriteriaChat` hook
- Keyword highlighting
- Auto-scroll behavior
- Message synthesis

**Placeholder Implementation**: `CriterionEditSidebar.tsx` (lines 260-294)
- UI only, not connected to AI
- Same visual structure
- Awaiting integration

**Opportunity**: Extract base chat components for reuse across contexts

---

## Solution Design

### Architecture Overview

#### Hybrid Organization Approach

Maintain current feature-based structure while introducing `/components/shared/` for reusable components:

```
/src/components/
  ├── shared/                    # NEW: Reusable components
  │   ├── loading/
  │   │   ├── LoadingState.tsx
  │   │   ├── LoadingState.test.tsx
  │   │   └── README.md
  │   ├── empty/
  │   │   ├── EmptyState.tsx
  │   │   ├── EmptyState.test.tsx
  │   │   └── README.md
  │   ├── stats/
  │   │   ├── StatsCard.tsx
  │   │   ├── StatsCard.test.tsx
  │   │   └── README.md
  │   ├── chat/
  │   │   ├── ChatInterface.tsx
  │   │   ├── ChatMessage.tsx
  │   │   ├── ChatInput.tsx
  │   │   ├── TypingIndicator.tsx
  │   │   ├── chat.test.tsx
  │   │   └── README.md
  │   ├── forms/
  │   │   ├── FormDialog.tsx
  │   │   ├── AddVendorForm.tsx
  │   │   ├── FormFieldGroup.tsx
  │   │   ├── forms.test.tsx
  │   │   └── README.md
  │   └── README.md
  ├── landing/                   # EXISTING: Feature-specific
  ├── vendor-discovery/          # EXISTING: Feature-specific
  └── ui/                        # EXISTING: shadcn/ui components
```

#### Component Extraction Principles

1. **Single Responsibility**: Each component does one thing well
2. **Composition Over Configuration**: Accept children/render props
3. **Prop Flexibility**: Sensible defaults, easy customization
4. **Type Safety**: Full TypeScript interfaces
5. **Accessibility**: ARIA attributes, keyboard navigation
6. **Testing**: 85%+ coverage for all shared components

---

## Implementation Phases

### Phase 1: Quick Wins (Days 1-2)

#### 1.1 LoadingState Component

**File**: `/src/components/shared/loading/LoadingState.tsx`

**Test File**: `/src/components/shared/loading/LoadingState.test.tsx`

**Interface**:
```typescript
export interface LoadingStateProps {
  /** Message to display while loading */
  message?: string;
  /** Secondary descriptive text */
  description?: string;
  /** Icon to display (defaults to RefreshCw) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Show progress bar */
  showProgress?: boolean;
  /** Progress value (0-100) */
  progress?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className for container */
  className?: string;
}
```

**Component Implementation**:
```typescript
import { RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function LoadingState({
  message = 'Loading...',
  description,
  icon: Icon = RefreshCw,
  showProgress = false,
  progress = 0,
  size = 'md',
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-12',
    lg: 'py-16',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      <Icon
        className={cn(
          iconSizes[size],
          'text-primary animate-spin mb-4'
        )}
        aria-hidden="true"
      />
      <p className={cn(textSizes[size], 'font-medium')}>{message}</p>
      {showProgress && (
        <div className="w-full max-w-md mt-4">
          <Progress value={progress} className="h-2" aria-label="Loading progress" />
        </div>
      )}
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
          {description}
        </p>
      )}
    </div>
  );
}
```

**TDD Test Cases** (write FIRST):
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';
import { Brain } from 'lucide-react';

describe('LoadingState', () => {
  it('renders with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingState message="Discovering Vendors..." />);
    expect(screen.getByText('Discovering Vendors...')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <LoadingState
        message="Loading"
        description="AI is analyzing your criteria"
      />
    );
    expect(screen.getByText('AI is analyzing your criteria')).toBeInTheDocument();
  });

  it('shows progress bar when showProgress is true', () => {
    render(<LoadingState showProgress progress={50} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('does not show progress bar by default', () => {
    render(<LoadingState />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders custom icon', () => {
    const { container } = render(<LoadingState icon={Brain} />);
    // Brain icon should be rendered instead of default RefreshCw
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies size variants correctly', () => {
    const { rerender, container } = render(<LoadingState size="sm" />);
    expect(container.firstChild).toHaveClass('py-6');

    rerender(<LoadingState size="lg" />);
    expect(container.firstChild).toHaveClass('py-16');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingState className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has spinning animation on icon', () => {
    const { container } = render(<LoadingState />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });
});
```

**Migration**: Update 5 files:
1. `src/components/ProjectDashboard.tsx` (line 170-177)
2. `src/components/vendor-discovery/VendorSelection.tsx` (lines 174-190)
3. `src/components/vendor-discovery/VendorTable.tsx` (lines 275-289)
4. `src/components/vendor-discovery/ExecutiveSummary.tsx` (lines 62-78)
5. `src/components/vendor-discovery/CriteriaBuilder.tsx` (lines 551-566)

**Example Migration** (VendorSelection.tsx):
```typescript
// BEFORE
{isLoading && (
  <div className="flex flex-col items-center justify-center py-12">
    <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
    <p className="text-lg font-medium">Discovering Vendors...</p>
    <div className="w-full max-w-md mt-4">
      <Progress value={progress} className="h-2" />
    </div>
    <p className="text-sm text-muted-foreground mt-2">
      AI is analyzing your criteria and searching our database
    </p>
  </div>
)}

// AFTER
import { LoadingState } from '@/components/shared/loading/LoadingState';

{isLoading && (
  <LoadingState
    message="Discovering Vendors..."
    description="AI is analyzing your criteria and searching our database"
    showProgress
    progress={progress}
  />
)}
```

---

#### 1.2 EmptyState Component

**File**: `/src/components/shared/empty/EmptyState.tsx`

**Interface**:
```typescript
export interface EmptyStateProps {
  /** Title or main message */
  title?: string;
  /** Optional description */
  description?: string;
  /** Icon or emoji to display */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  /** Custom className */
  className?: string;
}
```

**Component Implementation**:
```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  title = 'No items found',
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12',
        className
      )}
    >
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

**TDD Test Cases**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders with default title', () => {
    render(<EmptyState />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(
      <EmptyState
        title="No projects yet"
        description="Create your first project to get started!"
      />
    );
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started!')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<EmptyState icon="🚀" title="Empty" />);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );

    const button = screen.getByRole('button', { name: 'Add Item' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState className="custom-empty" />);
    expect(container.firstChild).toHaveClass('custom-empty');
  });

  it('uses custom button variant', () => {
    render(
      <EmptyState
        action={{ label: 'Click', onClick: vi.fn(), variant: 'outline' }}
      />
    );
    // Check button has outline variant class
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });
});
```

**Migration**: Update 3 files:
1. `src/components/ProjectDashboard.tsx`
2. `src/components/vendor-discovery/VendorSelection.tsx`
3. `src/components/vendor-discovery/CriteriaBuilder.tsx`

---

#### 1.3 StatsCard Component

**File**: `/src/components/shared/stats/StatsCard.tsx`

**Interface**:
```typescript
import { LucideIcon } from 'lucide-react';

export interface StatsCardProps {
  /** Main statistic value */
  value: string | number;
  /** Label for the statistic */
  label: string;
  /** Icon to display */
  icon: LucideIcon;
  /** Icon color theme */
  iconColor?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
  /** Optional trend indicator */
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Custom className */
  className?: string;
}

export interface StatsCardGridProps {
  /** Array of stats to display */
  stats: StatsCardProps[];
  /** Grid columns (responsive) */
  columns?: {
    mobile?: 1 | 2;
    tablet?: 2 | 3;
    desktop?: 3 | 4;
  };
  /** Custom className for grid */
  className?: string;
}
```

**Component Implementation**:
```typescript
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StatsCardProps, StatsCardGridProps } from './StatsCard';

const iconColorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  destructive: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  muted: 'bg-muted text-muted-foreground',
};

export function StatsCard({
  value,
  label,
  icon: Icon,
  iconColor = 'primary',
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-lg', iconColorClasses[iconColor])}>
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {trend && (
              <p
                className={cn(
                  'text-xs mt-1',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardGrid({
  stats,
  columns = { mobile: 1, tablet: 2, desktop: 4 },
  className,
}: StatsCardGridProps) {
  const gridClasses = cn(
    'grid gap-4',
    columns.mobile === 2 && 'grid-cols-2',
    columns.tablet === 2 && 'sm:grid-cols-2',
    columns.tablet === 3 && 'sm:grid-cols-3',
    columns.desktop === 3 && 'lg:grid-cols-3',
    columns.desktop === 4 && 'lg:grid-cols-4',
    className
  );

  return (
    <div className={gridClasses}>
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
}
```

**TDD Test Cases**:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard, StatsCardGrid } from './StatsCard';
import { Building2, Users, TrendingUp, CheckCircle } from 'lucide-react';

describe('StatsCard', () => {
  it('renders value and label', () => {
    render(
      <StatsCard value={42} label="Total Vendors" icon={Building2} />
    );
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Vendors')).toBeInTheDocument();
  });

  it('renders string values', () => {
    render(<StatsCard value="$1,234" label="Revenue" icon={TrendingUp} />);
    expect(screen.getByText('$1,234')).toBeInTheDocument();
  });

  it('applies icon color variants', () => {
    const { container } = render(
      <StatsCard
        value={100}
        label="Success"
        icon={CheckCircle}
        iconColor="success"
      />
    );
    const iconWrapper = container.querySelector('.bg-green-100');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('renders positive trend', () => {
    render(
      <StatsCard
        value={100}
        label="Growth"
        icon={TrendingUp}
        trend={{ value: 12.5, isPositive: true }}
      />
    );
    expect(screen.getByText(/↑ 12.5%/)).toBeInTheDocument();
  });

  it('renders negative trend', () => {
    render(
      <StatsCard
        value={50}
        label="Decline"
        icon={TrendingUp}
        trend={{ value: -8.3, isPositive: false }}
      />
    );
    expect(screen.getByText(/↓ 8.3%/)).toBeInTheDocument();
  });
});

describe('StatsCardGrid', () => {
  const mockStats = [
    { value: 42, label: 'Vendors', icon: Building2 },
    { value: 128, label: 'Users', icon: Users },
  ];

  it('renders multiple stats in grid', () => {
    render(<StatsCardGrid stats={mockStats} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('applies responsive grid columns', () => {
    const { container } = render(
      <StatsCardGrid
        stats={mockStats}
        columns={{ mobile: 1, tablet: 2, desktop: 4 }}
      />
    );
    const grid = container.firstChild;
    expect(grid).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-4');
  });
});
```

**Migration**: Update 4 files with grid layout examples

---

#### 1.4 AddVendorForm Component

**File**: `/src/components/shared/forms/AddVendorForm.tsx`

**Interface**:
```typescript
export interface AddVendorFormData {
  name: string;
  website: string;
  description?: string;
}

export interface AddVendorFormProps {
  /** Called when form is submitted */
  onSubmit: (data: AddVendorFormData) => void | Promise<void>;
  /** Called when form is cancelled */
  onCancel: () => void;
  /** Loading state during submission */
  isLoading?: boolean;
  /** Initial form values */
  initialValues?: Partial<AddVendorFormData>;
}
```

**Component** (uses react-hook-form + zod):
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const addVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(100),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().max(500).optional(),
});

export function AddVendorForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialValues,
}: AddVendorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddVendorFormData>({
    resolver: zodResolver(addVendorSchema),
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vendor-name">
          Vendor Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="vendor-name"
          {...register('name')}
          placeholder="e.g., CustomCRM Inc."
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor-website">Website</Label>
        <Input
          id="vendor-website"
          type="url"
          {...register('website')}
          placeholder="https://example.com"
          disabled={isLoading}
        />
        {errors.website && (
          <p className="text-sm text-destructive">{errors.website.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor-description">Description (Optional)</Label>
        <Textarea
          id="vendor-description"
          {...register('description')}
          placeholder="Brief description of the vendor..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Vendor'}
        </Button>
      </div>
    </form>
  );
}
```

**TDD Test Cases**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddVendorForm } from './AddVendorForm';

describe('AddVendorForm', () => {
  it('renders all form fields', () => {
    render(<AddVendorForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/vendor name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('validates required vendor name', async () => {
    render(<AddVendorForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /add vendor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/vendor name is required/i)).toBeInTheDocument();
    });
  });

  it('validates URL format for website', async () => {
    const user = userEvent.setup();
    render(<AddVendorForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const nameInput = screen.getByLabelText(/vendor name/i);
    const websiteInput = screen.getByLabelText(/website/i);

    await user.type(nameInput, 'Test Vendor');
    await user.type(websiteInput, 'not-a-url');

    const submitButton = screen.getByRole('button', { name: /add vendor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be a valid url/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<AddVendorForm onSubmit={handleSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/vendor name/i), 'Test Vendor');
    await user.type(screen.getByLabelText(/website/i), 'https://example.com');

    fireEvent.click(screen.getByRole('button', { name: /add vendor/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Vendor',
          website: 'https://example.com',
        })
      );
    });
  });

  it('calls onCancel when cancel button clicked', () => {
    const handleCancel = vi.fn();
    render(<AddVendorForm onSubmit={vi.fn()} onCancel={handleCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('disables form during loading', () => {
    render(
      <AddVendorForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading />
    );

    expect(screen.getByLabelText(/vendor name/i)).toBeDisabled();
    expect(screen.getByLabelText(/website/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
  });

  it('populates form with initial values', () => {
    render(
      <AddVendorForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialValues={{
          name: 'Existing Vendor',
          website: 'https://existing.com',
        }}
      />
    );

    expect(screen.getByLabelText(/vendor name/i)).toHaveValue('Existing Vendor');
    expect(screen.getByLabelText(/website/i)).toHaveValue('https://existing.com');
  });
});
```

**Migration**: Update 2 files (VendorSelection.tsx, VendorTable.tsx)

---

### Phase 2: Chat Consolidation (Days 3-4)

#### 2.1 Base Chat Architecture

**Folder Structure**:
```
/src/components/shared/chat/
  ├── ChatInterface.tsx       # Main container component
  ├── ChatMessage.tsx         # Individual message bubble
  ├── ChatInput.tsx           # Input field with send button
  ├── TypingIndicator.tsx     # Animated typing dots
  ├── types.ts                # Shared types
  ├── chat.test.tsx           # Component tests
  └── README.md               # Documentation
```

**Shared Types** (`types.ts`):
```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatInterfaceProps {
  /** Array of messages to display */
  messages: ChatMessage[];
  /** Current input value */
  input: string;
  /** Called when input changes */
  onInputChange: (value: string) => void;
  /** Called when message is sent */
  onSend: (message: string) => void;
  /** Loading/generating state */
  isGenerating?: boolean;
  /** Placeholder text for input */
  placeholder?: string;
  /** Custom message renderer */
  renderMessage?: (message: ChatMessage) => React.ReactNode;
  /** Auto-scroll to latest message */
  autoScroll?: boolean;
  /** Custom className for container */
  className?: string;
  /** Height constraint */
  maxHeight?: string;
}

export interface ChatMessageProps {
  message: ChatMessage;
  /** Custom renderer for message content */
  renderContent?: (content: string) => React.ReactNode;
  /** Show timestamp */
  showTimestamp?: boolean;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isDisabled?: boolean;
  placeholder?: string;
}
```

#### 2.2 ChatMessage Component

**File**: `/src/components/shared/chat/ChatMessage.tsx`

```typescript
import { User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ChatMessageProps } from './types';

export function ChatMessage({
  message,
  renderContent,
  showTimestamp = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-muted-foreground italic">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 py-2', isUser && 'flex-row-reverse')}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={cn(isUser ? 'bg-primary' : 'bg-blue-500')}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {renderContent ? renderContent(message.content) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {showTimestamp && (
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
```

#### 2.3 ChatInput Component

**File**: `/src/components/shared/chat/ChatInput.tsx`

```typescript
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ChatInputProps } from './types';

export function ChatInput({
  value,
  onChange,
  onSend,
  isDisabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isDisabled) {
        onSend();
      }
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={1}
        className="min-h-[40px] max-h-[120px] resize-none"
      />
      <Button
        onClick={onSend}
        disabled={!value.trim() || isDisabled}
        size="icon"
        className="flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

#### 2.4 TypingIndicator Component

**File**: `/src/components/shared/chat/TypingIndicator.tsx`

```typescript
import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 py-2">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-blue-500">
          <Bot className="w-4 h-4 text-white" />
        </AvatarFallback>
      </Avatar>

      <div className="bg-muted rounded-lg px-4 py-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
```

#### 2.5 ChatInterface Component

**File**: `/src/components/shared/chat/ChatInterface.tsx`

```typescript
import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import type { ChatInterfaceProps } from './types';

export function ChatInterface({
  messages,
  input,
  onInputChange,
  onSend,
  isGenerating = false,
  placeholder = 'Type your message...',
  renderMessage,
  autoScroll = true,
  className,
  maxHeight = 'max-h-96',
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, autoScroll]);

  const handleSend = () => {
    if (input.trim() && !isGenerating) {
      onSend(input);
    }
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <ScrollArea className={cn('flex-1 p-4', maxHeight)}>
        <div className="space-y-2">
          {messages.map((message) =>
            renderMessage ? (
              <div key={message.id}>{renderMessage(message)}</div>
            ) : (
              <ChatMessage key={message.id} message={message} />
            )
          )}
          {isGenerating && <TypingIndicator />}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSend={handleSend}
          isDisabled={isGenerating}
          placeholder={placeholder}
        />
      </div>
    </Card>
  );
}
```

#### 2.6 TDD Tests for Chat Components

**File**: `/src/components/shared/chat/chat.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from './ChatInterface';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage as ChatMessageType } from './types';

describe('ChatMessage', () => {
  const userMessage: ChatMessageType = {
    id: '1',
    role: 'user',
    content: 'Hello!',
    timestamp: new Date('2024-11-15T10:00:00'),
  };

  const assistantMessage: ChatMessageType = {
    id: '2',
    role: 'assistant',
    content: 'Hi there! How can I help?',
    timestamp: new Date('2024-11-15T10:01:00'),
  };

  it('renders user message with correct styling', () => {
    const { container } = render(<ChatMessage message={userMessage} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();

    // User messages should have primary background
    const messageContent = screen.getByText('Hello!').closest('div');
    expect(messageContent).toHaveClass('bg-primary');
  });

  it('renders assistant message with correct styling', () => {
    const { container } = render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText('Hi there! How can I help?')).toBeInTheDocument();

    // Assistant messages should have muted background
    const messageContent = screen.getByText('Hi there! How can I help?').closest('div');
    expect(messageContent).toHaveClass('bg-muted');
  });

  it('shows timestamp when showTimestamp is true', () => {
    render(<ChatMessage message={userMessage} showTimestamp />);
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it('does not show timestamp by default', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.queryByText(/10:00/)).not.toBeInTheDocument();
  });

  it('uses custom content renderer when provided', () => {
    const renderContent = (content: string) => <strong>{content.toUpperCase()}</strong>;
    render(<ChatMessage message={userMessage} renderContent={renderContent} />);

    expect(screen.getByText('HELLO!')).toBeInTheDocument();
    expect(screen.getByText('HELLO!').tagName).toBe('STRONG');
  });
});

describe('ChatInput', () => {
  it('renders textarea and send button', () => {
    render(
      <ChatInput
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ChatInput value="" onChange={handleChange} onSend={vi.fn()} />
    );

    await user.type(screen.getByRole('textbox'), 'Hello');
    expect(handleChange).toHaveBeenCalledTimes(5); // One per character
  });

  it('calls onSend when send button clicked', () => {
    const handleSend = vi.fn();
    render(
      <ChatInput value="Test message" onChange={vi.fn()} onSend={handleSend} />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleSend).toHaveBeenCalledTimes(1);
  });

  it('calls onSend when Enter pressed (without Shift)', () => {
    const handleSend = vi.fn();
    render(
      <ChatInput value="Test" onChange={vi.fn()} onSend={handleSend} />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(handleSend).toHaveBeenCalledTimes(1);
  });

  it('does not call onSend when Shift+Enter pressed', () => {
    const handleSend = vi.fn();
    render(
      <ChatInput value="Test" onChange={vi.fn()} onSend={handleSend} />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('disables send button when value is empty', () => {
    render(<ChatInput value="" onChange={vi.fn()} onSend={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables send button when value is whitespace', () => {
    render(<ChatInput value="   " onChange={vi.fn()} onSend={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables input when isDisabled is true', () => {
    render(
      <ChatInput
        value="Test"
        onChange={vi.fn()}
        onSend={vi.fn()}
        isDisabled
      />
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('TypingIndicator', () => {
  it('renders typing animation', () => {
    const { container } = render(<TypingIndicator />);

    // Should have 3 animated dots
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('renders bot avatar', () => {
    render(<TypingIndicator />);
    // Bot icon should be present
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

describe('ChatInterface', () => {
  const mockMessages: ChatMessageType[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi!',
      timestamp: new Date(),
    },
  ];

  it('renders all messages', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        input=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi!')).toBeInTheDocument();
  });

  it('shows typing indicator when isGenerating is true', () => {
    const { container } = render(
      <ChatInterface
        messages={mockMessages}
        input=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        isGenerating
      />
    );

    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('does not show typing indicator when isGenerating is false', () => {
    const { container } = render(
      <ChatInterface
        messages={mockMessages}
        input=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        isGenerating={false}
      />
    );

    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(0);
  });

  it('calls onSend with input value when send clicked', () => {
    const handleSend = vi.fn();
    render(
      <ChatInterface
        messages={[]}
        input="Test message"
        onInputChange={vi.fn()}
        onSend={handleSend}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleSend).toHaveBeenCalledWith('Test message');
  });

  it('does not call onSend when input is empty', () => {
    const handleSend = vi.fn();
    render(
      <ChatInterface
        messages={[]}
        input=""
        onInputChange={vi.fn()}
        onSend={handleSend}
      />
    );

    // Button should be disabled
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('uses custom message renderer when provided', () => {
    const renderMessage = (msg: ChatMessageType) => (
      <div data-testid="custom-message">{msg.content}</div>
    );

    render(
      <ChatInterface
        messages={mockMessages}
        input=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        renderMessage={renderMessage}
      />
    );

    expect(screen.getAllByTestId('custom-message')).toHaveLength(2);
  });
});
```

#### 2.7 useChat Base Hook

**File**: `/src/hooks/useChat.ts`

```typescript
import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/components/shared/chat/types';

export interface UseChatOptions {
  /** Initial messages */
  initialMessages?: ChatMessage[];
  /** Function to send message to AI service */
  onSendMessage?: (
    messages: ChatMessage[],
    userMessage: string
  ) => Promise<string>;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  isGenerating: boolean;
  setInput: (value: string) => void;
  sendMessage: (message: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export function useChat({
  initialMessages = [],
  onSendMessage,
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isGenerating) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      if (onSendMessage) {
        setIsGenerating(true);
        try {
          const response = await onSendMessage(messages, message);

          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
          console.error('Error sending message:', error);

          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, errorMessage]);
        } finally {
          setIsGenerating(false);
        }
      }
    },
    [messages, isGenerating, onSendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  return {
    messages,
    input,
    isGenerating,
    setInput,
    sendMessage,
    addMessage,
    clearMessages,
  };
}
```

#### 2.8 useCriterionChat Hook (Specialized)

**File**: `/src/hooks/useCriterionChat.ts`

```typescript
import { useEffect } from 'react';
import { useChat } from './useChat';
import { aiService } from '@/services/mock/aiService';
import type { Criteria } from '@/types/criteria.types';
import type { ChatMessage } from '@/components/shared/chat/types';

export interface UseCriterionChatOptions {
  /** Criterion being edited */
  criterion: Criteria | null;
  /** Category context */
  category?: string;
  /** All criteria for context */
  allCriteria?: Criteria[];
}

export function useCriterionChat({
  criterion,
  category,
  allCriteria = [],
}: UseCriterionChatOptions) {
  const chat = useChat({
    onSendMessage: async (messages, userMessage) => {
      // Prepare context for AI
      const context = {
        category,
        criteria: allCriteria,
        currentCriterion: criterion,
      };

      // Call AI service with context
      const { data, error } = await aiService.chat(
        [
          {
            role: 'system',
            content: `You are helping refine evaluation criteria for ${category || 'a software category'}.
The user is editing: "${criterion?.name || 'a criterion'}".
Provide concise, actionable suggestions.`,
          },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user',
            content: userMessage,
          },
        ],
        context
      );

      if (error) throw error;
      return data || 'Sorry, I could not generate a response.';
    },
  });

  // Initialize with greeting when criterion changes
  useEffect(() => {
    if (criterion && chat.messages.length === 0) {
      const greeting: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hi! I can help you refine "${criterion.name}". What would you like to adjust?`,
        timestamp: new Date(),
      };
      chat.addMessage(greeting);
    }
  }, [criterion?.id]);

  return chat;
}
```

#### 2.9 Connect CriterionEditSidebar Chat

**Migration**: Update `src/components/vendor-discovery/CriterionEditSidebar.tsx`

Replace lines 260-294 (placeholder chat tab) with:

```typescript
import { ChatInterface } from '@/components/shared/chat/ChatInterface';
import { useCriterionChat } from '@/hooks/useCriterionChat';

// Inside component:
const chat = useCriterionChat({
  criterion: editedCriterion,
  category: defaultCategory,
  allCriteria: [], // Pass all criteria if available
});

// In the Chat tab render:
<TabsContent value="chat" className="flex-1 overflow-hidden p-0">
  <ChatInterface
    messages={chat.messages}
    input={chat.input}
    onInputChange={chat.setInput}
    onSend={chat.sendMessage}
    isGenerating={chat.isGenerating}
    placeholder="Ask me to refine this criterion..."
    maxHeight="calc(100vh - 300px)"
  />
</TabsContent>
```

---

### Phase 3: Form Standardization (Days 5-6)

#### 3.1 FormDialog Component

**File**: `/src/components/shared/forms/FormDialog.tsx`

**Interface**:
```typescript
export interface FormDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Called when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional description */
  description?: string;
  /** Form content */
  children: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Custom width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}
```

**Implementation**:
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const widthClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  isLoading = false,
  maxWidth = 'md',
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(widthClasses[maxWidth])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

#### 3.2 FormFieldGroup Component

**File**: `/src/components/shared/forms/FormFieldGroup.tsx`

```typescript
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormFieldGroupProps {
  /** Field label */
  label: string;
  /** Field ID (for accessibility) */
  htmlFor: string;
  /** Whether field is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Form field (Input, Textarea, etc.) */
  children: React.ReactNode;
  /** Optional description/hint */
  description?: string;
  /** Custom className */
  className?: string;
}

export function FormFieldGroup({
  label,
  htmlFor,
  required = false,
  error,
  children,
  description,
  className,
}: FormFieldGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

**TDD Tests**:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormFieldGroup } from './FormFieldGroup';
import { Input } from '@/components/ui/input';

describe('FormFieldGroup', () => {
  it('renders label and children', () => {
    render(
      <FormFieldGroup label="Name" htmlFor="name">
        <Input id="name" />
      </FormFieldGroup>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows required indicator when required is true', () => {
    render(
      <FormFieldGroup label="Email" htmlFor="email" required>
        <Input id="email" />
      </FormFieldGroup>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <FormFieldGroup label="Email" htmlFor="email" error="Invalid email">
        <Input id="email" />
      </FormFieldGroup>
    );

    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('displays description when no error', () => {
    render(
      <FormFieldGroup
        label="Password"
        htmlFor="password"
        description="Min 8 characters"
      >
        <Input id="password" type="password" />
      </FormFieldGroup>
    );

    expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
  });

  it('hides description when error is present', () => {
    render(
      <FormFieldGroup
        label="Password"
        htmlFor="password"
        description="Min 8 characters"
        error="Password too short"
      >
        <Input id="password" type="password" />
      </FormFieldGroup>
    );

    expect(screen.queryByText('Min 8 characters')).not.toBeInTheDocument();
    expect(screen.getByText('Password too short')).toBeInTheDocument();
  });
});
```

---

### Phase 4: Testing & Documentation (Day 7)

#### 4.1 Integration Tests

Create integration tests that verify component interactions:

**File**: `/test/integration/shared-components.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '@/components/shared/chat/ChatInterface';
import { FormDialog } from '@/components/shared/forms/FormDialog';
import { AddVendorForm } from '@/components/shared/forms/AddVendorForm';

describe('Chat Integration', () => {
  it('sends message through complete chat flow', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    const { rerender } = render(
      <ChatInterface
        messages={[]}
        input=""
        onInputChange={vi.fn()}
        onSend={handleSend}
      />
    );

    // Type message
    await user.type(screen.getByRole('textbox'), 'Hello AI');

    // Simulate input change
    rerender(
      <ChatInterface
        messages={[]}
        input="Hello AI"
        onInputChange={vi.fn()}
        onSend={handleSend}
      />
    );

    // Click send
    await user.click(screen.getByRole('button'));

    expect(handleSend).toHaveBeenCalledWith('Hello AI');
  });
});

describe('Form Dialog Integration', () => {
  it('submits form through dialog', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <FormDialog
        open={true}
        onOpenChange={handleClose}
        title="Add Vendor"
        description="Add a new vendor"
      >
        <AddVendorForm onSubmit={handleSubmit} onCancel={handleClose} />
      </FormDialog>
    );

    // Fill form
    await user.type(screen.getByLabelText(/vendor name/i), 'Test Vendor');
    await user.type(screen.getByLabelText(/website/i), 'https://test.com');

    // Submit
    await user.click(screen.getByRole('button', { name: /add vendor/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Vendor',
          website: 'https://test.com',
        })
      );
    });
  });
});
```

#### 4.2 Component Documentation

Create README files for each shared component folder:

**File**: `/src/components/shared/README.md`

```markdown
# Shared Components

Reusable components extracted to eliminate code duplication and ensure UI consistency.

## Organization

- **loading/** - Loading state components
- **empty/** - Empty state displays
- **stats/** - Statistics cards
- **chat/** - Chat interface components
- **forms/** - Form-related components

## Usage Guidelines

### When to use shared components

1. **Component appears 3+ times** - Extract to shared/
2. **UI pattern is consistent** - Use shared component
3. **Need single source of truth** - Extract and document

### When NOT to use shared components

1. **Component is feature-specific** - Keep in feature folder
2. **Needs heavy customization** - May not benefit from sharing
3. **Used only once** - Keep in original location

## Testing

All shared components must have:
- ✅ Unit tests (85%+ coverage)
- ✅ Accessibility tests
- ✅ Integration tests where applicable

Run tests:
```bash
npm run test:shared
```

## Contributing

When adding new shared components:

1. Write failing tests first (TDD)
2. Implement component with TypeScript
3. Add README with examples
4. Update existing usages
5. Update this index
```

**File**: `/src/components/shared/chat/README.md`

```markdown
# Chat Components

Reusable chat interface components with AI integration support.

## Components

### ChatInterface

Main container component for chat UI.

```tsx
import { ChatInterface } from '@/components/shared/chat';

function MyChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  return (
    <ChatInterface
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSend={(msg) => {
        // Handle send
      }}
      isGenerating={false}
      placeholder="Type a message..."
    />
  );
}
```

### ChatMessage

Individual message bubble component.

```tsx
import { ChatMessage } from '@/components/shared/chat';

<ChatMessage
  message={{
    id: '1',
    role: 'user',
    content: 'Hello!',
    timestamp: new Date(),
  }}
  showTimestamp
/>
```

### ChatInput

Input field with send button.

```tsx
import { ChatInput } from '@/components/shared/chat';

<ChatInput
  value={input}
  onChange={setInput}
  onSend={handleSend}
  placeholder="Type..."
/>
```

### TypingIndicator

Animated typing indicator.

```tsx
import { TypingIndicator } from '@/components/shared/chat';

{isTyping && <TypingIndicator />}
```

## Hooks

### useChat

Base chat hook with message management.

```tsx
import { useChat } from '@/hooks/useChat';

const chat = useChat({
  onSendMessage: async (messages, userMessage) => {
    // Call AI service
    const response = await aiService.chat(messages);
    return response;
  },
});

// Use in component
<ChatInterface {...chat} onSend={chat.sendMessage} />
```

### useCriterionChat

Specialized hook for criterion editing context.

```tsx
import { useCriterionChat } from '@/hooks/useCriterionChat';

const chat = useCriterionChat({
  criterion: currentCriterion,
  category: 'CRM Software',
  allCriteria: criteria,
});
```

## Customization

### Custom Message Renderer

```tsx
<ChatInterface
  messages={messages}
  renderMessage={(message) => (
    <CustomMessage message={message} />
  )}
  // ... other props
/>
```

### Keyword Highlighting

```tsx
const renderContent = (content: string) => {
  // Highlight keywords
  return highlightKeywords(content, keywords);
};

<ChatMessage message={msg} renderContent={renderContent} />
```

## Testing

```bash
npm run test:chat
```

Coverage target: 85%+
```

#### 4.3 Update Documentation

**Update FEATURE_LIST.md**:

Add new entry under "UI/UX Enhancements":

```markdown
**Shared Component Library (SP_013)**
- Status: ✅ Implemented
- Location: `/src/components/shared/`
- Components:
  - LoadingState (5 usages) - `loading/LoadingState.tsx:1-80`
  - EmptyState (3 usages) - `empty/EmptyState.tsx:1-50`
  - StatsCard (4 usages) - `stats/StatsCard.tsx:1-120`
  - ChatInterface - `chat/ChatInterface.tsx:1-150`
  - ChatMessage - `chat/ChatMessage.tsx:1-80`
  - ChatInput - `chat/ChatInput.tsx:1-60`
  - TypingIndicator - `chat/TypingIndicator.tsx:1-30`
  - FormDialog - `forms/FormDialog.tsx:1-50`
  - FormFieldGroup - `forms/FormFieldGroup.tsx:1-60`
  - AddVendorForm - `forms/AddVendorForm.tsx:1-120`
- Test Coverage: 87% (target 85%+)
- Code Reduction: ~800-1000 lines
```

**Update USER_STORIES.md**:

Update Epic 9 (Developer Experience):

```markdown
### US-9.4: Component Reusability
**As a** developer
**I want** access to reusable shared components
**So that** I can build features faster with consistent UI

**Acceptance Criteria**:
- ✅ Shared components library exists at `/components/shared/`
- ✅ All components have TypeScript interfaces
- ✅ 85%+ test coverage for shared components
- ✅ README documentation for each component
- ✅ Integration tests verify component interactions

**Implementation**: ✅ Implemented (SP_013)
**Features Used**:
- F-9.4.1: LoadingState component
- F-9.4.2: EmptyState component
- F-9.4.3: StatsCard component
- F-9.4.4: Chat component library
- F-9.4.5: Form components (FormDialog, FormFieldGroup, AddVendorForm)
```

---

## Testing Strategy

### Test Coverage Requirements

Per GL-TDD.md requirements:

| Component Type | Coverage Target |
|----------------|-----------------|
| Shared Components | 85%+ lines, 80%+ branches |
| Hooks | 90%+ lines, 85%+ branches |
| Integration Tests | Key user flows |

### Test Execution Plan

**Phase 1 Tests** (Quick Wins):
```bash
# Run after implementing each component
npm run test src/components/shared/loading/LoadingState.test.tsx
npm run test src/components/shared/empty/EmptyState.test.tsx
npm run test src/components/shared/stats/StatsCard.test.tsx
npm run test src/components/shared/forms/AddVendorForm.test.tsx
```

**Phase 2 Tests** (Chat):
```bash
npm run test src/components/shared/chat/chat.test.tsx
npm run test src/hooks/useChat.test.tsx
npm run test src/hooks/useCriterionChat.test.tsx
```

**Phase 3 Tests** (Forms):
```bash
npm run test src/components/shared/forms/forms.test.tsx
```

**Phase 4 Tests** (Integration):
```bash
npm run test test/integration/shared-components.test.tsx
```

**Final Coverage Report**:
```bash
npm run test:coverage
```

### Performance Benchmarks

- **Build Time**: Should not increase (code reduction)
- **Bundle Size**: Target 5-10% reduction
- **Test Execution**: <12 minutes total suite (per GL-TDD.md)

---

## Success Criteria

### Code Metrics

- ✅ Reduce duplication by 800-1000 lines
- ✅ Achieve 85%+ test coverage for shared components
- ✅ Zero breaking changes (all migrations tested)
- ✅ Bundle size reduction of 5-10%

### Quality Metrics

- ✅ All existing tests continue to pass
- ✅ New components have 85%+ coverage
- ✅ TypeScript strict mode compliant
- ✅ No accessibility regressions
- ✅ README documentation for all shared components

### Developer Experience

- ✅ Clear import paths (`@/components/shared/*`)
- ✅ IntelliSense support for all components
- ✅ Comprehensive prop documentation
- ✅ Example usage in README files

---

## Risk Assessment

### Potential Risks

1. **Breaking Changes During Migration**
   - Mitigation: Write migration tests first, update all usages atomically
   - Rollback Plan: Keep old implementations until migration verified

2. **Test Coverage Gaps**
   - Mitigation: Follow TDD strictly, write tests first
   - Validation: Run coverage reports after each phase

3. **Performance Regression**
   - Mitigation: Bundle size analysis, measure build times
   - Validation: Performance benchmarks in CI

4. **Developer Adoption**
   - Mitigation: Clear documentation, examples, pair programming
   - Validation: Code review checklist includes shared component usage

5. **Scope Creep**
   - Mitigation: Strict phase boundaries, only extract identified duplicates
   - Validation: Sprint plan checklist

---

## Implementation Checklist

### Phase 1: Quick Wins
- [ ] Write LoadingState tests (TDD)
- [ ] Implement LoadingState component
- [ ] Migrate 5 usages
- [ ] Write EmptyState tests (TDD)
- [ ] Implement EmptyState component
- [ ] Migrate 3 usages
- [ ] Write StatsCard tests (TDD)
- [ ] Implement StatsCard component
- [ ] Migrate 4 usages
- [ ] Write AddVendorForm tests (TDD)
- [ ] Implement AddVendorForm component
- [ ] Migrate 2 usages

### Phase 2: Chat Consolidation
- [ ] Write chat component tests (TDD)
- [ ] Implement ChatMessage component
- [ ] Implement ChatInput component
- [ ] Implement TypingIndicator component
- [ ] Implement ChatInterface component
- [ ] Write useChat hook tests
- [ ] Implement useChat hook
- [ ] Write useCriterionChat tests
- [ ] Implement useCriterionChat hook
- [ ] Update CriterionEditSidebar
- [ ] Verify CriteriaBuilder still works

### Phase 3: Form Standardization
- [ ] Write FormDialog tests (TDD)
- [ ] Implement FormDialog component
- [ ] Write FormFieldGroup tests (TDD)
- [ ] Implement FormFieldGroup component
- [ ] Update existing forms

### Phase 4: Testing & Documentation
- [ ] Write integration tests
- [ ] Run full test suite
- [ ] Generate coverage report (target 85%+)
- [ ] Write shared/README.md
- [ ] Write shared/chat/README.md
- [ ] Write shared/forms/README.md
- [ ] Write shared/loading/README.md
- [ ] Write shared/empty/README.md
- [ ] Write shared/stats/README.md
- [ ] Update FEATURE_LIST.md
- [ ] Update USER_STORIES.md
- [ ] Update PROGRESS.md
- [ ] Update PROJECT_ROADMAP.md

---

## Definition of Done

Sprint SP_013 is complete when:

1. ✅ All 10 shared components implemented and tested
2. ✅ All migrations completed (18 total file updates)
3. ✅ Test coverage ≥85% for shared components
4. ✅ All existing tests passing (81 tests + new tests)
5. ✅ Bundle size reduced by 5-10%
6. ✅ README documentation for all shared folders
7. ✅ FEATURE_LIST.md updated
8. ✅ USER_STORIES.md updated
9. ✅ PROGRESS.md updated
10. ✅ PROJECT_ROADMAP.md updated
11. ✅ No accessibility regressions
12. ✅ No TypeScript errors
13. ✅ Code review completed
14. ✅ Changes tested locally (NOT committed to GitHub)

---

## Post-Sprint Actions

After sprint completion:

1. **Demo to stakeholders**
   - Show before/after code examples
   - Demonstrate component reusability
   - Highlight developer experience improvements

2. **Performance Analysis**
   - Compare bundle sizes
   - Measure build times
   - Document improvements

3. **Team Knowledge Share**
   - Document learnings
   - Share component patterns
   - Update development guidelines

4. **Plan Next Sprint**
   - Identify additional extraction opportunities
   - Consider advanced patterns (compound components, render props)
   - Plan visual design system enhancements

---

## Appendix: File Migration Map

### Files to Create (New)

```
src/components/shared/
  loading/
    ├── LoadingState.tsx
    ├── LoadingState.test.tsx
    └── README.md
  empty/
    ├── EmptyState.tsx
    ├── EmptyState.test.tsx
    └── README.md
  stats/
    ├── StatsCard.tsx
    ├── StatsCard.test.tsx
    └── README.md
  chat/
    ├── ChatInterface.tsx
    ├── ChatMessage.tsx
    ├── ChatInput.tsx
    ├── TypingIndicator.tsx
    ├── types.ts
    ├── chat.test.tsx
    └── README.md
  forms/
    ├── FormDialog.tsx
    ├── FormFieldGroup.tsx
    ├── AddVendorForm.tsx
    ├── forms.test.tsx
    └── README.md
  └── README.md

src/hooks/
  ├── useChat.ts (new)
  ├── useChat.test.ts (new)
  ├── useCriterionChat.ts (new)
  └── useCriterionChat.test.ts (new)

test/integration/
  └── shared-components.test.tsx (new)
```

### Files to Update (Migrations)

**Phase 1 Migrations**:
1. src/components/ProjectDashboard.tsx (LoadingState, EmptyState)
2. src/components/vendor-discovery/VendorSelection.tsx (LoadingState, EmptyState, AddVendorForm)
3. src/components/vendor-discovery/VendorTable.tsx (LoadingState, StatsCard, AddVendorForm)
4. src/components/vendor-discovery/ExecutiveSummary.tsx (LoadingState, StatsCard)
5. src/components/vendor-discovery/CriteriaBuilder.tsx (LoadingState, EmptyState)
6. src/components/VendorDiscovery.tsx (StatsCard)
7. src/components/vendor-discovery/VendorInvite.tsx (StatsCard)

**Phase 2 Migrations**:
8. src/components/vendor-discovery/CriterionEditSidebar.tsx (Chat components)

**Documentation Updates**:
9. 00_PLAN/FEATURE_LIST.md
10. 00_PLAN/USER_STORIES.md
11. 00_IMPLEMENTATION/PROGRESS.md
12. 00_IMPLEMENTATION/PROJECT_ROADMAP.md

**Total**: 10 new component folders + 12 file updates = 22 files touched

---

## Timeline Estimate

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| Phase 1 | Quick Wins (4 components) | 2 days | None |
| Phase 2 | Chat (7 components + 2 hooks) | 2 days | Phase 1 |
| Phase 3 | Forms (2 components) | 1 day | Phase 1 |
| Phase 4 | Testing & Docs | 1-2 days | Phase 1-3 |
| **Total** | **13 components + docs** | **5-7 days** | - |

---

**End of Sprint Plan SP_013**
