# Vendor Comparison System - Component Collection

This folder contains copies of all components involved in the **Two-Stage Vendor Comparison System** (SP_018).

## Purpose

This is a reference collection of all files used in the vendor comparison feature, organized for easy review and documentation. These are **copies** of the original files - the actual working files remain in their respective `src/` locations.

## Structure

```
VENDOR_COMPARISON_COMPONENTS/
├── components/              # React UI components
│   ├── VendorComparisonNew.tsx
│   └── vendor-comparison/
│       ├── VerticalBarChart.tsx
│       ├── CriterionCard.tsx
│       └── VendorCard.tsx
│
├── hooks/                   # Custom React hooks
│   ├── useTwoStageComparison.ts
│   └── useVendorTransformation.ts
│
├── services/                # n8n API integration
│   └── n8nService.ts
│
├── utils/                   # Utility functions
│   ├── comparisonStorage.ts
│   └── vendorComparison.ts
│
├── types/                   # TypeScript type definitions
│   ├── vendorComparison.types.ts
│   └── comparison.types.ts
│
└── workflows/               # n8n workflow definitions
    ├── Clarioo_TESTING_AI_Compare_Vendor_Criterion.json
    └── Clarioo_TESTING_AI_Rank_Criterion_Results.json
```

## Components Overview

### Frontend Components

#### `components/VendorComparisonNew.tsx`
**Main comparison UI component**
- Renders the comparison grid
- Manages comparison state via `useTwoStageComparison` hook
- Handles pause/resume/regenerate actions
- Passes cell-level status to VerticalBarChart

**Key Features:**
- Progressive loading visualization
- Pause/resume controls
- Regenerate button
- Retry failed vendors

#### `components/vendor-comparison/VerticalBarChart.tsx`
**Comparison grid/matrix renderer**
- Displays vendors and criteria in grid layout
- Shows cell-level loading spinners (max 5 at once)
- Renders score icons (yes/star/no/unknown)
- Mobile: 3 vendors at a time with swipe
- Desktop: 5 vendors with expand/collapse

**Critical Feature:**
- Uses `comparisonState.criteria[criterionId].cells[vendorId].status` for cell-level status
- Only cells with `status='loading'` show spinners

#### `components/vendor-comparison/CriterionCard.tsx`
**Individual criterion card**
- Displays criterion name, importance, description
- Shows vendor scores for this criterion
- Used in mobile view

#### `components/vendor-comparison/VendorCard.tsx`
**Individual vendor card**
- Displays vendor information
- Shows retry button on failures

### Hooks

#### `hooks/useTwoStageComparison.ts`
**Orchestration engine for two-stage comparison**

**Core Responsibilities:**
- State management (`comparisonState`, `comparisonStateRef`)
- Concurrency control (max 5 parallel workflows)
- Stage 1 cell research orchestration
- Stage 2 comparative ranking orchestration
- Pause/resume/retry logic

**Key Functions:**
- `initializeCriteria()` - Creates initial state structure
- `orchestrateComparison()` - Main orchestration loop
- `runStage1Cell()` - Executes Stage 1 for one cell
- `runStage2Criterion()` - Executes Stage 2 for one criterion
- `startComparison()` - Begins comparison
- `pauseComparison()` - Pauses comparison
- `resumeComparison()` - Resumes comparison
- `resetComparison()` - Resets all state
- `retryVendor()` - Retries all cells for a vendor

**Race Condition Fixes:**
- Uses `comparisonStateRef` to access latest state in closures
- Marks cells as 'loading' BEFORE async calls
- Increments `activeWorkflowsRef` BEFORE async calls
- AutoStart checks if criteria initialized before starting

#### `hooks/useVendorTransformation.ts`
**Transforms workflow vendor data to ComparisonVendor format**

**Functions:**
- `useVendorTransformation()` - Main transformation hook
  - Calculates match percentage from scores
  - Assigns colors from palette
  - Sorts vendors by match percentage when complete
