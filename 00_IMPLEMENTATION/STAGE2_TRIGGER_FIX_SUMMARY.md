# Stage 2 Trigger Fix - Complete Implementation

## Problem Summary

Stage 2 was receiving empty/incomplete data from Stage 1, causing validation errors:
```
"evidence_strength is required" (field was missing)
All evidence fields were empty strings
```

**Root Cause:** Stale closure capturing old `comparisonState.criteria` value in `runStage2Row` callback, leading to reading empty/undefined cell data.

## Solution Implemented

### Changes Made to `src/hooks/useTwoStageComparison.ts`

#### 1. **Use Ref Instead of State in `runStage2Row`** (Lines 507-538)

**Before:**
```typescript
const stage1Results = vendors.map(v => {
  const cell = comparisonState.criteria[criterionId].cells[v.id];  // ❌ Stale closure
  return {
    evidence_strength: (cell.value === 'star' ? 'yes' : cell.value),  // undefined
    // ...
  };
});
```

**After:**
```typescript
const stage1Results = vendors.map(v => {
  const cell = comparisonStateRef.current.criteria[criterionId]?.cells[v.id];  // ✅ Latest state

  // Defensive check: Ensure cell exists and has required data
  if (!cell || !cell.value) {
    console.error('[Stage2] Cell missing or incomplete for vendor:', { ... });
    throw new Error(
      `Stage 2 triggered prematurely - cell data not ready for vendor ${v.name}`
    );
  }

  return {
    evidence_strength: (cell.value === 'star' ? 'yes' : cell.value),  // ✅ Always defined
    // ...
  };
});
```

**Benefits:**
- ✅ Always reads latest state via ref
- ✅ Defensive error handling with detailed logging
- ✅ Clear error message if triggered prematurely

---

#### 2. **Remove Stale Dependency** (Line 662)

**Before:**
```typescript
}, [projectId, techRequest, vendors, comparisonState.criteria]);  // ❌ Recreates on every cell update
```

**After:**
```typescript
}, [projectId, techRequest, vendors]);  // ✅ Stable callback, uses ref internally
```

**Benefits:**
- ✅ Function only recreates when projectId, techRequest, or vendors change
- ✅ More performant (fewer re-renders)
- ✅ No stale closure issues

---

#### 3. **Fix Consistency in `retryFailedCell`** (Lines 926-933)

**Before:**
```typescript
const allCellsComplete = vendors.every(v =>
  comparisonState.criteria[criterionId].cells[v.id].status === 'completed'  // ❌ Stale
);
// ...
}, [criteria, vendors, runStage1Cell, runStage2Row, comparisonState.criteria]);  // ❌ Dependency
```

**After:**
```typescript
const allCellsComplete = vendors.every(v =>
  comparisonStateRef.current.criteria[criterionId]?.cells[v.id]?.status === 'completed'  // ✅ Latest
);
// ...
}, [criteria, vendors, runStage1Cell, runStage2Row]);  // ✅ Removed comparisonState.criteria
```

**Benefits:**
- ✅ Consistent use of refs throughout codebase
- ✅ Optional chaining for safety
- ✅ More stable callback

---

#### 4. **Add Validation Before Triggering Stage 2** (Lines 855-881)

**Before:**
```typescript
// Mark Stage 1 as complete
setComparisonState(/* ... */);

// Immediately trigger Stage 2 (no validation)
if (!abortRef.current && !comparisonStateRef.current.isPaused) {
  runStage2Row(criterion.id, criterion);  // ❌ May not have cell data yet
}
```

**After:**
```typescript
// Mark Stage 1 as complete
setComparisonState(/* ... */);

// Validate all cells have data before triggering Stage 2
const allCellsReady = vendors.every(v => {
  const cell = comparisonStateRef.current.criteria[criterion.id]?.cells[v.id];
  return cell && cell.value !== undefined;
});

console.log('[orchestrateComparison] Stage 1 complete:', {
  aborted: abortRef.current,
  isPaused: comparisonStateRef.current.isPaused,
  allCellsReady,  // ✅ New validation
  willTriggerStage2: !abortRef.current && !comparisonStateRef.current.isPaused && allCellsReady
});

if (!abortRef.current && !comparisonStateRef.current.isPaused && allCellsReady) {
  runStage2Row(criterion.id, criterion);  // ✅ Only if cells ready
} else if (!allCellsReady) {
  console.warn('[orchestrateComparison] Skipping Stage 2 - not all cells ready:', {
    criterion: criterion.name,
    vendors: vendors.map(v => ({
      id: v.id,
      name: v.name,
      hasCell: !!comparisonStateRef.current.criteria[criterion.id]?.cells[v.id],
      hasValue: !!comparisonStateRef.current.criteria[criterion.id]?.cells[v.id]?.value,
    }))
  });
}
```

