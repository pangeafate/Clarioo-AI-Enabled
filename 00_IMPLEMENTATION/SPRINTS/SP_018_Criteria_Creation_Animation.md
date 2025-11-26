# Sprint 018: Criteria Creation Animation - SVG Grid with Flying Phrases

**Status**: Planning
**Priority**: High
**Sprint Start**: 2025-01-26
**Estimated Duration**: 1 day

---

## 🎯 Sprint Goal

Replace the magic wand project creation animation with a dynamic 3x3 grid of SVG icons (checkmarks, crosses, rectangles) that draw and shuffle, accompanied by flying text phrases describing the AI's progress. Animation runs until API returns criteria, then transitions to success state.

---

## 📋 Current State Analysis

### Existing Implementation (ProjectCreationAnimation.tsx)

**Current Flow:**
1. **Creating State**: Magic wand icon with rotating sparkles + "Magic in progress!" text
2. Minimum 4.5 seconds animation duration
3. Waits for `isApiComplete` prop
4. **Success State**: Green checkmark + confetti + "Success! I have created 20+ selection criteria"
5. Auto-closes after 2 seconds, triggers `onComplete()`

**Current Props:**
```typescript
interface ProjectCreationAnimationProps {
  isOpen: boolean;
  onComplete: () => void;
  isApiComplete?: boolean; // When true, animation proceeds to success
}
```

**File Location:**
- `src/components/landing/ProjectCreationAnimation.tsx`

---

## 🎨 New Design Specification

### Animation Architecture

**Three Phases:**
1. **Grid Drawing Phase** (0-2s): SVG paths draw in sequence
2. **Grid Shuffling + Text Phase** (2s - API completion): Grid shuffles 4-5 times, text phrases fly
3. **Success State** (API complete): Green checkmark + confetti + success message

### Phase 1: Grid Drawing (0-2 seconds)

