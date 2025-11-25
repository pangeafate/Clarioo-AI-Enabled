# Sprint 7: TypeScript Type Consolidation

**Sprint ID**: SP_007
**Sprint Name**: TypeScript Type Consolidation and Centralization
**Duration**: 2 weeks (estimated)
**Status**: 🟡 Ready to Implement
**Priority**: High (Foundation work)

---

## Executive Summary

This sprint consolidates 82 scattered TypeScript type definitions across 20+ files into a centralized `/src/types/` directory structure. The work addresses critical code quality issues: 3 duplicate Project interfaces, 2 duplicate Vendor interfaces, and inconsistent naming patterns (Criteria vs Criterion).

**Scope**: Type definitions only - no business logic changes
**Impact**: Foundation improvement enabling easier refactoring and better IDE support

---

## Problem Statement

### Current State
- **82 type definitions** scattered across `/src/components/`, `/src/services/`, `/src/hooks/`, and `/src/pages/`
- **3 duplicate Project interfaces** with inconsistent status values ('in-progress' vs 'in_progress')
- **2 duplicate Vendor interfaces** with different field names and structures
- **Criteria vs Criterion naming inconsistency** between components and services
- **5+ different import patterns** (component-to-component, service imports, mixed sources)
- **No single source of truth** for domain models

### Impact if Not Fixed
- High risk of type mismatches during refactoring
- Confusion and bugs when passing data between layers
- Difficult to maintain consistency
- Poor IDE autocomplete support
- Increased onboarding friction for new developers

### Success = Consolidation
- ~40-50 unified type definitions in `/src/types/` directory
- 0 duplicate types
- 1 consistent import pattern: `import type { ... } from '@/types'`
- 100% of types in centralized location
- Clear separation of concerns: domain, components, services

---

## Detailed Implementation Plan

### Phase 1: Create Type Directory Structure (No Breaking Changes)
**Objective**: Create all type files with centralized definitions
**Duration**: 4-5 hours
**Risk Level**: Low (additive only)

#### Tasks

1. **Create Directory Structure** (1 hour)
   - Create `/src/types/` directory
   - Create: `index.ts`, `domain.ts`, `components.ts`, `services.ts`, `errors.ts`, `forms.ts`
   - All files start empty or with comments

2. **Define Domain Types** (`domain.ts`) (2 hours)
   - Map from ProjectDashboard.tsx (lines 14-21)
   - Map from VendorDiscovery.tsx (lines 43-50, 24-29, 31-41)
   - Map from projectService.ts (lines 28-38, includes WorkflowState)
   - Map from aiService.ts (lines 19-24, 26-37)
   - Map from authService.ts (lines 17-44)
   - Map from other services
   - Define: User, Project, Vendor, Criterion, VendorComparison, TechRequest, Session, ChatMessage, WorkflowState, WorkflowStepData
   - Consolidate: Use snake_case for status values ('in_progress'), singular 'Criterion', merge Vendor versions with optional fields

3. **Define Component Props** (`components.ts`) (1 hour)
   - Extract from VendorDiscovery.tsx
   - Extract from ProjectDashboard.tsx
   - Extract from VendorTable.tsx
   - Extract from VendorSelection.tsx
   - Extract from VendorInvite.tsx
   - Extract from ExecutiveSummary.tsx
   - Extract from ProtectedRoute.tsx
   - Create VendorWithScores type extending Vendor

4. **Define Service Types** (`services.ts`) (1 hour)
   - Create ServiceResponse<T> generic wrapper
   - Define: AuthResponse, ProjectListResponse, ProjectResponse, CriteriaResponse, VendorResponse, ComparisonResponse, ChatResponse
   - Define: EmailTemplate, EmailVariables, ExportOptions
   - Map from authService.ts, projectService.ts, aiService.ts, dataService.ts

5. **Define Error Types** (`errors.ts`) (30 minutes)
   - Create unified ServiceError interface
   - Replace: AuthError, ProjectError, AIError

6. **Create Central Export** (`index.ts`) (30 minutes)
   - Export * from './domain'
   - Export * from './components'
   - Export * from './services'
   - Export * from './errors'

