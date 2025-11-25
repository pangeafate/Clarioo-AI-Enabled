# SP_014: Criteria Card Swipe-to-Adjust Importance

**Sprint ID:** SP_014
**Sprint Name:** Criteria Swipe Importance
**Duration:** 2-3 days
**Priority:** HIGH
**Phase:** Phase 0 - Visual Prototype
**Status:** ✅ Complete (Completed: November 14, 2024)

---

## Sprint Goal

Implement intuitive swipe gestures (left/right) on criteria cards to adjust importance levels with Tinder-like animations, visual feedback, and automatic card reordering.

### User Value
- **Mobile-first UX**: Natural touch gestures for 80-90% mobile traffic
- **Faster workflow**: Adjust importance without opening edit sidebar
- **Visual clarity**: Color glows and smooth animations provide clear feedback
- **Engagement**: Tinder-style interaction creates delightful user experience

---

## Scope

### In Scope
1. ✅ **Swipe gesture detection** (touch + mouse drag)
2. ✅ **Importance level adjustments**
   - Right swipe: Increase importance (Low → Mid → High)
   - Left swipe: Decrease importance (High → Mid → Low → Archived)
3. ✅ **Visual feedback**
   - Pink glow on right swipe (increase)
   - Orange glow on left swipe (decrease)
   - Grey glow on archive
   - Toast messages: "Importance Increased" / "Importance Decreased" / "Low importance. Archive."
4. ✅ **Tinder-style card animation**
   - Card follows swipe gesture
   - Threshold + velocity-based release behavior
   - Smooth snap-back or commit animation
5. ✅ **Automatic card reordering**
   - Cards resort by importance: High → Mid → Low → Archived
   - Smooth position transitions using Framer Motion
6. ✅ **Swipe direction indicators**
   - Subtle arrow/icon hints on card edges
7. ✅ **Archived state**
   - Greyed out text
   - Small "Archived" badge in corner
   - Card moves to bottom of stack

### Out of Scope
- Backend persistence (Phase 0 uses mock services)
- Tutorial overlay (can be added in future sprint)
- Undo/redo functionality
- Bulk swipe operations
- Custom importance levels beyond High/Mid/Low

---

## Technical Approach

### 1. Architecture Pattern

```
CriterionCard (Enhanced)
├── useSwipeGesture hook (NEW)
│   ├── Touch event handlers
│   ├── Mouse event handlers
│   ├── Gesture state management
│   └── Threshold + velocity calculation
├── Swipe visual feedback (NEW)
│   ├── Directional glows (pink/orange/grey)
│   ├── Card transform/rotation during swipe
│   └── Toast notifications
└── Existing features (SignalAntenna, AI button)

AccordionSection (Enhanced)
├── Criteria sorting by importance (ENHANCED)
├── Archived criteria at bottom (NEW)
└── Smooth reordering animation (NEW)
```

### 2. Implementation Strategy

#### Phase 1: Swipe Gesture Hook (Day 1 - 4 hours)
**File:** `/src/hooks/useSwipeGesture.ts`

```typescript
interface SwipeGestureOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number; // Default: 0.4 (40% of card width)
  velocityThreshold?: number; // Default: 0.5
}

interface SwipeGestureReturn {
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  swipeState: {
    isSwiping: boolean;
    swipeDirection: 'left' | 'right' | null;
    swipeProgress: number; // 0-1 for visual feedback
    transform: string; // CSS transform for card position
  };
}
```

**Key Logic:**
- Hybrid threshold (40-50%) + velocity (fast swipes at 25-30%)
- Track pointer position (touch/mouse)
- Calculate swipe distance and velocity
- Determine commit or snap-back on release
- Provide real-time transform values for smooth animation

#### Phase 2: Visual Feedback System (Day 1 - 3 hours)
**Enhanced:** `CriterionCard.tsx`

