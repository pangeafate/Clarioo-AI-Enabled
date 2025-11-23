# START-UP Guide for New AI Agents

This guide helps new AI agents quickly understand the Clarioo codebase and development workflow.

---

## When NOT Familiar with the Codebase

Follow these steps in order to understand the project:

### Step 1: Understand the Vision (5 minutes)
Read these documents to understand WHAT we're building:

1. **VISION.md** (`/00_PLAN/VISION.md`) - Product vision, design philosophy, brand guidelines
2. **USER_STORIES.md** (`/00_PLAN/USER_STORIES.md`) - User requirements and acceptance criteria
3. **FEATURE_LIST.md** (`/00_PLAN/FEATURE_LIST.md`) - Feature inventory with implementation status

**Goal**: Understand the product vision, target users, and feature scope.

---

### Step 2: Understand the Architecture (10 minutes)
Read these documents to understand HOW it's built:

1. **ARCHITECTURE.md** (`/00_IMPLEMENTATION/ARCHITECTURE.md`) - System architecture with visual diagrams
2. **CODEBASE_STRUCTURE.md** (`/00_IMPLEMENTATION/CODEBASE_STRUCTURE.md`) - Detailed file organization and module boundaries

**Goal**: Understand the technical architecture and codebase organization.

---

### Step 3: Understand Development Principles (5 minutes)
Read the development guidelines you MUST follow:

1. **GL-RDD.md** (`/00_IMPLEMENTATION/GL-RDD.md`) - README-Driven Development guidelines
2. **GL-TDD.md** (`/00_IMPLEMENTATION/GL-TDD.md`) - Test-Driven Development framework (note prototype phase exception)
3. **GL-ERROR-LOGGING.md** (`/00_IMPLEMENTATION/GL-ERROR-LOGGING.md`) - Error handling and logging standards

**Goal**: Understand the development methodology and coding standards.

---

### Step 4: Understand Implementation Progress (5 minutes)
Read these documents to understand WHERE we are:

1. **PROJECT_ROADMAP.md** (`/00_IMPLEMENTATION/PROJECT_ROADMAP.md`) - Implementation plan from MVP to target state
2. **PROGRESS.md** (`/00_IMPLEMENTATION/PROGRESS.md`) - Sprint history and current status
3. **SPRINTS folder** (`/00_IMPLEMENTATION/SPRINTS/`) - Individual sprint plan files

**Goal**: Understand completed work, current sprint, and what's planned next.

---

### Step 5: Verify Folder Structure (1 minute)
Ensure these folders exist with correct organization:

```
/
├── 00_PLAN/
│   ├── VISION.md
│   ├── USER_STORIES.md
│   └── FEATURE_LIST.md
│
└── 00_IMPLEMENTATION/
    ├── ARCHITECTURE.md
    ├── CODEBASE_STRUCTURE.md
    ├── GL-RDD.md
    ├── GL-TDD.md
    ├── GL-ERROR-LOGGING.md
    ├── PROJECT_ROADMAP.md
    ├── PROGRESS.md
    └── SPRINTS/
        ├── SP_XXX_Description.md (main sprint files)
        └── SP_XXX_Description/ (folders for multi-file sprints)
```

---

## When Working on the Project

### Development Workflow

**Before Building Any Feature:**

1. **Check PROJECT_ROADMAP.md** - Find the sprint number and verify it's planned
2. **Create Sprint Plan** in `/00_IMPLEMENTATION/SPRINTS/`
   - Naming: `SP_XXX_Description.md` (e.g., `SP_005_PostgreSQL_to_Supabase_Migration.md`)
   - Content: Plain English description of what will be implemented (no code)
   - Include charts/diagrams where helpful
3. **Update PROGRESS.md** - Add the sprint to the history with condensed description

**While Building:**

4. **Follow GL-RDD.md** - Write README/documentation before code
5. **Follow GL-TDD.md** - Write tests before implementation (or use visual verification for prototype phase)
6. **Follow GL-ERROR-LOGGING.md** - Implement proper error handling

**After Completing Sprint:**

7. **Update Documentation** using appropriate agent:
   - PROGRESS.md (mark sprint complete)
   - PROJECT_ROADMAP.md (update status)
   - FEATURE_LIST.md (mark features implemented)
   - USER_STORIES.md (update implementation status)

**For Multi-File Sprints:**

8. **Create Sprint Folder** if the sprint produces multiple files:
   - Create: `/00_IMPLEMENTATION/SPRINTS/SP_XXX_Description/`
   - Put all supplementary files in this folder
   - Keep main sprint plan at root level: `SP_XXX_Description.md`

---

## Best Practices

### Always Follow These Principles

1. ✅ **Test-Driven Development** - Write failing tests first (or visual verification for prototype)
2. ✅ **README-Driven Development** - Document before implementing
3. ✅ **Use Appropriate Agents** - Leverage specialized agents for complex tasks
4. ✅ **Run Agents in Parallel** - Use multiple agents simultaneously when possible
5. ✅ **Sequential Thinking** - Use sequential_thinking MCP for complex multi-step problems

### Never Do These Things

1. ❌ **Don't skip documentation** - Always update all affected documentation files
2. ❌ **Don't write code before tests** - Except infrastructure and prototype phase
3. ❌ **Don't commit failing tests** - All tests must pass before commit
4. ❌ **Don't use Docker** - Until project is production-ready (per CLAUDE.md)
5. ❌ **Don't push to GitHub** - Unless explicitly requested by user

---

## MCP Server Usage Guidelines

### General Rules

- **USE SUBAGENTS FOR MCP CALLS** - Never call MCP tools directly from main agent
- **Combine Multiple MCPs** - For complex tasks (e.g., Playwright + Neo4j testing)
- **Use Context 7 First** - Get current documentation for popular frameworks
- **Specify Browser/Device** - For Playwright when testing responsive designs

### Available MCP Servers

- **Playwright** - Browser automation and testing
- **Sequential Thinking** - Complex multi-step problem analysis
- **Context 7** - Access to current framework documentation
- **Browser Tools** - DevTools integration, screenshots, audits
- **Fetch** - Web content fetching with image support
- **n8n** - Workflow automation
- **DigitalOcean** - Infrastructure management

---

## Quick Reference

### Current Project Status

- **Phase**: Visual Prototype (Phase 0)
- **Technology**: React 18.3.1 + TypeScript 5.5.3 + Vite 5.4.2
- **Backend**: Mock services with JSON data (no real backend yet)
- **Testing**: Visual verification (automated tests required for production)
- **Next Phase**: Backend foundation with Supabase + OpenAI

### Key Files to Check First

1. `PROGRESS.md` - Current sprint and latest changes
2. `PROJECT_ROADMAP.md` - Implementation timeline
3. `CODEBASE_STRUCTURE.md` - File organization
4. `ARCHITECTURE.md` - System design

### Common Tasks

| Task | Steps |
|------|-------|
| **Start new feature** | Check roadmap → Create sprint plan → Update PROGRESS.md → Build → Update docs |
| **Fix bug** | Identify → Write failing test → Fix → Verify all tests pass → Update docs |
| **Review code** | Check GL-RDD → Check GL-TDD → Verify layer boundaries → Check error handling |
| **Deploy changes** | Don't use Docker → Wait for production phase → Follow deployment sprint plan |

---

*Last Updated: November 15, 2024*
*Version: 2.0*
