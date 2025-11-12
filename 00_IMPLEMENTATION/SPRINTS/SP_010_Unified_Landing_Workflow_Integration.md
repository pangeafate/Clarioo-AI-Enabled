# Sprint Plan: SP_010 - Unified Landing & Workflow Integration

## Sprint Overview

**Sprint ID**: SP_010
**Sprint Name**: Unified Landing & Workflow Integration
**Duration**: 6-8 hours / 1 day
**Type**: UX Enhancement & Architecture Integration
**Priority**: High
**Status**: Planning

---

## Executive Summary

This sprint transforms the landing page from a pure marketing page into a unified experience that seamlessly transitions from marketing content to the project workflow after authentication. Instead of redirecting users to a separate `/dashboard` route, the authenticated landing page will hide marketing content and display the project dashboard directly, creating a smooth, single-page experience.

### Business Value
- **Seamless UX**: Users stay on the same page after authentication, maintaining context
- **Reduced Navigation**: Eliminates need to navigate to separate dashboard page
- **Consistent Experience**: Single page handles both marketing and workflow states
- **Better Conversion**: Smoother transition from landing to workflow reduces friction

### Technical Value
- **Simplified Architecture**: Reduces route complexity by embedding workflow in landing page
- **State Management**: Single component manages both pre-auth and post-auth states
- **Code Reuse**: Reuses existing ProjectDashboard and VendorDiscovery components
- **Maintainability**: Clearer separation between marketing content and workflow

---

## Problem Statement

### Current Flow (Multi-Page Navigation)
```
1. User lands on `/` (LandingPage)
   ↓
2. User sees marketing content:
   - HeroSection
   - RegistrationToggle
   - AnimatedInputs
   - ArtifactVisualization (hidden when authenticated)
   - CardCarousel (always visible)
   ↓
3. User clicks Sign In/Sign Up
   ↓
4. AuthModal handles authentication
   ↓
5. AuthModal navigates to `/dashboard` (separate route)
   ↓
6. Index page loads ProjectDashboard
   ↓
7. User selects project → VendorDiscovery opens
```

### User Pain Points
- **Context Loss**: Navigation to `/dashboard` breaks continuity
- **Extra Step**: Requires additional navigation after authentication
- **Inconsistent Experience**: Landing page and dashboard feel like separate applications
- **Marketing Overload**: CardCarousel and other marketing content still visible after authentication (when it should be hidden)

### Desired Flow (Unified Experience)
```
1. User lands on `/` (LandingPage)
   ↓
2. User sees marketing content (pre-auth):
   - HeroSection
   - RegistrationToggle
   - AnimatedInputs (locked)
   - ArtifactVisualization
   - CardCarousel
   ↓
3. User authenticates via AuthModal
   ↓
4. Landing page transforms in-place (no navigation):
   - HeroSection (remains)
   - RegistrationToggle (remains, shows "Signed In")
   - AnimatedInputs (unlocked, remains)
   - ArtifactVisualization (hidden)
   - CardCarousel (hidden)
   - ProjectDashboard (appears below inputs)
   ↓
5. User selects project → VendorDiscovery replaces ProjectDashboard
   ↓
6. User clicks "Back to Projects" → ProjectDashboard reappears
```

---

## Current Architecture Analysis

### File Structure