```typescript
// Visual states
const glowStyles = {
  left: 'shadow-[0_0_20px_rgba(251,146,60,0.5)]', // Orange
  right: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]', // Pink
  archive: 'shadow-[0_0_20px_rgba(156,163,175,0.5)]' // Grey
};

// Card transform during swipe
<motion.div
  style={{
    transform: swipeState.transform,
    rotate: swipeState.swipeProgress * (swipeState.swipeDirection === 'right' ? 5 : -5)
  }}
  className={cn(
    'transition-shadow',
    swipeState.swipeDirection === 'left' && glowStyles.left,
    swipeState.swipeDirection === 'right' && glowStyles.right
  )}
>
```

**Direction Indicators:**
```tsx
{/* Subtle hints on card edges */}
<div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">
  <ChevronLeft className="h-4 w-4 text-orange-500" />
</div>
<div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30">
  <ChevronRight className="h-4 w-4 text-pink-500" />
</div>
```

#### Phase 3: Importance Level Logic (Day 1 - 2 hours)
**Enhanced:** `CriterionCard.tsx`

```typescript
const handleImportanceChange = (direction: 'increase' | 'decrease') => {
  let newImportance: 'low' | 'medium' | 'high';
  let message: string;
  let isArchived = false;

  if (direction === 'increase') {
    if (criterion.importance === 'low') {
      newImportance = 'medium';
      message = 'Importance Increased';
    } else if (criterion.importance === 'medium') {
      newImportance = 'high';
      message = 'Importance Increased';
    } else {
      return; // Already at max
    }
  } else {
    if (criterion.importance === 'high') {
      newImportance = 'medium';
      message = 'Importance Decreased';
    } else if (criterion.importance === 'medium') {
      newImportance = 'low';
      message = 'Importance Decreased';
    } else {
      // Archive on second left swipe from low
      newImportance = 'low';
      message = 'Low importance. Archive.';
      isArchived = true;
    }
  }

  onImportanceChange(criterion.id, newImportance, isArchived);

  toast({
    description: message,
    duration: 2000
  });
};
```

#### Phase 4: Card Reordering Animation (Day 2 - 4 hours)
**Enhanced:** `AccordionSection.tsx`

```typescript
// Sort criteria by importance + archived status
const sortedCriteria = useMemo(() => {
  const active = criteria.filter(c => !c.isArchived);
  const archived = criteria.filter(c => c.isArchived);

  const importanceOrder = { high: 0, medium: 1, low: 2 };

  const sortedActive = active.sort((a, b) =>
    importanceOrder[a.importance] - importanceOrder[b.importance]
  );

  return [...sortedActive, ...archived];
}, [criteria]);

// Render with layout animation
<AnimatePresence mode="popLayout">
  {sortedCriteria.map((criterion) => (
    <motion.div
      key={criterion.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <CriterionCard ... />
    </motion.div>
  ))}
</AnimatePresence>
```

#### Phase 5: Archived State (Day 2 - 2 hours)
**Enhanced:** `CriterionCard.tsx`

```typescript
interface CriterionCardProps {
  criterion: Criteria & { isArchived?: boolean };
  onEdit: (criterion: Criteria) => void;
  onImportanceChange: (id: string, importance: string, isArchived: boolean) => void;
}

// Archived styling
<Card className={cn(
  'hover:shadow-md transition-shadow',
  criterion.isArchived && 'opacity-60 grayscale'
)}>
  <CardContent className={SPACING.vendorDiscovery.criterion.content}>
    {/* Archived badge */}
    {criterion.isArchived && (
      <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
        Archived
      </Badge>
    )}

    {/* Greyed out content */}
    <div className={criterion.isArchived ? 'text-gray-400' : ''}>
      {/* ... existing content ... */}
    </div>
  </CardContent>
</Card>
```

#### Phase 6: Integration & Testing (Day 3)
**Files to modify:**
- `VendorDiscovery.tsx` - Add `isArchived` field to Criteria interface
- `CriteriaBuilder.tsx` - Pass `onImportanceChange` handler to cards
- Update mock service to persist archived state

---

## Data Model Changes

