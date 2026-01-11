# Desktop Popover Fix - Matching Comparison Matrix Behavior

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Issue**: Desktop vendor cards used accordion expansion instead of popover
**Status**: ✅ **Fixed**

---

## 🐛 The Problem

**Observed Behavior:**
- Desktop vendor cards in battlecards used **accordion slide-down** expansion
- Clicking a card expanded content below the card (like mobile)

**Expected Behavior:**
- Desktop vendor cards should use **popover overlay** expansion
- Clicking a card should show a floating popover above the content
- Should match comparison matrix desktop behavior exactly

---

## 🔍 Root Cause

When we consolidated `BattlecardVendorCard` into `VendorCard`, we used the **mobile component** for both mobile AND desktop:

```tsx
{/* Desktop - WRONG */}
<VendorCard
  vendor={vendor1}
  showArrows={false}
  // Uses accordion expansion (mobile behavior)
/>
```

But the **comparison matrix uses different components** for mobile vs desktop:
- **Mobile (< lg)**: `VendorCard` with accordion
- **Desktop (≥ lg)**: `DesktopColumnHeader` with popover

---

## ✅ The Fix

Updated `VendorBattlecardsMatrix.tsx` to match comparison matrix pattern:

### **1. Added Import**
```tsx
import { DesktopColumnHeader } from '../vendor-comparison/DesktopColumnHeader';
```

### **2. Added Expansion State**
```tsx
// Desktop expansion state (for DesktopColumnHeader popover)
const [expandedColumnIndex, setExpandedColumnIndex] = useState<number | null>(null);
```

### **3. Added Toggle Handler**
```tsx
const handleColumnToggleExpand = (columnIndex: number) => {
  setExpandedColumnIndex(prev => prev === columnIndex ? null : columnIndex);
};
```

### **4. Replaced Desktop Section**

**Before (WRONG - accordion):**
```tsx
<div className="hidden lg:block">
  <VendorCard
    vendor={vendor1}
    showArrows={false}
  />
</div>
```

**After (CORRECT - popover):**
```tsx
<div className="hidden lg:block">
  <DesktopColumnHeader
    vendor={vendor1}
    currentIndex={vendor1Index}
    totalVendors={vendors.length}
    onNavigate={handleVendor1Navigate}
    isExpanded={expandedColumnIndex === 0}
    onToggleExpand={() => handleColumnToggleExpand(0)}
    columnPosition={0}
  />
</div>
```

---

## 📊 Component Usage Pattern

### **Mobile (< lg / < 1024px)**
```tsx
<VendorCard
  vendor={vendor1}
  currentIndex={vendor1Index}
  totalVendors={vendors.length}
  onNavigate={handleVendor1Navigate}
  // Uses accordion expansion (slides down)
/>
```

### **Desktop (≥ lg / ≥ 1024px)**
```tsx
<DesktopColumnHeader
  vendor={vendor1}
  currentIndex={vendor1Index}
  totalVendors={vendors.length}
  onNavigate={handleVendor1Navigate}
  isExpanded={expandedColumnIndex === 0}
  onToggleExpand={() => handleColumnToggleExpand(0)}
  columnPosition={0}
  // Uses popover expansion (floating overlay)
/>
```

---

## 🎨 Visual Differences

### **VendorCard (Mobile - Accordion)**
```
┌─────────────────┐
│   Vendor Card   │
└─────────────────┘
        ▼
┌─────────────────┐
│   Expanded      │
│   Content       │
│   (slides down) │
└─────────────────┘
```

### **DesktopColumnHeader (Desktop - Popover)**
```
        ┌─────────────────┐
        │   Popover       │
        │   (floating)    │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   Vendor Card   │
        └─────────────────┘
```

---

## 🔧 Key Differences

| Feature | VendorCard (Mobile) | DesktopColumnHeader (Desktop) |
|---------|---------------------|------------------------------|
| **Layout** | Horizontal (◀ Card ▶) | Vertical (▲ Card ▼) |
| **Expansion** | Accordion (slides down) | Popover (floating overlay) |
| **Animation** | `height: 0 → auto` | `scale: 0.95 → 1, opacity: 0 → 1` |
| **Position** | Below card (in-flow) | Absolute positioned (overlay) |
| **Z-index** | Normal | `z-[100]` |
| **Width** | Full width | Fixed width (`w-72 sm:w-80 lg:w-96`) |

---

## 📁 Files Modified

**Modified:**
- ✅ `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx`
  - Line 17: Added `DesktopColumnHeader` import
  - Line 60: Added `expandedColumnIndex` state
  - Lines 129-131: Added `handleColumnToggleExpand` handler
  - Lines 181-231: Replaced desktop section with `DesktopColumnHeader`

---

## 🧪 Testing Checklist

### **Desktop (≥ 1024px):**
- [ ] Click vendor card → **Popover appears** (floating overlay)
- [ ] Popover shows above battlecard rows
- [ ] Popover has scale + fade animation
- [ ] Click outside popover → Popover closes
- [ ] Click another vendor → Previous popover closes, new one opens
- [ ] Vertical arrows (▲ ▼) navigate vendors
- [ ] Expansion shows star, summary, insights

### **Mobile (< 1024px):**
- [ ] Click vendor card → **Accordion expands** (slides down)
- [ ] Expansion appears below card (in-flow)
- [ ] Horizontal arrows (◀ ▶) navigate vendors
- [ ] Expansion shows star, summary, insights

---

## ✅ Expected Behavior Now

**Mobile:**
- VendorCard with accordion expansion
- Content slides down below card
- Horizontal navigation arrows

**Desktop:**
- DesktopColumnHeader with popover expansion
- Floating overlay above content
- Vertical navigation arrows
- **Matches comparison matrix exactly!**

---

## 🚀 Testing

**Hard refresh required:**
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

**Or clear Vite cache:**
```bash
rm -rf node_modules/.vite
npm run dev
```

---

**Status**: ✅ **Fix Complete - Ready for Testing**
