# Sprint 22: Template Carousel Section on Landing Page

**Sprint ID**: SP_022
**Status**: ✅ COMPLETE
**Date**: January 8, 2026
**Duration**: 1 day
**Type**: Feature Implementation + UX Enhancement
**Priority**: P1

---

## Objective

Add a new carousel section to the landing page showcasing template cards with category filtering. This section allows users to preview expert-validated project templates and quick-start projects with pre-configured criteria.

---

## User Story

**As a** new user visiting the landing page
**I want to** browse expert-validated project templates in a carousel format
**So that** I can quickly start a project based on similar use cases without creating criteria from scratch

---

## Requirements

### Functional Requirements

1. **Section Positioning**
   - Position carousel above "See Every Step of the Process" (CardCarousel section)
   - Maintain visual hierarchy with proper spacing

2. **Section Title**
   - Display "What others discover..." as main heading
   - Use TYPOGRAPHY.heading.h2 styling
   - Center-aligned

3. **Category Filter**
   - Reuse CategoryFilter component from templates modal
   - Show only categories with templates
   - "All" category selected by default
   - Multiple category selection support

4. **Carousel Behavior**
   - Desktop: Show 3 cards visible (35% width each)
   - Mobile: Show 1 card visible (100% width)
   - Navigation: Left/right arrow buttons + dot indicators
   - Manual navigation only (no auto-play)
   - Keyboard support: ArrowLeft/ArrowRight

5. **Card Dimensions**
   - Maintain consistent card size across all scenarios:
     - Single card: Centered, same dimensions as carousel cards
     - Two cards: Carousel mode with navigation
     - Three+ cards: Carousel mode with navigation
   - Card sizing: `flex-[0_0_100%] md:flex-[0_0_45%] lg:flex-[0_0_35%]`

6. **Card States**
   - Center card: Full opacity (1.0), normal scale (1.0)
   - Side cards: Reduced opacity (0.5), slightly scaled down (0.95)
   - Smooth transitions between states (300ms)

7. **Interaction**
   - Clicking template card opens CriteriaPreviewModal
   - "Use These Criteria" button checks email submission
   - If no email: Show EmailCollectionModal first
   - If email submitted: Create project directly
   - Navigate to CriteriaBuilder with pre-loaded criteria

### Technical Requirements

1. **Component Structure**
   - Create TemplateCarouselSection.tsx (350 lines)
   - Reuse existing components:
     - CategoryFilter for filtering
     - TemplateCard for card display
     - CriteriaPreviewModal for preview
     - EmailCollectionModal for email collection

2. **Carousel Implementation**
   - Use Embla Carousel React (consistency with CardCarousel)
   - Configuration:
     - `loop: true`
     - `align: 'center'`
     - `slidesToScroll: 1`
     - `skipSnaps: false`
     - `containScroll: false` (allows 2-card navigation on desktop)

3. **State Management**
   - Category selection state
   - Filtered templates calculation
   - Carousel selected index
   - Modal open/close states
   - Template-to-create tracking for email flow

4. **Edge Cases Handling**
   - Single card: Display centered without carousel
   - Two cards: Enable carousel with navigation
   - Three cards: Workaround for positioning bug (see below)
   - Four+ cards: Standard carousel behavior

---

## Implementation Details

### Component Files

**Created:**
- `src/components/landing/TemplateCarouselSection.tsx` (350 lines)

**Modified:**
- `src/components/landing/LandingPage.tsx` (imported and integrated component)

### Key Implementation Decisions

#### 1. Single Card Centering
**Problem**: Single cards appeared left-aligned in carousel
**Solution**: Conditional rendering - display single cards outside carousel with centered flex container

```typescript
{filteredTemplates.length === 1 ? (
  <div className="flex justify-center px-4">
    <div className="w-full md:w-[45%] lg:w-[35%]">
      <TemplateCard template={filteredTemplates[0]} />
    </div>
  </div>
) : (
  /* carousel for 2+ cards */
)}
```

#### 2. Unified Carousel for 2+ Cards
**Problem**: Card dimensions differed between 2-card and 3-card scenarios
**Solution**: Use same carousel code for all 2+ card scenarios with consistent flex-basis values

