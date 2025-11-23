# Clarioo Application Architecture

**Version**: 1.0
**Last Updated**: November 15, 2024
**Status**: Visual Prototype Phase
**Related Docs**: [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md), [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Application Layers](#application-layers)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Component Hierarchy](#component-hierarchy)
6. [Mock Service Architecture](#mock-service-architecture)
7. [Future Production Architecture](#future-production-architecture)

---

## Executive Summary

Clarioo is currently in **Phase 0: Visual Prototype**, using a simplified architecture with mock services and JSON data. The architecture is designed for:
- **Rapid iteration**: Visual verification without backend dependencies
- **Stakeholder feedback**: Fully functional UI demonstrating all workflows
- **Future migration**: Clean separation of concerns enables smooth transition to production

**Current State**: Single-page React application with mock services
**Target State**: Full-stack application with Supabase backend and OpenAI integration

---

## System Architecture Overview

### Current Architecture (Phase 0: Visual Prototype)

```mermaid
graph TB
    subgraph "Browser"
        UI[React UI Components]
        Router[React Router]
        Hooks[Custom Hooks]
    end

    subgraph "Mock Services Layer"
        MockAuth[Mock Auth Service]
        MockProjects[Mock Projects Service]
        MockCriteria[Mock Criteria Service]
        MockVendors[Mock Vendors Service]
        MockChat[Mock Chat Service]
    end

    subgraph "Data Layer"
        JSON1[auth.json]
        JSON2[projects.json]
        JSON3[criteria.json]
        JSON4[vendors.json]
        JSON5[chat.json]
    end

    UI --> Router
    Router --> Hooks
    Hooks --> MockAuth
    Hooks --> MockProjects
    Hooks --> MockCriteria
    Hooks --> MockVendors
    Hooks --> MockChat

    MockAuth --> JSON1
    MockProjects --> JSON2
    MockCriteria --> JSON3
    MockVendors --> JSON4
    MockChat --> JSON5

    style UI fill:#e1f5ff
    style Router fill:#e1f5ff
    style Hooks fill:#fff4e6
    style MockAuth fill:#f3e5f5
    style MockProjects fill:#f3e5f5
    style MockCriteria fill:#f3e5f5
    style MockVendors fill:#f3e5f5
    style MockChat fill:#f3e5f5
    style JSON1 fill:#e8f5e9
    style JSON2 fill:#e8f5e9
    style JSON3 fill:#e8f5e9
    style JSON4 fill:#e8f5e9
    style JSON5 fill:#e8f5e9
```

**Key Characteristics:**
- ✅ No backend dependencies (100% frontend)
- ✅ Mock services simulate real API behavior
- ✅ Instant responses with realistic delays
- ✅ Full workflow demonstration capabilities
- ✅ Easy to modify test data

---

## Application Layers

### Layer Architecture (Top to Bottom)

```mermaid
graph LR
    subgraph "Presentation Layer"
        Pages[Pages<br/>TechInput, CriteriaBuilder,<br/>VendorSelection, Comparison]
        Components[Components<br/>Landing, Projects,<br/>Vendor Discovery, UI]
    end

    subgraph "Business Logic Layer"
        Hooks[Custom Hooks<br/>useAuth, useProjects,<br/>useCriteria, useVendors]
        Utils[Utilities<br/>Export, Validation,<br/>Formatting]
    end

    subgraph "Service Layer"
        Services[Mock Services<br/>Auth, Projects, Criteria,<br/>Vendors, Chat]
    end

    subgraph "Data Layer"
        Data[JSON Files<br/>Static dummy data]
    end

    Pages --> Components
    Components --> Hooks
    Hooks --> Utils
    Hooks --> Services
    Services --> Data

    style Pages fill:#e1f5ff
    style Components fill:#e1f5ff
    style Hooks fill:#fff4e6
    style Utils fill:#fff4e6
    style Services fill:#f3e5f5
    style Data fill:#e8f5e9
```

**Layer Responsibilities:**

| Layer | Purpose | Technologies | Files Location |
|-------|---------|--------------|----------------|
| **Presentation** | UI rendering, user interaction | React, shadcn/ui | `/src/pages/`, `/src/components/` |
| **Business Logic** | State management, data transformation | React Hooks, TypeScript | `/src/hooks/`, `/src/utils/` |
| **Service** | Data fetching, API simulation | Mock services | `/src/services/mock/` |
| **Data** | Static data storage | JSON files | `/src/data/api/` |

---

## Data Flow Architecture

### User Workflow Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Hook as Custom Hook
    participant Service as Mock Service
    participant Data as JSON Data

    User->>UI: Interact (click, input)
    UI->>Hook: Call hook function
    Hook->>Service: Request data
    Service->>Data: Load JSON file
    Data-->>Service: Return data
    Service->>Service: Simulate delay (300-800ms)
    Service-->>Hook: Return mock response
    Hook->>Hook: Transform data
    Hook-->>UI: Update state
    UI-->>User: Display result

    Note over Service,Data: Phase 0: Mock services<br/>Phase 1+: Real API calls
```

### 5-Step Vendor Discovery Workflow

```mermaid
graph LR
    S1[Step 1:<br/>Tech Input] --> S2[Step 2:<br/>Criteria Builder]
    S2 --> S3[Step 3:<br/>Vendor Selection]
    S3 --> S4[Step 4:<br/>Comparison]
    S4 --> S5[Step 5:<br/>Send Invitation]

    S1 -.->|Project Data| Storage[(Local Storage)]
    S2 -.->|Criteria| Storage
    S3 -.->|Vendors| Storage
    S4 -.->|Scores| Storage
    S5 -.->|Emails| Storage

    style S1 fill:#e1f5ff
    style S2 fill:#fff4e6
    style S3 fill:#f3e5f5
    style S4 fill:#e8f5e9
    style S5 fill:#fce4ec
    style Storage fill:#f5f5f5
```

**State Persistence:**
- **Local Storage**: Project state, user preferences
- **Session State**: Current step, form inputs, chat history
- **Component State**: UI interactions, animations, modals

---

## Component Hierarchy

### Landing Page Component Tree

```mermaid
graph TD
    Landing[LandingPage.tsx]

    Landing --> Hero[HeroSection]
    Landing --> Toggle[RegistrationToggle]
    Landing --> Inputs[AnimatedInputs]
    Landing --> Artifact[ArtifactVisualization]
    Landing --> Carousel[CardCarousel]
    Landing --> Auth[AuthModal]

    Hero --> Title[Gradient Title]
    Hero --> Subtitle[Description]

    Toggle --> SignIn[Sign In Tab]
    Toggle --> SignUp[Sign Up Tab]

    Inputs --> Input1[Company Input]
    Inputs --> Input2[Solution Input]
    Inputs --> Badges[Value Badges]

    Carousel --> Card1[Card 1: Tech Input]
    Carousel --> Card2[Card 2: Criteria]
    Carousel --> Card3[Card 3: Discovery]
    Carousel --> Card4[Card 4: Comparison]
    Carousel --> Card5[Card 5: Invitation]

    style Landing fill:#6366f1,color:#fff
    style Hero fill:#e1f5ff
    style Toggle fill:#fff4e6
    style Inputs fill:#f3e5f5
    style Artifact fill:#e8f5e9
    style Carousel fill:#fce4ec
    style Auth fill:#f5f5f5
```

### Vendor Discovery Component Tree

```mermaid
graph TD
    Main[VendorDiscovery]

    Main --> Dashboard[ProjectDashboard]
    Main --> Workflow[Workflow Steps]

    Dashboard --> Grid[ProjectGrid]
    Dashboard --> New[NewProjectDialog]
    Dashboard --> Category[CategoryDropdown]

    Workflow --> Step1[TechInput]
    Workflow --> Step2[CriteriaBuilder]
    Workflow --> Step3[VendorSelection]
    Workflow --> Step4[Comparison]
    Workflow --> Step5[SendInvitation]

    Step2 --> Accordion[CriteriaAccordion]
    Step2 --> Sidebar[CriterionEditSidebar]

    Accordion --> Section[AccordionSection]
    Section --> Cards[CriteriaCard x N]

    Cards --> Antenna[SignalAntenna]

    Step3 --> Table[VendorTable]
    Step3 --> Discovery[DiscoveryAnimation]

    Step4 --> Matrix[ComparisonMatrix]
    Step4 --> Summary[ExecutiveSummary]

    style Main fill:#6366f1,color:#fff
    style Dashboard fill:#e1f5ff
    style Workflow fill:#fff4e6
    style Step2 fill:#f3e5f5
    style Accordion fill:#e8f5e9
    style Step3 fill:#fce4ec
    style Step4 fill:#fff3e0
```

---

## Mock Service Architecture

### Mock Service Pattern

All mock services follow a consistent pattern for realistic API simulation:

```mermaid
graph LR
    Component[Component]
    Hook[Custom Hook]

    subgraph "Mock Service"
        Validate[Validate Input]
        Delay[Simulate Network<br/>Delay 300-800ms]
        Load[Load JSON Data]
        Transform[Transform Response]
        Error[Handle Errors<br/>Success/Fail]
    end

    JSON[(JSON File)]

    Component --> Hook
    Hook --> Validate
    Validate --> Delay
    Delay --> Load
    Load --> JSON
    JSON --> Transform
    Transform --> Error
    Error --> Hook
    Hook --> Component

    style Component fill:#e1f5ff
    style Hook fill:#fff4e6
    style Validate fill:#f3e5f5
    style Delay fill:#f3e5f5
    style Load fill:#f3e5f5
    style Transform fill:#f3e5f5
    style Error fill:#f3e5f5
    style JSON fill:#e8f5e9
```

**Mock Service Features:**
- ✅ Realistic delays (300-800ms random)
- ✅ Success/error simulation (95% success rate)
- ✅ Input validation
- ✅ Proper error messages
- ✅ Stateful responses (localStorage integration)

**Available Mock Services:**
- `authService.ts` - Authentication (login, signup, session)
- `projectService.ts` - Project CRUD operations
- `aiService.ts` - AI responses for criteria and vendor discovery
- `dataService.ts` - Data loading from JSON files

**Custom Hooks:**
- `useVendorDiscovery.ts` - Vendor discovery workflow state
- `useCriteriaGeneration.ts` - Criteria generation logic
- `useCriteriaChat.ts` - Criterion editing chat
- `useExecutiveSummary.ts` - Summary generation
- `useAuth.tsx` - Authentication state

---

## Future Production Architecture

### Target Architecture (Phase 1+)

```mermaid
graph TB
    subgraph "Frontend (Vercel/Netlify)"
        UI[React UI]
        Router[React Router]
        Hooks[Custom Hooks]
    end

    subgraph "Backend Services"
        API[API Routes]
        Auth[Supabase Auth]
        DB[(PostgreSQL<br/>Supabase)]
        Storage[File Storage<br/>Supabase]
    end

    subgraph "External APIs"
        OpenAI[OpenAI API<br/>GPT-4]
        Email[Email Service<br/>SendGrid/Resend]
    end

    UI --> Router
    Router --> Hooks
    Hooks --> API

    API --> Auth
    API --> DB
    API --> Storage
    API --> OpenAI
    API --> Email

    Auth --> DB

    style UI fill:#e1f5ff
    style Router fill:#e1f5ff
    style Hooks fill:#fff4e6
    style API fill:#f3e5f5
    style Auth fill:#f3e5f5
    style DB fill:#e8f5e9
    style Storage fill:#e8f5e9
    style OpenAI fill:#fce4ec
    style Email fill:#fce4ec
```

### Migration Path

**Phase 0 → Phase 1 Migration Steps:**

1. **Database Setup**
   - Create Supabase project
   - Run schema migrations
   - Set up Row Level Security (RLS) policies
   - Migrate JSON data to PostgreSQL

2. **Service Layer Migration**
   - Replace mock services with real API clients
   - Implement error handling and retry logic
   - Add request caching and optimization
   - Set up API rate limiting

3. **Authentication Migration**
   - Enable Supabase Auth
   - Configure OAuth providers
   - Implement session management
   - Add security headers

4. **AI Integration**
   - Connect OpenAI API
   - Implement prompt engineering
   - Add response streaming
   - Set up usage monitoring

5. **Testing & Deployment**
   - E2E tests for critical flows
   - Performance testing
   - Security audit
   - CI/CD pipeline setup

**Preserved from Prototype:**
- ✅ Component structure
- ✅ Custom hooks interface
- ✅ UI/UX design
- ✅ State management patterns
- ✅ Type definitions

**Changed in Production:**
- ❌ Mock services → Real API clients
- ❌ JSON files → PostgreSQL database
- ❌ Local storage → Supabase backend
- ❌ Simulated delays → Real network latency
- ❌ Dummy data → User-generated content

---

## Architecture Principles

### Design Principles

1. **Separation of Concerns**
   - Clear boundaries between layers
   - Each layer has single responsibility
   - No cross-layer dependencies

2. **Component Reusability**
   - Small, focused components
   - Composition over inheritance
   - Shared UI components in `/components/ui/`

3. **Type Safety**
   - TypeScript strict mode enabled
   - Centralized type definitions in `/src/types/`
   - No `any` types in production code

4. **Mock Service Parity**
   - Mock services mirror real API behavior
   - Same interfaces as production services
   - Easy switch between mock and real

5. **Mobile-First Design**
   - Responsive at all breakpoints (350px - 1920px)
   - Touch-friendly interactions
   - Performance optimized for mobile

### Performance Optimization

- **Code Splitting**: React.lazy for route-based splitting
- **Bundle Size**: Tree shaking, no unused dependencies
- **Rendering**: React.memo for expensive components
- **State**: Local state preferred over global
- **Caching**: Browser caching for static assets

---

## References

- **Codebase Structure**: [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) - Detailed file organization
- **Project Roadmap**: [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) - Implementation timeline
- **Development Guidelines**: [GL-RDD.md](./GL-RDD.md), [GL-TDD.md](./GL-TDD.md) - Best practices
- **Feature List**: [../00_PLAN/FEATURE_LIST.md](../00_PLAN/FEATURE_LIST.md) - Feature inventory
- **User Stories**: [../00_PLAN/USER_STORIES.md](../00_PLAN/USER_STORIES.md) - User requirements

---

*This architecture document provides a high-level overview. See CODEBASE_STRUCTURE.md for detailed implementation specifics.*
