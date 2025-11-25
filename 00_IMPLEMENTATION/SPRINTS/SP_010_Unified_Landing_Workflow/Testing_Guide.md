# SP_010 Testing Guide - Unified Landing & Workflow Integration

## Document Overview

This guide provides comprehensive manual testing instructions for Sprint SP_010 (Unified Landing & Workflow Integration). Follow these test cases to validate the seamless single-page experience from marketing content to project workflow.

**Sprint**: SP_010 - Unified Landing & Workflow Integration
**Created**: November 12, 2024
**Status**: Ready for Testing
**Application URL**: http://localhost:8080/

---

## Testing Objectives

Validate the following user experience flows:
1. ✅ Pre-authentication state displays marketing content
2. ✅ Authentication flow closes modal and transitions to workflow
3. ✅ Post-authentication state hides marketing, shows ProjectDashboard
4. ✅ Project selection opens VendorDiscovery
5. ✅ Back navigation returns to ProjectDashboard
6. ✅ Workflow state persistence works (GAP-1)
7. ✅ Landing input connection works (GAP-4)
8. ✅ Mobile responsiveness maintained

---

## Test Environment Setup

### Prerequisites
- ✅ Application running on http://localhost:8080/
- ✅ Build status clean (no console errors)
- ✅ localStorage cleared for fresh testing (optional)

### Browser Requirements
- **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Android Chrome (viewport testing)
- **Screen Sizes**:
  - Mobile: 375px width (iPhone SE)
  - Tablet: 768px width (iPad)
  - Desktop: 1440px width (Standard laptop)

### Testing Tools
- Browser DevTools (Console, Network, Application tabs)
- Responsive design mode for viewport testing
- localStorage inspector for state persistence testing

---

## Test Case 1: Pre-Authentication State

### Objective
Verify that the landing page displays all marketing content before user authentication.

### Test Steps
1. Navigate to http://localhost:8080/
2. Wait for page to fully load
3. Verify the following elements are **visible**:
   - [ ] HeroSection (title and subtitle with gradient styling)
   - [ ] RegistrationToggle (Sign Up / Sign In buttons)
   - [ ] AnimatedInputs (two input fields for company and solution)
   - [ ] ArtifactVisualization (workflow visualization section)
   - [ ] CardCarousel (5-card interactive carousel)
4. Verify the following elements are **NOT visible**:
   - [ ] ProjectDashboard component
   - [ ] VendorDiscovery component
   - [ ] Project cards or project selection UI

### Expected Results
- ✅ All marketing content displays correctly
- ✅ No workflow components visible
- ✅ Page loads without console errors
- ✅ Animations work smoothly (hypnotic input animations, carousel transitions)
- ✅ Mobile-responsive layout (test on 375px, 768px, 1440px widths)

### Console Checks
```javascript
// Open DevTools Console and run:
console.log('Pre-Auth State:', {
  hasUser: !!document.querySelector('[data-auth-user]'),
  marketingVisible: !!document.querySelector('[data-marketing-content]'),
  workflowVisible: !!document.querySelector('[data-workflow-content]')
});
// Expected: hasUser: false, marketingVisible: true, workflowVisible: false
```

---

## Test Case 2: Input Pre-Fill (GAP-4 Validation)

### Objective
Verify that landing page inputs save to localStorage and pre-fill workflow Step 1.

### Test Steps
1. On the landing page (pre-authentication), locate the AnimatedInputs section
2. Enter test data:
   - **Company Input**: "I work at Acme Corp in the Engineering department"
   - **Solution Input**: "Looking for project management software with AI features"
3. Open DevTools → Application → localStorage
4. Verify the following keys exist:
   - [ ] `landing_company_input` with your company text
   - [ ] `landing_solution_input` with your solution text
5. Proceed to authentication (next test case)
6. After authentication, check if TechInput (Step 1) pre-fills with these values

### Expected Results
- ✅ Input values save to localStorage on change
- ✅ No page reload or navigation
- ✅ Values persist after page refresh
- ✅ Later test will verify pre-fill in TechInput

### localStorage Inspector
```javascript
// Check localStorage values
console.log('Landing Inputs:', {
  company: localStorage.getItem('landing_company_input'),
  solution: localStorage.getItem('landing_solution_input')
});
```

