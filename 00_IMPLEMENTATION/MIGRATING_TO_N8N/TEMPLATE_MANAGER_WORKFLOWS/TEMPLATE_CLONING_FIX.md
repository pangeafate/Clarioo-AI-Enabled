# Template Cloning Fix - Complete Data Persistence

## Issue Identified

When cloning a project from a template using "Use These Criteria", only the criteria data was being saved to localStorage. The other stages (vendor comparison, battlecards, executive summary) were not accessible because their data wasn't being persisted.

## Root Cause

The `createProjectFromTemplate()` function in `src/services/templateService.ts` was only saving:
- ✅ Project metadata (`clarioo_projects`)
- ✅ Criteria (`criteria_{projectId}`)
- ✅ Workflow state (`workflow_{projectId}`)

But it was **NOT saving**:
- ❌ Stage 1 comparison results (`stage1_results_{projectId}`)
- ❌ Stage 2 comparison results (`stage2_results_{projectId}`)
- ❌ Battlecards state (`clarioo_battlecards_state_{projectId}`)
- ❌ Battlecards rows (`clarioo_battlecards_rows_{projectId}`)
- ❌ Executive summary (`clarioo_executive_summary_{projectId}`)
- ❌ Positioning data (`positioning_data_{projectId}`)

---

## Solution Implemented

Updated `createProjectFromTemplate()` function to save **all template data** to localStorage.

### File Modified
**`src/services/templateService.ts`** (Lines 201-260)

### New localStorage Keys Created

#### 1. Stage 1 Comparison Results
```typescript
// Individual vendor-criterion research results
localStorage.setItem(`stage1_results_${projectId}`, JSON.stringify({
  projectId: projectId,
  results: template.comparisonMatrix.stage1_results,
  timestamp: now,
}));
```

**Key**: `stage1_results_{projectId}`
**Source**: `template.comparisonMatrix.stage1_results`
**Format**:
```typescript
{
  projectId: string;
  results: Record<string, VendorCriterionResult>; // key: "{vendorId}:{criterionId}"
  timestamp: string;
}
```

#### 2. Stage 2 Comparison Results
```typescript
// Comparative rankings across vendors
localStorage.setItem(`stage2_results_${projectId}`, JSON.stringify({
  projectId: projectId,
  results: template.comparisonMatrix.stage2_results,
  timestamp: now,
}));
```

**Key**: `stage2_results_{projectId}`
**Source**: `template.comparisonMatrix.stage2_results`
**Format**:
```typescript
{
  projectId: string;
  results: Record<string, CriterionRankingResult>; // key: criterionId
  timestamp: string;
}
```

#### 3. Battlecards Rows
```typescript
// Individual battlecard rows with vendor comparisons
localStorage.setItem(`clarioo_battlecards_rows_${projectId}`, JSON.stringify(template.battlecards));
```

**Key**: `clarioo_battlecards_rows_{projectId}`
**Source**: `template.battlecards`
**Format**:
```typescript
Array<{
  row_id: string;
  category_title: string;
  category_definition: string;
  cells: BattlecardCell[];
  status: 'completed';
  timestamp: string;
}>
```

#### 4. Battlecards State
```typescript
// Overall battlecards generation state
const battlecardsState = {
  rows: template.battlecards,
  status: 'completed',
  current_row_index: template.battlecards.length,
  timestamp: now,
};
localStorage.setItem(`clarioo_battlecards_state_${projectId}`, JSON.stringify(battlecardsState));
```

**Key**: `clarioo_battlecards_state_{projectId}`
**Source**: Constructed from `template.battlecards`
**Status**: Always set to `'completed'` since template data is pre-generated

#### 5. Executive Summary
```typescript
// Pre-demo brief with vendor analysis
localStorage.setItem(`clarioo_executive_summary_${projectId}`, JSON.stringify(template.executiveSummary));
```

