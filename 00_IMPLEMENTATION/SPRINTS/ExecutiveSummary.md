# Executive Summary n8n Workflow Implementation Plan

## Overview

This document describes the implementation plan for generating AI-powered executive summaries via n8n webhook integration. The executive summary is generated when a user clicks the "Executive Summary" button in the VendorComparison stage, after completing vendor analysis.

## Webhook Endpoint

```
https://n8n.lakestrom.com/webhook/clarioo-executive-summary
```

## Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│ VendorComparison │────▶│   n8nService │────▶│  n8n Webhook    │
│    Button Click  │     │ POST Request │     │ AI Processing   │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  localStorage   │◀────│   Response   │◀────│ Structured JSON │
│    Caching      │     │   Handler    │     │    Output       │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

## Request Payload Structure

The frontend sends a POST request with the following structure:

```typescript
interface ExecutiveSummaryRequest {
  // Project identification
  project_id: string;
  project_name: string;
  project_description: string;

  // Session tracking
  session_id: string;
  timestamp: string;

  // Evaluation criteria
  criteria: Array<{
    id: string;
    name: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
  }>;

  // Compared vendors with full analysis data
  vendors: Array<{
    id: string;
    name: string;
    website?: string;
    matchPercentage: number; // Overall score from comparison
    description?: string;

    // Full score details per criterion
    scoreDetails: Array<{
      criterionId: string;
      criterionName: string;
      score: number; // 1-5
      evidence: string; // AI-generated explanation
      source_urls: string[]; // Evidence URLs
      comments: string; // Additional context
    }>;
  }>;
}
```

### Example Payload

```json
{
  "project_id": "proj_abc123",
  "project_name": "CRM Selection for Sales Team",
  "project_description": "Evaluating CRM solutions for a 50-person sales team with Salesforce integration needs",
  "session_id": "sess_xyz789",
  "timestamp": "2024-01-15T10:30:00Z",
  "criteria": [
    {
      "id": "crit_001",
      "name": "Salesforce Integration",
      "description": "Native bi-directional sync with Salesforce",
      "importance": "high"
    },
    {
      "id": "crit_002",
      "name": "Mobile App",
      "description": "Full-featured iOS and Android applications",
      "importance": "medium"
    }
  ],
  "vendors": [
    {
      "id": "vendor_001",
      "name": "HubSpot CRM",
      "website": "https://hubspot.com",
      "matchPercentage": 87,
      "scoreDetails": [
        {
          "criterionId": "crit_001",
          "criterionName": "Salesforce Integration",
          "score": 4,
          "evidence": "HubSpot offers native Salesforce integration with bi-directional sync...",
          "source_urls": ["https://hubspot.com/integrations/salesforce"],
          "comments": "Requires Professional tier or higher"
        }
      ]
    }
  ]
}
```

## Response Structure

The n8n workflow returns a structured JSON response matching the executive summary sections:

```typescript
interface ExecutiveSummaryResponse {
  success: boolean;
  data: {
    // Key evaluation criteria used
    keyCriteria: Array<{
      name: string;
      description: string;
      importance: string;
    }>;

    // Ranked vendor recommendations
    vendorRecommendations: Array<{
      rank: number;
      name: string;
      matchPercentage: number; // Passed through as-is
      overallAssessment: string;
      keyStrengths: string[];
      keyWeaknesses: string[];
      bestFor: string;
    }>;

    // Competitive analysis by category
    keyDifferentiators: Array<{
      category: string;
      leader: string;
      details: string;
    }>;

    // Risk factors and questions
    riskFactors: {
      vendorSpecific: Array<{
        vendor: string;
        questions: string[];
      }>;
      generalConsiderations: string[];
    };

    // Final recommendation
    recommendation: {
      topPick: string;
      reason: string;
      considerations: string[];
    };
  };
  error?: string;
}
```

## n8n Workflow Structure

Based on the Clarioo AI Compare Vendors workflow pattern:

### Node 1: Webhook Trigger
- **Type**: `n8n-nodes-base.webhook`
- **Method**: POST
- **Path**: `clarioo-executive-summary`
- **CORS**: Enabled for `https://pangeafate.github.io`

