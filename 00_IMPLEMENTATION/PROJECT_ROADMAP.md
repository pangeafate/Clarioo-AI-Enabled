# PROJECT ROADMAP - Clarioo AI-Powered Vendor Analyst

## Executive Summary

**🚀 PROJECT STATUS: PHASE 1 - n8n AI INTEGRATION (ACTIVE)**

**Current State**: Production-ready core features with 12 active n8n AI webhooks, localStorage persistence, and fully integrated vendor discovery workflow with advanced visualization and analysis features.

**Vision**: Intelligent, AI-powered software vendor selection platform that eliminates 90% of routine evaluation work through GPT-4o-mini processing via n8n workflows.

**Current Sprint**: None (Awaiting next sprint planning)
**Next Sprint**: TBD (Future enhancements)
**Last Updated**: February 21, 2026 (v4.8.0 - SP_031 complete)

---

## Product Development Phases

### Phase 1: n8n AI Integration (Q4 2024 - Q1 2026) 🚀 **COMPLETE**

**Status**: Complete (12/12 webhooks operational)
**Timeline**: November 23, 2024 - January 14, 2026
**Purpose**: Transform visual prototype into production-ready platform with real AI integration

#### Phase 1 Objectives

**Core AI Integration** ✅
- [x] Project creation with GPT-4o-mini (SP_016)
- [x] Criteria generation and refinement (SP_016)
- [x] Vendor discovery via Perplexity (SP_018)
- [x] Two-stage progressive vendor comparison (SP_018)
- [x] Executive summary generation (SP_019)
- [x] Vendor card summaries (SP_019)
- [x] Email collection with device analytics (SP_017)

**Data Architecture** ✅
- [x] localStorage persistence layer (SP_016)
- [x] User/session ID tracking (SP_016)
- [x] Summary caching system (SP_019)
- [x] Email retry mechanism (SP_017)

**Infrastructure** ✅
- [x] Webhook mode switching (production/testing)
- [x] 9 active n8n webhook endpoints
- [x] Timeout management (45s - 180s)
- [x] Error handling and retry logic

---

## Sprint History

### 🟢 PLANNED SPRINTS

---

#### Sprint 29: Excel Template Upload with Reverse Engineering (SP_029)
**Status**: 📋 PLANNED
**Type**: Feature Implementation + Excel Reverse Engineering + n8n Integration
**Estimated Duration**: 3-4 days
**Priority**: HIGH
**Dependencies**: SP_027 (Excel Export Service), SP_028 (Admin Mode Toggle - partial)

**Objective**: Enable admin users to upload Excel files exported by the system, reverse-engineer them back into `ExportProjectData` JSON format, and store them as templates in n8n Data Tables for public browsing.

**Key Innovation**: **Zero transformation approach** - Excel exports become templates directly, eliminating multi-step transformation bugs.

**Key Deliverables**:
- Excel import service (`excelImportService.ts`) - Reverse engineer all 7 Excel tabs
- JSON export format matching `excelExportService.ts` exactly (ExportProjectData)
- Admin-only upload button in TemplatesModal
- n8n Data Tables integration (`uploadTemplate` function)
- Updated `templateService.ts` to use JSON directly (zero transformations)
- Validation and error handling
- Progress indicators and toast notifications
- Round-trip testing (Export → Upload → Clone → Export = identical)

**Technical Approach**:
- Frontend parses Excel using ExcelJS
- Build ExportProjectData JSON matching export format exactly
- Upload complete JSON to n8n Data Tables
- Frontend uses template JSON directly (NO transformations)
- Eliminates all transformation bugs permanently

**Impact**:
- 🎯 Zero transformation bugs (one consistent data structure)
- 🎯 Easy template creation (export any project → save as template)
- 🎯 Perfect round-trip fidelity
- 🎯 Admin-only feature with passcode protection
- 🎯 Partial upload support with warnings

**Sprint Document**: [SP_029_Excel_Template_Upload.md](./SPRINTS/SP_029_Excel_Template_Upload.md)

---

### ✅ COMPLETED SPRINTS

#### Sprint 31: Validation Badges for Vendor Comparison Matrix (SP_031)
**Date**: February 21, 2026
**Status**: ✅ COMPLETE
**Type**: UI Enhancement / New Feature
**Duration**: 1 day
**Priority**: MEDIUM
**Dependencies**: SP_018 (Two-Stage Comparison), SP_019 (Vendor Comparison Component)

**Objective**: Add per-cell validation badges to the comparison matrix so buyers can record that a data point was independently verified by the vendor (V), buyer (B), or an external expert (E).

**Key Deliverables**:
- ✅ `src/types/validation.types.ts` - CellValidation interface + localStorage utilities
- ✅ `src/components/vendor-comparison/ValidationBadges.tsx` - SVG orbital ring with badge circles at 12/9/3 o'clock
- ✅ `VerticalBarChart.tsx` updated - all icon states wrapped with ValidationBadges
- ✅ `VendorComparisonNew.tsx` updated - validation toggles in cell detail modal, force re-render on change
- ✅ Validation persisted per-cell in localStorage (`validation_{projectId}_{vendorId}_{criterionId}`)

**Sprint Document**: [SP_031_Validation_Badges_Feature.md](./SPRINTS/SP_031_Validation_Badges_Feature.md)

---

#### Sprint 30: Template Preview Comparison View Simplification (SP_030)
**Date**: January 17, 2026
**Status**: ✅ COMPLETE
**Type**: Component Cloning + UI Simplification
**Duration**: 1 day
**Priority**: HIGH
**Dependencies**: SP_029 (Template Upload), VendorComparisonNew component

**Objective**: Clone VendorComparisonNew component and create simplified read-only version for template preview, removing all modification controls while preserving display and interactive navigation features.

**Key Deliverables**:
- ✅ New component: TemplateComparisonView (cloned from VendorComparisonNew)
  - 1,176 lines → 480 lines (59% reduction)
  - Removed 15 useState hooks → 6 remaining
  - Removed 5 useEffect hooks → 0 remaining
- ✅ Removed all modification controls (add, edit, delete buttons, n8n calls, localStorage)
- ✅ Kept all display features (cell clicks, navigation, accordion, animations)
- ✅ Integrated with TemplatePreviewModal
- ✅ Battlecards section underneath comparison matrix
- ✅ Mobile-first responsive design preserved