**Key**: `clarioo_executive_summary_{projectId}`
**Source**: `template.executiveSummary`
**Format**:
```typescript
{
  overview: {
    projectGoal: string;
    keyRequirements: string[];
    evaluationCriteria: number;
  };
  vendorAnalysis: Array<{
    vendorName: string;
    overallAssessment: string;
    strengths: string[];
    weaknesses: string[];
    bestFor: string;
  }>;
  recommendation: {
    topPick: string;
    reason: string;
    considerations: string[];
  };
}
```

#### 6. Positioning Data
```typescript
// Vendor positioning scatter plot data
localStorage.setItem(`positioning_data_${projectId}`, JSON.stringify(template.positioningData));
```

**Key**: `positioning_data_{projectId}`
**Source**: `template.positioningData`

---

## Enhanced Console Logging

Updated console log to show what data was saved:

```typescript
console.log('[templateService] Created project from template:', {
  projectId,
  templateId: template.templateId,
  projectName: template.projectName,
  description,
  criteriaCount: criteria.length,
  vendorsCount: template.vendors?.length || 0,
  hasComparisonMatrix: !!template.comparisonMatrix,
  hasBattlecards: !!template.battlecards?.length,
  hasExecutiveSummary: !!template.executiveSummary,
  hasPositioningData: !!template.positioningData,
});
```

---

## Testing Instructions

### 1. Clear Existing Test Data
Open Browser Console:
```javascript
// Clear any existing test projects
const projects = JSON.parse(localStorage.getItem('clarioo_projects') || '[]');
projects.forEach(p => {
  if (p.name.includes('Loyalty Management Platform')) {
    // Remove all localStorage keys for this project
    Object.keys(localStorage).forEach(key => {
      if (key.includes(p.id)) {
        localStorage.removeItem(key);
      }
    });
  }
});
// Remove the project itself
localStorage.setItem('clarioo_projects', JSON.stringify(
  projects.filter(p => !p.name.includes('Loyalty Management Platform'))
));
```

### 2. Clone Template to Project

1. **Open**: http://localhost:8080
2. **Click**: "Start with a template"
3. **Find**: "Loyalty Management Platform Evaluation" template
4. **Click** on the template card to open preview
5. **Click**: "Use These Criteria" button
6. **Verify**: Success toast appears

### 3. Check Console Log

Look for the enhanced console log:
```
[templateService] Created project from template: {
  projectId: "uuid-here",
  templateId: "tpl_1768484357728_w0sxuy8xu",
  projectName: "Loyalty Management Platform Evaluation",
  description: "...",
  criteriaCount: 17,
  vendorsCount: 5,
  hasComparisonMatrix: true,
  hasBattlecards: true,
  hasExecutiveSummary: true,
  hasPositioningData: true
}
```

All flags should be `true`.

### 4. Verify localStorage Keys

**Open DevTools** → **Application Tab** → **Local Storage** → `http://localhost:8080`

**Check these keys exist** (replace `{projectId}` with actual UUID from console):

1. ✅ `clarioo_projects` - Contains the new project
2. ✅ `criteria_{projectId}` - Array of 17 criteria
3. ✅ `workflow_{projectId}` - Workflow state with vendors
4. ✅ `stage1_results_{projectId}` - Stage 1 comparison data
5. ✅ `stage2_results_{projectId}` - Stage 2 comparison data
6. ✅ `clarioo_battlecards_rows_{projectId}` - Array of battlecard rows
7. ✅ `clarioo_battlecards_state_{projectId}` - Battlecards state (status: 'completed')
8. ✅ `clarioo_executive_summary_{projectId}` - Executive summary object
9. ✅ `positioning_data_{projectId}` - Positioning data (if available)

### 5. Verify Stage 1 Results Structure

