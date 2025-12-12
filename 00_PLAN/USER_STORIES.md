# USER_STORIES.md - Clarioo Vendor Analyst

## Overview

This document contains comprehensive user stories for the Clarioo platform, organized by user personas and mapped to specific features and implementation files.

**Version**: 3.9.0
**Last Updated**: December 4, 2024
**Current Phase**: Phase 1 - n8n AI Integration (SP_018 Complete)
**Latest Update**: Sprint 018 (Progressive Vendor Comparison) Complete - Two-stage comparison system with individual vendor-criterion research (Stage 1) and comparative ranking with competitive advantage stars (Stage 2).

## Summary Statistics

**Total User Stories**: 50

**Implementation Status**:
- ✅ **Implemented**: 35 user stories (70%)
- 🤖 **Real n8n AI**: 10 user stories with live AI integration (20%)
- 🔄 **Planned**: 6 user stories (12%)
- 📋 **Future Planned**: 3 user stories (6%)
- 🔵 **Future (Phase 2+)**: 6 user stories (12%)

**Epic Progress**:
- Epic 0 (User Engagement): 100% (3/3)
- Epic 1 (Authentication): 67% (2/3)
- Epic 2 (Project Management): 100% (3/3)
- Epic 3 (Requirements): 80% (4/5)
- Epic 4 (Criteria): 100% (9/9)
- Epic 5 (Vendor Selection): 100% (3/3)
- Epic 6 (Comparison): 100% (9/9)
- Epic 7 (Invitation): 67% (2/3)
- Epic 8 (Vendor Portal): 0% (0/2)
- Epic 9 (Analytics): 0% (0/2)
- Epic 10 (Integration): 0% (0/2)
- Epic 11 (Landing Page): 100% (1/1)
- Epic 12 (Community): 60% (3/5)

## User Personas

1. **Technology Decision Maker** (Primary Persona)
   - Responsible for evaluating and selecting vendors across all organizational needs
   - Manages the complete vendor discovery journey from requirements to final selection
   - Handles project creation, criteria building, vendor comparison, and stakeholder collaboration

2. **Vendor Representative**
   - Software/Service provider responding to RFPs
   - Receives and responds to evaluation invitations
   - Manages company profile and vendor information

## Epic 0: User Engagement & Email Collection

### US-0.1: Provide Email for User Engagement (SP_017)
**As a** Technology Decision Maker (using platform for first time)
**I want to** submit my email address when creating my first project
**So that** I can receive updates, news, and future offers related to vendor discovery
**Acceptance Criteria:**
- Modal appears when user clicks "Create with AI" for the first time
- Email input field with frontend validation (required field)
- Trophy + Sparkles success animation (Lucide React icons - 1 second duration) on successful submission
- Modal is blocking but closable by clicking outside or pressing ESC
- Success message displayed after submission
- Mobile-responsive design (minimum 350px width)
- Gradient styling (purple/indigo) matching VISION.md

**Implementation:** `src/components/email/EmailCollectionModal.tsx`, enhanced `src/services/n8nService.ts`
**Data:** n8n Workflow `Clarioo_AI_Email_Collection.json` with Google Sheets integration
**Status:** ✅ Implemented (SP_017)

### US-0.2: Share Device Information for Analytics (SP_017)
**As a** Technology Decision Maker
**I want to** automatically share my device information (browser, OS, device type, screen resolution, timezone)
**So that** Clarioo can better optimize the platform for my device type
**Acceptance Criteria:**
- Device metadata collected automatically (no user action required)
- Metadata includes: browser (Chrome, Firefox, Safari, Edge, etc.), OS (Windows, macOS, iOS, Android, Linux)
- Device type classification (mobile, tablet, desktop)
- Screen resolution (width x height)
- Timezone information
- Data stored with email in Google Sheets

**Implementation:** `src/utils/deviceMetadata.ts`, updated `src/types/n8n.types.ts`
**Status:** ✅ Implemented (SP_017)

### US-0.3: Silent Retry on Failed Email Submission (SP_017)
**As a** Technology Decision Maker
**I want to** have the system automatically retry failed email submissions in the background
**So that** I don't lose my email information if there's a temporary network issue
**Acceptance Criteria:**
- Failed submissions tracked with `email_passed_to_n8n` flag in localStorage
- Automatic retry triggered when user navigates between workflow steps
- No blocking UI or error messages during retry (transparent to user)
- Retry occurs silently without interrupting workflow
- Maximum 3 retry attempts before marking as permanently failed

**Implementation:** VendorDiscovery component with enhanced `src/services/n8nService.ts`
**Status:** ✅ Implemented (SP_017)

---

## Epic 1: User Authentication & Profile Management

### US-1.1: User Registration
**As a** Technology Decision Maker
**I want to** create an account with my company email
**So that** I can access the vendor discovery platform securely
**Acceptance Criteria:**
- Email validation and verification
- Password strength requirements enforced
- Automatic profile creation upon registration
- Company information captured during signup