**Technical Implementation**:
- Cloned VendorComparisonNew.tsx → TemplateComparisonView.tsx
- Removed edit, add, delete, copy, archive, generate buttons
- Kept cell click handlers, navigation arrows, accordion, vendor cards
- Simplified props to template + comparisonVendors only
- Cleaned up state management (removed editing modes)
- Preserved all animations and responsive layouts

**Results**:
- ✅ Professional template preview experience
- ✅ Consistent with main project workflow
- ✅ No code duplication (reused battle-tested component)
- ✅ Fast implementation (completed in 1 day)
- ✅ No compilation or TypeScript errors
- ✅ Successfully hot-reloaded in dev server

**Sprint Document**: [SP_030_Template_Preview_Comparison_View.md](./SPRINTS/SP_030_Template_Preview_Comparison_View.md)

---

#### Sprint 27: Excel & JSON Export Feature (SP_027)
**Date**: January 14, 2026
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: Feature Implementation - Data Export

**Objective**: Implement comprehensive Excel export with 7 formatted tabs and JSON export for complete project state backup.

**Key Deliverables**:
- Excel Export Service (`excelExportService.ts`, ~1,140 lines)
- 7-tab workbook structure (INDEX, Criteria, Vendors, Evaluation, Matching, Battlecards, Summary)
- Vendor logos (40x40px circular) and scatter plot screenshot (600x400px)
- JSON Export Service (`jsonExportService.ts`, ~230 lines)
- Image processing utilities (logo fetching, circular cropping, compression)
- Screenshot capture utilities (html2canvas integration)
- Progressive export based on project stage
- Incomplete data detection and gray-out styling
- Export buttons in ShareDialog
- File naming: `{ProjectName10}_Clarioo_{YY_MM_DD}.{xlsx|json}`

**Impact**:
- ✅ Professional Excel exports with 7 formatted tabs
- ✅ JSON exports for project state backup
- ✅ Vendor logos and scatter plot screenshots embedded
- ✅ Progressive export shows only completed tabs
- ✅ Foundation for Sprint 29 (Excel template upload)

**Sprint Document**: [SP_027_Excel_JSON_Export_Feature.md](./SPRINTS/SP_027_Excel_JSON_Export_Feature.md)

---

---

#### Sprint 26: Vendor Positioning Scatter Plot (SP_026)
**Date**: January 11-14, 2026
**Status**: ✅ COMPLETE
**Duration**: 3 days
**Type**: Feature Implementation + n8n AI Integration

**Objective**: Add interactive 2x2 scatter plot visualization to Vendor Discovery page positioning vendor logos along two strategic dimensions using AI analysis.

**Key Deliverables**:
- VendorPositioningScatterPlot component with Nivo integration
- AnimatedVendorLogo component with dual animation modes
- n8n AI positioning workflow (production + testing)
- useVendorScatterplot hook with auto-retry and caching
- Positioning utilities (collision detection, coordinate normalization)
- TypeScript types for scatterplot data structures

**Impact**:
- ✅ 12th n8n webhook operational (vendor positioning analysis)
- ✅ Visual vendor differentiation through strategic positioning
- ✅ Enhanced user understanding of vendor landscape
- ✅ Polished, animation-rich user experience
- ✅ Seamless integration with existing vendor discovery workflow

**Sprint Document**: [SP_026_Vendor_Positioning_Scatter_Plot.md](./SPRINTS/SP_026_Vendor_Positioning_Scatter_Plot.md)

---

#### Sprint 25: Comparison Matrix Cell Summaries (SP_025)
**Date**: January 10-11, 2026
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: Enhancement - Comparison Matrix Scannability

**Objective**: Add AI-generated 2-3 word summaries under ✓/⭐ icons in comparison matrix cells to improve scannability without requiring users to click and read full explanations.

**Key Deliverables**:
- n8n summarization workflow (production + testing)
- Type system updates (CellState.summary field)
- Service layer integration (summarizeCriterionRow function)
- Hook integration (automatic trigger after Stage 2)
- Storage integration (persist summaries with Stage 2 results)
- UI updates (display summaries in grey text under icons)

**Impact**:
- ✅ 11th n8n webhook operational (cell summarization)
- ✅ Improved comparison matrix scannability
- ✅ AI-powered smart summary selection (not all cells)
- ✅ Strict 3-word enforcement for visual consistency
- ✅ Low cost enhancement (<$0.01 per row)

**Sprint Document**: [SP_025_Comparison_Matrix_Cell_Summaries.md](./SPRINTS/SP_025_Comparison_Matrix_Cell_Summaries.md)

---

#### Sprint 24: Battlecards 10-Row Expansion (SP_024)
**Date**: January 10-11, 2026
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: Enhancement - Battlecards Feature Expansion

**Objective**: Expand battlecards from 3 mandatory rows to exactly 10 rows (7 mandatory + 3 AI-generated dynamic) for comprehensive vendor comparison.

**Key Deliverables**:
- Expanded MANDATORY_BATTLECARD_CATEGORIES from 3 to 7 items
- Updated DEFAULT_BATTLECARDS_CONFIG (min_rows: 10, max_rows: 10)
- Updated n8n workflow prompts (production + testing)
- New mandatory categories: Ideal For, Pricing Model, Company Stage, Primary Geo
- Removed redundant categories from dynamic pool

**Impact**:
- ✅ Richer vendor comparison data (3.3x more comprehensive)
- ✅ Better alignment with real-world buying decisions
- ✅ Structured information architecture (7 mandatory + 3 dynamic)
- ✅ Backward-compatible cache migration
- ✅ No breaking changes to UI/UX

**Sprint Document**: [SP_024_Battlecards_10_Row_Expansion.md](./SPRINTS/SP_024_Battlecards_10_Row_Expansion.md)

---

#### Sprint 22: Template Carousel Section on Landing Page (SP_022)
**Date**: January 8, 2026
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: Feature Implementation + UX Enhancement

**Objective**: Add template carousel section to landing page showcasing expert-validated project templates with category filtering, allowing users to browse and quick-start projects.

**Key Deliverables**:
1. **TemplateCarouselSection Component** (`src/components/landing/TemplateCarouselSection.tsx`, 350 lines)
   - Embla Carousel integration (consistent with CardCarousel)
   - Category filter showing categories with templates
   - Responsive: 3 cards (desktop) / 1 card (mobile)
   - Manual navigation: arrows + dots, keyboard support
   - Loop enabled, center alignment

