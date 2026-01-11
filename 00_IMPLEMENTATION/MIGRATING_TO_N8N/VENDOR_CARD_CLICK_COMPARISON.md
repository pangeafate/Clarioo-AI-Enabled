# Vendor Card Click Behavior: Comparison Matrix vs Battlecards

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Purpose**: Investigate differences in vendor card click behavior

---

## 📋 Component Comparison

### **VendorCard.tsx** (Comparison Matrix)
- **File**: `src/components/vendor-comparison/VendorCard.tsx`
- **Used in**: VendorComparisonNew.tsx (mobile view)
- **Lines**: 479 total

### **BattlecardVendorCard.tsx** (Battlecards)
- **File**: `src/components/vendor-battlecards/BattlecardVendorCard.tsx`
- **Used in**: VendorBattlecardsMatrix.tsx (mobile & desktop)
- **Lines**: 493 total

---

## 🔍 Key Differences

### **1. Props Interface**

**VendorCard (Comparison Matrix):**
```tsx
interface VendorCardProps {
  vendor: ComparisonVendor | null;
  currentIndex: number;
  totalVendors: number;
  onNavigate: (direction: 'next' | 'previous') => void;
  onInfoClick?: () => void;
  className?: string;
  isShortlisted?: boolean;
  onToggleShortlist?: (vendorId: string) => void;
  onRetryVendor?: (vendorId: string) => void;
  isLoadingSummary?: boolean;
}
```

**BattlecardVendorCard (Battlecards):**
```tsx
interface BattlecardVendorCardProps {
  vendor: ComparisonVendor | null;
  currentIndex: number;
  totalVendors: number;
  onNavigate: (direction: 'next' | 'previous') => void;
  onInfoClick?: () => void;
  className?: string;
  isShortlisted?: boolean;
  onToggleShortlist?: (vendorId: string) => void;
  onRetryVendor?: (vendorId: string) => void;
  isLoadingSummary?: boolean;
  showArrows?: boolean; // ← NEW PROP (default true)
}
```

**Difference**: BattlecardVendorCard has `showArrows` prop for conditional arrow rendering (used on desktop to hide horizontal arrows).

---

### **2. Arrow Rendering**

**VendorCard (Comparison Matrix):**
```tsx
{/* Previous Arrow - ALWAYS rendered */}
<div className="relative flex-shrink-0">
  {/* Arrow content */}
</div>
```

**BattlecardVendorCard (Battlecards):**
```tsx
{/* Previous Arrow - CONDITIONALLY rendered */}
{showArrows && (
  <div className="relative flex-shrink-0">
    {/* Arrow content */}
  </div>
)}
```

**Difference**: Battlecards can hide arrows when `showArrows={false}` (desktop vertical layout).

---

### **3. Click Behavior on Vendor Card**

**VendorCard (Comparison Matrix) - Line 212:**
```tsx
<motion.div
  ref={cardRef}
  key={vendor?.id ?? 'empty'}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
  onClick={() => setIsExpanded(!isExpanded)}
  className="...cursor-pointer hover:shadow-md transition-shadow..."
>
```

**BattlecardVendorCard (Battlecards) - Line 220:**
```tsx
<motion.div
  ref={cardRef}
  key={vendor?.id ?? 'empty'}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
  onClick={() => setIsExpanded(!isExpanded)}
  className="...cursor-pointer hover:shadow-md transition-shadow..."
>
```

**Difference**: ✅ **IDENTICAL** - Both toggle expansion on click.

---

### **4. Expansion Content**

**Both components show identical expansion content:**

1. **Star Icon** - Add to shortlist (centered, 2x larger)
2. **Vendor Name Header** - Name, match %, website link
3. **Loading State** - Spinner while researching
4. **Executive Summary** - "About {vendor.name}"
5. **Research Insights** - Killer feature (⭐) + key features (•)
6. **Action Buttons** - AI edit (Bot icon), Delete (Trash icon)

**Difference**: ✅ **IDENTICAL** - Same expansion content structure.

---

### **5. Console Logging**

**VendorCard (Line 435):**
```tsx
{console.log('[VendorCard] Rendering Research Insights for', vendor.name, ...)}
```

**BattlecardVendorCard (Line 449):**
```tsx
{console.log('[BattlecardVendorCard] Rendering Research Insights for', vendor.name, ...)}
```

**Difference**: Different log prefix (for debugging only).

---

## ✅ Functionality Comparison