**Implementation:** `src/components/landing/AuthModal.tsx`, `src/hooks/useAuth.tsx`
**Data:** `src/data/api/auth.json` (mock service)
**Status:** ✅ Implemented

### US-1.2: User Login
**As a** Technology Decision Maker
**I want to** securely log in to my account
**So that** I can access my saved projects and vendor evaluations
**Acceptance Criteria:**
- Email/password authentication
- Session persistence
- Redirect to dashboard after login
- Error messages for invalid credentials

**Implementation:** `src/components/landing/AuthModal.tsx`, `src/hooks/useAuth.tsx`
**Data:** `src/data/api/auth.json` (mock service)
**Status:** ✅ Implemented

### US-1.3: Profile Management
**As a** Technology Decision Maker
**I want to** update my profile and company information
**So that** vendor recommendations are tailored to my organization
**Acceptance Criteria:**
- Edit company name, size, industry
- Update contact information
- Set notification preferences
- Change password functionality

**Implementation:** `src/components/Profile.tsx` (planned)
**Status:** 🔄 Planned

## Epic 2: Project Management

### US-2.1: Create New Project
**As a** Technology Decision Maker
**I want to** create a new vendor discovery project
**So that** I can start evaluating vendors for a specific need
**Acceptance Criteria:**
- Project name and description fields
- Category selection
- Auto-save as draft

**Implementation:** `src/pages/Index.tsx`, `src/components/projects/NewProjectDialog.tsx`
**Data:** `src/data/api/projects.json` (mock service)
**Status:** ✅ Implemented

### US-2.2: View Project Dashboard
**As a** Technology Decision Maker
**I want to** see all my vendor discovery projects in one place
**So that** I can manage multiple evaluations simultaneously
**Acceptance Criteria:**
- Grid/list view of projects
- Status indicators (draft/in-progress/completed)
- Last modified timestamp
- Quick actions (edit/delete/archive)
- Search and filter capabilities

**Implementation:** `src/pages/Index.tsx`
**Data:** `src/data/api/projects.json` (mock service)
**Status:** ✅ Implemented (SP_016 - Real n8n AI)

### US-2.3: Resume Project Workflow
**As a** Technology Decision Maker
**I want to** resume a project from where I left off
**So that** I don't lose progress on complex evaluations
**Acceptance Criteria:**
- Automatic workflow state persistence
- Visual indicator of current step
- Ability to jump to any completed step
- Data retention across sessions

**Implementation:** `src/pages/TechInput.tsx` through `src/pages/SendInvitation.tsx`
**Data:** `src/data/api/projects.json` (workflow state in JSON)
**Status:** ✅ Implemented

## Epic 3: Vendor Discovery Workflow - Step 1 (Requirements)

### US-3.1: Input Technology Requirements
**As a** Technology Decision Maker
**I want to** specify my technology needs and constraints
**So that** the AI can understand what I'm looking for
**Acceptance Criteria:**
- Category selection dropdown
- Detailed description text area
- Company size indicator
- Special requirements field

**Implementation:** `src/pages/TechInput.tsx`
**Data:** `src/data/api/techInput.json` (mock service)
**Status:** ✅ Implemented

### US-3.2: Save Requirements as Template
**As a** Technology Decision Maker
**I want to** save requirement templates
**So that** I can reuse them for similar vendor searches
**Acceptance Criteria:**
- Save current requirements as template
- Load from saved templates
- Edit and update templates
- Share templates with team

**Status:** 🔄 Planned

### US-3.3: Quick Project Creation from Category
**As a** Technology Decision Maker
**I want to** quickly create a project by selecting a software category
**So that** I can start vendor discovery without filling detailed forms
**Acceptance Criteria:**
- Category dropdown with 15+ predefined categories (CRM, Marketing, HR, etc.)
- Single-click project creation from category selection
- Confirmation dialog before project creation
- Category pre-fills requirements field
- Seamless transition to workflow

**Implementation:** `src/components/landing/CategoryDropdown.tsx`, `src/components/landing/ProjectConfirmationDialog.tsx`
**Related Feature:** F-027 (Category Selector)
**Status:** ✅ Implemented (SP_011)

### US-3.4: Quick Project Creation from Examples
**As a** Technology Decision Maker
**I want to** create projects from example use cases
**So that** I can get started without knowing exact requirements
**Acceptance Criteria:**
- Example projects popover with 4+ clickable examples
- One-click project creation from example
- Example pre-fills all initial requirements
- Clear indication that project is based on example template

**Implementation:** `src/components/landing/ExamplesBulletPopover.tsx`
**Related Feature:** F-027 (Category Selector - Examples)
**Status:** ✅ Implemented (SP_011)

### US-3.5: Registration-Free Project Creation
**As a** Technology Decision Maker
**I want to** create and explore projects without registering first
**So that** I can evaluate the platform before committing
**Acceptance Criteria:**
- No authentication required for project creation
- Landing view and project view toggle
- Clear distinction between marketing content and workflow
- Seamless experience without login prompts
- Option to register later to save progress