**Benefits:**
- ✅ Prevents Stage 2 from running if cells aren't ready
- ✅ Detailed logging for debugging
- ✅ Graceful skip with warning if validation fails

---

## How Refs Work in This Fix

### The Ref Update Pattern

```typescript
// Line 122: Ref is synced on every state change
useEffect(() => {
  comparisonStateRef.current = comparisonState;
}, [comparisonState]);
```

**Execution Flow:**
1. Stage 1 completes → `setComparisonState()` called (async)
2. React queues state update
3. `runStage2Row()` called immediately (before next render)
4. `runStage2Row` reads from `comparisonStateRef.current` (has latest state)
5. ✅ Always gets fresh data (ref updated in useEffect before orchestration runs)

---

## Risk Mitigations Implemented

| Risk | Mitigation | Location |
|------|-----------|----------|
| **Cell undefined** | Defensive check with detailed error | Lines 511-523 |
| **Missing cell.value** | Throw error before Stage 2 API call | Lines 511-523 |
| **Stale closure** | Use `comparisonStateRef.current` | Lines 508, 927, 857-858 |
| **Premature trigger** | Validate all cells ready before Stage 2 | Lines 856-859 |
| **Inconsistent state access** | Use refs everywhere, not mixed state/ref | Lines 508, 927 |
| **Poor debugging** | Extensive logging at all checkpoints | Lines 512-518, 862-867, 872-880 |

---

## Testing Checklist

After deployment, verify:

- [ ] Stage 2 receives complete `evidence_strength` field for all vendors
- [ ] Stage 2 validation passes (no "required field" errors)
- [ ] All evidence fields are populated (not empty strings)
- [ ] Console shows validation logs:
  - `[orchestrateComparison] Stage 1 complete for criterion:`
  - `allCellsReady: true`
  - `willTriggerStage2: true`
- [ ] If cells not ready, console shows:
  - `[orchestrateComparison] Skipping Stage 2 - not all cells ready:`
  - Detailed vendor status (hasCell, hasValue)
- [ ] Stage 2 completes successfully with star allocation
- [ ] No errors: `Stage 2 triggered prematurely`

---

## Debugging Guide

### If Stage 2 Still Fails:

**Check Console Logs:**

1. **Before Stage 2 triggers:**
   ```
   [orchestrateComparison] Stage 1 complete for criterion: [name]
   {
     aborted: false,
     isPaused: false,
     allCellsReady: true,  // ← Should be true
     willTriggerStage2: true
   }
   ```

2. **If allCellsReady is false:**
   ```
   [orchestrateComparison] Skipping Stage 2 - not all cells ready:
   {
     vendors: [
       { id: "...", name: "...", hasCell: true, hasValue: false }  // ← Find which vendor
     ]
   }
   ```

3. **Inside Stage 2:**
   ```
   [Stage2] Starting ranking for criterion: [name]
   ```

4. **If cell validation fails:**
   ```
   [Stage2] Cell missing or incomplete for vendor:
   {
     vendorId: "...",
     vendorName: "...",
     cellExists: false,  // ← or true
     hasValue: false     // ← Should be true
   }
   ```

---

## Performance Impact

**Before:**
- `runStage2Row` recreated on every cell completion (high frequency)
- `retryFailedCell` recreated on every cell completion
- Unnecessary re-renders cascading through dependency chains

**After:**
- ✅ `runStage2Row` only recreates when projectId/techRequest/vendors change (rare)
- ✅ `retryFailedCell` only recreates when criteria/vendors change (rare)
- ✅ More stable callbacks = fewer re-renders = better performance

---

## Summary

### What Was Fixed:
1. ✅ Stale closure in `runStage2Row` accessing old `comparisonState.criteria`
2. ✅ Missing defensive checks for undefined cells
3. ✅ Inconsistent state access (mixed state/ref usage)
4. ✅ Premature Stage 2 triggering without validation
5. ✅ Poor error messages and debugging

### What Was Improved:
1. ✅ Performance (more stable callbacks, fewer re-renders)
2. ✅ Reliability (validation before Stage 2 trigger)
3. ✅ Debugging (extensive logging at checkpoints)
4. ✅ Error handling (detailed error messages with context)

### Files Modified:
- `src/hooks/useTwoStageComparison.ts` (4 sections updated)

### Lines Changed:
- Lines 507-538: Use ref + defensive checks in `runStage2Row`
- Line 662: Remove stale dependency
- Lines 926-933: Fix consistency in `retryFailedCell`
- Lines 855-881: Add validation before Stage 2 trigger

---

**Status:** ✅ Ready for testing