```javascript
const projectId = 'YOUR_PROJECT_ID'; // Get from console log
const stage1 = JSON.parse(localStorage.getItem(`stage1_results_${projectId}`));
console.log('Stage 1 Results:', stage1);

// Should show:
// {
//   projectId: "uuid",
//   results: { "vendor_001:crit_001": {...}, "vendor_001:crit_002": {...}, ... },
//   timestamp: "2026-01-15T..."
// }

// Check number of results
console.log('Stage 1 result count:', Object.keys(stage1.results).length);
// Should be: 17 criteria × 5 vendors = 85 results
```

### 6. Verify Stage 2 Results Structure

```javascript
const stage2 = JSON.parse(localStorage.getItem(`stage2_results_${projectId}`));
console.log('Stage 2 Results:', stage2);

// Should show:
// {
//   projectId: "uuid",
//   results: { "crit_001": {...}, "crit_002": {...}, ... },
//   timestamp: "2026-01-15T..."
// }

// Check number of results
console.log('Stage 2 result count:', Object.keys(stage2.results).length);
// Should be: 17 (one per criterion)
```

### 7. Verify Battlecards

```javascript
const battlecards = JSON.parse(localStorage.getItem(`clarioo_battlecards_rows_${projectId}`));
const battlecardsState = JSON.parse(localStorage.getItem(`clarioo_battlecards_state_${projectId}`));

console.log('Battlecard rows:', battlecards.length);
console.log('Battlecards state:', battlecardsState);

// State should show:
// {
//   rows: [...],
//   status: 'completed',
//   current_row_index: <number>,
//   timestamp: "2026-01-15T..."
// }
```

### 8. Verify Executive Summary

```javascript
const summary = JSON.parse(localStorage.getItem(`clarioo_executive_summary_${projectId}`));
console.log('Executive Summary:', summary);

// Should have structure:
// {
//   overview: { projectGoal, keyRequirements, evaluationCriteria },
//   vendorAnalysis: [...],
//   recommendation: { topPick, reason, considerations }
// }
```

### 9. Navigate Through All Stages

1. **Click on the newly created project**
2. **Verify you can access**:
   - ✅ Criteria Builder (starting point)
   - ✅ Vendor Discovery (should show 5 vendors)
   - ✅ Vendor Comparison (should show completed comparison matrix)
   - ✅ Battlecards (should show completed battlecards)
   - ✅ Executive Summary (should show pre-demo brief)
   - ✅ Vendor Positioning (if available)

---

## Expected Behavior After Fix

### Before Fix ❌
- Cloning template created project with **only criteria**
- Vendor comparison stage: Empty (no results)
- Battlecards stage: Not accessible or empty
- Executive summary: Not accessible or empty
- User had to manually run comparison and generate battlecards

### After Fix ✅
- Cloning template creates project with **all data**
- Vendor comparison stage: Fully populated with stage1 and stage2 results
- Battlecards stage: Completed battlecards ready to view
- Executive summary: Pre-demo brief available immediately
- Positioning data: Available if included in template
- User can immediately view all stages without regenerating data

---

## Summary

The template cloning feature now properly persists **all 7 Excel sheets** to localStorage:

| Sheet | localStorage Key | Status |
|-------|-----------------|--------|
| INDEX | `clarioo_projects`, `workflow_{id}` | ✅ Already worked |
| 1. Criteria | `criteria_{id}` | ✅ Already worked |
| 2. Vendors | `workflow_{id}.selectedVendors` | ✅ Already worked |
| 3. Evaluation | `stage1_results_{id}`, `stage2_results_{id}` | ✅ **NOW FIXED** |
| 4. Detailed Matching | `stage1_results_{id}` (evidence field) | ✅ **NOW FIXED** |
| 5. Battlecards | `clarioo_battlecards_rows_{id}`, `clarioo_battlecards_state_{id}` | ✅ **NOW FIXED** |
| 6. Pre-Demo Brief | `clarioo_executive_summary_{id}` | ✅ **NOW FIXED** |

Users can now clone templates and immediately access all stages with pre-generated data! 🎉