---

## Test Case 3: Authentication Flow

### Objective
Verify that signing up or signing in triggers smooth transition from marketing to workflow content without navigation breaks.

### Test Steps

#### Sign Up Flow
1. Click **"Sign Up"** button in RegistrationToggle
2. Verify AuthModal opens
3. Fill in the sign-up form:
   - **Full Name**: "Test User"
   - **Company Name**: "Test Company"
   - **Email**: "test@example.com"
   - **Password**: "password123"
4. Click **"Create Account"** button
5. Observe the following sequence:
   - [ ] Loading state displays ("Creating Account...")
   - [ ] Success state displays with checkmark icon
   - [ ] Success message: "Account created successfully!"
   - [ ] Loading message: "Loading your projects..."
   - [ ] Modal closes after ~1.5 seconds
6. Observe the page transition:
   - [ ] Marketing content (ArtifactVisualization, CardCarousel) fades out (400ms)
   - [ ] Workflow content (ProjectDashboard) fades in (500ms)
   - [ ] AnimatedInputs remain visible throughout
   - [ ] HeroSection remains visible throughout
   - [ ] No page reload or URL change
   - [ ] No navigation to `/dashboard`

#### Sign In Flow (Alternative)
1. If testing sign-in instead, click **"Sign In"** button
2. Fill in the sign-in form:
   - **Email**: "test@example.com"
   - **Password**: "password123"
3. Click **"Sign In"** button
4. Observe same success sequence as sign-up flow

### Expected Results
- ✅ AuthModal opens and closes smoothly
- ✅ Success animation displays (checkmark icon)
- ✅ Success message appropriate for sign-up vs. sign-in
- ✅ Modal auto-closes after 1.5 seconds
- ✅ Marketing content fades out smoothly (400ms)
- ✅ Workflow content fades in smoothly (500ms)
- ✅ AnimatedInputs remain visible (context preservation)
- ✅ URL remains `http://localhost:8080/` (no navigation)
- ✅ No console errors during transition
- ✅ Smooth transition on mobile viewports (no layout shift)

### Console Checks
```javascript
// After authentication completes:
console.log('Post-Auth State:', {
  hasUser: !!document.querySelector('[data-auth-user]'),
  marketingVisible: !!document.querySelector('[data-marketing-content]'),
  workflowVisible: !!document.querySelector('[data-workflow-content]'),
  currentURL: window.location.href
});
// Expected: hasUser: true, marketingVisible: false, workflowVisible: true, currentURL: http://localhost:8080/
```

---

## Test Case 4: Post-Authentication State

### Objective
Verify that after authentication, marketing content is hidden and ProjectDashboard is displayed.

### Test Steps
1. After completing authentication (Test Case 3), observe the page state
2. Verify the following elements are **visible**:
   - [ ] HeroSection (remains visible)
   - [ ] RegistrationToggle (remains visible)
   - [ ] AnimatedInputs (remains visible)
   - [ ] ProjectDashboard component with header "Your Projects"
   - [ ] User email displayed in header (from useAuth hook)
   - [ ] "Sign Out" button visible
   - [ ] Mock project cards (e.g., "Tech Stack Refresh", "New CRM System")
   - [ ] "Create New Project" button
3. Verify the following elements are **NOT visible**:
   - [ ] ArtifactVisualization
   - [ ] CardCarousel
   - [ ] Marketing content sections

### Expected Results
- ✅ ProjectDashboard visible with correct data
- ✅ Marketing content completely hidden (not just display:none, but removed from DOM via AnimatePresence)
- ✅ User email displays correctly
- ✅ Project cards render with mock data
- ✅ No layout shift or flash of content
- ✅ Smooth animation completed
- ✅ Mobile-responsive layout maintained

### Visual Verification
- ProjectDashboard should occupy the space where ArtifactVisualization and CardCarousel were
- No empty space or gaps in layout
- Gradient background maintained
- Typography and spacing consistent

---

## Test Case 5: TechInput Pre-Fill (GAP-4 Continuation)

### Objective
Verify that TechInput (Step 1) pre-fills with values from landing page inputs.

