# SP_007: Visual Design Enhancement & Mobile-First UI/UX

## Sprint Overview

**Sprint ID**: SP_007
**Sprint Name**: Visual Design Enhancement & Mobile-First UI/UX
**Duration**: 2-3 weeks
**Status**: 🚀 Active (Started: November 12, 2024)
**Type**: Visual Prototype Enhancement
**Priority**: High

---

## Executive Summary

This sprint transforms the Clarioo visual prototype from a functional demonstration into a design-led, mobile-first experience that embodies the vision outlined in VISION.md. The implementation focuses on creating a distinctive, premium aesthetic that differentiates from "vanilla" enterprise software while maintaining the simplicity and clarity that makes complex vendor decisions feel effortless.

**Core Philosophy**: Design-first development with exceptional UX that delights users on mobile devices (80-90% expected traffic).

---

## Sprint Objectives

### Primary Objectives

1. **Implement 8-Element Landing Page Structure**
   - Transform Auth.tsx into comprehensive landing experience
   - Registration-gated interactive elements with "hypnotic" animations
   - iPod-style circular navigation selector
   - Artifact visualization showing workflow transparency

2. **Establish Single-Page Scrollable Architecture**
   - Remove page-based navigation, implement smooth scrolling between workflow sections
   - Enable users to scroll back to any previous section without losing context
   - Sticky step indicator for jump navigation
   - Progress auto-save as users scroll through workflow

3. **Implement Clearbit-Inspired Visual Design System**
   - Gradient-heavy backgrounds (not flat white)
   - Multi-layer shadows creating depth and elevation
   - Bold typography (56px headlines) with gradient treatments
   - Purple/indigo gradient buttons with colored shadows
   - Warm color palette (near-blacks and warm grays)

4. **Create Interactive Card Carousel**
   - HubSpot-style carousel showcasing 5 workflow steps
   - 3 cards visible on desktop, 1 on mobile
   - Auto-rotation with pause/play controls
   - Swipe gestures for mobile

5. **Optimize for Mobile-First Experience**
   - Touch-friendly UI elements (44x44px minimum touch targets)
   - Responsive layouts: side-by-side → stacked
   - Smooth animations optimized for mobile performance
   - Swipe gestures and touch interactions

---

## Technical Approach

### Architecture Principles (Per GL-RDD.md & ARCHITECTURE.md)

1. **Visual Prototype Focus**: No backend integration, mock services only
2. **Separation of Concerns**: UI components separate from mock service layer
3. **Lightweight & Fast**: Minimal bundle size, instant load times
4. **Handoff-Ready**: Clean code with integration points documented

### Technology Stack (Unchanged)

- **React 18.3.1** - UI framework
- **TypeScript 5.5.3** - Type safety
- **Tailwind CSS 3.4.13** - Styling foundation
- **shadcn/ui** - Base component library
- **Framer Motion** (NEW) - Advanced animations
- **Embla Carousel** (NEW) - Carousel functionality

### Testing Strategy (Per GL-TDD.md)

Since this is a visual prototype:

- ✅ **Manual Visual Verification** - Primary testing method
- ✅ **Build Verification** - `npm run build` before commits
- ✅ **Console Error Checks** - No runtime errors during demo
- ✅ **Responsive Design Testing** - 375px, 768px, 1920px viewports
- ❌ **No Automated Tests** - Not required for prototype phase

---

## Implementation Phases

### Phase 1: Foundation & Architecture (Week 1, Days 1-3)

#### Task 1.1: Project Setup & Dependencies
- [ ] Install Framer Motion: `npm install framer-motion`
- [ ] Install Embla Carousel: `npm install embla-carousel-react`
- [ ] Configure Tailwind for custom gradients and shadows
- [ ] Set up custom CSS variables for design system

#### Task 1.2: Landing Page Structure
- [ ] Refactor Auth.tsx → LandingPage.tsx
- [ ] Implement 8-element layout structure:
  1. Title section with gradient hero text
  2. Subtitle section
  3. Registration toggle (Sign In/Sign Up)
  4. iPod-style 3-way navigation selector
  5. Two inactive input fields (side-by-side desktop, stacked mobile)
  6. Artifact visualization (one-viewport graphic)
  7. Visual step indicator (appears post-registration)
  8. Interactive card carousel (explanatory block)

