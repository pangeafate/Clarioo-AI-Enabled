# Battlecard Mobile UI Update - Responsive Layout with Vendor Navigation

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Component**: `VendorBattlecardsMatrix.tsx`

---

## 🎯 Changes Implemented

### 1. **Responsive Grid Layout**

**Before (static 3-column desktop grid)**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
  {row.cells.map((cell) => (
    <div>{cell.vendor_name}</div>
  ))}
</div>
```

**After (conditional 2/3 column responsive grid)**:
```tsx
<div className={`grid gap-4 p-4 sm:p-6 ${
  vendors.length === 2
    ? 'grid-cols-2'
    : 'grid-cols-2 md:grid-cols-3'
}`}>
```

**Rules**:
- **2 vendors selected**: 2 columns everywhere (mobile + desktop)
- **3+ vendors selected**: 2 columns mobile (< 768px), 3 columns desktop (≥ 768px)

---

### 2. **Vendor Navigation with Arrows**

**Implementation**:
- ChevronLeft and ChevronRight icons on each side of vendor card
- Vendor counter display on hover (shows vendors to left/right)
- Disabled state when only 1 vendor (opacity-30, cursor-not-allowed)
- Navigation cycles through all vendors independently per column

**Example**:
```tsx
<div className="flex items-center gap-1 sm:gap-2">
  {/* Previous Arrow */}
  <button onClick={() => handleVendorNavigate(row.row_id, columnIndex, 'previous')}>
    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
    <span className="opacity-0 group-hover:opacity-100">
      {vendorsToLeft}
    </span>
  </button>

  {/* Vendor Card */}
  <div className="flex-1">{cell.vendor_name}</div>

  {/* Next Arrow */}
  <button onClick={() => handleVendorNavigate(row.row_id, columnIndex, 'next')}>
    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
    <span className="opacity-0 group-hover:opacity-100">
      {vendorsToRight}
    </span>
  </button>
</div>
```

**State Management**:
```tsx
const [rowVendorIndices, setRowVendorIndices] = useState<Record<string, number[]>>({});