```typescript
className="flex-[0_0_100%] md:flex-[0_0_45%] lg:flex-[0_0_35%] px-4"
```

#### 3. Three-Card Positioning Workaround
**Problem**: When switching from 2 to 3 cards, 3rd card appeared outside viewport
**Root Cause**: Embla's `reInit()` doesn't properly recalculate positioning for exactly 3 cards
**Discovery**: Manually triggering right arrow after reInit fixes positioning
**Solution**: Call `scrollNext()` after reInit for 3-card scenario, accept middle card being focused

```typescript
// WORKAROUND: When exactly 3 cards appear, reInit() doesn't position them correctly
// (card 3 appears outside viewport). Triggering scrollNext() forces Embla to
// recalculate positioning properly. Middle card (index 1) will be focused.
if (filteredTemplates.length === 3) {
  requestAnimationFrame(() => {
    emblaApi.scrollNext(); // Fixes positioning, lands on middle card
  });
} else {
  // For other card counts, scroll to first card
  emblaApi.scrollTo(0, true);
}
```

**Trade-off Accepted**: Middle card focused on 3-card initialization (user can navigate to first card with left arrow)

#### 4. Carousel Reset on Filter Change
**Problem**: Carousel didn't reset to first card when switching categories
**Solution**: Use `selectedCategories` as useEffect dependency instead of `filteredTemplates`

```typescript
useEffect(() => {
  if (emblaApi && filteredTemplates.length > 0) {
    requestAnimationFrame(() => {
      emblaApi.reInit();
      // ... positioning logic
    });
  }
}, [emblaApi, selectedCategories, filteredTemplates.length]);
```

#### 5. Desktop Navigation for 2 Cards
**Problem**: Arrow buttons didn't work with 2 cards on desktop (both cards fit in viewport)
**Solution**: Set `containScroll: false` in Embla config to allow scrolling even when slides fit

### Integration with Existing Features

1. **Template Service**
   - Uses `createProjectFromTemplate()` from templateService.ts
   - Skips n8n webhook (templates pre-configured)
   - Direct localStorage save

2. **Email Collection**
   - Checks `hasSubmittedEmail()` before project creation
   - Shows EmailCollectionModal if email not collected
   - Proceeds with project creation after email submission

3. **Project Creation Flow**
   - Creates project with template data
   - Saves criteria to localStorage
   - Shows success toast with criteria count
   - Calls `onTemplateProjectCreated` callback
   - LandingPage automatically selects new project

---

## Testing Approach

### Manual Testing Scenarios

1. **Category Filtering**
   - ✅ Default "All" shows all templates
   - ✅ Selecting category filters to matching templates
   - ✅ Switching categories resets carousel position

2. **Single Card Display**
   - ✅ Card centered on desktop
   - ✅ Card centered on mobile
   - ✅ No navigation controls shown
   - ✅ Click opens CriteriaPreviewModal

3. **Two Card Display**
   - ✅ Cards visible in carousel
   - ✅ Arrow navigation works on desktop
   - ✅ Arrow navigation works on mobile
   - ✅ Dot indicators update correctly
   - ✅ Consistent card dimensions

4. **Three Card Display**
   - ✅ All cards visible after filter switch
   - ✅ Middle card focused initially (acceptable)
   - ✅ Navigation to all cards works
   - ✅ Card dimensions match other scenarios

5. **Four+ Card Display**
   - ✅ Carousel navigation smooth
   - ✅ Center card highlighted
   - ✅ Side cards partially visible with reduced opacity

6. **Modal Interactions**
   - ✅ Card click opens CriteriaPreviewModal
   - ✅ "Use These Criteria" checks email status
   - ✅ EmailCollectionModal shown if needed
   - ✅ Project created after email submission
   - ✅ Navigation to CriteriaBuilder works

7. **Responsive Behavior**
   - ✅ Desktop: 3 cards visible (35% each)
   - ✅ Tablet: 2 cards visible (45% each)
   - ✅ Mobile: 1 card visible (100%)
   - ✅ Smooth transitions between breakpoints

8. **Keyboard Navigation**
   - ✅ ArrowLeft navigates to previous card
   - ✅ ArrowRight navigates to next card
   - ✅ Global keyboard listener doesn't conflict

---

## Code Quality & Cleanup

