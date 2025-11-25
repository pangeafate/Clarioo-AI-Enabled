# README-Driven Development Framework

**Version**: 1.0
**Last Updated**: November 15, 2024
**Status**: Active Development Guidelines

---

## Philosophy  
  
README-Driven Development (RDD) treats documentation as the primary design artifact. By writing documentation first, we clarify intent, establish contracts, and create a shared understanding before implementation begins.  
  
## Core Principles  
  
### The Four Pillars  
  
1. **Document First, Implement Second**  
    - Write what you'll build before building it  
   - Documentation drives design decisions  
   - Documentation becomes the contract  
2. **Modular Architecture**  
    - Small, focused modules (SRP - Single Responsibility Principle)  
   - Clear boundaries between layers  
   - Explicit dependencies  
3. **Continuous Documentation**  
    - Documentation evolves with code  
   - Every change requires doc updates  
   - Documentation is part of Definition of Done  
4. **Predictable Structure**  
    - Consistent patterns across the codebase  
   - Self-documenting folder organization  
   - Standardized file sizes and complexity limits  
  
## Documentation Hierarchy  
  
### Understanding a New Codebase (Sequential Process)  
  
1. **Start with PLAN.md** - Understand what we're building  
2. **Analyze the codebase** - See current development progress  
3. **Review USER_STORIES.md** - Understand user stories and their implementation status  
4. **Check FEATURE_LIST.md** - See detailed features with completion indicators  
5. **Read GL-RDD.md and GL-TDD.md** - Understand development principles  
6. **Review CODEBASE_STRUCTURE.md** - Understand code organization rules  
7. **Check ARCHITECTURE.md** - Understand system design and technical decisions  
8. **Review PROJECT_ROADMAP.md** - See implementation plan from MVP to target state  
9. **Check PROGRESS.md** - Review sprint history and current progress  
10. **Review active sprint plans** - Understand current work in progress  
  
## Standard Project Structure  
  
```  project-root/  ├── 00_PLAN/                      # Product PLAN and requirements  │   ├── PLAN.md                    # Product PLAN and goals  │   ├── USER_STORIES.md              # User stories linked to features  │   ├── FEATURE_LIST.md              # Complete feature list with status  |   └── ARCHITECTURE.md              # System design and architecture  ├── 00_IMPLEMENTATION_DOC/              # Implementation planning and tracking  │   ├── PROJECT_ROADMAP.md           # Implementation plan (MVP to target)  │   ├── PROGRESS.md                  # Sprint tracking and history  │   ├── GL-RDD.md                    # README-Driven Development guidelines  │   ├── GL-TDD.md                    # Test-Driven Development guidelines  │   ├── CODEBASE_STRUCTURE.md        # Code organization rules  │   └── SPRINTS/                     # Individual sprint plans  │       └── SP-[description]-YYMMDD.md  ├── README.md                        # Project overview & quick start  ├── CHANGELOG.md                     # Version history  ├── src/  │   ├── presentation/                # UI/API layer  │   │   └── [module]/  │   │       ├── README.md  │   │       ├── [module].{ext}  │   │       ├── [module].test.{ext}  │   │       └── index.{ext}  │   ├── application/                 # Business logic  │   │   └── [use-case]/  │   │       ├── README.md  │   │       └── [use-case].{ext}  │   ├── domain/                      # Core business entities  │   │   └── [entity]/  │   │       ├── README.md  │   │       └── [entity].{ext}  │   └── infrastructure/              # External integrations  │       └── [service]/  │           ├── README.md  │           └── [service].{ext}  ├── test/                            # Test infrastructure (see GL-TDD.md)  │   ├── unit/  │   ├── integration/  │   └── e2e/  └── scripts/                         # Build/deploy/utility scripts  ```    
## Essential Documentation Files  
  
### 00_PLAN Folder  
  
#### PLAN.md Template  
  
```markdown  # Project PLAN  ## Executive Summary[1-2 paragraph overview of what we're building and why]    
    
## Problem Statement[What problem are we solving?]    
    
## Target Users[Who will use this?]    
    
## Core Value Proposition[What unique value do we provide?]    
    
## Success Metrics[How do we measure success?]    
    
## Non-Goals[What are we explicitly NOT doing?]  ```    
#### USER_STORIES.md Template  
  
