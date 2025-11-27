# n8n Webhook Integration Standards (GL-N8N-INTEGRATION)

**Version**: 1.0
**Last Updated**: November 27, 2024
**Status**: Active Development Guidelines
**Related**: [GL-TDD.md](./GL-TDD.md), [GL-ERROR-LOGGING.md](./GL-ERROR-LOGGING.md), [webhook_guidance.md](./DIRECTIONS/webhook_guidance.md)

---

## Purpose

This guideline establishes standardized patterns for integrating n8n webhook workflows into the Clarioo application, ensuring consistency, reliability, and maintainability across all AI-powered features.

---

## Core Principles

### 1. Centralized Configuration
- All webhook URLs managed in `/src/config/webhooks.ts`
- Dual-mode support (production/testing) for all endpoints
- Mode selection persists in localStorage
- Never hardcode webhook URLs in service files

### 2. Predictable Timeout Handling
- Every webhook call MUST use AbortController with explicit timeout
- Standard timeouts: 120s (default), 180s (vendor search), 30s (email)
- User-friendly timeout messages without technical jargon
- Automatic retry logic for user-initiated actions

### 3. Comprehensive Error Handling
- Follow GL-ERROR-LOGGING standards for all n8n errors
- Structured error responses with codes and user-friendly messages
- Silent retry for background operations (e.g., email collection)
- User-facing retry buttons for critical operations

### 4. Device Metadata Collection
- Collect device metadata for all user-triggered webhooks
- Use `/src/utils/deviceMetadata.ts` utilities
- Include browser, OS, device type, screen resolution, timezone
- Privacy-conscious: No PII beyond what user explicitly provides

### 5. localStorage Persistence
- Save all n8n responses to localStorage for offline access
- Use consistent key naming: `clarioo_{feature}_{dataType}`
- Include metadata: version, timestamp for all stored data
- Implement data versioning for future migrations

---

## Webhook URL Standards

### URL Conventions

**Production URLs**:
```
https://n8n.lakestrom.com/webhook/clarioo-{feature-name}
```

**Testing URLs**:
```
https://n8n.lakestrom.com/webhook/{uuid-v4}
```

**Examples**:
- Project Creation: `https://n8n.lakestrom.com/webhook/clarioo-project-creation`
- Email Collection: `https://n8n.lakestrom.com/webhook/clarioo-email-collection`

### Configuration Pattern

All webhooks MUST be defined in `/src/config/webhooks.ts`:

```typescript
const PRODUCTION_WEBHOOKS = {
  PROJECT_CREATION: 'https://n8n.lakestrom.com/webhook/clarioo-project-creation',
  CRITERIA_CHAT: 'https://n8n.lakestrom.com/webhook/clarioo-criteria-chat',
  // ... additional webhooks
} as const;

const TESTING_WEBHOOKS = {
  PROJECT_CREATION: 'https://n8n.lakestrom.com/webhook/c53c2c35-08ea-4171-8e71-ac06c6628115',
  CRITERIA_CHAT: 'https://n8n.lakestrom.com/webhook/7b57ec80-4343-43f0-9cb3-36e0dc383c0a',
  // ... additional webhooks
} as const;
```

### Getter Functions

Always use getter functions, never access webhooks object directly:

```typescript
// ✅ Correct
const url = getProjectCreationUrl();

// ❌ Wrong
const url = PRODUCTION_WEBHOOKS.PROJECT_CREATION;
```

---

## Request/Response Standards

### Request Format

All n8n requests MUST include:

```typescript
interface N8nBaseRequest {
  user_id: string;          // UUID v4 from localStorage
  session_id: string;       // UUID v4 from sessionStorage
  timestamp: string;        // ISO 8601 format
  device_metadata?: DeviceMetadata; // For user-triggered requests
}
```

**Example**:
```typescript
const request: N8nProjectCreationRequest = {
  user_id: getUserId(),
  session_id: getSessionId(),
  company_context: "We are a mid-sized SaaS company",
  solution_requirements: "Looking for CRM software",
  timestamp: new Date().toISOString(),
  device_metadata: getDeviceMetadata()
};
```

### Response Format

All n8n responses MUST follow this structure:

