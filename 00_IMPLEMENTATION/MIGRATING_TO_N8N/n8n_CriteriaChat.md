# n8n Criteria Chat Workflow Specification

## Overview

This document describes the n8n workflow for the **Criteria Chat** feature in Clarioo. The chat allows users to interact with an AI assistant to manage evaluation criteria through natural language conversation.

## Workflow Details

### Webhook Configuration

- **Webhook Name**: `clarioo-criteria-chat`
- **Full URL**: `https://n8n.lakestrom.com/webhook/clarioo-criteria-chat`
- **HTTP Method**: `POST`
- **Response Mode**: `lastNode`

### CORS Headers (same as project creation)

```
Access-Control-Allow-Origin: http://localhost:8080
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Input Schema

### Request Body

```typescript
interface CriteriaChatRequest {
  // User identification
  user_id: string;           // From localStorage
  session_id: string;        // From sessionStorage

  // Project context
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;

  // Current criteria state
  criteria: Criterion[];

  // Chat interaction
  user_message: string;      // Current user input
  chat_history: ChatMessage[]; // Previous conversation for context

  // Metadata
  timestamp: string;         // ISO 8601 format
}

interface Criterion {
  id: string;                // UUID v4
  name: string;
  description: string;       // Note: maps to "explanation" in frontend
  importance: 'low' | 'medium' | 'high';
  type: 'feature' | 'technical' | 'business' | 'compliance';
  isArchived: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### Example Request

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "project_id": "proj-abc123",
  "project_name": "Logistics Management System Evaluation",
  "project_description": "We are a mid-size logistics company looking for route optimization software",
  "project_category": "Logistics Software",
  "criteria": [
    {
      "id": "crit-001",
      "name": "Route Optimization",
      "description": "System should optimize delivery routes in real-time",
      "importance": "high",
      "type": "feature",
      "isArchived": false
    },
    {
      "id": "crit-002",
      "name": "Fleet Tracking",
      "description": "GPS tracking for all vehicles",
      "importance": "medium",
      "type": "feature",
      "isArchived": false
    }
  ],
  "user_message": "Add a criterion for API integration with our existing ERP system. It should be high priority.",
  "chat_history": [
    {
      "role": "user",
      "content": "What criteria do I currently have?",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "You have 2 criteria: Route Optimization (high priority, feature) and Fleet Tracking (medium priority, feature).",
      "timestamp": "2024-01-15T10:30:05Z"
    }
  ],
  "timestamp": "2024-01-15T10:31:00Z"
}
```

---

## Output Schema

### Response Body

```typescript
interface CriteriaChatResponse {
  success: boolean;

  // Chat response (always present on success)
  message: string;           // AI response to display in chat

  // Actions performed (can be empty if just answering a question)
  actions: CriteriaAction[];

  // Error details (only present on failure)
  error?: {
    code: string;
    message: string;
  };
}

interface CriteriaAction {
  type: 'create' | 'update' | 'delete';

  // For create: the new criterion
  // For update: the updated criterion (with id)
  // For delete: just the id
  criterion?: Criterion;
  criterion_id?: string;     // Used for delete