**Deliverable**: Complete `/src/types/` directory with all type definitions (types NOT removed from original files yet)

---

### Phase 2: Update Imports (Backwards Compatible)
**Objective**: Point all files to centralized types without breaking functionality
**Duration**: 4-5 hours
**Risk Level**: Medium (requires careful testing)
**Critical**: Must follow order to avoid circular dependencies

#### Update Order (Dependencies Matter!)

1. **Update Services Layer** (1 hour)
   - `/src/services/mock/projectService.ts`
     - Add: `import type { Project, WorkflowState } from '@/types'`
     - Remove: local Project interface definition
     - Keep exports (re-export for compatibility)
   
   - `/src/services/mock/authService.ts`
     - Add: `import type { User, Session, ServiceError } from '@/types'`
     - Replace: AuthError with ServiceError
     - Keep exports
   
   - `/src/services/mock/aiService.ts`
     - Add: `import type { Vendor, Criterion, VendorComparison, ChatMessage, ServiceError } from '@/types'`
     - Replace: Criterion with Criterion (singular)
     - Replace: AIError with ServiceError
     - Keep exports
   
   - `/src/services/mock/dataService.ts`
     - Add: `import type { EmailTemplate, EmailVariables, ExportOptions, ServiceError } from '@/types'`
     - Replace: Error types
     - Keep exports

2. **Update Hooks** (30 minutes)
   - `/src/hooks/useAuth.tsx`
     - Change: `import type { User, Session } from '@/services/mock/authService'`
     - To: `import type { User, Session, AuthContextType } from '@/types'`
     - Move: AuthContextType definition to types

3. **Update Components** (2-3 hours)
   - Bottom-up approach (leaf → parent)
   
   - `/src/components/vendor-discovery/VendorTable.tsx`
     - Change: `import type { TechRequest, Criteria, Vendor } from "../VendorDiscovery"`
     - To: `import type { TechRequest, Criterion as Criteria, Vendor, VendorTableProps } from '@/types'`
   
   - `/src/components/vendor-discovery/VendorSelection.tsx`
     - Change: service imports
     - To: `import type { Criterion, Vendor, TechRequest, VendorSelectionProps } from '@/types'`
   
   - `/src/components/vendor-discovery/VendorInvite.tsx`
     - Change: service imports
     - To: `import type { Vendor, Criterion, TechRequest, VendorInviteProps } from '@/types'`
   
   - `/src/components/vendor-discovery/ExecutiveSummary.tsx`
     - Change: service imports
     - To: `import type { VendorComparison, ExecutiveSummaryProps } from '@/types'`
   
   - `/src/components/VendorDiscovery.tsx`
     - Change: locally defined types
     - To: `import type { Project, Vendor, Criterion, TechRequest, VendorDiscoveryProps } from '@/types'`
   
   - `/src/components/ProjectDashboard.tsx`
     - Change: locally defined Project
     - To: `import type { Project, ProjectDashboardProps } from '@/types'`
   
   - `/src/components/ProtectedRoute.tsx`
     - Change: if defining types locally
     - To: `import type { ProtectedRouteProps } from '@/types'`
   
   - Update other components as needed

**Testing After Each Update**:
```bash
npm run build  # Verify TypeScript compilation
npm run lint   # Check for import issues
```

**Deliverable**: All imports updated, application builds successfully

---

### Phase 3: Remove Duplicate Definitions
**Objective**: Delete original type definitions from components and services
**Duration**: 1 hour
**Risk Level**: Low (safe after Phase 2 testing)

#### Files to Clean

1. **Remove from `/src/components/ProjectDashboard.tsx` (lines 14-21)**
   - Delete: local Project interface
   - Keep: imports from '@/types'

2. **Remove from `/src/components/VendorDiscovery.tsx` (lines 24-50)**
   - Delete: Project interface
   - Delete: Criteria interface
   - Delete: Vendor interface
   - Delete: TechRequest interface (if defined there)
   - Keep: imports from '@/types'