### Test Steps
1. From ProjectDashboard, click on any project card (e.g., "Tech Stack Refresh")
2. VendorDiscovery workflow opens
3. Observe Step 1: Technology Exploration (TechInput component)
4. Verify the following:
   - [ ] Company description field pre-filled with value from `landing_company_input`
   - [ ] Solution requirements field pre-filled with value from `landing_solution_input`
   - [ ] Toast notification appears: "✨ Pre-filled from landing page"
   - [ ] Pre-filled values are editable (not disabled)
5. If no pre-fill occurs, check DevTools Console for errors

### Expected Results
- ✅ TechInput loads from localStorage on mount
- ✅ Company description field contains landing page company input
- ✅ Solution requirements field contains landing page solution input
- ✅ Toast notification displays success message
- ✅ User can edit pre-filled values
- ✅ No console errors during pre-fill

### Debugging
If pre-fill doesn't work:
```javascript
// Check localStorage values
console.log('localStorage values:', {
  company: localStorage.getItem('landing_company_input'),
  solution: localStorage.getItem('landing_solution_input')
});

// Check if TechInput loaded
console.log('TechInput mounted:', !!document.querySelector('form'));
```

---

## Test Case 6: Project Selection

### Objective
Verify that clicking a project card opens VendorDiscovery workflow.

### Test Steps
1. From ProjectDashboard, identify mock project cards
2. Click on first project card (e.g., "Tech Stack Refresh")
3. Observe transition:
   - [ ] ProjectDashboard fades out or transitions away
   - [ ] VendorDiscovery component loads
   - [ ] Project name displays in header
   - [ ] "Back to Projects" button visible
   - [ ] Step 1: Technology Exploration displays
   - [ ] 5-step progress bar visible (Step 1 active)
4. Verify workflow state:
   - [ ] Current step: "tech-input"
   - [ ] Progress: 20% (Step 1 of 5)
   - [ ] Step cards display all 5 steps
   - [ ] Current step highlighted with primary color ring

### Expected Results
- ✅ ProjectDashboard to VendorDiscovery transition smooth
- ✅ Project context preserved (correct project name, description)
- ✅ Workflow initializes at Step 1
- ✅ All 5 step cards visible
- ✅ Progress bar accurate (20%)
- ✅ "Back to Projects" button functional (test next)
- ✅ No console errors during transition

---

## Test Case 7: Back Navigation

### Objective
Verify that clicking "Back to Projects" returns to ProjectDashboard without losing state.

### Test Steps
1. From VendorDiscovery workflow (Test Case 6), locate "Back to Projects" button in header
2. Click "Back to Projects" button
3. Observe transition:
   - [ ] VendorDiscovery fades out or transitions away
   - [ ] ProjectDashboard fades back in
   - [ ] Project cards still visible
   - [ ] No page reload or URL change
4. Click same project card again
5. Verify workflow state persists:
   - [ ] Returns to same step (if you progressed beyond Step 1)
   - [ ] Input values preserved (if you entered data)
   - [ ] "Last saved" timestamp visible (if workflow was saved)

### Expected Results
- ✅ Back navigation works without page reload
- ✅ ProjectDashboard state preserved
- ✅ Re-selecting project loads saved workflow state (GAP-1)
- ✅ Smooth transitions both directions
- ✅ No loss of user input or progress
- ✅ No console errors

---

## Test Case 8: Workflow State Persistence (GAP-1 Validation)

### Objective
Verify that workflow state saves to localStorage and restores on component mount.

### Test Steps

#### Save State
1. From VendorDiscovery workflow, complete Step 1 (TechInput):
   - Fill in company description
   - Fill in solution requirements
   - Select category, budget, urgency
   - Click "Continue" to move to Step 2
2. Observe "Last saved" indicator in header:
   - [ ] "Last saved: [timestamp]" displays
   - [ ] Timestamp updates as you progress
3. Open DevTools → Application → localStorage
4. Verify the following key exists:
   - [ ] `workflow_[projectId]` (e.g., `workflow_proj-1`)
5. Inspect the stored value:
   ```javascript
   JSON.parse(localStorage.getItem('workflow_proj-1'))
   ```