#### `/src/App.tsx`
```typescript
// Current routing structure
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  } />
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Issues**:
- Separate `/dashboard` route creates navigation break
- LandingPage is purely marketing, doesn't handle post-auth state
- ProtectedRoute wrapper adds unnecessary complexity for embedded workflow

#### `/src/components/landing/LandingPage.tsx` (Current Structure)
```typescript
export const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <HeroSection />
      <RegistrationToggle />
      <AnimatedInputs />

      {/* Only hidden when authenticated */}
      {!user && <ArtifactVisualization />}

      {/* Always visible - PROBLEM! */}
      <CardCarousel />
    </div>
  );
};
```

**Issues**:
- CardCarousel always visible (should hide when authenticated)
- No ProjectDashboard integration
- No VendorDiscovery integration
- No post-auth state management

#### `/src/pages/Index.tsx` (Current Dashboard Logic)
```typescript
const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (selectedProject) {
    return (
      <VendorDiscovery
        project={selectedProject}
        onBackToProjects={() => setSelectedProject(null)}
      />
    );
  }

  return <ProjectDashboard onSelectProject={setSelectedProject} />;
};
```

**Good Pattern**: This component has the exact logic we need to embed in LandingPage!

---

## Solution Design

### Architectural Changes

#### 1. Enhanced LandingPage Component

**New Structure**:
```typescript
// /src/components/landing/LandingPage.tsx

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { HeroSection } from './HeroSection';
import { RegistrationToggle } from './RegistrationToggle';
import { AnimatedInputs } from './AnimatedInputs';
import { ArtifactVisualization } from './ArtifactVisualization';
import { CardCarousel } from './CardCarousel';
import ProjectDashboard from '../ProjectDashboard';
import VendorDiscovery, { Project } from '../VendorDiscovery';

export const LandingPage = () => {
  const { user } = useAuth();

  // State management for project workflow (from Index.tsx pattern)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [companyInput, setCompanyInput] = useState('');
  const [solutionInput, setSolutionInput] = useState('');

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-gradient-hero-bg">
      {/* SECTION 1: Hero - Always visible */}
      <HeroSection />

      {/* SECTION 2: Registration Toggle - Always visible */}
      <RegistrationToggle
        isSignUp={isSignUp}
        onToggle={setIsSignUp}
        onOpenAuth={handleOpenAuth}
        isAuthenticated={!!user}
      />

      {/* SECTION 3: Animated Inputs - Always visible */}
      <AnimatedInputs
        isAuthenticated={!!user}
        companyInput={companyInput}
        solutionInput={solutionInput}
        onCompanyChange={setCompanyInput}
        onSolutionChange={setSolutionInput}
      />

      {/* SECTION 4: Marketing Content - Only visible when NOT authenticated */}
      {!user && (
        <>
          <ArtifactVisualization />
          <CardCarousel />
        </>
      )}

      {/* SECTION 5: Workflow Content - Only visible when authenticated */}
      {user && (
        <>
          {selectedProject ? (
            <VendorDiscovery
              project={selectedProject}
              onBackToProjects={handleBackToProjects}
            />
          ) : (
            <ProjectDashboard onSelectProject={handleSelectProject} />
          )}
        </>
      )}
    </div>
  );
};
```

#### 2. Routing Updates (Optional)

**Option A: Keep `/dashboard` route as fallback** (Recommended)
```typescript
// /src/App.tsx
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/auth" element={<Auth />} />

  {/* Keep as fallback for direct navigation */}
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  } />

  <Route path="*" element={<NotFound />} />
</Routes>
```

**Option B: Redirect `/dashboard` to `/`** (More aggressive)
```typescript
// /src/App.tsx
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/auth" element={<Auth />} />

  {/* Redirect dashboard to landing page */}
  <Route path="/dashboard" element={<Navigate to="/" replace />} />

  <Route path="*" element={<NotFound />} />
