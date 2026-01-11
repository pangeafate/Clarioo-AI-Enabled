# Battlecard Mobile UI - Correct Implementation

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Component**: `VendorBattlecardsMatrix.tsx`

---

## 🎯 Correct Implementation Structure

### **Architecture Overview**

```
┌─────────────────────────────────────────┐
│   VENDOR SELECTOR CARDS (at top)        │
│   ┌────────────┐ ┌────────────┐        │
│   │ NewStore   │ │ OneStock   │        │
│   │ ◀ Match 90% ▶ Match 63%  │        │
│   └────────────┘ └────────────┘        │
├─────────────────────────────────────────┤
│   EVALUATION CRITERIA                   │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Target Verticals                │  │
│   ├─────────┬─────────┬─────────┤  │
│   │NewStore │OneStock │         │  │
│   │Cell data│Cell data│         │  │
│   └─────────┴─────────┴─────────┘  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Key Customers                   │  │
│   ├─────────┬─────────┬─────────┤  │
│   │NewStore │OneStock │         │  │
│   │Cell data│Cell data│         │  │
│   └─────────┴─────────┴─────────┘  │
└─────────────────────────────────────────┘
```

**Key Points:**
1. ✅ Vendor selector cards at the **TOP** (with arrows to navigate)
2. ✅ Battlecard rows below show data for **selected vendors** only
3. ❌ NO arrows on individual cells
4. ✅ Cells are clickable for expansion popup

---

## 🔄 What Changed from First Implementation

### ❌ **WRONG (First Implementation)**
```
Each category row had:
- Arrows on every cell
- Independent vendor navigation per cell
- Confusing UX (too many arrows)
```

### ✅ **CORRECT (Current Implementation)**
```
Structure:
1. Vendor selector cards at top (arrows only here)
2. Category rows below show cells for selected vendors
3. Click cell to expand details
```

---

## 📱 Implementation Details

### **1. Vendor Selector Cards (Top Section)**

**Mobile (< lg / < 1024px):**
```tsx
<div className="lg:hidden mb-6">
  <div className="space-y-3">
    {/* Vendor 1 Card */}
    <BattlecardVendorCard
      vendor={vendor1}
      currentIndex={vendor1Index}
      totalVendors={vendors.length}
      onNavigate={handleVendor1Navigate}
    />

    {/* Vendor 2 Card (only if 2+ vendors) */}
    {vendors.length >= 2 && vendor2 && (
      <BattlecardVendorCard ... />
    )}
  </div>
</div>
```

**Desktop (≥ lg / ≥ 1024px):**
```tsx
<div className="hidden lg:block mb-6">
  <div className="space-y-3">
    {/* Vendor 1, 2, 3 Cards stacked */}
    <BattlecardVendorCard ... />
    <BattlecardVendorCard ... />
    <BattlecardVendorCard ... />
  </div>
</div>
```

**Features:**
- Stacked vertically on both mobile and desktop
- Each card has left/right arrows for navigation
- Mobile shows 2 vendors, Desktop shows 3 vendors
- Arrows cycle through ALL available vendors

---

### **2. State Management**

```tsx
// Vendor navigation state
const [vendor1Index, setVendor1Index] = useState(0);
const [vendor2Index, setVendor2Index] = useState(Math.min(1, vendors.length - 1));
const [vendor3Index, setVendor3Index] = useState(Math.min(2, vendors.length - 1));

// Get current vendors for display
const vendor1 = vendors[vendor1Index] ? convertToComparisonVendor(vendors[vendor1Index]) : null;
const vendor2 = vendors.length >= 2 && vendors[vendor2Index] ? convertToComparisonVendor(vendors[vendor2Index]) : null;
const vendor3 = vendors.length >= 3 && vendors[vendor3Index] ? convertToComparisonVendor(vendors[vendor3Index]) : null;

// Visible vendors array (used to show cells below)
const visibleVendors = [vendor1, vendor2, vendor3].filter((v): v is ComparisonVendor => v !== null);
```

**Navigation Handlers:**
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

---

### **3. Battlecard Category Rows (Below Vendor Cards)**

**Mobile: 2 columns (< lg)**
```tsx
<div className="lg:hidden grid grid-cols-2 gap-4 p-4 sm:p-6">
  {visibleVendors.slice(0, 2).map((vendor) => {
    const cell = row.cells.find((c) => c.vendor_name === vendor.name);
    return (
      <div
        onClick={() => setExpandedCell({...})}
        className="bg-white p-3 rounded-lg border hover:border-blue-400 cursor-pointer max-h-[140px] overflow-hidden"
      >
        <h4>{cell?.vendor_name || vendor.name}</h4>
        <div dangerouslySetInnerHTML={{ __html: cell.text }} />
        <div>{cell.source_urls.length} sources</div>
      </div>
    );
  })}
</div>
```

**Desktop: 3 columns (≥ lg)**
```tsx
<div className="hidden lg:grid grid-cols-3 gap-4 p-4 sm:p-6">
  {visibleVendors.map((vendor) => {
    const cell = row.cells.find((c) => c.vendor_name === vendor.name);
    return (
      <div
        onClick={() => setExpandedCell({...})}
        className="bg-white p-3 rounded-lg border hover:border-blue-400 cursor-pointer max-h-[160px] overflow-hidden"
      >
        {/* Same content as mobile */}
      </div>
    );
  })}
</div>
```