```markdown  # User Stories  ## Story FormatAs a [type of user], I want [goal] so that [benefit]    
    
## Epic: [Epic Name]    
    
### US-001: [Story Title]  **As a** [user type]  **I want** [functionality]  **So that** [benefit]    
    
**Acceptance Criteria:**  - [ ] Criterion 1  - [ ] Criterion 2    
    
**Status:** [Not Started | In Progress | Complete]  **Features:** Links to FEATURE_LIST.md entries**Implementation:** [File locations if implemented]  ```    
#### FEATURE_LIST.md Template  
  
```markdown  # Feature List  ## Feature Categories  ### [Category Name]    
    
#### F-001: [Feature Name]  **Description:** Plain English description**Status:** [Not Started | In Progress | Complete | Blocked]  **Completion:** [0-100%]  **User Stories:** US-001, US-002**Implementation:**  - File: [path/to/file.ext] (lines X-Y)- Tests: [path/to/test.ext]  **Dependencies:** F-002, F-003**Notes:** Any relevant information```    
### 00_IMPLEMENTATION Folder    
    
#### PROJECT_ROADMAP.md Template    
    
```markdown  # Project Roadmap  ## Phases  ### Phase 1: MVP**Target Date:** YYYY-MM-DD**Status:** [Planning | In Progress | Complete]    
    
#### Milestone 1.1: [Name]  **Features:** F-001, F-002, F-003**Status:** [0-100%]  **Sprint:** SP-description-YYMMDD  ### Phase 2: Enhanced Features[Continue pattern...]    
    
## Release History- v0.1.0 (YYYY-MM-DD): MVP release  - v0.2.0 (YYYY-MM-DD): Feature X added  ```    
#### PROGRESS.md Template  
  
```markdown  # Development Progress  ## Active Sprint**Current:** SP-feature-name-YYMMDD**Started:** YYYY-MM-DD**Target Completion:** YYYY-MM-DD  ## Sprint History  ### Sprint 5: SP-user-auth-241201**Duration:** 2024-12-01 to 2024-12-07**Status:** Complete**Features Delivered:** F-001, F-002**Velocity:** 13 points  ### Sprint 4: [Previous sprints...]  [Continue pattern...]    
    
## Metrics- Average Velocity: X points/sprint  - Features Completed: Y/Z total  - Test Coverage: XX%  ```    
#### Sprint Plan Template (SP-description-YYMMDD.md)  
  
```markdown  # Sprint Plan: [Description]    
    
## Sprint Information**Sprint ID:** SP-description-YYMMDD**Duration:** X days**Start Date:** YYYY-MM-DD**End Date:** YYYY-MM-DD  ## Sprint Goal[Clear, concise goal in plain English]    
    
## Scope  ### Features to Implement- **F-XXX:** [Feature name] (X points)  - [ ] Task 1 description- [ ] Task 2 description    
### User Stories to Complete  - **US-XXX:** [Story title]    
    
## Technical Approach[Plain English description of how features will be implemented]    
    
## Testing Strategy[Description of testing approach per GL-TDD.md]    
    
## Success Criteria- [ ] All features implemented  - [ ] All tests passing  - [ ] Code reviewed  - [ ] Documentation updated    
    
## Risks and Mitigations| Risk | Impact | Mitigation |  |------|--------|------------|  | [Risk description] | [High/Medium/Low] | [Mitigation strategy] |    
## Post-Sprint Updates**Actual Completion:** YYYY-MM-DD**Features Delivered:** F-XXX, F-YYY**Carry Over:** F-ZZZ**Retrospective Notes:** [Key learnings]  ```    
### Core Documentation Files  
  
#### CODEBASE_STRUCTURE.md Template  
  