</Routes>
```

**Recommendation**: Go with **Option A** to maintain backward compatibility and allow direct dashboard access.

#### 3. AuthModal Behavior Update

**Current Behavior** (from GAP-2 fix):
```typescript
// /src/components/landing/AuthModal.tsx
const handleSuccess = () => {
  toast({
    title: "Welcome! 🎉",
    description: "Successfully signed in.",
  });

  // Current: Navigates to /dashboard
  navigate('/dashboard', { replace: true });
};
```

**New Behavior**:
```typescript
// /src/components/landing/AuthModal.tsx
const handleSuccess = () => {
  toast({
    title: "Welcome! 🎉",
    description: "Successfully signed in.",
  });

  // NEW: Close modal and let LandingPage handle state change
  onClose();
  // No navigation needed - LandingPage will detect user state change
};
```

---

## Implementation Plan

### Phase 1: State Management Setup (1 hour)

**Task 1.1**: Add project state management to LandingPage
- Import `Project` type from VendorDiscovery
- Add `selectedProject` state (same as Index.tsx)
- Add `handleSelectProject` and `handleBackToProjects` handlers

**Task 1.2**: Add input state management (already exists)
- Verify `companyInput` and `solutionInput` state
- Verify onChange handlers

**Files Modified**:
- `/src/components/landing/LandingPage.tsx`

---

### Phase 2: Component Integration (2 hours)

**Task 2.1**: Import ProjectDashboard and VendorDiscovery
```typescript
import ProjectDashboard from '../ProjectDashboard';
import VendorDiscovery, { Project } from '../VendorDiscovery';
```

**Task 2.2**: Add conditional rendering for authenticated state
```typescript
{user && (
  <>
    {selectedProject ? (
      <VendorDiscovery
        project={selectedProject}
        onBackToProjects={handleBackToProjects}
      />
    ) : (
      <ProjectDashboard onSelectProject={handleSelectProject} />
    )}
  </>
)}
```

**Task 2.3**: Hide marketing content when authenticated
```typescript
{!user && (
  <>
    <ArtifactVisualization />
    <CardCarousel />
  </>
)}
```

**Files Modified**:
- `/src/components/landing/LandingPage.tsx`

---

### Phase 3: AuthModal Behavior Update (1 hour)

**Task 3.1**: Remove navigation from AuthModal
- Remove `navigate('/dashboard', { replace: true })` from handleSuccess
- Keep toast notification
- Just close modal: `onClose()`

**Task 3.2**: Verify auto-detection of auth state
- Confirm that `useAuth` hook updates `user` state immediately after auth
- LandingPage will automatically re-render when `user` changes
- Marketing content will hide, workflow will appear

**Files Modified**:
- `/src/components/landing/AuthModal.tsx`

---

### Phase 4: Styling & Transitions (1 hour)

**Task 4.1**: Add smooth transitions between states
```typescript
import { motion, AnimatePresence } from 'framer-motion';

// Marketing content with fade-out
<AnimatePresence>
  {!user && (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <ArtifactVisualization />
      <CardCarousel />
    </motion.div>
  )}
</AnimatePresence>

// Workflow content with fade-in
<AnimatePresence>
  {user && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {selectedProject ? (
        <VendorDiscovery ... />
      ) : (
        <ProjectDashboard ... />
      )}
    </motion.div>
  )}
