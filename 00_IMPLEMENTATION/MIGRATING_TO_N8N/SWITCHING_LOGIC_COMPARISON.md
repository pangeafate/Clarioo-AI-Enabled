# Switching Logic Comparison: VendorComparisonNew vs VendorBattlecardsMatrix

**Date**: January 10, 2026
**Purpose**: Identify differences to implement EXACT same switching logic

---

## 📊 Side-by-Side Comparison

### **1. State Initialization**

| Aspect | VendorComparisonNew.tsx | VendorBattlecardsMatrix.tsx (My Implementation) |
|--------|------------------------|------------------------------------------------|
| **vendor1Index** | `useState(0)` | `useState(0)` ✅ SAME |
| **vendor2Index** | `useState(Math.min(1, shortlist.length - 1))` | `useState(vendors.length >= 2 ? 1 : 0)` ❌ DIFFERENT |
| **vendor3Index** | `useState(Math.min(2, shortlist.length - 1))` | `useState(vendors.length >= 3 ? 2 : 0)` ❌ DIFFERENT |

**DIFFERENCE #1: Initialization Logic**
- **Original**: Uses `Math.min(N, length - 1)` - allows same index if not enough vendors
- **Mine**: Uses conditional `length >= N ? N : 0` - forces to 0 if not enough vendors
- **Result**: Both CAN create duplicates with < 3 vendors, but mine forces to 0 instead of wrapping

---

### **2. Navigation Handlers**

#### Mobile Navigation (handleVendor1Navigate, etc.)

**VendorComparisonNew.tsx:**
```tsx
const handleVendor1Navigate = (direction: 'next' | 'previous') => {
  setVendor1Index(prev => {
    if (direction === 'next') {
      return (prev + 1) % shortlist.length;
    } else {
      return prev === 0 ? shortlist.length - 1 : prev - 1;
    }
  });
};
```

**VendorBattlecardsMatrix.tsx (My Implementation):**
```tsx
const handleVendor1Navigate = (direction: 'next' | 'previous') => {
  setVendor1Index((prev) => {
    const takenIndices = [vendor2Index, vendor3Index];
    return getNextAvailableIndex(prev, direction, takenIndices);
  });
};
```

**DIFFERENCE #2: Collision Detection**
- **Original**: NO collision detection - simple modulo wrap
- **Mine**: ADDED collision detection - skips indices used by other vendors
- **Result**: Original ALLOWS duplicates, mine PREVENTS duplicates

---

### **3. Desktop Navigation**

**VendorComparisonNew.tsx:**
```tsx
// Desktop uses ARRAY of indices
const [desktopColumnIndices, setDesktopColumnIndices] = useState<number[]>([0, 1, 2, 3, 4]);

const handleDesktopColumnNavigate = (columnIndex: number, direction: 'next' | 'previous') => {
  setDesktopColumnIndices(prev => {
    const newIndices = [...prev];
    const currentIdx = newIndices[columnIndex];

    if (direction === 'next') {
      newIndices[columnIndex] = (currentIdx + 1) % shortlist.length;
    } else {
      newIndices[columnIndex] = currentIdx === 0 ? shortlist.length - 1 : currentIdx - 1;
    }

    return newIndices;
  });
};
```

**VendorBattlecardsMatrix.tsx (My Implementation):**
```tsx
// Desktop manages individual state variables (vendor1Index, vendor2Index, vendor3Index)
// Each has its own navigation handler with collision detection

const handleVendor1Navigate = (direction: 'next' | 'previous') => {
  setVendor1Index((prev) => {
    const takenIndices = [vendor2Index, vendor3Index];
    return getNextAvailableIndex(prev, direction, takenIndices);
  });
};
```

**DIFFERENCE #3: Desktop State Structure**
- **Original**: Single array `[0, 1, 2, 3, 4]` for 5 columns
- **Mine**: Three separate state variables (vendor1Index, vendor2Index, vendor3Index) for 3 columns
- **Result**: Different data structure (but both work, mine just uses fewer slots)

**DIFFERENCE #4: Desktop Navigation Logic**
- **Original**: Simple modulo, NO collision detection
- **Mine**: Collision detection with `getNextAvailableIndex`
- **Result**: Original allows same vendor in multiple columns, mine prevents it

---

### **4. Vendor Retrieval**

**VendorComparisonNew.tsx:**
```tsx
const vendor1 = shortlist[vendor1Index] ?? null;
const vendor2 = shortlist[vendor2Index] ?? null;
const vendor3 = shortlist[vendor3Index] ?? null;
```

**VendorBattlecardsMatrix.tsx (My Implementation):**
```tsx
const vendor1 = vendors[vendor1Index] ? convertToComparisonVendor(vendors[vendor1Index], vendor1Index) : null;
const vendor2 = vendors.length >= 2 && vendors[vendor2Index] ? convertToComparisonVendor(vendors[vendor2Index], vendor2Index) : null;
const vendor3 = vendors.length >= 3 && vendors[vendor3Index] ? convertToComparisonVendor(vendors[vendor3Index], vendor3Index) : null;
```

