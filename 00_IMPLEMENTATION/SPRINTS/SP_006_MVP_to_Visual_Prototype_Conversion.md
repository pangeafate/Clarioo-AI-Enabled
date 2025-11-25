# SP_006 - MVP to Visual Prototype Conversion

## Sprint Overview

**Sprint ID**: SP_006
**Sprint Name**: MVP to Visual Prototype Conversion
**Sprint Type**: Major Architecture Refactoring
**Duration**: 1-2 weeks (estimated)
**Status**: 🟡 Planning
**Created**: November 12, 2024

---

## Executive Summary

This sprint converts the functional MVP (68% complete with 21/31 features) into a **visual prototype** with dummy data for demonstration purposes. The goal is to create a lightweight, clean, logically separated front-end that can be easily handed off to backend developers for integration with real services.

### Purpose
- **Team Alignment**: Visual demonstration of what we're building
- **Design Validation**: Confirm UX/UI flows before full implementation
- **Backend Handoff**: Clean, separated front-end ready for backend integration
- **Lightweight Demo**: Fast, deployable prototype for stakeholder presentations

---

## Sprint Goals

### Primary Objectives
1. ✅ Remove all backend dependencies (Supabase, OpenAI)
2. ✅ Replace real functionality with mock services using dummy data
3. ✅ Keep authentication as visual demo (no real auth)
4. ✅ Maintain clean separation of concerns for future integration
5. ✅ Archive all removed functional code for future use
6. ✅ Update all documentation to reflect prototype nature

### Secondary Objectives
- Simplify codebase by removing redundant files
- Maintain logical component structure (no huge monolithic files)
- Ensure all 21 implemented features are visually demonstrable
- Keep file count to minimum while preserving clarity

---

## Scope

### In Scope ✅

#### 1. Architecture Changes
- Remove Supabase integration (auth, database, realtime)
- Remove OpenAI integration (GPT-4 API calls)
- Create mock service layer (`/src/services/mock/`)
- Create JSON dummy data structure (`/src/data/`)
- Archive removed code to `/archived/` subfolder

#### 2. Mock Service Implementation
- Mock Authentication Service
  - Simulated login (always succeeds with dummy user)
  - Simulated session management
  - No real JWT or tokens
- Mock Project Service
  - Returns dummy projects from JSON
  - Simulates CRUD operations
- Mock AI Service
  - Pre-generated criteria responses
  - Pre-generated vendor discoveries
  - Pre-generated comparison results
  - Pre-generated email templates
- Mock Data Service
  - Excel import simulation
  - Excel export functionality (can remain functional)

#### 3. Dummy Data Structure
All data stored in `/src/data/` folder:
- `/api/` - API response shapes
  - `auth.json` - Dummy user data
  - `projects.json` - Sample projects
  - `vendors.json` - Sample vendor catalog
  - `criteria.json` - Pre-generated criteria sets
  - `comparisons.json` - Pre-generated comparisons
- `/templates/` - Template data
  - `email-templates.json` - Email templates
  - `criteria-templates.json` - Criteria templates

#### 4. Features to Demonstrate (21 Total)
**All 21 currently implemented features remain visually functional:**

1. Authentication UI (visual demo only)
2. Project Dashboard
3. Project Creation/Management
4. 5-Step Vendor Discovery Workflow
   - Step 1: Tech Requirements Input
   - Step 2: AI Criteria Builder (with chat UI)
   - Step 3: Vendor Selection (show results instantly)
   - Step 4: Vendor Comparison Table
   - Step 5: Vendor Invite Email Generation
5. Excel Import (simulate with sample data)
6. Excel Export (can remain functional)
7. Responsive Design
8. Navigation and Layout

#### 5. Documentation Updates
- ARCHITECTURE.md → Reflect prototype architecture
- PROJECT_ROADMAP.md → Update for prototype goals
- PROGRESS.md → Current prototype status
- FEATURE_LIST.md → Mark features as "demo only"
- GL-TDD.md → Update for prototype testing
- GL-RDD.md → Update for prototype docs
- GL-ERROR-LOGGING.md → Archive or simplify