</AnimatePresence>
```

**Task 4.2**: Ensure spacing and layout consistency
- Verify that ProjectDashboard and VendorDiscovery have appropriate top padding
- Ensure smooth visual transition from inputs to dashboard
- Test on mobile and desktop

**Files Modified**:
- `/src/components/landing/LandingPage.tsx`

---

### Phase 5: Testing & Validation (1-2 hours)

**Test Case 1**: Pre-Authentication State
- [ ] Landing page displays all marketing content
- [ ] ArtifactVisualization is visible
- [ ] CardCarousel is visible
- [ ] AnimatedInputs are locked/disabled
- [ ] No ProjectDashboard visible
- [ ] No VendorDiscovery visible

**Test Case 2**: Authentication Flow
- [ ] Click Sign In/Sign Up opens AuthModal
- [ ] Successful authentication closes modal
- [ ] Toast notification appears
- [ ] No navigation occurs (URL stays at `/`)
- [ ] Marketing content fades out
- [ ] ProjectDashboard fades in
- [ ] AnimatedInputs unlock

**Test Case 3**: Post-Authentication State
- [ ] Marketing content is hidden
- [ ] ProjectDashboard is visible
- [ ] Can create new project
- [ ] Can select existing project
- [ ] VendorDiscovery opens when project selected
- [ ] "Back to Projects" returns to ProjectDashboard
- [ ] HeroSection still visible
- [ ] RegistrationToggle still visible (showing signed-in state)
- [ ] AnimatedInputs still visible and functional

**Test Case 4**: Direct Dashboard Navigation (Fallback)
- [ ] Navigate directly to `/dashboard`
- [ ] ProtectedRoute redirects if not authenticated
- [ ] If authenticated, Index page loads normally
- [ ] Provides fallback if LandingPage integration has issues

**Test Case 5**: Workflow Integration
- [ ] Create project from ProjectDashboard embedded in landing
- [ ] Enter workflow through VendorDiscovery
- [ ] Complete all 5 workflow steps
- [ ] Return to ProjectDashboard
- [ ] Select different project
- [ ] Workflow state persists (GAP-1 functionality)

**Test Case 6**: Mobile Responsiveness
- [ ] All sections responsive on mobile
- [ ] ProjectDashboard mobile-friendly
- [ ] VendorDiscovery mobile-friendly
- [ ] Smooth transitions on mobile
- [ ] Touch interactions work correctly

---

## Success Criteria

### Functional Requirements
- ✅ LandingPage displays marketing content when not authenticated
- ✅ LandingPage hides marketing content when authenticated
- ✅ LandingPage displays ProjectDashboard when authenticated
- ✅ User can select project and open VendorDiscovery
- ✅ User can return to ProjectDashboard from VendorDiscovery
- ✅ No navigation occurs during authentication
- ✅ URL stays at `/` throughout experience
- ✅ AuthModal closes on successful authentication
- ✅ Toast notification appears on authentication success

### UX Requirements
- ✅ Smooth transition animations between states
- ✅ No page reloads or flashing
- ✅ Context preservation (AnimatedInputs remain visible and functional)
- ✅ Consistent header/navigation elements
- ✅ Mobile-responsive design
- ✅ Fast state transitions (<500ms)

### Technical Requirements
- ✅ No console errors
- ✅ No prop drilling issues
- ✅ Clean separation of concerns
- ✅ TypeScript type safety maintained
- ✅ Existing GAP-1 (workflow persistence) functionality preserved
- ✅ Existing GAP-4 (landing input connection) functionality preserved
- ✅ Build completes without errors

---

## Risk Assessment

### Low Risk
- **Component Integration**: ProjectDashboard and VendorDiscovery are already battle-tested
- **State Management**: Pattern already proven in Index.tsx
- **Auth Detection**: useAuth hook already handles state updates

### Medium Risk
- **Layout Consistency**: Need to ensure ProjectDashboard/VendorDiscovery styling fits landing page
  - **Mitigation**: Both already use consistent shadcn/ui components and tailwind classes
- **Animation Performance**: Framer Motion transitions could cause jank
  - **Mitigation**: Keep animations simple (fade + slide), test on mobile
- **State Cleanup**: Need to ensure no memory leaks with component mounting/unmounting
  - **Mitigation**: Follow React best practices, test thoroughly

### High Risk
- **None identified**

---

## Rollback Plan

If integration causes issues:

1. **Quick Rollback**: Revert LandingPage.tsx to previous version
2. **Keep AuthModal Changes**: Navigation to `/dashboard` still works
3. **Use `/dashboard` Route**: Index page continues to function as standalone dashboard
4. **Gradual Fix**: Debug issues in separate branch, merge when stable

**Rollback Time**: < 5 minutes (single file revert)

---

## Dependencies

### Component Dependencies
- `ProjectDashboard`: Must remain functional and self-contained
- `VendorDiscovery`: Must remain functional and self-contained
- `AuthModal`: Must properly update `useAuth` state
- `useAuth` hook: Must trigger re-renders when user state changes

### Feature Dependencies
- **GAP-1** (Workflow Persistence): Must continue working
- **GAP-4** (Landing Input Connection): Must continue working
- **GAP-2** (Auth Navigation): Will be modified but remains functional

---

## Documentation Updates

### Files to Update

1. **PROJECT_ROADMAP.md**
   - Add SP_010 completion section
   - Update version to 3.3.0
   - Add to Key Decisions Log

2. **PROGRESS.md**
   - Add Sprint 10 section with details
   - Link to SP_010 sprint plan
   - Update sprint metrics

3. **GAP_ANALYSIS.md** (Optional)
   - Update if this addresses any remaining gaps
   - Mark related UX issues as resolved

4. **CLAUDE.md** (If needed)
   - Update if workflow changes affect development guidelines

---

## Exit Criteria

- [ ] LandingPage successfully integrates ProjectDashboard and VendorDiscovery
- [ ] Marketing content (CardCarousel, ArtifactVisualization) hidden when authenticated
- [ ] Smooth animation transitions between pre-auth and post-auth states
- [ ] All test cases pass (6 test scenarios)
- [ ] No console errors or warnings
- [ ] Build completes successfully
- [ ] AuthModal updated to remove dashboard navigation
- [ ] Mobile responsiveness verified on multiple screen sizes
- [ ] Documentation updated (PROJECT_ROADMAP.md, PROGRESS.md)
- [ ] Code reviewed and clean
- [ ] GAP-1 and GAP-4 functionality preserved

---

## Timeline

**Total Duration**: 6-8 hours / 1 day

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | State Management Setup | 1 hour | Pending |
| 2 | Component Integration | 2 hours | Pending |
| 3 | AuthModal Update | 1 hour | Pending |
| 4 | Styling & Transitions | 1 hour | Pending |
| 5 | Testing & Validation | 1-2 hours | Pending |
| 6 | Documentation | 1 hour | Pending |

---

## Visual Diagrams

### Component Hierarchy (Before)
```
App
├── LandingPage (/)
│   ├── HeroSection
│   ├── RegistrationToggle
│   ├── AnimatedInputs
│   ├── ArtifactVisualization
│   └── CardCarousel
│
└── Index (/dashboard - Protected)
    ├── ProjectDashboard
    └── VendorDiscovery
