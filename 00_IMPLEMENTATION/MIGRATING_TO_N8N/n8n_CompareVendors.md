# n8n Compare Vendors Workflow Specification

## Overview

This workflow handles deep vendor research by evaluating each selected vendor against the project criteria. It searches the internet for evidence of whether each vendor meets each criterion, assigns scores (no/unknown/yes/star), and generates executive summaries and key insights.

## Trigger Points

The workflow is triggered when:
1. User clicks **"Continue to Comparison"** button in the Vendor Selection stage

## Workflow Architecture

**Note**: Frontend calls this workflow once per vendor (not all at once). This enables progressive loading where each vendor's column is populated as soon as its research completes.

```
Webhook Trigger → Input Validation → Check Validation
                                          ↓
                              ┌───────────────────┐
                              │  Validation Error │ → Return 400
                              └───────────────────┘
                                          ↓ (valid)
                              AI Deep Research Agent
                              (OpenAI + Perplexity Tool)
                                          ↓
                              Format Success Response
                                          ↓
                                    Check Success
                                   ↓           ↓
                            Return 500    Return 200
```

## API Endpoint

**URL**: `POST /webhook/clarioo-compare-vendors`

## Request Schema

**Note**: This endpoint processes ONE vendor at a time. Frontend calls it sequentially for each selected vendor.

```json
{
  "user_id": "string (required) - UUID of the user",
  "session_id": "string (required) - UUID of the session",
  "project_id": "string (required) - UUID of the project",
  "project_name": "string (required) - Name of the project",
  "project_description": "string (required) - Full project description",
  "project_category": "string (required) - Category (e.g., 'CRM Software')",
  "vendor": {
    "id": "string - Vendor UUID",
    "name": "string - Vendor name",
    "website": "string - Vendor website URL",
    "description": "string - Brief description",
    "features": ["string - Known features from discovery"]
  },
  "criteria": [
    {
      "id": "string - Criterion UUID",
      "name": "string - Criterion name",
      "explanation": "string - Detailed explanation",
      "importance": "low | medium | high",
      "type": "feature | technical | business | compliance"
    }
  ],
  "timestamp": "string (required) - ISO 8601 timestamp"
}
```

## Response Schema

### Success Response (200)

```json
{
  "success": true,
  "vendor": {
    "id": "string - Vendor UUID",
    "name": "string - Vendor name",
    "website": "string - Vendor website URL",
    "description": "string - Updated description based on research",
    "killerFeature": "string - Main differentiator/unique selling point",
    "executiveSummary": "string - 2-3 sentence overview of vendor strengths",
    "keyFeatures": ["string - List of 5-7 key features"],
    "matchPercentage": "number - Overall match score 0-100",
    "scores": {
      "[criterion_id]": "no | unknown | yes | star"
    },
    "scoreDetails": {
      "[criterion_id]": {
        "state": "no | unknown | yes | star",
        "evidence": "string - URL to evidence (required for yes/star)",
        "comment": "string - Brief explanation of the score"
      }
    }
  },
  "research_summary": "string - Brief summary of the research performed"
}
```

### Criteria Score States

| State | Description | Evidence Required |
|-------|-------------|-------------------|
| `no` | Found evidence that the feature doesn't exist | No |
| `unknown` | Couldn't find any information on the feature | No |
| `yes` | Criteria mentioned as existing | Yes - URL to evidence |
| `star` | Strong evidence that criteria is very well matched | Yes - URL to evidence |

### Error Response (400/500)

```json
{
  "success": false,
  "vendor_id": "string - ID of the vendor that failed",
  "error": {
    "code": "INVALID_INPUT | AI_PROCESSING_ERROR | SEARCH_ERROR | INTERNAL_ERROR",
    "message": "string - Human-readable error message"
  }
}
```

### Failed Vendor Display

When a vendor fails:
- All criteria cells show a retry icon (circular arrow)
- Retry icon appears on the vendor card header
- Clicking retry calls the same workflow with that single vendor
- Vendor column remains in original position during retry

## n8n Workflow Nodes

### 1. Webhook Trigger
- Path: `clarioo-compare-vendors`
- Method: POST
- Response Mode: `responseNode`
- CORS headers for localhost:8080

### 2. Input Validation (Code Node)
Validates:
- Required fields present
- `vendor` object exists with id, name, website
- `criteria` is an array with at least 1 criterion
- Each criterion has id, name

