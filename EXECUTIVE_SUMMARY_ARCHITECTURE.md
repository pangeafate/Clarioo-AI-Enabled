# Executive Summary System - Architecture Documentation

**Version:** 3.5
**Last Updated:** December 2025
**Sprint:** SP_015

---

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [State Management](#state-management)
5. [API Integration (n8n)](#api-integration-n8n)
6. [Caching Strategy](#caching-strategy)
7. [Incomplete Data Handling](#incomplete-data-handling)
8. [User Flows](#user-flows)
9. [Key Functions Reference](#key-functions-reference)
10. [Error Handling](#error-handling)
11. [UI States](#ui-states)

---

## Overview

The Executive Summary system generates AI-powered, comprehensive vendor evaluation reports based on user-defined criteria and vendor comparison data. It provides decision-makers with:

- **Key Evaluation Criteria** - High-priority factors for vendor selection
- **Vendor Recommendations** - Ranked vendor list with match scores and assessments
- **Key Differentiators** - Category leaders and competitive analysis
- **Risk Factors & Call Preparation** - Vendor-specific questions and general considerations

### Key Features

- ✅ **Auto-generation** when comparison data is complete
- ✅ **Incomplete data support** - Generate summaries even with partial comparison data
- ✅ **localStorage caching** for instant loading on revisits
- ✅ **Real-time status tracking** - Loading, complete, incomplete states
- ✅ **Regeneration capability** - Refresh summary with updated data
- ✅ **Export & sharing** - Copy, download, and share functionality
- ✅ **AI chat assistant** - Interactive Q&A about the summary

---

## Component Architecture

The Executive Summary system follows a clean **3-layer architecture**:

```
┌─────────────────────────────────────────────────────────┐
│         VendorComparisonNew (Orchestrator)              │
│  - State Management                                     │
│  - Incomplete Data Detection                            │
│  - Cache Management                                     │
│  - Vendor & Criteria Coordination                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Props & Callbacks
                   ▼
┌─────────────────────────────────────────────────────────┐
│     ExecutiveSummaryDialog (Presentation Layer)        │
│  - UI Rendering                                         │
│  - Data Transformation for Display                      │
│  - User Interactions (Copy, Chat, Regenerate)          │
│  - Auto-generation Logic                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ API Calls
                   ▼
┌─────────────────────────────────────────────────────────┐
│           n8nService (Integration Layer)                │
│  - n8n Webhook Communication                            │
│  - Request/Response Transformation                      │
│  - localStorage Caching                                 │
│  - Error Handling & Timeout Management                  │
└─────────────────────────────────────────────────────────┘
```

### Component Separation

#### **VendorComparisonNew** (`src/components/VendorComparisonNew.tsx`)

**Responsibility:** Application state orchestrator

**Key Responsibilities:**
- Manages executive summary state (`executiveSummaryData`, `isGeneratingSummary`, `summaryError`)
- Detects incomplete comparison data via `hasIncompleteData` useMemo
- Loads cached summaries from localStorage on mount
- Clears cache when vendor list changes
- Provides generation/regeneration handlers to child components

**State Variables:**
```typescript
const [isExecutiveSummaryOpen, setIsExecutiveSummaryOpen] = useState(false);
const [executiveSummaryData, setExecutiveSummaryData] = useState<ExecutiveSummaryData | null>(null);
const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
const [summaryError, setSummaryError] = useState<string | null>(null);
const [cacheChecked, setCacheChecked] = useState(false);

const hasIncompleteData = useMemo(() => {
  // Checks vendor-level and cell-level loading/pending states
}, [workflowVendors, workflowCriteria, vendorComparisonStates, comparisonState]);
```

---

#### **ExecutiveSummaryDialog** (`src/components/vendor-comparison/ExecutiveSummaryDialog.tsx`)

**Responsibility:** Presentation and user interaction

**Key Responsibilities:**
- Renders full-viewport dialog with summary sections
- Transforms `ExecutiveSummaryData` from n8n format to display format
- Handles auto-generation when data is complete
- Shows loading, incomplete data warning, or error states
- Provides copy-to-clipboard, regenerate, and AI chat features

**Props Interface:**
```typescript
interface ExecutiveSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: () => void;
  onRegenerate?: () => void;
  criteria?: Criteria[];
  projectId?: string;
  summaryData?: ExecutiveSummaryData | null;
  isLoading?: boolean;
  error?: string | null;
  onGenerate?: () => void;
  cacheChecked?: boolean;
  hasIncompleteData?: boolean; // ⭐ Incomplete data detection flag
}
```

---

#### **n8nService** (`src/services/n8nService.ts`)

**Responsibility:** n8n webhook integration and caching

**Key Responsibilities:**
- Sends POST requests to n8n executive summary workflow
- Transforms criteria and vendor data to n8n request format
- Handles array-wrapped responses from n8n
- Implements 2-minute timeout protection
- Manages localStorage cache (save/get/clear)

**Key Functions:**
```typescript
// Generate summary via n8n webhook
generateExecutiveSummary(projectId, projectName, projectDescription, criteria, vendors): Promise<ExecutiveSummaryData>

// Cache management
saveExecutiveSummaryToStorage(projectId, data): void
getExecutiveSummaryFromStorage(projectId): ExecutiveSummaryData | null
clearExecutiveSummaryFromStorage(projectId): void
```

---

## Data Flow

### Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Executive Summary" Button                   │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ VendorComparisonNew: setIsExecutiveSummaryOpen(true)            │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ INCOMPLETE DATA DETECTION (useMemo in VendorComparisonNew)      │
│  ⭐ THIS RUNS FIRST - BEFORE CACHE CHECK                         │
│                                                                  │
│  Loop through vendors:                                           │
│    - Check: state.status === 'loading' || 'pending'             │
│                                                                  │
│  Loop through criteria cells:                                   │
│    - Check: cell.status === 'loading' || 'pending'              │
│                                                                  │
│  Return: hasIncompleteData = true/false                          │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ CACHE CHECK (useEffect on isExecutiveSummaryOpen)               │
│  ⭐ CRITICAL: Only load cache if !hasIncompleteData              │
│                                                                  │
│  if (!hasIncompleteData) {                                       │
│    - Call: getExecutiveSummaryFromStorage(projectId)            │
│    - If found: setExecutiveSummaryData(cached)                  │
│  }                                                               │
│  - Set: setCacheChecked(true)                                    │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ ExecutiveSummaryDialog: AUTO-GENERATION LOGIC                   │
│                                                                  │
│  Conditions for auto-generate:                                  │
│    ✅ isOpen = true                                              │
│    ✅ cacheChecked = true                                        │
│    ✅ !summaryData (no cached data)                              │
│    ✅ !isLoading                                                 │
│    ✅ !error                                                     │
│    ✅ !hasIncompleteData ⭐                                       │
│    ✅ onGenerate exists                                          │
│                                                                  │
│  If all conditions met: onGenerate()                             │
│  If hasIncompleteData: Show warning message                      │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼ (onGenerate called)
┌──────────────────────────────────────────────────────────────────┐
│ VendorComparisonNew: handleGenerateExecutiveSummary()           │
│                                                                  │
│  1. Validate: projectId, criteria, techRequest exist            │
│  2. Build comparedVendors array:                                 │
│     - Include vendors with ANY comparison data                  │
│     - Calculate matchPercentage client-side                     │
│  3. Transform criteria to n8n format                             │
│  4. Call: generateExecutiveSummary(...)                          │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ n8nService: generateExecutiveSummary()                          │
│                                                                  │
│  1. Transform criteria array                                     │
│  2. Transform vendors with scoreDetails:                         │
│     - Convert Record to Array format                            │
│     - Map state → numeric score (star=5, yes=4, unknown=3, no=1)│
│     - Include: killerFeature, keyFeatures, executiveSummary     │
│  3. Build ExecutiveSummaryRequest payload                        │
│  4. POST to n8n webhook with 2-minute timeout                    │
│  5. Handle response:                                             │
│     - Detect array wrapping: [{ success, data }]                │
│     - Extract first element if array                            │
│     - Validate: result.success && result.data                   │
│  6. Cache: saveExecutiveSummaryToStorage(projectId, data)       │
│  7. Return: ExecutiveSummaryData                                 │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ VendorComparisonNew: Sync match scores                          │
│                                                                  │
│  Override AI-calculated matchScore with client-side values:     │
│    vendorRecommendations.topPicks.map(pick => ({                │
│      ...pick,                                                   │
│      matchScore: comparedVendors.find(v => v.name === pick.name)│
│                   ?.matchPercentage ?? pick.matchScore           │
│    }))                                                          │
│                                                                  │
│  Call: setExecutiveSummaryData(syncedResult)                    │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ ExecutiveSummaryDialog: Data Transformation (useMemo)           │
│                                                                  │
│  Transform ExecutiveSummaryData → Display Format:               │
│    - keyCriteria → { title, content, highPriority[] }           │
│    - vendorRecommendations → { topPicks[] }                     │
│    - keyDifferentiators → { differentiators[] }                 │
│    - riskFactors → { questionsToAsk[], generalConsiderations[] }│
│                                                                  │
│  Safe property access with defaults:                             │
│    const keyCriteria = summaryData.keyCriteria || [];           │
│    const riskFactors = summaryData.riskFactors || { ... };      │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ UI RENDER: Display Executive Summary                            │
│                                                                  │
│  Sections:                                                       │
│    1. Key Evaluation Criteria (blue highlight box)              │
│    2. Vendor Recommendations (ranked cards with match %)        │
│    3. Key Differentiators (category leaders)                    │
│    4. Risk Factors & Call Preparation (vendor-specific Qs)      │
│                                                                  │
│  Actions:                                                        │
│    - Regenerate (RefreshCw icon)                                │
│    - Copy to Clipboard (Copy icon)                              │
│    - Chat with AI (Bot icon → slide-in panel)                   │
│    - Download/Share (footer button)                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## State Management

### Parent State (VendorComparisonNew)

```typescript
// Primary summary state
const [executiveSummaryData, setExecutiveSummaryData] =
  useState<ExecutiveSummaryData | null>(null);

// Loading state
const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

// Error tracking
const [summaryError, setSummaryError] = useState<string | null>(null);

// Cache tracking
const [cacheChecked, setCacheChecked] = useState(false);

// Dialog visibility
const [isExecutiveSummaryOpen, setIsExecutiveSummaryOpen] = useState(false);

// Incomplete data detection (computed)
const hasIncompleteData = useMemo(() => {
  // Check vendor-level status
  for (const vendor of workflowVendors) {
    const state = vendorComparisonStates[vendor.id];
    if (state?.status === 'loading' || state?.status === 'pending') {
      return true;
    }
  }

  // Check cell-level status
  for (const criterion of workflowCriteria.filter(c => !c.isArchived)) {
    for (const vendor of workflowVendors) {
      const cell = comparisonState.criteria[criterion.id]?.cells[vendor.id];
      if (cell?.status === 'loading' || cell?.status === 'pending') {
        return true;
      }
    }
  }

  return false;
}, [workflowVendors, workflowCriteria, vendorComparisonStates, comparisonState]);
```

### Dialog State (ExecutiveSummaryDialog)

```typescript
// UI state (local to dialog)
const [copied, setCopied] = useState(false); // Copy button feedback
const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
const [isChatOpen, setIsChatOpen] = useState(false);
const [chatMessage, setChatMessage] = useState('');
const [chatHistory, setChatHistory] = useState<Array<{ role, content }>>([]);

// Derived state (useMemo)
const summary = useMemo(() => {
  if (!summaryData) return defaultExecutiveSummary;

  // Transform n8n data to display format
  return {
    title: 'Executive Summary',
    generatedAt: new Date().toISOString(),
    sections: { ... }
  };
}, [summaryData]);
```

---

## API Integration (n8n)

### Request Format

```typescript
interface ExecutiveSummaryRequest {
  project_id: string;
  project_name: string;
  project_description: string;
  session_id: string;
  timestamp: string;

  criteria: Array<{
    id: string;
    name: string;
    description: string;
    importance: string; // "high", "medium", "low"
  }>;

  vendors: Array<{
    id: string;
    name: string;
    website?: string;
    matchPercentage: number; // Client-calculated
    description?: string;
    killerFeature?: string; // Research insight
    keyFeatures?: string[]; // All features from vendor research
    executiveSummary?: string; // "About vendor" section

    scoreDetails: Array<{
      criterionId: string;
      criterionName: string;
      score: number; // 1-5 scale (no=1, unknown=3, yes=4, star=5)
      evidence: string;
      source_urls: string[];
      comments: string;
    }>;
  }>;
}
```

### Response Format

**n8n returns either:**

**Object format:**
```typescript
{
  success: true,
  data: ExecutiveSummaryData,
  generated_at: "2025-12-03T..."
}
```

**Array format (wrapped):**
```typescript
[{
  success: true,
  data: ExecutiveSummaryData,
  generated_at: "2025-12-03T..."
}]
```

**The service handles both:**
```typescript
let result: ExecutiveSummaryResponse | ExecutiveSummaryResponse[] = await response.json();

// Normalize array responses
if (Array.isArray(result)) {
  console.log('[n8n-summary] Response is array, extracting first element');
  if (result.length === 0) {
    throw new Error('Empty response array from n8n');
  }
  result = result[0];
}
```

### n8n Workflow URL

```typescript
const getExecutiveSummaryUrl = (): string => {
  const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || 'http://localhost:5678';
  return `${baseUrl}/webhook/executive-summary`;
};
```

### Timeout Protection

```typescript
const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

fetch(url, {
  signal: controller.signal,
  // ...
});
```

---

## Caching Strategy

### localStorage Schema

```typescript
// Key format
`clarioo_executive_summary_${projectId}`

// Stored value
{
  data: ExecutiveSummaryData,
  generated_at: "2025-12-03T10:30:00.000Z"
}
```

### Cache Lifecycle

```
┌─────────────────────────────────────────────────────┐
│ CACHE WRITE                                         │
│  - After successful n8n response                    │
│  - Function: saveExecutiveSummaryToStorage()        │
└─────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ CACHE READ (with Completeness Check)               │
│  - On dialog open (useEffect)                       │
│  - FIRST: Check hasIncompleteData                   │
│  - If incomplete: Skip cache, show warning          │
│  - If complete: getExecutiveSummaryFromStorage()    │
│  - Sets: executiveSummaryData, cacheChecked = true  │
└─────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ CACHE INVALIDATION                                  │
│                                                     │
│  Triggers:                                          │
│   1. Vendor list changes (useEffect)                │
│   2. Manual regeneration                            │
│   3. Comparison regeneration (resetComparison)      │
│                                                     │
│  Actions:                                           │
│   - clearExecutiveSummaryFromStorage(projectId)     │
│   - setExecutiveSummaryData(null)                   │
│   - setCacheChecked(false)                          │
│   - Clear vendor summaries cache too                │
└─────────────────────────────────────────────────────┘
```

### Cache Read with Completeness Check

**CRITICAL:** Cache is only loaded if data is complete. This prevents showing stale summaries when comparison data has become incomplete.

```typescript
// Load cached executive summary when dialog opens
// IMPORTANT: Only load cache if data is complete (hasIncompleteData = false)
// If data is incomplete, we should show the warning instead of cached data
useEffect(() => {
  if (isExecutiveSummaryOpen && projectId && !cacheChecked) {
    // Check completeness FIRST before loading cache
    if (!hasIncompleteData) {
      const cached = getExecutiveSummaryFromStorage(projectId);
      if (cached) {
        setExecutiveSummaryData(cached);
      }
    }
    setCacheChecked(true);
  }
}, [isExecutiveSummaryOpen, projectId, cacheChecked, hasIncompleteData]);
```

**Behavior:**
- ✅ **Data Complete + Cache Exists** → Load cache instantly, show summary
- ⛔ **Data Incomplete + Cache Exists** → Ignore cache, show blue warning
- ✅ **Data Complete + No Cache** → Auto-generate new summary
- ⛔ **Data Incomplete + No Cache** → Show blue warning with "Generate" option

---

### Comparison Regeneration Handler

When user regenerates the comparison table (wipes vendor and comparison data), the executive summary cache must also be cleared:

```typescript
// Listen for custom event from parent VendorDiscovery to regenerate comparison
useEffect(() => {
  const handleRegenerateComparison = () => {
    resetComparison();

    // Clear executive summary cache when regenerating comparison
    if (projectId) {
      clearExecutiveSummaryFromStorage(projectId);
      setExecutiveSummaryData(null);
      setCacheChecked(false);
    }

    // Start comparison after a small delay to allow state to update
    setTimeout(() => {
      startComparison();
    }, 100);
  };

  window.addEventListener('regenerateComparison', handleRegenerateComparison);
  return () => {
    window.removeEventListener('regenerateComparison', handleRegenerateComparison);
  };
}, [resetComparison, startComparison, projectId]);
```

---

### Vendor List Change Detection

```typescript
const vendorIdsRef = useRef<string[]>([]);

useEffect(() => {
  if (!workflowVendors || !projectId) return;

  const currentVendorIds = workflowVendors.map(v => v.id).sort().join(',');
  const previousVendorIds = vendorIdsRef.current.sort().join(',');

  if (previousVendorIds && currentVendorIds !== previousVendorIds) {
    // Vendor list changed - clear all caches
    clearExecutiveSummaryFromStorage(projectId);
    setExecutiveSummaryData(null);
    setCacheChecked(false);
    hasGeneratedSummaries.current = false;
    setVendorSummaries(new Map());
  }

  vendorIdsRef.current = workflowVendors.map(v => v.id);
}, [workflowVendors, projectId]);
```

---

## Incomplete Data Handling

### Detection Logic

**Definition of Incomplete Data:**
> Any vendor criterion cell is still `loading` or `pending` status.

**Implementation:**
```typescript
const hasIncompleteData = useMemo(() => {
  if (!workflowVendors || !workflowCriteria) return false;

  // 1. Check vendor-level status
  for (const vendor of workflowVendors) {
    const state = vendorComparisonStates[vendor.id];
    if (state?.status === 'loading' || state?.status === 'pending') {
      return true; // ⛔ Vendor still loading
    }
  }

  // 2. Check cell-level status
  for (const criterion of workflowCriteria.filter(c => !c.isArchived)) {
    for (const vendor of workflowVendors) {
      const cell = comparisonState.criteria[criterion.id]?.cells[vendor.id];
      if (cell?.status === 'loading' || cell?.status === 'pending') {
        return true; // ⛔ Cell still loading
      }
    }
  }

  return false; // ✅ All data complete
}, [workflowVendors, workflowCriteria, vendorComparisonStates, comparisonState]);
```

### User Experience Flow

#### **Scenario 1: Data Complete**

```
User clicks "Executive Summary"
  ↓
Dialog opens
  ↓
Cache checked (none found)
  ↓
hasIncompleteData = false ✅
  ↓
Auto-generate triggered
  ↓
Show loading spinner: "Generating executive summary... This may take up to 2 minutes"
  ↓
n8n returns data
  ↓
Display summary sections
```

#### **Scenario 2: Data Incomplete**

```
User clicks "Executive Summary"
  ↓
Dialog opens
  ↓
Cache checked (none found)
  ↓
hasIncompleteData = true ⛔
  ↓
Show BLUE warning:
  "The vendor research against your criteria is not done.
   Would you like to generate executive summary with incomplete data?"

  [Generate] button (blue outline)
  ↓
User clicks "Generate"
  ↓
handleGenerateExecutiveSummary() called
  ↓
Include vendors with ANY comparison data
  ↓
n8n generates summary with available data
  ↓
Display summary sections
```

### Auto-Generate Conditions

```typescript
React.useEffect(() => {
  if (
    isOpen &&              // Dialog is open
    cacheChecked &&        // Cache has been checked
    !summaryData &&        // No cached data found
    !isLoading &&          // Not currently loading
    !error &&              // No error state
    !hasIncompleteData &&  // ⭐ Data is COMPLETE
    onGenerate             // Handler exists
  ) {
    onGenerate(); // Trigger auto-generation
  }
}, [isOpen, cacheChecked, summaryData, isLoading, error, hasIncompleteData, onGenerate]);
```

---

## User Flows

### Flow 1: First-Time Executive Summary (Complete Data)

```
┌──────────────────────────────────────────┐
│ 1. User completes vendor comparison      │
│    - All vendors have match percentages  │
│    - All criteria cells evaluated        │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 2. User clicks "Executive Summary"       │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 3. Dialog opens                          │
│    - Check cache: none found             │
│    - hasIncompleteData = false           │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 4. Auto-generate starts                  │
│    - Show spinner                        │
│    - "Generating... up to 2 minutes"     │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 5. n8n processes request (~60-120s)      │
│    - Analyzes criteria importance        │
│    - Ranks vendors                       │
│    - Identifies differentiators          │
│    - Generates call prep questions       │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 6. Summary displayed                     │
│    - Cached to localStorage              │
│    - Full sections rendered              │
└──────────────────────────────────────────┘
```

### Flow 2: Executive Summary with Incomplete Data

```
┌──────────────────────────────────────────┐
│ 1. User in middle of comparison          │
│    - 2/5 vendors completed               │
│    - 8/12 criteria cells still loading   │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 2. User clicks "Executive Summary"       │
│    (curious to see preliminary results)  │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 3. Dialog opens                          │
│    - Check cache: none found             │
│    - hasIncompleteData = true ⛔         │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 4. Show BLUE warning message             │
│    "The vendor research against your     │
│     criteria is not done. Would you      │
│     like to generate executive summary   │
│     with incomplete data?"               │
│                                          │
│    [Generate] button                     │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 5a. User clicks [X] to close             │
│     - Returns to comparison page         │
│     - Can finish comparison first        │
└──────────────────────────────────────────┘
             OR
             ▼
┌──────────────────────────────────────────┐
│ 5b. User clicks [Generate]               │
│     - Accept incomplete data             │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 6. Generation starts                     │
│    - Uses available vendor data only     │
│    - Partial scoreDetails included       │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 7. Summary displayed                     │
│    - Based on 2/5 vendors                │
│    - Partial insights                    │
│    - User can regenerate later when      │
│      comparison is complete              │
└──────────────────────────────────────────┘
```

### Flow 3: Revisiting with Cached Summary

```
┌──────────────────────────────────────────┐
│ 1. User returns to comparison page       │
│    - Summary previously generated        │
│    - Cached in localStorage              │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 2. User clicks "Executive Summary"       │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 3. Dialog opens                          │
│    - Check cache: FOUND ✅               │
│    - Load cached data instantly          │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 4. Summary displayed IMMEDIATELY         │
│    - No loading spinner                  │
│    - No n8n call needed                  │
│    - Instant UX                          │
└──────────────────────────────────────────┘
```

### Flow 4: Regeneration After Data Changes

```
┌──────────────────────────────────────────┐
│ 1. User viewing cached summary           │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 2. User adds/removes vendors             │
│    - Cache auto-invalidated (useEffect)  │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 3. User clicks "Executive Summary"       │
│    - No cache found (cleared)            │
│    - Fresh generation triggered          │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 4. New summary generated                 │
│    - Reflects updated vendor list        │
│    - New cache created                   │
└──────────────────────────────────────────┘
```

---

## Key Functions Reference

### VendorComparisonNew Functions

#### `hasIncompleteData` (useMemo)
**Purpose:** Detect if any vendor or criterion cell is still loading/pending

**Returns:** `boolean`

**Logic:**
1. Loop through all vendors, check `vendorComparisonStates[vendor.id].status`
2. Loop through all criteria cells, check `cell.status`
3. Return `true` if any is `loading` or `pending`

---

#### `handleGenerateExecutiveSummary` (useCallback)
**Purpose:** Orchestrate executive summary generation

**Steps:**
1. **Validation** - Ensure projectId, criteria, techRequest exist
2. **Build comparedVendors** - Include vendors with ANY comparison data
3. **Calculate matchPercentage** - Client-side calculation for consistency
4. **Transform data** - Convert to n8n request format
5. **Call n8nService** - `generateExecutiveSummary(...)`
6. **Sync match scores** - Override AI scores with client-calculated values
7. **Update state** - `setExecutiveSummaryData(syncedResult)`

**Error Handling:**
```typescript
try {
  // Generation logic
} catch (error) {
  const message = error instanceof Error
    ? error.message
    : 'Failed to generate summary';
  setSummaryError(message);
} finally {
  setIsGeneratingSummary(false);
}
```

---

### n8nService Functions

#### `generateExecutiveSummary()`
**Purpose:** Call n8n webhook and handle response

**Parameters:**
```typescript
projectId: string,
projectName: string,
projectDescription: string,
criteria: TransformedCriterion[],
vendors: ComparedVendor[]
```

**Returns:** `Promise<ExecutiveSummaryData>`

**Key Steps:**
1. **Transform criteria** - Filter archived, map to request format
2. **Transform vendors** - Convert scoreDetails from Record to Array
3. **Score mapping** - `star=5, yes=4, unknown=3, no=1`
4. **Build request** - ExecutiveSummaryRequest payload
5. **Fetch with timeout** - 2-minute AbortController
6. **Handle array response** - Normalize `[{...}]` to `{...}`
7. **Validate response** - Check `success` and `data` fields
8. **Cache result** - `saveExecutiveSummaryToStorage(...)`

**Error Cases:**
- HTTP error (non-2xx response)
- Timeout after 2 minutes
- Empty array response
- Invalid response structure

---

#### `saveExecutiveSummaryToStorage()`
**Purpose:** Cache executive summary in localStorage

**Storage Key:** `clarioo_executive_summary_${projectId}`

**Stored Value:**
```json
{
  "data": { ExecutiveSummaryData },
  "generated_at": "2025-12-03T10:30:00.000Z"
}
```

---

#### `getExecutiveSummaryFromStorage()`
**Purpose:** Retrieve cached summary

**Returns:** `ExecutiveSummaryData | null`

**Error Handling:** Returns `null` if parse fails

---

#### `clearExecutiveSummaryFromStorage()`
**Purpose:** Invalidate cache when vendor list changes

---

### ExecutiveSummaryDialog Functions

#### `summary` (useMemo)
**Purpose:** Transform n8n data to display format with safe defaults

**Transformation:**
```typescript
// Safe property access with defaults
const keyCriteria = summaryData.keyCriteria || [];
const vendorRecommendations = summaryData.vendorRecommendations || [];
const keyDifferentiators = summaryData.keyDifferentiators || [];
const riskFactors = summaryData.riskFactors || {
  vendorSpecific: [],
  generalConsiderations: []
};

return {
  title: 'Executive Summary',
  generatedAt: new Date().toISOString(),
  sections: {
    keyCriteria: { ... },
    vendorRecommendations: { ... },
    keyDifferentiators: { ... },
    riskFactors: { ... }
  }
};
```

---

#### `handleCopy` (async)
**Purpose:** Copy formatted summary to clipboard

**Format:** Markdown with headers, bullet points, vendor rankings

**User Feedback:** Toast notification + checkmark icon for 3s

---

#### `handleSendMessage`
**Purpose:** AI chat interaction (mock implementation)

**Future Enhancement:** Real AI service integration for Q&A

---

#### `generateFormattedText`
**Purpose:** Convert summary to markdown string

**Output Format:**
```markdown
# Executive Summary

## Key Evaluation Criteria
Based on 5 high-priority criteria.

**High Priority Criteria:**
- API Integration
- Scalability
- ...

## Vendor Recommendations

### 1. Salesforce (85% Match)
Strong enterprise features...

## Key Differentiators
...

## Risk Factors & Call Preparation
...
```

---

## Error Handling

### Error Types

#### 1. **Validation Errors**
```typescript
if (!projectId || !workflowCriteria || !techRequest) {
  setSummaryError('Missing project data');
  return;
}
```

#### 2. **No Vendor Data**
```typescript
if (comparedVendors.length === 0) {
  setSummaryError('No vendor data available. Please start the comparison first.');
  return;
}
```

#### 3. **n8n HTTP Errors**
```typescript
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`HTTP error: ${response.status} - ${errorText}`);
}
```

#### 4. **Timeout Errors**
```typescript
if (error.name === 'AbortError') {
  throw new Error('Executive summary generation timed out (2 min limit)');
}
```

#### 5. **Empty Array Response**
```typescript
if (Array.isArray(result) && result.length === 0) {
  throw new Error('Empty response array from n8n');
}
```

#### 6. **Invalid Response Structure**
```typescript
if (!result.success || !result.data) {
  const errorMessage = result.error?.message || 'Failed to generate executive summary';
  throw new Error(errorMessage);
}
```

### Error Display

```typescript
{error && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
    <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
    <p className="text-blue-700 mb-4">{error}</p>
    <Button onClick={onGenerate} variant="outline">
      Generate
    </Button>
  </div>
)}
```

---

## UI States

### State 1: Loading

**Condition:** `isLoading === true`

**Display:**
```
┌─────────────────────────────────┐
│       [Spinner Animation]       │
│                                 │
│  Generating executive summary...│
│  This may take up to 2 minutes  │
└─────────────────────────────────┘
```

---

### State 2: Incomplete Data Warning

**Condition:** `!isLoading && hasIncompleteData && !summaryData`

**Display:**
```
┌─────────────────────────────────┐
│     [AlertCircle - Blue]        │
│                                 │
│  The vendor research against    │
│  your criteria is not done.     │
│  Would you like to generate     │
│  executive summary with         │
│  incomplete data?               │
│                                 │
│       [Generate Button]         │
└─────────────────────────────────┘
```

**Color Scheme:** Blue (not red) for warnings

---

### State 3: Error

**Condition:** `!isLoading && error && !summaryData`

**Display:**
```
┌─────────────────────────────────┐
│     [AlertCircle - Blue]        │
│                                 │
│  {error message}                │
│                                 │
│       [Generate Button]         │
└─────────────────────────────────┘
```

---

### State 4: Success (Data Displayed)

**Condition:** `!isLoading && summaryData`

**Display:**
```
┌─────────────────────────────────────────┐
│  Header: Executive Summary              │
│  Actions: [Regenerate][Copy][Bot][X]    │
├─────────────────────────────────────────┤
│                                         │
│  ## Key Evaluation Criteria             │
│  [Blue highlight box with criteria]     │
│                                         │
│  ## Vendor Recommendations              │
│  [Ranked vendor cards 1-N]              │
│                                         │
│  ## Key Differentiators                 │
│  [Category leaders]                     │
│                                         │
│  ## Risk Factors & Call Preparation     │
│  [Vendor-specific questions]            │
│  [General considerations]               │
│                                         │
├─────────────────────────────────────────┤
│  Footer: [Download or Share]            │
└─────────────────────────────────────────┘
```

---

## Summary

The Executive Summary system is a **well-architected, production-ready feature** with:

✅ **Clear separation of concerns** - Orchestrator, Presentation, Integration layers
✅ **Robust error handling** - Validation, timeout, response normalization
✅ **Smart caching strategy** - localStorage with automatic invalidation
✅ **Incomplete data support** - Graceful degradation with user choice
✅ **Type safety** - Full TypeScript interfaces
✅ **Defensive programming** - Safe property access with defaults

### No Refactoring Needed

The component is **already properly separated**:
- `ExecutiveSummaryDialog.tsx` is a standalone presentation component
- State management is in parent (`VendorComparisonNew`)
- API logic is in service layer (`n8nService`)

### Future Enhancements

1. **Real AI Chat** - Replace mock chat with actual AI service integration
2. **Export Formats** - Add PDF, Word, CSV export options
3. **Email Sharing** - Direct email summary to stakeholders
4. **Version History** - Track and compare summary versions over time
5. **Custom Sections** - Allow users to add custom evaluation sections

---

**End of Documentation**
