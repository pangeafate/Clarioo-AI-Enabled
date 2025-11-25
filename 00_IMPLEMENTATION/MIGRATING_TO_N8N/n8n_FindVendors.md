# n8n Find Vendors Workflow Specification

## Overview

This workflow handles vendor discovery by searching the internet for vendors that match the project description and feature criteria. It uses Perplexity as a search tool within an OpenAI agent to find relevant vendors.

## Trigger Points

The workflow is triggered when:
1. User clicks **"Find Vendors"** button in the Criteria Building stage
2. User clicks **"Rediscover"** button in the Vendor Discovery stage

## Workflow Architecture

```
Webhook Trigger → Input Validation → Check Validation
                                          ↓
                              ┌───────────────────┐
                              │  Validation Error │ → Return 400
                              └───────────────────┘
                                          ↓ (valid)
                              AI Vendor Discovery Agent
                              (OpenAI + Perplexity Tool)
                                          ↓
                              Format Success Response
                                          ↓
                                    Check Success
                                   ↓           ↓
                            Return 500    Return 200
```

## API Endpoint

**URL**: `POST /webhook/clarioo-find-vendors`

## Request Schema

```json
{
  "user_id": "string (required) - UUID of the user",
  "session_id": "string (required) - UUID of the session",
  "project_id": "string (required) - UUID of the project",
  "project_name": "string (required) - Name of the project",
  "project_description": "string (required) - Full project description",
  "project_category": "string (required) - Category (e.g., 'CRM Software')",
  "criteria": [
    {
      "id": "string - UUID",
      "name": "string - Criterion name",
      "explanation": "string - Detailed explanation",
      "importance": "low | medium | high",
      "type": "feature | technical | business | compliance"
    }
  ],
  "max_vendors": "number (optional, default: 10) - Maximum vendors to return",
  "timestamp": "string (required) - ISO 8601 timestamp"
}
```

### Criteria Selection Logic (Frontend)

Before sending to the workflow:
1. Filter criteria to include only `type: 'feature'`
2. If no feature criteria exist, send all criteria
3. Exclude archived criteria (`isArchived: true`)

## Response Schema

### Success Response (200)

```json
{
  "success": true,
  "vendors": [
    {
      "id": "string - UUID v4",
      "name": "string - Vendor name",
      "description": "string - Brief description of the vendor/product",
      "website": "string - Vendor website URL",
      "pricing": "string - Pricing model (e.g., 'Starting at $25/user/month', 'Contact for pricing', 'Free tier available')",
      "rating": "number - Rating from 1-5 (can use .5 increments)",
      "criteriaScores": {
        "[criterion_id]": "number - Score 1-10 for how well vendor matches this criterion"
      },
      "features": ["string - Key features relevant to the criteria"]
    }
  ],
  "search_summary": "string - Brief summary of the search performed"
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "vendors": [],
  "error": {
    "code": "INVALID_INPUT | AI_PROCESSING_ERROR | SEARCH_ERROR | INTERNAL_ERROR",
    "message": "string - Human-readable error message"
  }
}
```

## n8n Workflow Nodes

### 1. Webhook Trigger
- Path: `clarioo-find-vendors`
- Method: POST
- Response Mode: `responseNode`
- CORS headers for localhost:8080

### 2. Input Validation (Code Node)
Validates:
- Required fields present
- `project_description` length >= 10 characters
- `criteria` is an array
- `max_vendors` is valid number (1-20)

### 3. Check Validation (If Node)
Routes to error response if validation fails.

### 4. AI Vendor Discovery Agent (Agent Node)

**System Message:**
```
You are an expert vendor research analyst. Your task is to find real software vendors that match the given project requirements and evaluation criteria.

Use the Perplexity search tool to find current, accurate vendor information. Focus on finding vendors that:
1. Match the project category and description
2. Address the specific feature criteria provided
3. Are actively maintained and have good market presence

Always verify vendor information through search before including them.
```

**Prompt Template:**
```
Find vendors matching this project:

PROJECT: {{ $json.project_name }}
CATEGORY: {{ $json.project_category }}
DESCRIPTION: {{ $json.project_description }}

CRITERIA TO MATCH:
{{ JSON.stringify($json.criteria, null, 2) }}

INSTRUCTIONS:
1. Use Perplexity to search for "{{ $json.project_category }} vendors" and related terms
2. For each vendor found, search for:
   - Pricing information
   - Key features
   - User ratings/reviews
3. Score each vendor 1-10 on how well they match each criterion
4. Return up to {{ $json.max_vendors || 10 }} vendors
5. Include only vendors with verified websites
6. Prioritize vendors that match high-importance criteria

For criteriaScores, use the criterion IDs from the input and score each vendor's match.
```

