# Codebase Structure

Version: 4.1.0
Last Updated: January 10, 2026
Status: Phase 1 - n8n AI Integration (SP_022 Complete)

## Overview

This document provides a comprehensive overview of the Clarioo codebase organization. The project transitioned from Phase 0 (Visual Prototype, SP_006-SP_015) to **Phase 1 (n8n AI Integration, SP_016-SP_022 Complete)**. Core workflows now use 10 real n8n webhooks with GPT-4o-mini and Perplexity processing. All project data, criteria, workflow state, and comparison cache persist in localStorage. The structure follows a modular, feature-based organization optimized for React + TypeScript development with clear separation of concerns.

## Directory Structure

```
/
├── src/                           # Source code
│   ├── assets/                   # Static assets (images, animations)
│   ├── components/                # React components
│   │   ├── ui/                   # shadcn/ui components (51 components)
│   │   ├── landing/              # Landing page components
│   │   ├── vendor-discovery/     # Vendor discovery workflow components
│   │   ├── vendor-comparison/    # Vendor comparison components
│   │   ├── vendor-battlecards/   # Vendor battlecard components (SP_023)
│   │   ├── email/                # Email collection components
│   │   ├── templates/            # Template components (SP_021/SP_022)
│   │   └── shared/               # Shared components (chat, forms, etc.)
│   ├── config/                   # Configuration files (webhook URLs, etc.)
│   ├── constants/                # Application constants
│   ├── data/                     # Static data and JSON files
│   │   ├── comparisons/          # Comparison visualization data
│   │   └── templates/            # Email and document templates
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Third-party library configurations
│   ├── pages/                    # Page-level components (Auth, Index, NotFound)
│   ├── services/                 # Service layer
│   │   └── mock/                 # Mock service implementations
│   ├── styles/                   # Style configuration files
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utility functions
├── 00_PLAN/                      # Strategic planning documents
├── 00_IMPLEMENTATION/            # Implementation guidelines and sprints
│   └── SPRINTS/                  # Sprint documentation
└── public/                       # Static assets
```

## Layer Organization

### 1. Components Layer (`/src/components/`)

**Purpose**: Reusable UI components following atomic design principles

**Structure**:
- **`/ui/`** - 49 shadcn/ui primitive components (buttons, inputs, dialogs, etc.)
- **`/landing/`** - Landing page specific components
  - `AnimatedInputs.tsx` - Input fields with animations
  - `ArtifactVisualization.tsx` - Process visualization
  - `CardCarousel.tsx` - Interactive carousel (376 lines)
  - `CategoryDropdown.tsx` - Project category selector
  - `EditProjectDialog.tsx` - Project editing dialog
  - `ExamplesBulletPopover.tsx` - Example projects popover
  - `HeroSection.tsx` - Hero section with gradient
  - `LandingPage.tsx` - Main landing page
  - `ProjectConfirmationDialog.tsx` - Project creation confirmation
  - `RegistrationToggle.tsx` - Sign up/Sign in toggle
- **`/vendor-discovery/`** - Vendor discovery workflow components
  - `AccordionSection.tsx` - Collapsible criteria sections
  - `CategorySelector.tsx` - Category selection interface
  - `CriteriaAccordion.tsx` - Criteria hierarchy display
  - `CriteriaCard.tsx` - Individual criterion card
  - `CriterionEditSidebar.tsx` - Criterion editing interface
  - `ShareDialog.tsx` - Team sharing and export (211 lines)
  - `SignalAntenna.tsx` - Visual signal strength indicator
  - `VendorCard.tsx` - Vendor card display
- **`/vendor-comparison/`** - Vendor comparison components
  - `DesktopColumnHeader.tsx` - Desktop view headers
  - `ExecutiveSummaryDialog.tsx` - Executive summary modal (641 lines)
  - `VendorCard.tsx` - Individual vendor card
  - `VerticalBarChart.tsx` - Comparison visualization with cell states
- **`/email/`** - Email collection components
  - `EmailCollectionModal.tsx` - Email modal with Trophy animation
- **`/shared/`** - Shared components
  - `chat/` - Chat interface components
  - `forms/` - Form components
  - `loading/` - Loading state components

**File Naming Convention**: PascalCase for component files (`ComponentName.tsx`)

### 2. Pages Layer (`/src/pages/`)

**Purpose**: Top-level route components

**Key Files**:
- `Index.tsx` - Main entry point (landing page routing)
- `Auth.tsx` - Authentication page
- `NotFound.tsx` - 404 error page

**Note**: The workflow is now component-based within the landing page, not separate pages. The LandingPage component handles the entire user journey from landing to project creation and workflow navigation.

### 3. Services Layer (`/src/services/`)

**Purpose**: Business logic and data access abstraction

