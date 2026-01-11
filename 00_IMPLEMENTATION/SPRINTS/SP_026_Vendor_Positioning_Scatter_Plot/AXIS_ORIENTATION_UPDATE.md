# Axis Orientation Update - Scatter Plot

**Date:** 2026-01-11
**Sprint:** SP_026

## User Requirement

Update scatter plot axis orientation so that:
- **Bottom-left corner:** Vertical-Specific + Single-Purpose
- **Top-right corner:** Multiple Verticals + Multi-Function

## Changes Summary

### 1. N8N Workflow Updates

**Files Modified:**
- `IMPROVED_SCATTERPLOT_PROMPT.txt`
- `Clarioo_AI_Vendor_Scatterplot_TESTING.json`
- `Clarioo_AI_Vendor_Scatterplot_PRODUCTION.json`

**Changes:**
- Removed explicit axis references: "(X-Axis)" and "(Y-Axis)" from dimension headers
- Updated Industry Focus semantic mapping to match new orientation:
  - **Score 0-20:** Vertical-Specific (was Multiple Verticals)
  - **Score 80-100:** Multiple Verticals (was Vertical-Specific)
- Kept Solution Scope unchanged (already correct):
  - **Score 0-20:** Single-Purpose
  - **Score 80-100:** Multi-Function

### 2. Frontend Updates

**Files Modified:**
- `src/utils/scatterPlotPositioning.ts`
- `src/components/vendor-scatterplot/VendorPositioningScatterPlot.tsx`

**Changes:**

#### A. Y-Axis Coordinate Reversal (scatterPlotPositioning.ts:92)
```typescript
// OLD (direct mapping):
const pixelY = (pos.y_score / 100) * usableHeight + minY;

// NEW (reversed mapping):
const pixelY = ((100 - pos.y_score) / 100) * usableHeight + minY;
```

**Rationale:**
- n8n returns: 0 = Vertical-Specific, 100 = Multiple Verticals
- SVG coordinates: y=0 is TOP, y=max is BOTTOM
- Desired: Vertical-Specific at BOTTOM, Multiple Verticals at TOP
- Solution: Reverse Y scores in normalization

#### B. Axis Label Updates (VendorPositioningScatterPlot.tsx)

**X-axis labels:**
- Left quadrant: ~~Multi-Function~~ → **Single-Purpose**
- Right quadrant: ~~Single-Purpose~~ → **Multi-Function**

**Y-axis labels:**
- Top quadrant: ~~Vertical-Specific~~ → **Multiple Verticals**
- Bottom quadrant: ~~Multiple Verticals~~ → **Vertical-Specific**

#### C. Documentation Updates
- Component header comment
- Card description text

## New Axis Mapping

### Semantic Scores (from n8n)
| Score | Solution Scope (X) | Industry Focus (Y) |
|-------|-------------------|-------------------|
| 0-20  | Single-Purpose | Vertical-Specific |
| 40-60 | Focused Suites | Industry-Focused |
| 80-100 | Multi-Function | Multiple Verticals |

### Visual Positioning (on chart)
| Position | X-axis | Y-axis |
|----------|--------|--------|
| Left | Single-Purpose | N/A |
| Right | Multi-Function | N/A |
| Top | N/A | Multiple Verticals |
| Bottom | N/A | Vertical-Specific |

### Quadrants
| Quadrant | Position | Interpretation |
|----------|----------|---------------|
| **Bottom-Left** | Single-Purpose + Vertical-Specific | Niche specialists |
| **Bottom-Right** | Multi-Function + Vertical-Specific | Industry platform |
| **Top-Left** | Single-Purpose + Multiple Verticals | Horizontal tool |
| **Top-Right** | Multi-Function + Multiple Verticals | Universal platform |

## Implementation Details

### Frontend Interprets Semantically
The frontend now:
1. Receives semantic scores from n8n (not axis positions)
2. Interprets scores based on their meaning
3. Maps to visual positions using reversed Y-axis
4. Places vendors in correct quadrants

### n8n Workflows
- No longer reference "(X-Axis)" or "(Y-Axis)"
- Provide semantic scores based on vendor characteristics
- Frontend handles all axis mapping logic

## Testing Checklist

- [ ] Clear localStorage cache to fetch new positions
- [ ] Verify bottom-left vendors are Single-Purpose + Vertical-Specific
- [ ] Verify top-right vendors are Multi-Function + Multiple Verticals
- [ ] Check axis labels match new orientation
- [ ] Test with multiple vendor datasets

## Migration Notes

**For existing cached data:**
- Users will see inverted Y-axis until cache expires or is cleared
- Recommend clearing `vendorScatterplotPositions_[projectId]` from localStorage

**For n8n workflows:**
- Both TESTING and PRODUCTION workflows updated
- Next vendor analysis will use new semantic mappings
- No data migration needed - new requests will use new orientation
