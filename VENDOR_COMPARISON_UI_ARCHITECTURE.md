# Vendor Comparison UI Architecture

## Overview

The vendor comparison view is built with a modular component architecture that handles both mobile and desktop layouts. The visual design is split across specialized components located in `src/components/vendor-comparison/`.

---

## Main Component Structure

### **VendorComparisonNew.tsx** (Root Orchestrator)

**Location:** `src/components/VendorComparisonNew.tsx`
**Lines:** 863-1012 (JSX return section)

**Responsibilities:**
- Orchestrates the overall comparison layout
- Handles responsive breakpoints (mobile < 1024px, desktop ≥ 1024px)
- Manages state for vendor navigation, shortlisting, and data loading
- Integrates all sub-components

---

## Visual Components

### 1. **VendorCard.tsx** (17.4 KB)

**Location:** `src/components/vendor-comparison/VendorCard.tsx`

**Purpose:** Displays individual vendor information cards

**Features:**
- Vendor logo (via Clearbit Logo API: `https://logo.clearbit.com/${website}`)
- Company name and website link
- Killer feature highlight
- Executive summary
- Match percentage badge
- Shortlist toggle button
- Navigation controls (previous/next)
- Loading states for async data
- Retry functionality for failed vendor data

**Used In:**
- **Mobile Layout:** Lines 877-916 (stacked vertically, up to 3 cards)
- **Desktop Layout:** Not directly used (vendor info integrated into column headers)

**Key Props:**
```typescript
interface VendorCardProps {
  vendor: ComparisonVendor;
  currentIndex: number;
  totalVendors: number;
  onNavigate: (direction: 'next' | 'previous') => void;
  isShortlisted: boolean;
  onToggleShortlist: (vendorId: string) => void;
  onRetryVendor: (vendorId: string) => void;
  isLoadingSummary: boolean;
}
```

---

### 2. **VerticalBarChart.tsx** (29.6 KB) ⭐ **MAIN GRID COMPONENT**

**Location:** `src/components/vendor-comparison/VerticalBarChart.tsx`

**Purpose:** Renders the criteria × vendor comparison matrix (the core comparison grid)

**Features:**
- Criteria rows organized by category:
  - Feature
  - Technical
  - Business
  - Compliance
  - Custom
- Vendor columns (3 for mobile, 5 for desktop)
- Interactive cell states with visual indicators
- Category accordion sections (expand/collapse)
- Drag-and-drop criteria reordering (via `useCriteriaOrder` hook)
- Cell-level retry for failed comparisons
- Progressive loading states

**Cell States (Criteria × Vendor Intersections):**

| State | Icon | Color | Description |
|-------|------|-------|-------------|
| `yes` | ✓ Checkmark | Green circle | Vendor meets criterion |
| `no` | − Minus | Gray circle | Vendor doesn't meet criterion |
| `unknown` | ? Question | Gray circle | Insufficient data |
| `star` | ★ Star | Gold/yellow circle | Top performer for this criterion |
| `loading` | 🔄 Spinner | Blue | Cell is being researched |
| `pending` | ⬜ Empty | Dim/faded | Cell not yet started |
| `failed` | ⚠️ Retry | Orange/red | Research failed, retry available |

**Key Function:** `renderCriterionState()` (lines 62-68)
```typescript
const renderCriterionState = (
  state: CriterionState,
  criterionIndex: number,
  vendorIndex: number,
  comparisonStatus?: 'pending' | 'loading' | 'completed' | 'failed',
  errorCode?: string
) => {
  // Returns the appropriate icon/animation for each cell state
}
```

**Used In:**
- **Mobile:** Lines 920-934 (3 columns)
- **Desktop:** Lines 940-967 (5 columns with integrated headers)

**Key Props:**
```typescript
interface VerticalBarChartProps {
  vendors: (ComparisonVendor | null)[];
  criteria: Criterion[];
  projectId?: string;
  columnCount?: 3 | 5; // 3 for mobile, 5 for desktop
  comparisonState?: ComparisonState; // For cell-level loading status
  onScoreClick?: (vendorId, criterionId, vendorName, criterionName) => void;
  onRetryVendor?: (vendorId: string) => void;
  // Desktop-specific props
  desktopVendors?: (ComparisonVendor | null)[];
  desktopColumnIndices?: number[];
  expandedColumnIndex?: number | null;
  // ... more props
}
```