**Implementation:** `src/components/landing/ViewToggleButton.tsx`, `src/components/landing/RegistrationToggle.tsx`
**Related Feature:** F-030 (Registration-Free Experience)
**Status:** ✅ Implemented (SP_012)

## Epic 4: Vendor Discovery Workflow - Step 2 (Criteria)

### US-4.1: Generate Evaluation Criteria
**As a** Technology Decision Maker
**I want to** have AI generate comprehensive evaluation criteria
**So that** I don't miss important factors in vendor selection
**Acceptance Criteria:**
- AI generates 20 relevant criteria based on requirements
- Criteria grouped by categories (Technical, Business, Support, etc.)
- Each criterion has clear description
- Automatic relevance scoring

**Implementation:** `src/pages/CriteriaBuilder.tsx`
**Data:** `src/data/api/criteria.json`, `src/services/mock/aiService.ts` (pre-generated AI responses)
**Status:** ✅ Implemented

### US-4.2: Refine Criteria via Chat
**As a** Technology Decision Maker
**I want to** refine evaluation criteria through natural language
**So that** the criteria perfectly match my specific needs
**Acceptance Criteria:**
- Chat interface for criteria refinement
- AI understands context and adjusts criteria
- Add/remove/modify criteria via chat
- See changes in real-time

**Implementation:** `src/pages/CriteriaBuilder.tsx`, `src/hooks/useCriteriaChat.ts`
**Data:** `src/data/api/criteria.json` (mock AI chat responses)
**Status:** ✅ Implemented (SP_016 - Real n8n AI)

### US-4.3: Import Criteria from Excel
**As a** Technology Decision Maker
**I want to** import evaluation criteria from our standard Excel templates
**So that** I can use our company's established evaluation framework
**Acceptance Criteria:**
- Excel file upload (.xlsx, .xls)
- Automatic parsing and mapping
- Preview before import
- Merge with AI-generated criteria

**Implementation:** `src/pages/CriteriaBuilder.tsx`
**Library:** `xlsx` package
**Status:** ✅ Implemented

### US-4.4: Assign Criteria Weights
**As a** Technology Decision Maker
**I want to** assign importance weights to each criterion
**So that** vendor scoring reflects my priorities
**Acceptance Criteria:**
- Weight slider/input for each criterion
- Visual indication of weight distribution
- Automatic normalization to 100%
- Preset weight templates

**Implementation:** `src/components/vendor-discovery/CriteriaBuilder.tsx`, `src/hooks/useSwipeGesture.ts`
**Note:** Weight assignment via importance levels (low/medium/high), drag-and-drop reordering, swipe gestures for mobile adjustment
**Status:** ✅ Implemented (SP_012, SP_014)

### US-4.5: View Criteria in Accordion Layout
**As a** Technology Decision Maker
**I want to** view criteria organized by category in an accordion layout
**So that** I can focus on one category at a time and navigate easily on mobile
**Acceptance Criteria:**
- Vertical accordion with collapsible category sections
- Section headers show criterion count and importance summary
- Smooth expand/collapse animations
- Multiple sections can be open simultaneously
- Mobile-optimized card-based layout

**Implementation:** `src/components/vendor-discovery/AccordionSection.tsx`, `src/components/vendor-discovery/CriteriaAccordion.tsx`
**Related Feature:** F-029 (Criteria Accordion)
**Status:** ✅ Implemented (SP_012)

### US-4.6: Visual Importance Indicators
**As a** Technology Decision Maker
**I want to** see criterion importance visually represented
**So that** I can quickly identify high-priority criteria
**Acceptance Criteria:**
- Signal antenna icon with filled/unfilled bars
- High importance = 3 filled bars
- Medium importance = 2 filled bars
- Low importance = 1 filled bar
- Color-coded importance levels (orange/yellow/gray)

**Implementation:** `src/components/vendor-discovery/SignalAntenna.tsx`, `src/components/vendor-discovery/CriteriaCard.tsx`
**Related Feature:** F-028 (Criteria Hierarchy - Visual Indicators)
**Status:** ✅ Implemented (SP_012)

### US-4.7: Edit Criteria with AI Sidebar
**As a** Technology Decision Maker
**I want to** edit criteria using an AI-powered sidebar
**So that** I can refine criteria with conversational assistance
**Acceptance Criteria:**
- Right-side editing panel slides in when criterion is clicked
- AI chat interface for criterion refinement
- Edit name, explanation, importance, and type
- Real-time validation and suggestions
- Save/cancel actions

**Implementation:** `src/components/vendor-discovery/CriterionEditSidebar.tsx`
**Related Feature:** F-029 (Criteria Accordion - Edit Interface)
**Status:** ✅ Implemented (SP_012)

### US-4.8: Swipe to Adjust Criterion Importance
**As a** Technology Decision Maker (using mobile device)
**I want to** swipe left or right on criterion cards to adjust importance
**So that** I can quickly prioritize criteria without opening edit dialogs