2. **Conditional Rendering for Edge Cases**
   - Single card: Centered without carousel
   - Two+ cards: Carousel mode with navigation
   - Consistent card dimensions: `flex-[0_0_100%] md:flex-[0_0_45%] lg:flex-[0_0_35%]`

3. **Three-Card Positioning Workaround**
   - Issue: Embla reInit() mispositions exactly 3 cards
   - Solution: Call scrollNext() after reInit to fix positioning
   - Trade-off: Middle card focused on initialization (user can navigate left)
   - Comment expanded with detailed explanation

4. **Modal Integrations**
   - Click card → CriteriaPreviewModal opens
   - "Use These Criteria" checks email submission
   - Shows EmailCollectionModal if email not collected
   - Creates project after email submission
   - Navigates to CriteriaBuilder with pre-loaded criteria

5. **Section Styling**
   - Title: "What others discover..."
   - Position: Above CardCarousel section
   - Animation: Opacity (1.0/0.5) and scale (1.0/0.95) on card focus
   - Smooth transitions (300ms ease-in-out)

6. **Code Quality Improvements**
   - Removed redundant `setSelectedIndex(0)` call
   - Expanded workaround comment for clarity
   - Simplified useMemo dependency (templates static)

**Technical Implementation**:
- **Carousel Config**: `loop: true`, `align: 'center'`, `containScroll: false` (enables 2-card navigation)
- **State Management**: Category selection, filtered templates, carousel index, modal states
- **Integration**: templateService.ts, CriteriaPreviewModal, EmailCollectionModal, CategoryFilter, TemplateCard
- **Edge Case Handling**: Single card centering, 2-card navigation fix, 3-card positioning workaround

**Impact**:
- ✅ Template carousel section operational on landing page
- ✅ Category filtering working correctly
- ✅ Carousel navigation smooth across all scenarios (1-4+ cards)
- ✅ Single card centered properly
- ✅ Two cards navigable with containScroll: false
- ✅ Three cards positioned correctly (middle card focused)
- ✅ Modal integrations seamless
- ✅ Responsive design verified (desktop/tablet/mobile)
- ✅ Code cleanup completed

**Sprint Document**: [SP_022_Template_Carousel_Section.md](./SPRINTS/SP_022_Template_Carousel_Section.md)

---

#### Sprint 21: Project Templates Feature (SP_021)
**Date**: December 11, 2024
**Status**: ✅ COMPLETE
**Duration**: 2 days
**Type**: Feature Implementation + localStorage Integration

**Objective**: Implement project templates feature that allows users to quick-start projects from pre-configured industry templates with ready-made evaluation criteria.

**Key Deliverables**:
1. **Template Data Structure** (`src/data/templates/templates.json`)
   - 1 template with 21 pre-configured criteria
   - Excel-to-JSON conversion script (`scripts/convert-template-to-json.js`)
   - TypeScript interfaces (`src/types/template.types.ts`)

2. **Templates Button** (HeroSection integration)
   - Clipboard icon from lucide-react
   - Gradient styling matching Experts button
   - Visible for all users (auth/non-auth)

3. **TemplatesModal Component** (Full viewport modal)
   - Category filtering with "All" default
   - Responsive grid: 3 cols (desktop) / 1 col (mobile)
   - Click outside to close

4. **CategoryFilter Component** (123 lines)
   - 8 categories with color coding
   - "All" mutually exclusive logic
   - Multiple selection support

5. **TemplateCard Component** (133 lines)
   - Colored left border (category-based)
   - Displays: name, metadata, pain points, requirements
   - Hover effects: scale + shadow + glow

6. **CriteriaPreviewModal Component**
   - Read-only accordion view (reuses AccordionSection)
   - Download/Share button (reuses ShareDialog)
   - "Use These Criteria" primary action

7. **Template Service** (`src/services/templateService.ts`)
   - `loadTemplates()` - JSON loader
   - `createProjectFromTemplate()` - Project creation (NO n8n webhook)
   - Direct localStorage save
   - Email collection check
   - Auto-navigation to CriteriaBuilder

8. **Component Reusability Pattern**
   - Added `readOnly` prop to AccordionSection
   - Added `readOnly` prop to CriterionCard
   - Reused ShareDialog for Download/Share

**Technical Implementation**:
- **No n8n Integration**: Templates are pre-configured (skip webhook)
- **localStorage Keys**: `clarioo_projects`, `criteria_{projectId}`, `workflow_{projectId}`
- **Email Check**: Shows EmailCollectionModal if not submitted
- **Navigation**: Direct to CriteriaBuilder with pre-loaded criteria
- **Category Colors**: Centralized in `src/constants/templateCategories.ts`

**Impact**:
- ✅ Templates button on landing page
- ✅ Templates modal with category filtering
- ✅ Template cards in responsive grid
- ✅ Criteria preview in read-only mode
- ✅ Template project creation operational
- ✅ Email collection check integrated
- ✅ CriteriaBuilder loads pre-configured criteria
- ✅ Seamless workflow integration

**Sprint Document**: [SP_021_Project_Templates_Feature.md](./SPRINTS/SP_021_Project_Templates_Feature.md)

---

#### Sprint 17: Email Collection Integration (SP_017)
**Date**: November 25, 2024
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: n8n AI Integration

**Objective**: Implement email collection with Google Sheets integration and device metadata tracking for user engagement analytics.

**Key Deliverables**:
1. **n8n Webhook** (`clarioo-email-collection`, 120s timeout)
   - Google Sheets integration
   - Automatic email deduplication
   - Device metadata tracking

2. **Device Metadata Utility** (`src/utils/deviceMetadata.ts`, 130+ lines)
   - Browser detection (Chrome, Firefox, Safari, Edge, etc.)
   - OS detection (Windows, macOS, iOS, Android, Linux)
   - Device type classification (mobile, tablet, desktop)
   - Screen resolution capture
   - Timezone information

3. **EmailCollectionModal Component** (`src/components/email/EmailCollectionModal.tsx`, 180+ lines)
   - Blocking modal (ESC/click-outside closable)
   - Email validation with frontend regex
   - Trophy + Sparkles success animation (Lucide React, 1 second)
   - Mobile-responsive (350px min width)
   - Gradient purple/indigo styling

