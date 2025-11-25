# SP_015 Wave Chart Testing Guide

**Sprint**: SP_015 - Vendor Comparison Matrix with Wave Charts
**Status**: Implementation Complete - Ready for Testing
**Date**: November 16, 2024

---

## Implementation Summary

### ✅ Completed Phases (1-6)

1. **Phase 1**: TypeScript type definitions (`comparison.types.ts`) ✅
2. **Phase 2**: Catmull-Rom spline interpolation utility (`splineInterpolation.ts`) ✅
3. **Phase 3**: Wave chart core components (WaveChart, VendorWave, ChartGrid) ✅
4. **Phase 4**: Vendor navigation system (VendorNavigator, VendorIndicator) ✅
5. **Phase 5**: Mock wave chart data (`wave-chart-data.json`) ✅
6. **Phase 6**: VendorComparison.tsx component ✅

### 📋 Phase 7: Responsive Design Testing (In Progress)

Critical requirement: **Must work on 350px width screens**

---

## Testing Instructions

### Access the Test Page

**Dev Server Running**: http://localhost:8082/

**Test Route**: http://localhost:8082/comparison

### Test Cases

#### 1. Mobile Testing (350px - 767px)

**Critical Requirement**: Must work at **350px minimum width**

**How to Test**:
1. Open http://localhost:8082/comparison in Chrome/Firefox
2. Open DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
4. Set custom dimensions:
   - **350px width** (minimum required)
   - 375px width (iPhone SE)
   - 390px width (iPhone 12/13/14)
   - 430px width (iPhone 14 Pro Max)

**Expected Behavior**:
- ✅ Wave charts render without horizontal scroll
- ✅ Criterion labels truncate to 8 characters ("Security..." instead of "Security and Compliance")
- ✅ Vendor panels stack vertically (single column)
- ✅ Navigation controls remain functional
- ✅ Dots indicator shows condensed view for 5+ vendors
- ✅ Chart dimensions: width 350px, height 280px
- ✅ All text remains readable
- ✅ No layout breaks or overlapping elements

#### 2. Tablet Testing (768px - 1024px)

**Test Widths**: 768px, 820px, 1024px

**Expected Behavior**:
- ✅ Vendor panels side-by-side (2 columns)
- ✅ Criterion labels truncate to 12 characters
- ✅ Chart dimensions: width 600px, height 350px
- ✅ Smooth transitions between mobile/tablet breakpoints

#### 3. Desktop Testing (1024px - 1440px)

**Test Widths**: 1280px, 1366px, 1440px

**Expected Behavior**:
- ✅ Full-width vendor panels side-by-side
- ✅ Criterion labels truncate to 16 characters
- ✅ Chart dimensions: width 800px, height 400px
- ✅ Enhanced spacing and padding

#### 4. Wide Screen Testing (1440px - 1920px+)

**Test Widths**: 1920px, 2560px

**Expected Behavior**:
- ✅ Maximum chart width capped appropriately
- ✅ Full criterion labels visible (20 chars)
- ✅ Optimal spacing for large screens

---

## Functional Testing

### Navigation Controls

**Test Steps**:
1. Click "Previous" and "Next" buttons
2. Click on dot indicators to jump to specific vendors
3. Verify vendor names update correctly
4. Verify wave charts animate smoothly

**Expected Behavior**:
- ✅ Independent navigation for each panel
- ✅ Can compare any two vendors (e.g., Vendor 1 vs Vendor 5)
- ✅ Smooth Framer Motion transitions (500ms)
- ✅ Disabled state for buttons at list boundaries

### Wave Chart Visualization

**Test Steps**:
1. Observe wave path smoothness
2. Verify all criterion points are connected
3. Check data point hover states
4. Verify Y-axis shows 0-100% scale
5. Verify X-axis shows all criterion labels

**Expected Behavior**:
- ✅ Smooth Catmull-Rom curves (no sharp corners)
- ✅ Wave path animates on initial render
- ✅ Data points scale on hover (1.5x)
- ✅ Grid lines visible and properly aligned
- ✅ Labels rotated on mobile if many criteria

### Project Data Loading

**Test Different Projects**:
1. Default: http://localhost:8082/comparison (CRM System - 8 criteria, 5 vendors)
2. HR: http://localhost:8082/comparison?projectId=project-hr-002 (6 criteria, 3 vendors)
3. Marketing: http://localhost:8082/comparison?projectId=project-marketing-003 (9 criteria, 4 vendors)

**Expected Behavior**:
- ✅ Correct project data loads
- ✅ Vendor shortlists match project
- ✅ Criteria and scores display correctly