**Acceptance Criteria:**
- Swipe right increases importance (Low → Medium → High)
- Swipe left decreases importance (High → Medium → Low)
- Second left swipe on Low importance archives the criterion
- Visual feedback: pink glow (increase), orange glow (decrease), grey glow (archive)
- Text overlays during swipe indicate action ("Increase Importance", "Decrease Importance", "Archive", "Maxed out")
- Card rotates slightly during swipe (±5 degrees) for tactile feel
- Cards automatically reorder by importance after swipe
- Archived criteria move to bottom with "Archived" badge and greyed appearance
- Works with both touch gestures and mouse drag
- Fast swipes commit at 25-30% threshold, slow swipes at 40-50%
- Smooth snap-back animation for incomplete swipes
- Minimum 20px horizontal distance to avoid scroll conflicts

**Implementation:**
- `src/hooks/useSwipeGesture.ts` - Reusable swipe gesture hook
- `src/components/vendor-discovery/CriterionCard.tsx` - Swipe integration
- `src/components/vendor-discovery/AccordionSection.tsx` - Auto-reordering

**Related Feature:** F-031 (Swipe-to-Adjust Importance Gestures)
**Status:** ✅ Implemented (SP_014)

### US-4.9: Share Criteria with Team
**As a** Technology Decision Maker
**I want to** share my criteria list with team members
**So that** we can collaborate on vendor selection criteria

**Acceptance Criteria:**
- "Share with your Team" button visible in criteria builder header
- Modal dialog opens with two sharing options
- Download criteria as formatted Excel file (.xlsx)
- Excel includes columns: Criterion, Explanation, Importance, Type, Status
- Auto-sized columns for readability
- Timestamped filename (e.g., criteria-list-2024-11-15.xlsx)
- Share-by-link generates shareable URL with project ID
- Copy link to clipboard with visual confirmation
- Toast notifications for success/error feedback
- Clean, accessible modal UI using shadcn/ui components

**Implementation:**
- `src/components/vendor-discovery/ShareDialog.tsx` - Share modal component
- Enhanced `src/components/vendor-discovery/CriteriaBuilder.tsx` - Share button integration

**Related Feature:** F-032 (Team Collaboration - Share Criteria)
**Status:** ✅ Implemented (SP_014)

## Epic 5: Vendor Discovery Workflow - Step 3 (Vendor Selection)

### US-5.1: Discover Relevant Vendors
**As a** Technology Decision Maker
**I want to** have AI discover vendors that match my requirements
**So that** I don't miss potential options in the market
**Acceptance Criteria:**
- AI identifies 8-10 relevant vendors
- Basic information for each vendor
- Relevance score/ranking
- Mix of established and emerging vendors

**Implementation:** `src/pages/VendorSelection.tsx`, `src/services/n8nService.ts` - findVendors() function
**Note:** Real AI-powered vendor matching with match scores, features, pricing (GPT-4o-mini via n8n)
**Status:** ✅ Implemented + 🤖 Real AI (SP_016+)

### US-5.2: Add Custom Vendors
**As a** Technology Decision Maker
**I want to** add vendors I already know about
**So that** they're included in the evaluation
**Acceptance Criteria:**
- Manual vendor entry form
- Search existing vendor database
- Bulk import from list
- Duplicate detection

**Implementation:** `src/pages/VendorSelection.tsx`
**Data:** `src/data/api/vendors.json`
**Status:** ✅ Implemented (SP_011)

### US-5.3: Remove/Exclude Vendors
**As a** Technology Decision Maker
**I want to** remove vendors from consideration
**So that** I only evaluate relevant options
**Acceptance Criteria:**
- Remove button for each vendor
- Reason for exclusion (optional)
- Ability to re-add removed vendors
- Exclusion list for future searches

**Implementation:** `src/pages/VendorSelection.tsx`
**Data:** `src/data/api/vendors.json`
**Status:** ✅ Implemented (SP_014 - Swipe Gestures)

## Epic 6: Vendor Discovery Workflow - Step 4 (Comparison)

### US-6.1: View Detailed Vendor Comparison
**As a** Technology Decision Maker
**I want to** see a detailed comparison of all selected vendors
**So that** I can make an informed decision
**Acceptance Criteria:**
- Side-by-side comparison table
- All criteria evaluated for each vendor
- Scores and ratings visible
- Strengths/weaknesses highlighted
- Key differentiators identified

**Implementation:**
- `src/pages/Comparison.tsx`, `src/hooks/useVendorComparison.ts`
- `src/hooks/useTwoStageComparison.ts` - Two-stage progressive comparison orchestration
- `src/services/n8nService.ts` - compareVendorCriterion(), rankCriterionResults()
**Note:** Progressive comparison system: Stage 1 (individual vendor-criterion research with evidence), Stage 2 (comparative ranking with competitive advantage stars)
**Status:** ✅ Implemented + 🤖 Real AI (SP_015, SP_016+, SP_018)

### US-6.2: Export Comparison to Excel
**As a** Technology Decision Maker
**I want to** export the vendor comparison to Excel
**So that** I can share it with stakeholders and create reports
**Acceptance Criteria:**
- Export full comparison matrix
- Include scores and notes
- Formatted for readability
- Multiple export formats (detailed/summary)