**3x3 Grid Layout:**
- **3 Checkmarks (✓)**: Green color (#10B981 / #16A34A)
- **3 Crosses (✗)**: Red color (#EF4444 / #DC2626)
- **3 Rectangles (□)**: Clarioo gradient (purple #8B5CF6 to blue #3B82F6)

**Grid Specifications:**
- **Size**: Slightly larger than current magic wand badge (~150x150px total grid)
- **Icon size**: ~40x40px per icon
- **Gap**: 15px between icons
- **Position**: Centered on screen (same position as current wand)
- **Total grid**: 150x150px (3 × 40px + 2 × 15px gap)

**SVG Path Drawing:**
- Uses Framer Motion's `pathLength` animation (0 → 1)
- Sequential drawing with staggered delays (custom prop: 0.5s increment)
- Spring animation: `duration: 1.5, bounce: 0`
- Icons draw in this order:
  1. Rectangle (0s delay)
  2. Cross (0.5s delay)
  3. Checkmark (1.0s delay)
  4. Cross (1.5s delay)
  5. Rectangle (2.0s delay)
  6. Checkmark (2.5s delay)
  7. Checkmark (3.0s delay)
  8. Rectangle (3.5s delay)
  9. Cross (4.0s delay)

**Random Distribution:**
- 9 positions in 3x3 grid: `[[0,0], [0,1], [0,2], [1,0], [1,1], [1,2], [2,0], [2,1], [2,2]]`
- Shuffle array on component mount
- Assign 3 checkmarks, 3 crosses, 3 rectangles to random positions

**Icon SVG Paths:**

```typescript
// Checkmark (✓) - similar to line drawing but shaped as check
const checkmarkPath = "M 10 25 L 20 35 L 35 10"

// Cross (✗) - two lines forming X
const crossPath1 = "M 10 10 L 35 35"
const crossPath2 = "M 35 10 L 10 35"

// Rectangle (□) - rounded rect
const rectanglePath = "M 5 5 L 40 5 L 40 40 L 5 40 Z"
```

**Drawing Animation:**
```typescript
const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => {
    const delay = i * 0.5
    return {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
        opacity: { delay, duration: 0.01 },
      },
    }
  },
}
```

### Phase 2: Grid Shuffling + Flying Text

**Grid Shuffling (starts after drawing completes ~4.5s):**
- Uses Framer Motion's `layout` prop for smooth reordering
- Shuffle every 2 seconds (4-5 times total during text animation)
- Spring transition: `damping: 20, stiffness: 300`
- Icons maintain their identity (colors/shapes) but swap positions

**Shuffle Logic:**
```typescript
const [gridOrder, setGridOrder] = useState<Icon[]>(initialRandomOrder)

useEffect(() => {
  const interval = setInterval(() => {
    setGridOrder(prevOrder => shuffle([...prevOrder]))
  }, 2000) // Every 2 seconds

  return () => clearInterval(interval)
}, [])

function shuffle(array: Icon[]) {
  return array.sort(() => Math.random() - 0.5)
}
```

**Text Phrases Animation:**
- **15 phrases** from list (see below)
- **2.5 seconds per phrase** = 37.5s total if all phrases shown
- **Acceleration pattern:**
  - Start off-screen left: `x: -200, opacity: 0`
  - Accelerate to center: `x: 0, opacity: 1` (ease-in)
  - Slow down in middle
  - Accelerate off-screen right: `x: 200, opacity: 0` (ease-out)
- **Position**: Fixed line below grid (gap: 40px below grid)
- **Styling**: Semi-bold, text-xl, white color
- **No overlap**: Next phrase starts only after previous exits

**Text Animation Code:**
```typescript
const textVariants: Variants = {
  enter: { x: -200, opacity: 0 },
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: "easeIn" }
  },
  exit: {
    x: 200,
    opacity: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
}

// Phrases cycle with 2.5s duration each
const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentPhraseIndex(prev => (prev + 1) % phrases.length)
  }, 2500) // 2.5 seconds per phrase

  return () => clearInterval(timer)
}, [])
```

**Phrase List (15 items):**
1. Analyzing requirements
2. Understanding context
3. Mapping business needs
4. Identifying priorities
5. Evaluating features
6. Assessing technology fit
7. Reviewing compliance needs
8. Structuring criteria
9. Defining parameters
10. Building framework
11. Organizing dimensions
12. Validating requirements
13. Finalizing criteria
14. Preparing recommendations
15. Framework complete

### Phase 3: Success State (When API Complete)

**Transition Behavior:**
- When `isApiComplete` becomes true:
  - **IF** grid is mid-shuffle: Complete current shuffle motion (~0.5s)
  - **IF** text is mid-flight: Complete current phrase animation (~1.25s)
  - **THEN** transition to success state

**Success State Changes:**
- Keep green checkmark badge
- Keep confetti animation
- **New success message**: "Criteria prepared according to your request" (remove "20+ criteria" count)

**Success Message Code:**
```typescript
<p className={`${TYPOGRAPHY.body.default} text-gray-200`}>
  Criteria prepared according to your request
</p>
```

---

## 🏗️ Implementation Plan

### Task 1: Create New Animation Component
**File**: `src/components/landing/CriteriaCreationAnimation.tsx`

**Acceptance Criteria:**
- [ ] New component with same props interface as `ProjectCreationAnimation`
- [ ] Replaces magic wand animation in creating state
- [ ] Maintains success state (green checkmark + confetti)
- [ ] Keeps minimum animation time logic

### Task 2: Implement SVG Grid Drawing
**Component Section**: Grid Drawing Phase

**Acceptance Criteria:**
- [ ] 3x3 grid with 9 SVG icons (3 checkmarks, 3 crosses, 3 rectangles)
- [ ] Random distribution of icon types on mount
- [ ] Sequential path drawing animation with staggered delays
- [ ] Correct colors: green checkmarks, red crosses, Clarioo gradient rectangles
- [ ] Proper sizing and spacing (150x150px total, 15px gap)
- [ ] Centered on screen

**SVG Stroke Styling:**
```typescript
const strokeStyle: React.CSSProperties = {
  strokeWidth: 4,
  strokeLinecap: "round",
  fill: "transparent",
}
```

### Task 3: Implement Grid Shuffling
**Component Section**: Shuffling Phase

**Acceptance Criteria:**
- [ ] Grid shuffles every 2 seconds after drawing completes
- [ ] Uses Framer Motion `layout` prop for smooth transitions
- [ ] Spring animation with damping: 20, stiffness: 300
- [ ] Icons maintain colors/shapes during shuffle
- [ ] 4-5 shuffles occur during typical API call (~10-15 seconds)

### Task 4: Implement Flying Text Animation
**Component Section**: Text Phase (simultaneous with shuffling)

**Acceptance Criteria:**
- [ ] 15 phrases cycle sequentially (2.5s each)
- [ ] Positioned below grid with 40px gap
- [ ] White text, semi-bold, text-xl
- [ ] Acceleration pattern:
  - Blur in from left (0.8s ease-in)
  - Pause in center (0.9s)
  - Blur out to right (0.8s ease-out)
- [ ] No phrase overlap
- [ ] Smooth enter/center/exit transitions

**Text Container:**
```typescript
<div className="absolute" style={{ top: '190px' }}> {/* 150px grid + 40px gap */}
  <AnimatePresence mode="wait">
    <motion.p
      key={currentPhraseIndex}
      variants={textVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="text-xl font-semibold text-white"
    >
      {phrases[currentPhraseIndex]}
    </motion.p>
  </AnimatePresence>
</div>
```

### Task 5: Implement API-Aware Success Transition
**Component Section**: Phase Coordination

**Acceptance Criteria:**
- [ ] Monitors `isApiComplete` prop
- [ ] Completes current animation motion before transitioning:
  - Grid shuffle motion completes if mid-shuffle
  - Text phrase completes if mid-flight
- [ ] Transitions to success state smoothly (no jarring cuts)
- [ ] Success message: "Criteria prepared according to your request"
- [ ] Maintains existing success state duration (2 seconds)

**State Management:**
```typescript
const [animationPhase, setAnimationPhase] = useState<'drawing' | 'active' | 'completing' | 'success'>('drawing')

// When API completes
useEffect(() => {
  if (isApiComplete && animationPhase === 'active') {
    setAnimationPhase('completing')

    // Wait for current motion to complete
    setTimeout(() => {
      setAnimationPhase('success')
    }, 1000) // Max wait for current motion
  }
}, [isApiComplete, animationPhase])
```

### Task 6: Update LandingPage Integration
**File**: `src/components/landing/LandingPage.tsx`

**Acceptance Criteria:**
- [ ] Import new `CriteriaCreationAnimation` component
- [ ] Replace `ProjectCreationAnimation` in render
- [ ] Maintain same props passing
- [ ] Test that animation triggers on project creation
- [ ] Verify success state transitions correctly

**Code Change:**
```typescript
// Old
import { ProjectCreationAnimation } from './ProjectCreationAnimation';

// New
import { CriteriaCreationAnimation } from './CriteriaCreationAnimation';

// In render
<CriteriaCreationAnimation
  isOpen={showCreationAnimation}
  onComplete={handleAnimationComplete}
  isApiComplete={pendingProject !== null}
/>
```

### Task 7: Visual Polish & Testing
**Component**: Final Adjustments

**Acceptance Criteria:**
- [ ] Grid size matches magic wand size (slightly larger)
- [ ] Colors match Clarioo brand palette
- [ ] Text is readable against background
- [ ] Animation timing feels smooth and professional
- [ ] Success transition is not jarring
- [ ] Mobile responsive (scales appropriately)
- [ ] Test with fast API (<5s) and slow API (>30s)

---

## 🎨 Visual Specifications

### Color Palette

```typescript
const colors = {
  checkmark: '#10B981',      // green-500
  cross: '#EF4444',          // red-500
  rectangle: 'url(#clarioo-gradient)', // purple-to-blue
  text: '#FFFFFF',           // white
}

// Gradient definition
<defs>
  <linearGradient id="clarioo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stopColor="#8B5CF6" /> {/* purple-500 */}
    <stop offset="100%" stopColor="#3B82F6" /> {/* blue-500 */}
  </linearGradient>
</defs>
```

### Layout Measurements

```
Grid Container: 150x150px
  ├─ Icon: 40x40px
  ├─ Gap: 15px
  └─ Total: (40 × 3) + (15 × 2) = 150px

Text Position:
  └─ Top: 190px (150px grid + 40px gap)

Full-screen Overlay:
  └─ Background: rgba(0, 0, 0, 0.5) backdrop-blur-sm
```

---

## 🧪 Testing Checklist

### Animation Quality
- [ ] Grid draws smoothly with correct timing
- [ ] Icons maintain aspect ratio and proportions
- [ ] Shuffling is smooth (no jumps or flickers)
- [ ] Text enters/exits smoothly with correct acceleration
- [ ] No overlap between text phrases
- [ ] Success transition is smooth

### API Integration
- [ ] Fast API (<5s): Shows few phrases, transitions cleanly
- [ ] Normal API (10-15s): Shows ~6 phrases, shuffles 3-4 times
- [ ] Slow API (>30s): Shows all 15 phrases, transitions at end
- [ ] API error: Animation continues, shows error after timeout

### Edge Cases
- [ ] User closes modal mid-animation: Animation stops cleanly
- [ ] Multiple rapid project creations: Animations queue correctly
- [ ] Mobile viewport: Grid and text scale appropriately
- [ ] Slow network: Animation doesn't freeze or stutter

---

## 📊 Success Metrics

**Animation Performance:**
- Grid drawing completes in 4.5 seconds
- Smooth 60fps animation throughout
- No janky transitions or layout shifts

**User Experience:**
- Animation feels professional and branded
- Progress indication is clear (changing phrases)
- Success state is satisfying (confetti + message)

**Technical:**
- Component is reusable and maintainable
- TypeScript types are accurate
- No console errors or warnings
- Memory leaks prevented (cleanup intervals/timeouts)

---

## 🔄 Phase Execution Strategy

### Phase 1: Foundation (2 hours)
1. Create `CriteriaCreationAnimation.tsx` component structure
2. Set up props interface and state management
3. Implement phase switching logic (drawing → active → success)

### Phase 2: Grid Implementation (3 hours)
1. Create 3x3 grid layout with random icon distribution
2. Implement SVG path drawing with Framer Motion
3. Add sequential animation with staggered delays
4. Style with correct colors and sizing

### Phase 3: Shuffling & Text (3 hours)
1. Implement grid shuffling with layout animation
2. Create text phrase cycling logic
3. Add enter/center/exit text animation
4. Position text below grid

### Phase 4: Integration & Polish (2 hours)
1. Connect to LandingPage component
2. Test API completion transitions
3. Adjust timing and easing curves
4. Mobile responsive adjustments

---

## 📝 Implementation Notes

### Random Grid Generation

```typescript
type IconType = 'checkmark' | 'cross' | 'rectangle'

interface GridIcon {
  id: string
  type: IconType
  position: number // 0-8
  color: string
}

const generateRandomGrid = (): GridIcon[] => {
  const types: IconType[] = [
    'checkmark', 'checkmark', 'checkmark',
    'cross', 'cross', 'cross',
    'rectangle', 'rectangle', 'rectangle'
  ]

  const shuffled = types.sort(() => Math.random() - 0.5)

  return shuffled.map((type, index) => ({
    id: `icon-${index}`,
    type,
    position: index,
    color: type === 'checkmark' ? '#10B981'
         : type === 'cross' ? '#EF4444'
         : 'url(#clarioo-gradient)'
  }))
}
```

### Phrase Timing Logic

```typescript
const PHRASE_DURATION = 2500 // 2.5 seconds
const PHRASES = [
  'Analyzing requirements',
  // ... 14 more phrases
]

const [currentPhrase, setCurrentPhrase] = useState(0)
const [isAnimationActive, setIsAnimationActive] = useState(true)

useEffect(() => {
  if (!isAnimationActive) return

  const timer = setTimeout(() => {
    if (currentPhrase < PHRASES.length - 1) {
      setCurrentPhrase(prev => prev + 1)
    }
  }, PHRASE_DURATION)

  return () => clearTimeout(timer)
}, [currentPhrase, isAnimationActive])
```

### Graceful Animation Stop

```typescript
const stopAnimationGracefully = () => {
  // Wait for current phrase to exit
  setTimeout(() => {
    setAnimationPhase('success')
  }, 800) // Match exit animation duration
}
```

---

## 🚀 Deployment Notes

**Local Testing:**
- Test in development mode first
- Verify no console errors
- Check animation performance (Chrome DevTools Performance tab)
- Test on mobile device or emulator

**Do NOT push to GitHub yet** - will test locally first per user request.

---

## 📚 References

- Framer Motion SVG Path Drawing: https://www.framer.com/motion/examples/#svg-line-drawing
- Framer Motion Layout Animations: https://www.framer.com/motion/layout-animations/
- Code Example 1: Path Drawing Grid (from DIRECTIONS file)
- Code Example 2: Reordering Animation (from DIRECTIONS file)
- Phrase List: 15 criteria creation messages (from DIRECTIONS file)

---

## ✅ Definition of Done

- [ ] New `CriteriaCreationAnimation.tsx` component created
- [ ] SVG grid draws sequentially with correct colors
- [ ] Grid shuffles smoothly during active phase
- [ ] Text phrases fly with acceleration/deceleration
- [ ] API completion triggers graceful transition
- [ ] Success message updated to remove criteria count
- [ ] Integrated into LandingPage component
- [ ] Tested locally with various API response times
- [ ] No TypeScript errors or warnings
- [ ] Animation performs at 60fps
- [ ] Mobile responsive
- [ ] Code reviewed and documented

---

**Sprint Created**: 2025-01-26
**Next Steps**: Review sprint plan → Get approval → Begin implementation