3. **Remove from `/src/services/mock/projectService.ts`**
   - Delete: local Project interface
   - Keep: export re-export or typed response

4. **Remove from `/src/services/mock/aiService.ts`**
   - Delete: local Vendor interface
   - Delete: local Criterion interface
   - Delete: local ChatMessage interface
   - Keep: exports

5. **Clean other service files**
   - Remove duplicate error interfaces
   - Keep clean exports

**Verification**:
```bash
grep -r "interface Project\|interface Vendor\|interface Criterion" src/components/ src/services/
# Should return: NO MATCHES (except in types directory)
```

**Deliverable**: All duplicate types removed, only centralized definitions remain

---

### Phase 4: Comprehensive Testing & Verification
**Objective**: Ensure complete correctness and functionality
**Duration**: 2 hours
**Risk Level**: Medium (catches any issues)

#### Testing Steps

1. **TypeScript Compilation** (30 minutes)
   ```bash
   npm run build
   # ✅ 0 TypeScript errors
   # ✅ All imports resolved
   # ✅ No type mismatches
   ```

2. **ESLint Verification** (30 minutes)
   ```bash
   npm run lint
   # ✅ No import order issues
   # ✅ No unused imports
   # ✅ All import paths valid
   ```

3. **Manual Testing** (45 minutes)
   - ✅ Application starts (npm run dev)
   - ✅ Authentication flows work
   - ✅ Project dashboard loads
   - ✅ Project creation works
   - ✅ Vendor discovery workflow works
   - ✅ All 5 steps complete
   - ✅ No console errors
   - ✅ No type warnings in browser DevTools

4. **Import Pattern Verification** (15 minutes)
   - Verify all imports use: `import type { ... } from '@/types'`
   - No imports from individual component files
   - No mixed import sources

**Deliverable**: Complete testing passed, all verification successful

---

## Type Definition Details

### Domain Types (domain.ts) - Key Consolidation Points

**Project Type** (from 3 sources → 1):
```
ProjectDashboard.tsx: 6 fields (component version)
VendorDiscovery.tsx: 6 fields (component version)
projectService.ts: 10 fields (with workflow_state)

Consolidated to: 10 fields with unified status values
- Status: 'draft' | 'in_progress' | 'completed' | 'archived' (snake_case)
- Include: workflow_state (needed by services)
```

**Vendor Type** (from 2 sources → 1):
```
VendorDiscovery.tsx: rating, criteriaScores, criteriaAnswers, features
aiService.ts: match_score, logo_url, pros, cons, category

Consolidated to: Unified base + optional component-specific fields
- Core fields: id, name, description, category, website, logo_url, match_score, pricing
- Optional (component): rating?, criteriaScores?, criteriaAnswers?, features?
```

**Criterion Type** (from 2 sources → 1):
```
VendorDiscovery.tsx: "Criteria" (plural), type: string
aiService.ts: "Criterion" (singular), type: union

Consolidated to: Single "Criterion" (singular), type union
- type: 'feature' | 'technical' | 'business' | 'compliance'
```

---

## Risk Mitigation

### Circular Dependencies
- ✅ **Strategy**: domain.ts has NO imports, only exports
- ✅ components.ts imports from domain.ts (one-way only)
- ✅ services.ts imports from domain.ts

### Type Conflicts
- ✅ **Strategy**: Single source of truth
- ✅ All files import from @/types, not local definitions

### Breaking Changes
- ✅ **Strategy**: Phased approach
- ✅ Phase 1: Create types (additive, no removal)
- ✅ Phase 2: Update imports (all files work both ways during transition)
- ✅ Phase 3: Remove originals (safe after Phase 2 verification)

### Testing Gaps
- ✅ Compile verification: `npm run build`
- ✅ Import verification: `npm run lint`
- ✅ Runtime verification: Manual testing all features

---

## Success Criteria

### Type Consolidation
- [x] Create `/src/types/` directory with all files
- [x] Define all 40-50 domain types in one place
- [x] Define all component prop types in components.ts
- [x] Define all service response types
- [x] Define unified error handling