### Out of Scope ❌

#### Not Implementing
- Error state simulations
- Empty state simulations
- Loading state simulations (keep simple spinners)
- Real backend integration
- Real AI integration
- Real authentication
- Real data persistence
- Test-driven development (TDD) for dummy logic
- Full test suite implementation
- Performance optimization
- Security hardening

---

## Technical Approach

### 1. Archive Strategy

Create `/archived/` folder with structure:
```
archived/
├── supabase/
│   ├── migrations/
│   └── config.toml
├── services/
│   ├── openai.ts
│   └── supabase-client.ts
├── hooks/
│   ├── useAuth.tsx (real auth version)
│   └── useSupabase.tsx
├── contexts/
│   └── AuthContext.tsx (real auth version)
└── README.md (explains what's archived and why)
```

### 2. New Structure

```
src/
├── data/                    # NEW - All dummy data
│   ├── api/                # API response shapes
│   │   ├── auth.json
│   │   ├── projects.json
│   │   ├── vendors.json
│   │   ├── criteria.json
│   │   └── comparisons.json
│   └── templates/          # Template data
│       ├── email-templates.json
│       └── criteria-templates.json
├── services/               # MODIFIED
│   └── mock/              # NEW - Mock services
│       ├── authService.ts
│       ├── projectService.ts
│       ├── aiService.ts
│       └── dataService.ts
├── components/            # CLEANED UP
│   ├── ui/               # shadcn components (keep as-is)
│   ├── steps/            # Workflow steps
│   └── [other components] # Remove redundant ones
├── pages/                # SIMPLIFIED
│   ├── Index.tsx
│   └── Auth.tsx (visual demo only)
├── hooks/                # SIMPLIFIED
│   ├── useAuth.tsx (mock version)
│   └── useMobile.tsx
└── lib/                  # SIMPLIFIED
    └── utils.ts
```

### 3. Mock Service Architecture

#### Service Layer Pattern
```typescript
// src/services/mock/projectService.ts
import projectsData from '@/data/api/projects.json';

export const projectService = {
  // Get all projects (returns dummy data)
  async getProjects(): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return projectsData;
  },

  // Create project (simulate only)
  async createProject(project: CreateProjectDto): Promise<Project> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProject = {
      id: `proj_${Date.now()}`,
      ...project,
      created_at: new Date().toISOString(),
    };
    // In real version: POST to API
    // For now: just return the new project
    return newProject;
  },

  // Update project (simulate only)
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const project = projectsData.find(p => p.id === id);
    // In real version: PATCH to API
    // For now: just return updated project
    return { ...project, ...updates };
  },
};
```

#### AI Service Pattern
```typescript
// src/services/mock/aiService.ts
import criteriaData from '@/data/api/criteria.json';
import vendorsData from '@/data/api/vendors.json';

export const aiService = {
  // Generate criteria (returns pre-generated data)
  async generateCriteria(requirements: TechRequirements): Promise<Criterion[]> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // In real version: POST to OpenAI API
    // For now: return pre-generated criteria based on category
    return criteriaData[requirements.category] || criteriaData.default;
  },

  // Discover vendors (returns pre-selected vendors)
  async discoverVendors(requirements: TechRequirements): Promise<Vendor[]> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    // In real version: POST to OpenAI API
    // For now: return pre-selected vendors based on category
    return vendorsData[requirements.category] || vendorsData.default;
  },

  // Compare vendors (returns pre-generated comparison)
  async compareVendors(vendors: Vendor[], criteria: Criterion[]): Promise<Comparison> {
    await new Promise(resolve => setTimeout(resolve, 2500));
    // In real version: POST to OpenAI API
    // For now: return pre-generated comparison matrix
    return comparisonData[vendors[0]?.category] || comparisonData.default;
  },
};
```

### 4. Dummy Data Structure