**Implementation:** `src/pages/Comparison.tsx`, `src/utils/exportHelpers.ts`
**Library:** `xlsx` package
**Status:** ✅ Implemented (SP_015)

### US-6.2a: Visualize Vendor Match with Wave Charts (SP_015)
**As a** Technology Decision Maker
**I want to** see vendor match levels visualized as smooth wave charts
**So that** I can quickly understand vendor performance across all criteria at a glance
**Acceptance Criteria:**
- Wave chart displays smooth curves (Catmull-Rom spline interpolation) for each vendor
- Y-axis shows match percentage (0-100%) with visual grid lines
- X-axis shows all evaluation criteria with truncated labels on mobile
- Each vendor wave has a distinct color with visual legend
- Overall match percentage displayed prominently for each vendor
- Smooth animations (500ms spring) when chart data updates
- Responsive design: mobile (stacked), tablet (single), desktop (side-by-side)
- Chart renders without performance issues for up to 20 criteria

**Implementation:**
- `src/components/VendorComparison.tsx` (refactored)
- `src/components/vendor-comparison/wave-chart/WaveChart.tsx`
- `src/components/vendor-comparison/wave-chart/VendorWave.tsx`
- `src/components/vendor-comparison/wave-chart/ChartGrid.tsx`
- `src/utils/splineInterpolation.ts`
- `src/types/comparison.types.ts`

**Technical:** SVG path generation, Framer Motion animations, memoized calculations
**Status:** ✅ Implemented (SP_015)

### US-6.2b: Navigate Vendors Independently (SP_015)
**As a** Technology Decision Maker
**I want to** cycle through different vendors independently on each comparison panel
**So that** I can compare any two vendors from my shortlist without being forced to view them in sequence
**Acceptance Criteria:**
- Each comparison panel has independent vendor navigation (left/right arrows)
- Current vendor indicator shows "1 of 5", "2 of 5", etc.
- Swipe gestures work on mobile for vendor switching (left/right swipe)
- Keyboard shortcuts work on desktop (← → arrow keys)
- Vendor transitions use smooth cross-fade animation (300ms)
- Can compare Vendor 1 vs Vendor 3, or Vendor 2 vs Vendor 5, etc. (any combination)
- Selected vendors remain stable unless user explicitly changes them
- Visual highlighting shows which vendor is currently displayed in each panel

**Implementation:**
- `src/components/vendor-comparison/navigation/VendorNavigator.tsx`
- `src/components/vendor-comparison/navigation/VendorIndicator.tsx`
- `src/components/vendor-comparison/navigation/NavigationControls.tsx`
- ComparisonState interface with vendor1/vendor2 independent state

**Technical:** Independent state management, swipe gesture detection, keyboard event handlers
**Status:** ✅ Implemented (SP_015)

### US-6.2c: View Criterion Details in Sliding Drawer (SP_015)
**As a** Technology Decision Maker
**I want to** click on any criterion marker to see full details in a sliding drawer
**So that** I can understand scoring rationale, edit importance, or refine with AI chat
**Acceptance Criteria:**
- Click criterion marker on X-axis → drawer slides in from right edge
- Drawer displays: criterion name, explanation, importance level, vendor scores
- Edit mode allows manual adjustment of importance (Low/Medium/High)
- Chat interface enables AI-powered criterion refinement
- Changes in drawer automatically update wave chart visualization
- Drawer closes via X button, outside click, or ESC key
- Mobile: drawer occupies full width; Desktop: drawer is 400px from right edge
- Smooth slide-in animation (300ms) with backdrop overlay

**Implementation:**
- `src/components/vendor-comparison/criterion-detail/CriterionDrawer.tsx`
- `src/components/vendor-comparison/criterion-detail/CriterionChat.tsx`
- `src/components/vendor-comparison/criterion-detail/CriterionEdit.tsx`
- Integration with existing CriterionEditSidebar pattern from SP_012

**Technical:** Framer Motion slide animations, chat integration, state synchronization
**Status:** ✅ Implemented (SP_015)

### US-6.2d: Interact with Wave Chart Tooltips (SP_015)
**As a** Technology Decision Maker
**I want to** hover over wave chart points to see detailed score information
**So that** I can understand specific vendor performance on individual criteria without cluttering the chart
**Acceptance Criteria:**
- Hover over any point on wave → tooltip displays criterion name and score (e.g., "Security: 87%")
- Tooltip follows cursor with smooth animation
- Touch on mobile → tap point to toggle tooltip (tap outside to dismiss)
- Tooltip design: white card with shadow, criterion name (bold), score percentage
- Multiple tooltips never overlap (intelligent positioning)
- Tooltip appears within 100ms of hover
- Chart controls allow toggling all tooltips on/off for cleaner view

**Implementation:**
- `src/components/vendor-comparison/wave-chart/ChartTooltip.tsx`
- `src/components/vendor-comparison/wave-chart/ChartControls.tsx`
- Hover/touch event handlers with position calculations

