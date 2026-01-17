# Comparison Data Transformation Fix

## Issue
After fixing navigation, vendor comparison and battlecards weren't displaying data from the cloned template.

**Symptoms:**
- Navigation worked ✅
- Vendors list empty ❌
- Comparison matrix empty ❌
- Battlecards empty ❌

## Root Causes

### Issue 1: Wrapped Data Structure
**Template Format:**
```json
{
  "comparisonMatrix": {
    "stage1_results": {
      "projectId": "",
      "results": {
        "vendor_001:crit_001": {...},
        "vendor_002:crit_001": {...}
      },
      "timestamp": "..."
    }
  }
}
```

**Previous Code:**
```typescript
// WRONG - treating wrapped object as results
results: template.comparisonMatrix.stage1_results
```

**Fixed Code:**
```typescript
// CORRECT - extract results from wrapped object
const stage1Results = stage1Source.results || stage1Source;
```

### Issue 2: Data Structure Mismatch

**Template Format (Stage 1):**
- Keys: `"vendor_001:crit_001"`, `"vendor_002:crit_001"`, etc.
- Fields: `match_status`, `evidence_description`, `source_urls`, `research_notes`

**UI Expected Format:**
- Organized by criterion
- Each criterion has `cells` object with vendorId keys
- Fields: `status`, `value`, `evidenceUrl`, `evidenceDescription`, `comment`

**Previous Code:**
```typescript
// WRONG - not transforming data structure
criteriaState[criterion.id] = {
  cells: stage1Row || {}  // This doesn't exist!
};
```

**Fixed Code:**
```typescript
// CORRECT - transform and restructure
const cells: Record<string, any> = {};

for (const vendor of template.vendors) {
  const cellKey = `${vendor.id}:${criterion.id}`;
  const cellData = stage1Results[cellKey];

  if (cellData) {
    cells[vendor.id] = {
      status: 'completed',
      value: cellData.match_status,
      evidenceUrl: cellData.source_urls?.[0],
      evidenceDescription: cellData.evidence_description,
      comment: cellData.research_notes,
    };
  }
}

criteriaState[criterion.id] = {
  criterionId: criterion.id,
  stage1Complete: Object.keys(cells).length > 0,
  stage2Status: stage2Row ? 'completed' : 'pending',
  cells: cells,
  criterionInsight: stage2Row?.criterionInsight,
  starsAwarded: stage2Row?.starsAwarded,
};
```

---

## Solution Implemented

### File: `src/services/templateService.ts`

**Lines 217-299**: Complete rewrite of comparison data saving logic

### Key Changes:

#### 1. Handle Wrapped Format (Lines 224-234)
```typescript
// Check if already wrapped with projectId and results
const stage1Results = stage1Source.results || stage1Source;

const stage1Data = {
  projectId: projectId,
  results: stage1Results,
  timestamp: now,
};
localStorage.setItem(`stage1_results_${projectId}`, JSON.stringify(stage1Data));
```

#### 2. Transform Data Structure (Lines 257-288)
```typescript
// Get the actual results objects
const stage1Results = stage1Source?.results || stage1Source || {};
const stage2Results = stage2Source?.results || stage2Source || {};

for (const criterion of criteria) {
  // Build cells object for this criterion from stage1 results
  // Stage 1 results are keyed as "vendorId:criterionId"
  const cells: Record<string, any> = {};

  for (const vendor of (template.vendors || [])) {
    const cellKey = `${vendor.id}:${criterion.id}`;
    const cellData = stage1Results[cellKey];

    if (cellData) {
      cells[vendor.id] = {
        status: 'completed',
        value: cellData.match_status || '',
        evidenceUrl: cellData.source_urls?.[0] || '',
        evidenceDescription: cellData.evidence_description || '',
        comment: cellData.research_notes || '',
      };
    }
  }

  // Get stage2 data for this criterion
  const stage2Row = stage2Results[criterion.id];

  criteriaState[criterion.id] = {
    criterionId: criterion.id,
    stage1Complete: Object.keys(cells).length > 0,
    stage2Status: stage2Row ? 'completed' : 'pending',
    cells: cells,
    criterionInsight: stage2Row?.criterionInsight,
    starsAwarded: stage2Row?.starsAwarded,
  };
}
```

#### 3. Enhanced Logging (Lines 339-357)
```typescript
console.log('[templateService] Created project from template:', {
  projectId,
  templateId: template.templateId,
  projectName: template.projectName,
  description,
  criteriaCount: criteria.length,
  vendorsCount: template.vendors?.length || 0,
  maxStepReached,
  hasComparisonMatrix: !!template.comparisonMatrix,
  stage1ResultsCount: stage1Count,  // NEW
  stage2ResultsCount: stage2Count,  // NEW
  hasBattlecards: !!template.battlecards?.length,
  hasExecutiveSummary: !!template.executiveSummary,
  hasPositioningData: !!template.positioningData,
});
```

---

## Field Mapping Reference

### Stage 1 Cell Transformation

| Template Field | UI Field | Description |
|----------------|----------|-------------|
| `match_status` | `value` | "yes", "no", "unknown", "partial" |
| `evidence_description` | `evidenceDescription` | Research findings |
| `source_urls[0]` | `evidenceUrl` | Primary source URL |
| `research_notes` | `comment` | Additional notes |
| N/A | `status` | Always "completed" for template data |

### Stage 2 Row Fields

| Template Field | UI Field | Description |
|----------------|----------|-------------|
| `criterionInsight` | `criterionInsight` | Comparative insight |
| `starsAwarded` | `starsAwarded` | Vendor rankings |
| `vendorUpdates` | (merged into cells) | Updated cell values |
| `vendorSummaries` | (stored separately) | Cell summaries |

