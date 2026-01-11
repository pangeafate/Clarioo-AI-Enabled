# Vendor Card Content & Functionality Comparison

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Purpose**: Compare vendor card content/functions between Comparison Matrix and Battlecards

---

## 📊 Component Content Breakdown

Both `VendorCard` and `DesktopColumnHeader` show **IDENTICAL expansion content**:

### **Expansion Content (Lines 326-477 in VendorCard, Lines 225-371 in DesktopColumnHeader)**

1. **⭐ Shortlist Star** (Centered, 2x size)
   - Clickable button
   - Yellow when shortlisted, gray when not
   - Shine animation when adding
   - Label: "Select for outreach"

2. **📋 Vendor Header**
   - Vendor name (large, bold, colored)
   - Match percentage ("--% Match")
   - Website link ("Visit website")
   - AI Edit button (Bot icon - TODO)
   - Delete button (Trash icon - TODO)

3. **⏳ Loading State** (conditional)
   - Shown when `isLoadingSummary && !executiveSummary && !killerFeature`
   - Spinner animation
   - Text: "Researching..."

4. **📝 Executive Summary** (conditional)
   - Header: "About {vendor.name}"
   - Text: `vendor.executiveSummary`

5. **💡 Research Insights** (conditional)
   - Header: "Research Insights"
   - Killer feature (⭐ icon, bold text)
   - Key features (• bullets, up to 4)

---

## 🔧 Props Comparison

### **VendorCard (Mobile) - Comparison Matrix**
```tsx
<VendorCard
  vendor={vendor1}
  currentIndex={vendor1Index}
  totalVendors={shortlist.length}
  onNavigate={handleVendor1Navigate}
  isShortlisted={shortlistedVendorIds.has(vendor1.id)}      // ✅ HAS
  onToggleShortlist={toggleShortlist}                       // ✅ HAS
  onRetryVendor={retryVendor}                              // ✅ HAS
  isLoadingSummary={isGeneratingVendorSummaries && ...}    // ✅ HAS
/>
```

### **VendorCard (Mobile) - Battlecards**
```tsx
<VendorCard
  key="mobile-vendor1"
  vendor={vendor1}
  currentIndex={vendor1Index}
  totalVendors={vendors.length}
  onNavigate={handleVendor1Navigate}
  // ❌ MISSING: isShortlisted
  // ❌ MISSING: onToggleShortlist
  // ❌ MISSING: onRetryVendor
  // ❌ MISSING: isLoadingSummary
/>
```

### **DesktopColumnHeader - Battlecards**
```tsx
<DesktopColumnHeader
  vendor={vendor1}
  currentIndex={vendor1Index}
  totalVendors={vendors.length}
  onNavigate={handleVendor1Navigate}
  isExpanded={expandedColumnIndex === 0}
  onToggleExpand={() => handleColumnToggleExpand(0)}
  columnPosition={0}
  // ❌ MISSING: isShortlisted
  // ❌ MISSING: onToggleShortlist
  // ❌ MISSING: isLoadingSummary
/>
```

---

## ❌ Missing Functionality in Battlecards

### **1. Shortlist Functionality**

**Comparison Matrix:**
- ✅ Star button works
- ✅ Shows filled star when shortlisted
- ✅ Click to toggle shortlist
- ✅ Toast notification on add/remove

**Battlecards:**
- ❌ Star button present but **NOT FUNCTIONAL**
- ❌ No `isShortlisted` prop passed
- ❌ No `onToggleShortlist` handler passed
- ❌ Clicking star does nothing

---

### **2. Retry Functionality**

**Comparison Matrix:**
- ✅ Shows retry button for failed vendors
- ✅ `onRetryVendor` handler passed
- ✅ Click to retry vendor research

**Battlecards:**
- ❌ No `onRetryVendor` prop passed
- ❌ Retry button won't work even if vendor fails

---

### **3. Loading State**