---

## Visual Quality Checks

### Colors and Branding

- ✅ Vendor 1 panel: Indigo accent (indigo-50 bg, indigo-600 wave)
- ✅ Vendor 2 panel: Purple accent (purple-50 bg, purple-600 wave)
- ✅ Grid lines: Light gray (#e5e7eb)
- ✅ Text: Proper contrast ratios for accessibility

### Typography

- ✅ Headings: Semibold, appropriate sizes
- ✅ Labels: Readable at all screen sizes
- ✅ Truncation: Ellipsis (...) for long text
- ✅ No text overflow or wrapping issues

### Spacing and Layout

- ✅ Consistent padding (px-4, py-6)
- ✅ Gap between panels: 1.5rem (mobile) to 2rem (desktop)
- ✅ No cramped elements on 350px
- ✅ Proper white space utilization

---

## Performance Testing

### Animation Performance

**Test Steps**:
1. Navigate between vendors quickly
2. Observe wave path animation smoothness
3. Check for janky transitions or lag

**Expected Behavior**:
- ✅ 60fps animations (use DevTools Performance tab)
- ✅ No layout thrashing
- ✅ Smooth spring physics transitions

### ResizeObserver

**Test Steps**:
1. Resize browser window from 350px to 1920px
2. Rotate device (if testing on mobile device)
3. Observe chart dimension updates

**Expected Behavior**:
- ✅ Instant breakpoint detection
- ✅ Charts resize without flickering
- ✅ No multiple re-renders

---

## Browser Compatibility

**Test Browsers**:
- ✅ Chrome 120+ (primary)
- ✅ Firefox 120+
- ✅ Safari 17+ (macOS/iOS)
- ✅ Edge 120+

**Mobile Browsers** (if available):
- ✅ Safari iOS
- ✅ Chrome Android

---

## Known Limitations (Phase 0 - Prototype)

### Not Yet Implemented (Future Phases):

- ❌ Criterion detail drawer (click criterion to view details)
- ❌ Criterion chat/edit functionality
- ❌ Tooltip overlays on wave point hover
- ❌ Swipe gestures for mobile navigation
- ❌ Keyboard shortcuts (Arrow keys disabled in current build)
- ❌ Export comparison as PDF/PNG
- ❌ Share comparison link

These features are planned for future sprints after Phase 0 visual validation.

---

## Bug Reporting

If you encounter any issues during testing, please document:

1. **Screen width** where issue occurs
2. **Browser** and version
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Screenshot** (if visual bug)

---

## Test Checklist Summary

### Critical (Must Pass)

- [ ] **350px width works perfectly** (no horizontal scroll, all content visible)
- [ ] Build completes with no TypeScript errors ✅
- [ ] Wave charts render smoothly on all breakpoints
- [ ] Navigation controls functional
- [ ] Mock data loads correctly

### Important

- [ ] Responsive breakpoints transition smoothly
- [ ] Animations perform at 60fps
- [ ] Text truncation works correctly
- [ ] Visual design matches mobile-first principles

### Nice to Have

- [ ] Tested on physical mobile device
- [ ] Tested on Safari iOS
- [ ] Tested with 10+ vendors in shortlist
- [ ] Tested with 15+ criteria

---

## Next Steps After Testing

Once testing is complete:

1. **Phase 8**: Final build verification ✅ (Already completed)
2. Document any bugs found
3. Create follow-up sprint for interactive features (Phase 2)
4. Plan integration with existing VendorDiscovery workflow

---

## Files Created in SP_015

### Type Definitions
- `src/types/comparison.types.ts` (400+ lines)

### Utilities
- `src/utils/splineInterpolation.ts`

### Components
- `src/components/VendorComparison.tsx` (main container)
- `src/components/vendor-comparison/wave-chart/WaveChart.tsx`
- `src/components/vendor-comparison/wave-chart/VendorWave.tsx`
- `src/components/vendor-comparison/wave-chart/ChartGrid.tsx`
- `src/components/vendor-comparison/navigation/VendorNavigator.tsx`
- `src/components/vendor-comparison/navigation/VendorIndicator.tsx`

### Mock Data
- `src/data/comparisons/wave-chart-data.json` (3 projects, 12 vendors, 23 criteria)

### Configuration
- `src/App.tsx` (updated with /comparison route)

---

**Testing Status**: Ready for manual testing
**Dev Server**: http://localhost:8082/comparison
**Estimated Testing Time**: 30-45 minutes for comprehensive test coverage