**Technical:** SVG event handling, tooltip positioning algorithm, touch gesture detection
**Status:** ✅ Implemented (SP_015)

### US-6.2e: Optimize Comparison for Mobile Devices (SP_015)
**As a** Technology Decision Maker (on mobile)
**I want to** view vendor comparisons optimized for small screens
**So that** I can review vendor evaluations on the go without horizontal scrolling or pinch-zooming
**Acceptance Criteria:**
- Mobile (<768px): Vendor charts stacked vertically, full width
- Criterion labels truncated intelligently (e.g., "Security & Compliance" → "Security...")
- Touch-optimized controls: large tap targets (44x44px minimum)
- Swipe gestures for vendor navigation work smoothly
- Match percentages displayed prominently at top of each chart
- No horizontal scrolling required at any breakpoint (320px-768px)
- Smooth scroll between vendor 1 chart and vendor 2 chart
- Chart maintains readability at minimum 320px width

**Implementation:**
- Responsive CSS in all wave-chart components
- Tailwind breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- `CriterionMarker.tsx` with text truncation logic
- Touch gesture handlers with mobile-specific optimizations

**Technical:** CSS Grid/Flexbox responsive layouts, text truncation, touch event optimization
**Status:** ✅ Implemented (SP_015)

### US-6.3: Generate Executive Summary
**As a** Technology Decision Maker
**I want to** get an AI-generated executive summary
**So that** I can quickly understand the recommendation
**Acceptance Criteria:**
- One-page summary with top recommendations
- Key decision factors highlighted
- Risk analysis included
- Cost-benefit summary

**Implementation:**
- `src/components/vendor-comparison/ExecutiveSummaryDialog.tsx` (641 lines) - Full viewport dialog
- `src/services/n8nService.ts` - generateExecutiveSummary() function
- `src/utils/comparisonStorage.ts` - Cache management
**Features:**
- Four sections: Key Criteria, Vendor Recommendations, Key Differentiators, Risk Factors
- Interactive: Copy to clipboard, regenerate, chat with AI sidebar, download/share
- localStorage caching with 2-minute timeout
- Error handling and retry
**Status:** ✅ Implemented + 🤖 Real AI (SP_016+)

### US-6.4: Mobile-Optimized Experience
**As a** Technology Decision Maker (using mobile device)
**I want to** access all features on my smartphone or tablet
**So that** I can work on vendor discovery while on the go
**Acceptance Criteria:**
- Responsive design for screens as small as 350px width
- Touch-optimized interactions (tap, swipe, scroll)
- Mobile-friendly navigation and workflow steps
- Optimized spacing and typography for mobile readability
- Fast load times on mobile networks
- Vertical layouts and collapsible sections for small screens

**Implementation:** Mobile-first CSS, responsive components across entire app, `src/styles/spacing-config.ts`, `src/styles/typography-config.ts`
**Related Feature:** F-030 (Mobile Optimization)
**Status:** ✅ Implemented (SP_011)

### US-6.5: Collaborate on Evaluation
**As a** Technology Decision Maker
**I want to** share the comparison with my team for input
**So that** we can make a collective decision
**Acceptance Criteria:**
- Share link generation
- Comment on specific vendors/criteria
- Vote or rate vendors
- Track team consensus

**Implementation:**
- `src/components/vendor-discovery/ShareDialog.tsx` - Reusable share component
- Download as Excel (.xlsx) with auto-sized columns
- Share-by-link with copy to clipboard
- Used in both CriteriaBuilder and ExecutiveSummaryDialog
**Status:** ✅ Implemented (SP_014)

## Epic 7: Vendor Discovery Workflow - Step 5 (Invitation)

### US-7.1: Select Vendors for Outreach
**As a** Technology Decision Maker
**I want to** select which vendors to invite for demos/proposals
**So that** I can engage with the most promising options
**Acceptance Criteria:**
- Checkbox selection for vendors
- Bulk selection options
- Set invitation type (demo/proposal/trial)
- Schedule preferences

**Implementation:** `src/components/steps/VendorInvite.tsx`
**Status:** ✅ Implemented

### US-7.2: Generate Invitation Emails
**As a** Technology Decision Maker
**I want to** have professional invitation emails generated
**So that** I can quickly reach out to vendors
**Acceptance Criteria:**
- AI-generated email templates
- Personalization for each vendor
- Include requirements summary
- Professional tone and formatting

**Implementation:** `src/components/steps/VendorInvite.tsx`
**Note:** Template-based email generation, not AI-powered
**Status:** ✅ Implemented

### US-7.3: Track Vendor Responses
**As a** Technology Decision Maker
**I want to** track which vendors have responded
**So that** I can manage the evaluation process
**Acceptance Criteria:**
- Response status tracking
- Follow-up reminders
- Meeting scheduling integration
- Response timeline view

**Status:** 🔄 Planned

## Epic 8: Vendor Perspective

### US-8.1: Respond to Invitations
**As** a Vendor Representative
**I want to** respond to evaluation invitations
**So that** I can present my solution to potential customers
**Acceptance Criteria:**
- Unique invitation link
- View requirements summary
- Submit proposal/information
- Schedule demo directly