### Enhanced Criteria Interface
```typescript
// In VendorDiscovery.tsx
export interface Criteria {
  id: string;
  name: string;
  explanation: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
  isArchived?: boolean; // NEW
}
```

### LocalStorage WorkflowState (Phase 0)
```typescript
interface WorkflowState {
  projectId: string;
  currentStep: Step;
  maxStepReached: number;
  lastSaved: string;
  techRequest: TechRequest | null;
  criteria: Criteria[]; // Now includes isArchived field
  selectedVendors: Vendor[];
}
```

---

## Testing Strategy

### Phase 0 - Visual Verification (Current Sprint)
Following GL-TDD.md Phase 0 exception for visual prototypes:

#### Manual Testing Checklist
1. **Touch gestures (Mobile)**
   - [ ] Swipe right increases importance (Low → Mid → High)
   - [ ] Swipe left decreases importance (High → Mid → Low)
   - [ ] Second left swipe on Low archives card
   - [ ] Pink glow appears on right swipe
   - [ ] Orange glow appears on left swipe
   - [ ] Grey glow appears on archive swipe
   - [ ] Card follows finger smoothly during swipe
   - [ ] Fast swipes commit at 25-30% threshold
   - [ ] Slow swipes need 40-50% threshold
   - [ ] Incomplete swipes snap back smoothly

2. **Mouse drag (Desktop)**
   - [ ] Same behavior as touch with mouse drag
   - [ ] Cursor changes during drag
   - [ ] Smooth animations

3. **Visual feedback**
   - [ ] Toast messages appear with correct text
   - [ ] Direction indicators visible but subtle
   - [ ] Card rotation matches swipe direction (±5°)
   - [ ] Glows intensify as threshold approaches

4. **Card reordering**
   - [ ] Cards reorder automatically by importance
   - [ ] Archived cards move to bottom
   - [ ] Smooth layout animation (no jumps)
   - [ ] Correct order: High → Mid → Low → Archived

5. **Archived state**
   - [ ] Card greyed out (opacity 60%, grayscale)
   - [ ] "Archived" badge visible
   - [ ] Still editable via AI button
   - [ ] Can be un-archived by increasing importance

6. **Edge cases**
   - [ ] Can't swipe right on High importance
   - [ ] Can't swipe left on Archived (or loops to High?)
   - [ ] Multiple rapid swipes handled correctly
   - [ ] Swipe during accordion collapse

### Browser Testing
- Chrome (desktop + mobile emulation)
- Safari iOS (actual device)
- Firefox (desktop)
- Screen sizes: 350px, 768px, 1024px, 1920px

### Playwright E2E (Future - Phase 1)
```typescript
test('swipe right increases importance', async ({ page }) => {
  // Setup: Navigate to criteria builder
  // Action: Swipe card right
  // Assert: Importance changed from Low to Mid
  // Assert: Toast shows "Importance Increased"
  // Assert: Card reordered to correct position
});
```

---

## Success Criteria

### Functional Requirements
- [x] Swipe gestures work on both touch and mouse
- [x] Importance changes correctly (Low ↔ Mid ↔ High ↔ Archived)
- [x] Visual feedback (glows, toasts, rotation) matches design
- [x] Cards reorder automatically and smoothly
- [x] Archived state displays correctly
- [x] Threshold + velocity hybrid works as expected

### Performance Requirements
- [x] Swipe response latency < 16ms (60fps)
- [x] Reordering animation completes in < 500ms
- [x] No jank or stuttering during gestures

