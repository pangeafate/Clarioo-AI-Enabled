# Desktop vs Mobile Vendor Navigation - Final Implementation

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Components**: `VendorBattlecardsMatrix.tsx`, `BattlecardVendorCard.tsx`

---

## 🎯 Correct Desktop & Mobile Implementations

### **Mobile (< lg / < 1024px) - Horizontal Arrows**

```
◀ [ Vendor Card ] ▶
```

**Layout:**
- Arrows on LEFT and RIGHT sides
- Horizontal layout: `flex items-center`
- ChevronLeft and ChevronRight normal orientation
- Vendor counters show on hover ABOVE arrows

**Code:**
```tsx
<div className="flex items-center gap-2">
  {/* Left Arrow */}
  <Button onClick={() => onNavigate('previous')}>
    <ChevronLeft className="h-5 w-5" />
  </Button>

  {/* Vendor Card */}
  <BattlecardVendorCard vendor={vendor1} showArrows={true} />

  {/* Right Arrow */}
  <Button onClick={() => onNavigate('next')}>
    <ChevronRight className="h-5 w-5" />
  </Button>
</div>
```

---

### **Desktop (≥ lg / ≥ 1024px) - Vertical Arrows**

```
     ▲
[Vendor Card]
     ▼
```

**Layout:**
- Arrows ABOVE and BELOW card
- Vertical layout: `flex flex-col items-center`
- ChevronLeft/ChevronRight with `rotate-90` to point up/down
- 3-column grid for vendor cards

**Code:**
```tsx
<div className="grid grid-cols-3 gap-4">
  {/* Column 1 */}
  <div className="flex flex-col items-center">
    {/* Top Arrow (Previous) */}
    <Button onClick={() => handleVendor1Navigate('previous')}>
      <ChevronLeft className="h-3 w-3 rotate-90" />
    </Button>

    {/* Vendor Card (no horizontal arrows) */}
    <BattlecardVendorCard
      vendor={vendor1}
      showArrows={false}
    />

    {/* Bottom Arrow (Next) */}
    <Button onClick={() => handleVendor1Navigate('next')}>
      <ChevronRight className="h-3 w-3 rotate-90" />
    </Button>
  </div>

  {/* Column 2, 3 same pattern */}
</div>
```

---

## 📐 Visual Comparison

### Mobile Layout:
```
┌─────────────────────────────────┐
│  ◀  [ NewStore - Match 90% ]  ▶ │
│  ◀  [ OneStock - Match 63% ]  ▶ │
└─────────────────────────────────┘
```

### Desktop Layout:
```
┌─────────┬─────────┬─────────┐
│    ▲    │    ▲    │    ▲    │
│ NewStore│ OneStock│ Tulip   │
│Match 90%│Match 63%│Match 75%│
│    ▼    │    ▼    │    ▼    │
└─────────┴─────────┴─────────┘
```

---

## 🔧 Implementation Details

### **BattlecardVendorCard Component**

Added `showArrows` prop to conditionally render horizontal arrows:

```tsx
interface BattlecardVendorCardProps {
  // ... other props
  showArrows?: boolean; // Default true for mobile
}

export const BattlecardVendorCard = ({
  // ... other props
  showArrows = true,
}) => {
  return (
    <div className="flex items-center">
      {/* Left arrow - only if showArrows = true */}
      {showArrows && (
        <div className="relative flex-shrink-0">
          <Button onClick={() => onNavigate('previous')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Vendor Card Content */}
      <motion.div className="flex-1">
        {/* Card content */}
      </motion.div>

      {/* Right arrow - only if showArrows = true */}
      {showArrows && (
        <div className="relative flex-shrink-0">
          <Button onClick={() => onNavigate('next')}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};
```

---

### **VendorBattlecardsMatrix Component**

**Mobile Implementation:**
```tsx
{/* Mobile: Stacked Vertically (< lg) */}
<div className="lg:hidden mb-6">
  <div className="space-y-3">
    {/* Vendor 1 Card with horizontal arrows */}
    {vendor1 && (
      <BattlecardVendorCard
        vendor={vendor1}
        currentIndex={vendor1Index}
        totalVendors={vendors.length}
        onNavigate={handleVendor1Navigate}
        showArrows={true} // Show horizontal arrows
      />
    )}

    {/* Vendor 2 Card */}
    {vendors.length >= 2 && vendor2 && (
      <BattlecardVendorCard
        vendor={vendor2}
        currentIndex={vendor2Index}
        totalVendors={vendors.length}
        onNavigate={handleVendor2Navigate}
        showArrows={true} // Show horizontal arrows
      />
    )}
  </div>
</div>
```