### Node 2: Input Validation
- **Type**: `n8n-nodes-base.code`
- **Purpose**: Validate required fields and data structure

```javascript
const body = items[0].json.body || {};

const errors = [];

if (!body.project_id) errors.push('project_id is required');
if (!body.session_id) errors.push('session_id is required');
if (!body.criteria || !Array.isArray(body.criteria) || body.criteria.length === 0) {
  errors.push('At least one criterion is required');
}
if (!body.vendors || !Array.isArray(body.vendors) || body.vendors.length === 0) {
  errors.push('At least one compared vendor is required');
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

return [{
  json: {
    validation_error: false,
    ...body
  }
}];
```

### Node 3: Prepare AI Prompt
- **Type**: `n8n-nodes-base.code`
- **Purpose**: Format data for AI analysis

```javascript
const data = items[0].json;

// Build criteria summary
const criteriaSummary = data.criteria.map(c =>
  `- ${c.name} (${c.importance}): ${c.description}`
).join('\n');

// Build vendor analysis
const vendorAnalysis = data.vendors.map(v => {
  const scores = v.scoreDetails.map(s =>
    `  - ${s.criterionName}: ${s.score}/5 - ${s.evidence}`
  ).join('\n');

  return `### ${v.name} (${v.matchPercentage}% match)
${scores}`;
}).join('\n\n');

const prompt = `You are an expert technology analyst creating an executive summary for vendor evaluation.

## Project Context
**Project:** ${data.project_name}
**Description:** ${data.project_description}

## Evaluation Criteria
${criteriaSummary}

## Vendor Analysis Results
${vendorAnalysis}

## Your Task
Generate a comprehensive executive summary with the following sections:

1. **keyCriteria**: List the high-priority criteria that were most important in this evaluation
2. **vendorRecommendations**: Rank all vendors with their matchPercentage (use exact values provided), strengths, weaknesses, and who they're best for
3. **keyDifferentiators**: Identify categories where vendors differ significantly and who leads each
4. **riskFactors**: Provide vendor-specific questions to ask and general considerations
5. **recommendation**: Give your top pick with reasoning and key considerations

Important: Use the exact matchPercentage values provided for each vendor. Generate all analysis content based on the scoreDetails and evidence provided.`;

return [{
  json: {
    prompt,
    originalData: data
  }
}];
```

### Node 4: AI Analysis (OpenAI)
- **Type**: `@n8n/n8n-nodes-langchain.lmChatOpenAi`
- **Model**: gpt-4o-mini
- **Temperature**: 0.3 (for consistent, analytical output)
- **Purpose**: Generate executive summary content

### Node 5: Structured Output Parser
- **Type**: `@n8n/n8n-nodes-langchain.outputParserStructured`
- **Purpose**: Ensure valid JSON output matching response schema

Schema:
```json
{
  "type": "object",
  "properties": {
    "keyCriteria": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" },
          "importance": { "type": "string" }
        },
        "required": ["name", "description", "importance"]
      }
    },
    "vendorRecommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "rank": { "type": "number" },
          "name": { "type": "string" },
          "matchPercentage": { "type": "number" },
          "overallAssessment": { "type": "string" },
          "keyStrengths": { "type": "array", "items": { "type": "string" } },
          "keyWeaknesses": { "type": "array", "items": { "type": "string" } },
          "bestFor": { "type": "string" }
        },
        "required": ["rank", "name", "matchPercentage", "overallAssessment", "keyStrengths", "keyWeaknesses", "bestFor"]
      }
    },
    "keyDifferentiators": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "category": { "type": "string" },
          "leader": { "type": "string" },
          "details": { "type": "string" }
        },
        "required": ["category", "leader", "details"]
      }
    },
    "riskFactors": {
      "type": "object",
      "properties": {
        "vendorSpecific": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "vendor": { "type": "string" },
              "questions": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["vendor", "questions"]
          }
        },
        "generalConsiderations": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["vendorSpecific", "generalConsiderations"]
    },
    "recommendation": {
      "type": "object",
      "properties": {
        "topPick": { "type": "string" },
        "reason": { "type": "string" },
        "considerations": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["topPick", "reason", "considerations"]
    }
  },
  "required": ["keyCriteria", "vendorRecommendations", "keyDifferentiators", "riskFactors", "recommendation"]
}
```