| Feature | VendorCard (Comparison) | BattlecardVendorCard (Battlecards) | Status |
|---------|------------------------|-----------------------------------|--------|
| **Click to expand** | ✅ Yes | ✅ Yes | ✅ IDENTICAL |
| **Expansion content** | Shortlist, summary, insights | Shortlist, summary, insights | ✅ IDENTICAL |
| **Navigation arrows** | Always shown | Conditionally shown | ⚠️ DIFFERENT |
| **Click outside to close** | ✅ Yes | ✅ Yes | ✅ IDENTICAL |
| **Shortlist toggle** | ⭐ Star with animation | ⭐ Star with animation | ✅ IDENTICAL |
| **Retry button** | ✅ Yes (on failure) | ✅ Yes (on failure) | ✅ IDENTICAL |
| **Vendor counter** | Shows on arrow hover | Shows on arrow hover | ✅ IDENTICAL |

---

## 🤔 Expected Behavior

### **Comparison Matrix (VendorCard)**

**When you click the vendor card:**
1. Card expands with accordion animation
2. Shows:
   - Shortlist star (centered, large)
   - Vendor details (name, match %, website)
   - Executive summary
   - Research insights (killer feature + key features)
   - Edit/Delete buttons

**Click outside** → Collapses expansion

---

### **Battlecards (BattlecardVendorCard)**

**When you click the vendor card:**
1. Card expands with accordion animation
2. Shows:
   - Shortlist star (centered, large)
   - Vendor details (name, match %, website)
   - Executive summary
   - Research insights (killer feature + key features)
   - Edit/Delete buttons

**Click outside** → Collapses expansion

---

## 🚨 Potential Issues

### **Issue 1: Should battlecard vendor cards be clickable?**

**Current**: Battlecard vendor selector cards expand on click (same as comparison matrix).

**Potential Problem**:
- In comparison matrix, vendor cards are the ONLY way to see vendor details
- In battlecards, vendor cards are just selectors at the top
- The actual battlecard cells below might provide the detail view
- **Should clicking the top selector cards do anything?**

**Questions:**
1. Should battlecard vendor selector cards expand at all?
2. Or should they be non-clickable (just show vendor name/logo)?
3. Should clicking them navigate or do something different?

---

### **Issue 2: Expansion Content Relevance**

**In Comparison Matrix:**
- Expansion shows executive summary & research insights
- This is valuable because the matrix below shows scores/criteria
- User needs the expansion to see vendor narrative

**In Battlecards:**
- Expansion shows executive summary & research insights
- But the battlecard cells below ALREADY show detailed text content
- **Is the expansion redundant? Should it show different content?**

---

### **Issue 3: User Confusion**

**Potential Confusion:**
- User clicks vendor selector card at top → Sees expansion with summary
- User scrolls down → Sees battlecard cells with detailed comparisons
- **Two sources of information about the same vendor in different formats**

**Possible Solution:**
- Remove click expansion from battlecard vendor cards
- Make them non-interactive (just visual selectors)
- Keep all detail in the battlecard cells below

---

## 💡 Recommendations

### **Option 1: Keep Current Behavior (Same as Comparison Matrix)**
- ✅ Consistent with comparison matrix
- ✅ Provides quick vendor summary before scrolling
- ❌ Redundant with battlecard cells below
- ❌ Takes up vertical space

### **Option 2: Remove Click Expansion (Make Non-Interactive)**
- ✅ Removes redundancy with battlecard cells
- ✅ Cleaner, simpler selector UI
- ✅ Users focus on battlecard details below
- ❌ Different from comparison matrix behavior
- ❌ Loses quick access to executive summary

### **Option 3: Different Expansion Content**
- ✅ Keeps click interaction
- ✅ Shows different info (e.g., only shortlist star, quick actions)
- ✅ Avoids redundancy with battlecards
- ❌ Requires new implementation
- ❌ User might expect same behavior as comparison matrix

---

## 🎯 Next Steps

1. **Clarify User Expectation**: What should happen when clicking battlecard vendor selector cards?
2. **Test Current Behavior**: Does the expansion work correctly in battlecards?
3. **Compare UX**: Is current behavior helpful or confusing?
4. **Decide on Changes**: Keep same, remove expansion, or modify expansion content?

---

## 📁 Files to Review

- `src/components/vendor-comparison/VendorCard.tsx` (original)
- `src/components/vendor-battlecards/BattlecardVendorCard.tsx` (battlecards version)
- `src/components/VendorComparisonNew.tsx` (usage of VendorCard)
- `src/components/vendor-battlecards/VendorBattlecardsMatrix.tsx` (usage of BattlecardVendorCard)

---

**Status**: ⏸️ **Awaiting User Feedback on Expected Click Behavior**
