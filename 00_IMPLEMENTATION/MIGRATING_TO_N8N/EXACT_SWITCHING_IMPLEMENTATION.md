# Exact Switching Implementation - Matching VendorComparisonNew.tsx

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Component**: `VendorBattlecardsMatrix.tsx`
**Status**: ✅ **Complete - Ready for Testing**

---

## 🎯 Objective

Implement EXACT same switching logic as `VendorComparisonNew.tsx` in the battlecards matrix, including:
- Intentionally allowing duplicate vendors (by design)
- Simple modulo navigation without collision detection
- Position-based React keys to prevent rendering issues

---

## ✅ Changes Implemented

### **Change 1: Initialization Pattern** (Lines 54-56)

**Before:**
```tsx
const [vendor1Index, setVendor1Index] = useState(0);
const [vendor2Index, setVendor2Index] = useState(vendors.length >= 2 ? 1 : 0);
const [vendor3Index, setVendor3Index] = useState(vendors.length >= 3 ? 2 : 0);
```

**After:**
```tsx
const [vendor1Index, setVendor1Index] = useState(0);
const [vendor2Index, setVendor2Index] = useState(Math.min(1, vendors.length - 1));
const [vendor3Index, setVendor3Index] = useState(Math.min(2, vendors.length - 1));
```

**Why**: Matches original pattern. With < 3 vendors, allows indices to point to same vendor (intentional).

---

### **Change 2: Removed Collision Detection** (Lines 93-122)

**Before:**
```tsx
// Helper function to find next available index (avoiding duplicates)
const getNextAvailableIndex = (
  currentIndex: number,
  direction: 'next' | 'previous',
  takenIndices: number[]
): number => {
  // ... 25 lines of collision detection logic
};

const handleVendor1Navigate = (direction: 'next' | 'previous') => {
  setVendor1Index((prev) => {
    const takenIndices = [vendor2Index, vendor3Index];
    return getNextAvailableIndex(prev, direction, takenIndices);
  });
};
```

**After:**
```tsx
const handleVendor1Navigate = (direction: 'next' | 'previous') => {
  setVendor1Index(prev => {
    if (direction === 'next') {
      return (prev + 1) % vendors.length;
    } else {
      return prev === 0 ? vendors.length - 1 : prev - 1;
    }
  });
};
```

**Why**: Original uses simple modulo arithmetic, NO collision detection. Same vendor can appear in multiple columns.

---

### **Change 3: Removed Deduplication** (Line 125)

**Before:**
```tsx
const visibleVendorsRaw = [vendor1, vendor2, vendor3].filter((v): v is ComparisonVendor => v !== null);
const visibleVendors = visibleVendorsRaw.filter(
  (vendor, index, self) => self.findIndex((v) => v.id === vendor.id) === index
);
```

**After:**
```tsx
const visibleVendors = [vendor1, vendor2, vendor3].filter((v): v is ComparisonVendor => v !== null);
```

**Why**: Original doesn't deduplicate. Allows showing "Vendor A vs Vendor A" comparison.

---

### **Change 4: Fixed React Keys** (Lines 407, 454)

**Before:**
```tsx
{visibleVendors.map((vendor, index) => {
  return (
    <div key={vendor.id}>  {/* ❌ Same vendor = duplicate key */}
```

**After:**
```tsx
{visibleVendors.map((vendor, index) => {
  return (
    <div key={`${row.row_id}_${index}`}>  {/* ✅ Unique per position */}
```

**Why**: When same vendor appears in multiple columns, vendor.id creates duplicate keys. Using position index ensures unique keys.

---

### **Change 5: Added React Keys to Vendor Selector Cards**

**Before:**
```tsx
{vendor1 && (
  <BattlecardVendorCard
    vendor={vendor1}
    ...
  />
)}
```

**After:**
```tsx
{vendor1 && (
  <BattlecardVendorCard
    key="mobile-vendor1"  // or "desktop-vendor1"
    vendor={vendor1}
    ...
  />
)}
```

**Why**: Without keys, React can't properly track which cards should mount/unmount, especially with animations. Using slot-based keys (not vendor.id) ensures unique keys even when same vendor appears in multiple slots.

---

### **Change 6: Removed Debug Logging**

**Before:**
```tsx
useEffect(() => {
  console.log('[VendorBattlecardsMatrix] Vendor indices:', { ... });
  console.log('[VendorBattlecardsMatrix] Visible vendors:', ...);
  const hasDuplicates = visibleVendorsRaw.length !== visibleVendors.length;
  if (hasDuplicates) {
    console.warn('[VendorBattlecardsMatrix] ⚠️ Duplicate vendors detected and removed!');
  }
}, [...]);
```

**After:**
```tsx
// Removed entirely
```

**Why**: No longer needed. Duplicate vendors are intentional, not a bug.

---

## 🔍 Key Insights

### **1. Duplicates Are Intentional**

**The original comparison matrix ALLOWS showing the same vendor in multiple columns.**