4. **n8nService Email Functions** (Lines 1703-1886)
   - `collectEmail()` - Submit with metadata
   - `hasSubmittedEmail()` - Check status
   - `needsEmailRetry()` - Retry determination
   - `retryEmailCollection()` - Silent background retry
   - Storage helpers for email data

5. **Silent Retry Logic**
   - VendorDiscovery checks for failed submissions on mount
   - Automatic retry during step navigation
   - No blocking UI (transparent to user)
   - localStorage flags prevent duplicates

**Technical Implementation**:
- **Timeout**: 120 seconds
- **Storage Keys**: `clarioo_email` with `email_submitted` and `email_passed_to_n8n` flags
- **Animation**: Lucide React icons (Trophy + Sparkles)
- **Integration**: LandingPage after "Create with AI" button
- **Graceful Degradation**: Doesn't block workflow on failure

**Impact**:
- ✅ Email collection operational
- ✅ Device analytics for optimization
- ✅ Google Sheets integration working
- ✅ Silent retry mechanism prevents data loss

**Sprint Document**: [SP_017_Email_Collection_Integration.md](./SPRINTS/SP_017_Email_Collection_Integration.md)

---

#### Sprint 16: n8n AI Project Creation Integration (SP_016)
**Date**: November 23, 2024
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: n8n AI Integration

**Objective**: Replace mock AI service with real n8n workflow for AI-powered project creation and criteria generation.

**Key Deliverables**:
1. **n8n Webhook** (`clarioo-project-creation`, 120s timeout)
   - Accepts: company_context + solution_requirements
   - Returns: TransformedProject + TransformedCriterion[]
   - AI Model: GPT-4o-mini (temperature 0.3, max tokens 6000)
   - **ACTUAL TIMEOUT**: 120 seconds (not 45s)

2. **n8n Types** (`src/types/n8n.types.ts`)
   - N8nProjectCreationRequest/Response interfaces
   - TransformedProject and TransformedCriterion types
   - Field mapping: n8n `description` → app `explanation`

3. **n8nService Core** (`src/services/n8nService.ts`, Lines 91-266)
   - `getUserId()` / `getSessionId()` - User tracking
   - `createProjectWithAI()` - Project + criteria generation
   - `saveProjectToStorage()` - localStorage persistence
   - `saveCriteriaToStorage()` - Criteria persistence
   - Data transformation functions

4. **useProjectCreation Hook** (`src/hooks/useProjectCreation.ts`, 96 lines)
   - Wraps n8n API call with loading/error states
   - Auto-saves to localStorage on success
   - Returns: `{ createProject, isCreating, error, clearError }`

5. **Updated Components**:
   - **AnimatedInputs.tsx**: "Create with AI" button with spinner, 10+ char validation
   - **LandingPage.tsx**: useProjectCreation integration, success toast with criteria count
   - **VendorDiscovery.tsx**: Loads n8n-generated criteria on mount

**Technical Implementation**:
- **Endpoint**: `POST /webhook/clarioo-project-creation`
- **Timeout**: 120 seconds with AbortController
- **Storage**: `clarioo_projects` and `criteria_{projectId}` in localStorage
- **Criteria Count**: 10-15 per project
- **Distribution**: Balanced importance (high/medium/low) and types (feature/technical/business/compliance)

**Impact**:
- ✅ Real AI-generated project names and descriptions
- ✅ Intelligent context-aware criteria
- ✅ Proper importance and type distribution
- ✅ Seamless workflow integration
- ✅ localStorage persistence across sessions

**Sprint Document**: [SP_016_N8N_Project_Creation_Integration.md](./SPRINTS/SP_016_N8N_Project_Creation_Integration.md)

---

#### Sprint 18: n8n Vendor Selection Integration (SP_018)
**Date**: November 26-27, 2024
**Status**: ✅ COMPLETE
**Duration**: 2 days
**Type**: n8n AI Integration + Progressive Comparison

**Objective**: Implement Perplexity-powered vendor discovery and two-stage progressive comparison system.

**Key Deliverables**:
1. **n8n Webhook** (`clarioo-find-vendors`, 180s timeout)
   - Perplexity-powered vendor discovery
   - Accepts: criteria array (filters feature-type or uses all)
   - Returns: DiscoveredVendor[] with criteriaScores
   - 3-minute timeout for comprehensive search

2. **Stage 1: Individual Research** (`compare-vendor-criterion`, 45s timeout)
   - Function: `compareVendorCriterion()` (Lines 795-908)
   - Per vendor-criterion research with evidence gathering
   - Returns: Stage1Result with evidence_strength, evidence_url, research_notes
   - Fast individual assessment (45 seconds)

3. **Stage 2: Comparative Ranking** (`rank-criterion-results`, 90s timeout)
   - Function: `rankCriterionResults()` (Lines 925-1034)
   - Takes all Stage1Results for a criterion
   - Returns comparative rankings with 1-5 star allocation
   - Ensures differentiation (not all vendors get same stars)
   - Cross-vendor comparison (90 seconds)

4. **useVendorDiscovery Hook**
   - Calls `findVendors()` from n8nService
   - Transforms criteria to n8n format
   - Handles vendor search results

5. **useTwoStageComparison Hook**
   - Orchestrates Stage 1 → Stage 2 flow
   - Manages progressive loading states
   - Accumulates results for UI display
   - Shows Stage 1 immediately, updates with Stage 2 rankings

**Technical Implementation**:
- **Find Vendors Timeout**: 180 seconds (3 minutes)
- **Stage 1 Timeout**: 45 seconds per vendor-criterion pair
- **Stage 2 Timeout**: 90 seconds per criterion (all vendors)
- **Progressive Loading**: UI updates in real-time as results arrive
- **Criteria Filtering**: Feature-type criteria preferred, falls back to all if none

**Impact**:
- ✅ Real Perplexity-powered vendor discovery
- ✅ Evidence-based research with source URLs
- ✅ Comparative star rankings (1-5 stars)
- ✅ Progressive UI updates (Stage 1 → Stage 2)
- ✅ Differentiated vendor assessments

**Sprint Document**: [SP_018_N8N_Vendor_Selection_Integration.md](./SPRINTS/SP_018_N8N_Vendor_Selection_Integration.md)

---