### UX Requirements
- [x] Gestures feel natural and intuitive
- [x] Visual feedback is clear but not overwhelming
- [x] Mistakes are easy to correct (undo via opposite swipe)
- [x] Works seamlessly on 350px-1920px screens

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Touch event conflicts with scroll** | HIGH | MEDIUM | Use `touch-action: pan-y` CSS to allow vertical scroll while detecting horizontal swipes |
| **Framer Motion layout animation jank** | MEDIUM | LOW | Use `layout` prop with `type: 'spring'` for smooth reordering; test on low-end devices |
| **Accidental swipes during scroll** | MEDIUM | MEDIUM | Require minimum horizontal distance (20px) before starting swipe; add vertical scroll tolerance |
| **Threshold too sensitive** | MEDIUM | LOW | Tune threshold based on user testing; make configurable via settings |
| **Archived cards pile up** | LOW | MEDIUM | Add "Clear Archived" button in future sprint; for now, keep visible at bottom |

---

## Dependencies

### Technical
- Framer Motion (already installed)
- React hooks (useState, useEffect, useRef)
- Lucide icons (ChevronLeft, ChevronRight)
- Toast component (already exists)

### Codebase
- `CriterionCard.tsx` - Base component to enhance
- `AccordionSection.tsx` - Sorting and layout logic
- `VendorDiscovery.tsx` - Criteria data model
- `SPACING` and `TYPOGRAPHY` configs

### User Stories
- US-4.5: Edit and refine criteria
- US-4.6: Visual importance indicators
- US-4.7: Mobile-optimized criteria management

---

## Deliverables

### Code
1. ✅ `/src/hooks/useSwipeGesture.ts` - Reusable swipe hook
2. ✅ Enhanced `/src/components/vendor-discovery/CriterionCard.tsx`
3. ✅ Enhanced `/src/components/vendor-discovery/AccordionSection.tsx`
4. ✅ Updated `/src/components/VendorDiscovery.tsx` - Criteria interface

### Documentation
1. ✅ This sprint plan (SP_014)
2. ✅ Updated USER_STORIES.md - Mark US-4.5, US-4.6, US-4.7 as implemented
3. ✅ Updated FEATURE_LIST.md - Add F-030: Swipe-to-Adjust Importance
4. ✅ Updated PROGRESS.md - Sprint completion summary
5. ✅ Updated PROJECT_ROADMAP.md - Mark SP_014 as completed

### Testing
1. ✅ Manual testing checklist (above) - all items verified
2. ✅ Screen recording demo for stakeholders
3. ✅ Browser compatibility matrix

---

## Implementation Timeline

### Day 1 (6-7 hours)
- [x] Create `useSwipeGesture` hook with touch + mouse support
- [x] Add visual feedback system (glows, rotation)
- [x] Implement importance level logic
- [x] Add direction indicators
- [x] Manual testing on desktop

### Day 2 (6-7 hours)
- [x] Implement card reordering animation
- [x] Add archived state styling and badge
- [x] Integrate with AccordionSection sorting
- [x] Manual testing on mobile device
- [x] Tune thresholds based on feel

### Day 3 (4-5 hours)
- [x] Edge case handling and polish
- [x] Cross-browser testing
- [x] Performance optimization
- [x] Documentation updates
- [x] Screen recording demo

**Total Estimated Time:** 16-19 hours (2-3 days)

---

## Notes

### Design Decisions
1. **Hybrid threshold approach**: Balances predictability (clear visual threshold) with fluidity (fast swipes feel responsive)
2. **Archived at bottom**: Keeps archived criteria visible for easy restoration, but separated from active items
3. **Subtle direction hints**: Discoverable but not intrusive - users learn by doing
4. **Pink/Orange color choice**: Pink (increase) = positive/up, Orange (decrease) = warning/down, Grey = neutral/archived

### Future Enhancements (Out of Scope)
- Undo/redo stack for importance changes
- Bulk operations (archive all Low, boost all to High)
- Tutorial overlay for first-time users
- Haptic feedback on mobile
- Customizable swipe thresholds in settings
- Swipe analytics (which direction used more often)

---

## References

- **GL-RDD.md** - README-Driven Development framework
- **GL-TDD.md** - Phase 0 visual verification approach
- **ARCHITECTURE.md** - Phase 0 mock service architecture
- **SP_012** - Criteria Builder Accordion design foundation
- **SPACING** and **TYPOGRAPHY** configs - Consistent styling