---

### 3. **DesktopColumnHeader.tsx** (14 KB)

**Location:** `src/components/vendor-comparison/DesktopColumnHeader.tsx`

**Purpose:** Column headers for desktop view (integrated into VerticalBarChart)

**Features:**
- Vendor logo and name display
- Expandable vendor details (click to expand full summary)
- Navigation arrows (previous/next vendor in that column)
- Shortlist toggle button
- "Add vendor" placeholder column
- Match percentage badge
- Loading states

**Used In:**
- **Desktop Layout Only:** Integrated into VerticalBarChart component

**Key Props:**
```typescript
interface DesktopColumnHeaderProps {
  vendor: ComparisonVendor | null;
  columnIndex: number;
  vendorIndex: number;
  totalVendors: number;
  isExpanded: boolean;
  onNavigate: (direction: 'next' | 'previous') => void;
  onToggleExpand: () => void;
  onAddVendor?: () => void;
  isShortlisted: boolean;
  onToggleShortlist: (vendorId: string) => void;
}
```

---

### 4. **ExecutiveSummaryDialog.tsx** (26.3 KB)

**Location:** `src/components/vendor-comparison/ExecutiveSummaryDialog.tsx`

**Purpose:** Modal dialog showing AI-generated executive summary of the comparison

**Features:**
- Overall comparison summary (AI-generated)
- Winner/runner-up recommendations
- Key differentiators between vendors
- Decision guidance and insights
- Loading states with progress indicators
- Regeneration button
- Error handling and retry functionality
- Cache management

**Triggered By:**
- "Generate Executive Summary" button in the comparison view

**Data Source:**
- n8n workflow: `generateExecutiveSummary()` from `src/services/n8nService.ts`
- Cached in localStorage: `executive_summary_${projectId}`

**Key Props:**
```typescript
interface ExecutiveSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: ComparisonVendor[];
  criteria: Criterion[];
  projectId: string;
  techRequest?: TechRequest;
}
```

---

### 5. **VendorComparisonGuidePopup.tsx** (10.1 KB)

**Location:** `src/components/vendor-comparison/VendorComparisonGuidePopup.tsx`

**Purpose:** Onboarding/help popup for first-time users

**Features:**
- First-time user guide
- Feature explanations
- Interactive tutorial steps
- Dismissible with "Don't show again" option
- Auto-shows on first visit

**Triggered By:**
- Automatic on first page load (if not previously dismissed)
- Manual via "Help" button

---

## Layout Structure

```
VendorComparisonNew.tsx (Root)
│
├── Mobile Layout (< 1024px)
│   ├── VendorCard (vendor 1) ← Stacked vertically
│   ├── VendorCard (vendor 2) ← Stacked vertically
│   ├── VendorCard (vendor 3) ← Stacked vertically
│   └── VerticalBarChart (3 columns)
│       └── Criteria × Vendor Grid
│           ├── Category: Feature
│           ├── Category: Technical
│           ├── Category: Business
│           ├── Category: Compliance
│           └── Category: Custom
│
└── Desktop Layout (≥ 1024px)
    └── VerticalBarChart (5 columns)
        ├── DesktopColumnHeader (column 1-5)
        │   ├── Vendor logo
        │   ├── Vendor name
        │   ├── Match percentage
        │   ├── Expand/collapse toggle
        │   └── Navigation controls
        └── Criteria × Vendor Grid
            ├── Category: Feature (accordion)
            ├── Category: Technical (accordion)
            ├── Category: Business (accordion)
            ├── Category: Compliance (accordion)
            └── Category: Custom (accordion)
```

---

## Cell Rendering (Criteria × Vendor Intersections)

The core comparison grid is rendered in **`VerticalBarChart.tsx`** using the `renderCriterionState()` function.

### Visual State Mapping