  // Human-readable description of what was done
  summary: string;
}
```

### Example Responses

#### 1. Information Query (No Actions)

```json
{
  "success": true,
  "message": "You currently have 2 evaluation criteria:\n\n1. **Route Optimization** (High priority, Feature)\n   - System should optimize delivery routes in real-time\n\n2. **Fleet Tracking** (Medium priority, Feature)\n   - GPS tracking for all vehicles\n\nWould you like me to add more criteria or modify any of these?",
  "actions": []
}
```

#### 2. Create Single Criterion

```json
{
  "success": true,
  "message": "I've added **ERP Integration** as a high-priority technical criterion. This will help ensure seamless data flow between your logistics system and existing ERP.",
  "actions": [
    {
      "type": "create",
      "criterion": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "ERP Integration",
        "description": "System must provide robust API integration with existing ERP systems for seamless data synchronization including orders, inventory, and customer data",
        "importance": "high",
        "type": "technical",
        "isArchived": false
      },
      "summary": "Created 'ERP Integration' (high priority, technical)"
    }
  ]
}
```

#### 3. Multiple Actions (Batch)

```json
{
  "success": true,
  "message": "I've made the following changes:\n\n1. Created **Mobile App Support** - essential for drivers in the field\n2. Updated **Fleet Tracking** importance to high - given your real-time monitoring needs\n3. Archived **Legacy Support** - no longer relevant per your request",
  "actions": [
    {
      "type": "create",
      "criterion": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Mobile App Support",
        "description": "Native mobile applications for iOS and Android for field drivers",
        "importance": "high",
        "type": "feature",
        "isArchived": false
      },
      "summary": "Created 'Mobile App Support' (high priority, feature)"
    },
    {
      "type": "update",
      "criterion": {
        "id": "crit-002",
        "name": "Fleet Tracking",
        "description": "GPS tracking for all vehicles",
        "importance": "high",
        "type": "feature",
        "isArchived": false
      },
      "summary": "Updated 'Fleet Tracking' importance from medium to high"
    },
    {
      "type": "delete",
      "criterion_id": "crit-003",
      "summary": "Archived 'Legacy Support'"
    }
  ]
}
```

#### 4. Error Response

```json
{
  "success": false,
  "message": "",
  "actions": [],
  "error": {
    "code": "INVALID_INPUT",
    "message": "user_message is required and must not be empty"
  }
}
```

---

## Use Cases & AI Behavior

### 1. Information Queries
- "What criteria do I have?"
- "Tell me about the Route Optimization criterion"
- "How many high-priority criteria are there?"
- "What's the difference between feature and technical types?"

**Behavior**: Return informative `message`, empty `actions` array.

### 2. Create Criteria
- "Add a criterion for API integration"
- "I need criteria for GDPR compliance and data encryption"
- "Create a high-priority feature for real-time notifications"

**Behavior**: Generate appropriate criterion/criteria with:
- UUID v4 for id
- Concise, actionable name
- Detailed description
- Appropriate importance based on user indication or context
- Correct type (feature/technical/business/compliance)
- isArchived: false

### 3. Update Criteria
- "Change Fleet Tracking to high priority"
- "Update the description of Route Optimization to include AI-powered suggestions"
- "Rename 'GPS Tracking' to 'Real-time Fleet Monitoring'"

**Behavior**: Match criterion by name (fuzzy) or ID, return updated criterion with all fields.

### 4. Delete/Archive Criteria
- "Remove the Legacy Support criterion"
- "Archive all low-priority criteria"
- "Delete criteria about email notifications"

**Behavior**: Match criteria and return delete actions with criterion_id.

### 5. Complex/Multi-Action Requests
- "Add security criteria and make all compliance criteria high priority"
- "Remove duplicates and consolidate similar criteria"
- "Reorganize my criteria - split the large feature requirements into smaller ones"

**Behavior**: Return multiple actions in the `actions` array.

### 6. Research & Recommendations
- "What criteria should I add for a logistics system?"
- "Are there any compliance requirements I'm missing?"
- "Compare my criteria to industry best practices"

**Behavior**: Provide helpful recommendations in `message`, optionally include suggested `create` actions.

---

## Workflow Modifications

### Starting Point
Use the existing `Clarioo AI Project Creation3.json` workflow as the base.

### Required Changes

#### 1. Webhook Trigger Node
- **Change** path from `clarioo-project-creation` to `clarioo-criteria-chat`
- Keep same CORS headers

#### 2. Input Validation Node
Replace the validation code with:

```javascript
const body = items[0].json.body || {};