- `useCriteriaTransformation()` - Transforms criteria format

### Services

#### `services/n8nService.ts`
**All n8n webhook API calls**

**Vendor Comparison Functions:**
- `compareVendorCriterion()` (lines 794-907)
  - Stage 1: Individual vendor-criterion research
  - Timeout: 45 seconds
  - Returns evidence data

- `rankCriterionResults()` (lines 924-1033)
  - Stage 2: Comparative ranking and star allocation
  - Timeout: 90 seconds
  - Returns rankings with stars

**Configuration:**
- `STAGE1_TIMEOUT_MS = 45000` (line 672)
- `STAGE2_TIMEOUT_MS = 90000` (line 673)

### Utilities

#### `utils/comparisonStorage.ts`
**localStorage persistence utilities**

**Stage 1 Storage:**
- `loadStage1Results()` - Load Stage 1 evidence data
- `saveStage1Results()` - Save Stage 1 evidence data
- `clearStage1Results()` - Clear Stage 1 data
- Key: `stage1_results_{projectId}`

**Stage 2 Storage:**
- `loadStage2Results()` - Load Stage 2 rankings
- `saveStage2Results()` - Save Stage 2 rankings
- `clearStage2Results()` - Clear Stage 2 data
- Key: `stage2_results_{projectId}`

**Comparison State Storage:**
- `loadComparisonState()` - Load orchestration state
- `saveComparisonState()` - Save orchestration state
- `clearComparisonState()` - Clear state
- Key: `comparison_state_{projectId}`

**Batch Operations:**
- `clearAllComparisonData()` - Clear all comparison data
- `hasComparisonData()` - Check what data exists

#### `utils/vendorComparison.ts`
**Match percentage calculation**

**Function:**
- `calculateMatchPercentage()` - Client-side calculation
  - Score points: star=5, yes=4, unknown=3, no=1
  - Importance multipliers: high=3, medium=2, low=1
  - Formula: `(totalPoints / maxPossiblePoints) × 100`

### Types

#### `types/vendorComparison.types.ts`
**Two-stage comparison type definitions**

**Key Types:**
- `ComparisonState` - Overall comparison state
- `CriterionRow` - State for one criterion
- `CriterionCell` - State for one cell (vendor × criterion)
- `Stage1StorageData` - Stage 1 localStorage format
- `Stage2StorageData` - Stage 2 localStorage format

**Cell Status:**
```typescript
type CellStatus = 'pending' | 'loading' | 'completed' | 'failed';
```

#### `types/comparison.types.ts`
**General comparison type definitions**

**Key Types:**
- `ComparisonVendor` - Vendor object with scores
- `Criterion` - Evaluation criterion
- `CriterionScoreDetail` - Detailed score information

### Workflows

#### `workflows/Clarioo_TESTING_AI_Compare_Vendor_Criterion.json`
**n8n Stage 1 workflow**

**Purpose:** Individual vendor-criterion evidence collection

**Configuration:**
- Webhook: `/api/v1/compare-vendor-criterion`
- AI Model: OpenAI GPT-4o-mini
- Temperature: 0.2
- Max Tokens: 4000
- Timeout: 45000ms (45 seconds)
- Search Tool: Perplexity (max 5 searches)

**Process:**
1. Validate input (vendor_id, criterion_id)
2. AI searches vendor website (site: search)
3. AI searches third-party sources (G2, Reddit, etc.)
4. Classify evidence strength (confirmed/mentioned/unclear/not_found)
5. Return evidence data

**Output:**
```json
{
  "vendor_id": "uuid",
  "criterion_id": "uuid",
  "evidence_strength": "confirmed|mentioned|unclear|not_found",
  "evidence_url": "https://...",
  "evidence_description": "...",
  "vendor_site_evidence": "https://...",
  "third_party_evidence": "https://...",
  "research_notes": "...",
  "search_count": 3
}
```