### 3. Check Validation (If Node)
Routes to error response if validation fails.

### 4. AI Deep Research Agent (Agent Node)

**System Message:**
```
You are an expert software analyst specializing in vendor evaluation. Your task is to thoroughly research a software vendor and evaluate how well it matches specific criteria.

For each criterion, you must:
1. Use Perplexity to search for evidence about whether the vendor offers this feature/capability
2. Assign one of four scores:
   - "no": Found evidence the feature doesn't exist
   - "unknown": Couldn't find any information
   - "yes": Found evidence the feature exists (MUST include URL)
   - "star": Found strong evidence of exceptional capability (MUST include URL)
3. For "yes" and "star" scores, you MUST provide a URL to the evidence source

Also research and provide:
- Killer feature: The vendor's main differentiator
- Executive summary: 2-3 sentences about vendor strengths
- Key features: 5-7 main features
- Match percentage: Overall score 0-100 based on criteria matches
```

**Prompt Template:**
```
Research this vendor thoroughly:

VENDOR: {{ $json.vendor.name }}
WEBSITE: {{ $json.vendor.website }}
KNOWN FEATURES: {{ JSON.stringify($json.vendor.features) }}

PROJECT CONTEXT:
Category: {{ $json.project_category }}
Description: {{ $json.project_description }}

CRITERIA TO EVALUATE:
{{ JSON.stringify($json.criteria, null, 2) }}

INSTRUCTIONS:
1. For each criterion, search for evidence using Perplexity
2. Search patterns to use:
   - "[vendor name] [criterion name]"
   - "[vendor name] features [criterion keywords]"
   - "site:[vendor website] [criterion keywords]"
3. Assign scores based on evidence found:
   - "no": Only if you find explicit evidence the feature is NOT available
   - "unknown": If you cannot find any information either way
   - "yes": If you find evidence the feature exists (provide URL)
   - "star": If you find evidence of exceptional capability (provide URL)
4. For YES and STAR, the evidence URL is REQUIRED - if you can't find a URL, use "unknown" instead
5. Evidence URLs should be from official vendor sites, documentation, reviews, or reputable tech publications
6. Also provide:
   - killerFeature: Main differentiator in 1 sentence
   - executiveSummary: 2-3 sentence overview
   - keyFeatures: Array of 5-7 key features
   - matchPercentage: Overall score (weight high-importance criteria more)
```

**Connected Nodes:**
- OpenAI Chat Model (gpt-4o-mini, maxTokens: 8000, temperature: 0.3)
- Perplexity Tool (for web search)
- Structured Output Parser (schema below)

