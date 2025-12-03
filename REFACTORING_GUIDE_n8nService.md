# Refactoring Guide: n8nService.ts

**Current File**: `/src/services/n8nService.ts` (1,269 lines)
**Status**: CRITICAL - God Object - Multiple unrelated responsibilities
**Complexity**: Very High - 35+ exported functions
**Impact**: HIGH - Used throughout application

---

## Problem Statement

The n8nService.ts file violates GL-RDD's Single Responsibility Principle by bundling **4 distinct architectural concerns** into a single file:

1. **n8n Workflow Communication** (external API calls)
2. **Local Storage Persistence** (localStorage operations)
3. **Data Transformation** (mapping/formatting)
4. **Session/User Management** (auth state)

This makes the file:
- Difficult to navigate (35+ functions)
- Hard to test (mixed concerns)
- Prone to circular logic (all layers mixed)
- Violates layer boundaries (should be Infrastructure → Domain)

---

## Current Architecture (Incorrect)

```
n8nService.ts (1,269 lines)
├── Config
│   ├── TIMEOUT_MS
│   └── VENDOR_SEARCH_TIMEOUT_MS
├── Types (7 interfaces)
│   ├── ChatMessage
│   ├── CriteriaChatRequest
│   ├── CriteriaAction
│   ├── CriteriaChatResponse
│   ├── VendorSearchRequest
│   ├── DiscoveredVendor
│   └── VendorSearchResponse
├── User/Session Management (2 functions)
│   ├── getUserId()
│   └── getSessionId()
├── Data Transformation (2 functions)
│   ├── transformN8nCriterion()
│   └── transformN8nProject()
├── n8n API Calls (5 functions)
│   ├── createProjectWithAI()
│   ├── sendCriteriaChat()
│   ├── findVendors()
│   ├── compareVendor()
│   └── generateExecutiveSummary()
├── Email Collection (3 functions)
│   ├── collectEmail()
│   ├── retryEmailCollection()
│   └── Additional helpers
├── Project Storage (7 functions)
│   ├── saveProjectToStorage()
│   ├── getProjectsFromStorage()
│   ├── getProjectByIdFromStorage()
│   ├── updateProjectInStorage()
│   ├── deleteProjectFromStorage()
│   ├── getProjectsFromStorage()
│   └── Index operations
├── Criteria Storage (3 functions)
│   ├── saveCriteriaToStorage()
│   ├── getCriteriaFromStorage()
│   └── updateCriteriaInStorage()
├── Executive Summary Storage (3 functions)
│   ├── saveExecutiveSummaryToStorage()
│   ├── getExecutiveSummaryFromStorage()
│   └── clearExecutiveSummaryFromStorage()
└── Email Storage (3 functions)
    ├── getEmailFromStorage()
    ├── saveEmailToStorage()
    └── Additional helpers
```

---

## Target Architecture (Correct)

```
services/
├── n8n/                          # n8n API Communication Layer
│   ├── README.md                 # Service documentation
│   ├── projectService.ts         # createProjectWithAI()
│   ├── criteriaService.ts        # sendCriteriaChat()
│   ├── vendorService.ts          # findVendors(), compareVendor()
│   ├── summaryService.ts         # generateExecutiveSummary()
│   ├── emailService.ts           # collectEmail(), retryEmailCollection()
│   ├── transformers.ts           # Data transformation utilities
│   ├── types.ts                  # Shared interfaces
│   ├── config.ts                 # Timeout constants
│   └── index.ts                  # Public API exports (barrel)
├── storage/                       # Persistence Layer
│   ├── README.md
│   ├── projectStorage.ts         # saveProject, getProject, updateProject, deleteProject
│   ├── criteriaStorage.ts        # saveCriteria, getCriteria, updateCriteria
│   ├── executiveSummaryStorage.ts # saveSummary, getSummary, clearSummary
│   ├── emailStorage.ts           # saveEmail, getEmail, hasSubmitted, needsRetry
│   ├── types.ts                  # Storage types
│   └── index.ts                  # Public API exports
└── session/                       # Session/Auth Layer
    ├── README.md
    ├── sessionService.ts         # getUserId(), getSessionId()
    ├── types.ts
    └── index.ts
```

