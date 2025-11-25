# Test-Driven Development Framework  
  
_A comprehensive, prescriptive framework for implementing Test-Driven Development with specific tool recommendations and Playwright integration guidelines_  
  
## Core Philosophy  
  
Test-Driven Development (TDD) ensures code correctness through a disciplined cycle of writing tests before implementation. When combined with README-Driven Development, tests become the executable specification of documented behavior.  
  
## Integration with README-Driven Development  
  
```  README (Contract) → Test (Specification) → Code (Implementation)  ```    
1. **README defines WHAT** - The contract and expected behavior  
2. **Tests define HOW** - The executable specification  
3. **Code delivers IT** - The minimal implementation  
  
## Fundamental Laws of TDD - STRICTLY FOLLOW  
  
### The Five Commandments  
  
1. **Never write production code without a failing test**
    - Test must exist and fail before implementation
   - **Exception: Infrastructure setup and configuration**
   - **Exception: Visual Prototype Phase (Phase 0)** - During visual prototype development, visual verification through browser testing replaces automated tests. Automated tests are required when transitioning to production phases.  
2. **Never write more test than sufficient to fail**  
    - Including compilation/interpretation failures  
   - One assertion at a time when starting  
3. **Never write more production code than sufficient to pass**  
    - Minimal implementation only  
   - Resist the urge to add "obvious" features  
4. **Never refactor with failing tests**  
    - All tests must be green before refactoring  
   - Run tests after every refactoring step  
5. **Never commit with failing tests**
    - All tests must pass before version control commit
   - Broken tests = broken build

## Visual Prototype Phase Exception

### Phase 0: Visual Prototype Development

During the visual prototype phase (Phase 0), the primary goal is rapid visual iteration and stakeholder feedback. In this phase:

**Testing Approach:**
- **Visual Verification**: Manual browser testing replaces automated unit/integration tests
- **Browser Tools**: Use DevTools, Playwright's Codegen for exploratory testing
- **Mock Services**: All backend functionality uses mock services with JSON data
- **Documentation**: Maintain comprehensive README-driven documentation

**When Automated Tests Are Required:**
- **Production Transition**: All automated tests MUST be written before moving features to production (Phase 1+)
- **Complex Logic**: Business logic in hooks/utilities should have tests even in prototype phase
- **Regression Prevention**: Critical user flows should have E2E tests before stakeholder demos

**Exit Criteria for Prototype Phase:**
- ✅ All features visually verified in target browsers (Chrome, Safari, Firefox)
- ✅ Mobile responsiveness confirmed (350px - 1920px)
- ✅ No console errors during normal usage
- ✅ Mock services properly simulate all backend interactions
- ✅ Comprehensive documentation exists for all features

**Transition to Production:**
When moving from Phase 0 → Phase 1, implement tests in this order:
1. **E2E Tests First** - Critical user flows (Playwright)
2. **Hook/Utility Tests** - Business logic layer (Vitest)
3. **Component Tests** - UI components with complex state (React Testing Library)
4. **Integration Tests** - Multi-component interactions

## Prescribed Technology Stack  
  
### JavaScript/TypeScript Projects  
  
**RECOMMENDED TOOLS** *(alternatives acceptable with justification):*  
  
- **Unit/Integration Testing**: Vitest (preferred - faster than Jest, ESM-first, Jest-compatible)  
- **React Component Testing**: React Testing Library + Vitest  
- **E2E Testing**: Playwright (preferred - superior browser automation and debugging)  
- **API Mocking**: MSW (Mock Service Worker)  
- **Test Data**: Faker.js or equivalent  
- **Coverage**: V8 Coverage via Vitest  
  
### Python Projects  
  
**RECOMMENDED TOOLS** *(alternatives acceptable with justification):*  
  
- **Unit/Integration Testing**: pytest (preferred - superior to unittest)  
- **E2E Testing**: Playwright for Python  
- **API Testing**: pytest + httpx  
- **Mocking**: pytest-mock  
- **Test Data**: Faker or equivalent  
- **Coverage**: pytest-cov  
  
### Java Projects  
  
**RECOMMENDED TOOLS** *(alternatives acceptable with justification):*  
  
- **Unit Testing**: JUnit 5  
- **Mocking**: Mockito  
- **E2E Testing**: Playwright for Java  
- **API Testing**: REST Assured  
- **Test Data**: JavaFaker or equivalent  
- **Coverage**: JaCoCo  
  
### .NET Projects  
  
**RECOMMENDED TOOLS** *(alternatives acceptable with justification):*  
  
- **Unit Testing**: xUnit (preferred - better async support than NUnit)  
- **Mocking**: Moq  
- **E2E Testing**: Playwright for .NET  
- **API Testing**: RestSharp + FluentAssertions  
- **Test Data**: Bogus or equivalent  
- **Coverage**: Coverlet  
  