**Structure**:
- `n8nService.ts` - **Real AI** via n8n webhooks (10 active endpoints)
  - **Project Creation** (SP_016): `createProjectWithAI()`, 120s timeout
  - **Criteria Chat** (SP_016): `sendCriteriaChat()`, 120s timeout
  - **Find Vendors** (SP_018): `findVendors()`, 180s timeout
  - **Compare Vendor Criterion** (SP_018): `compareVendorCriterion()`, 45s timeout - Stage 1
  - **Rank Criterion Results** (SP_018): `rankCriterionResults()`, 90s timeout - Stage 2
  - **Compare Vendors** (SP_019): Single vendor comprehensive analysis, 180s timeout
  - **Executive Summary** (SP_019): `generateExecutiveSummary()`, 120s timeout
  - **Vendor Card Summary** (SP_019): Via Perplexity, 120s timeout
  - **Email Collection** (SP_017): `collectEmail()`, 30s timeout to Google Sheets
  - **Battlecard Row** (SP_023): `generateBattlecardRow()`, 60s timeout
  - **Storage Functions**: `saveProjectToStorage()`, `getCriteriaFromStorage()`, localStorage cache management
  - **User/Session IDs**: `getUserId()` (localStorage), `getSessionId()` (sessionStorage)
- `templateService.ts` - Template management (SP_021): `loadTemplates()`, `createProjectFromTemplate()`
- `storageService.ts` - Browser localStorage abstraction layer with type safety
- `comparisonStorage.ts` - Two-stage comparison cache management (Stage 1 & 2)
- **`/mock/`** - Mock service implementations for authentication and fallback
  - `authService.ts` - Mock authentication (login, signup, logout)
  - `projectService.ts` - Mock project CRUD operations
  - `aiService.ts` - Mock AI fallback for development/testing
  - `dataService.ts` - Mock data fetching utilities

**Service Patterns**:
- **Real Services** (`n8nService.ts`, `templateService.ts`): Real HTTP API calls to 10 n8n webhooks, GPT-4o-mini + Perplexity, localStorage persistence
- **Mock Services** (in `/mock/`): Return Promises with 300-800ms delays, data from JSON files

### 4. Data Layer (`/src/data/`)

**Purpose**: Static data, dummy API responses, and configuration

**Structure**:
- **`/comparisons/`** - Comparison visualization data
  - `wave-chart-data.json` - Wave chart comparison data (if present)
- **`/templates/`** - Document templates
  - `email-templates.json` - Email invitation templates
- `categories.ts` - Project category definitions (15+ categories)
- `projectExamples.ts` - Example project data (4 examples)
- `mockAIdata.json` - Large mock AI dataset (48KB) for fallback

**Note**: The `/api/` directory mentioned in earlier documentation does not exist. Mock data is minimal as most functionality uses real n8n webhooks.

**Data Format**: All files use JSON format mimicking future REST API responses

### 5. Hooks Layer (`/src/hooks/`)

**Purpose**: Reusable React hooks for state management and side effects

**Key Hooks**:
- `useProjectCreation.ts` - n8n AI-powered project creation with loading/error states
- `useTwoStageComparison.ts` - Two-stage progressive comparison logic (SP_018)
- `useVendorTransformation.ts` - Vendor data transformation with Perplexity
- `useCriteriaChat.ts` - Criteria refinement chat
- `useCriteriaChat.test.ts` - Tests for criteria chat functionality
- `useCriteriaOrder.ts` - Criteria ordering and sorting logic
- `useExecutiveSummary.ts` - Executive summary generation
- `useWebhookMode.ts` - Webhook mode state management
- `useAuth.tsx` - Authentication state management
- `useChat.ts` - Generic chat interface hook
- `useChat.test.ts` - Tests for chat functionality
- `useSwipeGesture.ts` - Mobile swipe gesture detection
- `use-mobile.tsx` - Mobile viewport detection
- `use-toast.ts` - Toast notification management

**Hook Naming Convention**: Prefix with `use` in camelCase

### 6. Types Layer (`/src/types/`)

**Purpose**: TypeScript type definitions and interfaces

**Key Files**:
- `index.ts` - Central type exports
- `n8n.types.ts` - **n8n API types**
  - Project Creation: N8nProjectCreationRequest/Response, TransformedProject, TransformedCriterion
  - Email Collection: EmailCollectionRequest/Response, EmailCollectionStorage, DeviceMetadata (SP_017)
- `auth.types.ts` - Authentication types (User, AuthState)
- `project.types.ts` - Project types (Project, ProjectStatus)
- `vendor.types.ts` - Vendor types (Vendor, VendorScore)
- `criteria.types.ts` - Criteria types (Criterion, CriteriaHierarchy)
- `common.types.ts` - Shared utility types

**Type Naming Convention**: PascalCase with `.types.ts` suffix

### 7. Utils Layer (`/src/utils/`)

**Purpose**: Pure utility functions

**Key Files**:
- `comparisonStorage.ts` - Two-stage comparison cache management (SP_018)
- `deviceMetadata.ts` - Device metadata collection (browser, OS, device, resolution, timezone) (SP_017)
- `exportHelpers.ts` - Export/download utilities (Excel, PDF)
- `splineInterpolation.ts` - Catmull-Rom spline for wave charts (if present)
- Data transformation and mock helpers

**Function Style**: Pure functions, no side effects

### 8. Lib Layer (`/src/lib/`)