#### Sprint 19: n8n Vendor Comparison Integration (SP_019)
**Date**: November 27, 2024
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: n8n AI Integration + Summaries

**Objective**: Implement vendor comparison, executive summaries, and vendor card summaries via n8n.

**Key Deliverables**:
1. **n8n Webhook** (`clarioo-compare-vendors`, 180s timeout)
   - Single vendor comparison against all criteria
   - Returns: matchPercentage, scores, scoreDetails
   - Comprehensive 3-minute assessment

2. **n8n Webhook** (`clarioo-executive-summary`, 120s timeout)
   - Comprehensive project summary generation
   - Caches result in localStorage
   - Key: `clarioo_executive_summary_{projectId}`

3. **n8n Webhook** (`Vendor-Card-Summary`, 120s timeout)
   - Perplexity-powered vendor card summary
   - Returns: killerFeature, executiveSummary, keyFeatures
   - Cached: `clarioo_vendor_summary_{projectId}_{vendor}`

4. **n8nService Functions**:
   - `compareVendor()` - Lines 561-667
   - `generateExecutiveSummary()` - Lines 1213-1326
   - `generateVendorSummary()` - Lines 1411-1480

5. **Hooks**:
   - `useVendorComparison.ts` - Bulk vendor comparison
   - `useExecutiveSummary.ts` - Executive summary generation

6. **Components**:
   - Updated `VendorCard.tsx` with real Perplexity summaries
   - Updated `ExecutiveSummaryDialog.tsx` with real n8n summaries
   - `VerticalBarChart.tsx` for desktop visualization

**Technical Implementation**:
- **Compare Vendor Timeout**: 180 seconds (3 minutes)
- **Executive Summary Timeout**: 120 seconds (2 minutes)
- **Vendor Summary Timeout**: 120 seconds (2 minutes)
- **Caching Strategy**: localStorage for performance
- **Cache Invalidation**: Manual (no auto-refresh)

**Impact**:
- ✅ Real vendor comparison with match percentages
- ✅ Executive summary generation operational
- ✅ Vendor card summaries with killer features
- ✅ Desktop VerticalBarChart visualization
- ✅ localStorage caching for instant re-display

**Sprint Document**: [SP_019_N8N_Vendor_Comparison_Integration.md](./SPRINTS/SP_019_N8N_Vendor_Comparison_Integration.md)

---

#### Sprint 15: Vendor Comparison Matrix (SP_015)
**Date**: November 16-18, 2024
**Status**: ✅ COMPLETE (UI Layer)
**Duration**: 3 days
**Type**: UI/UX Implementation

**Objective**: Implement mobile-first vendor comparison interface with desktop visualization.

**Key Deliverables**:
1. **VendorComparison Component** (`src/components/VendorComparison.tsx`)
   - Mobile-optimized comparison interface
   - Responsive breakpoints (mobile, tablet, desktop)
   - Integration with comparison hooks

2. **Desktop Visualization** (`src/components/vendor-comparison/VerticalBarChart.tsx`)
   - Actual desktop comparison chart
   - Visual criterion-by-criterion comparison
   - Color-coded match indicators
   - **NOTE**: Wave chart architecture was planning only, not implemented

3. **Navigation Components**:
   - `DesktopColumnHeader.tsx` - Column headers with vendor info
   - `VendorCard.tsx` - Vendor display cards
   - Navigation controls for mobile swiping

4. **ExecutiveSummaryDialog Component**
   - Modal for displaying executive summary
   - Later integrated with n8n summary generation (SP_019)

**Technical Implementation**:
- Mobile-first responsive design
- Swipe gestures for mobile navigation
- Independent vendor navigation states
- Smooth framer-motion animations

**Impact**:
- ✅ Responsive comparison interface
- ✅ Desktop VerticalBarChart visualization
- ✅ Mobile swipe navigation
- ✅ Foundation for n8n integration (SP_019)

**Sprint Document**: [SP_015_Vendor_Comparison_Matrix.md](./SPRINTS/SP_015_Vendor_Comparison_Matrix.md)

---

#### Sprint 14: Criteria Swipe Importance (SP_014)
**Date**: November 15, 2024
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: UX Enhancement

**Objective**: Implement swipe-to-adjust importance gestures and ShareDialog for collaboration.

**Key Deliverables**:
1. **Swipe Gesture System**:
   - Swipe right: Increase importance (Low → Medium → High)
   - Swipe left: Decrease importance (High → Medium → Low → Archive)
   - Visual feedback: Pink (increase), orange (decrease), grey (archive)
   - Text overlays during swipe
   - Hybrid threshold: 40-50% swipe + velocity-based 25-30%

2. **ShareDialog Component** (`src/components/shared/ShareDialog.tsx`)
   - Share button → Download Excel or Copy Link
   - Excel export with auto-sized columns (xlsx library)
   - Share-by-link with copy-to-clipboard
   - Toast notifications for user feedback

3. **Automatic Reordering**:
   - Criteria automatically reorder by importance after swipe
   - High → Medium → Low ordering maintained
   - Smooth animations

**Technical Implementation**:
- Touch and mouse gesture support
- Velocity-based thresholds for natural feel
- Excel export using `xlsx` library
- localStorage persistence of reordered criteria

**Impact**:
- ✅ Intuitive swipe gestures (touch + mouse)
- ✅ Visual feedback during interaction
- ✅ Automatic reordering functional
- ✅ ShareDialog with Excel export working

**Sprint Document**: [SP_014_Criteria_Swipe_Importance.md](./SPRINTS/SP_014_Criteria_Swipe_Importance.md)

---

#### Sprint 13: Component Reusability & Code Deduplication (SP_013)
**Date**: November 11, 2024
**Status**: ✅ COMPLETE
**Duration**: 5-7 days
**Type**: Code Quality - Component Architecture Improvement

**Objective**: Extract duplicate code into reusable shared components and consolidate chat architecture.

**Key Deliverables**:
1. **Shared Components** (`/src/components/shared/`)
   - LoadingState component (5 usages consolidated)
   - EmptyState component (3 usages consolidated)
   - StatsCard component (4 usages consolidated)
   - AddVendorForm component (2 identical implementations merged)

2. **Chat Architecture** (`/src/components/shared/chat/`)
   - Base chat components (ChatInterface, ChatMessage, ChatInput, TypingIndicator)
   - useChat base hook
   - useCriterionChat specialized hook
   - Connected CriterionEditSidebar chat to AI service

