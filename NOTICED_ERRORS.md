# Noticed Errors Log

## E001: Vendor logos overflow chart boundaries on mobile

**First Noticed:** 2026-01-11
**Last Noticed:** 2026-01-11

**Description:**
On mobile devices, vendor logos in the scatter plot chart are being cut off at the right edge. The logo circles and/or vendor names extend beyond the visible chart area, particularly affecting vendors positioned on the right side of the chart (e.g., "Tulip" logo).

**Context:**
- Component: VendorPositioningScatterPlot (SP_026)
- Screen size: Mobile (~343px width)
- Related files:
  - src/components/vendor-scatterplot/VendorPositioningScatterPlot.tsx
  - src/components/vendor-scatterplot/AnimatedVendorLogo.tsx
  - src/utils/scatterPlotPositioning.ts

**Attempted Fixes:**
1. Changed labelHorizontalBuffer from fixed 50px/60px to dynamic `max(logoRadius * 1.5, fontSize * 4)` - didn't work
2. Changed formula from max() to additive: `logoRadius + (fontSize * 4)` - still overflowing
3. ✅ FINAL FIX: Added label width constraints and updated buffer formula

**Root Cause:**
Vendor name labels had no width constraints or overflow handling:
- Labels used `whitespace-nowrap` with no `max-width`, causing long names to overflow
- The `labelHorizontalBuffer` calculation didn't account for actual constrained label width
- Labels were absolutely positioned and could extend beyond chart boundaries
- Previous buffer formulas used `fontSize * 4` which was arbitrary and didn't match actual label dimensions

**Resolution Applied:**

**ITERATION 1 (Horizontal overflow fix):**
1. **AnimatedVendorLogo.tsx (lines 138-151):**
   - Added `maxWidth: logoSize * 3` to constrain label width
   - Added `overflow-hidden` to label container
   - Changed `whitespace-nowrap` to `truncate` class (includes text-ellipsis)
   - Long vendor names now truncate with ellipsis (e.g., "Microsoft Dyna...")

2. **scatterPlotPositioning.ts:**
   - Updated buffer formula from `logoRadius + (fontSize * 4)` to `logoRadius + (logoSize * 1.5)`
   - This matches the actual constrained label width (maxWidth = logoSize * 3, extends logoSize * 1.5 from center)

**ITERATION 2 (Bottom overflow fix):**
3. **scatterPlotPositioning.ts (lines 51-56, 156-158):**
   - Changed labelHeight from `logoSize * 1.0 + 8` to CONSERVATIVE formula:
   - `labelHeight = 4 + ceil(fontSize * 1.5) + 10 + logoRadius`
   - Accounts for: gap (4px) + actual text height (fontSize * 1.5) + safety margin (10px) + extra buffer (logoRadius)

4. **scatterPlotPositioning.ts (lines 299-306):**
   - Added **FINAL enforceEdgeConstraints** call after collision resolution
   - This ensures chart boundaries are ABSOLUTE priority over vendor collision prevention
   - Vendors may overlap slightly, but will NEVER overflow chart edges

**ITERATION 3 (Absolute overflow prevention):**
5. **VendorPositioningScatterPlot.tsx (line 304):**
   - Added `overflow-hidden` to vendor logos layer container
   - This was the missing piece - the layer containing logos didn't clip overflow
   - Creates absolute boundary: anything extending beyond chart is clipped by CSS

**ITERATION 4 (Brute-force bottom buffer - FINAL):**
6. **AnimatedVendorLogo.tsx:**
   - REVERTED elliptical container change (was causing width=32px, height=61px)
   - Kept container square: `width: logoSize, height: logoSize`

7. **scatterPlotPositioning.ts (lines 52-54, 154-156):**
   - **BRUTE FORCE APPROACH:** `labelHeight = logoSize * 2.5`
   - Eliminates all calculation complexity - just make buffer HUGE
   - Mobile (logoSize=32px): labelHeight = 80px, bottomBuffer = 96px
   - maxY = 227px, worst-case label bottom = 277px, margin = 66px
   - Trade-off: 55.7% usable height (was 65.9%), but GUARANTEED no overflow

**Expected Results:**
- ✅ Mobile (343px): 66px bottom margin (brute-force), 36px right margin
- ✅ Logos remain circular (square container preserved)
- ✅ Long vendor names truncate gracefully with ellipsis
- ✅ NO overflow possible - buffer is 2.5× logo size

**Priority System:**
1. Chart boundaries (absolute, enforced last)
2. Vendor collision prevention (secondary, best-effort)

**Multi-Layered Overflow Prevention:**
1. Conservative buffer calculations (prevent labels from reaching edges)
2. enforceEdgeConstraints (clamp logo centers within safe zones)
3. Label maxWidth constraints (limit text width)
4. Parent container overflow-hidden
5. **Vendor logos layer overflow-hidden** ← CRITICAL FIX

**Files Modified:**
- src/components/vendor-scatterplot/AnimatedVendorLogo.tsx
- src/components/vendor-scatterplot/VendorPositioningScatterPlot.tsx
- src/utils/scatterPlotPositioning.ts

**Root Cause Summary:**
Labels positioned outside parent container bounds escaped CSS overflow clipping. Multiple complex fixes (font rendering, nested positioning, container restructuring) failed. Final solution: brute-force massive bottom buffer (2.5× logo size) that makes overflow mathematically impossible regardless of rendering quirks or collision detection.

**Status:** ✅ **RESOLVED** - Brute-force buffer applied (labelHeight = logoSize * 2.5)

**Date Resolved:** 2026-01-11

---

## FEATURE UPDATE: Axis Orientation Change (2026-01-11)

**Description:** Changed scatter plot axis orientation to match user's mental model

**Changes Made:**
1. **n8n workflows updated** (TESTING & PRODUCTION):
   - Removed "(X-Axis)" and "(Y-Axis)" references
   - Updated Industry Focus mapping: 0=Vertical-Specific, 100=Multiple Verticals (reversed)

2. **Frontend semantic interpretation**:
   - Y-axis coordinates reversed: `pixelY = ((100 - y_score) / 100) * height + minY`
   - Axis labels swapped to match new orientation

3. **New quadrant mapping:**
   - Bottom-left: Vertical-Specific + Single-Purpose (niche specialists)
   - Top-right: Multiple Verticals + Multi-Function (universal platforms)

**Documentation:** See `00_IMPLEMENTATION/SPRINTS/SP_026_Vendor_Positioning_Scatter_Plot/AXIS_ORIENTATION_UPDATE.md`