const user_id = body.user_id;
const session_id = body.session_id;
const project_id = body.project_id;
const project_name = body.project_name || '';
const project_description = body.project_description || '';
const project_category = body.project_category || '';
const criteria = body.criteria || [];
const user_message = body.user_message || '';
const chat_history = body.chat_history || [];
const timestamp = body.timestamp;

// Validation
const errors = [];

if (!user_id || user_id.trim() === '') {
  errors.push('user_id is required');
}

if (!session_id || session_id.trim() === '') {
  errors.push('session_id is required');
}

if (!project_id || project_id.trim() === '') {
  errors.push('project_id is required');
}

if (!user_message || user_message.trim() === '') {
  errors.push('user_message is required');
}

if (!timestamp) {
  errors.push('timestamp is required');
}

if (!Array.isArray(criteria)) {
  errors.push('criteria must be an array');
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
    user_id,
    session_id,
    project_id,
    project_name,
    project_description,
    project_category,
    criteria,
    user_message: user_message.trim(),
    chat_history,
    timestamp
  }
}];
```

#### 3. AI Agent Node - Update Prompt
Replace the prompt with:

```
You are a helpful AI assistant for the Clarioo vendor evaluation platform. Your role is to help users manage their evaluation criteria through natural conversation.

PROJECT CONTEXT:
- Name: {{ $json.project_name }}
- Description: {{ $json.project_description }}
- Category: {{ $json.project_category }}

CURRENT CRITERIA:
{{ JSON.stringify($json.criteria, null, 2) }}

CONVERSATION HISTORY:
{{ JSON.stringify($json.chat_history, null, 2) }}

USER MESSAGE:
{{ $json.user_message }}

INSTRUCTIONS:
1. Analyze the user's request in context of their project and existing criteria
2. Determine if they want information, or want to modify criteria
3. For modifications, generate appropriate actions (create/update/delete)
4. Always provide a helpful, conversational response

GUIDELINES FOR CRITERIA:
- Names should be concise and actionable (2-5 words)
- Descriptions should be detailed (1-2 sentences)
- Importance: high = critical/explicitly requested, medium = important/implied, low = nice-to-have
- Types: feature (functionality), technical (architecture/integration), business (ROI/process), compliance (regulatory/security)
- Generate UUID v4 format IDs for new criteria

MATCHING CRITERIA:
- When user refers to a criterion by name, match it flexibly (ignore case, partial match OK)
- If ID is provided, use it directly
- If ambiguous, ask for clarification in your message

RESPONSE REQUIREMENTS:
- message: Conversational response explaining what you did or answering the question
- actions: Array of modifications (can be empty for info queries)
- Each action needs type, criterion/criterion_id, and summary
```

#### 4. AI Agent Node - Update System Message
```
You are an expert criteria management assistant. You help users create comprehensive, well-organized evaluation criteria for vendor selection. Always be helpful, concise, and proactive in suggesting improvements. Format your responses with markdown for readability.
```

#### 5. Structured Output Parser - Update Schema

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Conversational response to display in chat"
    },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["create", "update", "delete"]
          },
          "criterion": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "description": { "type": "string" },
              "importance": {
                "type": "string",
                "enum": ["low", "medium", "high"]
              },
              "type": {
                "type": "string",
                "enum": ["feature", "technical", "business", "compliance"]
              },
              "isArchived": { "type": "boolean" }
            }
          },
          "criterion_id": { "type": "string" },
          "summary": { "type": "string" }
        },
        "required": ["type", "summary"]
      }
    }
  },
  "required": ["message", "actions"]
}
```

#### 6. Format Success Response Node - Update Code