```

### Component Hierarchy (After)
```
App
├── LandingPage (/)
│   ├── HeroSection
│   ├── RegistrationToggle
│   ├── AnimatedInputs
│   │
│   ├── [Pre-Auth Only]
│   │   ├── ArtifactVisualization
│   │   └── CardCarousel
│   │
│   └── [Post-Auth Only]
│       ├── ProjectDashboard
│       └── VendorDiscovery
│
└── Index (/dashboard - Protected, Fallback)
    ├── ProjectDashboard
    └── VendorDiscovery
```

### State Flow Diagram
```
┌─────────────────────────────────────┐
│        Landing Page Load            │
│         (Not Authenticated)         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Display Marketing Content:        │
│   - HeroSection                     │
│   - RegistrationToggle              │
│   - AnimatedInputs (locked)         │
│   - ArtifactVisualization           │
│   - CardCarousel                    │
└────────────┬────────────────────────┘
             │
             │ User clicks Sign In/Sign Up
             ▼
┌─────────────────────────────────────┐
│       AuthModal Opens               │
│    User enters credentials          │
└────────────┬────────────────────────┘
             │
             │ Authentication Success
             ▼
┌─────────────────────────────────────┐
│    useAuth updates user state       │
│    LandingPage re-renders           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│    Conditional Rendering:           │
│    - Hide: Artifact + Carousel      │
│    - Show: ProjectDashboard         │
│    - Unlock: AnimatedInputs         │
└────────────┬────────────────────────┘
             │
             │ User selects project
             ▼
┌─────────────────────────────────────┐
│   VendorDiscovery replaces          │
│   ProjectDashboard                  │
└────────────┬────────────────────────┘
             │
             │ User clicks Back
             ▼