#### `workflows/Clarioo_TESTING_AI_Rank_Criterion_Results.json`
**n8n Stage 2 workflow**

**Purpose:** Comparative ranking and star allocation

**Configuration:**
- Webhook: `/api/v1/rank-criterion-results`
- AI Model: OpenAI GPT-4o-mini
- Temperature: 0.2
- Max Tokens: 6000
- Timeout: 90000ms (90 seconds)
- Search Tool: Perplexity (max 10 searches)

**Process:**
1. Validate input (criterion_id, stage1_results)
2. Review Stage 1 evidence for all vendors
3. Conduct comparative research (vendor A vs vendor B)
4. Award up to 2 stars for competitive advantage
5. Generate criterion insight
6. Return rankings for all vendors

**Output:**
```json
{
  "criterion_id": "uuid",
  "criterion_name": "...",
  "vendor_rankings": [
    {
      "vendor_id": "uuid",
      "vendor_name": "...",
      "state": "yes|star|no|unknown",
      "evidence_url": "https://...",
      "evidence_description": "...",
      "comment": "..."
    }
  ],
  "criterion_insight": "...",
  "stars_awarded": 1,
  "search_count": 7
}
```

## System Flow

### Two-Stage Process

**Stage 1: Cell Research (45s per cell)**
1. Research one vendor's capability for one criterion
2. Collect evidence from vendor website and third-party sources
3. Classify evidence strength
4. No comparison, no ratings - just evidence collection

**Stage 2: Comparative Ranking (90s per criterion)**
1. After all vendors complete Stage 1 for a criterion
2. Conduct comparative research (vendor A vs vendor B)
3. Award up to 2 stars for exceptional competitive advantage
4. Generate criterion-level insights

### Progressive Loading

- Max 5 cells loading simultaneously (concurrency control)
- Results appear cell-by-cell as they complete
- User sees exactly which cells are being researched
- First results visible in ~1 minute
- Total time: ~5-10 minutes for 5 vendors × 17 criteria

### Concurrency Control

**Implementation:**
- `MAX_CONCURRENT_WORKFLOWS = 5` (useTwoStageComparison.ts:108)
- Wait-based queue system
- Cell status tracking prevents race conditions

**Race Condition Fixes:**
1. Use `comparisonStateRef` to access latest state
2. Mark cells as 'loading' BEFORE async calls
3. Increment `activeWorkflowsRef` BEFORE async calls
4. AutoStart checks if criteria initialized

## Key Features

1. **Progressive Loading** - Results appear cell-by-cell
2. **Concurrency Control** - Max 5 parallel workflows
3. **Cell-Level Status** - Each cell has independent status
4. **Pause/Resume** - User can pause and resume at any time
5. **Retry** - Individual vendor retry capability
6. **Client-Side Calculation** - Match percentages calculated in browser
7. **Two-Stage Research** - Evidence collection separated from comparative analysis
8. **Star Allocation** - Up to 2 stars per criterion for competitive advantage

## Storage Keys

| Key | Purpose |
|-----|---------|
| `stage1_results_{projectId}` | Stage 1 evidence data |
| `stage2_results_{projectId}` | Stage 2 rankings |
| `comparison_state_{projectId}` | Orchestration state |

## Configuration

### Timeouts
- Stage 1: 45 seconds (frontend + n8n)
- Stage 2: 90 seconds (frontend + n8n)

### Concurrency
- Max concurrent workflows: 5

### Webhook URLs
- Stage 1: `https://n8n.lakestrom.com/webhook/compare-vendor-criterion`
- Stage 2: `https://n8n.lakestrom.com/webhook/rank-criterion-results`

## Related Documentation

See **`00_IMPLEMENTATION/MIGRATING_TO_N8N/VENDOR_COMPARISON_SYSTEM_GUIDE.md`** for complete technical documentation.

---

**Collection Created:** 2025-01-28
**System Version:** SP_018 (Two-Stage Progressive Comparison)