```typescript
interface N8nBaseResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Success Response**:
```json
{
  "success": true,
  "project": { ... },
  "criteria": [ ... ]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "AI_PROCESSING_FAILED",
    "message": "Unable to generate criteria. Please try again.",
    "details": { ... }
  }
}
```

---

## Timeout Handling

### Standard Timeout Values

| Webhook | Timeout | Rationale |
|---------|---------|-----------|
| Project Creation | 120s (2 min) | GPT-4o-mini generation with 10-15 criteria |
| Criteria Chat | 120s (2 min) | AI refinement of single criterion |
| Find Vendors | 180s (3 min) | Vendor search may require external API calls |
| Compare Vendors | 120s (2 min) | Criterion-by-criterion analysis |
| Executive Summary | 120s (2 min) | Summary generation from comparison data |
| Email Collection | 30s | Simple validation and Google Sheets write |

### Implementation Pattern

Always use AbortController with timeout:

```typescript
const TIMEOUT_MS = 120000; // 120 seconds

async function createProjectWithAI(data: N8nProjectCreationRequest): Promise<N8nProjectCreationResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(getProjectCreationUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('AI processing took too long. Please try again with simpler requirements.');
    }

    throw error;
  }
}
```

---

## Error Handling Patterns

### Error Classification

Follow GL-ERROR-LOGGING.md categories:

1. **Network Errors** → Infrastructure Error
2. **Timeout Errors** → Infrastructure Error
3. **AI Processing Errors** → Integration Error
4. **Invalid Input** → Domain Error
5. **Invalid Response** → Integration Error

### Error Response Handling

```typescript
try {
  const result = await createProjectWithAI(request);

  if (!result.success) {
    // Handle n8n-reported error
    logger.error('n8n API error', {
      error_code: result.error?.code,
      error_message: result.error?.message,
      request_id: session_id
    });

    throw new Error(result.error?.message || 'AI processing failed');
  }

  return result;
} catch (error) {
  // Handle network/timeout errors
  logger.error('n8n request failed', {
    error: error.message,
    error_type: error.name === 'AbortError' ? 'timeout' : 'network',
    webhook_url: getProjectCreationUrl()
  });

  throw error;
}
```

### User-Friendly Error Messages

Never expose technical errors to users:

```typescript
// ❌ Wrong
throw new Error('Failed to fetch from https://n8n.lakestrom.com/webhook/...');

// ✅ Correct
throw new Error('Unable to create project. Please check your internet connection and try again.');
```

---

## Retry Logic Standards

### Silent Retry Pattern

Use for background operations:

```typescript
async function retryEmailCollection(): Promise<boolean> {
  const emailData = getEmailFromStorage();

  if (!emailData || emailData.email_passed_to_n8n) {
    return false; // No retry needed
  }

  try {
    await collectEmail(emailData.email, emailData.device_metadata);
    markEmailPassedToN8n();
    return true;
  } catch (error) {
    logger.warning('Email collection retry failed', {
      error: error.message,
      retry_count: emailData.retry_count || 0
    });
    return false;
  }
}
```

### User-Initiated Retry

Use for critical operations:

```typescript
const { createProject, isCreating, error, clearError } = useProjectCreation();

// In component
{error && (
  <div className="error-container">
    <p className="error-message">{error}</p>
    <button onClick={() => {
      clearError();
      createProject(formData);
    }}>
      Try Again
    </button>
  </div>
)}
```

---

## localStorage Persistence Patterns

### Key Naming Convention

```
clarioo_{feature}_{dataType}
```

**Examples**:
- `clarioo_user_id` - Persistent user ID
- `clarioo_projects` - Array of projects
- `criteria_${projectId}` - Criteria for specific project
- `email_submitted` - Boolean flag
- `clarioo_webhook_mode` - production | testing

### Data Structure Versioning

Always wrap data in versioned structure:

```typescript
interface StoredData<T> {
  version: string;
  timestamp: string;
  data: T;
}

// Save
function saveProjectToStorage(project: Project): void {
  const stored: StoredData<Project> = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: project
  };

  localStorage.setItem(`clarioo_project_${project.id}`, JSON.stringify(stored));
}

