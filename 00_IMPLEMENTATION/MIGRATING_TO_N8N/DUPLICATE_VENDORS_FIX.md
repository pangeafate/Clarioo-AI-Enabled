# Duplicate Vendors Bug Fix

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Issue**: Cards duplicating when switching between vendors
**Component**: `VendorBattlecardsMatrix.tsx`

---

## 🐛 Bug Description

**Symptom**: When switching between vendors using navigation arrows, battlecard cells would duplicate the same vendor multiple times.

**Root Cause**: Vendor indices could point to the same vendor, creating duplicates in the `visibleVendors` array.

---

## 🔍 Root Cause Analysis

### **Problem 1: Initialization**

**Before (BROKEN):**
```tsx
const [vendor1Index, setVendor1Index] = useState(0);
const [vendor2Index, setVendor2Index] = useState(Math.min(1, vendors.length - 1));
const [vendor3Index, setVendor3Index] = useState(Math.min(2, vendors.length - 1));
```

**With 2 vendors:**
- `vendor1Index = 0` ✅
- `vendor2Index = Math.min(1, 1) = 1` ✅
- `vendor3Index = Math.min(2, 1) = 1` ❌ **DUPLICATE!**

**Result**: Both vendor2 and vendor3 point to the same vendor (index 1).

---

### **Problem 2: Navigation Collisions**

**Before (BROKEN):**
```tsx
const handleVendor1Navigate = (direction: 'next' | 'previous') => {
  setVendor1Index((prev) => {
    if (direction === 'next') {
      return (prev + 1) % vendors.length;
    } else {
      return prev === 0 ? vendors.length - 1 : prev - 1;
    }
  });
};
```

**Issue**: No check to prevent colliding with vendor2Index or vendor3Index.

**Example with 3 vendors:**
- vendor1Index = 0
- vendor2Index = 1
- vendor3Index = 2
- User clicks "next" on vendor1 → vendor1Index becomes 1 ❌ **COLLISION with vendor2!**

---

## ✅ The Fix

### **1. Fixed Initialization**

```tsx
// Ensure indices are unique from the start
const [vendor1Index, setVendor1Index] = useState(0);
const [vendor2Index, setVendor2Index] = useState(vendors.length >= 2 ? 1 : 0);
const [vendor3Index, setVendor3Index] = useState(vendors.length >= 3 ? 2 : 0);
```