### Node 6: Format Response
- **Type**: `n8n-nodes-base.code`
- **Purpose**: Structure final API response

```javascript
const aiOutput = items[0].json;

return [{
  json: {
    success: true,
    data: aiOutput,
    generated_at: new Date().toISOString()
  }
}];
```

### Node 7: Error Handler
- **Type**: `n8n-nodes-base.code`
- **Purpose**: Handle validation errors and failures

```javascript
const input = items[0].json;

if (input.validation_error) {
  return [{
    json: {
      success: false,
      error: input.error_message,
      error_code: input.error_code
    }
  }];
}

// Pass through for non-error cases
return items;
```

## Frontend Integration

### 1. n8nService.ts - New Function

Add to `/src/services/n8nService.ts`:

```typescript
const N8N_EXECUTIVE_SUMMARY_URL = 'https://n8n.lakestrom.com/webhook/clarioo-executive-summary';

export interface ExecutiveSummaryData {
  keyCriteria: Array<{
    name: string;
    description: string;
    importance: string;
  }>;
  vendorRecommendations: Array<{
    rank: number;
    name: string;
    matchPercentage: number;
    overallAssessment: string;
    keyStrengths: string[];
    keyWeaknesses: string[];
    bestFor: string;
  }>;
  keyDifferentiators: Array<{
    category: string;
    leader: string;
    details: string;
  }>;
  riskFactors: {
    vendorSpecific: Array<{
      vendor: string;
      questions: string[];
    }>;
    generalConsiderations: string[];
  };
  recommendation: {
    topPick: string;
    reason: string;
    considerations: string[];
  };
}

/**
 * Generate executive summary via n8n AI workflow
 */
export async function generateExecutiveSummary(
  projectId: string,
  projectName: string,
  projectDescription: string,
  criteria: Array<{
    id: string;
    name: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
  }>,
  vendors: Array<{
    id: string;
    name: string;
    website?: string;
    matchPercentage: number;
    description?: string;
    scoreDetails: Array<{
      criterionId: string;
      criterionName: string;
      score: number;
      evidence: string;
      source_urls: string[];
      comments: string;
    }>;
  }>
): Promise<ExecutiveSummaryData> {
  const sessionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const payload = {
    project_id: projectId,
    project_name: projectName,
    project_description: projectDescription,
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    criteria,
    vendors
  };

  console.log('[n8nService] Generating executive summary:', {
    projectId,
    criteriaCount: criteria.length,
    vendorCount: vendors.length
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(N8N_EXECUTIVE_SUMMARY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate executive summary');
    }

    // Cache the result
    saveExecutiveSummaryToStorage(projectId, result.data);

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Executive summary generation timed out (2 min limit)');
    }

    throw error;
  }
}

/**
 * Save executive summary to localStorage
 */
export function saveExecutiveSummaryToStorage(projectId: string, data: ExecutiveSummaryData): void {
  const key = `clarioo_executive_summary_${projectId}`;
  const stored = {
    data,
    generated_at: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(stored));
  console.log('[n8nService] Executive summary cached for project:', projectId);
}

/**
 * Get cached executive summary from localStorage
 */
export function getExecutiveSummaryFromStorage(projectId: string): ExecutiveSummaryData | null {
  const key = `clarioo_executive_summary_${projectId}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Clear cached executive summary
 */
export function clearExecutiveSummaryFromStorage(projectId: string): void {
  const key = `clarioo_executive_summary_${projectId}`;
  localStorage.removeItem(key);
  console.log('[n8nService] Executive summary cache cleared for project:', projectId);
}
```

### 2. ExecutiveSummaryDialog.tsx - Update

Key changes to `/src/components/vendor-comparison/ExecutiveSummaryDialog.tsx`:

```typescript
// Add imports
import { generateExecutiveSummary, getExecutiveSummaryFromStorage, clearExecutiveSummaryFromStorage } from '@/services/n8nService';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Loader2 } from 'lucide-react';

// Add props for data
interface ExecutiveSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectDescription: string;
  criteria: Criteria[];
  vendors: VendorWithScores[];
}