```typescript
// Located in VerticalBarChart.tsx, lines 62-150

const renderCriterionState = (state, criterionIndex, vendorIndex, comparisonStatus, errorCode) => {

  // LOADING STATE
  if (comparisonStatus === 'loading') {
    return <Loader2 className="animate-spin text-blue-500" />
  }

  // FAILED STATE
  if (comparisonStatus === 'failed') {
    return <RetryIcon color={errorCode === 'TIMEOUT' ? 'orange' : 'red'} />
  }

  // PENDING STATE
  if (comparisonStatus === 'pending') {
    return <EmptyState className="opacity-30" />
  }

  // COMPLETED STATES
  switch (state) {
    case 'yes':
      return <Check className="text-green-500 bg-green-100 rounded-full" />
    case 'no':
      return <Minus className="text-gray-400 bg-gray-100 rounded-full" />
    case 'unknown':
      return <HelpCircle className="text-gray-400 bg-gray-100 rounded-full" />
    case 'star':
      return <Star className="text-yellow-500 bg-yellow-100 rounded-full fill-yellow-500" />
  }
}
```

### Cell Interaction

Each cell is:
- **Clickable:** Opens score detail popup via `onScoreClick` handler
- **Retryable:** Failed cells show retry button via `onRetryVendor` handler
- **Animated:** Smooth transitions using Framer Motion
- **Color-coded:** Each vendor column has a unique color from `VENDOR_COLOR_PALETTE`

---

## Data Flow

```
VendorComparisonNew.tsx
    ↓
useTwoStageComparison() hook
    ↓
comparisonState (Stage 1 + Stage 2 data)
    ↓
useVendorTransformation() hook
    ↓
ComparisonVendor[] (transformed data)
    ↓
VerticalBarChart.tsx
    ↓
renderCriterionState() for each cell
    ↓
Visual cell (icon + color + interaction)
```

### Key Data Structures

**ComparisonState** (from `useTwoStageComparison` hook):
```typescript
interface ComparisonState {
  criteria: Record<string, CriterionRowState>; // criterionId -> row state
  activeWorkflows: number;
  isPaused: boolean;
  currentCriterionIndex: number;
  lastUpdated: string;
}

interface CriterionRowState {
  criterionId: string;
  stage1Complete: boolean;
  stage2Status: 'pending' | 'loading' | 'completed' | 'failed';
  cells: Record<string, CellState>; // vendorId -> cell state
}

interface CellState {
  status: 'pending' | 'loading' | 'completed' | 'failed';
  value?: 'yes' | 'no' | 'unknown' | 'star';
  evidenceUrl?: string;
  evidenceDescription?: string;
  researchNotes?: string;
  error?: string;
}
```

**ComparisonVendor** (transformed for UI):
```typescript
interface ComparisonVendor {
  id: string;
  name: string;
  logo: string; // Clearbit URL
  website: string;
  killerFeature: string;
  executiveSummary: string;
  keyFeatures: string[];
  matchPercentage: number;
  scores: Map<string, CriterionState>; // criterionId -> 'yes'|'no'|'unknown'|'star'
  scoreDetails: Record<string, CriterionScoreDetail>;
  color: string; // Vendor column color
  comparisonStatus: 'pending' | 'loading' | 'completed' | 'failed';
}
```

---

## Directory Structure

```
src/components/vendor-comparison/
├── VendorCard.tsx                    ← Vendor info cards (mobile)
├── VerticalBarChart.tsx              ← Main comparison grid ⭐
├── DesktopColumnHeader.tsx           ← Desktop column headers
├── ExecutiveSummaryDialog.tsx        ← AI summary modal
├── VendorComparisonGuidePopup.tsx    ← Help/onboarding popup
├── navigation/                       ← Navigation components
│   ├── MobileNavigation.tsx
│   └── DesktopPagination.tsx
└── wave-chart/                       ← Wave chart visualization
    ├── WaveChart.tsx
    ├── WaveChartLegend.tsx
    └── types.ts
```

---

## Key Services & Utilities