**Purpose**: Third-party library configurations

**Key Files**:
- `utils.ts` - Tailwind CSS class name utilities (`cn` function)

### 9. Styles Layer (`/src/styles/`)

**Purpose**: Global style configurations

**Key Files**:
- `spacing-config.ts` - Spacing system configuration
- `typography-config.ts` - Typography system configuration

## File Naming Conventions

| File Type | Convention | Example |
|-----------|-----------|---------|
| React Components | PascalCase + `.tsx` | `VendorCard.tsx` |
| React Hooks | camelCase + `use` prefix + `.ts` | `useVendorData.ts` |
| Type Definitions | camelCase + `.types.ts` | `vendor.types.ts` |
| Utilities | camelCase + `.ts` | `mockHelpers.ts` |
| Services | camelCase + `Service.ts` | `authService.ts` |
| Data Files | camelCase + `.json` | `vendors.json` |
| Pages | PascalCase + `.tsx` | `CriteriaBuilder.tsx` |

## Module Boundaries

### Layer Dependencies (Top to Bottom)

```
Pages
  ↓
Components → Hooks
  ↓           ↓
Services ← Types
  ↓
Utils ← Data
```

**Rules**:
1. **Pages** may import from: Components, Hooks, Services, Types, Utils
2. **Components** may import from: Hooks, Types, Utils, Data
3. **Hooks** may import from: Services, Types, Utils
4. **Services** may import from: Types, Utils, Data
5. **Utils** should have minimal dependencies (only Types)
6. **Types** should have no dependencies
7. **Data** should have no dependencies

**Anti-Pattern**: Never import Pages into Components (breaks reusability)

## Import Path Standards

**Absolute Imports** (via `tsconfig.json` paths):
```typescript
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import type { Vendor } from '@/types/vendor.types'
```

**Relative Imports** (only within same directory):
```typescript
import { helperFunction } from './helper'
```

## Code Organization Best Practices

### Component Organization

Every component file should follow this structure:
1. Import statements (React, external libraries, internal modules)
2. Type definitions (interfaces, types)
3. Component definition
4. Export statement

### Service Organization

Every service file should:
1. Define mock delay constants
2. Export service object with methods
3. Include JSDoc comments for all public methods
4. Return properly typed Promises

### Data File Organization

Every JSON data file should:
1. Follow consistent structure matching TypeScript types
2. Include realistic dummy data
3. Mimic future API response format

## Development Workflow

### Adding New Features

1. **Define Types** → Create/update types in `/src/types/`
2. **Create Mock Data** → Add dummy data in `/src/data/api/`
3. **Build Service** → Implement mock service in `/src/services/mock/`
4. **Create Components** → Build UI components in `/src/components/`
5. **Build Page** → Assemble page in `/src/pages/`
6. **Add Route** → Update routing in `App.tsx`

### Modifying Existing Features

1. **Locate Feature** → Use this document to find relevant files
2. **Update Types** → Modify TypeScript types if data shape changes
3. **Update Mock Data** → Adjust JSON files to match new types
4. **Update Components** → Modify UI components as needed
5. **Write Tests** → Automated tests required for Phase 1 n8n integration code (hooks, services)
6. **Test Visually** → Verify in browser for UI/UX changes

## Key Architectural Decisions

### Mock Service Layer

**Why**: Enables full UI/UX development without backend dependency

**Pattern**:
```typescript
export const mockService = {
  async getData(): Promise<Data> {
    await simulateDelay(500) // Realistic API delay
    return dummyData
  }
}
```

### Dummy Data JSON Files

**Why**: Centralized data source, easy to modify, mimics future API

**Pattern**: Files in `/src/data/api/` mirror future REST endpoints

### Component Organization

**Why**: Feature-based grouping improves maintainability

**Pattern**:
- `/ui/` = Primitives (reusable everywhere)
- `/landing/` = Landing page specific
- `/vendor-discovery/` = Workflow specific
- `/projects/` = Project management specific

## Future Migration Path

When transitioning from Visual Prototype to Production:

1. **Replace Mock Services** → Real API integration
2. **Remove `/data/api/` files** → Use actual API endpoints
3. **Add Authentication** → Replace mock auth with real OAuth/JWT
4. **Add Database** → Integrate with Supabase or equivalent
5. **Add Tests** → Implement GL-TDD.md framework
6. **Add Error Logging** → Implement GL-ERROR-LOGGING.md framework

See `/00_PLAN/ARCHITECTURE.md` for detailed migration strategy.

## Related Documentation

- **ARCHITECTURE.md** - System architecture and technical design
- **DESIGN_GUIDELINES.md** - Typography, colors, spacing, animations, brand guidelines
- **GL-RDD.md** - README-Driven Development guidelines
- **PROJECT_ROADMAP.md** - Sprint history and future planning
- **PROGRESS.md** - Detailed sprint deliverables

---

*This document should be updated whenever significant structural changes are made to the codebase.*

*Last Updated: January 10, 2026*
*Phase: Phase 1 - n8n AI Integration (SP_022 Complete)*