┌─────────────────────────────────────┐
│   ProjectDashboard reappears        │
│   (selectedProject = null)          │
└─────────────────────────────────────┘
```

---

## Code Examples

### LandingPage.tsx - Full Implementation Preview

```typescript
/**
 * LandingPage Component - Unified Landing & Workflow Integration
 *
 * @sprint SP_010
 * @purpose Single-page experience that transitions from marketing to workflow after authentication
 *
 * FEATURES:
 * - Pre-Auth: Marketing content (hero, inputs locked, artifact viz, carousel)
 * - Post-Auth: Workflow content (hero, inputs unlocked, project dashboard/vendor discovery)
 * - Smooth transitions with Framer Motion
 * - No navigation required - all state changes happen in-place
 * - Maintains context and user inputs across authentication
 *
 * STATE MANAGEMENT:
 * - Authenticated state: From useAuth hook (auto-detects auth changes)
 * - Project selection: Same pattern as Index.tsx (selectedProject state)
 * - Input values: Company description + Solution requirements (persisted)
 *
 * INTEGRATION:
 * - Reuses ProjectDashboard component (no modifications needed)
 * - Reuses VendorDiscovery component (no modifications needed)
 * - Hides marketing content when authenticated
 * - Shows workflow content when authenticated
 *
 * @see SP_010 Sprint Plan - Unified Landing & Workflow Integration
 * @see Index.tsx - Original dashboard logic pattern
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { HeroSection } from './HeroSection';
import { RegistrationToggle } from './RegistrationToggle';
import { AnimatedInputs } from './AnimatedInputs';
import { ArtifactVisualization } from './ArtifactVisualization';
import { CardCarousel } from './CardCarousel';
import ProjectDashboard from '../ProjectDashboard';
import VendorDiscovery, { Project } from '../VendorDiscovery';

export const LandingPage = () => {
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);

  // SP_010: Project workflow state (pattern from Index.tsx)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Input state (preserved across authentication)
  const [companyInput, setCompanyInput] = useState('');
  const [solutionInput, setSolutionInput] = useState('');

  // SP_010: Project selection handlers
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  const handleOpenAuth = () => {
    console.log('Opening auth modal:', isSignUp ? 'Sign Up' : 'Sign In');
    // Auth modal opens via state management
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-hero-bg"
    >
      {/* ALWAYS VISIBLE: Hero Section */}
      <HeroSection />

      {/* ALWAYS VISIBLE: Registration Toggle */}
      <RegistrationToggle
        isSignUp={isSignUp}
        onToggle={setIsSignUp}
        onOpenAuth={handleOpenAuth}
        isAuthenticated={!!user}
      />

      {/* ALWAYS VISIBLE: Animated Inputs */}
      <AnimatedInputs
        isAuthenticated={!!user}
        companyInput={companyInput}
        solutionInput={solutionInput}
        onCompanyChange={setCompanyInput}
        onSolutionChange={setSolutionInput}
      />

      {/* PRE-AUTH ONLY: Marketing Content */}
      <AnimatePresence>
        {!user && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <ArtifactVisualization />
            <CardCarousel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* POST-AUTH ONLY: Workflow Content */}
      <AnimatePresence>
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {selectedProject ? (
              <VendorDiscovery
                project={selectedProject}
                onBackToProjects={handleBackToProjects}
              />
            ) : (
              <ProjectDashboard onSelectProject={handleSelectProject} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Spacer */}
      <div className="h-16" />
    </motion.div>
  );
};
```

### AuthModal.tsx - Navigation Update

```typescript
// Before (SP_009):
const handleSuccess = () => {
  toast({
    title: "Welcome! 🎉",
    description: "Successfully signed in.",
  });
  navigate('/dashboard', { replace: true }); // ❌ Navigation breaks experience
};

// After (SP_010):
const handleSuccess = () => {
  toast({
    title: "Welcome! 🎉",
    description: "Successfully signed in.",
  });
  onClose(); // ✅ Just close modal - LandingPage will handle the rest
};
```

---

## Appendix

### Related Sprints
- **SP_002**: Initial auth modal implementation
- **SP_007**: Visual design enhancement (CardCarousel, ArtifactVisualization)
- **SP_009**: Critical UX gaps (GAP-2: Auth navigation, GAP-4: Landing inputs)
- **SP_010**: This sprint - Unified landing & workflow integration

### Related Features
- **F-002**: User Authentication (foundation for this feature)
- **F-004**: Project Management (integrated into landing page)
- **F-008**: 5-Step Workflow (embedded after authentication)

### Related User Stories
- **US-01**: User can sign up and access platform
- **US-03**: User can create and manage projects
- **US-04**: User can complete vendor discovery workflow
- **US-11.1**: Visual Process Transparency (marketing content)

---

*Sprint Plan Created: November 12, 2024*
*Sprint ID: SP_010*
*Status: Planning → Implementation*
*Estimated Completion: November 12, 2024 (Same Day)*