3. **Form Standardization**
   - FormDialog component
   - FormFieldGroup component
   - Validation pattern standardization

**Impact**:
- ✅ Eliminated 100% code duplication in vendor forms
- ✅ Consolidated 5 loading state implementations
- ✅ Single source of truth for common UI patterns
- ✅ Reduced bundle size
- ✅ Improved maintainability

**Sprint Document**: [SP_013_Component_Reusability_Code_Deduplication.md](./SPRINTS/SP_013_Component_Reusability_Code_Deduplication.md)

---

#### Sprint 12: Criteria Builder Accordion (SP_012)
**Date**: November 14, 2024
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: UX Enhancement

**Objective**: Redesign CriteriaBuilder with accordion layout and visual importance indicators.

**Key Deliverables**:
1. **Accordion Layout**:
   - Criteria grouped by type (Feature, Technical, Business, Compliance, Other)
   - Collapsible sections for organization
   - Visual hierarchy for key vs secondary criteria

2. **SignalAntenna Component** (`src/components/vendor-discovery/SignalAntenna.tsx`)
   - 1-3 bars indicating importance (low/medium/high)
   - Color-coded: grey (low), yellow (medium), orange (high)
   - 60% opacity for subtle appearance

3. **CriterionEditSidebar** (`src/components/vendor-discovery/CriterionEditSidebar.tsx`)
   - Slides in from right edge (framer-motion)
   - Edit criterion name, explanation, importance, type
   - Chat interface for AI refinement (later integrated with n8n in SP_016)
   - Save/cancel actions

4. **Additional Components**:
   - `CriteriaCard.tsx` - Individual criterion card
   - `AccordionSection.tsx` - Collapsible section wrapper

**Technical Implementation**:
- Shadcn/ui Accordion components
- Framer Motion slide-in animations
- Integration point for n8n criteria chat (SP_016)

**Impact**:
- ✅ Accordion layout operational
- ✅ SignalAntenna importance indicators
- ✅ CriterionEditSidebar with AI chat foundation
- ✅ Collapsible secondary criteria

**Sprint Document**: [SP_012_Criteria_Builder_Accordion.md](./SPRINTS/SP_012_Criteria_Builder_Accordion.md)

---

#### Sprint 11: Registration-Free Landing Experience (SP_011)
**Date**: November 13, 2024
**Status**: ✅ COMPLETE
**Duration**: 1 day
**Type**: UX Enhancement

**Objective**: Remove registration barriers and enable immediate project creation.

**Key Deliverables**:
1. **View Toggle System** (Part of F-030)
   - Two-state: 'landing' (marketing) vs 'projects' (workflow)
   - Toggle button: "View Projects →" / "← Back to Home"
   - Smooth framer-motion transitions
   - No authentication requirement

2. **CategoryDropdown Component** (`src/components/landing/CategoryDropdown.tsx`, 120 lines)
   - Dropdown with 15+ software categories
   - Categories: CRM, Marketing Automation, HR, Project Management, Data Analytics, E-commerce, Accounting, Customer Support, Sales, Legal, IT Management, Communication, Security, Collaboration, DevOps
   - Click category → confirmation dialog → project created
   - Mobile-responsive design

3. **ExamplesBulletPopover Component** (`src/components/landing/ExamplesBulletPopover.tsx`, 110 lines)
   - Question mark icon with 4 example projects
   - Examples:
     - Mid-size Retailer (POS System)
     - SaaS Startup (CRM Platform)
     - Enterprise Company (Analytics Tool)
     - Nonprofit Organization (Donor Management)
   - Click example → confirmation dialog → project created

4. **Project Deletion**:
   - "Delete Project" button in Edit Project dialog
   - Two-step confirmation prevents accidents
   - Success toast notification
   - Immediate removal from Projects view

5. **Visual Consistency**:
   - Unified typography across components
   - Standardized icon sizes (16px, 20px)
   - Consistent button styling (gradients, hover states)
   - Label styling: text-lg font-semibold text-gray-800 mb-3

**Technical Implementation**:
- View state managed at LandingPage level
- ProjectConfirmationDialog shared component
- localStorage persistence for projects
- Consistent color scheme (purple gradients)

**Impact**:
- ✅ View toggle functional (no page reloads)
- ✅ CategoryDropdown with 15+ categories
- ✅ ExamplesBulletPopover with 4 examples
- ✅ Project deletion with safety confirmations
- ✅ Visual consistency across all components

**Sprint Document**: [SP_011_Registration_Free_Landing_Experience.md](./SPRINTS/SP_011_Registration_Free_Landing_Experience.md)

---

#### Sprint 7: Visual Design Enhancement (SP_007)
**Date**: November 12-13, 2024
**Status**: ✅ COMPLETE (Phase 1 with Refinements)
**Duration**: 2 days
**Type**: UI/UX Foundation

**Objective**: Implement Clearbit-inspired gradient design system with landing page animations.

**Key Deliverables**:
1. **HeroSection Component** (`src/components/landing/HeroSection.tsx`)
   - Gradient headline: "Supercharge your software vendor's selection with AI assistant"
   - Responsive typography: 36px mobile → 56px desktop
   - Framer Motion fade-in (600ms)
   - Unified subtitle styling (Nov 13 refinement)

2. **RegistrationToggle Component** (`src/components/landing/RegistrationToggle.tsx`)
   - Sign In/Sign Up toggle buttons
   - Gradient: #6366F1 → #8B5CF6 (brand purple)
   - Button glow shadow (4px blur)
   - Pulsating outline when Off (Nov 13 refinement)
   - Mobile-friendly: 140px min-width, 48px height

3. **AnimatedInputs Component** (`src/components/landing/AnimatedInputs.tsx`)
   - Two side-by-side inputs (desktop) / stacked (mobile)
   - Hypnotic inactive animations:
     - Pulse-glow: 2s cycle, 20px → 40px shadow
     - Float: 3s cycle, 0 → -8px vertical
     - Shimmer: 4s cycle, gradient border sweep
   - "Register to unlock" overlay with lock icon
   - Post-auth: smooth unlock (500ms), auto-focus
   - Value proposition badges (Nov 13 refinement)

