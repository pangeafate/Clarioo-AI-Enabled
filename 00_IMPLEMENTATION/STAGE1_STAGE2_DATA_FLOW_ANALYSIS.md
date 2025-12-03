# Stage 1 → Stage 2 Data Flow Analysis

## Executive Summary

**Current Status**: The n8n workflows are **already correctly configured** to use `yes|unknown|no` terminology. The issue is in the **frontend mapping layer** (`useTwoStageComparison.ts` lines 516-518) which unnecessarily converts these values to legacy names (`confirmed|unclear|not_found`).

**Recommended Action**: Remove the frontend mapping layer and use consistent `yes|unknown|no` naming throughout the entire stack.

---

## Current Data Flow (As Implemented)

### Stage 1: Individual Vendor Research

**Frontend → n8n (Request)**:
```typescript
// src/hooks/useTwoStageComparison.ts (lines 509-526)
{
  vendor_id: "uuid",
  vendor_name: "Vendor A",
  vendor_website: "https://vendor-a.com",
  criterion_id: "uuid",
  evidence_strength: "unclear",  // ❌ Mapped from 'unknown'
  evidence_url: "",
  evidence_description: "",
  vendor_site_evidence: "",
  third_party_evidence: "",
  research_notes: "",
  search_count: 0
}
```

**n8n → Frontend (Response)**:
```json
{
  "success": true,
  "result": {
    "vendor_id": "uuid",
    "criterion_id": "uuid",
    "evidence_strength": "yes|unknown|no",  // ✅ Correct values
    "evidence_url": "https://...",
    "evidence_description": "...",
    "vendor_site_evidence": "...",
    "third_party_evidence": "...",
    "research_notes": "...",
    "search_count": 2
  }
}
```

**Frontend Storage** (CellState):
```typescript
// Stored in comparisonState.criteria[criterionId].cells[vendorId]
{
  value: "yes" | "no" | "unknown" | "star",  // ✅ Correct
  evidenceUrl: string,
  evidenceDescription: string,
  comment: string  // Maps from research_notes
}
```

### Stage 2: Comparative Ranking

**Frontend → n8n (Request)**:
```typescript
// Assembled in useTwoStageComparison.ts (lines 509-526)
const stage1Results = vendors.map(v => {
  const cell = comparisonState.criteria[criterionId].cells[v.id];
  return {
    vendor_id: v.id,
    vendor_name: v.name,
    vendor_website: v.website,
    criterion_id: criterionId,
    evidence_strength:
      cell.value === 'yes' ? 'confirmed' :     // ❌ Unnecessary mapping
      cell.value === 'no' ? 'not_found' :      // ❌ Unnecessary mapping
      'unclear',                                // ❌ Unnecessary mapping
    evidence_url: cell.evidenceUrl || '',
    evidence_description: cell.evidenceDescription || '',
    vendor_site_evidence: cell.comment || '',
    third_party_evidence: '',                   // ⚠️ Lost from Stage 1!
    research_notes: cell.comment || '',
    search_count: 0                             // ⚠️ Lost from Stage 1!
  };
});
```

**n8n → Frontend (Response)**:
```json
{
  "success": true,
  "result": {
    "criterion_id": "uuid",
    "criterion_name": "Integration Capabilities",
    "criterion_importance": "high",
    "vendor_rankings": [
      {
        "vendor_id": "uuid",
        "vendor_name": "Vendor A",
        "state": "star",  // ✅ Correct values
        "evidence_url": "https://...",
        "evidence_description": "...",
        "comment": "Rated 4.6/5 vs Vendor B (4.2/5) per G2"
      }
    ],
    "criterion_insight": "Vendor A leads in this area...",
    "stars_awarded": 1,
    "search_count": 5
  }
}
```

---

## Issues Identified

### 🔴 CRITICAL: Frontend Mapping Layer

**Location**: `src/hooks/useTwoStageComparison.ts:516-518`

