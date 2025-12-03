# Two-Stage Vendor Comparison System - Technical Guide

## Overview

The Two-Stage Vendor Comparison system is a progressive research and ranking engine that evaluates vendors against user-defined criteria. It uses AI-powered workflows to conduct research, compare vendors, and award competitive advantage stars.

**Key Innovation:** Instead of comparing all criteria for one vendor at once (old system), the new system researches individual vendor-criterion cells progressively, then conducts comparative analysis per criterion to identify market leaders.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [How It Works](#how-it-works)
3. [Stage 1: Cell Research](#stage-1-cell-research)
4. [Stage 2: Comparative Ranking](#stage-2-comparative-ranking)
5. [Match Percentage Calculation](#match-percentage-calculation)
6. [File Structure & Key Code](#file-structure--key-code)
7. [Data Flow](#data-flow)
8. [Storage Strategy](#storage-strategy)
9. [Concurrency Control](#concurrency-control)
10. [Pause/Resume/Retry](#pauseresumeretry)
11. [UI Updates & Cell Status](#ui-updates--cell-status)
12. [Configuration](#configuration)
13. [Old vs New System](#old-vs-new-system)
14. [Debugging Guide](#debugging-guide)

---

## System Architecture

### Two-Stage Process

**Stage 1: Individual Cell Research** (45 seconds per cell)
- Research one vendor's capability for one specific criterion
- Collect evidence from vendor website and third-party sources
- Classify evidence strength: confirmed/mentioned/unclear/not_found
- No comparison, no ratings - just evidence collection

**Stage 2: Comparative Ranking** (90 seconds per criterion)
- After all vendors complete Stage 1 for a criterion
- Conduct comparative research (vendor A vs vendor B)
- Award up to 2 stars for exceptional competitive advantage
- Generate criterion-level insights

### Progressive Loading

```
┌─────────────────────────────────────────────────────────┐
│ Comparison Grid (5 vendors × 17 criteria = 85 cells)   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [🔄] [✓] [✓] [⭐] [🔄]  ← Only 5 cells loading at once│
│  [✓]  [✓] [✓] [✓]  [✓]   ← Results appear as complete │
│  [⏳] [⏳] [⏳] [⏳] [⏳]  ← Waiting for slot            │
│                                                         │
└─────────────────────────────────────────────────────────┘

🔄 = Loading (max 5)
✓  = Completed (yes/no/unknown)
⭐ = Star (competitive advantage)
⏳ = Pending (waiting for slot)
```

### Key Design Principles

1. **Progressive Loading** - Results appear cell-by-cell as they complete
2. **Concurrency Control** - Max 5 parallel workflows to prevent server overload
3. **Cell-Level Granularity** - Each cell has independent status and can be retried
4. **Pause/Resume** - User can pause and resume at any time
5. **Client-Side Calculation** - Match percentages calculated in browser
6. **Two-Stage Research** - Evidence collection separated from comparative analysis

---

## How It Works

### User Flow

1. **Initiation**
   - User has already discovered vendors via Vendor Discovery
   - User clicks "Compare Vendors"
   - VendorComparisonNew component loads
   - System auto-starts comparison

2. **Stage 1 Execution**
   - System creates grid of cells (vendors × criteria)
   - Starts researching up to 5 cells simultaneously
   - Each cell:
     - Shows loading spinner
     - Calls n8n Stage 1 webhook
     - AI researches vendor + criterion
     - Returns evidence data
     - Cell shows score icon (yes/no/unknown)
   - Continues until all cells in criterion complete

3. **Stage 2 Execution**
   - When all vendors complete Stage 1 for a criterion
   - System collects all Stage 1 results
   - Calls n8n Stage 2 webhook
   - AI conducts comparative research
   - AI awards up to 2 stars
   - Updates all vendor cells with final rankings

4. **Completion**
   - All criteria complete
   - Match percentages calculated (client-side)
   - Vendors sorted by match percentage
   - Final results displayed

### Visual Progress Tracking

**User Experience:**
```
Time: 0s
[🔄🔄🔄🔄🔄] ← 5 cells start research
[⏳⏳⏳⏳⏳]
[⏳⏳⏳⏳⏳]

Time: 15s
[✓ ✓ 🔄🔄🔄] ← 2 complete, 3 continue, 2 new start
[🔄🔄⏳⏳⏳]
[⏳⏳⏳⏳⏳]

Time: 45s
[✓ ✓ ✓ ✓ ✓] ← All Stage 1 complete for Criterion 1
[✓ ✓ ✓ 🔄🔄] ← Criterion 2 in progress
[🔄🔄🔄⏳⏳]
   ↓
[Stage 2 runs for Criterion 1]
   ↓
[✓ ⭐ ✓ ⭐ ✓] ← Stars awarded based on competitive advantage
```

---

## Stage 1: Cell Research

### Purpose
Collect factual evidence about one vendor's capability for one specific criterion. No comparisons, no ratings - just evidence.

### Process

1. **Vendor Website Search**
   - Search query: `"{vendor name} {criterion name} site:{vendor domain}"`
   - Look for official feature pages, documentation, case studies
   - Record URL and description if found

2. **Third-Party Search** (if needed)
   - Search G2, Capterra, Reddit, review sites
   - Gather additional evidence
   - Record best third-party URL

3. **Evidence Classification**
   - **confirmed** - Strong evidence from vendor site OR multiple third-party sources
   - **mentioned** - Feature referenced but limited details
   - **unclear** - Contradictory or vague information
   - **not_found** - No evidence found after thorough search

4. **Return Result**
   - vendor_id, criterion_id
   - evidence_strength
   - evidence_url (best supporting URL)
   - evidence_description
   - vendor_site_evidence
   - third_party_evidence
   - research_notes
   - search_count (1-5 Perplexity searches)

### Files Involved

**Frontend Service:**
- **`src/services/n8nService.ts`** (lines 794-907)
  - `compareVendorCriterion()` - Calls Stage 1 webhook
  - Timeout: 45 seconds
  - Error handling with retry support

**Orchestration Hook:**
- **`src/hooks/useTwoStageComparison.ts`** (lines 240-385)
  - `runStage1Cell()` - Executes Stage 1 for one cell
  - Updates cell status
  - Triggers Stage 2 when criterion complete
  - Manages activeWorkflowsRef counter

**n8n Workflow:**
- **`00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_TESTING_AI_Compare_Vendor_Criterion.json`**
  - Webhook: `/api/v1/compare-vendor-criterion`
  - AI Agent timeout: 45000ms (45 seconds)
  - OpenAI GPT-4o-mini model
  - Perplexity search tool (max 5 searches)

### Example Request/Response

**Request:**
```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "project_id": "uuid",
  "project_name": "CRM Selection",
  "project_description": "Need CRM with email integration...",
  "project_category": "CRM",
  "vendor": {
    "id": "uuid",
    "name": "HubSpot",
    "website": "https://www.hubspot.com"
  },
  "criterion": {
    "id": "uuid",
    "name": "API Integration",
    "importance": "high",
    "description": "RESTful API with webhooks"
  },
  "timestamp": "2025-01-28T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "vendor_id": "uuid",
    "criterion_id": "uuid",
    "evidence_strength": "confirmed",
    "evidence_url": "https://developers.hubspot.com/docs/api/overview",
    "evidence_description": "Comprehensive REST API with OAuth 2.0, webhooks, and rate limiting",
    "vendor_site_evidence": "https://developers.hubspot.com/docs/api/overview",
    "third_party_evidence": "https://www.g2.com/products/hubspot-crm/reviews",
    "research_notes": "Found detailed API documentation on vendor site. G2 reviews confirm robust API capabilities.",
    "search_count": 2
  },
  "timestamp": "2025-01-28T10:00:15Z"
}
```

---

## Stage 2: Comparative Ranking

### Purpose
Analyze all vendors for a specific criterion, identify competitive advantages, and award stars to market leaders.

### Process

1. **Review Stage 1 Evidence**
   - Analyze evidence collected for each vendor
   - Identify vendors with "confirmed" or "mentioned" evidence
   - Filter candidates for further investigation

2. **Comparative Research** (up to 10 searches)
   - Search queries:
     - `"{vendor A} vs {vendor B} {criterion}"`
     - `"best {product category} for {criterion}"`
     - `"{criterion} comparison {vendor A} {vendor B} {vendor C}"`
     - `"{vendor A} {criterion} rated review reddit"`
   - Look for evidence of competitive advantages:
     - Direct comparisons showing vendor superiority
     - Awards or recognition
     - User testimonials preferring one vendor
     - Expert reviews highlighting exceptional performance
     - Benchmarks showing better results

3. **Star Allocation** (max 2 stars per criterion)
   - Award 0-2 stars based on competitive advantage
   - **Star Requirements:**
     - MUST use third-party sources (not vendor sites)
     - MUST explicitly compare or rank vendors
     - MUST demonstrate clear advantage
     - MUST provide specific competitor names
   - Star comment format: `"{advantage} vs {competitors} per {source}"`
   - Example: `"Rated #1 for integrations vs Salesforce and HubSpot per G2 reviews"`

4. **Update Evidence** (if better found)
   - If comparative research finds better evidence than Stage 1
   - Update evidence URL and description
   - Prefer more authoritative sources

5. **Generate Criterion Insight**
   - 2-3 sentence summary about this criterion across all vendors
   - Which vendors lead and why
   - Key differentiators
   - Overall competitive landscape

6. **Return Rankings**
   - Rankings for all vendors
   - Each vendor gets state: yes/star/no/unknown
   - Updated evidence URLs and comments
   - Total stars awarded (0-2)
   - Criterion insight

### State Mapping from Stage 1 to Stage 2

| Stage 1 Evidence | Stage 2 Likely State | Notes |
|------------------|----------------------|-------|
| confirmed | yes or ⭐ star | Research for competitive advantage |
| mentioned | yes (rarely ⭐) | Less likely for star unless strong comparative evidence |
| unclear | yes, no, or unknown | Research to determine |
| not_found | unknown or no | Only promote if new evidence found |

### Files Involved

**Frontend Service:**
- **`src/services/n8nService.ts`** (lines 924-1033)
  - `rankCriterionResults()` - Calls Stage 2 webhook
  - Timeout: 90 seconds
  - Transforms Stage 1 results to request format

**Orchestration Hook:**
- **`src/hooks/useTwoStageComparison.ts`** (lines 400-520)
  - `runStage2Criterion()` - Executes Stage 2 for one criterion
  - Collects all Stage 1 results
  - Updates all vendor cells with Stage 2 rankings
  - Marks criterion as complete

**n8n Workflow:**
- **`00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_TESTING_AI_Rank_Criterion_Results.json`**
  - Webhook: `/api/v1/rank-criterion-results`
  - AI Agent timeout: 90000ms (90 seconds)
  - OpenAI GPT-4o-mini model
  - Perplexity search tool (max 10 searches)

### Example Request/Response

**Request:**
```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "project_id": "uuid",
  "project_name": "CRM Selection",
  "project_description": "Need CRM with email integration...",
  "project_category": "CRM",
  "criterion": {
    "id": "uuid",
    "name": "API Integration",
    "importance": "high",
    "description": "RESTful API with webhooks"
  },
  "stage1_results": [
    {
      "vendor_id": "uuid-1",
      "vendor_name": "HubSpot",
      "vendor_website": "https://www.hubspot.com",
      "evidence_strength": "confirmed",
      "evidence_url": "https://developers.hubspot.com/docs/api/overview",
      "evidence_description": "Comprehensive REST API...",
      "vendor_site_evidence": "https://developers.hubspot.com/docs/api/overview",
      "third_party_evidence": "https://www.g2.com/products/hubspot-crm/reviews",
      "research_notes": "Found detailed API documentation..."
    },
    {
      "vendor_id": "uuid-2",
      "vendor_name": "Salesforce",
      "vendor_website": "https://www.salesforce.com",
      "evidence_strength": "confirmed",
      "evidence_url": "https://developer.salesforce.com/docs/apis",
      "evidence_description": "Enterprise-grade API...",
      "vendor_site_evidence": "https://developer.salesforce.com/docs/apis",
      "third_party_evidence": "",
      "research_notes": "Extensive API documentation..."
    }
  ],
  "timestamp": "2025-01-28T10:05:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "criterion_id": "uuid",
    "criterion_name": "API Integration",
    "criterion_importance": "high",
    "vendor_rankings": [
      {
        "vendor_id": "uuid-1",
        "vendor_name": "HubSpot",
        "state": "star",
        "evidence_url": "https://www.g2.com/compare/hubspot-crm-vs-salesforce",
        "evidence_description": "HubSpot API rated higher for ease of use and developer experience",
        "comment": "Rated #1 for API developer experience vs Salesforce and Pipedrive per G2 reviews"
      },
      {
        "vendor_id": "uuid-2",
        "vendor_name": "Salesforce",
        "state": "yes",
        "evidence_url": "https://developer.salesforce.com/docs/apis",
        "evidence_description": "Enterprise-grade API with extensive capabilities",
        "comment": "Comprehensive API with robust features for enterprise needs"
      }
    ],
    "criterion_insight": "HubSpot leads in API developer experience with highly-rated documentation and ease of integration. Salesforce offers more comprehensive enterprise features but with steeper learning curve. Both provide robust REST APIs with webhooks.",
    "stars_awarded": 1,
    "search_count": 7
  },
  "timestamp": "2025-01-28T10:06:30Z"
}
```

---

## Match Percentage Calculation

### Algorithm

Match percentage is calculated **client-side** after all comparisons complete.

**`src/utils/vendorComparison.ts`** (lines 1-200)

```typescript
function calculateMatchPercentage(
  scores: Record<string, 'yes' | 'star' | 'no' | 'unknown'>,
  criteria: Array<{ id: string; importance: string; type: string }>,
  vendorName: string
): number {
  // 1. Filter active criteria (non-archived)
  const activeCriteria = criteria.filter(c => c.type !== 'archived');

  // 2. Map scores to points
  const scorePoints = {
    'star': 5,
    'yes': 4,
    'unknown': 3,
    'no': 1
  };

  // 3. Map importance to multipliers
  const importanceMultipliers = {
    'high': 3,
    'medium': 2,
    'low': 1
  };

  // 4. Calculate total points
  let totalPoints = 0;
  let maxPossiblePoints = 0;

  for (const criterion of activeCriteria) {
    const score = scores[criterion.id] || 'unknown';
    const points = scorePoints[score];
    const multiplier = importanceMultipliers[criterion.importance];

    totalPoints += points * multiplier;
    maxPossiblePoints += 5 * multiplier; // 5 is max (star)
  }

  // 5. Calculate percentage
  const percentage = (totalPoints / maxPossiblePoints) * 100;

  // 6. Round to whole number
  return Math.round(percentage);
}
```

### Example Calculation

**Vendor: HubSpot**
**Criteria: 3 criteria**

| Criterion | Importance | Score | Points | Multiplier | Weighted |
|-----------|------------|-------|--------|------------|----------|
| API Integration | high | ⭐ star | 5 | 3 | 15 |
| Mobile App | medium | ✓ yes | 4 | 2 | 8 |
| Reporting | low | ? unknown | 3 | 1 | 3 |
| **Total** | | | | | **26** |

**Max Possible:**
- API Integration (high): 5 × 3 = 15
- Mobile App (medium): 5 × 2 = 10
- Reporting (low): 5 × 1 = 5
- **Total: 30**

**Match Percentage:**
```
(26 / 30) × 100 = 86.67% → 87%
```

### When Calculated

- **After all comparisons complete** - Not during comparison
- **Client-side** - No server call needed
- **Used for sorting** - Vendors sorted by match percentage

**`src/hooks/useVendorTransformation.ts`** (lines 51-132)
- `useVendorTransformation()` hook calls `calculateMatchPercentage()`
- Only sorts by match percentage when `allComparisonsComplete = true`

---

## File Structure & Key Code

### Frontend Files

```
src/
├── components/
│   ├── VendorComparisonNew.tsx         # Main comparison UI (NEW SYSTEM)
│   │   └── Lines 1-800: Component logic, state management, UI rendering
│   │
│   ├── VendorComparison.tsx            # Old comparison UI (LEGACY)
│   │   └── Lines 1-700: Single-stage comparison (deprecated)
│   │
│   └── vendor-comparison/
│       ├── VerticalBarChart.tsx        # Comparison grid/matrix
│       │   ├── Lines 225-250: Component props
│       │   ├── Lines 544-553: Cell-level status rendering
│       │   └── Lines 600-800: Grid rendering logic
│       │
│       ├── CriterionCard.tsx           # Individual criterion card
│       └── VendorCard.tsx              # Individual vendor card
│
├── hooks/
│   ├── useTwoStageComparison.ts        # Two-stage orchestration (NEW)
│   │   ├── Lines 50-100: State types and initialization
│   │   ├── Lines 108: MAX_CONCURRENT_WORKFLOWS = 5
│   │   ├── Lines 116-121: comparisonStateRef setup
│   │   ├── Lines 200-250: initializeCriteria()
│   │   ├── Lines 240-385: runStage1Cell()
│   │   ├── Lines 400-520: runStage2Criterion()
│   │   ├── Lines 550-680: orchestrateComparison()
│   │   ├── Lines 626-650: Concurrency control logic
│   │   ├── Lines 680-720: startComparison()
│   │   ├── Lines 722-730: pauseComparison()
│   │   ├── Lines 732-745: resumeComparison()
│   │   ├── Lines 747-760: resetComparison()
│   │   ├── Lines 762-770: retryVendor()
│   │   └── Lines 772-791: autoStart effect
│   │
│   ├── useVendorComparison.ts          # Old single-stage logic (LEGACY)
│   │   └── Lines 1-400: Legacy comparison hook
│   │
│   ├── useVendorTransformation.ts      # Vendor data transformation
│   │   ├── Lines 51-132: useVendorTransformation()
│   │   ├── Lines 76-80: Match percentage calculation call
│   │   ├── Lines 126-128: Sorting by match percentage
│   │   └── Lines 134-158: useCriteriaTransformation()
│   │
│   └── useCriteriaTransformation.ts    # Criteria transformation
│
├── services/
│   └── n8nService.ts                   # All n8n API calls
│       ├── Lines 39-40: Timeout constants
│       ├── Lines 672-673: Stage 1 & 2 timeouts
│       ├── Lines 794-907: compareVendorCriterion() [Stage 1]
│       ├── Lines 924-1033: rankCriterionResults() [Stage 2]
│       └── Lines 560-666: compareVendor() [LEGACY]
│
├── utils/
│   ├── comparisonStorage.ts            # localStorage utilities
│   │   ├── Lines 83-134: Stage 1 storage functions
│   │   ├── Lines 136-188: Stage 2 storage functions
│   │   ├── Lines 190-242: Comparison state storage
│   │   └── Lines 244-277: Batch operations
│   │
│   └── vendorComparison.ts             # Match percentage calculation
│       └── Lines 1-200: calculateMatchPercentage()
│
└── types/
    ├── vendorComparison.types.ts       # Two-stage types (NEW)
    │   ├── Lines 50-70: ComparisonState
    │   ├── Lines 72-85: CriterionRow
    │   ├── Lines 87-110: CriterionCell
    │   ├── Lines 120-135: Stage1StorageData
    │   └── Lines 137-152: Stage2StorageData
    │
    └── comparison.types.ts             # Comparison-related types
```

### Backend Files (n8n Workflows)

```
00_IMPLEMENTATION/MIGRATING_TO_N8N/
├── Clarioo_TESTING_AI_Compare_Vendor_Criterion.json  [NEW - Stage 1]
│   ├── Line 7: Webhook path definition
│   ├── Line 118-120: AI agent prompt (Stage 1 research)
│   ├── Line 123: timeout: 45000 (45 seconds)
│   ├── Line 127-129: AI agent node configuration
│   ├── Line 166-168: Structured output parser schema
│   └── Line 180: Format success response logic
│
├── Clarioo_TESTING_AI_Rank_Criterion_Results.json    [NEW - Stage 2]
│   ├── Line 7: Webhook path definition
│   ├── Line 120: AI agent prompt (Stage 2 ranking)
│   ├── Line 123: timeout: 90000 (90 seconds)
│   ├── Line 127-129: AI agent node configuration
│   ├── Line 166-168: Structured output parser schema
│   └── Line 180: Format success response logic
│
└── Clarioo_Compare_Vendors.json                      [LEGACY]
    └── Old single-stage comparison workflow (deprecated)
```

---

## Data Flow

### Complete Comparison Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Compare Vendors"                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ VendorComparisonNew.tsx loads                               │
│   - Renders comparison grid                                 │
│   - Calls useTwoStageComparison hook                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ useTwoStageComparison() initializes                         │
│   - initializeCriteria() creates state structure            │
│   - Creates cells for each vendor × criterion               │
│   - All cells start with status='pending'                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ autoStart effect triggers                                   │
│   - Checks if criteria initialized                          │
│   - Calls startComparison()                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ orchestrateComparison() begins                              │
│   - Loops through criteria                                  │
│   - For each criterion, loops through vendors               │
└─────────────────────────────────────────────────────────────┘
                          ↓
         ┌────────────────┴────────────────┐
         ↓                                  ↓
┌──────────────────────┐         ┌──────────────────────┐
│ STAGE 1: Cell Research         │ (For each vendor)    │
└──────────────────────┘         └──────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Concurrency Check                                           │
│   while (activeWorkflowsRef.current >= 5)                   │
│     wait 100ms                                              │
│     if (paused or aborted) break                            │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Mark Cell as Loading (BEFORE async call)                    │
│   setComparisonState(prev => ({                             │
│     ...prev,                                                │
│     criteria: {                                             │
│       [criterion.id]: {                                     │
│         cells: {                                            │
│           [vendor.id]: { status: 'loading' }                │
│         }                                                   │
│       }                                                     │
│     }                                                       │
│   }))                                                       │
│   activeWorkflowsRef.current++                             │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ runStage1Cell()                                             │
│   - POST to n8n Stage 1 webhook                             │
│   - Timeout: 45 seconds                                     │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ n8n Stage 1 Workflow                                        │
│   1. Validate input (vendor_id, criterion_id)               │
│   2. AI searches vendor website (site: search)              │
│   3. AI searches third-party sources (G2, Reddit)           │
│   4. Classify evidence strength                             │
│   5. Return evidence data                                   │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Update Cell with Stage 1 Result                             │
│   - Store evidence data                                     │
│   - Mark status='completed'                                 │
│   - Decrement activeWorkflowsRef.current                    │
│   - Save to localStorage: stage1_results_{projectId}        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Check if All Vendors Complete Stage 1 for Criterion         │
│   const allComplete = vendors.every(v =>                    │
│     cell[v.id]?.status === 'completed'                      │
│   )                                                         │
└─────────────────────────────────────────────────────────────┘
         ↓ (if allComplete)
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Comparative Ranking                                │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ runStage2Criterion()                                        │
│   - Collect all Stage 1 results for criterion               │
│   - POST to n8n Stage 2 webhook                             │
│   - Timeout: 90 seconds                                     │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ n8n Stage 2 Workflow                                        │
│   1. Validate input (criterion_id, stage1_results)          │
│   2. Review Stage 1 evidence for all vendors                │
│   3. Conduct comparative research (A vs B)                  │
│   4. Award up to 2 stars for competitive advantage          │
│   5. Generate criterion insight                             │
│   6. Return rankings for all vendors                        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Update All Vendor Cells with Stage 2 Rankings               │
│   - Update scores (yes/star/no/unknown)                     │
│   - Update evidence URLs and comments                       │
│   - Mark criterion as 'completed'                           │
│   - Save to localStorage: stage2_results_{projectId}        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Move to Next Criterion                                      │
│   - Repeat Stage 1 → Stage 2 for next criterion             │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ All Criteria Complete                                       │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Calculate Match Percentages (Client-side)                   │
│   - For each vendor, calculate weighted score               │
│   - Score points: star=5, yes=4, unknown=3, no=1            │
│   - Importance multipliers: high=3, medium=2, low=1         │
│   - Percentage = (totalPoints / maxPoints) × 100            │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Sort Vendors by Match Percentage                            │
│   - Highest match percentage first                          │
│   - Display final results                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Storage Strategy

### localStorage Keys

| Key | Purpose | Format | When Saved | When Cleared |
|-----|---------|--------|------------|--------------|
| `stage1_results_{projectId}` | Stage 1 evidence data | `{ projectId, results: {...}, timestamp }` | After each cell completes | Regenerate |
| `stage2_results_{projectId}` | Stage 2 rankings | `{ projectId, results: {...}, timestamp }` | After each criterion completes | Regenerate |
| `comparison_state_{projectId}` | Orchestration state | `{ criteria, activeWorkflows, isPaused }` | On pause, periodically | Regenerate |
| `compared_vendors_{projectId}` | Legacy results | `Record<vendorId, ComparisonState>` | After comparison (old) | Regenerate |

### Storage Utilities

**`src/utils/comparisonStorage.ts`**

**Stage 1 Storage:**
```typescript
// Load Stage 1 results (lines 90-109)
loadStage1Results(projectId: string): Stage1StorageData | null

// Save Stage 1 results (lines 115-122)
saveStage1Results(data: Stage1StorageData): void

// Clear Stage 1 results (lines 127-134)
clearStage1Results(projectId: string): void
```

**Stage 2 Storage:**
```typescript
// Load Stage 2 results (lines 144-163)
loadStage2Results(projectId: string): Stage2StorageData | null

// Save Stage 2 results (lines 169-176)
saveStage2Results(data: Stage2StorageData): void

// Clear Stage 2 results (lines 181-188)
clearStage2Results(projectId: string): void
```

**Comparison State Storage:**
```typescript
// Load comparison state (lines 198-217)
loadComparisonState(projectId: string): ComparisonState | null

// Save comparison state (lines 223-230)
saveComparisonState(projectId: string, state: ComparisonState): void

// Clear comparison state (lines 235-242)
clearComparisonState(projectId: string): void
```

**Batch Operations:**
```typescript
// Clear all comparison data (lines 252-258)
clearAllComparisonData(projectId: string): void
// Clears: compared_vendors, stage1_results, stage2_results, comparison_state

// Check if data exists (lines 264-276)
hasComparisonData(projectId: string): {
  legacy: boolean;
  stage1: boolean;
  stage2: boolean;
  state: boolean;
}
```

### When to Save/Clear

**Save:**
- After each Stage 1 cell completes → Save stage1_results
- After each Stage 2 criterion completes → Save stage2_results
- When user pauses → Save comparison_state
- Periodically during comparison → Save comparison_state

**Clear:**
- User clicks "Regenerate" → `clearAllComparisonData()`
- Vendor list changes → Clear all comparison data
- Criteria are modified → Clear all comparison data

---

## Concurrency Control

### The Challenge

**Problem:**
- 5 vendors × 17 criteria = 85 cells to research
- Without limits: All 85 would start simultaneously
- Result: Server overload, rate limiting, poor UX

**Solution:**
- Maximum 5 concurrent workflows (MAX_CONCURRENT_WORKFLOWS = 5)
- Wait-based queue system
- Cell status tracking prevents race conditions

### Implementation

**`src/hooks/useTwoStageComparison.ts`** (lines 626-650)

```typescript
// Concurrency control loop
for (const vendor of vendors) {
  // Read latest cell status from ref
  const latestCriterionRow = comparisonStateRef.current.criteria[criterion.id];
  const cell = latestCriterionRow?.cells[vendor.id];

  // Skip if already completed or loading
  if (cell?.status === 'completed' || cell?.status === 'loading') {
    continue;
  }

  // Wait if we hit the concurrency limit
  while (activeWorkflowsRef.current >= MAX_CONCURRENT_WORKFLOWS) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms

    // Check if user paused or aborted
    if (abortRef.current || comparisonStateRef.current.isPaused) break;
  }

  if (abortRef.current || comparisonStateRef.current.isPaused) break;

  // Mark cell as loading BEFORE starting workflow
  setComparisonState(prev => ({
    ...prev,
    criteria: {
      ...prev.criteria,
      [criterion.id]: {
        ...prev.criteria[criterion.id],
        cells: {
          ...prev.criteria[criterion.id].cells,
          [vendor.id]: {
            status: 'loading',
          },
        },
      },
    },
    activeWorkflows: activeWorkflowsRef.current + 1,
  }));

  // Increment active workflows BEFORE starting
  activeWorkflowsRef.current++;

  // Start the workflow (don't await immediately)
  const promise = runStage1Cell(criterion.id, vendor.id, criterion, vendor);
  runningPromises.set(vendor.id, promise);

  // Remove from running promises when complete
  promise.finally(() => {
    runningPromises.delete(vendor.id);
  });
}
```

### Race Condition Fixes

**Problem 1: Stale Closure State**
- `orchestrateComparison()` runs in async loop
- State updates don't propagate to closure
- Multiple cells see status='pending' and all start

**Solution:**
```typescript
// Use ref to access latest state (lines 116-121)
const comparisonStateRef = useRef(comparisonState);

useEffect(() => {
  comparisonStateRef.current = comparisonState;
}, [comparisonState]);

// Read from ref on each iteration (line 629)
const cell = comparisonStateRef.current.criteria[criterion.id]?.cells[vendor.id];
```

**Problem 2: Status Updated After Async Call**
- Cell status set to 'loading' inside runStage1Cell()
- By then, next iteration already checked status='pending'
- Result: Multiple cells start before any marked as loading

**Solution:**
```typescript
// Mark as loading BEFORE async call (lines 632-648)
setComparisonState(prev => ({
  ...prev,
  criteria: {
    [criterion.id]: {
      cells: {
        [vendor.id]: { status: 'loading' }
      }
    }
  }
}));

// Increment BEFORE async call (line 651)
activeWorkflowsRef.current++;

// THEN start workflow (line 654)
runStage1Cell(...);
```

**Problem 3: AutoStart Race Condition**
- autoStart effect runs on mount
- Criteria not yet initialized (empty object)
- orchestrateComparison() runs with no criteria

**Solution:**
```typescript
// Check if criteria initialized (lines 772-791)
useEffect(() => {
  const hasCriteria = Object.keys(comparisonState.criteria).length > 0;

  if (autoStart && !isRunning && !comparisonState.isPaused && hasCriteria) {
    console.log('[autoStart] Starting comparison');
    startComparison();
  } else if (autoStart && !hasCriteria) {
    console.log('[autoStart] Skipping - criteria not initialized yet');
  }
}, [autoStart, comparisonState.criteria]); // Re-run when criteria initialize
```

### Visual Representation

**Correct Behavior (with fixes):**
```
Time 0ms:
  activeWorkflowsRef = 0
  Check: 0 < 5 ✓
  Mark Cell A as 'loading'
  activeWorkflowsRef = 1
  Start Cell A workflow

Time 10ms:
  activeWorkflowsRef = 1
  Check: 1 < 5 ✓
  Read from ref: Cell A status = 'loading' (skip)
  Mark Cell B as 'loading'
  activeWorkflowsRef = 2
  Start Cell B workflow

...continues until 5 workflows active...

Time 50ms:
  activeWorkflowsRef = 5
  Check: 5 < 5 ✗
  Wait 100ms...

Time 150ms:
  activeWorkflowsRef = 5 (still)
  Wait 100ms...

Time 250ms:
  activeWorkflowsRef = 4 (Cell A completed)
  Check: 4 < 5 ✓
  Mark Cell F as 'loading'
  activeWorkflowsRef = 5
  Start Cell F workflow
```

---

## Pause/Resume/Retry

### Pause Comparison

**User Action:** Click "Pause" button

**What Happens:**
1. Set `isPaused = true`
2. Set `abortRef.current = true`
3. Currently running workflows finish
4. No new workflows start (concurrency loop checks `abortRef`)
5. State saved to localStorage

**Code:**
```typescript
// src/hooks/useTwoStageComparison.ts (lines 722-730)
const pauseComparison = () => {
  console.log('[pauseComparison] Pausing comparison');
  setComparisonState(prev => ({ ...prev, isPaused: true }));
  abortRef.current = true;
};
```

**Visual:**
```
Before Pause:
[🔄🔄🔄🔄🔄] ← 5 running
[⏳⏳⏳⏳⏳] ← pending
[⏳⏳⏳⏳⏳]

After Pause (few seconds later):
[✓ ✓ ✓ ✓ ✓] ← 5 finished
[⏳⏳⏳⏳⏳] ← still pending (not started)
[⏳⏳⏳⏳⏳]
```

### Resume Comparison

**User Action:** Click "Resume" button

**What Happens:**
1. Set `isPaused = false`
2. Set `abortRef.current = false`
3. Call `startComparison()` to resume
4. Orchestration continues with pending cells

**Code:**
```typescript
// src/hooks/useTwoStageComparison.ts (lines 732-745)
const resumeComparison = () => {
  console.log('[resumeComparison] Resuming comparison');
  setComparisonState(prev => ({ ...prev, isPaused: false }));
  abortRef.current = false;
  startComparison();
};
```

**Visual:**
```
After Resume:
[✓ ✓ ✓ ✓ ✓] ← already done (skipped)
[🔄🔄🔄🔄🔄] ← new 5 start
[⏳⏳⏳⏳⏳]
```

### Regenerate (Full Reset)

**User Action:** Click "Regenerate" button

**What Happens:**
1. Call `resetComparison()` to clear all data
2. Clear all localStorage (stage1, stage2, state)
3. Re-initialize criteria structure
4. All cells reset to status='pending'
5. Call `startComparison()` to begin fresh

**Code:**
```typescript
// src/hooks/useTwoStageComparison.ts (lines 747-760)
const resetComparison = () => {
  console.log('[resetComparison] Resetting comparison');

  // Clear all localStorage
  clearAllComparisonData(projectId);

  // Reset to initial state
  const initialState = initializeCriteria(vendors, criteria);
  setComparisonState(initialState);
  comparisonStateRef.current = initialState;
};

// In VendorComparisonNew.tsx
const handleRegenerate = () => {
  resetComparison();
  setTimeout(() => startComparison(), 100);
};
```

### Retry Individual Vendor

**User Action:** Click retry icon on vendor card

**What Happens:**
1. Find all cells for this vendor
2. Reset cells to status='pending'
3. Re-run Stage 1 for all criteria
4. Re-run Stage 2 after Stage 1 completes

**Code:**
```typescript
// src/hooks/useTwoStageComparison.ts (lines 762-770)
const retryVendor = (vendorId: string) => {
  console.log('[retryVendor] Retrying vendor:', vendorId);

  // Reset all cells for this vendor to pending
  setComparisonState(prev => {
    const updatedCriteria = { ...prev.criteria };

    Object.keys(updatedCriteria).forEach(criterionId => {
      if (updatedCriteria[criterionId].cells[vendorId]) {
        updatedCriteria[criterionId].cells[vendorId] = {
          vendorId,
          status: 'pending',
        };
      }
    });

    return { ...prev, criteria: updatedCriteria };
  });

  // Restart comparison
  startComparison();
};
```

---

## UI Updates & Cell Status

### Cell Status States

```typescript
type CellStatus = 'pending' | 'loading' | 'completed' | 'failed';
```

| Status | Icon | Meaning |
|--------|------|---------|
| pending | ⏳ | Waiting to start |
| loading | 🔄 | Research in progress |
| completed | ✓ / ⭐ / ? / ✗ | Research complete |
| failed | ⚠️ | Error occurred |

### Vendor-Level vs Cell-Level Status

**Problem (Old System):**
- VerticalBarChart used `vendor.comparisonStatus`
- Vendor-level status applies to ALL cells for that vendor
- If ANY cell loading → ALL 17 cells show spinners
- User sees all 85 cells spinning (incorrect)

**Solution (New System):**
- Each cell has independent status
- UI reads from `comparisonState.criteria[criterionId].cells[vendorId].status`
- Only cells actually being researched show spinners
- User sees exactly 5 spinners (correct)

### Implementation

**`src/components/vendor-comparison/VerticalBarChart.tsx`** (lines 544-553)

```typescript
{activeVendors.map((vendor, vendorIndex) => {
  const state = vendor.scores.get(criterion.id) ?? 'unknown';
  const hasScoreDetails = vendor.scoreDetails && vendor.scoreDetails[criterion.id];

  // Get cell-level status from comparisonState
  const cellStatus = comparisonState?.criteria[criterion.id]?.cells[vendor.id]?.status;

  // Fall back to vendor-level if cell-level not available
  const comparisonStatus = cellStatus || vendor.comparisonStatus;

  const errorCode = vendor.comparisonErrorCode;
  const isFailed = comparisonStatus === 'failed';

  return (
    <CriterionCell
      key={vendor.id}
      state={state}
      isLoading={comparisonStatus === 'loading'}  // ← Only true if THIS cell loading
      isFailed={isFailed}
      // ...
    />
  );
})}
```

**Props Passed:**
```typescript
// VendorComparisonNew.tsx passes comparisonState
<VerticalBarChart
  vendors={vendors}
  criteria={criteria}
  comparisonState={comparisonState}  // ← Cell-level status
  // ...
/>
```

### Visual Comparison

**Before (vendor-level status):**
```
HubSpot    Salesforce  Pipedrive
🔄🔄🔄      🔄🔄🔄       🔄🔄🔄    ← All cells spinning if vendor loading
```

**After (cell-level status):**
```
HubSpot    Salesforce  Pipedrive
✓ 🔄⏳      🔄✓ ⏳       🔄⏳⏳    ← Only 5 cells spinning (max concurrent)
```

---

## Configuration

### Timeouts

| Operation | Frontend Timeout | n8n Timeout | File |
|-----------|------------------|-------------|------|
| Stage 1 Cell | 45000ms (45s) | 45000ms (45s) | n8nService.ts:672<br/>Clarioo_TESTING_AI_Compare_Vendor_Criterion.json:123 |
| Stage 2 Ranking | 90000ms (90s) | 90000ms (90s) | n8nService.ts:673<br/>Clarioo_TESTING_AI_Rank_Criterion_Results.json:123 |

### Concurrency

| Setting | Value | File | Line |
|---------|-------|------|------|
| MAX_CONCURRENT_WORKFLOWS | 5 | useTwoStageComparison.ts | 108 |

### Webhook URLs

**Defined in `src/config/webhooks.ts`:**

```typescript
const N8N_BASE_URL = 'https://n8n.lakestrom.com';

// Stage 1: Individual vendor-criterion research
export const getCompareVendorCriterionUrl = () =>
  `${N8N_BASE_URL}/webhook/compare-vendor-criterion`;

// Stage 2: Comparative ranking and star allocation
export const getRankCriterionResultsUrl = () =>
  `${N8N_BASE_URL}/webhook/rank-criterion-results`;
```

### AI Model Configuration

**n8n Workflows:**
- Model: OpenAI GPT-4o-mini
- Temperature: 0.2 (consistent results)
- Max Tokens:
  - Stage 1: 4000
  - Stage 2: 6000

**Search Tool:**
- Perplexity AI
- Max searches:
  - Stage 1: 5 searches
  - Stage 2: 10 searches

---

## Old vs New System

### Old System (VendorComparison.tsx)

**Architecture:**
- **Single-stage** - One n8n call per vendor
- **All criteria at once** - Research all 17 criteria in one request
- **Vendor-level status** - All cells show same status
- **No progressive loading** - Wait for entire vendor to complete
- **3-minute timeout** - Long wait per vendor
- **No comparative analysis** - No stars, no competitive advantage

**Workflow:**
```
User clicks "Compare Vendors"
  ↓
For each vendor (sequentially or parallel):
  ├─ Send vendor + all criteria to n8n
  ├─ Wait 3 minutes
  ├─ Receive all scores (yes/no/unknown)
  └─ Display results

Total time: 3 min × 5 vendors = 15 minutes (sequential)
```

**Files:**
- Frontend: `src/components/VendorComparison.tsx`
- Hook: `src/hooks/useVendorComparison.ts`
- Service: `src/services/n8nService.ts` (compareVendor - lines 560-666)
- Workflow: `00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_Compare_Vendors.json`
- Storage: `compared_vendors_{projectId}`

**Limitations:**
- All-or-nothing per vendor (no partial results)
- Long wait times (3+ minutes per vendor)
- No cell-level granularity (can't see progress)
- No competitive advantage identification (no stars)
- Poor error handling (entire vendor fails)
- No pause/resume

### New System (VendorComparisonNew.tsx)

**Architecture:**
- **Two-stage** - Stage 1 (evidence) → Stage 2 (ranking)
- **Cell-by-cell** - Research one vendor-criterion at a time
- **Cell-level status** - Each cell has independent status
- **Progressive loading** - Results appear as they complete
- **45s/90s timeouts** - Faster feedback
- **Comparative analysis** - Stars awarded based on competitive advantage

**Workflow:**
```
User clicks "Compare Vendors"
  ↓
Stage 1: For each criterion
  ├─ For each vendor (max 5 concurrent):
  │  ├─ Send vendor + criterion to n8n
  │  ├─ Wait 45 seconds
  │  ├─ Receive evidence data
  │  └─ Display score
  └─ When all vendors complete → Stage 2
  ↓
Stage 2: For criterion
  ├─ Collect all Stage 1 results
  ├─ Send to n8n for comparative analysis
  ├─ Wait 90 seconds
  ├─ Receive rankings + stars
  └─ Update all vendor cells

Total time: ~5-10 minutes (with concurrency)
First results: ~1 minute (progressive)
```

**Files:**
- Frontend: `src/components/VendorComparisonNew.tsx`
- Hook: `src/hooks/useTwoStageComparison.ts`
- Service: `src/services/n8nService.ts` (compareVendorCriterion, rankCriterionResults)
- Workflows:
  - `00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_TESTING_AI_Compare_Vendor_Criterion.json`
  - `00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_TESTING_AI_Rank_Criterion_Results.json`
- Storage: `stage1_results_{projectId}`, `stage2_results_{projectId}`, `comparison_state_{projectId}`

**Advantages:**
- ✅ Faster time to first result (~1 min vs 3 min)
- ✅ Better UX (progress visible cell-by-cell)
- ✅ More accurate (focused research per cell)
- ✅ Competitive advantage identification (stars)
- ✅ Pause/resume capability
- ✅ Individual cell retry
- ✅ Better error handling (cell-level)
- ✅ Concurrency control (5 max)
- ✅ Cell-level status tracking

---

## Debugging Guide

### Console Logging

**Key Log Prefixes:**
- `[n8n-stage1]` - Stage 1 cell research (service layer)
- `[n8n-stage2]` - Stage 2 criterion ranking (service layer)
- `[Stage1]` - Stage 1 orchestration (hook layer)
- `[Stage2]` - Stage 2 orchestration (hook layer)
- `[orchestrateComparison]` - Main orchestration loop
- `[autoStart]` - Auto-start logic

**Example Log Flow:**
```
[autoStart] Effect triggered: { autoStart: true, isRunning: false, hasCriteria: true }
[autoStart] Starting comparison with 17 criteria

[orchestrateComparison] Starting orchestration for 5 vendors × 17 criteria

[orchestrateComparison] Checking concurrency: { active: 0, max: 5, vendor: 'HubSpot' }
[orchestrateComparison] Starting cell: { vendor: 'HubSpot', criterion: 'API Integration' }
[n8n-stage1] Starting research: HubSpot - API Integration

[orchestrateComparison] Checking concurrency: { active: 1, max: 5, vendor: 'Salesforce' }
[orchestrateComparison] Starting cell: { vendor: 'Salesforce', criterion: 'API Integration' }
[n8n-stage1] Starting research: Salesforce - API Integration

... (continues until 5 active) ...

[orchestrateComparison] Waiting for slot: { active: 5, vendor: 'Pipedrive' }
[orchestrateComparison] Waiting for slot: { active: 5, vendor: 'Pipedrive' }

[Stage1] Cell completed: { vendor: 'HubSpot', criterion: 'API Integration', activeWorkflows: 4 }
[n8n-stage1] Result: { success: true, evidence_strength: 'confirmed' }

[orchestrateComparison] Starting cell: { vendor: 'Pipedrive', criterion: 'API Integration' }
[n8n-stage1] Starting research: Pipedrive - API Integration

... (all vendors complete Stage 1) ...

[Stage1] All cells complete for criterion: API Integration
[Stage2] Starting ranking for criterion: API Integration
[n8n-stage2] Starting ranking for criterion: API Integration
[n8n-stage2] Vendors to rank: 5

[Stage2] Criterion completed: { criterion: 'API Integration', stars_awarded: 1 }

... (continues for all criteria) ...

[orchestrateComparison] All criteria complete
```

### Common Issues

**Issue 1: All cells spinning simultaneously**
- **Symptom:** UI shows all 85 cells with spinners
- **Cause:** Using vendor-level status instead of cell-level
- **Check:** VerticalBarChart using `comparisonState?.criteria[criterionId]?.cells[vendorId]?.status`
- **File:** `src/components/vendor-comparison/VerticalBarChart.tsx:549`

**Issue 2: "Available criteria in ref: []"**
- **Symptom:** Console shows empty criteria in ref
- **Cause:** AutoStart running before criteria initialized
- **Check:** AutoStart checks `Object.keys(comparisonState.criteria).length > 0`
- **File:** `src/hooks/useTwoStageComparison.ts:772-791`

**Issue 3: More than 5 cells loading**
- **Symptom:** More than 5 spinners visible
- **Cause:** Race condition - cell status updated after async call
- **Check:** Cell marked as 'loading' BEFORE runStage1Cell() call
- **File:** `src/hooks/useTwoStageComparison.ts:632-648`

**Issue 4: Frontend timeout errors**
- **Symptom:** Cells fail with "Request timeout"
- **Cause:** n8n taking longer than frontend timeout
- **Check:** Frontend timeout >= n8n timeout
- **Files:**
  - Frontend: `src/services/n8nService.ts:672-673`
  - n8n: `Clarioo_TESTING_AI_*.json:123`

**Issue 5: n8n returns "Invalid AI response"**
- **Symptom:** 500 error with "missing vendor_id or criterion_id"
- **Cause:** AI returning markdown-wrapped JSON or not following schema
- **Check:** n8n execution logs at https://n8n.lakestrom.com
- **File:** `Clarioo_TESTING_AI_Compare_Vendor_Criterion.json:180`

### Testing Checklist

**1. Basic Flow:**
- [ ] Comparison auto-starts on mount
- [ ] Max 5 cells show spinners at once
- [ ] Results appear progressively
- [ ] Match percentages calculated correctly
- [ ] Vendors sorted by match percentage

**2. Concurrency:**
- [ ] Never more than 5 active workflows
- [ ] 6th workflow waits for slot
- [ ] activeWorkflowsRef decrements on completion
- [ ] New workflows start when slots available

**3. Pause/Resume:**
- [ ] Pause stops new workflows
- [ ] Running workflows complete
- [ ] Resume continues with pending cells
- [ ] State persists across pause/resume

**4. Regenerate:**
- [ ] All localStorage cleared
- [ ] State reset to initial
- [ ] Comparison restarts from scratch
- [ ] All cells reset to pending

**5. Error Handling:**
- [ ] Failed cells show error icon
- [ ] Retry vendor resets all cells for vendor
- [ ] Error messages displayed
- [ ] Failed cells don't block others

**6. Storage:**
- [ ] Stage 1 results saved after each cell
- [ ] Stage 2 results saved after each criterion
- [ ] Comparison state saved on pause
- [ ] Data survives page refresh

### Debugging Commands

**Check localStorage:**
```javascript
// In browser console
const projectId = 'your-project-id';

// Check Stage 1 results
JSON.parse(localStorage.getItem(`stage1_results_${projectId}`));

// Check Stage 2 results
JSON.parse(localStorage.getItem(`stage2_results_${projectId}`));

// Check comparison state
JSON.parse(localStorage.getItem(`comparison_state_${projectId}`));
```

**Clear all data:**
```javascript
// Clear all comparison data
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Monitor active workflows:**
```javascript
// In useTwoStageComparison hook (add console.log)
useEffect(() => {
  console.log('[DEBUG] Active workflows:', activeWorkflowsRef.current);
  console.log('[DEBUG] Comparison state:', comparisonState);
}, [comparisonState]);
```

---

## Summary

**The Two-Stage Vendor Comparison System:**

1. **Stage 1** - Researches individual vendor-criterion cells (45s each)
2. **Stage 2** - Conducts comparative analysis per criterion (90s each)
3. **Progressive Loading** - Results appear cell-by-cell as they complete
4. **Concurrency Control** - Max 5 parallel workflows to prevent overload
5. **Cell-Level Status** - Each cell has independent status and spinner
6. **Match Percentage** - Calculated client-side with weighted scoring
7. **Stars** - Awarded to vendors with exceptional competitive advantage
8. **Pause/Resume** - Full control over comparison process
9. **Retry** - Individual vendor retry capability
10. **Storage** - localStorage persistence for pause/resume across sessions

**Key Files:**
- `src/components/VendorComparisonNew.tsx` - Main UI
- `src/hooks/useTwoStageComparison.ts` - Orchestration engine
- `src/services/n8nService.ts` - n8n API calls
- `src/components/vendor-comparison/VerticalBarChart.tsx` - Grid display
- `src/utils/comparisonStorage.ts` - localStorage utilities
- `src/utils/vendorComparison.ts` - Match percentage calculation

**n8n Workflows:**
- Stage 1: `Clarioo_TESTING_AI_Compare_Vendor_Criterion.json`
- Stage 2: `Clarioo_TESTING_AI_Rank_Criterion_Results.json`

---

**Document Version:** 2.0
**Last Updated:** 2025-01-28
**System Version:** SP_018 (Two-Stage Progressive Comparison)
