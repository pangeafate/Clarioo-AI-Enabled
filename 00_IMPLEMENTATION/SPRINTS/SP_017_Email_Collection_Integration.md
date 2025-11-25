# Sprint 017: Email Collection Integration with n8n & Google Sheets

**Sprint ID**: SP_017
**Sprint Name**: Email Collection Integration
**Duration**: 1-2 days (8-16 hours)
**Status**: 📋 Planned
**Type**: n8n AI Integration + Frontend Feature
**Priority**: High
**Created**: November 25, 2024

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Sprint Objectives](#sprint-objectives)
3. [Technical Architecture](#technical-architecture)
4. [Key Deliverables](#key-deliverables)
5. [Implementation Plan](#implementation-plan)
6. [Testing Strategy](#testing-strategy)
7. [Exit Criteria](#exit-criteria)
8. [Risk Assessment](#risk-assessment)

---

## Executive Summary

Sprint 017 implements a mandatory email collection system that captures user emails when they first create a project in Clarioo. This feature is critical for user tracking, analytics, and future communication. The system uses a blocking modal that appears when users click "Create with AI", integrates with n8n to store data in Google Sheets, and includes intelligent retry logic for failed submissions.

### Problem Statement
- **No user identification**: Currently, users can create projects without providing any contact information
- **Limited analytics**: Cannot track user engagement or measure conversion funnels
- **No communication channel**: Cannot send product updates, onboarding guidance, or collect feedback

### Solution Overview
- **Blocking modal**: Unskippable pop-up when users click "Create with AI" (first time only)
- **n8n integration**: Email + user_id + device metadata sent to Google Sheets via webhook
- **Intelligent retry**: Silent background retry on failed submissions without bothering users
- **Lottie animation**: Celebratory 1-second cup-with-sparkles animation on success

### Success Metrics
- ✅ 100% email capture rate on project creation
- ✅ < 5 second average time from email submit to project creation
- ✅ 95%+ successful submission rate to Google Sheets
- ✅ Zero user-visible errors on network failures (silent retry)

---

## Sprint Objectives

### Primary Objectives
1. ✅ **Create n8n workflow** for email collection with Google Sheets integration
2. ✅ **Build EmailCollectionModal** component with gradient design and responsive layout
3. ✅ **Implement device metadata** collection (browser, OS, device type, screen resolution, timezone)
4. ✅ **Add email service** to n8nService.ts following existing patterns
5. ✅ **Implement silent retry** logic for failed n8n/Google Sheets submissions
6. ✅ **Create success animation** using Lottie (cup with sparkles)
7. ✅ **Integrate modal** with AnimatedInputs "Create with AI" button trigger
8. ✅ **Comprehensive testing** to ensure no breaking changes to existing workflows

### Secondary Objectives
9. ✅ Update documentation (PROGRESS.md, PROJECT_ROADMAP.md, FEATURE_LIST.md, USER_STORIES.md)
10. ✅ Add TypeScript types for email collection request/response
11. ✅ Implement localStorage persistence for email submission status
12. ✅ Ensure mobile-responsive design (350px min width)

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Journey                            │
├─────────────────────────────────────────────────────────────────┤
│  1. User fills AnimatedInputs                                   │
│  2. User clicks "Create with AI"                                │
│  3. EmailCollectionModal appears (blocking)                     │
│  4. User enters email → "Get Started" button                    │
│  5. Frontend: Generate user_id (if not exists)                  │
│  6. Frontend: Collect device metadata                           │
│  7. Frontend: POST to n8n webhook                               │
│  8. n8n: Validate → Store in Google Sheets                      │
│  9. Frontend: Show Lottie animation (1 second)                  │
│ 10. Frontend: localStorage flags + proceed to project creation  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Data Flow Diagram                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ AnimatedInputs│────────►│EmailCollection│                   │
│  │  Component   │ "Create" │    Modal     │                    │
│  └──────────────┘          └───────┬──────┘                    │
│                                    │                            │
│                                    │ collectEmail()             │
│                                    ▼                            │
│                            ┌──────────────┐                     │
│                            │ n8nService   │                     │
│                            │.collectEmail()│                    │
│                            └───────┬──────┘                     │
│                                    │                            │
│                                    │ POST                       │
│                                    ▼                            │
│                      ┌──────────────────────┐                   │
│                      │  n8n Webhook         │                   │
│                      │  /clarioo-email-     │                   │
│                      │   collection         │                   │
│                      └──────────┬───────────┘                   │
│                                 │                               │
│                                 │ Append Row                    │
│                                 ▼                               │
│                      ┌──────────────────────┐                   │
│                      │  Google Sheets       │                   │
│                      │  - email             │                   │
│                      │  - clarioo_user_id   │                   │
│                      │  - timestamp         │                   │
│                      │  - browser           │                   │
│                      │  - os                │                   │
│                      │  - device_type       │                   │
│                      │  - screen_resolution │                   │
│                      │  - timezone          │                   │
│                      └──────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
AnimatedInputs.tsx
  └─► onClick("Create with AI")
        └─► Check localStorage: email_submitted?
              ├─► NO → Show EmailCollectionModal
              │         └─► User enters email
              │               └─► collectEmail() in n8nService
              │                     ├─► SUCCESS
              │                     │     └─► localStorage.setItem('clarioo_email', {...})
              │                     │           └─► Show Lottie Animation (1s)
              │                     │                 └─► Proceed to createProjectWithAI()
              │                     │
              │                     └─► FAILURE
              │                           └─► localStorage.setItem with email_passed_to_n8n: false
              │                                 └─► Show Lottie Animation (1s, no error shown)
              │                                       └─► Proceed to createProjectWithAI()
              │                                             └─► Silent retry on next user action
              │
              └─► YES → Check email_passed_to_n8n?
                        ├─► FALSE → Silent retry in background
                        │             └─► Proceed to createProjectWithAI()
                        │
                        └─► TRUE → Proceed to createProjectWithAI()
```

### localStorage Structure

```typescript
// Key: 'clarioo_email'
{
  email_submitted: true,           // Prevents pop-up from showing again
  email: "user@example.com",       // Actual email address
  timestamp: "2024-11-25T10:30:00Z", // ISO timestamp of submission
  email_passed_to_n8n: true        // True = successfully sent to n8n, False = needs retry
}

// Key: 'clarioo_user_id' (already exists from SP_016)
"550e8400-e29b-41d4-a716-446655440000"
```

### n8n Workflow Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                   n8n Workflow Nodes                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Webhook Trigger                                             │
│     - POST endpoint: /clarioo-email-collection                  │
│     - CORS headers: localhost:8080                              │
│     - Response mode: lastNode                                   │
│                                                                 │
│  2. Input Validation (Code Node)                                │
│     - Validate: email (required, email format)                  │
│     - Validate: user_id (required, UUID format)                 │
│     - Validate: timestamp (required)                            │
│     - Validate: device_metadata (optional but recommended)      │
│                                                                 │
│  3. Check Validation (IF Node)                                  │
│     - TRUE (validation_error) → Return Validation Error         │
│     - FALSE (valid) → Proceed to Google Sheets                  │
│                                                                 │
│  4. Return Validation Error (Respond to Webhook)                │
│     - HTTP 400                                                  │
│     - { success: false, error: { code, message } }              │
│                                                                 │
│  5. Append to Google Sheets (Google Sheets Node)                │
│     - Spreadsheet: [User-provided ID]                           │
│     - Sheet: Sheet1 (or configured name)                        │
│     - Columns: email, clarioo_user_id, timestamp,               │
│                browser, os, device_type, screen_resolution,     │
│                timezone                                         │
│                                                                 │
│  6. Format Success Response (Code Node)                         │
│     - { success: true, message: "Email collected successfully" }│
│                                                                 │
│  7. Check Success (IF Node)                                     │
│     - TRUE (success) → Return Success Response                  │
│     - FALSE (error) → Handle Error                              │
│                                                                 │
│  8. Return Success Response (Respond to Webhook)                │
│     - HTTP 200                                                  │
│     - { success: true }                                         │
│                                                                 │
│  9. Handle Error (Code Node)                                    │
│     - Format error response with code and message               │
│                                                                 │
│ 10. Return Error Response (Respond to Webhook)                  │
│     - HTTP 500                                                  │
│     - { success: false, error: { code, message } }              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Deliverables

### Phase 1: n8n Workflow (2-3 hours)

#### Deliverable 1.1: n8n Workflow JSON
**File**: `00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_AI_Email_Collection.json`

**Nodes**:
1. **Webhook Trigger**
   - Path: `clarioo-email-collection`
   - Method: POST
   - CORS: `http://localhost:8080`
   - Response mode: lastNode

2. **Input Validation** (Code Node)
   ```javascript
   const body = items[0].json.body || {};

   const email = body.email || '';
   const user_id = body.user_id || '';
   const timestamp = body.timestamp;
   const device_metadata = body.device_metadata || {};

   const errors = [];

   // Email validation
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!email || !emailRegex.test(email)) {
     errors.push('Valid email is required');
   }

   // User ID validation (UUID v4 format)
   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
   if (!user_id || !uuidRegex.test(user_id)) {
     errors.push('Valid user_id (UUID v4) is required');
   }

   // Timestamp validation
   if (!timestamp) {
     errors.push('timestamp is required');
   }

   if (errors.length > 0) {
     return [{
       json: {
         validation_error: true,
         error_code: 'INVALID_INPUT',
         error_message: errors.join(', ')
       }
     }];
   }

   // Pass through validated data
   return [{
     json: {
       validation_error: false,
       email: email.trim().toLowerCase(),
       user_id,
       timestamp,
       browser: device_metadata.browser || 'Unknown',
       os: device_metadata.os || 'Unknown',
       device_type: device_metadata.deviceType || 'Unknown',
       screen_resolution: device_metadata.screenResolution || 'Unknown',
       timezone: device_metadata.timezone || 'Unknown'
     }
   }];
   ```

3. **Check Validation** (IF Node)
   - Condition: `{{ $json.validation_error }} === true`
   - TRUE → Return Validation Error (HTTP 400)
   - FALSE → Append to Google Sheets

4. **Append to Google Sheets** (Google Sheets Node)
   - Operation: Append
   - Columns mapping:
     ```
     email           → {{ $json.email }}
     clarioo_user_id → {{ $json.user_id }}
     timestamp       → {{ $json.timestamp }}
     browser         → {{ $json.browser }}
     os              → {{ $json.os }}
     device_type     → {{ $json.device_type }}
     screen_resolution → {{ $json.screen_resolution }}
     timezone        → {{ $json.timezone }}
     ```

5. **Return Success Response** (Respond to Webhook)
   - HTTP 200
   - Body: `{ "success": true, "message": "Email collected successfully" }`

6. **Return Validation Error** (Respond to Webhook)
   - HTTP 400
   - Body: `{ "success": false, "error": { "code": "{{ $json.error_code }}", "message": "{{ $json.error_message }}" } }`

7. **Return Error Response** (Respond to Webhook)
   - HTTP 500
   - Body: `{ "success": false, "error": { "code": "INTERNAL_ERROR", "message": "An unexpected error occurred" } }`

**Testing Requirements**:
- ✅ Valid email submission returns 200 + success: true
- ✅ Invalid email format returns 400 + validation error
- ✅ Missing user_id returns 400 + validation error
- ✅ Missing timestamp returns 400 + validation error
- ✅ Data correctly appended to Google Sheets (manual verification)

---

### Phase 2: Device Metadata Collection (1 hour)

#### Deliverable 2.1: Device Metadata Utility
**File**: `src/utils/deviceMetadata.ts`

```typescript
/**
 * Device Metadata Collection Utility
 *
 * Collects browser, OS, device type, screen resolution, and timezone
 * information for analytics and user tracking.
 */

export interface DeviceMetadata {
  browser: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenResolution: string;
  timezone: string;
}

/**
 * Detect browser name and version
 */
const detectBrowser = (): string => {
  const ua = navigator.userAgent;

  if (ua.includes('Firefox/')) {
    const version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
    return `Firefox ${version}`;
  }

  if (ua.includes('Edg/')) {
    const version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
    return `Edge ${version}`;
  }

  if (ua.includes('Chrome/')) {
    const version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
    return `Chrome ${version}`;
  }

  if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
    return `Safari ${version}`;
  }

  if (ua.includes('Opera/') || ua.includes('OPR/')) {
    const version = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || '';
    return `Opera ${version}`;
  }

  return 'Unknown';
};

/**
 * Detect operating system
 */
const detectOS = (): string => {
  const ua = navigator.userAgent;

  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';

  return 'Unknown';
};

/**
 * Detect device type based on screen width and user agent
 */
const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  const ua = navigator.userAgent;

  // Check user agent first for mobile/tablet indicators
  if (/Mobi|Android/i.test(ua)) {
    return width < 768 ? 'mobile' : 'tablet';
  }

  // Fallback to screen width
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

/**
 * Get screen resolution as "widthxheight"
 */
const getScreenResolution = (): string => {
  const width = window.screen.width;
  const height = window.screen.height;
  return `${width}x${height}`;
};

/**
 * Get user's timezone
 */
const getTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
};

/**
 * Collect all device metadata
 *
 * @returns DeviceMetadata object with browser, OS, device type, screen resolution, and timezone
 *
 * @example
 * ```typescript
 * const metadata = collectDeviceMetadata();
 * console.log(metadata);
 * // {
 * //   browser: "Chrome 120.0",
 * //   os: "macOS",
 * //   deviceType: "desktop",
 * //   screenResolution: "1920x1080",
 * //   timezone: "America/New_York"
 * // }
 * ```
 */
export const collectDeviceMetadata = (): DeviceMetadata => {
  return {
    browser: detectBrowser(),
    os: detectOS(),
    deviceType: detectDeviceType(),
    screenResolution: getScreenResolution(),
    timezone: getTimezone(),
  };
};
```

**Testing Requirements**:
- ✅ Correctly detects Chrome, Firefox, Safari, Edge browsers
- ✅ Correctly detects Windows, macOS, Linux, Android, iOS
- ✅ Correctly classifies mobile (< 768px), tablet (768-1023px), desktop (≥ 1024px)
- ✅ Returns valid screen resolution format (e.g., "1920x1080")
- ✅ Returns valid timezone (e.g., "America/New_York")

---

### Phase 3: Email Collection Service (1-2 hours)

#### Deliverable 3.1: Email Collection Types
**File**: `src/types/n8n.types.ts` (append to existing file)

```typescript
// ===========================================
// Email Collection Types (SP_017)
// ===========================================

export interface DeviceMetadata {
  browser: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenResolution: string;
  timezone: string;
}

export interface EmailCollectionRequest {
  email: string;
  user_id: string;
  timestamp: string;
  device_metadata: DeviceMetadata;
}

export interface EmailCollectionResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface EmailCollectionStorage {
  email_submitted: boolean;
  email: string;
  timestamp: string;
  email_passed_to_n8n: boolean;
}
```

#### Deliverable 3.2: Email Collection Service
**File**: `src/services/n8nService.ts` (append to existing file)

```typescript
// ===========================================
// Email Collection Configuration (SP_017)
// ===========================================

const N8N_EMAIL_COLLECTION_URL = 'https://n8n.lakestrom.com/webhook/clarioo-email-collection';
const EMAIL_STORAGE_KEY = 'clarioo_email';

// ===========================================
// Email Collection Types (import from types)
// ===========================================

import type {
  EmailCollectionRequest,
  EmailCollectionResponse,
  EmailCollectionStorage,
  DeviceMetadata,
} from '@/types';

import { collectDeviceMetadata } from '@/utils/deviceMetadata';

// ===========================================
// Email Collection Storage Functions
// ===========================================

/**
 * Get email collection status from localStorage
 *
 * @returns EmailCollectionStorage object or null if not found
 */
export const getEmailFromStorage = (): EmailCollectionStorage | null => {
  const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * Save email collection status to localStorage
 *
 * @param email - User's email address
 * @param passedToN8n - Whether email was successfully sent to n8n
 */
export const saveEmailToStorage = (email: string, passedToN8n: boolean): void => {
  const data: EmailCollectionStorage = {
    email_submitted: true,
    email: email.toLowerCase().trim(),
    timestamp: new Date().toISOString(),
    email_passed_to_n8n: passedToN8n,
  };

  localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(data));
  console.log('[email] Email collection status saved:', { email, passedToN8n });
};

/**
 * Check if email has been submitted
 *
 * @returns True if email has been submitted, false otherwise
 */
export const hasSubmittedEmail = (): boolean => {
  const stored = getEmailFromStorage();
  return stored?.email_submitted === true;
};

/**
 * Check if email needs retry (submitted but not passed to n8n)
 *
 * @returns True if email needs retry, false otherwise
 */
export const needsEmailRetry = (): boolean => {
  const stored = getEmailFromStorage();
  return stored?.email_submitted === true && stored?.email_passed_to_n8n === false;
};

/**
 * Update email_passed_to_n8n flag after successful retry
 */
export const markEmailPassedToN8n = (): void => {
  const stored = getEmailFromStorage();
  if (stored) {
    stored.email_passed_to_n8n = true;
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(stored));
    console.log('[email] Email marked as passed to n8n');
  }
};

// ===========================================
// Email Collection API
// ===========================================

/**
 * Collect user email and send to n8n workflow for Google Sheets storage
 *
 * This function is called when the user submits their email in the
 * EmailCollectionModal. It collects device metadata, generates/retrieves
 * user_id, and sends everything to the n8n webhook.
 *
 * @param email - User's email address
 * @returns Promise resolving to success/failure response
 * @throws Error if request fails or times out
 *
 * @example
 * ```typescript
 * try {
 *   const result = await collectEmail('user@example.com');
 *   if (result.success) {
 *     console.log('Email collected successfully');
 *   }
 * } catch (error) {
 *   console.error('Email collection failed:', error);
 * }
 * ```
 */
export const collectEmail = async (email: string): Promise<EmailCollectionResponse> => {
  console.log('[email] Starting email collection...');
  console.log('[email] Email:', email);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Get or create user_id (from existing SP_016 function)
    const userId = getUserId();
    console.log('[email] User ID:', userId);

    // Collect device metadata
    const deviceMetadata = collectDeviceMetadata();
    console.log('[email] Device metadata:', deviceMetadata);

    const requestBody: EmailCollectionRequest = {
      email: email.toLowerCase().trim(),
      user_id: userId,
      timestamp: new Date().toISOString(),
      device_metadata: deviceMetadata,
    };

    console.log('[email] Sending request to:', N8N_EMAIL_COLLECTION_URL);
    console.log('[email] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(N8N_EMAIL_COLLECTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[email] Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[email] HTTP error:', response.status, response.statusText);

      // Save to localStorage with failed flag for retry
      saveEmailToStorage(email, false);

      // Don't throw error - allow user to proceed
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: `HTTP error: ${response.status} ${response.statusText}`,
        },
      };
    }

    const data: EmailCollectionResponse = await response.json();
    console.log('[email] Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      // Save to localStorage with success flag
      saveEmailToStorage(email, true);
      console.log('[email] Email collected successfully');
    } else {
      // Save to localStorage with failed flag for retry
      saveEmailToStorage(email, false);
      console.log('[email] Email collection failed, will retry later');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[email] Request timeout after', TIMEOUT_MS, 'ms');

        // Save to localStorage with failed flag for retry
        saveEmailToStorage(email, false);

        // Don't throw error - allow user to proceed
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timeout - will retry later',
          },
        };
      }

      console.error('[email] Error:', error.message);

      // Save to localStorage with failed flag for retry
      saveEmailToStorage(email, false);

      // Don't throw error - allow user to proceed
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message,
        },
      };
    }

    console.error('[email] Unexpected error:', error);

    // Save to localStorage with failed flag for retry
    saveEmailToStorage(email, false);

    // Don't throw error - allow user to proceed
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
};

/**
 * Retry email collection silently in background
 * Called on user actions (step navigation, project creation, etc.)
 *
 * This function checks if there's a pending email retry, and if so,
 * attempts to send the email to n8n again. It runs silently without
 * blocking user interaction or showing errors.
 *
 * @returns Promise resolving when retry completes (success or failure)
 */
export const retryEmailCollection = async (): Promise<void> => {
  if (!needsEmailRetry()) {
    return; // No retry needed
  }

  const stored = getEmailFromStorage();
  if (!stored) {
    return; // No stored email
  }

  console.log('[email-retry] Attempting silent retry for:', stored.email);

  try {
    const result = await collectEmail(stored.email);
    if (result.success) {
      console.log('[email-retry] Retry successful');
      markEmailPassedToN8n();
    } else {
      console.log('[email-retry] Retry failed, will try again later');
    }
  } catch (error) {
    console.error('[email-retry] Retry error:', error);
    // Silently fail - will retry on next user action
  }
};
```

**Testing Requirements**:
- ✅ Valid email submission calls n8n webhook correctly
- ✅ Invalid email format throws validation error
- ✅ Network failure saves email with `email_passed_to_n8n: false`
- ✅ Successful submission saves email with `email_passed_to_n8n: true`
- ✅ `hasSubmittedEmail()` returns correct status
- ✅ `needsEmailRetry()` returns correct status
- ✅ `retryEmailCollection()` runs silently without blocking

---

### Phase 4: EmailCollectionModal Component (3-4 hours)

#### Deliverable 4.1: EmailCollectionModal Component
**File**: `src/components/email/EmailCollectionModal.tsx`

```typescript
/**
 * Email Collection Modal
 *
 * A blocking modal that appears when users click "Create with AI" for the first time.
 * Collects user email and sends to n8n/Google Sheets for tracking and analytics.
 *
 * Features:
 * - Unskippable (no close button, blocks interaction with backdrop)
 * - Gradient design matching VISION.md (purple gradients, elevated shadows)
 * - Lottie success animation (cup with sparkles, 1 second)
 * - Mobile-responsive (350px min width)
 * - Email validation on frontend
 * - Silent retry on failed submissions
 */

import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

import { collectEmail } from '@/services/n8nService';
import cupSuccessAnimation from '@/assets/animations/cup-success.json';

export interface EmailCollectionModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const EmailCollectionModal: React.FC<EmailCollectionModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  /**
   * Validate email format
   */
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  /**
   * Handle email input change with live validation
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Clear error when user starts typing
    if (emailError && value.length > 0) {
      setEmailError('');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call n8n service (doesn't throw errors, returns success/failure)
      await collectEmail(email);

      // Always show success animation (even if n8n failed, retry will happen later)
      setShowSuccess(true);

      // Wait 1 second for animation
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      console.error('[modal] Email collection error:', error);

      // Still show success animation and proceed
      // Silent retry will happen on next user action
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Success Animation Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 rounded-3xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Lottie
                    animationData={cupSuccessAnimation}
                    loop={false}
                    className="w-32 h-32"
                  />
                  <p className="mt-4 text-lg font-semibold text-gray-800">
                    Thank you!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 rounded-3xl shadow-[0_10px_25px_rgba(99,102,241,0.15),0_4px_10px_rgba(99,102,241,0.1)] p-8 border border-purple-100/50">
              {/* Clarioo Badge/Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">C</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                Welcome to Clarioo!
              </h2>

              {/* Description */}
              <p className="text-base text-gray-600 text-center mb-8 leading-relaxed px-2">
                We can do exciting things helping you to find the right vendors through deep research, evidence-based product comparison and more.
                <br /><br />
                We don't need you to register, but would like to have your email to better understand your user experience. In the world of non-stop advertisement, we will be mindful about reaching out.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="email@example.com"
                    required
                    disabled={isSubmitting}
                    className={`
                      w-full px-4 py-3 rounded-xl border-2
                      ${emailError ? 'border-red-400' : 'border-purple-200'}
                      focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20
                      transition-all duration-200
                      disabled:bg-gray-50 disabled:cursor-not-allowed
                      text-gray-800 placeholder:text-gray-400
                    `}
                  />
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email || !!emailError}
                  className="
                    w-full py-3 px-6 rounded-xl
                    bg-gradient-to-r from-purple-600 to-indigo-600
                    text-white font-semibold text-lg
                    shadow-[0_4px_14px_rgba(99,102,241,0.4)]
                    hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    transition-all duration-200
                  "
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailCollectionModal;
```

**Responsive Design Breakpoints**:
- **Mobile (350px - 767px)**: Full-width with padding, stacked layout
- **Tablet (768px - 1023px)**: Max-width 500px, centered
- **Desktop (1024px+)**: Max-width 550px, centered

**Testing Requirements**:
- ✅ Modal appears when `isOpen={true}`
- ✅ Modal blocks interaction with backdrop (no close on backdrop click)
- ✅ Email validation works (shows error for invalid format)
- ✅ Submit button disabled when email empty or invalid
- ✅ Success animation shows for 1 second after submission
- ✅ `onSuccess()` callback fires after animation completes
- ✅ Responsive design works on 350px, 768px, 1024px, 1440px screens
- ✅ Gradient design matches VISION.md (purple/indigo, elevated shadows)

---

### Phase 5: Lottie Success Animation (1 hour)

#### Deliverable 5.1: Cup Success Animation
**File**: `src/assets/animations/cup-success.json`

**Source Options**:
1. **LottieFiles** (https://lottiefiles.com/)
   - Search: "cup celebration", "coffee success", "trophy sparkles"
   - Download JSON animation
   - Place in `src/assets/animations/`

2. **Custom Animation** (if needed)
   - Create in After Effects
   - Export via Bodymovin plugin
   - Duration: ~1 second
   - Loop: false (play once)

**Animation Requirements**:
- ✅ Duration: 1 second (or close to it)
- ✅ Loop: false
- ✅ Theme: Celebratory (cup, sparkles, confetti, or similar)
- ✅ Colors: Match Clarioo brand (purple/indigo tones preferred)
- ✅ File size: < 100KB for performance

**Fallback** (if Lottie animation not available):
```typescript
// Fallback to simple CSS animation
<div className="w-32 h-32 text-6xl animate-bounce">
  🎉
</div>
```

**Installation**:
```bash
npm install lottie-react
```

**Testing Requirements**:
- ✅ Animation plays automatically when shown
- ✅ Animation completes in ~1 second
- ✅ Animation does not loop
- ✅ No console errors during playback
- ✅ Animation renders correctly on mobile and desktop

---

### Phase 6: Integration with AnimatedInputs (1-2 hours)

#### Deliverable 6.1: Update AnimatedInputs Component
**File**: `src/components/landing/AnimatedInputs.tsx`

**Changes**:
1. Import `EmailCollectionModal` and email storage functions
2. Add state for showing email modal
3. Modify "Create with AI" button click handler:
   - Check `hasSubmittedEmail()` from localStorage
   - If false → Show `EmailCollectionModal`
   - If true → Check `needsEmailRetry()` → Silent retry + proceed
   - Modal `onSuccess` → Proceed to project creation

**Code Modifications**:

```typescript
// Add imports
import { EmailCollectionModal } from '@/components/email/EmailCollectionModal';
import {
  hasSubmittedEmail,
  needsEmailRetry,
  retryEmailCollection
} from '@/services/n8nService';

// Add state
const [showEmailModal, setShowEmailModal] = useState(false);

// Modify handleCreateProject function
const handleCreateProject = async () => {
  // Check if email has been submitted
  if (!hasSubmittedEmail()) {
    // Show email collection modal (blocking)
    setShowEmailModal(true);
    return;
  }

  // Check if email needs retry (silent background retry)
  if (needsEmailRetry()) {
    retryEmailCollection().catch(err => {
      console.error('[email-retry] Silent retry failed:', err);
      // Continue anyway - will retry on next action
    });
  }

  // Proceed with project creation
  proceedWithProjectCreation();
};

// New function for actual project creation
const proceedWithProjectCreation = async () => {
  // Existing project creation logic (from SP_016)
  // ... (no changes to this part)
};

// Email modal success callback
const handleEmailSuccess = () => {
  setShowEmailModal(false);
  // Proceed with project creation after email collected
  proceedWithProjectCreation();
};

// Add modal to JSX (near end of component)
<EmailCollectionModal
  isOpen={showEmailModal}
  onSuccess={handleEmailSuccess}
/>
```

**Testing Requirements**:
- ✅ First click on "Create with AI" shows EmailCollectionModal
- ✅ Modal blocks project creation until email submitted
- ✅ After email submission, project creation proceeds automatically
- ✅ Second click on "Create with AI" skips modal (email already submitted)
- ✅ Failed email submissions trigger silent retry on next action
- ✅ No breaking changes to existing project creation flow

---

### Phase 7: Silent Retry Integration (1 hour)

#### Deliverable 7.1: Add Retry Hooks to Navigation Actions
**Files to Modify**:
- `src/components/VendorDiscovery.tsx`
- Any other components with step navigation

**Add Silent Retry on**:
1. Step navigation (Step 1 → Step 2 → Step 3, etc.)
2. Project creation
3. Criteria generation
4. Vendor search
5. Comparison generation

**Code Pattern**:
```typescript
// At the start of any major user action
const handleUserAction = async () => {
  // Silent email retry if needed
  if (needsEmailRetry()) {
    retryEmailCollection().catch(err => {
      console.error('[email-retry] Silent retry failed:', err);
    });
  }

  // Continue with actual user action
  // ... existing logic
};
```

**Example Locations**:
- `VendorDiscovery.tsx` → `handleStepChange()` function
- `AnimatedInputs.tsx` → "Create with AI" button (already done in Phase 6)
- `CriteriaBuilder.tsx` → "Continue to Vendor Selection" button
- `VendorSelection.tsx` → "Continue to Comparison" button
- `VendorComparison.tsx` → "Generate Executive Summary" button

**Testing Requirements**:
- ✅ Retry triggers silently on step navigation
- ✅ Retry does not block user actions
- ✅ Retry does not show errors to user
- ✅ Retry updates `email_passed_to_n8n: true` on success
- ✅ Retry stops after successful submission

---

## Implementation Plan

### Day 1: n8n Workflow & Backend (4-6 hours)

**Morning (2-3 hours)**:
1. ✅ Create n8n workflow JSON based on template
2. ✅ Set up Google Sheets integration (manual: create sheet, connect to n8n)
3. ✅ Test workflow with Postman/curl
4. ✅ Verify data appends correctly to Google Sheets

**Afternoon (2-3 hours)**:
5. ✅ Create device metadata utility (`src/utils/deviceMetadata.ts`)
6. ✅ Add TypeScript types to `src/types/n8n.types.ts`
7. ✅ Implement email collection service in `src/services/n8nService.ts`
8. ✅ Test service with console logs (no UI yet)

---

### Day 2: Frontend Integration & Testing (4-6 hours)

**Morning (2-3 hours)**:
1. ✅ Find/download Lottie animation (cup success)
2. ✅ Create `EmailCollectionModal` component
3. ✅ Test modal in isolation (Storybook or standalone page)
4. ✅ Verify responsive design (350px, 768px, 1024px)

**Afternoon (2-3 hours)**:
5. ✅ Integrate modal with `AnimatedInputs.tsx`
6. ✅ Add silent retry hooks to navigation actions
7. ✅ End-to-end testing (full user journey)
8. ✅ Update documentation (PROGRESS.md, PROJECT_ROADMAP.md, etc.)
9. ✅ Start local server at `localhost:8080`
10. ✅ Manual testing and QA

---

## Testing Strategy

### Unit Tests

**Device Metadata** (`src/utils/deviceMetadata.test.ts`):
```typescript
describe('deviceMetadata', () => {
  it('should detect browser correctly', () => {
    const metadata = collectDeviceMetadata();
    expect(metadata.browser).toBeDefined();
    expect(metadata.browser).not.toBe('Unknown');
  });

  it('should detect OS correctly', () => {
    const metadata = collectDeviceMetadata();
    expect(metadata.os).toBeDefined();
  });

  it('should classify device type correctly', () => {
    const metadata = collectDeviceMetadata();
    expect(['mobile', 'tablet', 'desktop']).toContain(metadata.deviceType);
  });

  it('should return valid screen resolution', () => {
    const metadata = collectDeviceMetadata();
    expect(metadata.screenResolution).toMatch(/^\d+x\d+$/);
  });

  it('should return valid timezone', () => {
    const metadata = collectDeviceMetadata();
    expect(metadata.timezone).toBeDefined();
    expect(metadata.timezone.length).toBeGreaterThan(0);
  });
});
```

**Email Collection Service** (`src/services/n8nService.test.ts`):
```typescript
describe('Email Collection Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save email to localStorage on success', async () => {
    await collectEmail('test@example.com');
    const stored = getEmailFromStorage();
    expect(stored?.email).toBe('test@example.com');
    expect(stored?.email_submitted).toBe(true);
  });

  it('should mark email_passed_to_n8n as false on network failure', async () => {
    // Mock network failure
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await collectEmail('test@example.com');
    const stored = getEmailFromStorage();
    expect(stored?.email_passed_to_n8n).toBe(false);
  });

  it('should detect if email needs retry', () => {
    saveEmailToStorage('test@example.com', false);
    expect(needsEmailRetry()).toBe(true);

    markEmailPassedToN8n();
    expect(needsEmailRetry()).toBe(false);
  });

  it('should not show modal if email already submitted', () => {
    saveEmailToStorage('test@example.com', true);
    expect(hasSubmittedEmail()).toBe(true);
  });
});
```

**EmailCollectionModal Component** (`src/components/email/EmailCollectionModal.test.tsx`):
```typescript
describe('EmailCollectionModal', () => {
  it('should render when isOpen is true', () => {
    render(<EmailCollectionModal isOpen={true} onSuccess={jest.fn()} />);
    expect(screen.getByText('Welcome to Clarioo!')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<EmailCollectionModal isOpen={false} onSuccess={jest.fn()} />);
    expect(screen.queryByText('Welcome to Clarioo!')).not.toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<EmailCollectionModal isOpen={true} onSuccess={jest.fn()} />);
    const input = screen.getByPlaceholderText('email@example.com');

    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.submit(screen.getByRole('button', { name: /get started/i }));

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('should call onSuccess after animation completes', async () => {
    const onSuccess = jest.fn();
    render(<EmailCollectionModal isOpen={true} onSuccess={onSuccess} />);

    const input = screen.getByPlaceholderText('email@example.com');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /get started/i }));

    // Wait for 1 second animation
    await waitFor(() => expect(onSuccess).toHaveBeenCalled(), { timeout: 2000 });
  });

  it('should show success animation on submit', async () => {
    render(<EmailCollectionModal isOpen={true} onSuccess={jest.fn()} />);

    const input = screen.getByPlaceholderText('email@example.com');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /get started/i }));

    expect(await screen.findByText('Thank you!')).toBeInTheDocument();
  });
});
```

### Integration Tests

**Full Email Collection Flow**:
1. User clicks "Create with AI"
2. EmailCollectionModal appears
3. User enters email
4. Success animation plays
5. Modal closes automatically
6. Project creation proceeds
7. Email stored in localStorage
8. Email sent to n8n/Google Sheets
9. Second click skips modal

**Silent Retry Flow**:
1. User clicks "Create with AI"
2. Email modal appears
3. User enters email
4. n8n/Google Sheets fails (mock network error)
5. Success animation still plays
6. Project creation proceeds
7. localStorage: `email_passed_to_n8n: false`
8. User navigates to Step 2
9. Silent retry triggers in background
10. Retry succeeds
11. localStorage updated: `email_passed_to_n8n: true`

### Manual Testing Checklist

**Desktop (1920x1080)**:
- [ ] Modal appears centered with backdrop blur
- [ ] Modal blocks interaction with page
- [ ] Email input accepts valid email
- [ ] Email validation shows error for invalid format
- [ ] Submit button disabled when email empty/invalid
- [ ] Success animation plays for 1 second
- [ ] Modal closes after animation
- [ ] Project creation proceeds automatically
- [ ] Second project creation skips modal

**Mobile (375x667 - iPhone SE)**:
- [ ] Modal appears full-width with padding
- [ ] Modal content readable and usable
- [ ] Email input touch-friendly (44px+ height)
- [ ] Submit button touch-friendly
- [ ] Success animation visible and centered
- [ ] No horizontal scroll
- [ ] No layout breaks

**Small Mobile (350x600)**:
- [ ] Modal fits within viewport
- [ ] Text readable (no truncation)
- [ ] Input and button usable
- [ ] Animation visible

**Network Conditions**:
- [ ] Success case: Email sent to n8n, success animation, proceed
- [ ] Slow network (3G): Loading spinner shows, animation on success
- [ ] Network failure: Success animation still shows, silent retry on next action
- [ ] Timeout: Success animation still shows, silent retry on next action

**Edge Cases**:
- [ ] User refreshes page during submission → Modal appears again
- [ ] User clears localStorage → Modal appears again
- [ ] User submits same email twice → Both submissions recorded (no duplicate check)
- [ ] User clicks backdrop during submission → Modal stays open (blocking)
- [ ] User presses ESC key → Modal stays open (blocking)

---

## Exit Criteria

### Must-Have (Blocking)
- ✅ n8n workflow deployed and functional
- ✅ EmailCollectionModal component created and styled
- ✅ Device metadata collection working
- ✅ Email service integrated with n8nService.ts
- ✅ Modal appears on first "Create with AI" click
- ✅ Modal skipped on subsequent clicks
- ✅ Success animation plays for 1 second
- ✅ Data correctly stored in Google Sheets
- ✅ localStorage persistence working
- ✅ Silent retry on failed submissions
- ✅ No breaking changes to existing workflows
- ✅ Mobile-responsive (350px min width)
- ✅ Local server running at localhost:8080
- ✅ Manual testing completed

### Nice-to-Have (Non-Blocking)
- ✅ Unit tests written and passing
- ✅ Integration tests written and passing
- ✅ Documentation updated (all 4 docs)
- ✅ Lottie animation customized with brand colors
- ✅ Email validation with helpful error messages
- ✅ Loading spinner during submission

### Documentation Updates
- ✅ PROGRESS.md: Add SP_017 completion entry
- ✅ PROJECT_ROADMAP.md: Mark SP_017 as complete
- ✅ FEATURE_LIST.md: Add email collection feature
- ✅ USER_STORIES.md: Add email collection user story

---

## Risk Assessment

### High-Risk Items

**1. Google Sheets API Rate Limits**
- **Risk**: Google Sheets may rate-limit append operations if many users submit simultaneously
- **Mitigation**:
  - n8n handles rate limiting internally
  - Failed submissions stored locally for retry
  - Monitor n8n execution logs for rate limit errors
- **Probability**: Medium
- **Impact**: Medium

**2. CORS Issues with n8n Webhook**
- **Risk**: CORS headers may not allow localhost:8080
- **Mitigation**:
  - Explicitly set `Access-Control-Allow-Origin: http://localhost:8080` in n8n webhook
  - Test with curl before frontend integration
  - Have backup plan: proxy requests through Vite dev server
- **Probability**: Low
- **Impact**: High

**3. Breaking Existing Project Creation Flow**
- **Risk**: Adding email modal may break existing SP_016 project creation
- **Mitigation**:
  - Thorough testing of all project creation paths
  - Use feature flag to toggle email collection on/off during testing
  - Test with and without email_submitted flag in localStorage
- **Probability**: Medium
- **Impact**: High

**4. Lottie Animation Performance on Mobile**
- **Risk**: Large Lottie file may cause jank on low-end mobile devices
- **Mitigation**:
  - Keep animation file < 100KB
  - Use simple animation (cup + sparkles, no complex effects)
  - Fallback to CSS animation if Lottie causes issues
- **Probability**: Low
- **Impact**: Low

### Medium-Risk Items

**5. localStorage Quota Exceeded**
- **Risk**: Users with full localStorage cannot store email data
- **Mitigation**:
  - Email data is small (~200 bytes)
  - Check quota before writing, handle gracefully
  - Still allow project creation if localStorage fails
- **Probability**: Very Low
- **Impact**: Medium

**6. User Enters Invalid Email Despite Validation**
- **Risk**: Regex validation may miss edge cases (e.g., "test@test" is technically valid but unusual)
- **Mitigation**:
  - Use robust email regex
  - n8n backend also validates email format
  - Google Sheets stores whatever is sent (even if invalid)
- **Probability**: Low
- **Impact**: Low

**7. Silent Retry Infinite Loop**
- **Risk**: If n8n is permanently down, retry may trigger on every user action forever
- **Mitigation**:
  - Retry only when `email_passed_to_n8n: false`
  - After successful retry, flag is updated to `true`
  - No infinite loop possible
- **Probability**: Very Low
- **Impact**: Low

### Low-Risk Items

**8. Animation Not Loading**
- **Risk**: Lottie animation file missing or corrupt
- **Mitigation**: Fallback to emoji or CSS animation
- **Probability**: Very Low
- **Impact**: Very Low

**9. Device Metadata Incorrect**
- **Risk**: Browser detection may return "Unknown" for rare browsers
- **Mitigation**: Store "Unknown" as valid value, doesn't block functionality
- **Probability**: Low
- **Impact**: Very Low

---

## Success Metrics

### Quantitative Metrics
- **Email Collection Rate**: 100% (modal is blocking)
- **Submission Success Rate**: Target 95%+ (silent retry handles failures)
- **Average Time to Submit**: < 10 seconds (user enters email + animation)
- **Modal Abandonment Rate**: 0% (modal is blocking, cannot skip)
- **Retry Success Rate**: Target 90%+ (retry on next action)

### Qualitative Metrics
- **User Experience**: No visible errors on network failures
- **Design Quality**: Modal matches VISION.md gradient design
- **Mobile Usability**: Modal usable on 350px screens
- **Integration Quality**: No breaking changes to existing flows

### Technical Metrics
- **Test Coverage**: 80%+ for new code
- **Build Success**: 0 errors, 0 warnings
- **Console Errors**: 0 errors in production
- **Performance**: Modal renders in < 100ms

---

## Notes

### Design Philosophy
- **No registration required**: Users don't create accounts, just provide email
- **Blocking but respectful**: Modal is unskippable but explained clearly
- **Silent failure handling**: Network errors don't block user, retry happens automatically
- **Mobile-first**: Designed for 350px+ screens with touch-friendly inputs

### Privacy Considerations
- **No GDPR consent**: User explicitly told email is collected for UX understanding
- **No opt-out**: Email collection is mandatory for product usage
- **Transparent communication**: Modal clearly states why email is needed
- **Minimal data**: Only email + user_id + device metadata (no PII beyond email)

### Future Enhancements (Out of Scope for SP_017)
- [ ] Email verification (send verification code)
- [ ] "Remember me on this device" checkbox
- [ ] Social login (Google, Microsoft)
- [ ] Privacy policy and terms of service links
- [ ] Unsubscribe mechanism
- [ ] Email preferences (opt-in for newsletters, product updates, etc.)
- [ ] A/B testing different modal copy
- [ ] Analytics tracking (modal views, submissions, abandonment)

---

**Sprint Plan Created**: November 25, 2024
**Status**: Ready for Implementation
**Estimated Duration**: 1-2 days (8-16 hours)
**Dependencies**: SP_016 (n8n Project Creation Integration) ✅ Complete
**Blocks**: None
**Next Sprint**: SP_018 (TBD - likely n8n Vendor Comparison Integration)

---

*This sprint plan follows GL-RDD (README-Driven Development) and GL-TDD (Test-Driven Development) principles. Implementation should proceed in the order outlined, with comprehensive testing at each phase.*