#### Task 1.3: Single-Page Scrollable Architecture
- [ ] Remove React Router page navigation from VendorDiscovery.tsx
- [ ] Implement scroll-based section transitions
- [ ] Create scrollable sections:
  - Section 1: Landing
  - Section 2: Tech Input
  - Section 3: Criteria Builder
  - Section 4: Vendor Discovery
  - Section 5: Comparison Matrix
  - Section 6: Engagement
- [ ] Implement sticky step indicator with jump navigation
- [ ] Add smooth scroll behavior with `scroll-behavior: smooth`
- [ ] Track scroll position for auto-save simulation

**Deliverables**:
- LandingPage.tsx component with 8 elements
- Scrollable workflow sections in VendorDiscovery.tsx
- Navigation-free, continuous experience

**Exit Criteria**:
- Users can scroll through all 6 sections without page navigation
- Registration unlocks inputs and scrolls to Tech Input section
- Step indicator allows clicking to jump between sections
- Build succeeds with no errors

---

### Phase 2: Visual Design System (Week 1-2, Days 4-7)

#### Task 2.1: Gradient Backgrounds
- [ ] Implement hero gradient: `#FFE5DD → #FFF5F2`
- [ ] Add radial gradient overlays
- [ ] Create SVG dot patterns at 0.15 opacity
- [ ] Implement alternating section layouts (center, image-left, image-right)

#### Task 2.2: Elevated Component Styling
- [ ] Multi-layer shadows on cards:
  - Primary: `0 10px 25px rgba(0,0,0,0.08)`
  - Secondary: `0 4px 10px rgba(0,0,0,0.04)`
- [ ] 20px border-radius (not 8px)
- [ ] 32px padding (not 16px)
- [ ] Subtle top border: `1px solid rgba(255,255,255,0.8)`
- [ ] Hover states: `translateY(-4px)` with shadow intensification

#### Task 2.3: Typography System
- [ ] Hero headlines: 56px desktop, 36px mobile
- [ ] Gradient text treatments using `bg-gradient-to-r` and `bg-clip-text`
- [ ] Letter-spacing: -0.02em for headlines
- [ ] Color palette:
  - Headlines: `#1A1A1A` (warm near-black)
  - Body text: `#4B5563` (warm gray)
  - Brand purple: `#6366F1`
  - Accent purple: `#8B5CF6`

#### Task 2.4: Gradient Buttons
- [ ] Primary button gradient: `#6366F1 → #8B5CF6`
- [ ] Colored shadow: `0 4px 14px rgba(99,102,241,0.4)`
- [ ] Height: 52px, padding: 0 32px
- [ ] Hover state: `translateY(-2px)` with shadow expansion
- [ ] Transition: `all 200ms ease-out`

**Deliverables**:
- Tailwind config with custom gradients, shadows, colors
- Custom CSS for complex gradient effects
- Button component variants with gradient styling
- Card component with elevated styling

**Exit Criteria**:
- Interface looks distinctly "non-vanilla"
- Gradient backgrounds visible across all sections
- Cards have floating effect with multi-layer shadows
- Buttons demonstrate premium aesthetic with gradient + glow

---

### Phase 3: Interactive Elements (Week 2, Days 8-11)

#### Task 3.1: Hypnotic Input Animations
- [ ] Pulsing glow animation (2s cycle)
  ```css
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.4); }
    50% { box-shadow: 0 0 40px rgba(99,102,241,0.8); }
  }
  ```
- [ ] Floating effect animation (3s cycle)
  ```css
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  ```
- [ ] Shimmer gradient overlay (4s cycle)
  ```css
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  ```
- [ ] "Register to unlock" visual cue (badge or icon)
- [ ] Post-registration unlock animation with smooth transition

#### Task 3.2: iPod-Style Navigation
- [ ] Create circular navigation component
- [ ] 3 option selector:
  - "Try Now" → triggers registration flow
  - "How it Works" → scrolls to card carousel
  - "Community Templates" → scrolls to community section (future)
- [ ] Touch-optimized tap targets (60x60px minimum)
- [ ] Rotation animation on selection
- [ ] Mobile: simplify to 3 button stack if circular doesn't work

#### Task 3.3: Interactive Card Carousel
- [ ] Install and configure Embla Carousel
- [ ] Create CarouselCard component with:
  - Screenshot/illustration (280px height)
  - Step title with icon
  - Description text
  - Process flow visualization (Input → AI → Output)
  - Output artifact label
  - CTA button