// Load
function getProjectFromStorage(projectId: string): Project | null {
  const raw = localStorage.getItem(`clarioo_project_${projectId}`);
  if (!raw) return null;

  try {
    const stored: StoredData<Project> = JSON.parse(raw);

    // Version migration logic here if needed
    if (stored.version !== '1.0') {
      return migrateProject(stored);
    }

    return stored.data;
  } catch (error) {
    logger.error('Failed to parse project from storage', { projectId, error });
    return null;
  }
}
```

### Quota Management

Always handle QuotaExceededError:

```typescript
function saveToStorage(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      logger.warning('localStorage quota exceeded', { key });

      // Clear old data
      clearOldProjects();

      // Retry
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (retryError) {
        logger.error('Failed to save after quota cleanup', { key });
        return false;
      }
    }

    logger.error('localStorage write failed', { key, error });
    return false;
  }
}
```

---

## Device Metadata Collection

### Standard Fields

Use `getDeviceMetadata()` from `/src/utils/deviceMetadata.ts`:

```typescript
interface DeviceMetadata {
  browser: string;          // "Chrome", "Firefox", "Safari", "Edge", etc.
  os: string;               // "Windows", "macOS", "iOS", "Android", "Linux"
  device_type: string;      // "mobile", "tablet", "desktop"
  screen_resolution: string; // "1920x1080"
  timezone: string;         // "America/New_York"
  user_agent: string;       // Full user agent string
}
```

### When to Collect

Collect device metadata for:
- ✅ User-triggered webhook calls (project creation, email collection)
- ✅ First-time interactions (email collection modal)
- ❌ Background retries (use cached metadata)
- ❌ Chat interactions (optional, only if needed for analytics)

### Privacy Considerations

- Device metadata is analytics data, NOT personally identifiable information
- Combine with user_id (UUID) for aggregated analytics
- Never combine device metadata with email or name in same table without consent
- Document device metadata collection in privacy policy

---

## Testing Standards

### MSW (Mock Service Worker) Setup

Mock all n8n webhooks in tests:

```typescript
// test/mocks/n8nHandlers.ts
import { rest } from 'msw';
import { getProjectCreationUrl } from '@/config/webhooks';

export const n8nHandlers = [
  rest.post(getProjectCreationUrl(), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        project: { id: 'test-project-1', name: 'Test Project' },
        criteria: [
          { id: 'crit_1', name: 'Security', importance: 'high', type: 'technical' }
        ]
      })
    );
  }),

  // Timeout scenario
  rest.post(getProjectCreationUrl(), async (req, res, ctx) => {
    await new Promise(resolve => setTimeout(resolve, 125000)); // 125s > 120s timeout
    return res(ctx.status(408), ctx.json({ error: 'Timeout' }));
  }),

  // Error scenario
  rest.post(getProjectCreationUrl(), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: false,
        error: {
          code: 'AI_PROCESSING_FAILED',
          message: 'Unable to generate criteria'
        }
      })
    );
  })
];
```

### Test Coverage Requirements

Per GL-TDD.md, all n8n integration code MUST have:

- **Unit Tests**: Service functions (80% coverage minimum)
- **Integration Tests**: API calls with MSW mocking
- **Error Handling Tests**: Timeout, network failure, invalid response
- **Retry Logic Tests**: Silent retry and user-initiated retry

**Example**:
```typescript
describe('n8nService', () => {
  describe('createProjectWithAI', () => {
    it('should create project with valid inputs', async () => {
      const result = await createProjectWithAI(validRequest);
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.criteria).toHaveLength(10);
    });

    it('should handle timeout (120s)', async () => {
      await expect(createProjectWithAI(validRequest)).rejects.toThrow('AI processing took too long');
    });

    it('should handle network failure', async () => {
      server.use(
        rest.post(getProjectCreationUrl(), (req, res) => res.networkError('Failed to connect'))
      );

      await expect(createProjectWithAI(validRequest)).rejects.toThrow();
    });

    it('should handle invalid response format', async () => {
      server.use(
        rest.post(getProjectCreationUrl(), (req, res, ctx) => res(ctx.json({ invalid: 'response' })))
      );

      await expect(createProjectWithAI(validRequest)).rejects.toThrow();
    });

    it('should save to localStorage on success', async () => {
      await createProjectWithAI(validRequest);
      const stored = localStorage.getItem('clarioo_projects');
      expect(stored).toBeDefined();
    });
  });
});
```

---

## Webhook Mode Management

### Switching Modes

Provide UI toggle for development/testing:

```typescript
// src/components/WebhookModeToggle.tsx
import { getWebhookMode, setWebhookMode } from '@/config/webhooks';
import { useState, useEffect } from 'react';

export function WebhookModeToggle() {
  const [mode, setMode] = useState<'production' | 'testing'>('production');

  useEffect(() => {
    setMode(getWebhookMode());
  }, []);

  const handleToggle = (newMode: 'production' | 'testing') => {
    setWebhookMode(newMode);
    setMode(newMode);
    window.location.reload(); // Reload to apply new URLs
  };

  return (
    <div className="webhook-mode-toggle">
      <label>Webhook Mode:</label>
      <select value={mode} onChange={(e) => handleToggle(e.target.value as 'production' | 'testing')}>
        <option value="production">Production</option>
        <option value="testing">Testing</option>
      </select>
      <p className="text-xs text-gray-500">
        {mode === 'production' ? 'Using live n8n workflows' : 'Using test n8n workflows'}
      </p>
    </div>
  );
}
```

### Security Considerations

- Webhook mode toggle should ONLY be visible in development environment
- Production builds MUST force production mode
- Use environment variables to control mode availability:

```typescript
const isDevelopment = import.meta.env.MODE === 'development';

