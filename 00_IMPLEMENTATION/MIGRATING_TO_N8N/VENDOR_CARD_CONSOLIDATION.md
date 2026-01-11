# VendorCard Component Consolidation

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Purpose**: Consolidate BattlecardVendorCard into VendorCard for single source of truth

---

## 🎯 Objective

Eliminate code duplication by using a single `VendorCard.tsx` component for both:
- **Comparison Matrix** (VendorComparisonNew.tsx)
- **Vendor Battlecards** (VendorBattlecardsMatrix.tsx)

---

## ✅ Changes Completed

### **1. Updated VendorCard.tsx**

**Added `showArrows` prop:**
```tsx
interface VendorCardProps {
  // ... existing props
  showArrows?: boolean; // Default true - hide for desktop vertical layout in battlecards
}

export const VendorCard: React.FC<VendorCardProps> = ({
  // ... existing params
  showArrows = true, // Default to true for mobile/comparison matrix
}) => {
```

**Made arrow rendering conditional:**
```tsx
{/* Previous Arrow - CONDITIONALLY rendered */}
{showArrows && (
  <div className="relative flex-shrink-0">
    {/* Arrow content */}
  </div>
)}

{/* Vendor Card Content - Always rendered */}
<motion.div>
  {/* Card content */}
</motion.div>

{/* Next Arrow - CONDITIONALLY rendered */}
{showArrows && (
  <div className="relative flex-shrink-0">
    {/* Arrow content */}
  </div>
)}
```

**File**: `src/components/vendor-comparison/VendorCard.tsx`
**Lines Modified**: 28, 66, 167, 169, 206, 269, 306

---

### **2. Updated VendorBattlecardsMatrix.tsx**

**Changed import:**
```tsx
// FROM:
import { BattlecardVendorCard } from './BattlecardVendorCard';

// TO:
import { VendorCard } from '../vendor-comparison/VendorCard';
```

**Replaced all component usage:**
```tsx
// FROM:
<BattlecardVendorCard
  vendor={vendor1}
  // ... props
/>

// TO:
<VendorCard
  vendor={vendor1}
  // ... props
/>
```

**File**: `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx`
**Lines Modified**: 16 (import), all component references

---

### **3. Deleted BattlecardVendorCard.tsx**

**Removed file:**
- ❌ `src/components/vendor-battlecards/BattlecardVendorCard.tsx` (493 lines - DELETED)

**Reason**: No longer needed - VendorCard.tsx now serves both use cases

---

## 📊 Impact

### **Before Consolidation:**
- **2 components**: VendorCard.tsx (479 lines) + BattlecardVendorCard.tsx (493 lines)
- **Total**: 972 lines of duplicated code
- **Maintenance**: Bug fixes needed in 2 places
- **Consistency**: Risk of drift between components

### **After Consolidation:**
- **1 component**: VendorCard.tsx (481 lines)
- **Total**: 481 lines (50% reduction!)
- **Maintenance**: Bug fixes in one place only
- **Consistency**: Guaranteed identical behavior

---

## 🔧 Usage

### **Comparison Matrix (Mobile)**
```tsx
<VendorCard
  vendor={vendor1}
  currentIndex={vendor1Index}
  totalVendors={shortlist.length}
  onNavigate={handleVendor1Navigate}
  // showArrows defaults to true - arrows shown
/>
```

### **Battlecards (Mobile)**
```tsx
<VendorCard
  key="mobile-vendor1"
  vendor={vendor1}
  currentIndex={vendor1Index}
  totalVendors={vendors.length}
  onNavigate={handleVendor1Navigate}
  // showArrows defaults to true - arrows shown
/>
```

### **Battlecards (Desktop - Vertical Arrows)**
```tsx
<VendorCard
  vendor={vendor1}
  currentIndex={vendor1Index}
  totalVendors={vendors.length}
  onNavigate={handleVendor1Navigate}
  showArrows={false} // Hide horizontal arrows (external vertical arrows used instead)
/>
```

---

## ✅ Benefits

1. **Single Source of Truth**: One component for all vendor cards
2. **Reduced Duplication**: 50% less code
3. **Easier Maintenance**: Bug fixes only needed once
4. **Guaranteed Consistency**: Same behavior everywhere
5. **Smaller Bundle**: Less JavaScript shipped to users
6. **Better DX**: Developers only need to learn one component

---

## 🧪 Testing Checklist

### **Comparison Matrix (Mobile)**
- [ ] Vendor cards display correctly
- [ ] Horizontal arrows shown
- [ ] Navigation works
- [ ] Click to expand works
- [ ] Expansion shows summary & insights
- [ ] Shortlist star works
- [ ] Click outside closes expansion

### **Battlecards (Mobile)**
- [ ] Vendor cards display correctly
- [ ] Horizontal arrows shown
- [ ] Navigation works
- [ ] Click to expand works
- [ ] Expansion shows summary & insights
- [ ] Shortlist star works
- [ ] Click outside closes expansion

### **Battlecards (Desktop)**
- [ ] Vendor cards display correctly
- [ ] NO horizontal arrows (external vertical arrows instead)
- [ ] Click to expand works
- [ ] Expansion shows summary & insights
- [ ] Shortlist star works
- [ ] Click outside closes expansion

---

## 📁 Files Modified

**Modified:**
- ✅ `src/components/vendor-comparison/VendorCard.tsx` (added `showArrows` prop)
- ✅ `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx` (changed import & usage)

**Deleted:**
- ❌ `src/components/vendor-battlecards/BattlecardVendorCard.tsx` (no longer needed)

---

## 🚀 Next Steps

1. **Test locally** with npm run dev
2. **Verify behavior** in both comparison matrix and battlecards
3. **Check console** for any errors
4. **Confirm expansion** works correctly in both contexts

---

**Status**: ✅ **Consolidation Complete - Ready for Testing**
