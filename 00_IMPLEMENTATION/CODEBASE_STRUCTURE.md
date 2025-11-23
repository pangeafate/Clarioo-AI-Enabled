# Codebase Structure

Version: 1.0.0
Last Updated: 2025-11-15
Status: Visual Prototype (Phase 0)

## Overview

This document provides a comprehensive overview of the Clarioo codebase organization during the Visual Prototype phase. The structure follows a modular, feature-based organization optimized for React + TypeScript development with clear separation of concerns.

## Directory Structure

```
/
├── src/                           # Source code
│   ├── components/                # React components
│   │   ├── ui/                   # shadcn/ui components (52 components)
│   │   ├── landing/              # Landing page components
│   │   ├── vendor-discovery/     # Vendor discovery workflow components
│   │   └── projects/             # Project management components
│   ├── pages/                    # Page-level components
│   ├── services/                 # Service layer
│   │   └── mock/                 # Mock service implementations
│   ├── data/                     # Static data and JSON files
│   │   ├── api/                  # Dummy API response data
│   │   └── templates/            # Email and document templates
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── lib/                      # Third-party library configurations
│   └── styles/                   # Style configuration files
├── 00_PLAN/                      # Strategic planning documents
├── 00_IMPLEMENTATION/            # Implementation guidelines and sprints
│   └── SPRINTS/                  # Sprint documentation
└── public/                       # Static assets
```

## Layer Organization

### 1. Components Layer (`/src/components/`)

**Purpose**: Reusable UI components following atomic design principles

**Structure**:
- **`/ui/`** - 52 shadcn/ui primitive components (buttons, inputs, dialogs, etc.)
- **`/landing/`** - Landing page specific components
  - `AuthModal.tsx` - Authentication modal
  - `CategoryDropdown.tsx` - Project category selector
  - `RegistrationToggle.tsx` - Sign up/Sign in toggle
  - `ExamplesBulletPopover.tsx` - Example projects popover
  - `ProjectConfirmationDialog.tsx` - Project creation confirmation
  - `ViewToggleButton.tsx` - View mode toggle
- **`/vendor-discovery/`** - 5-step vendor discovery workflow components
  - `AccordionSection.tsx` - Collapsible criteria sections
  - `CategorySelector.tsx` - Category selection interface
  - `CriteriaAccordion.tsx` - Criteria hierarchy display
  - `CriteriaCard.tsx` - Individual criterion card
  - `CriterionEditSidebar.tsx` - Criterion editing interface
  - `ExecutiveSummary.tsx` - AI-generated summary display
  - `SignalAntenna.tsx` - Visual signal strength indicator
- **`/projects/`** - Project management components
  - `NewProjectDialog.tsx` - New project creation dialog
  - `ProjectCard.tsx` - Project card display

**File Naming Convention**: PascalCase for component files (`ComponentName.tsx`)

### 2. Pages Layer (`/src/pages/`)

**Purpose**: Top-level route components

**Key Files**:
- `Index.tsx` - Landing page (main entry point)
- `Auth.tsx` - Authentication page
- `TechInput.tsx` - Technology input step
- `CriteriaBuilder.tsx` - Criteria building step
- `VendorSelection.tsx` - Vendor selection step
- `Comparison.tsx` - Vendor comparison step
- `SendInvitation.tsx` - Invitation sending step
- `NotFound.tsx` - 404 error page

**Workflow**: Index → TechInput → CriteriaBuilder → VendorSelection → Comparison → SendInvitation

### 3. Services Layer (`/src/services/`)

**Purpose**: Business logic and data access abstraction

**Structure**:
- **`/mock/`** - Mock service implementations for visual prototype
  - `authService.ts` - Mock authentication (login, signup, logout)
  - `projectService.ts` - Mock project CRUD operations
  - `aiService.ts` - Mock AI analysis and criteria generation
  - `dataService.ts` - Mock data fetching utilities
- `storageService.ts` - Browser localStorage wrapper

**Mock Service Pattern**:
- All services return Promises with simulated 300-800ms delays
- No real API calls or backend connections
- Data sourced from `/src/data/api/*.json` files

### 4. Data Layer (`/src/data/`)

**Purpose**: Static data, dummy API responses, and configuration

**Structure**:
- **`/api/`** - Dummy API response JSON files
  - `auth.json` - Mock user data
  - `projects.json` - Mock project data
  - `vendors.json` - Mock vendor database
  - `criteria.json` - Mock evaluation criteria
  - `aiSummaries.json` - Mock AI-generated summaries
  - `techInput.json` - Mock technology input data
- **`/templates/`** - Document templates
  - `email-templates.json` - Email invitation templates
- `categories.ts` - Project category definitions
- `projectExamples.ts` - Example project data

**Data Format**: All files use JSON format mimicking future REST API responses

### 5. Hooks Layer (`/src/hooks/`)

**Purpose**: Reusable React hooks for state management and side effects

**Key Hooks**:
- `useAuth.tsx` - Authentication state management
- `useVendorDiscovery.ts` - Vendor discovery workflow state
- `useVendorComparison.ts` - Vendor comparison logic
- `useCriteriaGeneration.ts` - AI criteria generation
- `useCriteriaChat.ts` - Criteria refinement chat
- `useExecutiveSummary.ts` - Executive summary generation
- `use-mobile.tsx` - Mobile viewport detection
- `use-toast.ts` - Toast notification management

**Hook Naming Convention**: Prefix with `use` in camelCase

### 6. Types Layer (`/src/types/`)

**Purpose**: TypeScript type definitions and interfaces

**Key Files**:
- `index.ts` - Central type exports
- `auth.types.ts` - Authentication types (User, AuthState)
- `project.types.ts` - Project types (Project, ProjectStatus)
- `vendor.types.ts` - Vendor types (Vendor, VendorScore)
- `criteria.types.ts` - Criteria types (Criterion, CriteriaHierarchy)
- `common.types.ts` - Shared utility types

**Type Naming Convention**: PascalCase with `.types.ts` suffix

### 7. Utils Layer (`/src/utils/`)

**Purpose**: Pure utility functions

**Key Files**:
- `mockHelpers.ts` - Mock data generation utilities
- `dataTransformers.ts` - Data transformation functions
- `exportHelpers.ts` - Export/download utilities

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
5. **Test Visually** → Verify in browser (no automated tests in prototype phase)

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
- **GL-RDD.md** - README-Driven Development guidelines
- **PROJECT_ROADMAP.md** - Sprint history and future planning
- **PROGRESS.md** - Detailed sprint deliverables

---

*This document should be updated whenever significant structural changes are made to the codebase.*

*Last Updated: November 23, 2024*
*Phase: Phase 0 - Visual Prototype*