// Inside component
const [summaryData, setSummaryData] = useState<ExecutiveSummaryData | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const { toast } = useToast();

// Load cached data or generate on open
useEffect(() => {
  if (isOpen && projectId) {
    const cached = getExecutiveSummaryFromStorage(projectId);
    if (cached) {
      setSummaryData(cached);
    } else {
      handleGenerate();
    }
  }
}, [isOpen, projectId]);

// Generate handler
const handleGenerate = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const result = await generateExecutiveSummary(
      projectId,
      projectName,
      projectDescription,
      criteria,
      vendors
    );
    setSummaryData(result);
    toast({
      title: "Executive Summary Generated",
      description: "Your AI-powered analysis is ready."
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate summary';
    setError(message);
    toast({
      title: "Generation Failed",
      description: message,
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};

// Regenerate handler
const handleRegenerate = () => {
  clearExecutiveSummaryFromStorage(projectId);
  handleGenerate();
};

// Add regenerate button to UI
<Button
  onClick={handleRegenerate}
  disabled={isLoading}
  variant="outline"
  size="sm"
>
  {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin mr-2" />
  ) : (
    <RefreshCw className="h-4 w-4 mr-2" />
  )}
  Regenerate
</Button>

// Show error state
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-700">{error}</p>
    <Button onClick={handleGenerate} className="mt-2">
      Try Again
    </Button>
  </div>
)}
```

### 3. VendorComparison.tsx - Pass Data to Dialog

Update the ExecutiveSummaryDialog invocation:

```typescript
<ExecutiveSummaryDialog
  isOpen={showExecutiveSummary}
  onClose={() => setShowExecutiveSummary(false)}
  projectId={project.id}
  projectName={project.name}
  projectDescription={project.description || ''}
  criteria={criteria}
  vendors={comparedVendors}
/>
```

## Caching Strategy

### localStorage Keys

- **Pattern**: `clarioo_executive_summary_{projectId}`
- **Contents**: `{ data: ExecutiveSummaryData, generated_at: string }`

### Cache Behavior

1. **On Dialog Open**:
   - Check localStorage for cached summary
   - If found: Display immediately
   - If not found: Auto-generate

2. **On Generate/Regenerate**:
   - Clear existing cache (if regenerating)
   - Call n8n API
   - Save result to localStorage

3. **Cache Invalidation**:
   - Manual via "Regenerate" button
   - Automatic when project is deleted

## Error Handling

### Frontend Errors

1. **Network/Timeout**:
   ```
   "Executive summary generation timed out (2 min limit)"
   ```

2. **API Errors**:
   ```
   "n8n API error: {status} - {details}"
   ```

3. **Validation Errors**:
   ```
   "At least one criterion is required"
   "At least one compared vendor is required"
   ```

### UI Error States

- Display error message in red banner
- Show "Try Again" button
- Preserve any cached data while showing error

## Testing Checklist

### Manual Testing

1. [ ] Generate executive summary with 1 vendor
2. [ ] Generate executive summary with 3+ vendors
3. [ ] Verify matchPercentage values pass through unchanged
4. [ ] Check localStorage caching works
5. [ ] Test regenerate button clears cache
6. [ ] Test error handling (disconnect network)
7. [ ] Verify CORS works from GitHub Pages

### Data Validation

1. [ ] All criteria included in keyCriteria section
2. [ ] All vendors ranked in vendorRecommendations
3. [ ] matchPercentage matches original values
4. [ ] keyDifferentiators reference actual criteria
5. [ ] riskFactors include vendor-specific questions

## Future Enhancements

### Chat Integration (Placeholder)

The chat section in ExecutiveSummaryDialog remains as a placeholder. Future implementation would:
- Allow users to ask questions about the summary
- Use a separate n8n webhook for chat
- Maintain conversation context

### Additional Sections

Potential additions:
- Implementation timeline estimates
- Total cost of ownership analysis
- Integration complexity assessment
- Vendor financial stability notes

## CORS Configuration

Ensure n8n webhook has correct CORS settings:
- **Access-Control-Allow-Origin**: `https://pangeafate.github.io`
- **Access-Control-Allow-Methods**: `POST, OPTIONS`
- **Access-Control-Allow-Headers**: `Content-Type`