- [ ] Implement carousel with 5 cards:
  1. Technology Exploration (company + solution input)
  2. Criteria Building (AI-generated matrix)
  3. Vendor Discovery (intelligent search with scores)
  4. Vendor Comparison (interactive matrix)
  5. Vendor Engagement (automated outreach)
- [ ] Desktop layout: 3 cards visible, center card scaled 1.05x, side cards 0.7 opacity
- [ ] Mobile layout: 1 card visible, swipe gestures
- [ ] Auto-rotation: 4-second intervals
- [ ] Controls: left/right arrows, pause/play button, keyboard support
- [ ] Value props header: "How Clarioo Works" + 3 benefit badges

#### Task 3.4: Artifact Visualization
- [ ] Create animated visualization showing:
  - Input (user requirements)
  - AI Processing (loading animation)
  - Generated Artifact (PDF preview)
- [ ] Cycle through 3-4 examples (3-4 second intervals)
- [ ] Examples: Criteria PDF, Comparison Matrix, Executive Summary

**Deliverables**:
- AnimatedInput component with hypnotic animations
- iPodNavigation component with circular selector
- CardCarousel component with 5 workflow cards
- ArtifactVisualization component with animated examples

**Exit Criteria**:
- Inactive inputs demonstrate pulsing glow, floating, and shimmer animations
- iPod navigation functional with smooth transitions
- Carousel displays 3 cards on desktop, auto-rotates, responds to navigation
- Carousel mobile version shows 1 card with swipe gestures
- Artifact visualization cycles through examples smoothly

---

### Phase 4: Mobile Optimization (Week 2-3, Days 12-15)

#### Task 4.1: Responsive Breakpoints
- [ ] Mobile: `< 768px`
- [ ] Tablet: `768px - 1024px`
- [ ] Desktop: `> 1024px`

#### Task 4.2: Layout Adaptations
- [ ] Landing page inputs: side-by-side → stacked
- [ ] Card carousel: 3 cards → 1 card
- [ ] Typography: 56px → 36px for headlines
- [ ] Spacing: reduce padding/margins for mobile
- [ ] Touch targets: ensure 44x44px minimum
- [ ] iPod navigation: circular → stacked buttons (if needed)

#### Task 4.3: Mobile Interactions
- [ ] Swipe gestures for carousel
- [ ] Touch-friendly scroll (no scroll hijacking)
- [ ] Smooth section transitions on mobile
- [ ] Collapsible step indicator on mobile (hamburger style)

#### Task 4.4: Performance Optimization
- [ ] Optimize animations for mobile (reduce complexity)
- [ ] Lazy load carousel images
- [ ] Reduce bundle size where possible
- [ ] Test on real mobile devices (iOS Safari, Chrome Android)

**Deliverables**:
- Fully responsive layouts for all sections
- Touch-optimized interactions
- Performance-optimized animations

**Exit Criteria**:
- All layouts work on 375px width (iPhone SE)
- Touch targets are easily tappable
- Animations are smooth on mobile devices
- No horizontal scroll on mobile
- Carousel swipe gestures functional

---

### Phase 5: Polish & Documentation (Week 3, Days 16-18)

#### Task 5.1: Visual Testing
- [ ] Manual test all 8 landing page elements
- [ ] Test scrollable architecture (scroll to each section)
- [ ] Test responsive design (375px, 768px, 1920px)
- [ ] Test animations on mobile devices
- [ ] Test carousel on all breakpoints
- [ ] Test in multiple browsers (Chrome, Safari, Firefox)
- [ ] Check console for errors
- [ ] Verify build succeeds

#### Task 5.2: Documentation Updates
- [ ] Update PROGRESS.md with SP_007 completion
- [ ] Update FEATURE_LIST.md with visual enhancements
- [ ] Update USER_STORIES.md with new UX flows
- [ ] Add inline comments to complex animations
- [ ] Document integration points for future backend

#### Task 5.3: Final Touches
- [ ] Screenshot deliverables for stakeholder presentation
- [ ] Create demo walkthrough guide
- [ ] Prepare feedback collection form

**Deliverables**:
- Completed SP_007 sprint
- Updated documentation
- Demo-ready prototype