6. Verify it contains:
   - [ ] `currentStep`: "criteria"
   - [ ] `techRequest`: { category, description, urgency, budget, companyInfo }
   - [ ] `criteria`: [] (empty initially)
   - [ ] `selectedVendors`: [] (empty initially)
   - [ ] `lastSaved`: ISO timestamp

#### Restore State
1. Continue to Step 2 or Step 3 (add some criteria or select vendors)
2. Refresh the page (F5 or Cmd+R)
3. Sign in again (if needed)
4. Select the same project
5. Observe restoration:
   - [ ] VendorDiscovery loads
   - [ ] Workflow resumes at saved step (not Step 1)
   - [ ] Toast notification: "✨ Workflow restored - Loaded your progress from [timestamp]"
   - [ ] All input values preserved
   - [ ] All criteria preserved (if Step 2 completed)
   - [ ] All selected vendors preserved (if Step 3 completed)

### Expected Results
- ✅ Workflow auto-saves on every state change
- ✅ "Last saved" timestamp updates in UI
- ✅ localStorage contains complete workflow state
- ✅ Page refresh preserves workflow progress
- ✅ Toast notification confirms restoration
- ✅ All input values, criteria, and vendors preserved
- ✅ No data loss or corruption

### Debugging
```javascript
// Check saved workflow state
const projectId = 'proj-1'; // Replace with actual project ID
const savedState = localStorage.getItem(`workflow_${projectId}`);
console.log('Saved Workflow:', JSON.parse(savedState));

// Expected structure:
// {
//   projectId: "proj-1",
//   currentStep: "criteria" | "vendor-selection" | ...,
//   lastSaved: "2024-11-12T19:30:00.000Z",
//   techRequest: { category, description, urgency, budget, companyInfo },
//   criteria: [ { id, name, importance, type }, ... ],
//   selectedVendors: [ { id, name, description, ... }, ... ]
// }
```

---

## Test Case 9: Sign Out

### Objective
Verify that signing out returns to pre-authentication state.

### Test Steps
1. From ProjectDashboard or VendorDiscovery, locate "Sign Out" button in header
2. Click "Sign Out" button
3. Observe transition:
   - [ ] Workflow content fades out
   - [ ] Marketing content fades back in
   - [ ] ArtifactVisualization visible
   - [ ] CardCarousel visible
   - [ ] RegistrationToggle shows "Sign Up" / "Sign In" options
4. Verify localStorage:
   - [ ] User session cleared
   - [ ] Workflow state still preserved (for next sign-in)

### Expected Results
- ✅ Sign out works without page reload
- ✅ Returns to pre-authentication marketing state
- ✅ Marketing content visible again
- ✅ Workflow content hidden
- ✅ Smooth fade-in/fade-out transitions
- ✅ No console errors

---

## Test Case 10: Mobile Responsiveness

### Objective
Verify that unified experience works seamlessly on mobile viewports.

### Test Steps

#### Mobile Portrait (375px width)
1. Open DevTools → Toggle Device Toolbar
2. Select "iPhone SE" or set custom width to 375px
3. Repeat Test Cases 1-9 on mobile viewport
4. Additional mobile-specific checks:
   - [ ] Marketing content stacks vertically
   - [ ] AnimatedInputs stack vertically (one above the other)
   - [ ] CardCarousel shows 1 card at a time with swipe gestures
   - [ ] ProjectDashboard cards stack vertically
   - [ ] VendorDiscovery step cards scroll horizontally or stack
   - [ ] All buttons and inputs are touch-friendly (44px minimum)
   - [ ] No horizontal scrolling (overflow-x hidden)
   - [ ] Text remains readable (no tiny fonts)

#### Tablet (768px width)
1. Select "iPad" or set custom width to 768px
2. Verify intermediate layout:
   - [ ] AnimatedInputs side-by-side or stacked (design choice)
   - [ ] CardCarousel shows 2-3 cards
   - [ ] ProjectDashboard cards in 2-column grid
   - [ ] VendorDiscovery step cards in 2-column grid

#### Desktop (1440px width)
1. Select "Laptop with HiDPI screen" or set custom width to 1440px
2. Verify full-width layout:
   - [ ] AnimatedInputs side-by-side
   - [ ] CardCarousel shows 3-5 cards
   - [ ] ProjectDashboard cards in 3-4 column grid
   - [ ] VendorDiscovery step cards in 4-5 column grid

