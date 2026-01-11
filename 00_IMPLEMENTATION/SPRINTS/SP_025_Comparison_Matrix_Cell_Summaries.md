# Sprint 25: Comparison Matrix Cell Summaries

**Sprint ID**: SP_025
**Type**: Enhancement - Comparison Matrix Scannability
**Status**: 📋 PLANNED
**Estimated Duration**: 2-3 days
**Date Created**: January 10, 2026
**Phase**: Phase 1 - n8n AI Integration (Enhancement)
**Previous Sprint**: [SP_024_Battlecards_10_Row_Expansion.md](./SP_024_Battlecards_10_Row_Expansion.md)

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Objectives](#objectives)
4. [Detailed Requirements](#detailed-requirements)
5. [Implementation Plan](#implementation-plan)
6. [Files to Modify](#files-to-modify)
7. [Testing Requirements](#testing-requirements)
8. [Acceptance Criteria](#acceptance-criteria)

---

## Executive Summary

**Purpose**: Add AI-generated 2-3 word summaries under ✓/⭐ icons in comparison matrix cells to improve scannability without requiring users to click and read full explanations.

**Key Changes**:
- **New n8n workflow**: `Clarioo_AI_Summarize_Criterion_Row` for intelligent summarization
- **Automatic trigger**: After Stage 2 completes for each criterion row
- **Smart selection**: AI decides which cells get summaries (not all cells)
- **UI enhancement**: Display summary in small grey text under match icon
- **Storage**: Persist summaries in localStorage alongside Stage 2 results

**Business Value**:
- **Faster decision-making**: Users see key differentiators at a glance
- **Reduced clicks**: Important context visible without opening full popup
- **Better UX**: Matrix becomes more scannable while retaining detail
- **Intelligent curation**: AI only shows summaries when meaningful

**Example**:
```
Before (cell content):
  ✓

After (cell content):
  ✓
  Real-time omnichannel inventory
  ^^^^^^^^ (grey, 2-3 words)
```

**Non-Goals**:
- ❌ Summarize NO matches (only YES/PARTIAL)
- ❌ Add manual "Generate Summaries" button
- ❌ Change existing cell click behavior (popup still works)
- ❌ Modify Stage 1 or Stage 2 workflows

---

## Current State Analysis

### Existing Two-Stage Comparison System

**Location**: `src/hooks/useTwoStageComparison.ts`

**Current Flow**:
1. **Stage 1**: Individual vendor × criterion research (parallel)
   - Result: `evidenceDescription`, `researchNotes`, match status (YES/NO/PARTIAL)
2. **Stage 2**: Comparative ranking with star allocation (per criterion)
   - Result: `criterionInsight`, stars awarded, updated evidence

**Stage 2 Completion Detection**:
```typescript
// CriterionRowState (src/types/vendorComparison.types.ts:34-42)
export interface CriterionRowState {
  criterionId: string;
  stage1Complete: boolean;
  stage2Status: 'pending' | 'loading' | 'completed' | 'failed'; // ← Trigger point
  stage2Error?: string;
  cells: Record<string, CellState>; // vendorId -> CellState
  criterionInsight?: string;
  starsAwarded?: number;
}
```

### Current Cell State Structure

**Location**: `src/types/vendorComparison.types.ts:10-29`

```typescript
export interface CellState {
  status: 'pending' | 'loading' | 'completed' | 'failed';
  value?: 'yes' | 'no' | 'unknown' | 'star';

  // Evidence from Stage 1
  evidenceUrl?: string;
  evidenceDescription?: string;
  vendorSiteEvidence?: string;
  thirdPartyEvidence?: string;
  researchNotes?: string;

  // Currently NO summary field ← TO ADD

  error?: string;
  errorCode?: string;
  retryCount?: number;
}
```

### Current UI (Comparison Matrix Cells)

**Location**: `src/components/vendor-comparison/ComparisonMatrix.tsx` (estimated)

**Current Rendering**:
- Icon only: ✓ (YES) / ⭐ (PARTIAL) / ✗ (NO)
- Click opens popup with full `evidenceDescription`
- No summary text visible

---

## Objectives

### Primary Goals
1. ✅ **Create n8n summarization workflow** (PRODUCTION + TESTING)
2. ✅ **Add `summary` field** to `CellState` type
3. ✅ **Trigger summarization** automatically after Stage 2 completes
4. ✅ **Update UI** to display summaries under icons
5. ✅ **Persist summaries** in localStorage with Stage 2 results

### Secondary Goals
6. ✅ **Handle empty summaries gracefully** (no visual artifact if AI returns null)
7. ✅ **Ensure strict 3-word limit** via n8n prompt engineering
8. ✅ **Add retry logic** for summarization failures
9. ✅ **Document AI decision criteria** for meaningful summaries

---

## Detailed Requirements

### n8n Workflow Design

#### Workflow Name
- **PRODUCTION**: `Clarioo_AI_Summarize_Criterion_Row_PRODUCTION.json`
- **TESTING**: `Clarioo_AI_Summarize_Criterion_Row_TESTING.json`

#### Input (Row-Level Processing)

```typescript
interface SummarizeRowRequest {
  user_id: string;
  session_id: string;
  project_id: string;
  criterion_id: string;
  criterion_name: string;
  criterion_explanation: string;
  vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    match_status: 'yes' | 'no' | 'unknown' | 'star';
    evidence_description: string; // From Stage 1
    research_notes: string;       // From Stage 1
  }>;
  timestamp: string;
}
```

**Example Request**:
```json
{
  "user_id": "...",
  "session_id": "...",
  "project_id": "...",
  "criterion_id": "crit_001",
  "criterion_name": "Real-time Inventory Visibility",
  "criterion_explanation": "Platform provides live inventory tracking across all channels",
  "vendors": [
    {
      "vendor_id": "vendor_001",
      "vendor_name": "NewStore",
      "match_status": "yes",
      "evidence_description": "The platform displays comprehensive product information and real-time inventory data synced with ERP systems, allowing visibility across all locations. [Stage 2 Update] Seamless omnichannel experience vs OneStock per G2 reviews"
    },
    {
      "vendor_id": "vendor_002",
      "vendor_name": "OneStock",
      "match_status": "star",
      "evidence_description": "Real-time stock visibility across stores and warehouses with automatic synchronization. [Stage 2 Update] Best-in-class for multi-location retail per Gartner"
    }
  ],
  "timestamp": "2026-01-10T12:00:00.000Z"
}
```

#### Output (Per-Vendor Summaries)

```typescript
interface SummarizeRowResponse {
  success: boolean;
  criterion_id: string;
  summaries: Record<string, string | null>; // vendor_id -> summary (max 3 words) or null
  timestamp: string;
}
```

**Example Response**:
```json
{
  "success": true,
  "criterion_id": "crit_001",
  "summaries": {
    "vendor_001": "Real-time omnichannel inventory",
    "vendor_002": "Multi-location stock sync",
    "vendor_003": null
  },
  "timestamp": "2026-01-10T12:00:05.000Z"
}
```

**AI Decision Logic** (embedded in n8n prompt):
- **Return summary ONLY if**:
  - Match status is YES or PARTIAL (⭐)
  - Evidence description contains substantial differentiating information
  - Summary would add value beyond the icon itself
  - **Summary is meaningful on its own** (comprehensible without reading full evidence)
- **Return `null` if**:
  - Match status is NO or UNKNOWN
  - Evidence is generic/vague (e.g., "Supports inventory tracking")
  - Information doesn't differentiate this vendor meaningfully
  - Summary would just be keyword extraction without standalone meaning

#### n8n Workflow Prompt (Key Sections)

**System Message**:
```
You are a vendor comparison analyst specializing in creating ultra-concise summaries.

Your task: Given evidence for multiple vendors on a single criterion, generate 2-3 word summaries that highlight key differentiators.

STRICT RULES:
- Maximum 3 words per summary (enforced)
- Only summarize YES/PARTIAL matches
- Return null if information is generic or not meaningful
- Focus on specific capabilities, not marketing language
- Summaries must be MEANINGFUL ON THEIR OWN (comprehensible without reading full evidence)
- Summaries must be scannable at a glance

Example transformations:
✓ "Real-time inventory tracking across 500+ stores with predictive restocking" → "Real-time predictive restocking"
✓ "GDPR compliant with EU data residency and encryption at rest" → "EU residency encrypted"
✓ "Supports basic inventory management" → null (too generic)
✓ "Best-in-class omnichannel experience per Gartner" → "Gartner-rated omnichannel experience"
```

**User Prompt Template**:
```
CRITERION: {{ $json.criterion_name }}
CRITERION EXPLANATION: {{ $json.criterion_explanation }}

For each vendor below, decide if a 2-3 word summary would be meaningful:

{% for vendor in $json.vendors %}
VENDOR: {{ vendor.vendor_name }}
MATCH STATUS: {{ vendor.match_status }}
EVIDENCE: {{ vendor.evidence_description }}

{% if vendor.match_status == 'yes' or vendor.match_status == 'star' %}
→ Generate a 2-3 word summary if evidence contains specific, differentiating information.
→ Summary must be MEANINGFUL ON ITS OWN (not just keyword extraction).
→ Return null if evidence is generic or vague.
{% else %}
→ Return null (NO/UNKNOWN matches don't get summaries)
{% endif %}
{% endfor %}

OUTPUT FORMAT (JSON):
{
  "success": true,
  "criterion_id": "{{ $json.criterion_id }}",
  "summaries": {
    "vendor_001": "2-3 word summary" or null,
    "vendor_002": "2-3 word summary" or null,
    ...
  },
  "timestamp": "{{ $json.timestamp }}"
}

VALIDATION:
- Each summary is EXACTLY 2-3 words (no exceptions)
- Each summary is MEANINGFUL ON ITS OWN (comprehensible without full evidence)
- Summaries are null for NO/UNKNOWN matches
- Summaries are null if information is too generic
- No marketing language or superlatives
- Test: Would this summary make sense to someone who hasn't read the full description?
```

---

### Frontend Type Updates

#### 1. Update `CellState` Interface

**Location**: `src/types/vendorComparison.types.ts:10-29`

```typescript
export interface CellState {
  status: 'pending' | 'loading' | 'completed' | 'failed';
  value?: 'yes' | 'no' | 'unknown' | 'star';

  // Evidence fields
  evidenceUrl?: string;
  evidenceDescription?: string;
  vendorSiteEvidence?: string;
  thirdPartyEvidence?: string;
  researchNotes?: string;
  searchCount?: number;

  // NEW: AI-generated summary (2-3 words, shown under icon)
  summary?: string | null; // ← ADD THIS

  comment?: string; // Legacy alias for researchNotes
  error?: string;
  errorCode?: string;
  retryCount?: number;
}
```

#### 2. Update `Stage2StorageData` Interface

**Location**: `src/types/vendorComparison.types.ts:67-76`

```typescript
export interface Stage2StorageData {
  projectId: string;
  results: Record<string, {
    criterionId: string;
    criterionInsight: string;
    starsAwarded: number;
    vendorUpdates: Record<string, Partial<CellState>>;
    vendorSummaries?: Record<string, string | null>; // ← ADD THIS (vendor_id -> summary)
  }>;
  timestamp: string;
}
```

---

### Hook Integration

#### Update `useTwoStageComparison.ts`

**New Function**: `generateSummariesForRow(criterionId: string)`

**Trigger Point**: After Stage 2 completes successfully

```typescript
// Pseudo-code location: After Stage 2 rankCriterionResults() succeeds

const handleStage2Completion = async (criterionId: string, stage2Response: Stage2Response) => {
  // Existing logic: Update cells with Stage 2 data
  updateCellsWithStage2Data(criterionId, stage2Response);

  // NEW: Generate summaries for this row
  await generateSummariesForRow(criterionId);
};

const generateSummariesForRow = async (criterionId: string) => {
  try {
    // Build request from current state
    const criterion = criteria.find(c => c.id === criterionId);
    const rowState = comparisonStateRef.current.criteria[criterionId];

    const request = {
      user_id: getUserId(),
      session_id: getSessionId(),
      project_id: projectId,
      criterion_id: criterionId,
      criterion_name: criterion.name,
      criterion_explanation: criterion.explanation,
      vendors: vendors.map(v => ({
        vendor_id: v.id,
        vendor_name: v.name,
        match_status: rowState.cells[v.id]?.value || 'unknown',
        evidence_description: rowState.cells[v.id]?.evidenceDescription || '',
        research_notes: rowState.cells[v.id]?.researchNotes || '',
      })),
      timestamp: new Date().toISOString(),
    };

    // Call n8n summarization workflow
    const response = await summarizeCriterionRow(request);

    if (response.success) {
      // Update cells with summaries
      setComparisonState(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criterionId]: {
            ...prev.criteria[criterionId],
            cells: Object.fromEntries(
              Object.entries(prev.criteria[criterionId].cells).map(([vendorId, cell]) => [
                vendorId,
                {
                  ...cell,
                  summary: response.summaries[vendorId] || null,
                },
              ])
            ),
          },
        },
      }));

      // Persist to localStorage (update Stage 2 storage)
      saveStage2ResultWithSummaries(projectId, criterionId, response.summaries);
    }
  } catch (error) {
    console.error(`[Summarization] Failed for criterion ${criterionId}:`, error);
    // Don't block main workflow - summaries are enhancement only
  }
};
```

---

### Service Layer Updates

#### New Function in `n8nService.ts`

**Location**: `src/services/n8nService.ts`

```typescript
/**
 * Summarize criterion row (all vendors)
 * Called after Stage 2 completes for a criterion
 *
 * SP_025: Comparison Matrix Cell Summaries
 */
export interface SummarizeCriterionRowRequest {
  user_id: string;
  session_id: string;
  project_id: string;
  criterion_id: string;
  criterion_name: string;
  criterion_explanation: string;
  vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    match_status: 'yes' | 'no' | 'unknown' | 'star';
    evidence_description: string;
    research_notes: string;
  }>;
  timestamp: string;
}

export interface SummarizeCriterionRowResponse {
  success: boolean;
  criterion_id: string;
  summaries: Record<string, string | null>; // vendor_id -> summary or null
  timestamp: string;
}

export async function summarizeCriterionRow(
  request: SummarizeCriterionRowRequest
): Promise<SummarizeCriterionRowResponse> {
  try {
    const url = getSummarizeCriterionRowUrl(); // From webhooks.ts

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[n8nService] Summarization failed:', error);
    throw error;
  }
}
```

---

### Webhook Configuration

#### Update `src/config/webhooks.ts`

```typescript
// Add new webhook URLs for summarization

export const getSummarizeCriterionRowUrl = (): string => {
  const mode = getCurrentMode();

  if (mode === 'production') {
    return 'https://n8n.clarioo.com/webhook/summarize-criterion-row-production';
  } else {
    return 'https://n8n.clarioo.com/webhook-test/summarize-criterion-row-testing';
  }
};
```

---

### UI Updates

#### Update Comparison Matrix Cell Rendering

**Location**: `src/components/vendor-comparison/ComparisonMatrix.tsx` (estimated path)

**Before**:
```tsx
<div className="cell">
  {value === 'yes' && <Check className="text-green-500" />}
  {value === 'star' && <Star className="text-yellow-500" />}
  {value === 'no' && <X className="text-gray-400" />}
</div>
```

**After**:
```tsx
<div className="cell flex flex-col items-center gap-1">
  {/* Icon */}
  <div>
    {value === 'yes' && <Check className="text-green-500" />}
    {value === 'star' && <Star className="text-yellow-500" />}
    {value === 'no' && <X className="text-gray-400" />}
  </div>

  {/* Summary (if present) */}
  {summary && (
    <div className="text-xs text-gray-500 text-center leading-tight max-w-[80px]">
      {summary}
    </div>
  )}
</div>
```

**Styling Considerations**:
- Font: `text-xs` (12px) or `text-[10px]` if too large
- Color: `text-gray-500` (subtle, not competing with icon)
- Alignment: `text-center` (centered under icon)
- Max width: Prevent summary from breaking cell layout
- Line height: `leading-tight` (compact)

---

### Storage Updates

#### Update `comparisonStorage.ts`

**New Function**: Save summaries alongside Stage 2 results

```typescript
export const saveStage2ResultWithSummaries = (
  projectId: string,
  criterionId: string,
  summaries: Record<string, string | null>
): void => {
  const storageKey = `clarioo_stage2_${projectId}`;
  const existing = loadStage2Results(projectId);

  const updated: Stage2StorageData = {
    ...existing,
    results: {
      ...existing.results,
      [criterionId]: {
        ...existing.results[criterionId],
        vendorSummaries: summaries, // ← Add summaries
      },
    },
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem(storageKey, JSON.stringify(updated));
};
```

**Update**: `loadStage2Results()` to restore summaries into cell state

---

## Implementation Plan

### Phase 1: n8n Workflow Creation (Day 1 - Morning)
1. ✅ Create `Clarioo_AI_Summarize_Criterion_Row_PRODUCTION.json`
2. ✅ Create `Clarioo_AI_Summarize_Criterion_Row_TESTING.json`
3. ✅ Test workflow with example criterion data
4. ✅ Validate 3-word limit enforcement
5. ✅ Verify AI returns null for generic/NO matches

### Phase 2: Type System Updates (Day 1 - Afternoon)
1. ✅ Add `summary` field to `CellState` interface
2. ✅ Add `vendorSummaries` to `Stage2StorageData` interface
3. ✅ Create `SummarizeCriterionRowRequest/Response` types
4. ✅ Update type exports

### Phase 3: Service Layer (Day 1 - Afternoon)
1. ✅ Add `summarizeCriterionRow()` to `n8nService.ts`
2. ✅ Add webhook URL helpers to `webhooks.ts`
3. ✅ Add error handling and retry logic
4. ✅ Test service function with mock data

### Phase 4: Hook Integration (Day 2 - Morning)
1. ✅ Add `generateSummariesForRow()` to `useTwoStageComparison.ts`
2. ✅ Trigger after Stage 2 completion
3. ✅ Update comparison state with summaries
4. ✅ Handle summarization failures gracefully
5. ✅ Test with 2-3 criteria rows

### Phase 5: Storage Integration (Day 2 - Morning)
1. ✅ Update `saveStage2ResultWithSummaries()` in `comparisonStorage.ts`
2. ✅ Update `loadStage2Results()` to restore summaries
3. ✅ Test persistence across page reloads

### Phase 6: UI Updates (Day 2 - Afternoon)
1. ✅ Update comparison matrix cell rendering
2. ✅ Add summary display under icons
3. ✅ Style summary text (grey, small, centered)
4. ✅ Handle empty summaries gracefully (no visual artifact)
5. ✅ Test responsive layout (mobile + desktop)

### Phase 7: Testing & Refinement (Day 2 - Evening)
1. ✅ End-to-end test with real comparison
2. ✅ Verify summaries appear after Stage 2
3. ✅ Verify localStorage persistence
4. ✅ Test with various criterion types
5. ✅ Check 3-word limit enforcement
6. ✅ Verify AI null returns (generic cases)

### Phase 8: Documentation (Day 3)
1. ✅ Update PROJECT_ROADMAP.md
2. ✅ Update PROGRESS.md
3. ✅ Document n8n workflow prompts
4. ✅ Add inline code comments

---

## Files to Modify

### New Files
1. **n8n Workflows** (2 new):
   - `00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_AI_Summarize_Criterion_Row_PRODUCTION.json`
   - `00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_AI_Summarize_Criterion_Row_TESTING.json`

### Modified Files (Frontend)
1. **Types** (2 files):
   - `src/types/vendorComparison.types.ts` - Add `summary` to `CellState`, `vendorSummaries` to `Stage2StorageData`
   - `src/types/n8n.types.ts` - Add `SummarizeCriterionRowRequest/Response`

2. **Services** (2 files):
   - `src/services/n8nService.ts` - Add `summarizeCriterionRow()` function
   - `src/config/webhooks.ts` - Add `getSummarizeCriterionRowUrl()`

3. **Hooks** (1 file):
   - `src/hooks/useTwoStageComparison.ts` - Add `generateSummariesForRow()`, trigger after Stage 2

4. **Storage** (1 file):
   - `src/utils/comparisonStorage.ts` - Add `saveStage2ResultWithSummaries()`, update load logic

5. **UI Components** (1 file):
   - `src/components/vendor-comparison/ComparisonMatrix.tsx` - Update cell rendering to show summaries

### Modified Files (Documentation)
1. `00_IMPLEMENTATION/PROJECT_ROADMAP.md` - Add SP_025
2. `00_IMPLEMENTATION/PROGRESS.md` - Update with SP_025 status

---

## Testing Requirements

### Unit Tests
1. **Type Validation**:
   - `CellState.summary` accepts `string | null`
   - `Stage2StorageData.vendorSummaries` structure correct

2. **Service Function**:
   - `summarizeCriterionRow()` handles success response
   - Error handling for 400/500 responses
   - Timeout handling

3. **Storage Functions**:
   - `saveStage2ResultWithSummaries()` persists correctly
   - `loadStage2Results()` restores summaries to cells

### Integration Tests
1. **Hook Behavior**:
   - Summarization triggers after Stage 2 completes
   - Summaries update comparison state correctly
   - Failures don't block main workflow

2. **UI Rendering**:
   - Summaries display under icons
   - Empty summaries don't show
   - Text truncates if too long (fail-safe)

### End-to-End Tests
1. **Full Comparison Flow**:
   - Start comparison with 3 criteria, 2 vendors
   - Verify Stage 1 completes for all cells
   - Verify Stage 2 completes for each row
   - Verify summaries appear after each Stage 2
   - Reload page, verify summaries persist

2. **AI Decision Testing**:
   - YES match with detailed evidence → summary appears
   - PARTIAL match with specific info → summary appears
   - NO match → no summary
   - Generic YES match ("supports feature") → no summary

---

## Acceptance Criteria

### ✅ Functional Requirements
1. **Summarization triggers automatically** after Stage 2 completes for each criterion
2. **Summaries are 2-3 words maximum** (enforced by n8n prompt)
3. **Only YES/PARTIAL matches get summaries** (AI decides if meaningful)
4. **Summaries display under icons** in grey text (`text-xs text-gray-500`)
5. **Empty summaries don't show** (no visual artifact)
6. **Summaries persist** in localStorage with Stage 2 results
7. **Cell click behavior unchanged** (popup still opens with full explanation)

### ✅ Non-Functional Requirements
1. **Performance**: Summarization adds <2 seconds to Stage 2 completion
2. **Reliability**: Summarization failures don't block comparison workflow
3. **Cost**: Low cost (<$0.01 per row) since no web search required
4. **UX**: Summaries improve scannability without cluttering UI

### ✅ Quality Criteria
1. **AI Quality**: Summaries are meaningful on their own, not just keyword extraction
2. **Standalone Comprehension**: Each summary makes sense without reading full evidence
3. **Consistency**: Similar evidence produces similar summaries
4. **Word Limit**: Zero tolerance for 4+ word summaries
5. **Null Handling**: AI correctly returns null for generic/NO matches

---

## Risk Assessment

### Low Risk
- ✅ No changes to Stage 1/Stage 2 core logic
- ✅ Additive feature (doesn't break existing functionality)
- ✅ Fail-safe: Summarization errors don't affect comparison

### Medium Risk
- ⚠️ **AI hallucination**: Summary doesn't match evidence
  - **Mitigation**: Test with diverse criterion types, refine prompt
- ⚠️ **Word limit violations**: AI returns 4+ words
  - **Mitigation**: Strict prompt engineering, frontend truncation as fail-safe

### Mitigation Strategy
- Extensive testing with production-like data before rollout
- Monitor n8n logs for summary quality issues
- A/B test with subset of users if needed

---

## Success Metrics

### User Behavior
- **Reduced popup opens**: Users get info from summaries without clicking (target: 20% reduction)
- **Faster decisions**: Time to complete comparison decreases (target: 15% faster)

### Technical Metrics
- **Summary generation success rate**: >95% of Stage 2 completions trigger summaries
- **AI null rate**: 30-50% of cells get summaries (shows AI is selective)
- **Average summary length**: 2.5 words (strict 3-word limit)

### Quality Metrics
- **User feedback**: Summaries rated as "helpful" in surveys (target: >80%)
- **Accuracy**: Summaries match full evidence (manual review sample)

---

## Future Enhancements (Out of Scope)

1. **User Editing**: Allow users to manually edit AI summaries
2. **Keyword Highlighting**: Highlight summary keywords in full popup
3. **Summary Tooltips**: Hover over summary for preview of full evidence
4. **Batch Regeneration**: "Regenerate All Summaries" button for project
5. **Custom Summary Styles**: Different colors/fonts for different match types

---

## Notes

- **Design Decision**: Row-by-row processing chosen over batch-all to match Stage 2 progressive flow
- **3-word limit rationale**: Balances scannability vs information density (tested 2, 3, 4 words - 3 is optimal)
- **"Meaningful on its own" principle**: Summaries must be standalone comprehensible, not just keyword extraction. Example: "Real-time predictive restocking" ✓ vs "500+ stores predictive" ✗
- **AI null returns**: Critical for avoiding noise - better to show nothing than generic text
- **No manual buttons**: Automatic process reduces friction, keeps UX clean

---

**Sprint Created**: January 10, 2026
**Last Updated**: January 10, 2026 (Corrected "meaningful on its own" examples)
**Status**: 📋 Ready for Implementation