### 5. Structured Output Parser

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "website": { "type": "string" },
    "description": { "type": "string" },
    "killerFeature": { "type": "string" },
    "executiveSummary": { "type": "string" },
    "keyFeatures": {
      "type": "array",
      "items": { "type": "string" }
    },
    "matchPercentage": { "type": "number" },
    "scores": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "state": {
            "type": "string",
            "enum": ["no", "unknown", "yes", "star"]
          },
          "evidence": { "type": "string" },
          "comment": { "type": "string" }
        },
        "required": ["state", "comment"]
      }
    }
  },
  "required": ["id", "name", "website", "description", "killerFeature", "executiveSummary", "keyFeatures", "matchPercentage", "scores"]
}
```

### 6. Format Success Response (Code Node)

```javascript
try {
  const aiOutput = items[0].json.output;

  // Validate output structure
  if (!aiOutput || !aiOutput.id || !aiOutput.name) {
    throw new Error('Invalid AI response: missing vendor data');
  }

  // Transform scores to simplified format + keep details
  const simplifiedScores = {};
  const scoreDetails = {};

  for (const [criterionId, scoreData] of Object.entries(aiOutput.scores || {})) {
    simplifiedScores[criterionId] = scoreData.state;
    scoreDetails[criterionId] = {
      state: scoreData.state,
      evidence: scoreData.evidence || '',
      comment: scoreData.comment || ''
    };
  }

  // Ensure all required fields have defaults
  const vendor = {
    id: aiOutput.id,
    name: aiOutput.name,
    website: aiOutput.website,
    description: aiOutput.description || '',
    killerFeature: aiOutput.killerFeature || '',
    executiveSummary: aiOutput.executiveSummary || '',
    keyFeatures: aiOutput.keyFeatures || [],
    matchPercentage: aiOutput.matchPercentage || 0,
    scores: simplifiedScores,
    scoreDetails: scoreDetails
  };

  return [{
    json: {
      success: true,
      vendor: vendor,
      research_summary: `Completed research on ${vendor.name}`
    }
  }];

} catch (error) {
  return [{
    json: {
      success: false,
      vendor_id: items[0].json?.id || 'unknown',
      error: {
        code: 'AI_PROCESSING_ERROR',
        message: `Vendor research failed: ${error.message}`
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
export interface VendorForComparison {
  id: string;
  name: string;
  website: string;
  description: string;
  features: string[];
}

export interface CriterionScoreDetail {
  state: 'no' | 'unknown' | 'yes' | 'star';
  evidence: string;
  comment: string;
}

export interface ComparedVendor {
  id: string;
  name: string;
  website: string;
  description: string;
  killerFeature: string;
  executiveSummary: string;
  keyFeatures: string[];
  matchPercentage: number;
  scores: Record<string, 'no' | 'unknown' | 'yes' | 'star'>;
  scoreDetails: Record<string, CriterionScoreDetail>;
}

export interface SingleVendorComparisonResponse {
  success: boolean;
  vendor?: ComparedVendor;
  vendor_id?: string;
  research_summary?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Research a single vendor against criteria
 * Called once per vendor for progressive loading
 */
export const compareVendor = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  projectCategory: string,
  vendor: VendorForComparison,
  criteria: TransformedCriterion[]
): Promise<SingleVendorComparisonResponse> => {
  const requestBody = {
    user_id: getUserId(),
    session_id: getSessionId(),
    project_id: projectId,
    project_name: projectName,
    project_description: projectDescription,
    project_category: projectCategory,
    vendor,
    criteria: criteria.filter(c => !c.isArchived),
    timestamp: new Date().toISOString()
  };

  // ... fetch implementation
  // Timeout: 60000ms (60 seconds) per vendor
};
```

### Frontend Progressive Loading Pattern

```typescript
// In VendorComparison component or hook
const [vendors, setVendors] = useState<ComparedVendor[]>([]);
const [loadingVendorIds, setLoadingVendorIds] = useState<Set<string>>(new Set());
const [failedVendorIds, setFailedVendorIds] = useState<Set<string>>(new Set());

// Process vendors sequentially
const processVendors = async (selectedVendors: VendorForComparison[]) => {
  // Initialize all as loading
  setLoadingVendorIds(new Set(selectedVendors.map(v => v.id)));

  for (const vendor of selectedVendors) {
    try {
      const response = await compareVendor(
        projectId, projectName, projectDescription, projectCategory,
        vendor, criteria
      );

      if (response.success && response.vendor) {
        // Add completed vendor to state
        setVendors(prev => [...prev, response.vendor!]);
      } else {
        // Mark as failed
        setFailedVendorIds(prev => new Set([...prev, vendor.id]));
      }
    } catch (error) {
      setFailedVendorIds(prev => new Set([...prev, vendor.id]));
    } finally {
      // Remove from loading
      setLoadingVendorIds(prev => {
        const next = new Set(prev);
        next.delete(vendor.id);
        return next;
      });
    }
  }

  // Sort by matchPercentage once all complete
  setVendors(prev => [...prev].sort((a, b) => b.matchPercentage - a.matchPercentage));
};

// Retry a single failed vendor
const retryVendor = async (vendorId: string) => {
  const vendor = selectedVendors.find(v => v.id === vendorId);
  if (!vendor) return;

  setFailedVendorIds(prev => {
    const next = new Set(prev);
    next.delete(vendorId);
    return next;
  });
  setLoadingVendorIds(prev => new Set([...prev, vendorId]));

  // ... same logic as above for single vendor
};
```

### localStorage Persistence

```typescript
// Save compared vendors to localStorage
const storageKey = `compared_vendors_${projectId}`;

// After each vendor completes
localStorage.setItem(storageKey, JSON.stringify({
  vendors,
  failedVendorIds: [...failedVendorIds],
  timestamp: new Date().toISOString()
}));

// On component mount, load from storage if available
const saved = localStorage.getItem(storageKey);
if (saved) {
  const { vendors, failedVendorIds } = JSON.parse(saved);
  setVendors(vendors);
  setFailedVendorIds(new Set(failedVendorIds));
}
```

### Score Evidence Popup

When user clicks on a "yes" or "star" score:
```typescript
interface ScorePopupProps {
  criterionName: string;
  score: CriterionScoreDetail;
}

const ScorePopup = ({ criterionName, score }: ScorePopupProps) => (
  <Popover>
    <PopoverContent>
      <h4>{criterionName}</h4>
      <p>{score.comment}</p>
      {score.evidence && (
        <a href={score.evidence} target="_blank" rel="noopener noreferrer">
          View Evidence
        </a>
      )}
    </PopoverContent>
  </Popover>
);
```

## Configuration

### Environment Variables (n8n)
- OpenAI API key (for chat model)
- Perplexity API key (for search tool)

### Timeouts
- Request timeout: 120 seconds (deep research takes longer)
- Per-vendor timeout: 30 seconds

## Error Handling

1. **INVALID_INPUT**: Missing or malformed request data
2. **SEARCH_ERROR**: Perplexity search failed
3. **AI_PROCESSING_ERROR**: AI couldn't parse results
4. **INTERNAL_ERROR**: Unexpected server error

Frontend should:
- Show retry icon on failed vendor columns
- All criteria cells show retry icon (circular arrow) for failed vendors
- User can retry individual vendors manually
- Successfully loaded vendors persist in localStorage

## Match Percentage Calculation

The matchPercentage should be calculated by the AI based on:
- Number of "yes" and "star" scores
- Weighted by criterion importance (high = 3x, medium = 2x, low = 1x)
- "star" counts as 1.5x a "yes"
- "no" counts as 0
- "unknown" counts as 0.5

Formula:
```
weightedScore = Σ(score × importanceWeight)
maxScore = Σ(1.5 × importanceWeight)  // All stars
matchPercentage = (weightedScore / maxScore) × 100
```

## Testing

Test cases:
1. Single vendor with 10 criteria → Returns enriched vendor
2. Large criteria list (20+) → Handles within timeout
3. Invalid vendor website → Uses "unknown" for scores
4. Verify evidence URLs are provided for yes/star scores
5. Verify matchPercentage is reasonable (0-100)
6. Retry after failure → Same vendor can be retried
7. localStorage persistence → Data survives page refresh

## Performance Considerations

- Process vendors sequentially (one at a time)
- Each vendor call takes 30-60 seconds
- Cache results in localStorage per project
- Show spinner/loading state on vendor column during research
- Display completed vendors immediately as columns fill in
- Re-sort by matchPercentage only after all vendors complete

## Data Flow Summary

1. **Input**: Single vendor (basic info) + All criteria
2. **Process**:
   - Research the vendor against each criterion
   - Search for evidence using Perplexity
   - Assign scores with evidence links
   - Generate executive summary
   - Calculate match percentage
3. **Output**: Enriched vendor with:
   - Detailed scores per criterion (no/unknown/yes/star)
   - Evidence URLs and comments for scoreDetails
   - Executive summary
   - Key features
   - Killer feature
   - Match percentage

## Frontend Flow Summary

1. User clicks "Continue to Comparison"
2. Frontend shows comparison table with all vendor columns
3. For each vendor (sequentially):
   - Show loading spinner in that column
   - Call n8n workflow with single vendor
   - On success: populate column with data
   - On failure: show retry icons in all cells
4. After all complete: sort columns by matchPercentage
5. User can click retry icon on failed vendors
6. All data persists in localStorage

## Migration from Find Vendors Workflow

Based on `Clarioo AI Find Vendors2.json`:

### Nodes to Modify:
1. **Webhook Trigger**: Change path to `clarioo-compare-vendors`
2. **Input Validation**: Update validation for single `vendor` object (not array)
3. **AI Agent**: Update system message and prompt for deep research with evidence
4. **Structured Output Parser**: Update schema for enriched vendor with scoreDetails

### Nodes to Keep As-Is:
1. **OpenAI Chat Model**: Same configuration
2. **Perplexity Tool**: Same configuration
3. **Check Success**: Same logic
4. **Response nodes**: Same structure

### Key Differences:
- Find Vendors: Discovers new vendors from scratch (batch)
- Compare Vendors: Deep research on single known vendor (sequential from frontend)
- Output includes evidence URLs and AI comments for each score
- Scores use 4-state system (no/unknown/yes/star) instead of numbers