// Each row tracks which vendors are visible in each column
// Example: { 'row_1': [0, 2, 4], 'row_2': [1, 3, 5] }
```

---

### 3. **Fixed Card Height for Mobile Viewport**

**Card Height Constraints**:
```tsx
className="max-h-[140px] sm:max-h-[160px] overflow-hidden"
```

**Text Truncation**:
```tsx
className="line-clamp-3 sm:line-clamp-4"
```

**Goal**: Show at least 2 categories + 2 rows of cards visible on mobile viewport without scrolling.

---

### 4. **Expansion Popup (Click to View Full Details)**

**Trigger**: Click anywhere on vendor card

**Popup Style** (matches comparison matrix score detail popup):
```tsx
<AnimatePresence>
  {expandedCell && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => setExpandedCell(null)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Vendor Name + Category Title + X Button */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3>{expandedCell.vendorName}</h3>
            <p>{expandedCell.categoryTitle}</p>
          </div>
          <button onClick={() => setExpandedCell(null)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Full Text Content */}
        <div dangerouslySetInnerHTML={{ __html: expandedCell.text }} />

        {/* All Source Links */}
        <div>
          {expandedCell.sourceUrls.map((url, i) => (
            <a href={url} target="_blank">
              <ExternalLink /> {url}
            </a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Features**:
- ✅ Black overlay with 50% opacity
- ✅ Click outside to close
- ✅ White card with scale animation (0.9 → 1)
- ✅ X button in top right
- ✅ Scrollable content (max-h-[80vh])
- ✅ Full text with bullet points preserved
- ✅ All source URLs displayed

---

### 5. **Font Sizes Matching Comparison Matrix**

**Criterion Text Reference** (from `VerticalBarChart.tsx`):
```tsx
// Criterion name
className="text-[11px] xs:text-xs sm:text-sm"

// Criterion description
className="text-[9px] xs:text-[10px] sm:text-xs"
```

**Battlecard Implementation**:
```tsx
// Vendor name in card
className="text-[11px] xs:text-xs sm:text-sm"

// Card text content
className="text-[9px] xs:text-[10px] sm:text-xs"

// Source count indicator
className="text-[9px] xs:text-[10px]"
```

**Responsive Breakpoints**:
- Base (< 480px): `text-[9px]` / `text-[11px]`
- XS (≥ 480px): `text-[10px]` / `text-xs`
- SM (≥ 640px): `text-xs` / `text-sm`

---

## 📱 Mobile UX Enhancements

### Visual Feedback
1. **Hover States**:
   - Card: `hover:border-blue-400 hover:shadow-lg`
   - Vendor name: `group-hover:text-blue-600`
   - Arrow buttons: `hover:bg-gray-100`

2. **Vendor Counters**:
   - Hidden by default (`opacity-0`)
   - Show on hover (`group-hover:opacity-100`)
   - Positioned above arrows (`absolute -top-6`)

3. **Loading States**:
   - Shows "Loading data..." when cell data not ready
   - Italicized gray text to indicate pending state

---

## 🎨 UI Consistency

### Matches Comparison Matrix Patterns

**1. Arrow Navigation** (from `VendorCard.tsx`):
- Same ChevronLeft/ChevronRight icons
- Same vendor counter positioning
- Same disabled state styling

**2. Expansion Popup** (from `VendorComparisonNew.tsx`):
- Same AnimatePresence wrapper
- Same black overlay (`bg-black/50`)
- Same white card style (`rounded-lg shadow-xl`)
- Same scale animation (`scale: 0.9 → 1`)
- Same X button placement

**3. Font Sizes** (from `VerticalBarChart.tsx`):
- Exact same responsive font size classes
- Maintains visual hierarchy across components

---

## 📁 Files Modified

### Component:
✅ `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx`

**Key Changes**:
1. Added vendor navigation state management (lines 50-110)
2. Updated grid layout with conditional columns (lines 232-237)
3. Replaced static cells with vendor cards + arrows (lines 239-318)
4. Added expansion popup with AnimatePresence (lines 367-436)
5. Applied responsive font sizes matching comparison matrix

**New Imports**:
```tsx
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
```

**New State**:
```tsx
const [rowVendorIndices, setRowVendorIndices] = useState<Record<string, number[]>>({});
const [expandedCell, setExpandedCell] = useState<{...} | null>(null);
```

---

## 🚀 Testing Checklist

### Desktop (≥ 768px):
- [ ] 3 columns displayed for 3+ vendors
- [ ] 2 columns displayed for exactly 2 vendors
- [ ] Arrow navigation cycles through vendors
- [ ] Vendor counters appear on hover
- [ ] Cards expand to full popup on click
- [ ] Click outside popup closes it
- [ ] Font sizes render at `sm` breakpoint sizes

### Mobile (< 768px):
- [ ] 2 columns displayed for all vendor counts
- [ ] Fixed card height shows ~2-3 lines of text
- [ ] Arrow navigation works smoothly
- [ ] Expansion popup fills screen appropriately
- [ ] Touch interactions work (tap to expand, tap outside to close)
- [ ] Font sizes render at base/xs breakpoint sizes
- [ ] At least 2 categories + 2 rows visible without scrolling

### Edge Cases:
- [ ] Only 1 vendor: arrows disabled, single column displayed
- [ ] Only 2 vendors: 2 columns everywhere (mobile + desktop)
- [ ] 6+ vendors: navigation cycles correctly through all
- [ ] Long vendor names truncate with ellipsis
- [ ] Bullet points display in blue
- [ ] Multiple source URLs display correctly in popup

---

## ✨ Key Features Summary

| Feature | Mobile (< 768px) | Desktop (≥ 768px) |
|---------|------------------|-------------------|
| **Grid Columns** | 2 cols | 3 cols (or 2 if only 2 vendors) |
| **Card Height** | max-h-[140px] | max-h-[160px] |
| **Text Lines** | line-clamp-3 | line-clamp-4 |
| **Font Size (Title)** | text-[11px] → text-xs | text-sm |
| **Font Size (Body)** | text-[9px] → text-[10px] | text-xs |
| **Arrow Navigation** | ✅ Enabled | ✅ Enabled |
| **Expansion Popup** | ✅ Full screen | ✅ Max-w-2xl |

---

## 🎯 User Benefits

1. **Mobile-First Design**: Optimized for small screens with 2-column layout
2. **Vendor Comparison**: Easy navigation between all vendors without scrolling
3. **Quick Overview**: Fixed card height ensures multiple rows visible at once
4. **Detailed View**: Click any card for full content in beautiful popup
5. **Consistent UX**: Matches existing comparison matrix navigation patterns
6. **Responsive Typography**: Font sizes adapt to screen size for optimal readability

---

**Status**: ✅ **Implementation Complete**

**Next Steps**: Test with real data in development environment, verify responsive behavior across breakpoints, and validate touch interactions on mobile devices.