4. **ArtifactVisualization Component** (`src/components/landing/ArtifactVisualization.tsx`)
   - Three rotating workflow examples (4s intervals)
   - Visual flow: Input → AI Processing (animated brain) → Output
   - Animated brain: 360° rotation (2s continuous)
   - Pulsing glow on processing card (2s cycle)
   - Click-to-navigate indicators

5. **CardCarousel Component** (`src/components/landing/CardCarousel.tsx`)
   - Embla Carousel with 5 workflow step cards
   - Desktop: 3 cards visible (center scaled 1.05x, sides 0.7 opacity)
   - Mobile: 1 card visible, swipe gestures
   - Auto-play: 4s intervals with pause/play control
   - Keyboard navigation: ArrowLeft/ArrowRight

6. **Design System** (Tailwind Configuration)
   - Brand colors: purple #6366F1, purpleLight #8B5CF6
   - Neutral: warmBlack #1A1A1A, warmGray #4B5563
   - Gradients: gradient-button (purple), gradient-hero-bg (soft peach)
   - Shadows: elevated-combined (multi-layer), button-glow (purple)
   - Border radius: xl = 20px
   - Animations: pulse-glow, float, shimmer keyframes

7. **Routing Architecture**:
   - `/` - Public LandingPage
   - `/dashboard` - Protected dashboard
   - `/auth` - Direct auth access

**Technical Implementation**:
- Framer Motion 11.11.17
- Embla Carousel React 8.3.1
- CSS-based 60fps animations
- Mobile-first breakpoints (md: 768px)
- GitHub Pages: https://pangeafate.github.io/Clarioo-Visuals/

**Impact**:
- ✅ Clearbit-inspired design system
- ✅ Landing page with gradient hero
- ✅ Animated inactive inputs with hypnotic effects
- ✅ Card carousel with workflow steps
- ✅ Mobile-responsive design
- ✅ Deployed to GitHub Pages (Nov 13)

**Sprint Document**: [SP_007_Visual_Design_Enhancement_Mobile_First_UI_UX.md](./SPRINTS/SP_007_Visual_Design_Enhancement_Mobile_First_UI_UX.md)

---

### Phase 0: Visual Prototype Foundation (SP_006-SP_010)

**Period**: October-November 2024
**Status**: ✅ COMPLETE
**Purpose**: MVP → Visual Prototype conversion and foundational architecture

These sprints established the UI/UX and component architecture:

- **SP_006**: MVP to Visual Prototype Conversion
- **SP_008**: Service Layer and Type System Refactoring
- **SP_009**: Critical UX Gaps Foundation Fixes
- **SP_010**: Unified Landing Workflow

**Impact**: Foundation complete for Phase 1 n8n integration

---

## 📋 PLANNED SPRINTS

### Sprint 23: Vendor Battlecards (SP_023)
**Status**: ✅ COMPLETE
**Type**: Feature Implementation + n8n AI Integration
**Completed**: January 10, 2026

**Objective**: Add AI-generated Vendor Battlecards matrix providing high-level, real-world comparison categories beyond user-defined criteria.

**Key Deliverables**:
- Standalone battlecards module below comparison matrix
- Row-by-row AI generation (initially 3 mandatory categories)
- Progressive loading with real-time UI updates
- localStorage caching and regeneration controls
- New hook: `useBattlecardsGeneration.ts`
- New folder: `src/components/vendor-battlecards/`
- n8n webhook: `clarioo-battlecard-row` (90s timeout)

**Sprint Document**: [SP_023_Vendor_Battlecards.md](./SPRINTS/SP_023_Vendor_Battlecards.md)

---

### Sprint 20: Criteria Creation Animation (SP_020)
**Status**: 📋 PLANNED
**Type**: UX Enhancement
**Estimated Duration**: 0.5 days

**Objective**: Add delightful animation when criteria are generated from n8n to improve perceived performance.

**Planned Features**:
- Animated criteria cards appearing one-by-one
- Loading skeleton during n8n API call (120s)
- Smooth fade-in with stagger effect (100ms between cards)
- Celebration animation when complete
- Progress indicator for long-running operations

**Technical Approach**:
- Framer Motion for staggered animations
- Loading skeleton during `createProjectWithAI()` call
- Progressive reveal as criteria arrive
- Confetti or sparkle effect on completion

**Expected Impact**:
- Improved perceived performance during 2-minute wait
- Delightful user experience
- Clear feedback on AI generation progress

**Sprint Document**: [SP_020_Criteria_Creation_Animation.md](./SPRINTS/SP_020_Criteria_Creation_Animation.md)

---

## 🎯 Current Implementation Status

### Real n8n AI Integrations (12 Active Webhooks)

| Webhook | Function | Timeout | Status | Sprint |
|---------|----------|---------|--------|--------|
| `clarioo-project-creation` | Project + criteria generation | 120s | ✅ ACTIVE | SP_016 |
| `clarioo-criteria-chat` | Chat-based criteria refinement | 120s | ✅ ACTIVE | SP_016 |
| `clarioo-find-vendors` | Vendor discovery (Perplexity) | 180s | ✅ ACTIVE | SP_018 |
| `clarioo-compare-vendors` | Single vendor comparison | 180s | ✅ ACTIVE | SP_019 |
| `compare-vendor-criterion` | Stage 1: Individual research | 45s | ✅ ACTIVE | SP_018 |
| `rank-criterion-results` | Stage 2: Comparative ranking | 90s | ✅ ACTIVE | SP_018 |
| `clarioo-executive-summary` | Executive summary generation | 120s | ✅ ACTIVE | SP_019 |
| `Vendor-Card-Summary` | Vendor card summary (Perplexity) | 120s | ✅ ACTIVE | SP_019 |
| `clarioo-email-collection` | Email to Google Sheets | 120s | ✅ ACTIVE | SP_017 |
| `clarioo-battlecard-row` | Battlecard row generation (10 rows) | 90s | ✅ ACTIVE | SP_023/SP_024 |
| `summarize-criterion-row` | Comparison matrix cell summaries | 60s | ✅ ACTIVE | SP_025 |
| `clarioo-vendor-scatterplot` | Vendor positioning scatter plot | 60s | ✅ ACTIVE | SP_026 |

**AI Model**: GPT-4o-mini (temperature: 0.3, max tokens: 6000)
**Webhook Modes**: Production & Testing (user-switchable)

---

### Data Persistence Architecture