#### projects.json
```json
[
  {
    "id": "proj_001",
    "user_id": "user_demo",
    "name": "CRM System Selection 2024",
    "description": "Finding the right CRM for our growing sales team",
    "status": "in_progress",
    "category": "CRM Software",
    "workflow_state": {
      "currentStep": 3,
      "steps": {
        "1": { "status": "completed", "data": {...} },
        "2": { "status": "completed", "data": {...} },
        "3": { "status": "in_progress", "data": {...} }
      }
    },
    "created_at": "2024-11-01T10:00:00Z",
    "updated_at": "2024-11-12T14:30:00Z"
  },
  {
    "id": "proj_002",
    "name": "Marketing Automation Platform",
    "status": "completed",
    ...
  },
  {
    "id": "proj_003",
    "name": "Cloud Infrastructure Migration",
    "status": "draft",
    ...
  }
]
```

#### vendors.json
```json
{
  "CRM Software": [
    {
      "id": "vendor_sf",
      "name": "Salesforce",
      "description": "World's #1 CRM platform",
      "category": "CRM Software",
      "pricing": "$25-300/user/month",
      "website": "https://salesforce.com",
      "strengths": ["Market leader", "Extensive ecosystem", "Powerful automation"],
      "weaknesses": ["Expensive", "Complex setup", "Steep learning curve"]
    },
    {
      "id": "vendor_hs",
      "name": "HubSpot",
      "description": "All-in-one marketing and CRM platform",
      ...
    }
  ],
  "Marketing Automation": [...],
  "default": [...]
}
```

### 5. Component Updates

#### Minimal Changes to Components
- Components largely stay the same (UI/UX unchanged)
- Only swap service imports:
  ```typescript
  // Before
  import { generateCriteria } from '@/services/openai';

  // After
  import { aiService } from '@/services/mock/aiService';

  // Usage stays nearly identical
  const criteria = await aiService.generateCriteria(requirements);
  ```

#### Authentication Flow
```typescript
// src/services/mock/authService.ts
export const authService = {
  // Always succeeds with dummy user
  async signIn(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      user: {
        id: 'user_demo',
        email: email,
        full_name: 'Demo User',
        company_name: 'Acme Corp',
      },
      session: {
        access_token: 'demo_token_123',
        expires_at: Date.now() + 3600000,
      },
    };
  },

  async signOut() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  },

  async getUser() {
    // Return stored demo user
    return {
      id: 'user_demo',
      email: 'demo@vendora.ai',
      full_name: 'Demo User',
      company_name: 'Acme Corp',
    };
  },
};
```

---

## Implementation Plan

### Phase 1: Setup & Archive (2-3 hours)
1. Create `/archived/` folder structure
2. Move Supabase-related files to archive
3. Move OpenAI service to archive
4. Move real auth implementation to archive
5. Create archive README explaining contents

### Phase 2: Mock Services Setup (3-4 hours)
1. Create `/src/data/` folder structure
2. Create all JSON dummy data files
3. Create `/src/services/mock/` folder
4. Implement mock auth service
5. Implement mock project service
6. Implement mock AI service
7. Implement mock data service

### Phase 3: Component Migration (4-6 hours)
1. Update Auth components to use mock auth
2. Update ProjectDashboard to use mock project service
3. Update VendorDiscovery workflow steps:
   - CriteriaBuilder → use mock AI
   - VendorSelection → use mock AI
   - VendorComparison → use mock AI
   - VendorInvite → use mock email generation
4. Update imports throughout codebase
5. Remove unused Supabase hooks/contexts

### Phase 4: Cleanup & Simplification (2-3 hours)
1. Identify and remove redundant component files
2. Clean up unused imports
3. Remove unnecessary dependencies from package.json
4. Simplify folder structure
5. Verify all 21 features still work visually

### Phase 5: Documentation Updates (2-3 hours)
1. Update ARCHITECTURE.md
2. Update PROJECT_ROADMAP.md
3. Update PROGRESS.md
4. Update FEATURE_LIST.md
5. Update GL-TDD.md
6. Update GL-RDD.md
7. Update/Archive GL-ERROR-LOGGING.md
8. Update README.md

### Phase 6: Testing & Validation (2-3 hours)
1. Manual testing of all 21 features
2. Verify visual flows work end-to-end
3. Check responsive design on mobile
4. Verify Excel export still works
5. Confirm no console errors
6. Build verification (`npm run build`)