### Go Projects  
  
**RECOMMENDED TOOLS** *(alternatives acceptable with justification):*  
  
- **Unit Testing**: testing package + testify  
- **Mocking**: mockery  
- **E2E Testing**: Playwright (via TypeScript tests, or native Go E2E framework)  
- **API Testing**: httptest + testify  
- **Test Data**: gofakeit or equivalent  
- **Coverage**: Built-in go test -cover  
  
## Project Test Structure Requirements  
  
### Mandatory Directory Structure  
  
```  project-root/  ├── test/                           # All test-related files  │   ├── unit/                       # Unit tests mirror src structure  │   ├── integration/                # Integration tests by feature  │   ├── e2e/                        # Playwright E2E tests  │   │   ├── fixtures/               # Playwright test fixtures  │   │   ├── pages/                  # Page Object Model classes  │   │   ├── tests/                  # Test specifications  │   │   └── playwright.config.ts    # Playwright configuration  │   ├── fixtures/                   # Shared test data  │   ├── factories/                  # Test data factories  │   ├── mocks/                      # Mock implementations  │   └── helpers/                    # Test utilities  ```    
### File Naming Conventions  
  
|Test Type|Required Pattern|Example|  |---|---|---|  |Unit Test|`[module].test.[ext]`|`user-service.test.ts`|  |Integration|`[feature].integration.test.[ext]`|`auth.integration.test.ts`|  |E2E Test|`[scenario].spec.[ext]`|`checkout.spec.ts`|  |Component|`[Component].test.[ext]`|`Button.test.tsx`|    
## TDD Workflow Requirements  
  
### RED Phase Guidelines  
  
1. **Test Must Fail First**  
    - Run test immediately after writing  
   - Verify failure message is meaningful  
   - If test passes without implementation, test is wrong  
2. **One Test at a Time**  
    - Write single test case  
   - No additional tests until current one passes  
   - Focus on smallest possible behavior  
3. **Use AAA Pattern**  
    - Arrange: Set up test data  
   - Act: Execute function under test  
   - Assert: Verify outcome  
  
### GREEN Phase Guidelines  
  
1. **Minimal Implementation Only**  
    - Write just enough code to pass the current test  
   - No optimization at this stage  
   - No edge case handling (unless currently tested)  
   - No "future-proofing"  
    - *Note: Coverage may temporarily decrease; this will be addressed in REFACTOR phase*  
2. **Run All Tests**  
    - Ensure no regression  
   - All tests must remain green  
   - If other tests fail, fix immediately  
  
### REFACTOR Phase Guidelines  
  
1. **Only When Green**  
    - Never refactor with failing tests  
   - Run tests after each change  
   - Keep changes small  
2. **Maintain Test Coverage**  
    - Overall coverage must not decrease below project minimums  
   - Add tests if uncovered code emerges during refactoring  
   - Remove dead code and corresponding tests  
    - *Exception: Temporary coverage drops during GREEN phase are acceptable if addressed here*  
  
## Playwright E2E Testing Requirements  
  
### Configuration Standards  
  
**Required Playwright Settings:**  
  
- Enable trace on first retry  
- Screenshot on failure only  
- Video on failure only  
- Parallel execution (except in CI)  
- Multiple browser testing (Chrome, Firefox, Safari minimum)  
- Mobile viewport testing required  
  
### Page Object Model Requirements  
  
**Every page must have:**  
  
1. Dedicated page class extending BasePage  
2. All locators defined as class properties  
3. Methods for all user interactions  
4. Assertion methods for validations  
5. No test logic in page objects  
  
### Locator Strategy (Priority Order)  
  
1. **PREFERRED**: Semantic locators  
  
    - `getByRole()` - First choice  
    - `getByLabel()` - For form inputs  
    - `getByText()` - For static text  
    - `getByPlaceholder()` - When no label  
2. **ACCEPTABLE**: Test IDs  
  
    - `getByTestId()` - For complex elements  
   - Use `data-testid` attributes consistently  
3. **FORBIDDEN**: CSS/XPath selectors  
  
   - Never use class-based selectors  
   - Never use ID selectors (except data-testid)  
   - Never use XPath  
  
### E2E Test Categories  
  
**Required test types for each feature:**  
  
1. **Happy Path** (MANDATORY)  
  
   - Complete user journey  
   - All steps must succeed  
   - Verify final state  
2. **Error Handling** (MANDATORY)  
  
   - Network failures  
   - Invalid inputs  
   - Server errors  
   - Timeout scenarios  
3. **Edge Cases** (REQUIRED for critical features)  
  
   - Boundary values  
   - Concurrent actions  
   - Browser back/forward  
   - Page refresh  