**Storage**: localStorage (no backend database)
**Scope**: All data persists across browser sessions

| Data Type | Storage Key | Source | Sprint |
|-----------|-------------|--------|--------|
| Projects | `clarioo_projects` | n8n-generated | SP_016 |
| Criteria | `criteria_{projectId}` | n8n-generated | SP_016 |
| Executive Summaries | `clarioo_executive_summary_{projectId}` | n8n-cached | SP_019 |
| Vendor Summaries | `clarioo_vendor_summary_{projectId}_{vendor}` | n8n-cached | SP_019 |
| Email Status | `clarioo_email` | User-submitted | SP_017 |
| User ID | `clarioo_user_id` | Auto-generated UUID | SP_016 |
| Session ID | `clarioo_session_id` | Auto-generated UUID (session) | SP_016 |
| Chat History | Project-specific keys | User chat | SP_016 |
| Custom Types | `custom_criterion_types` | User-defined | Pre-Phase 1 |
| Webhook Mode | `clarioo_webhook_mode` | User preference | SP_016 |

---

## 📊 Project Statistics

### Development Metrics
- **Total Sprints**: 17 complete (Phase 0: 10, Phase 1: 7)
- **Phase 0 Duration**: 3 weeks (October-November 2024)
- **Phase 1 Duration**: 2 weeks (November 23 - December 3, 2024)
- **n8n Webhooks**: 9 active endpoints
- **Core Service**: 1,887 lines (n8nService.ts)

### Codebase Statistics
- **React Components**: 50+ components
- **Custom Hooks**: 15+ hooks (6 with real n8n integration)
- **Pages**: 7 page-level components
- **localStorage Keys**: 10+ for persistence
- **Mock Services**: 3 (auth, deprecated project/AI - not used in production)

### Integration Coverage
- **Real AI Workflows**: 9/9 webhooks (100%)
- **Data Persistence**: localStorage (100% of critical data)
- **Production Ready**: Core workflow fully operational

### Performance Metrics
- **Average Timeout**: 120 seconds (standard operations)
- **Max Timeout**: 180 seconds (vendor operations)
- **Min Timeout**: 45 seconds (Stage 1 research)
- **Progressive Updates**: Stage 1 → Stage 2 (real-time UI updates)

---

## 🚀 Future Roadmap

### Phase 2: Production Enhancement (Q1 2025)
**Status**: 📋 PLANNED
**Focus**: Error handling, monitoring, optimization

**Planned Enhancements**:
- [ ] Error boundary implementation
- [ ] Comprehensive error logging
- [ ] Performance monitoring
- [ ] Rate limiting for n8n webhooks
- [ ] Backup/retry strategies for critical operations
- [ ] Real authentication (replace mock authService)
- [ ] Actual sharing functionality (not just UI)
- [ ] Email verification workflow
- [ ] Multi-user collaboration features

### Phase 3: Scale & Polish (Q2 2025)
**Status**: 📋 PLANNED
**Focus**: Advanced features, analytics, optimization

**Planned Features**:
- [ ] Advanced vendor comparison algorithms
- [ ] Custom criteria templates
- [ ] Team collaboration features
- [ ] Vendor profile system
- [ ] Advanced analytics dashboard
- [ ] Export to multiple formats (PDF, Excel, CSV)
- [ ] Email notification system
- [ ] Admin dashboard

---

## 📝 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 4.4.0 | Jan 14, 2026 | System | SP_026 complete - Vendor Positioning Scatter Plot with AI-powered strategic positioning analysis. Interactive 2x2 scatter plot, animated vendor logos, collision detection, selection sync. 12th n8n webhook operational. 6 new files created. |
| 4.3.0 | Jan 11, 2026 | System | SP_025 complete - Comparison Matrix Cell Summaries. AI-generated 2-3 word summaries under icons, automatic trigger after Stage 2, smart selection logic. 11th n8n webhook operational. Enhanced comparison matrix scannability. |
| 4.2.0 | Jan 11, 2026 | System | SP_024 complete - Battlecards 10-Row Expansion. Expanded from 3 to 7 mandatory categories + 3 dynamic (10 total). New categories: Ideal For, Pricing Model, Company Stage, Primary Geo. Richer vendor comparison data with backward-compatible cache migration. |
| 4.1.0 | Jan 8, 2026 | System | SP_022 complete - Template Carousel Section on Landing Page with category filtering, responsive carousel (3 cards desktop/1 mobile), edge case handling (1-3 cards), and modal integrations |
| 4.0.0 | Dec 11, 2024 | System | SP_021 complete - Project Templates Feature with read-only component reusability pattern and localStorage integration |
| 3.9.0 | Dec 3, 2024 | System | Complete rewrite based on actual implementation. Module-by-module verification. Corrected all sprints with actual deliverables, timeouts, and results. |
| 3.8.0 | Dec 2, 2024 | System | Documentation aligned with codebase reality - Phase 0/1 clarification, localStorage persistence confirmed, 6 n8n webhooks active |
| 3.7.0 | Nov 27, 2024 | System | SP_018 & SP_019 complete - Vendor selection and comparison n8n integration |
| 3.6.0 | Nov 25, 2024 | System | SP_017 complete - Email collection integration |
| 3.5.0 | Nov 23, 2024 | System | SP_016 complete - n8n project creation integration |
| 3.4.0 | Nov 18, 2024 | System | SP_015 complete - Vendor comparison matrix |
| 3.3.0 | Nov 15, 2024 | System | SP_014 complete - Criteria swipe importance |
| 3.2.0 | Nov 14, 2024 | System | SP_011-SP_013 complete - Registration-free, accordion, deduplication |
| 3.1.0 | Nov 13, 2024 | System | SP_007 refinements complete |
| 3.0.0 | Nov 12, 2024 | System | SP_007 complete - Visual design enhancement |
| 2.0.0 | Nov 12, 2024 | System | Phase 0 foundation complete (SP_006-SP_010) |
| 1.0.0 | Oct 2024 | System | Initial MVP feature planning |

---

**Document Owner**: Engineering Team
**Last Comprehensive Review**: January 14, 2026
**Next Review**: Upon completion of next sprint

---

*This document reflects the actual implementation status based on comprehensive codebase analysis completed December 3, 2024. All webhook endpoints, timeouts, storage keys, and sprint deliverables have been verified against the source code.*