**Status:** 🔵 Future

### US-8.2: Update Company Profile
**As** a Vendor Representative
**I want to** maintain our company profile
**So that** our information is accurate in evaluations
**Acceptance Criteria:**
- Claim company profile
- Update product information
- Add case studies and testimonials
- Specify industries and use cases

**Status:** 🔵 Future

## Epic 9: Analytics and Reporting

### US-9.1: View Project Analytics
**As a** Technology Decision Maker
**I want to** see analytics on our vendor selection process
**So that** I can improve our procurement efficiency
**Acceptance Criteria:**
- Time-to-decision metrics
- Cost savings calculations
- Vendor performance tracking
- Decision accuracy analysis

**Note:** Not implemented - no analytics dashboard components found
**Status:** 🔄 Planned

### US-9.2: Generate Compliance Reports
**As a** Technology Decision Maker
**I want to** generate audit-ready selection reports
**So that** we maintain compliance with procurement policies
**Acceptance Criteria:**
- Complete decision trail
- Criteria and scoring documentation
- Timestamp and user tracking
- Export in compliance formats

**Note:** Not implemented
**Status:** 🔄 Planned

## Epic 10: Integration and Automation

### US-10.1: Integrate with Procurement Systems
**As a** Technology Decision Maker
**I want to** integrate Clarioo with our ERP system
**So that** vendor selections flow into our procurement workflow
**Acceptance Criteria:**
- API for data exchange
- Webhook notifications
- SSO authentication
- Bi-directional sync

**Status:** 🔵 Future

### US-10.2: Automate Vendor Monitoring
**As a** Technology Decision Maker
**I want to** receive alerts about vendor changes
**So that** I stay informed about our vendor ecosystem
**Acceptance Criteria:**
- Price change notifications
- New feature announcements
- Security incident alerts
- Contract renewal reminders

**Status:** 🔵 Future

## Epic 11: Landing Page Experience

### US-11.1: View Process Visualization (Pre-Authentication)
**As** a first-time visitor
**I want to** see a visualization of the vendor discovery process
**So that** I understand how the platform works before signing up

**Acceptance Criteria:**
- "See Every Step of the Process" section visible on landing page
- Section displays workflow: "Evaluation Criteria" → "Intelligent Search AI Review" → "Vendor Matches"
- Section includes title "See Every Step of the Process"
- Section includes subtitle "Complete transparency from input to output. Watch how AI transforms your requirements into actionable insights."
- Visual flow diagram shows the transformation process
- Section is completely hidden after user authentication
- Smooth transition when authentication state changes
- Tagline "Find vendors that perfectly match your requirements" displayed

**Implementation:** `src/components/landing/CardCarousel.tsx` (376 lines) - Interactive 5-step carousel
**Features:**
- Auto-rotation (4s intervals)
- Play/pause controls
- Keyboard navigation (arrow keys)
- Swipe gesture support
- Center focus with scale animation
**Status:** ✅ Implemented (SP_007, SP_011)

---

## Epic 12: Community & Viral Features

### US-12.1: Interactive 5-Step Carousel
**As** a first-time visitor
**I want to** view an interactive carousel showing the 5 workflow steps
**So that** I can quickly understand the platform's value proposition

**Acceptance Criteria:**
- Landing page displays interactive card carousel with 5 cards
- Each card represents one workflow step with icon and description
- Cards are swipeable on mobile devices
- Smooth animations between carousel slides
- Visual indicators show current position in carousel
- Responsive design works on mobile (350px+) and desktop (1920px)

**Implementation:** `src/components/landing/CardCarousel.tsx`
**Status:** ✅ Implemented (SP_007, SP_011)

---

### US-12.2: iPod-Style Navigation
**As** a user
**I want to** navigate the landing page using circular/iPod-style controls
**So that** I have an intuitive and delightful navigation experience

**Acceptance Criteria:**
- Circular selector component for landing page navigation
- Touch-optimized for mobile interaction
- Visual feedback on touch/click
- Smooth transitions between sections

**Note:** Placeholder comment exists in LandingPage.tsx but not implemented
**Status:** 📋 Planned

---

### US-12.3: Community Templates Gallery
**As** a user
**I want to** browse example comparisons from the community
**So that** I can see how others are using the platform and get inspiration

**Acceptance Criteria:**
- "From the Community" section visible on landing page
- Gallery displays 3-6 example vendor comparisons
- Each example shows: project name, category, criteria count
- Examples are clickable to view full comparison details
- Social proof indicators (views, likes) if available

**Note:** Not implemented
**Status:** 📋 Planned

---

### US-12.4: Share Project with Branding
**As** a user
**I want to** share my comparison as a beautifully formatted PDF
**So that** I can present results to stakeholders while promoting the platform

**Acceptance Criteria:**
- Export comparison as PDF with professional branding
- PDF includes Clarioo logo and "Created with Clarioo" footer
- PDF contains complete comparison matrix with wave charts
- Shareable link generates preview card with platform branding
- Preview card displays on social media (LinkedIn, Twitter) with attractive formatting