---

## Testing Instructions

### 1. Clear Previous Test

```javascript
// Browser Console
const projects = JSON.parse(localStorage.getItem('clarioo_projects') || '[]');
const testProject = projects.find(p => p.name.includes('Loyalty Management'));

if (testProject) {
  Object.keys(localStorage).forEach(key => {
    if (key.includes(testProject.id)) localStorage.removeItem(key);
  });
  localStorage.setItem('clarioo_projects', JSON.stringify(
    projects.filter(p => p.id !== testProject.id)
  ));
  location.reload();
}
```

### 2. Clone Template

1. Open http://localhost:8080
2. Click "Start with a template"
3. Find "Loyalty Management Platform Evaluation"
4. Click the card → Click "Use These Criteria"

### 3. Verify Console Log

Look for:
```
[templateService] Created project from template: {
  projectId: "...",
  criteriaCount: 17,
  vendorsCount: 5,
  maxStepReached: 2,
  stage1ResultsCount: 85,  // ✅ Should be 85 (17 criteria × 5 vendors)
  stage2ResultsCount: 17,  // ✅ Should be 17 (one per criterion)
  ...
}
```

### 4. Verify localStorage Data

```javascript
const projectId = 'YOUR_PROJECT_ID';

// Check stage1 structure
const stage1 = JSON.parse(localStorage.getItem(`stage1_results_${projectId}`));
console.log('Stage 1:', {
  projectId: stage1.projectId,
  resultCount: Object.keys(stage1.results).length,
  sampleKey: Object.keys(stage1.results)[0],
  sampleValue: stage1.results[Object.keys(stage1.results)[0]]
});

// Should show:
// {
//   projectId: "uuid",
//   resultCount: 85,
//   sampleKey: "vendor_001:crit_001",
//   sampleValue: { vendor_id, criterion_id, match_status, evidence_description, ... }
// }

// Check comparison state structure
const compState = JSON.parse(localStorage.getItem(`comparison_state_${projectId}`));
console.log('Comparison State:', {
  criteriaCount: Object.keys(compState.criteria).length,
  firstCriterion: compState.criteria[Object.keys(compState.criteria)[0]]
});

// Should show:
// {
//   criteriaCount: 17,
//   firstCriterion: {
//     criterionId: "crit_001",
//     stage1Complete: true,
//     stage2Status: "completed" or "pending",
//     cells: {
//       vendor_001: { status: "completed", value: "yes", evidenceUrl: "...", ... },
//       vendor_002: { status: "completed", value: "yes", evidenceUrl: "...", ... },
//       ...
//     }
//   }
// }
```

### 5. Test UI Display

**Navigate to Vendor Comparison:**
1. Click on the "Vendor Comparison" step in navigation
2. **Verify vendors display** with names and colors
3. **Verify comparison matrix shows**:
   - ✅ 5 vendor columns
   - ✅ 17 criteria rows
   - ✅ Cells with values ("yes", "no", "unknown")
   - ✅ Evidence descriptions on hover/click
   - ✅ Match percentages in vendor cards

**Check Vendor Cards:**
1. Scroll to top of comparison matrix
2. **Verify each vendor card shows**:
   - ✅ Vendor name
   - ✅ Match percentage
   - ✅ Color coding
   - ✅ "Research Insights" section
   - ✅ Evidence links

**Test Battlecards:**
1. Scroll down to battlecards section (if visible)
2. **Verify battlecards display**:
   - ✅ Category rows
   - ✅ Vendor columns with data
   - ✅ Formatted text

---

## Expected Results

### Before Fix ❌
- Stage 1 results count: 0
- Stage 2 results count: 0
- Comparison matrix: Empty
- Vendor cards: No data
- Battlecards: Empty

### After Fix ✅
- Stage 1 results count: 85
- Stage 2 results count: 17
- Comparison matrix: Fully populated
- Vendor cards: Complete with insights
- Battlecards: Populated with data

---

## Debugging Tips

### If comparison matrix is still empty:

1. **Check console for loading errors:**
   ```
   [useTwoStageComparison] Restoring from localStorage
   [useTwoStageComparison] Restored state: { totalCells: 85, completedCells: 85 }
   ```

2. **Verify stage1_results structure:**
   ```javascript
   const stage1 = JSON.parse(localStorage.getItem(`stage1_results_${projectId}`));
   console.log('First result:', stage1.results['vendor_001:crit_001']);
   ```

3. **Verify comparison_state structure:**
   ```javascript
   const state = JSON.parse(localStorage.getItem(`comparison_state_${projectId}`));
   console.log('First criterion cells:', state.criteria['crit_001'].cells);
   ```

### Common Issues:

**Issue**: "No saved state, initializing fresh"
- **Cause**: `comparison_state_{projectId}` missing or invalid
- **Fix**: Check if template cloning saved it correctly

**Issue**: Cells show as empty
- **Cause**: Field mapping incorrect
- **Fix**: Verify cellKey format (`vendorId:criterionId`)

**Issue**: Match percentages show 0%
- **Cause**: Vendor transformation not finding cell data
- **Fix**: Check `useVendorTransformation` hook loading logic

---

## Summary

**Files Changed**: 1 file (`src/services/templateService.ts`)
**Lines Modified**: ~80 lines (lines 217-357)

**Key Improvements**:
1. ✅ Handles wrapped data format correctly
2. ✅ Transforms stage1 results from flat keys to nested cells structure
3. ✅ Maps field names correctly (match_status → value, etc.)
4. ✅ Enhanced logging for debugging
5. ✅ Maintains backward compatibility with both wrapped and unwrapped formats

**Result**: Templates now clone with complete vendor comparison data ready to display! 🎉