```markdown  # Codebase Structure  ## Overview[High-level description of code organization philosophy]    
    
## Layer Architecture[Description following GL-RDD.md patterns]    
    
## Module Organization  ### Presentation Layer- **Location:** src/presentation/- **Purpose:** User interface and API endpoints- **Rules:** No business logic, only display and input handling  ### Application Layer[Continue pattern...]    
    
## Naming Conventions- Files: [convention]  - Functions: [convention]  - Variables: [convention]  - Tests: [convention per GL-TDD.md]    
    
## Module Organization Guidelines  
  
### Architectural Cohesion Principles  
**Primary Rule**: Split files based on architectural violations, not arbitrary size limits.  
  
### Context-Based Module Guidelines| Module Type | Organization Principle | Split When |  |-------------|----------------------|------------|  | **Repositories** | Complete CRUD operations for one entity | Mixing multiple entities or adding business logic |  | **Services** | Single business capability orchestration | Mixing orchestration with I/O or utilities |  | **Entities** | Complete domain behavior for one concept | Adding I/O operations or mixing multiple domains |  | **Parsers** | Complete parsing workflow for one format | Mixing multiple formats or adding business logic |  | **Utilities** | Related helper functions | Mixing different utility types or adding I/O |  | **Controllers** | Single endpoint or related endpoints | Mixing unrelated endpoints or business logic |    
**Cohesion over Size**: A 300-line repository handling complete CRUD operations is better than splitting it into fragmented pieces that break logical cohesion.    
    
## Dependencies[Rules for managing dependencies between modules]  ```    
#### ARCHITECTURE.md Template  
  
```markdown  # System Architecture  ## Executive Summary[Overview in plain English]    
    
## System Context[Diagram showing system boundaries and external actors]    
    
## Component Architecture[Component diagram with descriptions]    
    
## Data Flow[Sequence diagrams for key workflows]    
    
## Technology Stack- Frontend: [Technology choices]  - Backend: [Technology choices]  - Database: [Technology choices]  - Infrastructure: [Technology choices]    
    
## Non-Functional Requirements- Performance: [Requirements]  - Security: [Requirements]  - Scalability: [Requirements]    
    
## Deployment Architecture[Deployment diagram and description]    
    
## Architecture Decision Records[Key decisions and their rationale]  ```    
## Module Development Workflow  
  
```mermaid  graph TD    
A[Identify Need] --> B[Write Module README]    B --> C[Define Interfaces/Contracts]    C --> D[Write Tests]    D --> E[Implement Module]    E --> F[Refactor if Mixing Concerns]    F --> G[Update Documentation]    G --> H[Code Review]    H --> I[Merge]  ```    
## Universal Module README Template  
  
````markdown  # Module Name  ## PurposeClear, single-sentence description of what this module does and why it exists.    
## Interface```[language-specific interface/contract definition]```    
    
## Dependencies### Internal- Module A: [Why needed]  - Module B: [Why needed]    
    
### External- Library X v1.2.3: [Why needed]  - Service Y: [Why needed]    
    
## Configuration| Variable | Type | Required | Default | Description |  |----------|------|----------|---------|-------------|  | CONFIG_A | string | Yes | - | Configuration purpose |    
    
## Usage Examples```[language-specific examples]```    
    
## Error Handling| Error | Cause | Resolution |  |-------|-------|------------|  | ErrorType1 | What triggers it | How to fix |    
    
## Performance Considerations- Caching strategy  - Rate limits  - Resource usage    
    
## Testing- Unit tests: `[test command]`  - Integration tests: `[test command]`  - Coverage target: 80%    
    
## Maintenance Notes- Known limitations  - Future improvements  - Technical debt  ````    
## Module Splitting Guidelines  
  
### CRITICALLY IMPORTANT - Architectural Principles  
  
#### When to Split Files (Based on Architectural Concerns)  
  
**ALWAYS SPLIT when a module violates these principles:**  
  
1. **Single Responsibility Principle Violations**    
❌ Split when mixing: Domain Logic + I/O Operations + Utilities  
- **Domain Logic**: Business rules, validation, entity behavior, workflows  
- **I/O Operations**: Database calls, file operations, network requests, external APIs  
- **Utilities**: Formatting, parsing, helpers, transformations  
  