### Expected Results
- ✅ Responsive layouts work at all breakpoints
- ✅ No layout breaks or overlapping content
- ✅ Touch targets appropriately sized on mobile
- ✅ Animations smooth on mobile (no jank)
- ✅ No horizontal scrolling at any breakpoint

---

## Test Case 11: Console Error Check

### Objective
Verify that no console errors occur during any user flow.

### Test Steps
1. Open DevTools → Console
2. Clear console (Ctrl+L or Cmd+K)
3. Perform complete user flow:
   - Load landing page
   - Enter input values
   - Sign up
   - Select project
   - Navigate workflow
   - Back to projects
   - Sign out
4. Review console for:
   - [ ] No errors (red messages)
   - [ ] No warnings (yellow messages, acceptable if minor)
   - [ ] Expected logs (e.g., "✅ Workflow state loaded")

### Expected Results
- ✅ Zero console errors during entire flow
- ✅ Only expected console logs (state updates, auto-save confirmations)
- ✅ No React warnings (key props, deprecated APIs, etc.)
- ✅ No network errors (failed API calls, 404s)

### Acceptable Logs
These logs are expected and indicate correct behavior:
- `✅ Workflow state loaded from localStorage (GAP-1)`
- `💾 Workflow auto-saved (GAP-1)`
- `✅ Project state saved (GAP-1)`
- `Opening auth modal: Sign Up` or `Sign In`

---

## Test Case 12: Network Activity

### Objective
Verify that no unexpected network requests occur during state transitions.

### Test Steps
1. Open DevTools → Network tab
2. Clear network log
3. Perform authentication flow
4. Observe network activity:
   - [ ] No requests to `/dashboard` route
   - [ ] No page navigation (HTML document requests)
   - [ ] Only expected API calls (if any)
   - [ ] HMR updates (acceptable during development)

### Expected Results
- ✅ No navigation-related network requests
- ✅ No 404 errors for missing routes
- ✅ No failed API calls
- ✅ Minimal network activity (pure client-side transitions)

---

## Test Case 13: Browser Back/Forward Buttons

### Objective
Verify behavior when using browser navigation buttons.

### Test Steps
1. Complete full authentication flow
2. Navigate to ProjectDashboard → VendorDiscovery
3. Click browser **Back** button
4. Observe behavior:
   - [ ] URL remains `http://localhost:8080/` (no change)
   - [ ] No navigation occurs (state-based rendering)
   - [ ] OR returns to previous component state (if URL hash routing added)
5. Click browser **Forward** button
6. Observe behavior:
   - [ ] URL remains `http://localhost:8080/`
   - [ ] No navigation occurs

### Expected Results
- ✅ Browser back/forward buttons don't break the experience
- ✅ State preserved regardless of browser navigation
- ✅ No unexpected page reloads

**Note**: If this behavior is not ideal (e.g., user expects back button to work), consider implementing URL hash routing in future sprint. This is not a blocker for SP_010.

---

## Test Case 14: localStorage Quota

### Objective
Verify that workflow state doesn't exceed localStorage quota.

### Test Steps
1. Complete entire workflow (all 5 steps)
2. Add maximum data:
   - 10-20 criteria
   - 10-20 vendors
   - Detailed descriptions
3. Open DevTools → Application → localStorage
4. Check size of `workflow_[projectId]` value
5. Verify it's under 5MB (localStorage quota varies by browser)

### Expected Results
- ✅ Workflow state stores successfully
- ✅ No quota exceeded errors
- ✅ State size reasonable (<1MB typical)

### Debugging
```javascript
// Calculate localStorage usage
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length + key.length;
  }
}
console.log('localStorage usage:', (total / 1024).toFixed(2) + ' KB');
```

---

## Known Issues & Limitations

