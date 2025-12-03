# n8n Workflow Modification Guide: Vendor Card Summary Generator

## Workflow to Modify
- **Workflow Name**: Clarioo TESTING Vendor Summary
- **Workflow ID**: HjFKACyxaP2aqbvk
- **URL**: https://n8n.lakestrom.com/workflow/HjFKACyxaP2aqbvk

## Overview
This workflow currently generates **executive summaries** for the entire project. We need to modify it to generate **vendor card summaries** (killerFeature, executiveSummary, keyFeatures) for individual vendors using Perplexity for web research.

---

## Step 1: Update Input Validation Node

### Current Input Schema
```javascript
{
  project_id: string,
  project_name: string,
  project_description: string,
  session_id: string,
  criteria: array,
  vendors: array,
  timestamp: string
}
```

### New Input Schema
```javascript
{
  vendor_name: string,          // REQUIRED
  vendor_website: string,        // REQUIRED
  project_id: string,            // REQUIRED
  project_context?: string       // OPTIONAL - brief project description
}
```

### Modified Validation Code

Navigate to: **Input Validation** node → Edit Code

Replace the entire JavaScript code with:

```javascript
const body = items[0].json.body || {};

const vendor_name = body.vendor_name;
const vendor_website = body.vendor_website;
const project_id = body.project_id;
const project_context = body.project_context || '';

const errors = [];

if (!vendor_name || vendor_name.trim() === '') {
  errors.push('vendor_name is required');
}

if (!vendor_website || vendor_website.trim() === '') {
  errors.push('vendor_website is required');
}

if (!project_id || project_id.trim() === '') {
  errors.push('project_id is required');
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
    vendor_name: vendor_name.trim(),
    vendor_website: vendor_website.trim(),
    project_id,
    project_context: project_context.trim()
  }
}];
```

---

## Step 2: Add Perplexity Tool

### Add New Node: Perplexity Chat Model

1. Click the **+** button next to **AI Analysis Agent** node
2. Search for "Perplexity" in the tool search
3. Select **Perplexity Chat Model**
4. Configure:
   - **Model**: `llama-3.1-sonar-large-128k-online` (for web search capabilities)
   - **Credentials**: Add your Perplexity API credentials
   - **Temperature**: `0.3` (for consistent, factual responses)
   - **Max Tokens**: `2000`

5. Connect: **Perplexity Chat Model** → **AI Analysis Agent** (via the `ai_languageModel` connection)
6. **DISCONNECT** the **OpenAI Chat Model** from **AI Analysis Agent**

---

## Step 3: Update AI Analysis Agent Prompt

Navigate to: **AI Analysis Agent** node → Edit

### New System Message

Replace the **System Message** in Options with:

```
You are a vendor research assistant that generates concise, accurate vendor summaries for comparison tools.

Your task is to research a vendor and generate a structured JSON summary with three key fields:
1. killerFeature - The vendor's most unique/compelling feature (1-2 sentences)
2. executiveSummary - A brief "About" section (2-3 sentences)
3. keyFeatures - Top 3-5 features as bullet points

CRITICAL RULES:
1. Use Perplexity's web search capabilities to gather current information
2. Focus on factual, verifiable information from official sources
3. Be concise - vendor cards have limited space
4. Prioritize recent information (last 12-24 months)
5. Return ONLY valid JSON - no additional text before or after

Your response MUST be a valid JSON object with this exact structure:
{
  "vendor_name": "string",
  "killerFeature": "string (1-2 sentences, starts with what makes them unique)",
  "executiveSummary": "string (2-3 sentences, brief about section)",
  "keyFeatures": ["feature1", "feature2", "feature3", "feature4", "feature5"]
}

Do NOT include any text before or after the JSON.
```

### New Prompt Text

Replace the **Text** field with:

```
Research this vendor and generate a summary for a comparison tool vendor card.

VENDOR TO RESEARCH:
- Name: {{ $json.vendor_name }}
- Website: {{ $json.vendor_website }}

{{ $json.project_context ? `PROJECT CONTEXT:\n${$json.project_context}\n\n` : '' }}

RESEARCH TASKS:
1. Visit the vendor's website and recent documentation
2. Identify their most unique/compelling feature (killer feature)
3. Understand their core product offering and value proposition
4. List their top 3-5 key features/capabilities

OUTPUT REQUIREMENTS:
- killerFeature: What makes this vendor stand out? What's their unique selling point? (1-2 sentences)
- executiveSummary: Brief "About" section - what does this vendor do? (2-3 sentences)
- keyFeatures: Top 3-5 features as short phrases (not full sentences)

Use Perplexity's search to gather current, accurate information from official sources.

Return ONLY the JSON object with the structure defined in the system message.
```