### Logo Service
- **Service:** Clearbit Logo API
- **Implementation:** `src/hooks/useVendorTransformation.ts` (lines 91, 110)
- **Usage:** `https://logo.clearbit.com/${website.replace(/^https?:\/\//, '')}`
- **Example:** `https://logo.clearbit.com/www.paloaltonetworks.com`

### Comparison Storage
- **Service:** localStorage persistence
- **Implementation:** `src/utils/comparisonStorage.ts`
- **Keys:**
  - `comparison_state_${projectId}` - Overall orchestration state
  - `stage1_results_${projectId}` - Stage 1 individual research results
  - `stage2_results_${projectId}` - Stage 2 comparative ranking results
  - `executive_summary_${projectId}` - Cached AI summary

### Vendor Transformation
- **Hook:** `useVendorTransformation()`
- **Location:** `src/hooks/useVendorTransformation.ts`
- **Purpose:** Transforms raw vendor data + comparison state → UI-ready ComparisonVendor objects
- **Includes:** Logo URL generation, match percentage calculation, score mapping

### Criteria Ordering
- **Hook:** `useCriteriaOrder()`
- **Location:** `src/hooks/useCriteriaOrder.ts`
- **Purpose:** Handles drag-and-drop reordering of criteria
- **Persistence:** localStorage per project

---

## Responsive Design

### Breakpoints

| Breakpoint | Layout | Columns | Components |
|------------|--------|---------|------------|
| < 1024px | Mobile | 3 | VendorCard (stacked) + VerticalBarChart (3 cols) |
| ≥ 1024px | Desktop | 5 | VerticalBarChart (5 cols) + DesktopColumnHeader |

### Mobile Layout (< 1024px)
- **Vendor Cards:** Stacked vertically (up to 3 visible)
- **Navigation:** Swipe/arrows to change vendors
- **Comparison Grid:** 3 columns (fixed)
- **Criteria:** Accordion categories

### Desktop Layout (≥ 1024px)
- **Column Headers:** Integrated vendor info at top of each column
- **Navigation:** Left/right arrows per column + screen pagination
- **Comparison Grid:** 5 columns (pagination for 6+ vendors)
- **Criteria:** Expanded categories with drag-to-reorder
- **Expandable Columns:** Click header to expand vendor details

---

## Animation & Transitions

**Library:** Framer Motion

**Key Animations:**
- **Cell loading:** Spinner rotation (Loader2 component)
- **Cell state changes:** Fade in/out transitions
- **Category accordion:** Smooth expand/collapse
- **Vendor navigation:** Slide transitions
- **Modal dialogs:** Scale + fade animations

**Animation Delays:**
```typescript
const baseDelay = criterionIndex * 0.05 + vendorIndex * 0.1;
// Creates cascading animation effect across the grid
```

---

## Key Files Reference

| File | Size | Purpose |
|------|------|---------|
| `VendorComparisonNew.tsx` | - | Root orchestrator |
| `VerticalBarChart.tsx` | 29.6 KB | Main comparison grid ⭐ |
| `VendorCard.tsx` | 17.4 KB | Vendor info cards |
| `DesktopColumnHeader.tsx` | 14 KB | Desktop column headers |
| `ExecutiveSummaryDialog.tsx` | 26.3 KB | AI summary modal |
| `VendorComparisonGuidePopup.tsx` | 10.1 KB | Help popup |
| `useVendorTransformation.ts` | - | Data transformation hook |
| `useTwoStageComparison.ts` | - | Comparison orchestration hook |
| `comparisonStorage.ts` | - | localStorage utilities |

---

## Summary

The **VerticalBarChart.tsx** component is the core visual element that renders the criteria × vendor comparison matrix. It handles:

✅ Cell state rendering (yes/no/unknown/star/loading/pending/failed)
✅ Category organization and accordion sections
✅ Responsive column counts (3 mobile, 5 desktop)
✅ Interactive cell clicks and retry functionality
✅ Progressive loading states
✅ Drag-and-drop criteria reordering

All vendor information, logos, and metadata flow through the transformation hooks and are displayed via **VendorCard** (mobile) or **DesktopColumnHeader** (desktop) components.