**Exit Criteria (per PROJECT_ROADMAP.md)**:
- ✅ Single-page scrollable architecture demonstrated
- ✅ Smooth scroll transitions between sections
- ✅ Users can scroll back to any previous section
- ✅ Card carousel functional with 5 cards, auto-rotation, navigation
- ✅ Carousel displays 3 cards on desktop, 1 card on mobile
- ✅ Each carousel card shows screenshot, title, description, process flow, CTA
- ✅ iPod-style navigation visually demonstrated
- ✅ UI animations implemented and visually appealing
- ✅ Mobile-responsive design demonstrated
- ✅ Visual step indicator always visible and functional
- ✅ Enhanced visual design system implemented:
  - Gradient hero background visible
  - Cards use multi-layer shadows and 20px border-radius
  - Hero headline 56px desktop/36px mobile with gradient text
  - Primary buttons use purple/indigo gradient with shadows
  - Inactive inputs demonstrate pulsing glow, floating, shimmer
  - Typography uses warm grays, not cold grays
  - Interface demonstrably "not vanilla"

---

## File Structure

### New Files Created

```
src/
├── components/
│   ├── landing/
│   │   ├── LandingPage.tsx          # Main landing page component
│   │   ├── HeroSection.tsx          # Title + subtitle
│   │   ├── RegistrationToggle.tsx   # Sign In/Sign Up switcher
│   │   ├── iPodNavigation.tsx       # Circular 3-way selector
│   │   ├── AnimatedInputs.tsx       # Two inactive inputs with animations
│   │   ├── ArtifactVisualization.tsx # Workflow artifact demo
│   │   ├── CardCarousel.tsx         # Interactive 5-card carousel
│   │   └── CarouselCard.tsx         # Individual card component
│   ├── workflow/
│   │   ├── ScrollableWorkflow.tsx   # Single-page scrollable container
│   │   ├── StickyStepIndicator.tsx  # Jump navigation header
│   │   └── WorkflowSection.tsx      # Reusable section wrapper
│   └── ui/
│       ├── gradient-button.tsx      # Enhanced button with gradients
│       └── elevated-card.tsx        # Card with multi-layer shadows
├── styles/
│   ├── animations.css               # Custom animation keyframes
│   └── gradients.css                # Complex gradient definitions
└── data/
    └── carousel/
        ├── carousel-content.json    # 5 workflow step descriptions
        └── carousel-images.json     # Image paths for carousel
```

### Modified Files

```
src/
├── App.tsx                         # Update routing for single-page architecture
├── pages/
│   └── Index.tsx                   # Update to use ScrollableWorkflow
├── components/
│   ├── VendorDiscovery.tsx         # Convert to scrollable sections
│   ├── ProjectDashboard.tsx        # Minor styling updates
│   └── ui/
│       ├── button.tsx              # Add gradient variant
│       └── card.tsx                # Add elevated variant
├── styles/
│   └── globals.css                 # Add custom CSS variables
└── tailwind.config.ts              # Add custom colors, shadows, gradients
```

---

## Data Requirements

### Carousel Content (JSON)

```json
{
  "cards": [
    {
      "id": 1,
      "step": "Technology Exploration",
      "icon": "search",
      "title": "Tell Us What You Need",
      "description": "Describe your company and the solution you're looking for in plain language. Our AI understands context and industry nuances.",
      "processFlow": {
        "input": "Company profile + Requirements",
        "aiProcessing": "Context analysis",
        "output": "Structured requirements"
      },
      "artifact": "Requirements Document",
      "ctaText": "Try Now",
      "ctaAction": "scrollToRegistration",
      "imagePath": "/images/carousel/step1-tech-input.png"
    },
    {
      "id": 2,
      "step": "Criteria Building",
      "icon": "checklist",
      "title": "AI Generates Evaluation Criteria",
      "description": "Get 20 comprehensive evaluation criteria tailored to your needs. Technical, business, and operational factors all considered.",
      "processFlow": {
        "input": "Your requirements",
        "aiProcessing": "GPT-4 criteria generation",
        "output": "20 weighted criteria"
      },
      "artifact": "Evaluation Matrix",
      "ctaText": "See Example",
      "ctaAction": "openCriteriaExample",
      "imagePath": "/images/carousel/step2-criteria.png"
    },
    {
      "id": 3,
      "step": "Vendor Discovery",
      "icon": "users",
      "title": "Discover Perfect Vendors",
      "description": "AI identifies 8-10 vendors that match your criteria. See match percentages and why each vendor was selected.",
      "processFlow": {
        "input": "Criteria + Market data",
        "aiProcessing": "Intelligent vendor matching",
        "output": "Ranked vendor list"
      },
      "artifact": "Vendor Shortlist",
      "ctaText": "Learn More",
      "ctaAction": "scrollToDiscovery",
      "imagePath": "/images/carousel/step3-discovery.png"
    },
    {
      "id": 4,
      "step": "Vendor Comparison",
      "icon": "compare",
      "title": "Compare Side-by-Side",
      "description": "Interactive comparison matrix with match percentages, strengths, weaknesses, and pricing. Export to Excel or share as PDF.",
      "processFlow": {
        "input": "Vendors + Criteria",
        "aiProcessing": "Detailed analysis",
        "output": "Comparison matrix"
      },
      "artifact": "Comparison Report",
      "ctaText": "See Example",
      "ctaAction": "openComparisonExample",
      "imagePath": "/images/carousel/step4-comparison.png"
    },
    {
      "id": 5,
      "step": "Vendor Engagement",
      "icon": "mail",
      "title": "Reach Out Instantly",
      "description": "AI generates personalized outreach emails for each vendor. Send invitations and track responses all in one place.",
      "processFlow": {
        "input": "Selected vendors",
        "aiProcessing": "Email generation",
        "output": "Personalized templates"
      },
      "artifact": "Outreach Emails",
      "ctaText": "Try Now",
      "ctaAction": "scrollToRegistration",
      "imagePath": "/images/carousel/step5-engagement.png"
    }
  ]
}
```