### Import Updates
- [x] All 20+ files updated to use @/types
- [x] No imports from individual component files
- [x] No mixed import sources
- [x] Consistent pattern: `import type { ... } from '@/types'`

### Cleanup
- [x] All duplicate type definitions removed
- [x] Original files cleaned up
- [x] No lingering duplicate types

### Verification
- [x] npm run build: 0 errors
- [x] npm run lint: 0 import issues
- [x] Manual testing: All features work
- [x] No console errors
- [x] No type warnings

### Documentation
- [x] TYPE_DEFINITIONS_REVIEW.md created ✅
- [x] TYPES_SUMMARY.md created ✅
- [x] TYPES_MIGRATION_PLAN.md created ✅
- [x] Code comments added to /src/types/
- [x] PROGRESS.md updated with sprint status

---

## Resources Needed

### Time Allocation
- **Phase 1** (Create types): 4-5 hours
- **Phase 2** (Update imports): 4-5 hours
- **Phase 3** (Remove duplicates): 1 hour
- **Phase 4** (Test & verify): 2 hours
- **Total**: 11-13 hours of development

### Files to Be Created
- `/src/types/index.ts`
- `/src/types/domain.ts`
- `/src/types/components.ts`
- `/src/types/services.ts`
- `/src/types/errors.ts`
- `/src/types/forms.ts` (optional)

### Files to Be Modified (24 files)
- 4 service files
- 1 hook file
- 8 component files
- 11 other component files

---

## Dependencies & Blockers

- ✅ No external dependencies to add
- ✅ No database changes needed
- ✅ No API changes required
- ✅ No breaking changes to functionality
- ✅ Can be done incrementally
- ✅ No blocking dependencies

---

## Acceptance Criteria

1. **Structure**: `/src/types/` directory exists with all 5-6 files
2. **Completeness**: All 82 type definitions consolidated to 40-50 types
3. **Consistency**: 100% of imports use `import type { ... } from '@/types'`
4. **Quality**: 0 TypeScript errors, 0 lint warnings
5. **Functionality**: All 21 prototype features work identically
6. **Documentation**: Updated PROGRESS.md, comments in type files
7. **Testing**: Manual testing of all workflows passes

---

## Rollback Plan

If issues occur:

```bash
# Option 1: Git revert (preferred)
git revert <commit-hash>

# Option 2: Manual restoration
1. Keep backup of old definitions
2. Restore type definitions to original files
3. Restore imports to original patterns
3. Verify with npm run build
```

---

## Timeline

| Day | Activity | Hours |
|-----|----------|-------|
| Day 1 | Phase 1: Create types | 4-5 |
| Day 2 | Phase 2: Update imports | 4-5 |
| Day 3 | Phase 3: Remove duplicates | 1 |
| Day 3 | Phase 4: Test & verify | 2 |
| **Total** | | **11-13 hours** |

Can be split across week or done in 2-3 focused days.

---

## Sprint Deliverables

1. ✅ `/src/types/` directory with all type files
2. ✅ All 82 → 40-50 types consolidated
3. ✅ All files updated to use centralized types
4. ✅ All duplicate types removed
5. ✅ PROGRESS.md updated
6. ✅ Code builds with 0 errors
7. ✅ All features still work
8. ✅ Git commits with clear messages

---

## Next Steps (After Sprint 7 Complete)

1. ✅ Sprint 7 complete: Type consolidation done
2. 📅 Code review of /src/types/ structure
3. 📅 Sprint 8: Other code quality improvements
4. 📅 Sprint 9+: Feature development with clean types

---

## Document References

- TYPE_DEFINITIONS_REVIEW.md - Detailed analysis with line numbers
- TYPES_SUMMARY.md - Quick reference
- TYPES_MIGRATION_PLAN.md - Implementation roadmap
- PROJECT_ROADMAP.md - Project phases
- PROGRESS.md - Sprint tracking

---

**Sprint Status**: 🟡 Ready to Implement
**Created**: November 12, 2024
**Estimated Start**: Week of November 19, 2024
**Estimated Completion**: December 3, 2024 (2 weeks)