export const getWebhookMode = (): WebhookMode => {
  if (!isDevelopment) {
    return 'production'; // Force production in builds
  }

  const stored = localStorage.getItem(WEBHOOK_MODE_KEY);
  return (stored === 'testing' ? 'testing' : 'production') as WebhookMode;
};
```

---

## Anti-Patterns to Avoid

### ❌ Don't Do This

1. **Hardcoded URLs**:
   ```typescript
   // ❌ Wrong
   const response = await fetch('https://n8n.lakestrom.com/webhook/clarioo-project-creation', ...);
   ```

2. **Missing Timeout**:
   ```typescript
   // ❌ Wrong
   const response = await fetch(url, { method: 'POST', body: JSON.stringify(data) });
   ```

3. **No Error Handling**:
   ```typescript
   // ❌ Wrong
   const result = await createProjectWithAI(data);
   return result.project; // What if result.success is false?
   ```

4. **Technical Error Messages**:
   ```typescript
   // ❌ Wrong
   throw new Error('AbortError: The user aborted a request');
   ```

5. **No Retry Logic**:
   ```typescript
   // ❌ Wrong
   try {
     await collectEmail(email);
   } catch (error) {
     console.error(error); // Just log and ignore?
   }
   ```

### ✅ Do This Instead

1. **Centralized Configuration**:
   ```typescript
   // ✅ Correct
   const response = await fetch(getProjectCreationUrl(), ...);
   ```

2. **Explicit Timeout**:
   ```typescript
   // ✅ Correct
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 120000);
   const response = await fetch(url, { ..., signal: controller.signal });
   ```

3. **Comprehensive Error Handling**:
   ```typescript
   // ✅ Correct
   const result = await createProjectWithAI(data);
   if (!result.success) {
     throw new Error(result.error?.message || 'AI processing failed');
   }
   return result.project;
   ```

4. **User-Friendly Messages**:
   ```typescript
   // ✅ Correct
   if (error.name === 'AbortError') {
     throw new Error('AI processing took too long. Please try again.');
   }
   ```

5. **Silent Retry**:
   ```typescript
   // ✅ Correct
   try {
     await collectEmail(email);
   } catch (error) {
     logger.warning('Email collection failed, will retry later', { error });
     saveEmailForRetry(email);
   }
   ```

---

## Checklist for New n8n Integration

Use this checklist when adding a new n8n webhook:

- [ ] Add webhook URLs to `/src/config/webhooks.ts` (production + testing)
- [ ] Create getter function (e.g., `getNewFeatureUrl()`)
- [ ] Add to `webhook_guidance.md` with production/testing URLs
- [ ] Define request/response types in `/src/types/n8n.types.ts`
- [ ] Implement service function in `/src/services/n8nService.ts`
- [ ] Add timeout handling with AbortController
- [ ] Implement comprehensive error handling (GL-ERROR-LOGGING)
- [ ] Add localStorage persistence for responses
- [ ] Create React hook wrapper (if user-facing)
- [ ] Add device metadata collection (if user-triggered)
- [ ] Write unit tests (MSW mocking, timeout, errors)
- [ ] Write integration tests (hook + service)
- [ ] Verify 80% test coverage (GL-TDD)
- [ ] Update ARCHITECTURE.md with new webhook
- [ ] Add to sprint plan deliverables
- [ ] Document in sprint README

---

## Examples

### Complete n8n Integration Example

See SP_016 and SP_017 implementations for reference:

- **SP_016**: Project creation with criteria generation
- **SP_017**: Email collection with device metadata

**Key Files**:
- `/src/config/webhooks.ts` - Configuration
- `/src/services/n8nService.ts` - Service layer
- `/src/hooks/useProjectCreation.ts` - React hook
- `/src/types/n8n.types.ts` - Type definitions
- `/src/utils/deviceMetadata.ts` - Device detection

---

## References

- **GL-TDD.md**: Testing requirements for n8n integration code
- **GL-ERROR-LOGGING.md**: Error classification and logging standards
- **webhook_guidance.md**: Production and testing webhook URLs
- **ARCHITECTURE.md**: System architecture with n8n integration
- **SP_016**: Example implementation (project creation)
- **SP_017**: Example implementation (email collection)

---

*This guideline is a living document. Update when adding new patterns or lessons learned from n8n integrations.*

**Version**: 1.0
**Created**: November 27, 2024
**Last Updated**: November 27, 2024
**Status**: Active