---

## Detailed Refactoring Steps

### Phase 1: Create New Directory Structure

```bash
# Create new service directories
mkdir -p src/services/n8n
mkdir -p src/services/storage
mkdir -p src/services/session
```

### Phase 2: Extract Configuration

**File**: `src/services/n8n/config.ts`

```typescript
/**
 * n8n Service Configuration
 *
 * Defines timeout values for n8n workflow calls
 */

export const N8N_TIMEOUTS = {
  /** Default timeout for project creation and criteria chat */
  DEFAULT: 120000, // 2 minutes

  /** Timeout for vendor search operations */
  VENDOR_SEARCH: 180000, // 3 minutes

  /** Timeout for vendor comparison operations */
  VENDOR_COMPARISON: 180000, // 3 minutes
} as const;

export const getTimeout = (operation: 'default' | 'vendorSearch' | 'vendorComparison'): number => {
  const timeoutMap = {
    default: N8N_TIMEOUTS.DEFAULT,
    vendorSearch: N8N_TIMEOUTS.VENDOR_SEARCH,
    vendorComparison: N8N_TIMEOUTS.VENDOR_COMPARISON,
  };
  return timeoutMap[operation];
};
```

### Phase 3: Extract Types

**File**: `src/services/n8n/types.ts`

Move all n8n-related interfaces:
```typescript
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CriteriaChatRequest {
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  criteria: TransformedCriterion[];
  user_message: string;
  chat_history: ChatMessage[];
  timestamp: string;
}

// ... other interfaces
```

### Phase 4: Extract Session Service

**File**: `src/services/session/sessionService.ts` (50-60 lines)

```typescript
/**
 * Session Management Service
 *
 * Handles user ID and session ID generation and persistence
 * using browser storage mechanisms (localStorage, sessionStorage)
 */

/**
 * Get or create a persistent user ID
 * Stored in localStorage, persists across browser sessions
 */
export const getUserId = (): string => {
  let userId = localStorage.getItem('clarioo_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('clarioo_user_id', userId);
  }
  return userId;
};

/**
 * Get or create a session ID
 * Stored in sessionStorage, unique per browser tab/session
 */
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('clarioo_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('clarioo_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Clear session ID (useful for logout)
 */
export const clearSessionId = (): void => {
  sessionStorage.removeItem('clarioo_session_id');
};

/**
 * Clear user ID (useful for account deletion)
 */
export const clearUserId = (): void => {
  localStorage.removeItem('clarioo_user_id');
};
```

**File**: `src/services/session/index.ts`

```typescript
export { getUserId, getSessionId, clearSessionId, clearUserId } from './sessionService';
```

### Phase 5: Extract Data Transformers

**File**: `src/services/n8n/transformers.ts` (60-80 lines)

```typescript
/**
 * Data Transformation Utilities
 *
 * Transforms n8n API responses to application format
 */

import type { N8nCriterion, TransformedCriterion, N8nProjectCreationResponse, TransformedProject } from '@/types';
import { getUserId } from '../session';

/**
 * Transform n8n criterion to app criterion format
 * Maps "description" → "explanation" field
 */
export const transformN8nCriterion = (n8nCriterion: N8nCriterion): TransformedCriterion => ({
  id: n8nCriterion.id,
  name: n8nCriterion.name,
  explanation: n8nCriterion.description, // KEY MAPPING
  importance: n8nCriterion.importance,
  type: n8nCriterion.type,
  isArchived: n8nCriterion.isArchived,
});

/**
 * Transform n8n response to app project format
 */
export const transformN8nProject = (
  n8nResponse: N8nProjectCreationResponse,
  companyContext: string,
  solutionRequirements: string
): TransformedProject => {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: n8nResponse.project!.name,
    description: n8nResponse.project!.description,
    category: n8nResponse.project!.category,
    status: 'in-progress',
    created_at: now,
    updated_at: now,
    user_id: getUserId(),
    techRequest: {
      companyContext,
      solutionRequirements,
    },
  };
};
```