1. **Multiple Component/Feature Mixing**    
❌ Split when combining: Multiple unrelated components or features  
- Example: User management + Email sending + Report generation in one file  
- Each component should have its own focused module  
  
1. **Layer Boundary Violations**    
❌ Split when mixing: Different architectural layer concerns  
- Example: Database operations + Business logic + Presentation formatting  
  
#### When NOT to Split Files  
  
**KEEP INTACT when modules follow established patterns and remain cohesive:**  
  
1. **Repository Pattern**: All CRUD operations for an entity belong together  
    - *Exception*: If repository mixes business rules with I/O, extract business rules to separate domain service  
2. **Service Pattern**: All operations for a business capability belong together  
    - *Exception*: If service mixes orchestration + I/O + utilities, separate by concern type  
3. **Entity Pattern**: All behavior for a domain entity belongs together  
    - *Exception*: If entity includes I/O operations, extract those to repository  
4. **Adapter Pattern**: All operations for external integration belong together  
    - *Exception*: If adapter includes business logic, extract to separate domain component  
  
**Resolution Rule**: When pattern cohesion conflicts with SRP, prioritize SRP and create coordinating services to maintain pattern benefits.  
  
#### Splitting Strategies  
  
**Strategy 1: Separate by Concern Type**  
  
❌ mixed_service.py (Domain + I/O + Utils)✅ business_workflow.py (Domain only)✅ data_repository.py (I/O only)  ✅ format_utils.py (Utils only)  
  
**Strategy 2: Separate by Component**  
  
❌ user_email_report_service.py (3 components)✅ user_service.py (User component)✅ email_service.py (Email component)✅ report_service.py (Report component)  
  
**Strategy 3: Separate by Layer***  
  
❌ mixed_handler.py (Controller + Business + Data)✅ user_controller.py (Presentation layer)✅ user_service.py (Application layer)✅ user_repository.py (Infrastructure layer)```  
  
### Quality Metrics (Supporting Guidelines)  
  
#### Complexity Indicators (Review Triggers)  
- Cyclomatic Complexity: >10 suggests review needed  
- Cognitive Complexity: >15 suggests complexity reduction  
- File Dependencies: >8 imports suggests tight coupling  
- Class Methods: >12 public methods suggests multiple responsibilities  
- Function Parameters: >4 parameters suggests complex interface  
  
*These metrics indicate when to review code quality, not automatic splitting triggers.*  
  
## Package API Design  
  
### The Barrel Pattern for __init__.py Files  
  
#### CRITICALLY IMPORTANT - Stable API Guidelines  
  
**Purpose**: `__init__.py` files should provide clean, stable APIs that hide internal implementation details.  
  
#### When to Create Barrel Exports  
  
**ALWAYS export public APIs from package-level __init__.py:**  
  
1. **Domain Layer Packages**  
   ```python    
# src/domain/__init__.py    
from .entities.message import Message   from .entities.person import Person   from .entities.chat_session import ChatSession   from .enums.message_type import MessageType      __all__ = ['Message', 'Person', 'ChatSession', 'MessageType']    
   ```  2. **Application Layer Packages**  
   ```python    
# src/application/services/__init__.py    
from .telegram_parsing_service import TelegramParsingService   from .validation_service import ValidationService   from .data_migration_service import DataMigrationService      __all__ = ['TelegramParsingService', 'ValidationService', 'DataMigrationService']    
   ```  3. **Infrastructure Layer Packages**  
   ```python    
# src/infrastructure/databases/__init__.py    
from .neo4j import Neo4jClient   from .qdrant import QdrantClient      __all__ = ['Neo4jClient', 'QdrantClient']    
   ```  #### What Makes a Good Barrel  
  
**✅ GOOD Barrel Characteristics:**  
- **Small & Focused**: Typically 20-50 lines, up to 80 lines for complex packages  
- **Stable Interface**: Only public APIs exported  
- **Clear Purpose**: Single-sentence docstring  
- **Complete __all__**: All exports explicitly listed  
- **No Business Logic**: Pure re-exports only  
  
**❌ BAD Barrel Anti-patterns:**  
- Complex initialization code  
- Business logic in __init__.py  
- Importing private modules  
- Missing __all__ declarations  
- Exposing internal implementation details  
  
#### API Stability Guidelines  
  
**Enable Clean Import Patterns:**  
```python  # ✅ GOOD - Clean package-level importsfrom src.domain import Message, Person  from src.application.services import TelegramParsingService  from src.infrastructure.databases import Neo4jClient    
    