```typescript
evidence_strength:
  cell.value === 'yes' ? 'confirmed' as const :
  cell.value === 'no' ? 'not_found' as const :
  'unclear' as const,
```

**Problem**:
- Converts frontend values (`yes|no|unknown`) to legacy names (`confirmed|not_found|unclear`)
- Creates terminology inconsistency across the stack
- **Workflows expect `yes|unknown|no` but receive `confirmed|unclear|not_found`**

**Impact**:
- n8n Stage 2 prompt references "yes|unknown|no" but receives different values
- Frontend and backend use different terminology
- Confusion for anyone reading logs or debugging

---

### 🟡 WARNING: Data Loss from Stage 1 to Stage 2

**Location**: `src/hooks/useTwoStageComparison.ts:522-524`

```typescript
vendor_site_evidence: cell.comment || '',
third_party_evidence: '',                   // ⚠️ Always empty!
research_notes: cell.comment || '',
search_count: 0                             // ⚠️ Always 0!
```

**Problem**:
- Stage 1 collects `third_party_evidence` and `search_count`
- These fields are **not persisted** to frontend storage (CellState)
- When assembling Stage 2 request, these fields are **lost/zeroed**

**Current CellState** (src/types/vendorComparison.types.ts):
```typescript
export interface CellState {
  status: CellStatus;
  value?: CriterionState;        // 'yes' | 'no' | 'unknown' | 'star'
  evidenceUrl?: string;           // ✅ Persisted
  evidenceDescription?: string;   // ✅ Persisted
  comment?: string;               // ✅ Persisted
  error?: string;
  errorCode?: string;
  retryCount: number;
  // ❌ Missing: third_party_evidence
  // ❌ Missing: vendor_site_evidence
  // ❌ Missing: search_count
}
```

**Impact**:
- Stage 2 cannot differentiate vendor site vs third-party evidence
- Stage 2 cannot see how many searches Stage 1 used
- All Stage 1 evidence gets combined into `comment` field

---

### 🟡 WARNING: Evidence Overwrite vs Merge Behavior

**Location**: `src/hooks/useTwoStageComparison.ts:552-561`

```typescript
// Apply vendor rankings from Stage 2
for (const ranking of response.result!.vendor_rankings) {
  if (updatedCells[ranking.vendor_id]) {
    updatedCells[ranking.vendor_id] = {
      ...updatedCells[ranking.vendor_id],
      value: ranking.state,
      evidenceUrl: ranking.evidence_url,
      evidenceDescription: ranking.evidence_description,
      comment: ranking.comment,
    };
  }
}
```

**Current Behavior**: Stage 2 **overwrites** all evidence fields

**Third-Party Comment Suggestion**: Stage 2 should only update if better evidence found

**Question**: Should Stage 2:
- **A) Always overwrite** (current behavior) - Simpler, but loses Stage 1 evidence if Stage 2 doesn't improve it
- **B) Only overwrite if better** - Preserves Stage 1 data, but requires "better" logic
- **C) Merge/append** - Keep both Stage 1 and Stage 2 evidence

---

## Third-Party Comments Analysis

### ✅ Valid Concerns

1. **Field name consistency** - Addressed (workflows use correct names)
2. **Data reuse** - Partially valid (some fields lost in mapping)
3. **Search efficiency** - Valid concern about redundant searches

### ❌ Misunderstandings

1. **"Stage 2 ignores Stage 1 data"** - FALSE
   - Stage 2 **does receive** Stage 1 results in `stage1_results` array
   - Prompt instructs: "REVIEW STAGE 1 EVIDENCE" (line 118)
   - Issue is data LOSS in frontend mapping, not workflow ignoring data

2. **"Stage 2 searches again for same evidence"** - PARTIALLY TRUE
   - Stage 2 is **designed** to do comparative research (different from Stage 1)
   - Stage 1: Individual vendor research
   - Stage 2: Head-to-head comparisons
   - Concern valid IF Stage 2 re-researches individual vendors (should trust Stage 1)