This is a **feature, not a bug**. Users can compare:
- Vendor A vs Vendor A
- Vendor B vs Vendor B vs Vendor B

The "duplication bug" in battlecard cells was caused by React key collisions when using `vendor.id` as the key while the same vendor appeared multiple times. **Fixed by using position-based keys.**

### **2. Card Multiplying Bug**

**Issue**: Vendor selector cards at the top were multiplying - showing 4+ cards when only 2 vendors exist.

**Root Cause**: Vendor selector cards (BattlecardVendorCard components) didn't have React `key` props. Without keys, React couldn't properly track which cards should mount/unmount, especially with Framer Motion animations. This caused ghost cards to persist.

**Fix**: Added slot-based keys (`"mobile-vendor1"`, `"desktop-vendor2"`, etc.) to each vendor selector card. Using slot-based keys (not `vendor.id`) ensures unique keys even when the same vendor appears in multiple slots.

---

## 📊 Behavior with Different Vendor Counts

### **With 2 Vendors (A, B):**

**Initial State:**
- vendor1Index = 0 (Vendor A)
- vendor2Index = 1 (Vendor B)
- vendor3Index = 1 (Vendor B) ← **Duplicate intentional**

**Desktop displays:**
- Column 1: Vendor A
- Column 2: Vendor B
- Column 3: Vendor B ← **Same vendor twice**

**Mobile displays:**
- Card 1: Vendor A
- Card 2: Vendor B

---

### **With 3 Vendors (A, B, C):**

**Initial State:**
- vendor1Index = 0 (Vendor A)
- vendor2Index = 1 (Vendor B)
- vendor3Index = 2 (Vendor C)

**Navigate vendor1 "next":**
- vendor1Index becomes 1 (Vendor B)
- Now showing: B, B, C ← **Two Vendor B's**

---

### **With 6 Vendors (A, B, C, D, E, F):**

**Initial State:**
- vendor1Index = 0 (Vendor A)
- vendor2Index = 1 (Vendor B)
- vendor3Index = 2 (Vendor C)

**Navigate vendor1 "next":**
- vendor1Index becomes 1 (Vendor B)
- Now showing: B, B, C ← **Two Vendor B's**

**Navigate vendor1 "next" again:**
- vendor1Index becomes 2 (Vendor C)
- Now showing: C, B, C ← **Two Vendor C's**

**All working as intended!**

---

## 🧪 Testing Checklist

### **Mobile (< 1024px):**
- [ ] Initial load: EXACTLY 2 vendor cards displayed (no extras)
- [ ] Navigate vendor1: Cycles through all vendors (may create duplicates)
- [ ] Navigate vendor2: Cycles through all vendors (may create duplicates)
- [ ] NO ghost/extra cards appearing
- [ ] NO React key warnings in console
- [ ] NO rendering glitches when duplicates appear
- [ ] Cells render correctly for duplicate vendors

### **Desktop (≥ 1024px):**
- [ ] Initial load: Correct number of vendor cards (2 for 2 vendors, 3 for 3+ vendors)
- [ ] NO extra/ghost columns appearing
- [ ] Navigate vendor1: Cycles through all vendors
- [ ] Navigate vendor2: Cycles through all vendors
- [ ] Navigate vendor3: Cycles through all vendors (if 3+ vendors)
- [ ] Same vendor can appear in multiple columns
- [ ] NO React key warnings in console
- [ ] NO rendering glitches

### **With Different Vendor Counts:**
- [ ] 2 vendors: EXACTLY 2 cards shown (mobile and desktop)
- [ ] 3 vendors: EXACTLY 3 cards shown on desktop, 2 on mobile
- [ ] 6 vendors: EXACTLY 3 cards shown on desktop, 2 on mobile
- [ ] Navigation allows any combination
- [ ] NO card multiplication bug

---

## 📁 Files Modified

**Component:**
- ✅ `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx`
  - Lines 54-56: Changed initialization to `Math.min()`
  - Lines 93-122: Replaced collision detection with simple modulo
  - Line 125: Removed deduplication
  - Lines 151, 162, 182, 218, 254: Added React keys to vendor selector cards
  - Lines 407, 454: Fixed React keys in battlecard cells to use `${row.row_id}_${index}`
  - Removed debug logging useEffect

---

## 🚀 Ready to Test

**To test locally:**
```bash
npm run dev
```

**Navigate to:**
- Battlecards section in the app
- Test with different vendor counts (2, 3, 6)
- Click navigation arrows (mobile horizontal, desktop vertical)
- Verify same vendor CAN appear in multiple columns
- Check browser console for React key warnings (should be none)

---

## ✅ Expected Results

1. **Switching works exactly like comparison matrix**
2. **Same vendor can appear multiple times** (intentional)
3. **No React key warnings** (fixed with position-based keys)
4. **No rendering glitches** when duplicates appear
5. **Navigation cycles through all vendors** with simple modulo

---

**Status**: ✅ **Implementation Complete - Ready for Local Testing**