# ❌ BAD - Deep implementation importsfrom src.domain.entities.message import Message  from src.application.services.telegram_parsing_service import TelegramParsingService  from src.infrastructure.databases.neo4j.neo4j_client import Neo4jClient    
```    
**Benefits of Proper Barrel Pattern:**  
- **Refactoring Safety**: Internal file moves don't break external imports  
- **Clean API**: Hide implementation complexity from consumers  
- **Documentation**: Clear public API surface  
- **IDE Support**: Better autocomplete and documentation  
- **Dependency Management**: Control what external code can access  
  
#### Package-Level Documentation  
  
**Template for Package __init__.py:**  
```python  """  [Package Name] - [Single sentence describing package purpose]    
    
This package provides [core functionality description].    
    
Example:    
    from src.domain import Message, Person        message = Message(id="123", content="Hello", ...)    
    person = Person(name="Alice", ...)"""    
    
from .submodule import PublicClass  from .another_submodule import AnotherPublicClass    
    
__all__ = [    
'PublicClass',    'AnotherPublicClass',]    
```    
## Development Checklist  
  
### Pre-Development  
  
```  □ Problem clearly defined  □ README written  □ Interfaces designed  □ Dependencies identified  □ Tests outlined  □ Performance requirements defined  ```    
### During Development  
  
```  □ Following README-driven approach with TDD implementation (Document → Test → Code)  □ Maintaining single responsibility per module  □ Separating domain logic, I/O operations, and utilities  □ Updating documentation as implementation evolves  □ Adding error handling  □ Including logging  □ Considering edge cases  □ Keeping architectural layers properly separated  ```    
### Pre-Commit  
  
```  □ All tests passing  □ Coverage meets threshold (80%+)  □ No modules mixing domain logic + I/O + utilities  □ Single responsibility principle maintained  □ Package APIs properly exposed via __init__.py  □ Layer boundaries respected (no architectural violations)  □ Documentation updated  □ No linting errors  □ No security vulnerabilities  □ Performance benchmarks met  ```    
### Pre-Release  
  
```  □ Integration tests passing  □ API documentation generated  □ CHANGELOG updated  □ Version bumped appropriately  □ Migration guide written (if breaking changes)  □ Performance regression tests passing  ```    
## Layer Boundaries & Rules  
  
### Dependency Direction  
  
```  Presentation → Application → Domain ← Infrastructure  ```    
### Layer Responsibilities  
  
|Layer|Responsibilities|Forbidden|Dependencies|  |---|---|---|---|  |Presentation|User interaction, Input validation, Response formatting|Business logic, Direct DB access|→ Application|  |Application|Orchestration, Use cases, Transaction boundaries|UI concerns, Direct infrastructure calls|→ Domain, → Infrastructure interfaces|  |Domain|Business rules, Entities, Value objects|External dependencies, Framework code|← (No dependencies)|  |Infrastructure|External services, Persistence, Third-party integrations|Business logic, UI concerns|→ Domain interfaces only|    
**Dependency Rule**: Infrastructure implements Domain interfaces but never depends on concrete Domain implementations. Application coordinates between Domain and Infrastructure through interfaces.  
  
## Common Design Patterns  
  
### Service Pattern  
  
```  Service/  ├── README.md  ├── service.interface   # Contract definition  ├── service.impl       # Implementation  ├── service.test       # Tests  └── index             # Public exports  ```    
### Repository Pattern  
  
```  Repository/  ├── README.md  ├── repository.interface  ├── repository.memory    # In-memory implementation  ├── repository.sql      # SQL implementation  └── repository.test  ```    
### Use Case Pattern  
  
```  UseCase/  ├── README.md  ├── use-case.input     # Input DTO  ├── use-case.output    # Output DTO  ├── use-case.impl      # Implementation  └── use-case.test  ```    
## Quality Gates  
  