---

## Step 4: Update Structured Output Parser

Navigate to: **Structured Output Parser** node → Edit

### New JSON Schema

Replace the **Input Schema** with:

```json
{
  "type": "object",
  "properties": {
    "vendor_name": {
      "type": "string",
      "description": "The vendor's name (should match input)"
    },
    "killerFeature": {
      "type": "string",
      "description": "The vendor's most unique/compelling feature (1-2 sentences)"
    },
    "executiveSummary": {
      "type": "string",
      "description": "Brief about section (2-3 sentences)"
    },
    "keyFeatures": {
      "type": "array",
      "description": "Top 3-5 key features",
      "items": {
        "type": "string"
      },
      "minItems": 3,
      "maxItems": 5
    }
  },
  "required": ["vendor_name", "killerFeature", "executiveSummary", "keyFeatures"]
}
```

---

## Step 5: Update Format Success Response

Navigate to: **Format Success Response** node → Edit Code

### New Response Formatting Code

Replace the JavaScript code with:

```javascript
try {
  const aiOutput = items[0].json.output;

  if (!aiOutput || !aiOutput.vendor_name || !aiOutput.killerFeature) {
    throw new Error('Invalid AI response: missing required vendor summary fields');
  }

  // Ensure keyFeatures is an array
  if (!Array.isArray(aiOutput.keyFeatures)) {
    throw new Error('Invalid AI response: keyFeatures must be an array');
  }

  return [{
    json: {
      success: true,
      vendor_summary: {
        vendor_name: aiOutput.vendor_name,
        killerFeature: aiOutput.killerFeature,
        executiveSummary: aiOutput.executiveSummary,
        keyFeatures: aiOutput.keyFeatures
      },
      generated_at: new Date().toISOString()
    }
  }];

} catch (error) {
  return [{
    json: {
      success: false,
      error: {
        code: 'AI_PROCESSING_ERROR',
        message: `Vendor summary generation failed: ${error.message}`
      }
    }
  }];
}
```

---

## Step 6: Update Error Handling

Navigate to: **Handle Processing Error** node → Edit Code

Replace the JavaScript code with:

```javascript
if (items[0].json.error && items[0].json.error.code) {
  return [{
    json: {
      success: false,
      error: items[0].json.error
    }
  }];
}

const errorMessage = items[0].json.error?.message || items[0].json.message || 'An unexpected error occurred during vendor summary generation';

return [{
  json: {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: errorMessage,
      vendor_name: items[0].json.vendor_name || 'Unknown'
    }
  }
}];
```

---

## Step 7: Test the Modified Workflow

### Test Input (use webhook test URL)

```json
{
  "vendor_name": "Salesforce",
  "vendor_website": "https://www.salesforce.com",
  "project_id": "test-project-123",
  "project_context": "We are evaluating CRM platforms for a mid-sized B2B SaaS company"
}
```

### Expected Output

```json
{
  "success": true,
  "vendor_summary": {
    "vendor_name": "Salesforce",
    "killerFeature": "Einstein AI integrates predictive analytics and automation across the entire platform, enabling sales teams to prioritize leads and personalize customer interactions at scale.",
    "executiveSummary": "Salesforce is the world's leading cloud-based CRM platform, offering comprehensive sales, service, marketing, and commerce solutions. Built on a highly customizable platform with extensive third-party integrations via AppExchange.",
    "keyFeatures": [
      "AI-powered lead scoring and forecasting (Einstein)",
      "360-degree customer view across all touchpoints",
      "Extensive AppExchange marketplace (7000+ integrations)",
      "Advanced workflow automation and custom app development",
      "Real-time collaboration tools (Slack integration)"
    ]
  },
  "generated_at": "2025-12-03T10:30:00.000Z"
}
```

---

## Step 8: Save and Activate

1. Click **Save** in the top right
2. Ensure workflow is **Active** (toggle in top right)
3. Test using the test webhook URL before deploying to production

---

## Summary of Changes

| Component | Change |
|-----------|--------|
| **Input** | Changed from multi-vendor project analysis to single vendor research |
| **AI Model** | Replaced OpenAI with Perplexity for web search capabilities |
| **Prompt** | Changed from "analyze comparison results" to "research vendor and generate summary" |
| **Output Schema** | Changed from executive summary structure to vendor card structure |
| **Response Format** | Simplified to return vendor_summary object |

---

## Notes

- **Perplexity** provides real-time web search, ensuring vendor information is current
- The workflow now processes **one vendor at a time** (can be called in parallel from client)
- Client-side code will batch-process multiple vendors by calling this workflow multiple times
- Estimated processing time: 5-10 seconds per vendor (depending on Perplexity response time)