### Applied Optimizations

1. **Removed Redundant State Update**
   - Removed `setSelectedIndex(0)` (handled by `onSelect` callback)

2. **Expanded Workaround Comment**
   - Added detailed explanation of 3-card positioning bug
   - Documented root cause and solution

3. **Simplified useMemo Dependency**
   - Changed `categories` dependency from `[templates]` to `[]`
   - Templates are static import, no need for reactive dependency

---

## Technical Debt & Future Improvements

### Known Issues

1. **Three-Card Workaround**
   - Issue: `scrollNext()` hack for 3-card positioning
   - Impact: Middle card focused instead of first card
   - Trade-off: Acceptable UX (user can navigate left)
   - Future: Deep-dive into Embla reInit() behavior or upgrade library

2. **Global Keyboard Listener**
   - Issue: Arrow key listener affects entire page
   - Impact: Minor - could conflict with other components
   - Future: Scope listener to component or use focus detection

### Future Enhancements

1. **Auto-play Option**
   - Add optional auto-rotation like CardCarousel
   - Include pause/play control

2. **Swipe Gestures**
   - Enable mobile swipe navigation
   - Already supported by Embla, just needs gesture detection

3. **Template Metadata**
   - Show template usage count
   - Display "Popular" or "Trending" badges
   - Add template ratings/reviews

4. **Accessibility**
   - Add ARIA labels for navigation
   - Improve screen reader support
   - Focus management for keyboard users

---

## Files Changed

### Created
- `src/components/landing/TemplateCarouselSection.tsx` (350 lines)

### Modified
- `src/components/landing/LandingPage.tsx`
  - Imported TemplateCarouselSection
  - Integrated above CardCarousel
  - Added onTemplateProjectCreated handler

### Dependencies
- Uses existing: `templates.json`, `CategoryFilter.tsx`, `TemplateCard.tsx`, `CriteriaPreviewModal.tsx`, `EmailCollectionModal.tsx`
- No new package dependencies

---

## Success Metrics

### Quantitative
- ✅ Component renders without errors
- ✅ All 7 manual testing scenarios pass
- ✅ No console warnings or errors
- ✅ Code cleanup completed (3 optimizations applied)
- ✅ Zero regressions in existing features

### Qualitative
- ✅ Smooth carousel animations
- ✅ Intuitive navigation controls
- ✅ Consistent card dimensions across scenarios
- ✅ Professional visual design
- ✅ Seamless integration with landing page

---

## Deployment Notes

### Pre-Deployment Checklist
- ✅ Code reviewed and optimized
- ✅ Manual testing completed
- ✅ No breaking changes to existing features
- ✅ Development server tested (localhost:8080)
- ✅ Documentation updated (this file)

### Deployment Steps
1. ✅ Development server verified running
2. ✅ Component integrated into LandingPage
3. ✅ All user flows tested
4. ⏳ Ready for production build

### Post-Deployment
- Monitor user engagement with template carousel
- Track which templates are most popular
- Gather feedback on navigation UX
- Consider A/B testing auto-play vs manual navigation

---

## Lessons Learned

### What Went Well
- Embla Carousel consistent with CardCarousel (easier to maintain)
- Reusing existing components (CategoryFilter, TemplateCard, modals) saved time
- Conditional rendering for single card solved centering issue cleanly
- Code cleanup improved maintainability

### Challenges Overcome
- Three-card positioning bug required multiple hypothesis testing
- Unified carousel approach better than special-casing 2 cards
- requestAnimationFrame timing critical for reInit() reliability

### What Could Be Improved
- Earlier investigation into Embla's reInit() behavior would have saved debugging time
- Consider writing automated tests for carousel edge cases
- Document workarounds more prominently in code comments

---

## References

- Embla Carousel React: https://www.embla-carousel.com/
- Template data: `src/data/templates/templates.json`
- Related components: `CategoryFilter.tsx`, `TemplateCard.tsx`, `CriteriaPreviewModal.tsx`
- Integration: SP_021 (Project Templates Feature)

---

**Sprint Owner**: AI Development Team
**Reviewed By**: User
**Approved**: January 8, 2026

---

*Last Updated: January 8, 2026*
*Status: ✅ COMPLETE*