**Connected Nodes:**
- OpenAI Chat Model (gpt-4o-mini, maxTokens: 4000, temperature: 0.3)
- Perplexity Tool (for web search)
- Structured Output Parser (schema below)

### 5. Structured Output Parser

```json
{
  "type": "object",
  "properties": {
    "vendors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "website": { "type": "string" },
          "pricing": { "type": "string" },
          "rating": { "type": "number" },
          "criteriaScores": {
            "type": "object",
            "additionalProperties": { "type": "number" }
          },
          "features": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["id", "name", "description", "website", "pricing", "rating", "criteriaScores", "features"]
      }
    },
    "search_summary": { "type": "string" }
  },
  "required": ["vendors", "search_summary"]
}
```

### 6. Format Success Response (Code Node)

```javascript
try {
  const aiOutput = items[0].json.output;

  // Validate output structure
  if (!aiOutput || !Array.isArray(aiOutput.vendors)) {
    throw new Error('Invalid AI response: missing vendors array');
  }

  // Validate each vendor
  for (const vendor of aiOutput.vendors) {
    if (!vendor.id || !vendor.name || !vendor.website) {
      throw new Error('Vendor missing required fields');
    }
    // Ensure criteriaScores is an object
    if (typeof vendor.criteriaScores !== 'object') {
      vendor.criteriaScores = {};
    }
    // Ensure features is an array
    if (!Array.isArray(vendor.features)) {
      vendor.features = [];
    }
    // Validate rating range
    if (typeof vendor.rating !== 'number' || vendor.rating < 1 || vendor.rating > 5) {
      vendor.rating = 3; // default
    }
  }

  return [{
    json: {
      success: true,
      vendors: aiOutput.vendors,
      search_summary: aiOutput.search_summary || ''
    }
  }];

} catch (error) {
  return [{
    json: {
      success: false,
      vendors: [],
      error: {
        code: 'AI_PROCESSING_ERROR',
        message: `Vendor search failed: ${error.message}`
      }
    }
  }];
}
```

### 7. Check Success (If Node)
Routes based on `success` field.

### 8. Return Success Response (Respond to Webhook)
- Response Code: 200
- Body: `{{ $json }}`

### 9. Handle Processing Error (Code Node)
Formats error response with appropriate code.

### 10. Return Error Response (Respond to Webhook)
- Response Code: 500
- Body: `{{ $json }}`

## Frontend Integration

### Service Function

Add to `n8nService.ts`:

```typescript
export interface VendorSearchRequest {
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  criteria: TransformedCriterion[];
  max_vendors?: number;
  timestamp: string;
}

export interface DiscoveredVendor {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  criteriaScores: Record<string, number>;
  features: string[];
}

export interface VendorSearchResponse {
  success: boolean;
  vendors: DiscoveredVendor[];
  search_summary?: string;
  error?: {
    code: string;
    message: string;
  };
}

export const findVendors = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  projectCategory: string,
  criteria: TransformedCriterion[],
  maxVendors: number = 10
): Promise<VendorSearchResponse> => {
  // Filter criteria: feature type only, or all if no features
  const featureCriteria = criteria.filter(c => c.type === 'feature' && !c.isArchived);
  const criteriaToSend = featureCriteria.length > 0
    ? featureCriteria
    : criteria.filter(c => !c.isArchived);

  const requestBody: VendorSearchRequest = {
    user_id: getUserId(),
    session_id: getSessionId(),
    project_id: projectId,
    project_name: projectName,
    project_description: projectDescription,
    project_category: projectCategory,
    criteria: criteriaToSend,
    max_vendors: maxVendors,
    timestamp: new Date().toISOString()
  };

  // ... fetch implementation similar to other n8n calls
};
```

### Update useVendorDiscovery Hook

Modify to call the n8n service instead of mock aiService.

## Configuration

### Environment Variables (n8n)
- OpenAI API key (for chat model)
- Perplexity API key (for search tool)

### Timeouts
- Request timeout: 60 seconds (searches may take longer)

## Error Handling

1. **INVALID_INPUT**: Missing or malformed request data
2. **SEARCH_ERROR**: Perplexity search failed
3. **AI_PROCESSING_ERROR**: AI couldn't parse results
4. **INTERNAL_ERROR**: Unexpected server error

Frontend should:
- Show appropriate error messages
- Offer retry option
- Fall back to mock data if configured

## Testing

Test cases:
1. Valid request with feature criteria → Returns vendors
2. No feature criteria → Uses all criteria
3. Empty criteria array → Still performs search based on description
4. Invalid project_id → Returns 400
5. Search timeout → Returns 500 with SEARCH_ERROR
6. Verify criteriaScores contain IDs from input criteria

## Performance Considerations

- Cache results in localStorage with TTL (e.g., 1 hour)
- Debounce rediscover button to prevent spam
- Show loading indicator during search (can take 10-30 seconds)