**Note:** ShareDialog exists for criteria and executive summary, but not full project sharing with branding
**Status:** 🔄 Partially Implemented (SP_014)

---

### US-12.5: Visual Design System (Clearbit-Inspired)
**As** a user
**I want to** experience a visually sophisticated interface
**So that** using enterprise software feels delightful and modern

**Acceptance Criteria:**
- Gradient backgrounds on hero sections (soft coral/peach to white)
- Multi-layer card shadows for elevation (3-layer shadow system)
- Bold typography (56px headlines desktop, 36px mobile)
- Generous border radius (20px standard)
- Warm near-blacks (#1A1A1A) instead of pure black
- Gradient buttons (purple/indigo: #6366F1 → #8B5CF6)
- Animated input states with subtle pulsing glow
- Design system documented in style guide

**Implementation:**
- `src/tailwind.config.ts` - Complete design system with Clearbit-inspired colors
- `src/styles/typography-config.ts` - Mobile-first typography (274 lines)
- `src/styles/spacing-config.ts` - Responsive spacing patterns (227 lines)
**Features:**
- Brand colors: Primary blue #0066FF, gradients, neutral palette
- Shadow system: elevated-combined, button-glow, soft/medium/large
- Animation system: pulse-glow, pulse-border, float, shimmer, pulse-blue
- Complete 5-breakpoint responsive system
**Status:** ✅ Implemented

---

## Story Mapping to Features

| Feature | Related User Stories | Priority | Status |
|---------|---------------------|----------|--------|
| Authentication | US-1.1, US-1.2 | P0 | ✅ Implemented |
| Project Management | US-2.1, US-2.2, US-2.3 | P0 | ✅ Implemented + 🤖 Real AI |
| Requirements Input | US-3.1 | P0 | ✅ Implemented |
| Criteria Generation | US-4.1, US-4.2, US-4.3, US-4.4 | P0 | ✅ Implemented + 🤖 Real AI |
| Criteria Visualization | US-4.5, US-4.6, US-4.7, US-4.8 | P0 | ✅ Implemented |
| Team Collaboration | US-4.9, US-6.5 | P0 | ✅ Implemented |
| Vendor Discovery | US-5.1, US-5.2, US-5.3 | P0 | ✅ Implemented + 🤖 Real AI |
| Vendor Comparison | US-6.1, US-6.2, US-6.3 | P0 | ✅ Implemented + 🤖 Real AI |
| Vendor Invitation | US-7.1, US-7.2 | P0 | ✅ Implemented |
| Profile Management | US-1.3 | P1 | 🔄 Planned |
| Analytics | US-9.1, US-9.2 | P2 | 🔄 Planned |
| Vendor Portal | US-8.1, US-8.2 | P3 | 🔵 Future |
| Integrations | US-10.1, US-10.2 | P3 | 🔵 Future |
| Landing Page UX | US-11.1, US-12.1 | P0 | ✅ Implemented |
| iPod Navigation | US-12.2 | P2 | 📋 Planned |
| Community Templates | US-12.3 | P1 | 📋 Planned |
| Viral Sharing | US-12.4 | P1 | 🔄 Partially Implemented |
| Visual Design System | US-12.5 | P0 | ✅ Implemented |

## Legend

- ✅ **Implemented**: Feature UI is complete and functional
- 🤖 **Real AI**: Feature uses real n8n AI integration (GPT-4o-mini via n8n webhooks)
- 🎨 **Demo Only**: Visual demonstration with mock services (no real backend)
- 🔄 **Planned**: In roadmap for next sprints
- 🔵 **Future**: Long-term roadmap (Phase 2+)
- P0: Critical - Core functionality
- P1: Important - Key enhancements
- P2: Nice-to-have - Value additions
- P3: Future - Long-term vision

**Implementation Status**: This project transitioned from Phase 0 (Visual Prototype, SP_006-SP_015) to Phase 1 (n8n AI Integration, SP_016+).

**Real n8n AI Integration (8 webhooks active)**:
- Project creation with GPT-4o-mini (SP_016)
- Criteria generation and chat (SP_016)
- Vendor discovery search with match scoring (SP_016+)
- Two-stage vendor comparison research (SP_016+, SP_018)
- Comparative ranking with competitive advantage analysis (SP_018)
- Executive summary generation with four sections (SP_016+)
- Email collection with device metadata (SP_017)
- Criteria refinement with AI chat (SP_016)

**Data Persistence**: All project data, criteria, and workflow state persist in localStorage.

---

*Version: 3.9.0*
*Last Updated: December 4, 2024*
*Total User Stories: 50*
*✅ Implemented: 35 (10 with real n8n AI) | 🔄 Planned: 6 | 📋 Future Planned: 3 | 🔵 Future (Phase 2+): 6*
*Current Phase: Phase 1 - n8n AI Integration (SP_018 Complete)*
*Next Sprint: SP_019 - Continued n8n Integration*
*Personas: 2 (Technology Decision Maker, Vendor Representative)*