---

## Design Specifications

### Color Palette

```typescript
// tailwind.config.ts
colors: {
  brand: {
    purple: '#6366F1',
    purpleLight: '#8B5CF6',
    purpleDark: '#4F46E5',
  },
  neutral: {
    warmBlack: '#1A1A1A',
    warmGray: '#4B5563',
    lightGray: '#F3F4F6',
  },
  gradient: {
    hero: ['#FFE5DD', '#FFF5F2'],
    button: ['#6366F1', '#8B5CF6'],
  }
}
```

### Typography Scale

```typescript
fontSize: {
  'hero-desktop': '56px',
  'hero-mobile': '36px',
  'heading-1': '48px',
  'heading-2': '36px',
  'heading-3': '24px',
  'body': '16px',
  'small': '14px',
}

letterSpacing: {
  'tight-hero': '-0.02em',
  'tight': '-0.01em',
}
```

### Shadows

```typescript
boxShadow: {
  'elevated-primary': '0 10px 25px rgba(0,0,0,0.08)',
  'elevated-secondary': '0 4px 10px rgba(0,0,0,0.04)',
  'elevated-combined': '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
  'button-glow': '0 4px 14px rgba(99,102,241,0.4)',
  'button-hover': '0 6px 20px rgba(99,102,241,0.5)',
  'screenshot': '0 30px 60px rgba(0,0,0,0.15)',
}
```

### Border Radius

```typescript
borderRadius: {
  'card': '20px',
  'button': '12px',
  'input': '8px',
}
```

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Animation performance on mobile | Medium | Medium | Test on real devices early, simplify if needed |
| Carousel complexity causing bugs | Medium | Medium | Use battle-tested library (Embla), extensive manual testing |
| Scrollable architecture navigation confusion | Low | High | Clear visual indicators, smooth transitions, user testing |
| Bundle size increase | Medium | Low | Code splitting, lazy loading, monitor build size |

### Design Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| "Hypnotic" animations too distracting | Medium | Medium | Test with stakeholders, tune animation intensity |
| Mobile layout cramped | Medium | Medium | Prioritize content hierarchy, generous whitespace |
| Gradient backgrounds reduce readability | Low | Medium | High contrast text, test with accessibility tools |
| Design too "flashy" for enterprise | Low | Medium | Balance with professional aesthetic, stakeholder feedback |

---

## Success Metrics (Visual Verification)

### Landing Page
- [ ] All 8 elements render correctly
- [ ] Layout adapts to mobile/tablet/desktop
- [ ] Animations play smoothly
- [ ] Registration flow works

### Scrollable Architecture
- [ ] Can scroll through all 6 sections
- [ ] Step indicator shows current section
- [ ] Jump navigation functional
- [ ] No page navigation required

### Visual Design
- [ ] Interface looks "non-vanilla"
- [ ] Gradients visible across sections
- [ ] Cards have floating effect
- [ ] Buttons have gradient + glow