**Comparison Matrix:**
- ✅ Shows spinner when researching vendor summary
- ✅ `isLoadingSummary` calculated and passed
- ✅ Shows "Researching..." message

**Battlecards:**
- ❌ No `isLoadingSummary` prop passed
- ❌ Loading spinner won't show even during research

---

## 📝 Required Props for Full Functionality

### **VendorCard needs:**
```tsx
interface VendorCardProps {
  vendor: ComparisonVendor | null;         // ✅ Has
  currentIndex: number;                     // ✅ Has
  totalVendors: number;                     // ✅ Has
  onNavigate: (direction) => void;          // ✅ Has
  onInfoClick?: () => void;                 // Optional
  className?: string;                       // Optional
  isShortlisted?: boolean;                  // ❌ MISSING in battlecards
  onToggleShortlist?: (vendorId) => void;  // ❌ MISSING in battlecards
  onRetryVendor?: (vendorId) => void;      // ❌ MISSING in battlecards
  isLoadingSummary?: boolean;              // ❌ MISSING in battlecards
  showArrows?: boolean;                     // ✅ Has (desktop only)
}
```

### **DesktopColumnHeader needs:**
```tsx
interface DesktopColumnHeaderProps {
  vendor: ComparisonVendor | null;         // ✅ Has
  currentIndex: number;                     // ✅ Has
  totalVendors: number;                     // ✅ Has
  onNavigate: (direction) => void;          // ✅ Has
  onAddVendor?: () => void;                 // Optional
  isExpanded: boolean;                      // ✅ Has
  onToggleExpand: () => void;               // ✅ Has
  className?: string;                       // Optional
  columnPosition?: number;                  // ✅ Has
  isShortlisted?: boolean;                  // ❌ MISSING in battlecards
  onToggleShortlist?: (vendorId) => void;  // ❌ MISSING in battlecards
  isLoadingSummary?: boolean;              // ❌ MISSING in battlecards
}
```

---

## 🔍 What Needs to Be Added to Battlecards

### **1. Shortlist State Management**

**In VendorBattlecardsMatrix.tsx:**
```tsx
// Add state
const [shortlistedVendorIds, setShortlistedVendorIds] = useState<Set<string>>(new Set());

// Add handler
const toggleShortlist = (vendorId: string) => {
  setShortlistedVendorIds(prev => {
    const newSet = new Set(prev);
    if (newSet.has(vendorId)) {
      newSet.delete(vendorId);
    } else {
      newSet.add(vendorId);
    }
    return newSet;
  });
};
```

### **2. Retry Functionality**

**Option A:** Pass through from parent if available
**Option B:** Implement separate retry for battlecards
**Option C:** Not needed for battlecards (vendor data already loaded)

### **3. Loading State**

**Add logic to detect when vendor summaries are being generated:**
```tsx
const isGeneratingVendorSummaries = /* detect if summaries loading */;
```

---

## ✅ Summary

### **Content - IDENTICAL ✅**
Both components show the exact same expansion content:
- Shortlist star
- Vendor header
- Loading state
- Executive summary
- Research insights

### **Functionality - INCOMPLETE ❌**

**Comparison Matrix:**
- ✅ Shortlist works
- ✅ Retry works
- ✅ Loading spinner works

**Battlecards:**
- ❌ Shortlist broken (props missing)
- ❌ Retry broken (props missing)
- ❌ Loading spinner broken (props missing)

---

## 📋 Action Items

To make battlecards **exactly the same** as comparison matrix:

1. **Add shortlist state** to VendorBattlecardsMatrix
2. **Pass `isShortlisted` prop** to VendorCard/DesktopColumnHeader
3. **Pass `onToggleShortlist` handler** to VendorCard/DesktopColumnHeader
4. **Pass `isLoadingSummary` prop** to VendorCard/DesktopColumnHeader
5. **Pass `onRetryVendor` handler** if retry functionality needed

---

**Status**: ⏸️ **Awaiting decision on which props to add**