### Code Quality Metrics  
  
```  □ Code Coverage > 80%  □ Duplication < 3%  □ Technical Debt Ratio < 5%  □ Maintainability Rating: A  □ Reliability Rating: A  □ Security Rating: A  ```    
### Documentation Quality  
  
```  □ All public APIs documented  □ Examples provided for complex features  □ Changelog maintained  □ Architecture decisions recorded  □ README files up-to-date  ```    
### Performance Metrics  
  
```  □ Response time < defined SLA  □ Memory usage within limits  □ CPU usage acceptable  □ No memory leaks  □ Database queries optimized  ```    
## Anti-Patterns to Avoid  
  
### ❌ **Don't:**  
  
- Create monolithic modules that violate SRP (mix domain/I/O/utilities)  
- Mix concerns across architectural layers  
- Skip error handling  
- Use magic numbers/strings  
- Ignore performance implications  
- Create circular dependencies  
- Document after implementation (conflicts with Document First principle)  
- Use unclear variable names  
- Skip tests for "simple" code  
- Assume context without documentation  
  
### ✅ **Do:**  
  
- Keep modules focused (SRP)  
- Maintain clear layer boundaries  
- Handle all error cases explicitly  
- Use configuration/constants  
- Profile and optimize when needed  
- Design clear dependency graphs  
- Write documentation first  
- Use descriptive, meaningful names  
- Test everything, including edge cases  
- Document assumptions and decisions  
  
## Migration Strategy Template  
  
### Phase 1: Foundation (Week 1)  
  
```  □ Set up project structure  □ Configure development environment  □ Establish CI/CD pipeline  □ Create initial documentation  ```    
### Phase 2: Core Features (Week 2-3)  
  
```  □ Implement critical path  □ Build essential services  □ Create basic UI/API  □ Set up monitoring  ```    
### Phase 3: Enhancement (Week 4-5)  
  
```  □ Add secondary features  □ Improve error handling  □ Optimize performance  □ Enhance documentation  ```    
### Phase 4: Hardening (Week 6)  
  
```  □ Security audit  □ Performance testing  □ Documentation review  □ Deployment preparation  ```    
## Success Criteria  
  
### Feature Completion Definition  
  
```  □ Feature README exists and is complete  □ All acceptance criteria met  □ Tests written and passing (>80% coverage)  □ Code reviewed and approved  □ Documentation updated  □ Performance benchmarks met  □ Security requirements satisfied  □ Monitoring/logging in place  □ Feature flag configured (if applicable)  □ Rollback plan documented  ```    
## Quick Reference Cards  
  
### Starting a New Module  
  
1. Create module directory  
2. Write comprehensive README  
3. Define public interface  
4. Write test cases  
5. Implement functionality  
6. Refactor if needed  
7. Update documentation  
8. Submit for review  
  
### Adding a Service  
  
1. Document service contract in README  
2. Define interface/types  
3. Create mock implementation  
4. Write integration tests  
5. Implement real service  
6. Add error handling  
7. Include retry logic  
8. Document configuration  
  
### Creating a Component  
  
1. Design component API  
2. Document props/inputs  
3. Create visual tests  
4. Build component  
5. Add accessibility  
6. Optimize performance  
7. Document usage  
8. Export properly  
  
## Tooling Recommendations  
  
### Documentation  
  
- API: OpenAPI/Swagger, API Blueprint  
- Code: JSDoc, Javadoc, Sphinx  
- Architecture: C4 Model, PlantUML  
- Decisions: ADR Tools, MADR  
  
### Quality Assurance  
  
- Linting: ESLint, Pylint, RuboCop  
- Formatting: Prettier, Black, gofmt  
- Testing: Jest, Pytest, JUnit  
- Coverage: Istanbul, Coverage.py  
  
### Monitoring  
  
- Complexity: SonarQube, CodeClimate  
- Dependencies: Snyk, npm audit  
- Performance: Lighthouse, JMeter  
  
---    
_This framework establishes a documentation-first approach to software development, ensuring clarity, maintainability, and scalability across any project or technology stack._