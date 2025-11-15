# AI Prompts Documentation

This document catalogs all AI prompts used in the Clarioo Vendor Analyst application, organized by functionality category. Each prompt includes its location, purpose, and the complete prompt text.

**Last Updated:** 2025-10-26
**AI Provider:** OpenAI API
**Models Used:** GPT-4.1, O3, O4-mini, GPT-4.1-mini, GPT-4O

---

## Table of Contents

1. [Criteria Generation Prompts](#1-criteria-generation-prompts)
2. [Vendor Discovery Prompts](#2-vendor-discovery-prompts)
3. [Vendor Comparison Prompts](#3-vendor-comparison-prompts)
4. [Executive Summary Prompts](#4-executive-summary-prompts)
5. [Chat Assistant Prompts](#5-chat-assistant-prompts)
6. [Strategic Analysis Prompts](#6-strategic-analysis-prompts)

---

## 1. Criteria Generation Prompts

### 1.1 Initial Criteria Generation

**Location:** `src/components/vendor-discovery/CriteriaBuilder.tsx:72-91`

**Function:** `generateAIInitialCriteria()`

**Purpose:** Generates exactly 20 evaluation criteria when a user first enters their technology requirements. This is the core AI feature that jump-starts the vendor evaluation process by creating a comprehensive set of criteria tailored to the specific technology category and requirements.

**When It's Called:** Automatically triggered when the user completes Step 1 (Tech Input) and moves to Step 2 (Criteria Builder), unless initial criteria were already provided (e.g., resuming a saved project).

**Expected Output:** JSON object containing:
- `criteria`: Array of 20 criterion objects with `name`, `importance` (high/medium/low), and `type` (feature/technical/business/compliance)
- `explanation`: 200-300 word explanation of why these criteria were selected

**The Prompt:**

```
You are an expert technology consultant. Generate exactly 20 evaluation criteria for ${request.category} solutions based on this requirement: "${request.description}".

Focus heavily on product features and capabilities. Include a mix of:
- Core product features (8-10 criteria)
- Technical capabilities (4-5 criteria)
- Business factors (3-4 criteria)
- Compliance/security (2-3 criteria)

For each criterion, specify:
1. Name (concise but descriptive)
2. Importance (high/medium/low)
3. Type (feature/technical/business/compliance)

Then write a detailed explanation (200-300 words) of why these specific criteria were selected for this use case, what makes them important for ${request.category} solutions, and how they relate to the specific requirements mentioned.

Return in this JSON format:
{
  "criteria": [{"name": "...", "importance": "high|medium|low", "type": "feature|technical|business|compliance"}],
  "explanation": "detailed explanation text"
}
```

**API Parameters:**
- Model: User-selected (default: `gpt-4.1-2025-04-14`)
- Temperature: `0.3`
- Max Tokens: `1500`

**Fallback Behavior:** If API fails, generates 20 generic criteria covering standard categories like User Interface Design, Core Functionality, Performance Speed, etc. (see `generateFallbackCriteria()` at line 149)

---

## 2. Vendor Discovery Prompts

### 2.1 Vendor Discovery (Market Research)

**Location:** `src/components/vendor-discovery/VendorSelection.tsx:100-118`

**Function:** `generateAIVendors()`

**Purpose:** Discovers 8-10 real companies that provide solutions matching the user's technology requirements. This performs actual market research to find legitimate vendors rather than using mock data.

**When It's Called:** Automatically triggered when the user completes Step 2 (Criteria Builder) and enters Step 3 (Vendor Selection). Can also be manually triggered via the "Rediscover" button.

**Expected Output:** JSON array of 8-10 vendor objects with:
- `name`: Real company name
- `description`: Brief description (max 100 chars)
- `website`: Domain without https://
- `pricing`: Pricing information or "Contact for pricing"
- `rating`: Market rating on 1-5 scale

**The Prompt:**

```
Find 8-10 real companies that provide ${techRequest.category} solutions with the following requirements: ${techRequest.description}.

For each vendor, provide:
1. Company name (real company)
2. Brief description (max 100 chars)
3. Website URL (without https://)
4. Pricing information (if known, otherwise "Contact for pricing")
5. Market rating (1-5 scale)

Return only a JSON array with this exact structure:
[{
  "name": "Company Name",
  "description": "Brief description",
  "website": "company.com",
  "pricing": "pricing info",
  "rating": 4.2
}]

Focus on well-known, established vendors in the market.
```

**System Message:**
```
You are a vendor research expert. Provide accurate, real company information. Return only valid JSON.
```

**API Parameters:**
- Model: User-selected (stored in localStorage)
- Temperature: `0.3`
- Max Tokens: `3000`

**Retry Logic:** Implements exponential backoff for rate limiting (3 attempts max, with 1s, 2s, 4s delays)

**Fallback Behavior:** If API fails after 3 attempts, uses `generateMockVendors()` which provides category-specific templates (e.g., Salesforce, HubSpot for CRM; Asana, Monday.com for Project Management)

---

## 3. Vendor Comparison Prompts

### 3.1 Detailed Vendor Comparison Matrix

**Location:** `src/components/vendor-discovery/VendorTable.tsx:102-123`

**Function:** `generateAIComparison()`

**Purpose:** Generates comprehensive comparison data for all selected vendors against the evaluation criteria. This creates detailed assessments including numerical scores, yes/no/partial determinations, explanatory comments, and key features for each vendor.

**When It's Called:** Automatically triggered when the user completes Step 3 (Vendor Selection) and enters Step 4 (Vendor Comparison). Can also be manually triggered via "Generate AI Comparison" button.

**Expected Output:** JSON array of vendor comparison objects with:
- `name`: Exact vendor name (must match)
- `criteriaScores`: Object mapping criterion names to scores (1-5)
- `criteriaAnswers`: Object with `yesNo` (yes/no/partial) and `comment` (detailed explanation)
- `features`: Array of max 5 key features

**The Prompt:**

```
Generate detailed comparison data for these vendors: ${vendorNames}

Technology Requirements: ${techRequest.description}
Budget: ${techRequest.budget}

For each vendor, provide evaluation scores (1-5 scale) and detailed assessments for these criteria:
${topCriteria.map(c => `- ${c.name} (${c.importance} importance)`).join('\n')}

For each vendor, return:
1. Evaluation scores (1-5) for each criterion
2. Yes/No/Partial assessment with detailed explanations
3. Key features list (max 5 features)

Return only a JSON array matching this structure:
[{
  "name": "Exact vendor name",
  "criteriaScores": {"criterion1": 4.2, "criterion2": 3.8},
  "criteriaAnswers": {"criterion1": {"yesNo": "yes", "comment": "Detailed explanation"}, "criterion2": {"yesNo": "partial", "comment": "Explanation"}},
  "features": ["feature1", "feature2", "feature3"]
}]

Be thorough and realistic in your assessments.
```

**System Message:**
```
You are a vendor research expert. Provide accurate, real company information. Return only valid JSON.
```

**API Parameters:**
- Model: User-selected (stored in localStorage)
- Temperature: `0.3`
- Max Tokens: `4000`

**Optimization Notes:**
- Only uses top 6 criteria to reduce API token usage and response size
- Uses full vendor names to ensure accurate matching

**Retry Logic:** Exponential backoff for rate limiting (3 attempts)

**Fallback Behavior:** If API fails, uses `generateFallbackScores()` which creates algorithmic scores based on randomized distributions weighted by criterion importance

---

## 4. Executive Summary Prompts

### 4.1 Executive Summary Generation

**Location:** `src/components/vendor-discovery/ExecutiveSummary.tsx:52-69`

**Function:** `generateAISummary()`

**Purpose:** Creates a concise, strategic executive summary for C-level stakeholders that synthesizes the entire vendor evaluation, providing market overview, top recommendations, and next steps.

**When It's Called:** Automatically generated when Step 4 (Vendor Comparison) loads. Can be manually regenerated via "Regenerate" button.

**Expected Output:** 2-3 paragraph executive summary text (plain text, not JSON)

**The Prompt:**

```
Generate a concise executive summary for a ${techRequest.category} vendor evaluation.

Technology Request: ${techRequest.description}
Budget: ${techRequest.budget}
Urgency: ${techRequest.urgency}

Top 3 Vendors Found:
${topVendors.map((v, i) => `${i + 1}. ${v.name} (Overall Score: ${calculateOverallScore(v).toFixed(1)}/5.0) - ${v.description}`).join('\n')}

Key Evaluation Criteria:
${highCriteria.map(c => `- ${c.name} (${c.importance} importance)`).join('\n')}

Write a professional 2-3 paragraph executive summary that includes:
1. Market overview and vendor landscape
2. Top recommendations with key differentiators
3. Implementation considerations and next steps

Keep it executive-level, strategic, and actionable. Avoid technical jargon.
```

**System Message:**
```
You are an enterprise technology consultant writing executive summaries for C-level stakeholders. Be strategic, concise, and business-focused.
```

**API Parameters:**
- Model: User-selected (stored in localStorage, default: `gpt-4.1-2025-04-14`)
- Temperature: `0.7` (higher for more creative, varied output)
- Max Tokens: `800`

**Fallback Behavior:** If API fails, uses `generateFallbackSummary()` which creates a template-based summary using:
- Vendor count and criteria count
- Top vendor score
- Number of vendors scoring above 4.0
- Average market rating
- Budget and urgency from tech request

**Template Example:**
```
Our analysis of the ${techRequest.category} market has identified ${vendors.length} qualified vendors to meet your ${urgency} technology requirements. The evaluation considered ${criteria.length} key criteria across feature capabilities, technical requirements, business alignment, and compliance needs.

${topVendor.name} emerges as the leading candidate with an overall score of ${score}/5.0, offering ${description}. The vendor landscape shows ${topMatches} strong contenders scoring above 4.0, with an average market rating of ${avgRating} stars, indicating a mature and competitive solution space.

Given your ${budget} budget and ${urgency} priority timeline, we recommend initiating detailed discussions with the top 3 vendors. Key next steps include conducting proof-of-concept evaluations, detailed cost analysis, and stakeholder demos to validate functional requirements and ensure optimal vendor-organization fit.
```

---

## 5. Chat Assistant Prompts

### 5.1 Criteria Refinement Chat

**Location:** `src/components/vendor-discovery/CriteriaBuilder.tsx:192-196`

**Function:** `handleSendMessage()`

**Purpose:** Provides an interactive AI chat assistant to help users refine their evaluation criteria, ask questions, and get suggestions. This allows for conversational refinement of the criteria set after the initial generation.

**When It's Called:** User types a message in the chat interface on the Criteria Builder page and presses Enter or clicks Send.

**Expected Output:** Plain text response (conversational AI assistant reply)

**The Prompt (System Message):**

```
You are an AI assistant helping to define evaluation criteria for vendor selection.
The user is looking for ${techRequest.category} software with the following requirements: ${techRequest.description}.
Help them refine their criteria, suggest new ones, or answer questions about vendor evaluation.
Be concise and practical. Focus on criteria that would help differentiate between vendors.
Current criteria: ${criteria.map(c => `${c.name} (${c.importance} priority, ${c.type} type)`).join(', ')}
```

**API Parameters:**
- Model: User-selected (can be changed in settings dropdown)
- Temperature: `0.7`
- Max Tokens: `500`
- Context: Last 5 messages from chat history

**Chat Features:**
- Maintains conversation history
- Shows typing indicator during generation
- Includes context of current criteria in every request
- Allows model selection (GPT-4.1, O3, O4-mini, GPT-4.1-mini)

**Example User Questions:**
- "Can you suggest more security-related criteria?"
- "What's missing from my criteria list?"
- "Should I add integration capabilities?"
- "How should I prioritize these criteria?"

---

## 6. Strategic Analysis Prompts

### 6.1 Strategic Vendor Comparison Analysis

**Location:** `src/components/vendor-discovery/VendorTable.tsx:476-495`

**Function:** `generateStrategicComparison()`

**Purpose:** Generates an in-depth strategic analysis of all vendors, including rankings, pros/cons, best fit recommendations, risk assessment, and implementation considerations. This is a higher-level analysis than the detailed comparison matrix.

**When It's Called:** Manual trigger only - user must click a button to generate this analysis (not shown in current UI, but function exists in codebase).

**Expected Output:** Strategic comparison analysis text (400-500 words)

**The Prompt:**

```
Analyze this vendor comparison for ${techRequest.category} solutions:

REQUIREMENTS: ${techRequest.description}

VENDORS:
${vendorSummary.map(v => `
- ${v.name}: Overall Score ${v.overallScore.toFixed(1)}/5.0, Rating: ${v.rating}
  Top Strengths: ${v.topCriteria.map(c => `${c.name} (${c.score.toFixed(1)})`).join(', ')}
`).join('')}

KEY CRITERIA: ${criteria.filter(c => c.importance === 'high').map(c => c.name).join(', ')}

Provide a strategic comparison analysis including:
1. Vendor rankings with key differentiators
2. Pros/cons for each vendor
3. Best fit recommendation based on requirements
4. Risk assessment and mitigation strategies
5. Implementation considerations

Keep it executive-level and actionable (400-500 words).
```

**System Message:**
```
You are a senior technology consultant providing strategic vendor analysis for enterprise decision makers.
```

**API Parameters:**
- Model: User-selected (stored in localStorage)
- Temperature: `0.3`
- Max Tokens: `1500`

**Data Preparation:**
- Creates vendor summary with overall scores
- Includes top 3 criteria strengths per vendor
- Filters to only high-importance criteria

**Usage Notes:**
- More comprehensive than executive summary
- Provides specific pros/cons for each vendor
- Includes risk assessment not found in other prompts
- Intended for detailed decision-making review

---

## Prompt Engineering Best Practices Used

### Consistency Patterns

1. **JSON Response Format:** Most prompts explicitly request JSON output and provide exact structure examples
2. **System Messages:** Always define the AI's role (e.g., "expert technology consultant", "vendor research expert")
3. **Temperature Settings:**
   - Low (0.3): For factual, consistent outputs (criteria, vendor data, comparison)
   - Medium (0.7): For creative, varied outputs (executive summaries, chat responses)
4. **Token Limits:** Carefully calibrated based on expected output size
5. **Retry Logic:** Rate limiting handled with exponential backoff
6. **Fallback Mechanisms:** Every AI feature has non-AI fallback to ensure functionality

### Prompt Structure

All prompts follow this pattern:
1. **Context Setting:** Define the domain and requirements
2. **Input Data:** Provide all relevant user data
3. **Output Specification:** Clearly define expected output format
4. **Constraints:** Specify limits (e.g., max 100 chars, 8-10 vendors, exactly 20 criteria)
5. **Quality Guidelines:** Include instructions like "be thorough", "focus on real companies", "avoid jargon"

### Error Handling

- **JSON Parsing:** Strips markdown code blocks (```json) before parsing
- **Content Cleaning:** Removes extra whitespace and formatting
- **Validation:** Checks for required fields and falls back to defaults if missing
- **User Feedback:** Toast notifications inform users when AI features succeed or fail

---

## API Configuration

### Shared Configuration

**API Endpoint:** `https://api.openai.com/v1/chat/completions`

**API Key Location:** Hardcoded in each component (security risk - should be moved to environment variables)
- Key: `fi`
- Found in: CriteriaBuilder.tsx:48, VendorSelection.tsx:38, VendorTable.tsx:38, ExecutiveSummary.tsx:47

**Model Selection:**
- Stored in localStorage: `openai_model`
- Default: `gpt-4.1-2025-04-14`
- Available models:
  - `gpt-4.1-2025-04-14` (GPT-4.1 - Recommended)
  - `o3-2025-04-16` (O3 - Advanced Reasoning)
  - `o4-mini-2025-04-16` (O4 Mini - Fast Reasoning)
  - `gpt-4.1-mini-2025-04-14` (GPT-4.1 Mini)
  - `gpt-4o` (GPT-4O - Legacy)

### Headers (Common to All Requests)

```javascript
{
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
}
```

---

## Usage Analytics

### Prompt Usage by Component

| Component | Prompts | Auto-Triggered | Manual Trigger | Fallback Available |
|-----------|---------|----------------|----------------|-------------------|
| CriteriaBuilder | 2 | 1 (Initial) | 1 (Chat) | Yes |
| VendorSelection | 1 | 1 (Discovery) | 0 | Yes |
| VendorTable | 2 | 1 (Comparison) | 1 (Strategic) | Yes |
| ExecutiveSummary | 1 | 1 (Summary) | 0 | Yes |

### Token Usage Estimates

| Prompt Type | Avg Input Tokens | Max Output Tokens | Total Tokens | Cost Estimate (GPT-4.1) |
|-------------|------------------|-------------------|--------------|------------------------|
| Initial Criteria | ~200 | 1,500 | ~1,700 | $0.051 |
| Vendor Discovery | ~150 | 3,000 | ~3,150 | $0.095 |
| Detailed Comparison | ~500 | 4,000 | ~4,500 | $0.135 |
| Executive Summary | ~300 | 800 | ~1,100 | $0.033 |
| Chat Messages | ~200 | 500 | ~700 | $0.021 |
| Strategic Analysis | ~400 | 1,500 | ~1,900 | $0.057 |

**Estimated Total Per Complete Workflow:** ~$0.30-0.40 per vendor discovery project

---

## Security Considerations

⚠️ **CRITICAL SECURITY ISSUES:**

1. **Exposed API Key:** OpenAI API key is hardcoded in frontend code (visible in browser)
   - **Risk:** Anyone can extract and use the API key
   - **Recommendation:** Move to backend proxy service or environment variables

2. **No Rate Limiting:** Client-side rate limiting only (exponential backoff)
   - **Risk:** Users can exhaust API quotas
   - **Recommendation:** Implement server-side rate limiting per user

3. **No Cost Controls:** No spending limits or user quotas
   - **Risk:** Unlimited API usage costs
   - **Recommendation:** Implement usage tracking and cost alerts

4. **No Input Sanitization:** User inputs passed directly to AI
   - **Risk:** Prompt injection attacks
   - **Recommendation:** Sanitize and validate all user inputs

---

## Future Enhancements

### Recommended Improvements

1. **Prompt Versioning:** Track and version prompts for A/B testing
2. **Response Caching:** Cache common queries to reduce API costs
3. **Streaming Responses:** Implement streaming for better UX on long responses
4. **Fine-tuning:** Create fine-tuned models for domain-specific tasks
5. **Prompt Templates:** Externalize prompts to JSON/YAML for easier updates
6. **Multi-language Support:** Add i18n to prompts
7. **Context Management:** Implement smarter context window management

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-26 | 1.0 | Initial documentation of all AI prompts |

---

*This documentation is auto-generated from codebase analysis. Last updated: 2025-10-26*