**Logic:**
- vendor1: Always 0
- vendor2: Use 1 if 2+ vendors exist, otherwise 0
- vendor3: Use 2 if 3+ vendors exist, otherwise 0 (won't be displayed if < 3 vendors)

**Result with 2 vendors:**
- vendor1Index = 0 ✅
- vendor2Index = 1 ✅
- vendor3Index = 0 (but vendor3 won't be rendered since vendors.length < 3) ✅

---

### **2. Added Collision Detection**

```tsx
// Helper function to find next available index (avoiding duplicates)
const getNextAvailableIndex = (
  currentIndex: number,
  direction: 'next' | 'previous',
  takenIndices: number[]
): number => {
  const totalVendors = vendors.length;
  let nextIndex = currentIndex;

  // Try up to totalVendors times to find an available index
  for (let i = 0; i < totalVendors; i++) {
    if (direction === 'next') {
      nextIndex = (nextIndex + 1) % totalVendors;
    } else {
      nextIndex = nextIndex === 0 ? totalVendors - 1 : nextIndex - 1;
    }

    // If this index is not taken by another vendor slot, use it
    if (!takenIndices.includes(nextIndex)) {
      return nextIndex;
    }
  }

  // If all indices are taken (shouldn't happen), return current
  return currentIndex;
};
```

**Navigation handlers updated:**
```tsx
const handleVendor1Navigate = (direction: 'next' | 'previous') => {
  setVendor1Index((prev) => {
    const takenIndices = [vendor2Index, vendor3Index];
    return getNextAvailableIndex(prev, direction, takenIndices);
  });
};

const handleVendor2Navigate = (direction: 'next' | 'previous') => {
  setVendor2Index((prev) => {
    const takenIndices = [vendor1Index, vendor3Index];
    return getNextAvailableIndex(prev, direction, takenIndices);
  });
};

const handleVendor3Navigate = (direction: 'next' | 'previous') => {
  setVendor3Index((prev) => {
    const takenIndices = [vendor1Index, vendor2Index];
    return getNextAvailableIndex(prev, direction, takenIndices);
  });
};
```

**How it works:**
1. When navigating vendor1, check if the next index is already used by vendor2 or vendor3
2. If collision detected, keep searching for the next available index
3. Skip over taken indices until finding a free one

---

### **3. Added Safety Deduplication**

```tsx
// Get visible vendors for current view
// Filter out nulls and deduplicate by vendor ID (safety check)
const visibleVendorsRaw = [vendor1, vendor2, vendor3].filter((v): v is ComparisonVendor => v !== null);
const visibleVendors = visibleVendorsRaw.filter(
  (vendor, index, self) => self.findIndex((v) => v.id === vendor.id) === index
);
```

**Purpose**: Even if indices somehow collide (edge case), this ensures the final array has no duplicate vendors.

---

### **4. Added Debug Logging**

```tsx
// Debug logging (remove after testing)
useEffect(() => {
  console.log('[VendorBattlecardsMatrix] Vendor indices:', {
    vendor1Index,
    vendor2Index,
    vendor3Index,
    totalVendors: vendors.length,
  });
  console.log('[VendorBattlecardsMatrix] Visible vendors:', visibleVendors.map((v) => v.name));
  const hasDuplicates = visibleVendorsRaw.length !== visibleVendors.length;
  if (hasDuplicates) {
    console.warn('[VendorBattlecardsMatrix] ⚠️ Duplicate vendors detected and removed!');
  }
}, [vendor1Index, vendor2Index, vendor3Index, vendors.length, visibleVendorsRaw.length, visibleVendors]);
```

**Purpose**: Monitor for any remaining duplication issues during testing.

---

## 🧪 Testing Scenarios

### **Scenario 1: 2 Vendors**
**Initial state:**
- vendor1Index = 0 (Vendor A)
- vendor2Index = 1 (Vendor B)
- vendor3Index = 0 (not displayed)

**Navigate vendor1 "next":**
- Check: index 1 is taken by vendor2
- Skip to index 0 (wraps around)
- ❌ Can't use 0 (current position)
- Result: Stays at index 0 (only 2 vendors, nowhere else to go)

**Actually with 2 vendors:**
- vendor1Index = 0 → next → 1 (takes vendor2's old spot)
- vendor2Index = 1 → automatically adjusts? No, needs manual fix

**Wait, there's still an issue!** Let me re-think this...

Actually, the collision detection works like this:
- vendor1 at index 0
- vendor2 at index 1
- User clicks "next" on vendor1
- System tries index 1 → taken by vendor2 → skip
- System tries index 0 → that's current position → skip
- No free indices → stays at 0

This is correct! With 2 vendors and 2 slots, you can't have duplicates.

---

### **Scenario 2: 3 Vendors**
**Initial state:**
- vendor1Index = 0 (Vendor A)
- vendor2Index = 1 (Vendor B)
- vendor3Index = 2 (Vendor C)

**Navigate vendor1 "next":**
- Try index 1 → taken by vendor2 → skip
- Try index 2 → taken by vendor3 → skip
- Try index 0 → that's current → skip
- Stays at index 0 ✅

**Navigate vendor2 "next":**
- Try index 2 → taken by vendor3 → skip
- Try index 0 → taken by vendor1 → skip
- Try index 1 → that's current → skip
- Stays at index 1 ✅

**All slots occupied, no navigation possible** ✅ Correct!

---

### **Scenario 3: 6 Vendors**
**Initial state:**
- vendor1Index = 0 (Vendor A)
- vendor2Index = 1 (Vendor B)
- vendor3Index = 2 (Vendor C)

**Navigate vendor1 "next":**
- Try index 1 → taken by vendor2 → skip
- Try index 2 → taken by vendor3 → skip
- Try index 3 → **FREE!** → use it ✅
- vendor1Index becomes 3 (Vendor D)

**Navigate vendor1 "next" again:**
- Try index 4 → **FREE!** → use it ✅
- vendor1Index becomes 4 (Vendor E)

**Navigate vendor1 "next" again:**
- Try index 5 → **FREE!** → use it ✅
- vendor1Index becomes 5 (Vendor F)

**Navigate vendor1 "next" again:**
- Try index 0 → **FREE!** (vendor1 is now at 5) → use it ✅
- vendor1Index becomes 0 (Vendor A) - back to start ✅

**Perfect! Cycles through all vendors while avoiding collisions.**

---

## ✅ Expected Behavior

1. **No duplicates on initialization**
2. **No duplicates when navigating**
3. **Skips indices occupied by other vendor slots**
4. **Cycles through all available vendors**
5. **Stays in place if no free indices available (< 3 vendors scenario)**

---

## 📊 Test Plan

### **Step 1: Test with 2 vendors**
- [ ] Initial: vendor1=A, vendor2=B (no duplicates)
- [ ] Navigate vendor1: Should stay at A or B (no third option)
- [ ] Navigate vendor2: Should stay at A or B (no third option)
- [ ] No duplicates in battlecard cells

### **Step 2: Test with 3 vendors**
- [ ] Initial: vendor1=A, vendor2=B, vendor3=C (no duplicates)
- [ ] Navigate any vendor: Should stay in place (all occupied)
- [ ] No duplicates in battlecard cells

### **Step 3: Test with 6 vendors**
- [ ] Initial: vendor1=A, vendor2=B, vendor3=C (no duplicates)
- [ ] Navigate vendor1 "next": Should show D (skips B, C)
- [ ] Navigate vendor1 "next": Should show E
- [ ] Navigate vendor1 "next": Should show F
- [ ] Navigate vendor1 "next": Should wrap to A
- [ ] No duplicates at any step
- [ ] Check console for debug logs

### **Step 4: Check console logs**
- [ ] Verify indices are always unique
- [ ] Verify no duplicate warnings appear
- [ ] Verify visible vendors array has correct names

---

## 📁 Files Modified

**Component:**
- ✅ `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx`
  - Fixed initialization (lines 54-56)
  - Added `getNextAvailableIndex` helper (lines 93-118)
  - Updated navigation handlers (lines 120-140)
  - Added deduplication logic (lines 142-147)
  - Added debug logging (lines 149-162)

---

## 🚀 Ready to Test

**Next Steps:**
1. Run `npm run dev` to start development server
2. Navigate to battlecards section
3. Test with different vendor counts (2, 3, 6)
4. Click navigation arrows and verify no duplicates
5. Check browser console for debug logs
6. Report any remaining issues

**Debug Commands:**
```javascript
// In browser console:
// Check current state
window.localStorage.getItem('clarioo_battlecards_state_[projectId]')

// Clear cache if needed
clearAllBattlecardsCache()
```

---

**Status**: ✅ **Fix Complete - Ready for Local Testing**