**Key Features:**
- ❌ No arrows on individual cells
- ✅ Cells show data for `visibleVendors` only
- ✅ Click to expand full details
- ✅ Fixed height with overflow truncation
- ✅ Responsive font sizes

---

### **4. Expansion Popup (unchanged)**

Click any cell to view full content in a popup:

```tsx
<AnimatePresence>
  {expandedCell && (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={() => setExpandedCell(null)}
    >
      <motion.div className="bg-white rounded-lg shadow-xl max-w-2xl p-6">
        {/* Header: Vendor Name + Category Title */}
        <h3>{expandedCell.vendorName}</h3>
        <p>{expandedCell.categoryTitle}</p>

        {/* Full Text */}
        <div dangerouslySetInnerHTML={{ __html: expandedCell.text }} />

        {/* All Source Links */}
        {expandedCell.sourceUrls.map((url, i) => (
          <a href={url} target="_blank">
            <ExternalLink /> {url}
          </a>
        ))}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## 📐 Responsive Breakpoints

| Breakpoint | Vendor Cards Shown | Cell Columns | Layout |
|------------|-------------------|--------------|--------|
| Mobile (< 1024px) | 2 vendors | 2 columns | Vendor cards stacked, cells in 2-col grid |
| Desktop (≥ 1024px) | 3 vendors | 3 columns | Vendor cards stacked, cells in 3-col grid |

---

## 🎨 Font Sizes (Matching Comparison Matrix)

**Vendor Card (BattlecardVendorCard):**
- Vendor name: `text-sm sm:text-base`
- Match percentage: `text-xs sm:text-sm`

**Battlecard Cells:**
```tsx
// Vendor name in cell
className="text-[11px] xs:text-xs sm:text-sm"

// Cell text content
className="text-[9px] xs:text-[10px] sm:text-xs"

// Source count
className="text-[9px] xs:text-[10px]"
```

**Responsive Breakpoints:**
- Base (< 480px): `9px` / `11px`
- XS (≥ 480px): `10px` / `12px`
- SM (≥ 640px): `12px` / `14px`

---

## 🔄 User Flow

### **Vendor Navigation:**
1. User sees 2-3 vendor cards at top (depending on screen size)
2. User clicks left/right arrows on vendor card to cycle through vendors
3. Battlecard rows below **update automatically** to show cells for selected vendors

### **Viewing Cell Details:**
1. User sees truncated cell content (2-3 lines)
2. User clicks anywhere on cell
3. Popup opens with full text + all source links
4. User clicks outside popup to close

---

## ✅ Correct Implementation Checklist

### Vendor Selector Cards:
- [x] Positioned at TOP of battlecard module
- [x] Stacked vertically on both mobile and desktop
- [x] Mobile shows 2 vendor cards
- [x] Desktop shows 3 vendor cards
- [x] Each card has left/right arrows for navigation
- [x] Arrows cycle through all vendors
- [x] Vendor counter shows on hover

### Battlecard Cells:
- [x] ❌ NO arrows on individual cells
- [x] Cells show data ONLY for vendors selected in top cards
- [x] Mobile: 2 columns (`grid-cols-2`)
- [x] Desktop: 3 columns (`grid-cols-3`)
- [x] Fixed height with overflow truncation
- [x] Click anywhere to expand popup
- [x] Responsive font sizes matching comparison matrix

### Expansion Popup:
- [x] Black overlay (`bg-black/50`)
- [x] White card with scale animation
- [x] X button in top right
- [x] Click outside to close
- [x] Full text with bullet points preserved
- [x] All source URLs displayed

---

## 📁 Files Modified

**Main Component:**
- ✅ `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx`
  - Added vendor navigation state (3 independent indices)
  - Added vendor selector cards at top (mobile + desktop)
  - Removed arrows from individual cells
  - Show cells only for `visibleVendors` array
  - Maintained expansion popup and responsive fonts

**Dependencies:**
- ✅ Uses existing `BattlecardVendorCard` component
- ✅ Converts `WorkflowVendor` to `ComparisonVendor` format
- ✅ Matches patterns from `VendorComparisonNew.tsx`

---

## 🚀 Key Differences from Comparison Matrix

| Feature | Comparison Matrix | Battlecard Matrix |
|---------|------------------|-------------------|
| **Top Cards** | Vendor summary cards | Vendor selector cards |
| **Navigation** | Arrows on vendor cards | Arrows on vendor cards |
| **Content Below** | Vertical bar chart with criteria | Category rows with text cells |
| **Cell Type** | Yes/No/Star scores | Text content + sources |
| **Cell Interaction** | Click to view evidence popup | Click to view full text popup |
| **Layout** | Same responsive pattern | Same responsive pattern |

---

## 🎯 User Benefits

1. **Clear Navigation**: Vendor selection at top, easy to understand which vendors are displayed
2. **Consistent UX**: Matches comparison matrix navigation pattern exactly
3. **Less Clutter**: No arrows on every cell, cleaner interface
4. **Mobile Optimized**: 2 vendor cards + 2-column grid for small screens
5. **Desktop Enhanced**: 3 vendor cards + 3-column grid for larger screens
6. **Quick Details**: Click any cell for full content in beautiful popup

---

**Status**: ✅ **Correct Implementation Complete**

**Next Steps**: Test with real data to verify vendor navigation updates battlecard cells correctly.