### Phase 6: Extract Project Service

**File**: `src/services/n8n/projectService.ts` (150-180 lines)

```typescript
/**
 * n8n Project Service
 *
 * Handles project creation via n8n AI workflows
 */

import type { N8nProjectCreationRequest, N8nProjectCreationResponse, ProjectCreationResult } from '@/types';
import { getProjectCreationUrl } from '@/config/webhooks';
import { collectDeviceMetadata } from '@/utils/deviceMetadata';
import { getUserId, getSessionId } from '../session';
import { transformN8nProject, transformN8nCriterion } from './transformers';
import { N8N_TIMEOUTS } from './config';

export const createProjectWithAI = async (
  companyContext: string,
  solutionRequirements: string
): Promise<ProjectCreationResult> => {
  // Implementation moved from n8nService.ts
  // ~100 lines of code
};
```

### Phase 7: Extract Criteria Chat Service

**File**: `src/services/n8n/criteriaService.ts` (150-180 lines)

```typescript
/**
 * n8n Criteria Service
 *
 * Handles criteria refinement chat via n8n AI
 */

import type { CriteriaChatRequest, CriteriaChatResponse, ChatMessage, CriteriaAction } from './types';
import { getCriteriaChatUrl } from '@/config/webhooks';
import { getUserId, getSessionId } from '../session';
import { N8N_TIMEOUTS } from './config';

export const sendCriteriaChat = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  projectCategory: string,
  criteria: TransformedCriterion[],
  userMessage: string,
  chatHistory: ChatMessage[]
): Promise<CriteriaChatResponse> => {
  // Implementation moved from n8nService.ts
  // ~80 lines of code
};
```

### Phase 8: Extract Vendor Service

**File**: `src/services/n8n/vendorService.ts` (250-300 lines)

```typescript
/**
 * n8n Vendor Service
 *
 * Handles vendor discovery and comparison via n8n
 */

import type { VendorSearchRequest, VendorSearchResponse, VendorForComparison, SingleVendorComparisonResponse } from './types';
import { getFindVendorsUrl, getCompareVendorsUrl } from '@/config/webhooks';
import { N8N_TIMEOUTS } from './config';

export const findVendors = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  category: string,
  criteria: TransformedCriterion[],
  budget?: string,
  timeframe?: string
): Promise<VendorSearchResponse> => {
  // Implementation moved from n8nService.ts
  // ~90 lines
};

export const compareVendor = async (
  vendor: VendorForComparison,
  criteria: CriteriaChatRequest['criteria'],
  projectName: string,
  projectDescription: string
): Promise<SingleVendorComparisonResponse> => {
  // Implementation moved from n8nService.ts
  // ~110 lines
};
```

### Phase 9: Extract Summary Service

**File**: `src/services/n8n/summaryService.ts` (150-180 lines)

```typescript
/**
 * n8n Executive Summary Service
 *
 * Generates executive summaries of vendor comparisons
 */

import type { ExecutiveSummaryRequest, ExecutiveSummaryResponse } from './types';
import { getExecutiveSummaryUrl } from '@/config/webhooks';
import { N8N_TIMEOUTS } from './config';

export const generateExecutiveSummary = async (
  projectId: string,
  vendorComparisons: ComparedVendor[],
  criteria: Criterion[],
  topVendors: string[]
): Promise<ExecutiveSummaryResponse> => {
  // Implementation moved from n8nService.ts
  // ~120 lines
};
```

### Phase 10: Extract Email Service