### Expected Behavior (Not Bugs)
1. **Browser back/forward buttons**: No effect on single-page state-based rendering
   - **Future**: Consider adding URL hash routing (#/dashboard, #/project/123)
2. **Deep linking**: Cannot directly link to ProjectDashboard or specific project
   - **Future**: Implement URL routing if needed for sharing workflows
3. **Multiple tabs**: Workflow state not synced across tabs
   - **Future**: Consider localStorage events for cross-tab sync

### Out of Scope for SP_010
1. Real-time collaboration features
2. Offline support / service workers
3. Progressive web app (PWA) features
4. Advanced animations beyond current implementation

---

## Regression Testing

After any code changes, re-run the following critical path:

### Critical Path Test (5 minutes)
1. ✅ Load landing page → Marketing content visible
2. ✅ Enter input values → localStorage saves
3. ✅ Sign up → Modal closes, workflow fades in
4. ✅ Select project → VendorDiscovery opens
5. ✅ TechInput pre-filled → Landing inputs restored
6. ✅ Complete Step 1 → Auto-save occurs
7. ✅ Refresh page → Workflow restores
8. ✅ Back to projects → ProjectDashboard visible
9. ✅ Sign out → Marketing content fades back in

**Pass Criteria**: All 9 steps complete without errors or unexpected behavior.

---

## Test Results Template

Use this template to document your test results:

```markdown
## Test Results - SP_010 Unified Landing & Workflow Integration

**Tester**: [Your Name]
**Date**: [YYYY-MM-DD]
**Browser**: [Chrome 119.0, Firefox 120.0, etc.]
**Device**: [Desktop, iPhone 14, iPad Pro, etc.]
**Build Version**: v3.3.0

### Test Cases
- [ ] TC1: Pre-Authentication State - PASS/FAIL
- [ ] TC2: Input Pre-Fill (GAP-4) - PASS/FAIL
- [ ] TC3: Authentication Flow - PASS/FAIL
- [ ] TC4: Post-Authentication State - PASS/FAIL
- [ ] TC5: TechInput Pre-Fill - PASS/FAIL
- [ ] TC6: Project Selection - PASS/FAIL
- [ ] TC7: Back Navigation - PASS/FAIL
- [ ] TC8: Workflow Persistence (GAP-1) - PASS/FAIL
- [ ] TC9: Sign Out - PASS/FAIL
- [ ] TC10: Mobile Responsiveness - PASS/FAIL
- [ ] TC11: Console Error Check - PASS/FAIL
- [ ] TC12: Network Activity - PASS/FAIL
- [ ] TC13: Browser Navigation - PASS/FAIL
- [ ] TC14: localStorage Quota - PASS/FAIL

### Critical Path
- [ ] Critical Path Test (5 min) - PASS/FAIL

### Overall Result
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues found (specify below)
- [ ] ❌ Critical issues found (specify below)

### Issues Found
1. [Issue description, steps to reproduce, severity]
2. [Issue description, steps to reproduce, severity]

### Notes
[Any additional observations, suggestions, or feedback]
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: Marketing content doesn't fade out after sign-in
- **Cause**: useAuth hook not updating user state
- **Solution**: Check AuthContext provider wraps entire app
- **Debug**: `console.log('User:', useAuth())` in LandingPage component

**Issue**: ProjectDashboard not appearing after authentication
- **Cause**: Conditional rendering logic broken
- **Solution**: Check `{user &&` condition in LandingPage.tsx:136
- **Debug**: `console.log('Rendering workflow:', !!user)` before conditional

**Issue**: TechInput not pre-filling from landing page
- **Cause**: localStorage keys not matching
- **Solution**: Verify `landing_company_input` and `landing_solution_input` exist
- **Debug**: Check localStorage in DevTools → Application tab

**Issue**: Workflow state not persisting
- **Cause**: localStorage disabled or quota exceeded
- **Solution**: Enable localStorage, clear old data if quota exceeded
- **Debug**: `localStorage.setItem('test', 'test')` to verify localStorage works

---

## Conclusion

This testing guide covers all critical user flows for Sprint SP_010. Complete testing ensures the unified landing page experience works seamlessly from marketing content through authentication to project workflow, with proper state persistence and context preservation.

**Next Steps After Testing**:
1. Document any issues found using the Test Results Template
2. Create GitHub issues for bugs or improvements
3. Update PROGRESS.md with test results
4. Proceed to Sprint SP_007 (Visual Design Enhancement) if all tests pass

---

**Document Version**: 1.0.0
**Last Updated**: November 12, 2024
**Maintained By**: Development Team