### Interactive Elements
- [ ] Carousel auto-rotates
- [ ] Carousel navigation works (arrows, keyboard, swipe)
- [ ] Input animations visible and appealing
- [ ] iPod navigation functional

### Mobile Experience
- [ ] Works on 375px width (iPhone SE)
- [ ] Touch targets easily tappable
- [ ] Swipe gestures functional
- [ ] No horizontal scroll

---

## Dependencies

### External Libraries
- **Framer Motion** - Advanced animations, scroll-based triggers
- **Embla Carousel** - Carousel functionality with touch support
- **React Hook Form** - Already installed, form management
- **Tailwind CSS** - Already installed, styling foundation
- **shadcn/ui** - Already installed, base components

### Internal Dependencies
- Mock service layer (already implemented)
- Dummy data files (already implemented)
- Existing component library (shadcn/ui components)

---

## Testing Checklist (Manual Verification per GL-TDD.md)

### Before Each Commit
- [ ] `npm run build` succeeds
- [ ] No console errors in browser
- [ ] Visual spot-check of changes

### Phase Completion Testing
- [ ] All components render correctly
- [ ] Responsive design tested (375px, 768px, 1920px)
- [ ] Animations smooth and performant
- [ ] No broken images or missing icons

### Sprint Completion Testing
- [ ] Full walkthrough of all features
- [ ] Test on Chrome, Safari, Firefox
- [ ] Test on real mobile device
- [ ] Demo flow rehearsed
- [ ] Screenshots captured for documentation

---

## Post-Sprint Activities

### Documentation Updates
1. Update PROGRESS.md with SP_007 completion status
2. Update PROJECT_ROADMAP.md with actual timeline
3. Update FEATURE_LIST.md with new visual features
4. Update USER_STORIES.md with enhanced UX flows
5. Add inline code comments for complex animations

### Stakeholder Demo Preparation
1. Create demo walkthrough script
2. Prepare presentation slides with screenshots
3. Document feedback collection process
4. Set up user testing sessions

### Handoff Documentation
1. Document all animation implementations
2. Explain visual design system for backend developers
3. Update ARCHITECTURE.md with new components
4. Create restoration guide if design changes needed

---

## Appendix A: Animation Code Examples

### Pulsing Glow Animation

```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.8);
  }
}

.animated-input {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Floating Effect Animation

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.floating-element {
  animation: float 3s ease-in-out infinite;
}
```

### Shimmer Gradient Overlay

```css
@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.shimmer-overlay {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(99, 102, 241, 0.3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 4s linear infinite;
}
```

---

## Appendix B: Responsive Breakpoint Examples

### Mobile (< 768px)

```tsx
<div className="flex flex-col gap-4 md:flex-row md:gap-6">
  <AnimatedInput placeholder="Tell me about your company" />
  <AnimatedInput placeholder="What solution are you looking for?" />
</div>
```

### Typography Scaling

```tsx
<h1 className="text-[36px] leading-tight md:text-[56px] md:leading-tight">
  Supercharge your software vendor's selection
</h1>
```

### Carousel Responsive

```tsx
const slidesToShow = useBreakpoint({
  base: 1,    // mobile
  md: 1,      // tablet
  lg: 3,      // desktop
});
```

---

## Appendix C: Integration Points for Backend

### Landing Page Registration
**Current**: Mock auth service always succeeds
**Future**: Replace with Supabase auth signup/signin

```typescript
// Current (Mock)
import { authService } from '@/services/mock/authService';
await authService.signIn(email, password);

// Future (Real)
import { supabase } from '@/lib/supabase';
await supabase.auth.signInWithPassword({ email, password });
```

### Scrollable Architecture State
**Current**: React state, ephemeral
**Future**: Supabase database, persisted

```typescript
// Current (Mock)
const [currentSection, setCurrentSection] = useState(1);

// Future (Real)
await supabase
  .from('projects')
  .update({ workflow_state: { current_step: 3 } })
  .eq('id', projectId);
```

---

## Sprint Status

**Created**: November 12, 2024
**Started**: November 12, 2024
**Expected Completion**: December 3, 2024
**Actual Completion**: TBD

**Current Phase**: Phase 1 - Foundation & Architecture
**Next Milestone**: Landing page structure complete

---

*Sprint Plan Version: 1.0*
*Last Updated: November 12, 2024*
*Project Phase: 🎨 Visual Prototype (Phase 0)*
*Sprint Type: Visual Enhancement*