**Desktop Implementation:**
```tsx
{/* Desktop: Vertical arrows (≥ lg) */}
<div className="hidden lg:block mb-6">
  <div className="grid grid-cols-3 gap-4">
    {/* Vendor 1 Column */}
    {vendor1 && (
      <div className="flex flex-col items-center">
        {/* Top Arrow (Previous) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleVendor1Navigate('previous')}
          disabled={vendor1Index === 0}
          className="h-5 w-5 p-0"
        >
          <ChevronLeft className="h-3 w-3 rotate-90" />
        </Button>

        {/* Vendor Card (no horizontal arrows) */}
        <BattlecardVendorCard
          vendor={vendor1}
          currentIndex={vendor1Index}
          totalVendors={vendors.length}
          onNavigate={handleVendor1Navigate}
          showArrows={false} // Hide horizontal arrows
        />

        {/* Bottom Arrow (Next) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleVendor1Navigate('next')}
          disabled={vendor1Index === vendors.length - 1}
          className="h-5 w-5 p-0"
        >
          <ChevronRight className="h-3 w-3 rotate-90" />
        </Button>
      </div>
    )}

    {/* Vendor 2, 3 Columns follow same pattern */}
  </div>
</div>
```

---

## 🎨 Styling Details

### Mobile Arrows:
- Icon size: `h-5 w-5`
- Button size: `h-8 w-8`
- Normal orientation (no rotation)
- Spacing: `gap-2` between arrow and card

### Desktop Arrows:
- Icon size: `h-3 w-3` (smaller)
- Button size: `h-5 w-5` (smaller)
- Rotated 90°: `rotate-90` class
- Positioned vertically: `flex-col items-center`

---

## 📊 Responsive Breakpoints

| Screen Size | Arrows Position | Arrow Orientation | Vendor Cards Shown | Grid Layout |
|-------------|----------------|-------------------|-------------------|-------------|
| **< 1024px** | Left & Right | Horizontal | 2 vendors | Stacked vertically |
| **≥ 1024px** | Top & Bottom | Vertical (rotated) | 3 vendors | 3-column grid |

---

## ✅ Key Differences Summary

| Feature | Mobile (< lg) | Desktop (≥ lg) |
|---------|--------------|----------------|
| **Arrow Position** | Horizontal (left/right) | Vertical (top/bottom) |
| **Arrow Rotation** | No rotation | `rotate-90` |
| **Card Layout** | Stacked vertically | 3-column grid |
| **showArrows Prop** | `true` | `false` |
| **External Arrows** | None (built into card) | Yes (outside card) |
| **Vendor Count** | 2 | 3 |

---

## 🔗 Reference Implementation

**Based on:**
- Mobile: `VendorCard.tsx` (lines 165-300)
- Desktop: `DesktopColumnHeader.tsx` (lines 135-206)

**Pattern Match:**
- ✅ Mobile horizontal arrows match `VendorCard` exactly
- ✅ Desktop vertical arrows match `DesktopColumnHeader` exactly
- ✅ Consistent with comparison matrix navigation

---

## 🚀 Testing Checklist

### Mobile (< 1024px):
- [ ] Vendor cards stacked vertically
- [ ] Horizontal arrows (◀ ▶) on each card
- [ ] Arrows navigate between all vendors
- [ ] Vendor counter shows on hover above arrows
- [ ] 2 vendor cards displayed

### Desktop (≥ 1024px):
- [ ] Vendor cards in 3-column grid
- [ ] Vertical arrows (▲ ▼) above and below each card
- [ ] NO horizontal arrows on cards
- [ ] Arrows rotate 90° to point up/down
- [ ] 3 vendor cards displayed
- [ ] Each column navigates independently

---

**Status**: ✅ **Complete & Matching Reference Implementation**

**Files Modified:**
- `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx`
- `src/components/vendor-battlecards/BattlecardVendorCard.tsx`

**Next Steps**: Test in browser to verify responsive behavior and arrow functionality.