**Total Estimated Time: 15-22 hours**

---

## Acceptance Criteria

### Functional Requirements
- [ ] All backend dependencies removed (Supabase, OpenAI)
- [ ] Mock services return data from JSON files
- [ ] All 21 features visually demonstrable
- [ ] Authentication works as visual demo
- [ ] 5-step workflow completes successfully with dummy data
- [ ] Excel export functionality works
- [ ] No real API calls made during demo
- [ ] All removed code archived to `/archived/` folder

### Non-Functional Requirements
- [ ] Application builds without errors
- [ ] Application runs without console errors
- [ ] Responsive design maintained
- [ ] Page load time < 2 seconds
- [ ] Clean, logical file structure
- [ ] Components remain modular (no huge files)
- [ ] Code is well-commented for backend handoff

### Documentation Requirements
- [ ] ARCHITECTURE.md updated
- [ ] PROJECT_ROADMAP.md updated
- [ ] PROGRESS.md updated
- [ ] FEATURE_LIST.md updated
- [ ] GL-*.md files updated or archived
- [ ] README.md reflects prototype nature
- [ ] Archive README explains what's stored

---

## Risk & Mitigation

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing components | Medium | High | Test each feature after migration |
| Losing functional code | Low | High | Comprehensive archiving with documentation |
| Missing dependencies | Low | Medium | Keep package.json dependencies that UI needs |
| Inconsistent dummy data | Medium | Medium | Create realistic, validated JSON data |
| Time overrun | Medium | Low | Phase approach allows incremental progress |

### Rollback Plan
- Git branch for all changes
- Archive original code before deletion
- Can restore from `/archived/` folder if needed
- Commit after each phase for rollback points

---

## Success Metrics

### Quantitative
- ✅ 0 real API calls during demo
- ✅ 100% of 21 features visually working
- ✅ < 500KB bundle size (reduced from removing backends)
- ✅ < 2s load time
- ✅ 0 build warnings/errors
- ✅ 0 console errors during demo

### Qualitative
- ✅ Team can understand visual flows
- ✅ Backend developers can easily identify integration points
- ✅ Stakeholders can see complete UX journey
- ✅ Code is clean and maintainable
- ✅ Future conversion back to functional is straightforward

---

## Dependencies

### Required
- None (removing dependencies, not adding)

### Optional
- May keep some UI-only packages (Tailwind, shadcn/ui, etc.)

---

## Deliverables

1. **Refactored Codebase**
   - `/src/` with mock services and dummy data
   - `/archived/` with all removed functional code
   - Updated `package.json` (removed unused deps)

2. **Dummy Data Files**
   - Complete JSON data set for all features
   - Realistic, well-structured data
   - Comments explaining data structure

3. **Updated Documentation**
   - All project docs reflect prototype nature
   - Clear instructions for backend integration
   - Archive documentation

4. **Working Prototype**
   - Deployed/deployable demo
   - All 21 features demonstrable
   - No backend dependencies

---

## Post-Sprint Actions

### Immediate
- Deploy prototype for team review
- Gather feedback on visual flows
- Document any UX improvements needed

### Future
- When ready for functional implementation:
  - Restore code from `/archived/`
  - Swap mock services for real services
  - Reconnect to Supabase and OpenAI
  - Implement proper error handling
  - Add comprehensive tests

---

## Notes

### Backend Integration Points
For future backend developers, key integration points:

1. **Authentication**: Replace `src/services/mock/authService.ts` with real Supabase auth
2. **Projects**: Replace `src/services/mock/projectService.ts` with real API calls
3. **AI Services**: Replace `src/services/mock/aiService.ts` with real OpenAI integration
4. **Data**: Replace JSON imports with actual API endpoints

### Dummy Data Realism
- Use real company names (Salesforce, HubSpot, etc.)
- Realistic pricing ranges
- Actual feature descriptions
- Valid email templates
- Proper technical terminology

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-11-12 | System | Initial sprint plan creation |

---

*Sprint Status: Planning*
*Next Review: After Phase 1 completion*
*Estimated Completion: 2 weeks from start*