3. **"17 searches per criterion"** - INCORRECT MATH
   - Stage 1: 2 searches × N vendors = 2N searches (parallel)
   - Stage 2: 0-10 searches (comparative, not per-vendor)
   - Total: 2N + 0-10 (not 17)

---

## Clarifying Questions for User

### 1. Frontend Data Storage

**Q**: Should we expand `CellState` to store all Stage 1 fields?

**Current** (only 3 fields):
```typescript
evidenceUrl, evidenceDescription, comment
```

**Proposed** (all Stage 1 fields):
```typescript
{
  evidenceUrl: string;
  evidenceDescription: string;
  vendorSiteEvidence: string;      // NEW
  thirdPartyEvidence: string;       // NEW
  researchNotes: string;            // NEW (replaces 'comment')
  searchCount: number;              // NEW
}
```

**Trade-offs**:
- ✅ Pro: Full Stage 1 data available for Stage 2
- ✅ Pro: Better debugging and transparency
- ❌ Con: Larger localStorage storage
- ❌ Con: Need migration for existing data

---

### 2. Evidence Update Strategy

**Q**: When Stage 2 returns results, should it:

**Option A: Always Overwrite** (current)
```typescript
evidenceUrl = stage2.evidence_url  // Always replace
```
✅ Simple logic
❌ Loses Stage 1 evidence if Stage 2 doesn't improve it

**Option B: Only Update If Better**
```typescript
if (stage2.evidence_url && !stage1.evidence_url) {
  evidenceUrl = stage2.evidence_url
}
```
✅ Preserves Stage 1 data
❌ Need to define "better"

**Option C: Merge/Append**
```typescript
evidenceUrl = stage2.evidence_url || stage1.evidence_url
comment = `${stage1.comment}\n\n[Stage 2] ${stage2.comment}`
```
✅ Keep all evidence
❌ Comments could get very long

**Recommendation**: Option B with simple "better" logic:
```typescript
// Only update if Stage 2 provides a value and Stage 1 was empty/unknown
if (stage2.evidence_url && (!stage1.evidence_url || stage1.value === 'unknown')) {
  evidenceUrl = stage2.evidence_url
}
```

---

### 3. Terminology Standardization

**Q**: Should we remove the frontend mapping layer?

**Current Code** (useTwoStageComparison.ts:516-518):
```typescript
evidence_strength:
  cell.value === 'yes' ? 'confirmed' as const :
  cell.value === 'no' ? 'not_found' as const :
  'unclear' as const,
```

**Proposed Change**:
```typescript
evidence_strength: cell.value === 'star' ? 'yes' : cell.value,
// Map 'star' back to 'yes' for Stage 2 input
// Keep 'yes', 'no', 'unknown' as-is
```

**Impact**:
- Need to update `Stage1Result` type definition (n8nService.ts:701)
- Change from: `'confirmed' | 'mentioned' | 'unclear' | 'not_found'`
- Change to: `'yes' | 'unknown' | 'no'`

**Recommendation**: ✅ YES - Remove mapping for consistency

---

### 4. Stage 2 Prompt Improvements

**Q**: Should we update Stage 2 prompt to emphasize Stage 1 data reuse?

**Current Prompt** (lines 118-120):
- Does mention "REVIEW STAGE 1 EVIDENCE"
- Does show stage1_results in JSON
- Does reference "yes|unknown|no" states

**Third-Party Suggestion**: Add explicit instructions like:
```markdown
### EVIDENCE REUSE RULES

For vendors with Stage 1 "yes":
- ✅ REUSE: evidence_url, evidence_description from Stage 1
- 🔍 RESEARCH: Only to find competitive advantage for potential star

For vendors with Stage 1 "no":
- ✅ REUSE: Evidence from Stage 1
- ❌ DO NOT research again
```