```javascript
try {
  const aiOutput = items[0].json.output;

  // Validate AI output structure
  if (!aiOutput || typeof aiOutput.message !== 'string') {
    throw new Error('Invalid AI response: missing message');
  }

  if (!Array.isArray(aiOutput.actions)) {
    throw new Error('Invalid AI response: actions must be an array');
  }

  // Validate each action
  for (const action of aiOutput.actions) {
    if (!['create', 'update', 'delete'].includes(action.type)) {
      throw new Error(`Invalid action type: ${action.type}`);
    }

    if (!action.summary) {
      throw new Error('Each action must have a summary');
    }

    if (action.type === 'create' || action.type === 'update') {
      if (!action.criterion || !action.criterion.id || !action.criterion.name) {
        throw new Error(`${action.type} action must include criterion with id and name`);
      }
    }

    if (action.type === 'delete' && !action.criterion_id) {
      throw new Error('delete action must include criterion_id');
    }
  }

  return [{
    json: {
      success: true,
      message: aiOutput.message,
      actions: aiOutput.actions
    }
  }];

} catch (error) {
  return [{
    json: {
      success: false,
      message: '',
      actions: [],
      error: {
        code: 'AI_PROCESSING_ERROR',
        message: `AI processing failed: ${error.message}`
      }
    }
  }];
}
```

---

## Frontend Integration Notes

### Service Function

```typescript
// src/services/n8nService.ts

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

export interface CriteriaChatResponse {
  success: boolean;
  message: string;
  actions: CriteriaAction[];
  error?: {
    code: string;
    message: string;
  };
}

export const sendCriteriaChat = async (
  request: CriteriaChatRequest
): Promise<CriteriaChatResponse> => {
  // Similar implementation to createProjectWithAI
  // POST to https://n8n.lakestrom.com/webhook/clarioo-criteria-chat
};
```

### Applying Actions

The frontend should process the `actions` array:

```typescript
const applyCriteriaActions = (
  currentCriteria: Criterion[],
  actions: CriteriaAction[]
): Criterion[] => {
  let updated = [...currentCriteria];

  for (const action of actions) {
    switch (action.type) {
      case 'create':
        updated.push(action.criterion);
        break;
      case 'update':
        updated = updated.map(c =>
          c.id === action.criterion.id ? action.criterion : c
        );
        break;
      case 'delete':
        updated = updated.filter(c => c.id !== action.criterion_id);
        break;
    }
  }

  return updated;
};
```

---

## Testing Scenarios

### 1. Basic Info Query
**Input**: "How many criteria do I have?"
**Expected**: Message with count, empty actions

### 2. Single Create
**Input**: "Add a criterion for mobile responsiveness"
**Expected**: Message confirming creation, one create action

### 3. Single Update
**Input**: "Make Fleet Tracking high priority"
**Expected**: Message confirming update, one update action with updated criterion

### 4. Single Delete
**Input**: "Remove the Legacy Support criterion"
**Expected**: Message confirming deletion, one delete action

### 5. Batch Operations
**Input**: "Add security and compliance criteria, and make all technical criteria high priority"
**Expected**: Message summarizing changes, multiple actions

### 6. Ambiguous Request
**Input**: "Update the tracking one"
**Expected**: Message asking for clarification (if multiple match) or proceed if only one match

### 7. Research Query
**Input**: "What criteria should I have for GDPR compliance?"
**Expected**: Informative message with recommendations, optionally create actions

---

## Error Handling

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| INVALID_INPUT | 400 | Missing or invalid required fields |
| AI_PROCESSING_ERROR | 500 | AI failed to generate valid response |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Performance Considerations

- **Timeout**: 45 seconds (same as project creation)
- **Max Criteria**: Consider limiting to ~50 criteria per project
- **Chat History**: Limit to last 10 messages to manage token usage
- **Model**: gpt-4o-mini (same as project creation for cost efficiency)

---

## Future Enhancements

1. **Bulk Import**: Allow importing criteria from templates or other projects
2. **Suggestions**: Proactively suggest missing criteria based on project category
3. **Validation**: Check for duplicate or conflicting criteria
4. **Undo**: Support undoing recent actions
5. **Templates**: Pre-built criteria sets for common use cases