**File**: `src/services/n8n/emailService.ts` (150-180 lines)

```typescript
/**
 * n8n Email Collection Service
 *
 * Handles email collection and submission to n8n
 */

import type { EmailCollectionRequest, EmailCollectionResponse } from '@/types';
import { getEmailCollectionUrl } from '@/config/webhooks';
import { getUserId, getSessionId } from '../session';
import { N8N_TIMEOUTS } from './config';

export const collectEmail = async (email: string): Promise<EmailCollectionResponse> => {
  // Implementation moved from n8nService.ts
  // ~130 lines
};

export const retryEmailCollection = async (): Promise<void> => {
  // Implementation moved from n8nService.ts
  // ~40 lines
};
```

### Phase 11: Create Storage Services

**File**: `src/services/storage/projectStorage.ts` (150-180 lines)

```typescript
/**
 * Project Storage Service
 *
 * Handles persistence of project data to localStorage
 */

import type { TransformedProject } from '@/types';

const PROJECTS_STORAGE_KEY = 'clarioo_projects';

export const saveProjectToStorage = (project: TransformedProject): void => {
  // Implementation moved from n8nService.ts
};

export const getProjectsFromStorage = (): TransformedProject[] => {
  // Implementation moved from n8nService.ts
};

export const getProjectByIdFromStorage = (projectId: string): TransformedProject | null => {
  // Implementation moved from n8nService.ts
};

export const updateProjectInStorage = (projectId: string, updates: Partial<TransformedProject>): void => {
  // Implementation moved from n8nService.ts
};

export const deleteProjectFromStorage = (projectId: string): void => {
  // Implementation moved from n8nService.ts
};
```

**File**: `src/services/storage/criteriaStorage.ts` (80-100 lines)

**File**: `src/services/storage/executiveSummaryStorage.ts` (100-120 lines)

**File**: `src/services/storage/emailStorage.ts` (80-100 lines)

### Phase 12: Create Barrel Exports

**File**: `src/services/n8n/index.ts`

```typescript
/**
 * n8n Services
 *
 * Provides AI-powered workflow integration through n8n
 */

// Project creation
export { createProjectWithAI } from './projectService';
export type { ProjectCreationResult } from './projectService';

// Criteria chat
export { sendCriteriaChat } from './criteriaService';
export type { CriteriaAction, CriteriaChatResponse } from './types';

// Vendor discovery & comparison
export { findVendors, compareVendor } from './vendorService';
export type { VendorSearchResponse, SingleVendorComparisonResponse } from './types';

// Executive summary
export { generateExecutiveSummary } from './summaryService';
export type { ExecutiveSummaryResponse } from './types';

// Email collection
export { collectEmail, retryEmailCollection } from './emailService';
export type { EmailCollectionResponse } from '@/types';

// Types
export type { ChatMessage, CriteriaChatRequest } from './types';
```

**File**: `src/services/storage/index.ts`

```typescript
/**
 * Storage Services
 *
 * Provides local persistence layer for application data
 */

// Projects
export {
  saveProjectToStorage,
  getProjectsFromStorage,
  getProjectByIdFromStorage,
  updateProjectInStorage,
  deleteProjectFromStorage,
} from './projectStorage';

// Criteria
export {
  saveCriteriaToStorage,
  getCriteriaFromStorage,
  updateCriteriaInStorage,
} from './criteriaStorage';

// Executive Summary
export {
  saveExecutiveSummaryToStorage,
  getExecutiveSummaryFromStorage,
  clearExecutiveSummaryFromStorage,
} from './executiveSummaryStorage';

// Email
export {
  saveEmailToStorage,
  getEmailFromStorage,
  hasSubmittedEmail,
  needsEmailRetry,
  markEmailPassedToN8n,
} from './emailStorage';
```

**File**: `src/services/session/index.ts`