4. **Cross-browser** (MANDATORY)  
  
   - Chrome, Firefox, Safari  
   - At least one mobile browser  
5. **Performance** (REQUIRED for user-facing features)  
  
   - Page load time < 3s  
   - Interaction response < 100ms  
   - API calls < 1s  
  
### Playwright Best Practices  
  
**ALWAYS:**  
  
- Use auto-waiting (never `waitForTimeout`)  
- Test user-visible behavior  
- Use semantic locators  
- Implement proper cleanup  
- Use fixtures for common setup  
- Run in headed mode during development  
  
**NEVER:**  
  
- Use arbitrary timeouts  
- Test implementation details  
- Use CSS selectors  
- Skip error scenarios  
- Hardcode test data  
- Share state between tests  
  
## Test Data Management  
  
### Factory Requirements  
  
**Every entity must have:**  
  
1. Factory class with `create()` method  
2. Support for overrides  
3. Batch creation method  
4. Scenario-based creation  
5. Realistic fake data (using Faker.js or equivalent)  
  
### Mock Strategy  
  
**Use the right test double:**  
  
|Scenario|Unit Tests|Integration Tests|Why|  |---|---|---|---|  |External API calls|MSW/Mock Server|MSW/Mock Server|Consistent, shareable across test types|  |Database calls|Mocks/Stubs|In-memory DB|Unit: Fast, isolated; Integration: Real SQL/queries|  |Time-dependent|Fake timers|Fake timers|Deterministic across all test levels|  |File system|Memory FS|Memory FS|No side effects, fast cleanup|  |Random values|Seeded random|Seeded random|Reproducible test results|    
*Use in-memory databases for integration tests to verify actual database interactions while maintaining speed and isolation.*  
  
## Coverage Requirements  
  
#### Base Coverage Thresholds (Build Fails If Not Met)  
  
|Metric|Minimum|Target|Build Fails If|  |---|---|---|---|  |Line Coverage|80%|85%|< 80%|  |Branch Coverage|75%|80%|< 75%|  |Function Coverage|80%|85%|< 80%|  |Statement Coverage|80%|85%|< 80%|    
#### Module-Specific Targets (Above Base Requirements)  
  
|Module Type|Target Coverage|Critical Focus|Minimum Acceptable|  |---|---|---|---|  |API Endpoints|90%|All routes, error handling|85%|  |Business Logic|95%|All decision paths|90%|  |Data Access|85%|CRUD operations|80%|  |UI Components|80%|User interactions|75%|  |Utilities|95%|All functions|85%|  |Configuration|75%|Validation logic|60%|    
*Note: Module-specific targets are goals above the base requirements. Projects should aim for targets but must meet minimums.*  
  
## CI/CD Integration Requirements  
  
### Pre-Commit Hooks (MANDATORY)  
  
```  1. Lint check (must pass)  2. Type check (must pass)  3. Unit tests (must pass)  4. Coverage check (must meet thresholds)  ```    
### Pull Request Gates (MANDATORY)  
  
```  1. All tests pass (100% pass rate)  2. Coverage doesn't decrease  3. No skipped tests  4. E2E tests pass on all browsers  5. Performance benchmarks met  6. Visual regression tests pass (if applicable)  ```    
### Deployment Gates (MANDATORY)  
  
```  1. Full test suite passes  2. E2E smoke tests pass  3. Performance tests pass  4. Security scans pass  5. Rollback tests verified  ```    
## Performance Standards  
  
### Test Execution Time Limits  
  
#### Individual Test Limits  
|Test Type|Maximum Time|Action if Exceeded|  |---|---|---|  |Unit Test|50ms|Investigate, optimize, or mock|  |Integration Test|500ms|Check external calls|  |E2E Test (per scenario)|30s|Optimize selectors and waits|    
#### Test Suite Limits  
|Suite Type|Maximum Time|Health Status|  |---|---|---|  |Unit Suite|2 minutes|Healthy < 2min, Warning 2-5min|  |Integration Suite|3 minutes|Healthy < 3min, Warning 3-8min|  |E2E Suite|10 minutes|Healthy < 8min, Warning 8-12min|  |**Total Test Runtime**|**12 minutes**|**Healthy < 8min, Critical > 15min**|    
### Optimization Requirements  
  
**Mandatory optimizations:**  
  
1. Parallel test execution (except where impossible)  
2. Shared setup between related tests  
3. In-memory databases for integration tests  
4. Mock all external services in unit tests  
5. Reuse test data factories  
  
## Team Collaboration Standards  
  
### Code Review Checklist  
  
**Every PR must verify:**  
  