**Recommendation**: ✅ YES - Add explicit reuse section (improves search efficiency)

---

### 5. Search Budget Optimization

**Q**: Should Stage 2 skip searches when not needed?

**Current**: Stage 2 always searches (1-10 searches)

**Proposed Logic**:
```typescript
IF all stage1_results = "no":
  → search_count = 0 (no stars possible, skip searches)

ELSE IF only 1 vendor has "yes":
  → search_count = 0 (can't compare, no competitive advantage)

ELSE IF 2+ vendors have "yes":
  → Execute comparative searches (1-10)
```

**Impact**:
- Reduced Perplexity API costs
- Faster Stage 2 execution when no comparison needed
- No functionality loss (can't award stars when nothing to compare)

**Recommendation**: ✅ YES - Add conditional search logic

---

## Recommended Implementation Plan

### Priority 1: Remove Frontend Mapping (Quick Win)

**File**: `src/hooks/useTwoStageComparison.ts`

**Change lines 516-518 from**:
```typescript
evidence_strength:
  cell.value === 'yes' ? 'confirmed' as const :
  cell.value === 'no' ? 'not_found' as const :
  'unclear' as const,
```

**To**:
```typescript
evidence_strength:
  cell.value === 'star' ? 'yes' as const :
  cell.value as 'yes' | 'unknown' | 'no',
```

**Also update**: `src/services/n8nService.ts:701`
```typescript
// FROM:
evidence_strength: 'confirmed' | 'mentioned' | 'unclear' | 'not_found';

// TO:
evidence_strength: 'yes' | 'unknown' | 'no';
```

**Impact**:
- ✅ Consistent terminology across stack
- ✅ No workflow changes needed (already correct)
- ⚠️ May need to test Stage 2 receives correct values

---

### Priority 2: Expand Stage 1 Data Persistence (Medium Effort)

**File**: `src/types/vendorComparison.types.ts`

**Expand CellState**:
```typescript
export interface CellState {
  status: CellStatus;
  value?: CriterionState;

  // Evidence fields (expanded)
  evidenceUrl?: string;
  evidenceDescription?: string;
  vendorSiteEvidence?: string;      // NEW
  thirdPartyEvidence?: string;      // NEW
  researchNotes?: string;           // NEW (replaces comment)
  searchCount?: number;             // NEW

  // Legacy (keep for backwards compatibility)
  comment?: string;                 // Alias for researchNotes

  // Error tracking
  error?: string;
  errorCode?: string;
  retryCount: number;
}
```

**Update**: `src/hooks/useTwoStageComparison.ts` (lines 420-450)
```typescript
// Stage 1 result processing
cell.evidenceUrl = result.evidence_url;
cell.evidenceDescription = result.evidence_description;
cell.vendorSiteEvidence = result.vendor_site_evidence;  // NEW
cell.thirdPartyEvidence = result.third_party_evidence;  // NEW
cell.researchNotes = result.research_notes;             // NEW
cell.searchCount = result.search_count;                 // NEW
cell.comment = result.research_notes;                   // Backwards compat
```

**Update**: Stage 2 request assembly (lines 509-526)
```typescript
third_party_evidence: cell.thirdPartyEvidence || '',   // Use persisted value
search_count: cell.searchCount || 0,                   // Use persisted value
```

**Impact**:
- ✅ Full Stage 1 data available for Stage 2
- ✅ Better transparency
- ⚠️ Larger localStorage usage
- ⚠️ Need data migration strategy

---

### Priority 3: Improve Stage 2 Prompt (Quick Win)

**File**: n8n workflow JSON (Stage 2)

**Add to prompt** (after line 127 "REVIEW STAGE 1 EVIDENCE"):

```markdown
### EVIDENCE REUSE RULES

**For vendors with Stage 1 "yes":**
- ✅ REUSE: evidence_url, evidence_description, vendor_site_evidence, third_party_evidence
- ✅ ASSIGN: state = "yes" (default)
- 🔍 RESEARCH: Only to find competitive advantage for potential star

**For vendors with Stage 1 "no":**
- ✅ REUSE: Evidence from Stage 1
- ✅ ASSIGN: state = "no"
- ❌ DO NOT research again (Stage 1 already confirmed absence)

**For vendors with Stage 1 "unknown":**
- ⚠️ RETAIN: state = "unknown"
- 🔍 OPTIONAL: If comparative search reveals new info, can update to "yes" or "no"
```

**Add conditional search logic**:

```markdown
### SEARCH BUDGET LOGIC:

```
IF all stage1_results have evidence_strength = "no":
  → search_count = 0 (no stars possible, skip all searches)

ELSE IF only 1 vendor has evidence_strength = "yes":
  → search_count = 0 (can't compare, no competitive advantage)

ELSE IF 2+ vendors have evidence_strength = "yes":
  → Execute Search 1 (comparative overview)
  → Conditionally execute Search 2-4 based on findings
```
```

**Impact**:
- ✅ Reduced search costs when comparison not needed
- ✅ Explicit data reuse instructions
- ✅ More consistent evidence quality

---

### Priority 4: Smart Evidence Update (Optional)

**File**: `src/hooks/useTwoStageComparison.ts` (lines 552-561)

**Add conditional update logic**:

```typescript
// Apply vendor rankings from Stage 2
for (const ranking of response.result!.vendor_rankings) {
  if (updatedCells[ranking.vendor_id]) {
    const currentCell = updatedCells[ranking.vendor_id];

    updatedCells[ranking.vendor_id] = {
      ...currentCell,
      value: ranking.state,  // Always update state

      // Only update evidence if Stage 2 provides better data
      evidenceUrl: ranking.evidence_url || currentCell.evidenceUrl,
      evidenceDescription: ranking.evidence_description || currentCell.evidenceDescription,

      // Merge comments if both exist
      comment: ranking.comment && currentCell.comment
        ? `${currentCell.comment}\n\n[Stage 2] ${ranking.comment}`
        : ranking.comment || currentCell.comment,
    };
  }
}
```

**Impact**:
- ✅ Preserves Stage 1 evidence when Stage 2 doesn't improve it
- ✅ Shows progression from Stage 1 → Stage 2
- ⚠️ Comments could get long (need UI to handle)

---

## Testing Checklist

After implementing changes:

- [ ] Stage 1 stores all fields (vendorSiteEvidence, thirdPartyEvidence, searchCount)
- [ ] Stage 2 receives `yes|unknown|no` (not `confirmed|unclear|not_found`)
- [ ] Stage 2 with all "no" vendors skips searches (search_count = 0)
- [ ] Stage 2 with 1 "yes" vendor skips searches
- [ ] Stage 2 with 2+ "yes" vendors runs comparative searches
- [ ] Stage 2 reuses Stage 1 evidence for "yes" vendors (unless finding better)
- [ ] Stage 2 doesn't re-research "no" vendors
- [ ] Frontend displays all evidence fields correctly
- [ ] localStorage migration works (if needed)

---

## Conclusion

The n8n workflows are **already well-designed** and use correct terminology. The main issues are:

1. **Frontend mapping layer** creates terminology inconsistency → REMOVE IT
2. **Data loss** in Stage 1 → Stage 2 handoff → EXPAND CellState
3. **Prompt clarity** could be improved → ADD explicit reuse rules
4. **Search efficiency** could be optimized → ADD conditional search logic

**Estimated Effort**:
- Priority 1: 30 minutes (remove mapping)
- Priority 2: 2 hours (expand storage + migration)
- Priority 3: 30 minutes (update prompts)
- Priority 4: 1 hour (smart evidence update)

**Total**: ~4 hours for full implementation