```typescript
/**
 * Session Services
 *
 * Provides user and session identification management
 */

export { getUserId, getSessionId, clearSessionId, clearUserId } from './sessionService';
```

### Phase 13: Create Service Documentation

**File**: `src/services/n8n/README.md`

```markdown
# n8n Services

Provides AI-powered workflow integration through n8n workflows.

## Services

### projectService
Handles project creation with AI-generated details and initial criteria.

### criteriaService
Manages criteria refinement through n8n chat interface.

### vendorService
Discovers and compares vendors using n8n workflows.

### summaryService
Generates executive summaries of vendor comparisons.

### emailService
Collects and submits user emails to n8n systems.

## Usage

\`\`\`typescript
import { createProjectWithAI, sendCriteriaChat } from '@/services/n8n';

// Create a project
const project = await createProjectWithAI(companyContext, requirements);

// Refine criteria via chat
const response = await sendCriteriaChat(
  projectId,
  projectName,
  projectDescription,
  category,
  criteria,
  userMessage,
  chatHistory
);
\`\`\`

## Configuration

Timeouts can be customized in `config.ts`.

## Error Handling

All services include comprehensive error handling with error codes and messages.
```

---

## Update Import Statements

After creating new services, update all import statements throughout the codebase:

### Before:
```typescript
import {
  createProjectWithAI,
  sendCriteriaChat,
  findVendors,
  saveProjectToStorage,
  getProjectsFromStorage,
  getUserId,
  getSessionId,
} from '@/services/n8nService';
```

### After:
```typescript
import {
  createProjectWithAI,
  sendCriteriaChat,
  findVendors,
} from '@/services/n8n';

import {
  saveProjectToStorage,
  getProjectsFromStorage,
} from '@/services/storage';

import {
  getUserId,
  getSessionId,
} from '@/services/session';
```

---

## Testing Strategy

For each new service, create corresponding test files:

- `src/services/n8n/projectService.test.ts`
- `src/services/n8n/criteriaService.test.ts`
- `src/services/n8n/vendorService.test.ts`
- `src/services/n8n/summaryService.test.ts`
- `src/services/n8n/emailService.test.ts`
- `src/services/storage/projectStorage.test.ts`
- `src/services/storage/criteriaStorage.test.ts`
- `src/services/session/sessionService.test.ts`

---

## Migration Checklist

- [ ] Create new directory structure
- [ ] Extract configuration module
- [ ] Extract types module
- [ ] Extract session service
- [ ] Extract transformers
- [ ] Extract project service
- [ ] Extract criteria service
- [ ] Extract vendor service
- [ ] Extract summary service
- [ ] Extract email service
- [ ] Extract project storage
- [ ] Extract criteria storage
- [ ] Extract summary storage
- [ ] Extract email storage
- [ ] Create barrel exports (index.ts files)
- [ ] Create README documentation
- [ ] Update all import statements throughout codebase
- [ ] Run test suite
- [ ] Fix all import errors
- [ ] Delete original n8nService.ts
- [ ] Code review
- [ ] Merge to main

---

## Benefits After Refactoring

1. **Reduced Complexity**: 1,269 lines → 5 focused files (150-250 lines each)
2. **Better Testability**: Can test each service independently
3. **Clear Responsibility**: Each service has single purpose
4. **Improved Reusability**: Logic not trapped in monolithic file
5. **Easier Maintenance**: Changes isolated to relevant service
6. **Better Documentation**: Each service has clear purpose
7. **Faster Navigation**: Developers can quickly find relevant code

---

## Estimated Effort

- **Planning & Review**: 1 hour
- **Code Extraction**: 6-8 hours
- **Testing & Verification**: 2-3 hours
- **Import Updates**: 1-2 hours
- **Code Review**: 1-2 hours
- **Total**: 11-16 hours (1-2 days)

---

**Status**: Ready for implementation
**Difficulty**: HIGH - Extensive refactoring
**Risk**: MEDIUM - Can be validated with existing tests

