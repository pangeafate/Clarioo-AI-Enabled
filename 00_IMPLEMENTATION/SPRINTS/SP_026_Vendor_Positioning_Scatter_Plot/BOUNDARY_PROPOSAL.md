# Scatter Plot Boundary System - Holistic Proposal

## Problem Statement

Vendors are being cut off at chart edges despite boundary calculations because:
1. **Over-conservative horizontal buffers** waste 50% of mobile width
2. **Fixed pixel buffers** don't scale well with dynamic text
3. **Collision resolution** pushes vendors to edges in cramped space
4. **Text width estimation** is inaccurate for varying vendor names

---

## Current System Issues

### Mobile (343×343px):
```
Usable Area: 171px × 231px (49.9% width, 67.3% height)
Lost Space: 172px horizontal (50%), 112px vertical (33%)

Buffers:
- Left/Right: 86px each (padding 20 + logoRadius 16 + buffer 50)
- Top/Bottom: 36px top, 76px bottom
```

**Result**: Vendors crammed into 171px width → collision detection pushes to edges → cutoff

---

## Proposed Solution: Dynamic, Proportional Buffers

### Core Principle
**Buffer space should be based on ACTUAL needs, not arbitrary fixed values**

### Calculation Formula

```typescript
// 1. Logo radius (unchanged)
const logoRadius = logoSize / 2;

// 2. Label height (keep current - works well)
const labelHeight = Math.round(logoSize * 1.0) + 8;

// 3. Horizontal buffer - NEW FORMULA
// Use maximum of:
//   a) 1.5× logoRadius (circular shape safety margin)
//   b) 4× fontSize (accommodates ~8-10 char names)
const labelHorizontalBuffer = Math.max(
  logoRadius * 1.5,
  fontSize * 4
);

// 4. Vertical top buffer - SIMPLIFIED
// Logos only extend upward, no text above
const topBuffer = logoRadius;

// 5. Vertical bottom buffer - KEEP CURRENT
// Logos + label below
const bottomBuffer = logoRadius + labelHeight;
```

### Boundary Calculations

```typescript
// Horizontal
const minX = padding + labelHorizontalBuffer;
const maxX = width - padding - labelHorizontalBuffer;

// Vertical
const minY = padding + topBuffer;
const maxY = height - padding - bottomBuffer;

const usableWidth = maxX - minX;
const usableHeight = maxY - minY;
```

**Key Change**: Remove redundant `logoRadius` from horizontal calculation since `labelHorizontalBuffer` already accounts for it

---

## Expected Results

### Mobile (343×343px, fontSize=10px):

**Current:**
```
labelHorizontalBuffer = 50px
minX = 20 + 16 + 50 = 86px
maxX = 343 - 86 = 257px
Usable width = 171px (49.9%)
```

**Proposed:**
```
labelHorizontalBuffer = max(16*1.5, 10*4) = max(24, 40) = 40px
minX = 20 + 40 = 60px
maxX = 343 - 40 = 283px
Usable width = 223px (65.0%)
```

**Improvement:** +52px usable width (+30% more space!)

### Desktop (900×500px, fontSize=12px):

**Current:**
```
labelHorizontalBuffer = 60px
Usable width = 634px (70.4%)
```

**Proposed:**
```
labelHorizontalBuffer = max(33*1.5, 12*4) = max(49.5, 48) = 49.5px ≈ 50px
minX = 40 + 50 = 90px
maxX = 900 - 90 = 810px
Usable width = 720px (80.0%)
```

**Improvement:** +86px usable width (+13% more space!)

---

## Implementation

### File: `src/utils/scatterPlotPositioning.ts`

#### 1. Update `normalizeCoordinates()` function signature to accept fontSize

```typescript
export function normalizeCoordinates(
  positions: VendorScatterplotPosition[],
  dimensions: ChartDimensions,
  fontSize: number  // NEW PARAMETER
): VendorPosition[]
```

#### 2. Update buffer calculations

```typescript
const logoRadius = logoSize / 2;
const labelHeight = Math.round(logoSize * 1.0) + 8;

// NEW: Dynamic horizontal buffer
const labelHorizontalBuffer = Math.max(
  logoRadius * 1.5,
  fontSize * 4
);

// NEW: Separate top/bottom buffers
const topBuffer = logoRadius;
const bottomBuffer = logoRadius + labelHeight;

// UPDATED: Simplified boundary calculation
const minX = padding + labelHorizontalBuffer;
const maxX = width - padding - labelHorizontalBuffer;
const minY = padding + topBuffer;
const maxY = height - padding - bottomBuffer;
```

#### 3. Update `enforceEdgeConstraints()` to match

Same formula, same boundaries.

#### 4. Update `processVendorPositions()` caller

Pass fontSize from VendorPositioningScatterPlot component state.

---

## Safety Measures

### 1. Minimum Buffer
Always ensure minimum 20px buffer even on smallest screens:
```typescript
const labelHorizontalBuffer = Math.max(
  20,  // Minimum safety margin
  logoRadius * 1.5,
  fontSize * 4
);
```

### 2. Text Truncation Fallback
For extremely long vendor names (>15 chars), add CSS text-overflow:
```css
.vendor-label {
  max-width: 100px;  /* Adjust per screen size */
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 3. Collision Resolution Priority
Update collision resolution to prefer moving vendors toward center rather than edges:
```typescript
// In adjustPositions, bias nudge direction away from edges
if (pos1.x < centerX) nudgeX *= 0.8;  // Push less toward left edge
if (pos1.x > centerX) nudgeX *= 1.2;  // Push more toward center
```

---

## Testing Checklist

- [ ] Mobile (375px): All vendors visible including "Salesforce"
- [ ] Mobile (400px): No horizontal cutoff
- [ ] Tablet (768px): Labels fully visible
- [ ] Desktop (1024px+): Optimal spacing
- [ ] 10 vendors: No edge cutoff after collision resolution
- [ ] Long names (>12 chars): Truncated or fully visible
- [ ] Short names (<6 chars): Properly centered

---

## Alternative: Percentage-Based Buffers

If dynamic formula doesn't work perfectly, use percentage of chart dimensions:

```typescript
const labelHorizontalBuffer = width * 0.12;  // 12% of width
const topBuffer = logoRadius;
const bottomBuffer = height * 0.15;  // 15% of height
```

This ensures consistent relative spacing regardless of absolute dimensions.

---

## Recommendation

**Implement the dynamic formula approach** (logoRadius × 1.5, fontSize × 4) because:
1. ✅ Scales with actual element sizes
2. ✅ Gives 30% more usable space on mobile
3. ✅ Accounts for both logo and text needs
4. ✅ Proportional across all screen sizes
5. ✅ Predictable and maintainable

This should eliminate edge cutoff while maximizing usable chart space.