**DIFFERENCE #5: Vendor Retrieval**
- **Original**: Simple array lookup with nullish coalescing
- **Mine**: Conditional check + conversion function
- **Result**: Mine adds unnecessary complexity

---

### **5. Visible Vendors Array**

**VendorComparisonNew.tsx:**
```tsx
// Uses vendor1, vendor2, vendor3 directly - NO filtering
<VerticalBarChart vendors={[vendor1, vendor2, vendor3].filter(Boolean)} />
```

**VendorBattlecardsMatrix.tsx (My Implementation):**
```tsx
const visibleVendorsRaw = [vendor1, vendor2, vendor3].filter((v): v is ComparisonVendor => v !== null);
const visibleVendors = visibleVendorsRaw.filter(
  (vendor, index, self) => self.findIndex((v) => v.id === vendor.id) === index
);
```

**DIFFERENCE #6: Deduplication**
- **Original**: NO deduplication - passes array as-is (with potential duplicates)
- **Mine**: ADDED deduplication by vendor.id
- **Result**: Original allows duplicate vendors in the array, mine removes them

---

## 🔍 Summary of ALL Differences

| # | What | Original | My Implementation | Impact |
|---|------|----------|-------------------|--------|
| 1 | **Initialization** | `Math.min(N, length-1)` | `length >= N ? N : 0` | Different behavior with < 3 vendors |
| 2 | **Mobile Navigation** | Simple modulo | Collision detection | Original allows duplicates, mine doesn't |
| 3 | **Desktop State** | Array `[0,1,2,3,4]` | 3 separate variables | Different structure |
| 4 | **Desktop Navigation** | Simple modulo | Collision detection | Original allows duplicates, mine doesn't |
| 5 | **Vendor Retrieval** | Direct lookup | Conditional + conversion | Mine more complex |
| 6 | **Deduplication** | None | Filter by vendor.id | Mine removes duplicates |

---

## 💡 Key Insight

**The Original INTENTIONALLY ALLOWS Duplicates!**

The comparison matrix allows showing the same vendor in multiple columns - this is BY DESIGN. You can compare "Vendor A vs Vendor A" if you want.

**Why Battlecards Show Duplicates:**
1. My collision detection was WRONG - it's not in the original
2. My deduplication HIDES the symptom but doesn't fix the root cause
3. The REAL issue might be: **React key collisions when the same vendor appears multiple times**

---

## 🎯 What Needs to Change

To match EXACTLY:

### **Change 1: Initialization**
```tsx
// FROM:
const [vendor2Index] = useState(vendors.length >= 2 ? 1 : 0);
const [vendor3Index] = useState(vendors.length >= 3 ? 2 : 0);

// TO (match original):
const [vendor2Index] = useState(Math.min(1, vendors.length - 1));
const [vendor3Index] = useState(Math.min(2, vendors.length - 1));
```

### **Change 2: Remove Collision Detection**
```tsx
// FROM:
const handleVendor1Navigate = (direction: 'next' | 'previous') => {
  setVendor1Index((prev) => {
    const takenIndices = [vendor2Index, vendor3Index];
    return getNextAvailableIndex(prev, direction, takenIndices);
  });
};

// TO (match original):
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

### **Change 3: Simplify Vendor Retrieval**
```tsx
// FROM:
const vendor1 = vendors[vendor1Index] ? convertToComparisonVendor(...) : null;

// TO (match original):
const vendor1 = vendors[vendor1Index] ?? null;
// Then convert in visibleVendors if needed
```

### **Change 4: Remove Deduplication**
```tsx
// FROM:
const visibleVendors = visibleVendorsRaw.filter(
  (vendor, index, self) => self.findIndex((v) => v.id === vendor.id) === index
);

// TO (match original):
const visibleVendors = [vendor1, vendor2, vendor3].filter(v => v !== null);
```

### **Change 5: Fix React Keys** (This is the REAL fix)
```tsx
// Instead of:
<div key={vendor.id}>  // ❌ Same id appears multiple times!

// Use:
<div key={`${rowId}_${columnIndex}`}>  // ✅ Unique per position
// OR
<div key={`${rowId}_${vendor.id}_${columnIndex}`}>  // ✅ Unique composite key
```

---

## 🚨 Root Cause of "Duplication" Bug

**It's NOT the navigation logic - it's the React keys!**

When the same vendor appears in multiple positions (which is ALLOWED), React needs unique keys per POSITION, not per vendor.

**Current (BROKEN):**
```tsx
{visibleVendors.map((vendor, index) => {
  return <div key={vendor.id}>  // ❌ Duplicate key if same vendor twice
```

**Fixed:**
```tsx
{visibleVendors.map((vendor, index) => {
  return <div key={`${row.row_id}_${index}`}>  // ✅ Unique per position
```

---

## ✅ Action Plan

1. ❌ **REMOVE** collision detection
2. ❌ **REMOVE** deduplication
3. ✅ **MATCH** initialization to `Math.min()`
4. ✅ **MATCH** navigation to simple modulo
5. ✅ **FIX** React keys to use position index, not vendor.id

**Result**: Same navigation behavior as comparison matrix + proper React rendering