- [ ] Tests written before implementation  
- [ ] All tests pass  
- [ ] Coverage meets requirements  
- [ ] No skipped or commented tests  
- [ ] Follows naming conventions  
- [ ] Uses appropriate test doubles  
- [ ] Includes error scenarios  
- [ ] E2E tests for user-facing features  
- [ ] Performance within limits  
- [ ] Documentation updated  
  
### Test Maintenance Rules  
  
1. **Broken Test Protocol**  
    - Fix immediately (same day)  
   - Cannot merge other changes until fixed  
   - If cannot fix, must be escalated  
2. **Flaky Test Protocol**  
    - Mark as flaky (with ticket number)  
   - Must be fixed within sprint  
   - Three strikes = test deleted and rewritten  
3. **Test Refactoring**  
    - Only during refactor phase  
   - Must maintain or improve coverage  
   - Must maintain same test cases  
  
## Anti-Patterns to Avoid  
  
### Testing Anti-Patterns  
  
**NEVER DO:**  
  
- Test private methods directly  
- Use production database in tests  
- Share state between tests  
- Test multiple behaviors in one test  
- Use random/non-deterministic data  
- Skip error scenarios  
- Test implementation instead of behavior  
- Use sleep/wait with fixed timeouts  
- Ignore flaky tests  
- Disable failing tests  
  
### Code Smells in Tests  
  
**RED FLAGS:**  
  
- Simple unit tests > 50 lines (E2E tests may be longer for comprehensive scenarios)  
- Complex setup/teardown that obscures test intent  
- Conditional logic in tests  
- Loops in test assertions  
- Tests dependent on execution order  
- Hardcoded values instead of factories  
- Missing error scenarios  
- No negative test cases  
- Testing framework internals  
- Mocking everything (balance with integration testing)  
  
## Migration to TDD  
  
### For Legacy Code  
  
**Phase 1: Stop the Bleeding (Week 1)**  
  
- Add tests for all new code  
- Add tests when fixing bugs  
- Establish test infrastructure  
  
**Phase 2: Critical Path Coverage (Week 2-3)**  
  
- Identify critical user paths  
- Add E2E tests for these paths  
- Add integration tests for key APIs  
  
**Phase 3: Systematic Coverage (Week 4-8)**  
  
- Target 20% coverage increase per sprint  
- Focus on high-risk areas first  
- Refactor untestable code  
  
**Phase 4: Maintenance Mode (Ongoing)**  
  
- Maintain coverage above 80%  
- All new code follows TDD  
- Regular test health reviews  
  
## Success Metrics  
  
### TDD Health Indicators  
  
|Metric|Healthy|Warning|Critical|Action Required|  |---|---|---|---|---|  |Coverage|≥ 85%|70-84%|< 70%|Review uncovered critical paths|  |Test Execution Time|< 8 min|8-12 min|> 15 min|Optimize or parallelize|  |Flaky Test Rate|< 1%|1-5%|> 5%|Fix or rewrite flaky tests|  |Test/Code Ratio|≥ 1.2:1|0.8-1.2:1|< 0.8:1|Add missing test coverage|  |Bug Escape Rate|< 5%|5-10%|> 10%|Review test strategy|    
*Note: Test execution time refers to total time for all automated tests (unit + integration + E2E)*  
  
### Consolidated Quality Gates  
  
**Build must fail if:**  
  
#### Pre-Commit Level  
- Linting errors present  
- Type errors exist  
- Unit tests fail  
- Coverage decreases below project minimum  
  
#### Pull Request Level  
- Any test fails (unit, integration, E2E)  
- Coverage decreases from baseline  
- Performance regression detected (> 20% degradation)  
- Security vulnerabilities found (medium+ severity)  
  
#### Deployment Level  
- Full test suite fails  
- E2E smoke tests fail  
- Security scans fail (any severity)  
- Performance benchmarks not met  
  
## Quick Reference  
  
### TDD Cycle Checklist  
  
```  □ README/Documentation exists  □ Test file created  □ Test written and failing (RED)  □ Minimal code written (GREEN)  □ All tests still passing  □ Code refactored if needed (REFACTOR)  □ Coverage meets requirements  □ Documentation updated  □ Ready to commit  ```    
### Essential Commands  
  
|Action|Command|When|  |---|---|---|  |Run unit tests|`npm test` / `pytest`|After every change|  |Run E2E tests|`npm run e2e`|Before commit|  |Check coverage|`npm run coverage`|Before PR|  |Run specific test|`npm test -- [file]`|During development|  |Debug test|`npm test -- --inspect`|When test fails|    
    
---    
_This framework establishes TDD as the quality backbone of software development, with prescriptive tool choices and strict guidelines for implementation. Follow these guidelines exactly for consistent, high-quality test coverage._