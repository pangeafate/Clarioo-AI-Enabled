# localStorage & Webhooks Documentation

**Last Updated:** 2026-01-15
**Purpose:** Comprehensive reference for all localStorage data categories and n8n webhook endpoints used in the Clarioo application.

---

## Table of Contents

1. [localStorage Categories](#localstorage-categories)
2. [Webhook Endpoints](#webhook-endpoints)
3. [Storage Patterns](#storage-patterns)
4. [Data Flow Examples](#data-flow-examples)

---

## localStorage Categories

### 1. Project Management

#### `clarioo_projects`
- **Type:** Array of Project objects
- **Purpose:** Master list of all user projects
- **Structure:**
  ```typescript
  {
    id: string;              // UUID
    name: string;            // Project name
    description: string;     // Project description
    category: string;        // Project category (e.g., "CRM", "CX Platform")
    status: 'in-progress' | 'completed' | 'archived';
    created_at: string;      // ISO timestamp
    updated_at: string;      // ISO timestamp
    user_id: string;         // User UUID
    techRequest?: {
      companyContext: string;
      solutionRequirements: string;
    };
  }
  ```
- **Used By:** Project listing, project selection, Excel/JSON export
- **Related Files:** `src/services/n8nService.ts`, `src/services/excelExportService.ts`

#### `workflow_{projectId}`
- **Type:** Object containing project workflow data
- **Purpose:** Stores complete project workflow state including criteria and selected vendors
- **Structure:**
  ```typescript
  {
    project: Project;
    criteria: TransformedCriterion[];
    selectedVendors: Vendor[];
    techRequest: {
      companyContext: string;
      solutionRequirements: string;
      description: string;
    };
  }
  ```
- **Used By:** Project workflow, vendor discovery, criteria management
- **Related Files:** `src/services/n8nService.ts`

#### `criteria_{projectId}`
- **Type:** Array of Criterion objects
- **Purpose:** Project-specific criteria list (legacy, being replaced by workflow storage)
- **Structure:** Array of `TransformedCriterion` objects
- **Used By:** Criteria management, comparison matrix
- **Related Files:** `src/services/n8nService.ts`

---

### 1.5. Landing Page & Onboarding

#### `landing_company_info`
- **Type:** String
- **Purpose:** Company context entered on landing page (temporarily stored during onboarding flow)
- **Usage Pattern:** Written on landing page, read during project creation, cleared after use
- **Used By:** Landing page flow, project creation
- **Related Files:**
  - `src/components/landing/AnimatedInputs.tsx` (write)
  - `src/components/landing/LandingPage.tsx` (read)
  - `src/components/tech-input/TechInput.tsx` (read)

#### `landing_tech_needs`
- **Type:** String
- **Purpose:** Tech requirements entered on landing page (temporarily stored during onboarding flow)
- **Usage Pattern:** Written on landing page, read during project creation, cleared after use
- **Used By:** Landing page flow, project creation
- **Related Files:**
  - `src/components/landing/AnimatedInputs.tsx` (write)
  - `src/components/landing/LandingPage.tsx` (read)
  - `src/components/tech-input/TechInput.tsx` (read)

---

### 2. User & Session Management

#### `clarioo_user_id`
- **Type:** String (UUID)
- **Purpose:** Persistent user identifier across browser sessions
- **Generated:** On first visit using `crypto.randomUUID()`
- **Used By:** All n8n webhook requests, analytics, session tracking
- **Related Files:** `src/services/n8nService.ts` (line 105)

#### `clarioo_session_id`
- **Type:** String (UUID)
- **Purpose:** Session identifier unique per browser tab/window
- **Storage:** `sessionStorage` (not `localStorage`)
- **Generated:** On tab/window open using `crypto.randomUUID()`
- **Used By:** All n8n webhook requests, session tracking
- **Related Files:** `src/services/n8nService.ts` (line 118)

#### `clarioo_email`
- **Type:** JSON Object
- **Purpose:** User's email data for export metadata and communications
- **Structure:**
  ```typescript
  {
    email: string;           // User's email address
    timestamp?: string;      // When email was collected
    project_id?: string;     // Associated project ID (if collected during project)
  }
  ```
- **Used By:** Excel/JSON export, email collection workflow
- **Related Files:** `src/services/n8nService.ts` (line 1627-1694), `src/services/excelExportService.ts`

#### `mock_auth_session`
- **Type:** Session object
- **Purpose:** Mock authentication session for prototype (to be replaced by Supabase)
- **Structure:**
  ```typescript
  {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }
  ```
- **Used By:** Mock authentication service
- **Related Files:** `src/services/mock/authService.ts` (line 39)

---

### 2.5. Admin & Configuration

#### `clarioo_admin_mode`
- **Type:** String (`'true'` | `'false'`)
- **Purpose:** Toggles admin mode for accessing templates and admin features
- **Default:** Not set (treated as `'false'`)
- **Used By:** Admin mode toggle, template access control
- **Related Files:**
  - `src/components/admin/AdminModeToggle.tsx` (read/write)
  - `src/components/templates/TemplatesModal.tsx` (read - checks access)

#### `clarioo_webhook_mode`
- **Type:** String (`'production'` | `'testing'`)
- **Purpose:** Switch between production and testing n8n webhook URLs
- **Default:** `'production'`
- **Used By:** All n8n webhook requests
- **Related Files:** `src/config/webhooks.ts` (line 14, 23, 32)

#### `WEBHOOK_LOCAL_OVERRIDE`
- **Type:** String (`'true'` | undefined)
- **Purpose:** Override webhook URLs to use localhost for local n8n testing
- **Default:** Not set (uses production/testing URLs)
- **Used By:** Local development and n8n workflow testing
- **Related Files:** `src/config/webhooks.ts` (line 95)

---

### 3. Comparison & Evaluation

#### `comparison_state_{projectId}`
- **Type:** ComparisonState object
- **Purpose:** Overall comparison orchestration state for two-stage comparison system
- **Structure:**
  ```typescript
  {
    criteria: CriterionComparisonState[];
    activeWorkflows: number;
    isPaused: boolean;
    currentStage: 1 | 2;
    stage1Complete: boolean;
    stage2Complete: boolean;
  }
  ```
- **Used By:** VendorComparisonNew component, comparison orchestration
- **Related Files:** `src/utils/comparisonStorage.ts` (line 28)

#### `stage1_results_{projectId}`
- **Type:** Stage1StorageData object
- **Purpose:** Stage 1 (individual research) comparison results
- **Structure:**
  ```typescript
  {
    projectId: string;
    results: Record<string, VendorCriterionResult>; // key: "{vendorId}:{criterionId}"
    timestamp: string;
  }
  ```
- **Used By:** Two-stage comparison system (Stage 1: Individual cell research)
- **Related Files:** `src/utils/comparisonStorage.ts` (line 26)

#### `stage2_results_{projectId}`
- **Type:** Stage2StorageData object
- **Purpose:** Stage 2 (comparative ranking) comparison results
- **Structure:**
  ```typescript
  {
    projectId: string;
    results: Record<string, CriterionRankingResult>; // key: criterionId
    timestamp: string;
  }
  ```
- **Used By:** Two-stage comparison system (Stage 2: Comparative ranking)
- **Related Files:** `src/utils/comparisonStorage.ts` (line 27)

#### `compared_vendors_{projectId}`
- **Type:** Record of VendorComparisonState objects
- **Purpose:** Legacy single-stage comparison results (to be deprecated)
- **Used By:** Old VendorComparison component (being replaced by two-stage system)
- **Related Files:** `src/utils/comparisonStorage.ts` (line 25)

#### `chat_{projectId}`
- **Type:** JSON Array of ChatMessage objects
- **Purpose:** Persists criteria chat history per project for context preservation
- **Structure:**
  ```typescript
  [{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }]
  ```
- **Usage Pattern:** Appended with each chat message, maintains conversation context
- **Used By:** Criteria chat interface, AI context management
- **Related Files:**
  - `src/hooks/useCriteriaChat.ts` (line 164)
  - `src/hooks/useChat.ts` (generic chat hook)

---

### 3.5. Vendor Discovery & Selection

#### `vendors_{projectId}`
- **Type:** JSON Array of Vendor objects
- **Purpose:** Stores discovered vendors for a project
- **Structure:**
  ```typescript
  [{
    id: string;              // UUID
    name: string;            // Vendor name
    description: string;     // Brief vendor description
    website: string;         // Vendor website URL
    logo?: string;           // Logo URL (optional)
    matchPercentage: number; // Initial match score (0-100)
  }]
  ```
- **Usage Pattern:** Written after vendor discovery, read by vendor selection and comparison components
- **Used By:** Vendor list rendering, vendor selection, comparison matrix initialization
- **Related Files:** `src/components/vendor-discovery/VendorSelection.tsx` (line 74)

#### `vendor_selection_{projectId}`
- **Type:** JSON Array of vendor IDs (strings)
- **Purpose:** Tracks which vendors the user has selected for comparison
- **Structure:** `["vendor-uuid-1", "vendor-uuid-2", ...]`
- **Usage Pattern:** Updated when user selects/deselects vendors in UI
- **Used By:** Vendor selection state management, comparison matrix filtering
- **Related Files:** `src/components/vendor-discovery/VendorSelection.tsx` (line 75)
- **Note:** Selected vendors are also synced to `workflow_{projectId}.selectedVendors` for persistence

---

### 4. Summaries & Analysis

#### `clarioo_executive_summary_{projectId}`
- **Type:** ExecutiveSummaryData object
- **Purpose:** AI-generated executive summary for project
- **Structure:**
  ```typescript
  {
    overview: {
      projectGoal: string;
      keyRequirements: string[];
      evaluationCriteria: number;
    };
    vendorAnalysis: Array<{
      vendorName: string;
      overallAssessment: string;
      strengths: string[];
      weaknesses: string[];
      bestFor: string;
    }>;
    recommendation: {
      topPick: string;
      reason: string;
      considerations: string[];
    };
  }
  ```
- **Generated By:** n8n Executive Summary webhook
- **Used By:** Executive Summary tab, Excel/JSON export
- **Related Files:** `src/services/n8nService.ts` (line 1355)

#### `clarioo_vendor_summary_{vendorName}`
- **Type:** VendorSummaryData object
- **Purpose:** AI-generated vendor card summary (About section, Killer Feature, Key Features)
- **Structure:**
  ```typescript
  {
    vendor_name: string;
    executive_summary: string;    // About section
    killer_feature: string;       // Main differentiator
    key_features: string[];       // Top 5-7 features
    timestamp: string;
  }
  ```
- **Generated By:** n8n Vendor Summary webhook (Perplexity AI)
- **Used By:** Vendor cards, Excel/JSON export
- **Related Files:** `src/services/n8nService.ts` (line 1563)
- **Note:** Vendor summaries are cached globally by vendor name (not project-specific), meaning the same vendor summary is reused across all projects to optimize API calls

---

### 5. Battlecards

#### `clarioo_battlecards_state_{projectId}`
- **Type:** BattlecardsState object
- **Purpose:** Battlecard generation state and progress tracking
- **Structure:**
  ```typescript
  {
    rows: BattlecardRowMetadata[];
    status: 'idle' | 'generating' | 'paused' | 'completed' | 'failed';
    current_row_index: number;
    timestamp: string;
  }
  ```
- **Used By:** Battlecard generation orchestration, resume functionality
- **Related Files:** `src/utils/battlecardsStorage.ts` (line 11)

#### `clarioo_battlecards_rows_{projectId}`
- **Type:** Array of BattlecardRowState objects
- **Purpose:** Individual battlecard row data with vendor cells
- **Structure:**
  ```typescript
  [{
    row_id: string;
    category_title: string;
    category_definition: string;
    cells: BattlecardCell[];  // One per vendor
    status: 'pending' | 'generating' | 'completed' | 'failed';
    timestamp: string;
  }]
  ```
- **Used By:** Battlecard display, Excel/JSON export
- **Related Files:** `src/utils/battlecardsStorage.ts` (line 12)

---

### 6. Vendor Positioning

#### `vendor_scatterplot_positions_{projectId}`
- **Type:** VendorScatterplotCache object
- **Purpose:** Cached vendor positioning data for scatter plot (SP_026)
- **Structure:**
  ```typescript
  {
    project_id: string;
    vendor_ids: string[];
    positions: Array<{
      vendor_id: string;
      vendor_name: string;
      solution_scope: number;       // 0-100 (Single-Purpose → Multi-Function)
      industry_focus: number;       // 0-100 (Vertical-Specific → Multiple Verticals)
      reasoning: string;
    }>;
    timestamp: string;
  }
  ```
- **Generated By:** n8n Vendor Scatterplot webhook (AI positioning analysis)
- **Used By:** VendorPositioningScatterPlot component, Excel export
- **Cache Invalidation:** Cleared when vendor list changes
- **Related Files:** `src/services/n8nService.ts` (line 2393), `src/hooks/useVendorScatterplot.ts`

#### `positioning_data_{projectId}`
- **Type:** JSON Object
- **Purpose:** Stores positioning data loaded from templates (when using template-based projects)
- **Structure:** Similar to `vendor_scatterplot_positions_{projectId}` but sourced from templates
- **Usage Pattern:** Written when loading template data, read by scatter plot component
- **Used By:** Template service, scatter plot visualization
- **Related Files:** `src/services/templateService.ts` (line 352)
- **Note:** Alternative to AI-generated positioning; used when project is created from template

---

### 7. User Preferences & Configuration

#### `custom_criterion_types`
- **Type:** Array of strings
- **Purpose:** User-defined custom criterion types beyond standard categories
- **Default Categories:** Feature, Technical, Business, Compliance
- **Used By:** Criteria builder, criterion type selection
- **Related Files:** `src/services/storageService.ts` (line 31)

#### `user_preferences`
- **Type:** Object with user UI preferences
- **Purpose:** Theme, language, and other UI preferences
- **Structure:**
  ```typescript
  {
    theme?: 'light' | 'dark';
    language?: string;
    [key: string]: any;
  }
  ```
- **Used By:** UI theme management, user settings
- **Related Files:** `src/services/storageService.ts` (line 32)

---

### 8. Mock Services (Prototype Only)

#### `mock_projects`
- **Type:** Array of Project objects
- **Purpose:** Mock project data for prototype testing
- **Note:** To be removed when real backend is integrated
- **Related Files:** `src/services/mock/projectService.ts` (line 48)

#### `draft_projects`
- **Type:** Array of draft project objects
- **Purpose:** Draft projects not yet finalized
- **Related Files:** `src/services/storageService.ts` (line 33)

#### `ui_state`
- **Type:** Object with UI state
- **Purpose:** Temporary UI state persistence
- **Related Files:** `src/services/storageService.ts` (line 34)

---

## Webhook Endpoints

All webhooks are hosted on n8n instance: `https://n8n.lakestrom.com/webhook/`

### Mode Selection

Webhook mode is controlled by `clarioo_webhook_mode` localStorage key:
- **Production:** Named URLs (e.g., `clarioo-project-creation`)
- **Testing:** UUID URLs (e.g., `c53c2c35-08ea-4171-8e71-ac06c6628115`)
- **Local:** Override with `WEBHOOK_LOCAL_OVERRIDE=true` for localhost testing

---

### 1. Project Creation

**Endpoint:** `POST /webhook/clarioo-project-creation`

**Purpose:** Create new project with AI-generated criteria based on user input

**Timeout:** 120 seconds

**Request:**
```typescript
{
  user_id: string;              // From clarioo_user_id
  session_id: string;           // From clarioo_session_id (sessionStorage)
  company_context: string;      // User's company background
  solution_requirements: string; // User's solution requirements
  timestamp: string;            // ISO timestamp
}
```

**Response:**
```typescript
{
  success: boolean;
  project?: {
    name: string;               // AI-generated project name
    description: string;        // AI-generated project description
    category: string;           // AI-determined category
  };
  criteria?: Array<{
    id: string;                 // UUID
    name: string;
    description: string;        // Maps to "explanation" in app
    importance: 'high' | 'medium' | 'low';
    type: string;               // 'feature', 'technical', 'business', 'compliance', or custom
    isArchived: boolean;
  }>;
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. User submits company context and solution requirements
2. n8n processes with AI (OpenAI/Claude)
3. Returns project metadata + 10-15 criteria
4. Saved to `clarioo_projects` and `workflow_{projectId}`

**Related Files:** `src/services/n8nService.ts` (line 192)

---

### 2. Criteria Chat

**Endpoint:** `POST /webhook/clarioo-criteria-chat`

**Purpose:** Interactive chat for managing criteria (add, update, delete)

**Timeout:** 120 seconds

**Request:**
```typescript
{
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  criteria: TransformedCriterion[];  // Current criteria list
  user_message: string;              // User's chat message
  chat_history: ChatMessage[];       // Last 10 messages for context
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;              // AI assistant's response message
  actions: Array<{
    type: 'create' | 'update' | 'delete';
    criterion?: TransformedCriterion;  // For create/update
    criterion_id?: string;             // For delete
    summary: string;                   // Human-readable action summary
  }>;
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. User sends chat message about criteria changes
2. n8n processes with AI to understand intent
3. Returns chat response + actions to perform
4. App updates criteria and saves to `workflow_{projectId}`

**Related Files:** `src/services/n8nService.ts` (line 298), `src/hooks/useCriteriaChat.ts`

---

### 3. Find Vendors

**Endpoint:** `POST /webhook/clarioo-find-vendors`

**Purpose:** AI-powered vendor discovery based on project criteria

**Timeout:** 180 seconds (3 minutes)

**Request:**
```typescript
{
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  criteria: TransformedCriterion[];
  max_vendors: number;          // Default: 10
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  vendors?: Array<{
    id: string;                 // UUID
    name: string;
    description: string;        // Brief vendor description
    website: string;            // Vendor website URL
    logo?: string;              // Logo URL (optional)
    matchPercentage: number;    // Initial match score (0-100)
  }>;
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. User requests vendor discovery
2. n8n performs web research (Perplexity/Serper API)
3. Returns top matching vendors
4. Saved to `workflow_{projectId}.selectedVendors`

**Related Files:** `src/services/n8nService.ts` (line 428), `src/components/vendor-discovery/VendorSelection.tsx`

---

### 4. Comparison - Stage 1 (Individual Cell Research)

**Endpoint:** `POST /webhook/find-criterion-vendor-stage1`

**Purpose:** Research individual vendor-criterion cell (Stage 1 of two-stage comparison)

**Timeout:** 120 seconds

**Request:**
```typescript
{
  user_id: string;
  session_id: string;
  project_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_website?: string;
  criterion_id: string;
  criterion_name: string;
  criterion_explanation: string;
  criterion_importance: 'high' | 'medium' | 'low';
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  vendor_id: string;
  criterion_id: string;
  match_status: 'yes' | 'no' | 'unknown';
  evidence_description: string;    // 100-200 word evidence
  research_notes: string;          // Detailed research findings
  source_urls: string[];           // Array of source URLs
  timestamp: string;
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. Triggered for each vendor-criterion combination
2. n8n performs web research for specific capability
3. Returns match status + evidence
4. Saved to `stage1_results_{projectId}`

**Related Files:** `src/services/n8nService.ts` (line 691), `src/components/vendor-comparison/VendorComparisonNew.tsx`

---

### 5. Comparison - Stage 2 (Comparative Ranking)

**Endpoint:** `POST /webhook/rank-criteria-stage2`

**Purpose:** Comparative ranking across vendors for a criterion (Stage 2 of two-stage comparison)

**Timeout:** 120 seconds

**Request:**
```typescript
{
  user_id: string;
  session_id: string;
  project_id: string;
  criterion_id: string;
  criterion_name: string;
  criterion_explanation: string;
  criterion_importance: 'high' | 'medium' | 'low';
  vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    vendor_website?: string;
    stage1_match_status: 'yes' | 'no' | 'unknown';
    stage1_evidence: string;
    stage1_research_notes: string;
  }>;
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  criterion_id: string;
  rankings: Array<{
    vendor_id: string;
    rank: number;               // 1-based ranking
    final_match_status: 'star' | 'yes' | 'partial' | 'no' | 'unknown';
    comparative_notes: string;  // Why this ranking
  }>;
  comparative_summary: string;  // Overall criterion summary
  timestamp: string;
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. Triggered after all Stage 1 cells complete for a criterion
2. n8n performs comparative analysis using Stage 1 evidence
3. Returns rankings and star ratings
4. Saved to `stage2_results_{projectId}`
5. Updates comparison matrix with star ratings

**Related Files:** `src/services/n8nService.ts` (line 737), `src/components/vendor-comparison/VendorComparisonNew.tsx`

---

### 6. Executive Summary

**Endpoint:** `POST /webhook/clarioo-executive-summary`

**Purpose:** Generate executive summary after comparison is complete

**Timeout:** 120 seconds

**Request:**
```typescript
{
  project_id: string;
  project_name: string;
  project_description: string;
  session_id: string;
  timestamp: string;
  criteria: Array<{
    id: string;
    name: string;
    description: string;
    importance: string;
  }>;
  vendors: Array<{
    id: string;
    name: string;
    website?: string;
    matchPercentage: number;
    description?: string;
    killerFeature?: string;
    keyFeatures?: string[];
    executiveSummary?: string;
    scoreDetails: Array<{
      criterionId: string;
      criterionName: string;
      score: number;            // 1-5 based on match status
      evidence: string;
      source_urls: string[];
      comments: string;
    }>;
  }>;
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    overview: {
      projectGoal: string;
      keyRequirements: string[];
      evaluationCriteria: number;
    };
    vendorAnalysis: Array<{
      vendorName: string;
      overallAssessment: string;
      strengths: string[];
      weaknesses: string[];
      bestFor: string;
    }>;
    recommendation: {
      topPick: string;
      reason: string;
      considerations: string[];
    };
  };
  generated_at?: string;
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. User requests executive summary after comparison
2. n8n analyzes all comparison results with AI
3. Returns structured executive summary
4. Saved to `clarioo_executive_summary_{projectId}`

**Related Files:** `src/services/n8nService.ts` (line 1227), `src/components/executive-summary/ExecutiveSummary.tsx`

---

### 7. Vendor Summary (Vendor Card)

**Endpoint:** `POST /webhook/Vendor-Card-Summary`

**Purpose:** Generate vendor card summary (About, Killer Feature, Key Features) using Perplexity AI

**Timeout:** 120 seconds

**Request:**
```typescript
{
  vendor_name: string;
  vendor_website?: string;
  project_category?: string;    // Context for targeted research
  session_id: string;
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  vendor_name: string;
  executive_summary: string;    // About section (3-4 sentences)
  killer_feature: string;       // Main differentiator (1-2 sentences)
  key_features: string[];       // Top 5-7 features
  timestamp: string;
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. Triggered when vendor card is expanded
2. n8n performs web research with Perplexity AI
3. Returns structured vendor information
4. Saved to `clarioo_vendor_summary_{vendorName}`
5. Cached for future use

**Related Files:** `src/services/n8nService.ts` (line 1438), `src/components/vendor-discovery/VendorSelection.tsx`

---

### 8. Email Collection

**Endpoint:** `POST /webhook/clarioo-email-collection`

**Purpose:** Collect and validate user email for communications

**Timeout:** 120 seconds

**Request:**
```typescript
{
  user_id: string;
  session_id: string;
  email: string;
  project_id?: string;
  project_name?: string;
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;              // Confirmation message
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. User submits email (e.g., for export notifications)
2. n8n validates and stores email
3. Saved to `clarioo_email` localStorage
4. Used for future communications and export metadata

**Related Files:** `src/services/n8nService.ts` (line 1627), `src/components/vendor-discovery/ShareDialog.tsx`

---

### 9. Battlecard Row

**Endpoint:** `POST /webhook/clarioo-battlecard-row`

**Purpose:** Generate a single battlecard row comparing vendors across a category (SP_023)

**Timeout:** 90 seconds

**Request:**
```typescript
{
  user_id: string;
  session_id: string;
  project_id: string;
  row_id: string;
  category_title: string;       // e.g., "Pricing Model", "Implementation Time"
  category_definition: string;  // AI-generated or user-provided definition
  vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    vendor_website?: string;
  }>;
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  row_id: string;
  category_title: string;
  category_definition: string;
  cells: Array<{
    vendor_id: string;
    vendor_name: string;
    content: string;            // 2-4 sentences answering the category
    sources: string[];          // Source URLs
  }>;
  timestamp: string;
  error?: {
    code: string;
    message: string;
  };
}
```

**Data Flow:**
1. User adds battlecard category
2. n8n researches each vendor for that category
3. Returns cell content for all vendors
4. Saved to `clarioo_battlecards_rows_{projectId}`

**Related Files:** `src/services/n8nService.ts` (line 1759), `src/components/vendor-battlecards/VendorBattlecards.tsx`

---

### 10. Summarize Criterion Row

**Endpoint:** `POST /webhook/summarize-criterion-row-production`

**Purpose:** Generate 2-3 word summaries for comparison matrix cells (SP_025)

**Timeout:** 30 seconds (no web search, only summarization)

**Request:**
```typescript
{
  user_id: string;
  session_id: string;
  project_id: string;
  criterion_id: string;
  criterion_name: string;
  criterion_explanation: string;
  vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    match_status: 'yes' | 'no' | 'unknown' | 'star';
    evidence_description: string;
    research_notes: string;
  }>;
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  criterion_id: string;
  summaries: Record<string, string | null>;  // vendor_id -> 2-3 word summary
  timestamp: string;
  error?: {
    code: string;
    message: string;
  };
}
```

**Example Summaries:**
- "Built-in tracking"
- "Third-party only"
- "Custom development"
- "Not available"

**Data Flow:**
1. Triggered after Stage 2 completes for a criterion
2. n8n summarizes each vendor's evidence to 2-3 words
3. Returns summaries for all vendors
4. Displayed in comparison matrix for quick scanning

**Related Files:** `src/services/n8nService.ts` (line 2145), `src/components/vendor-comparison/VendorComparisonNew.tsx`

---

### 11. Vendor Scatterplot Positioning

**Endpoint:** `POST /webhook/clarioo-vendor-scatterplot`

**Purpose:** AI-powered vendor positioning on 2x2 strategic matrix (SP_026)

**Timeout:** 60 seconds

**Request:**
```typescript
{
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    vendor_description: string;
    vendor_website?: string;
  }>;
  timestamp: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  positionings: Array<{
    vendor_id: string;
    vendor_name: string;
    solution_scope: number;       // 0-100 (Single-Purpose → Multi-Function)
    industry_focus: number;       // 0-100 (Vertical-Specific → Multiple Verticals)
    reasoning: string;            // Explanation of positioning
  }>;
  timestamp: string;
  error?: {
    code: string;
    message: string;
  };
}
```

**Axes:**
- **X-axis (Solution Scope):** Single-Purpose (0) ↔ Multi-Function (100)
- **Y-axis (Industry Focus):** Vertical-Specific (0) ↔ Multiple Verticals (100)

**Data Flow:**
1. Triggered when scatter plot component loads
2. n8n analyzes each vendor's scope and focus with AI
3. Returns positioning coordinates (0-100 scale)
4. Cached in `vendor_scatterplot_positions_{projectId}`
5. Cache invalidated when vendor list changes
6. Displays vendors on animated scatter plot

**Related Files:**
- `src/services/n8nService.ts` (line 2256)
- `src/hooks/useVendorScatterplot.ts`
- `src/components/vendor-scatterplot/VendorPositioningScatterPlot.tsx`

---

## Storage Patterns

### Naming Conventions

1. **Global Keys:** `clarioo_{feature}` (e.g., `clarioo_projects`, `clarioo_email`, `clarioo_admin_mode`)
2. **Project-Specific Keys:** `{feature}_{projectId}` (e.g., `workflow_abc123`, `stage1_results_abc123`, `vendors_abc123`)
3. **Landing Page Keys:** `landing_{data}` (e.g., `landing_company_info`, `landing_tech_needs`)
4. **Mock Keys:** `mock_{feature}` (e.g., `mock_auth_session`, `mock_projects`)
5. **User Keys:** `clarioo_{user_data}` (e.g., `clarioo_user_id`, `clarioo_email`)
6. **Vendor-Specific Keys:** `clarioo_{feature}_{vendorName}` (e.g., `clarioo_vendor_summary_Shopify`)

### Key Prefixes

| Prefix | Purpose | Examples |
|--------|---------|----------|
| `clarioo_` | Global application data | `clarioo_projects`, `clarioo_user_id`, `clarioo_admin_mode` |
| `landing_` | Landing page onboarding data | `landing_company_info`, `landing_tech_needs` |
| `workflow_` | Project workflow data | `workflow_{projectId}` |
| `criteria_` | Criteria lists (legacy) | `criteria_{projectId}` |
| `vendors_` | Discovered vendors | `vendors_{projectId}` |
| `vendor_selection_` | Selected vendor IDs | `vendor_selection_{projectId}` |
| `chat_` | Chat history | `chat_{projectId}` |
| `comparison_` | Comparison state | `comparison_state_{projectId}` |
| `stage1_` | Stage 1 comparison results | `stage1_results_{projectId}` |
| `stage2_` | Stage 2 comparison results | `stage2_results_{projectId}` |
| `compared_vendors_` | Legacy comparison (deprecated) | `compared_vendors_{projectId}` |
| `positioning_data_` | Template positioning data | `positioning_data_{projectId}` |
| `vendor_scatterplot_` | Scatter plot positions | `vendor_scatterplot_positions_{projectId}` |
| `mock_` | Mock/prototype data | `mock_auth_session`, `mock_projects` |
| `custom_` | User customizations | `custom_criterion_types` |

### Data Lifecycle

1. **Landing Page Onboarding:**
   - `landing_company_info` ← User enters company context
   - `landing_tech_needs` ← User enters tech requirements
   - Both cleared after project creation

2. **Project Creation:**
   - `clarioo_projects` ← Add new project
   - `workflow_{projectId}` ← Initial project data
   - `criteria_{projectId}` ← Initial criteria (legacy)
   - `chat_{projectId}` ← Initialize empty chat history

3. **Vendor Discovery:**
   - `vendors_{projectId}` ← Store discovered vendors
   - `vendor_selection_{projectId}` ← Track selected vendor IDs
   - `workflow_{projectId}` ← Update with selected vendors (sync)
   - `clarioo_vendor_summary_{vendorName}` ← Vendor card data (cached)
   - `vendor_scatterplot_positions_{projectId}` ← AI-generated positioning (cached)
   - `positioning_data_{projectId}` ← Template positioning (if using templates)

4. **Comparison (Two-Stage System):**
   - `comparison_state_{projectId}` ← Orchestration state
   - `stage1_results_{projectId}` ← Individual cell research
   - `stage2_results_{projectId}` ← Comparative rankings
   - `chat_{projectId}` ← Updated with criteria refinement conversations
   - Cell summaries embedded in comparison matrix

5. **Analysis & Export:**
   - `clarioo_executive_summary_{projectId}` ← Executive summary
   - `clarioo_battlecards_state_{projectId}` ← Battlecard state
   - `clarioo_battlecards_rows_{projectId}` ← Battlecard rows
   - `clarioo_email` ← User email for export metadata
   - Excel/JSON export reads all project-related keys

6. **Cache Invalidation:**
   - Vendor list changes → Clear `vendor_scatterplot_positions_{projectId}`, `positioning_data_{projectId}`, `vendors_{projectId}`, `vendor_selection_{projectId}`
   - Comparison reset → Clear `stage1_results_{projectId}`, `stage2_results_{projectId}`, `comparison_state_{projectId}`
   - Project creation complete → Clear `landing_company_info`, `landing_tech_needs`
   - Project deletion → Clear all `{feature}_{projectId}` keys (workflow, criteria, vendors, comparison, chat, etc.)

---

## Data Flow Examples

### Example 1: Create Project Flow

```
1. Landing Page
   └─> User enters company info
   └─> landing_company_info: Temporary storage
   └─> User enters tech needs
   └─> landing_tech_needs: Temporary storage

2. Project Creation
   └─> Reads landing_company_info, landing_tech_needs
   └─> POST /webhook/clarioo-project-creation
   └─> AI generates project metadata + criteria

3. Storage
   └─> clarioo_projects: Add project to list
   └─> workflow_{projectId}: Store complete workflow
   └─> criteria_{projectId}: Store criteria (legacy)
   └─> chat_{projectId}: Initialize empty chat history
   └─> Clear landing_company_info, landing_tech_needs
```

### Example 2: Vendor Discovery Flow

```
1. User Request
   └─> "Find vendors for my CRM project"

2. POST /webhook/clarioo-find-vendors
   └─> AI searches for matching vendors
   └─> Returns top 10 vendors with match scores

3. Storage
   └─> vendors_{projectId}: Store discovered vendors
   └─> vendor_selection_{projectId}: Initialize with selected vendor IDs
   └─> workflow_{projectId}.selectedVendors: Sync selected vendors

4. Scatter Plot Generation (optional)
   └─> POST /webhook/clarioo-vendor-scatterplot
   └─> Cache in vendor_scatterplot_positions_{projectId}
   └─> OR load from positioning_data_{projectId} (if template-based)

5. For each vendor card expansion:
   └─> Check cache: clarioo_vendor_summary_{vendorName}
   └─> If not cached:
       └─> POST /webhook/Vendor-Card-Summary
       └─> Cache result in clarioo_vendor_summary_{vendorName}
```

### Example 3: Two-Stage Comparison Flow

```
1. User Starts Comparison
   └─> comparison_state_{projectId}: Initialize state

2. Stage 1: Individual Cell Research
   └─> For each vendor-criterion pair:
       └─> POST /webhook/find-criterion-vendor-stage1
       └─> Get match status + evidence
       └─> Save to stage1_results_{projectId}
   └─> Update comparison_state_{projectId}: Mark Stage 1 complete

3. Stage 2: Comparative Ranking
   └─> For each criterion:
       └─> POST /webhook/rank-criteria-stage2
       └─> Analyze all vendors comparatively
       └─> Get rankings + star ratings
       └─> Save to stage2_results_{projectId}
   └─> Update comparison_state_{projectId}: Mark Stage 2 complete

4. Cell Summarization (SP_025)
   └─> For each completed criterion:
       └─> POST /webhook/summarize-criterion-row-production
       └─> Get 2-3 word summaries for all vendor cells
       └─> Update comparison matrix with summaries
```

### Example 4: Excel Export Flow

```
1. User Clicks "Export to Excel"
   └─> Reads ALL project-related localStorage keys:
       ├─> clarioo_projects: Project metadata
       ├─> clarioo_user_id: User identifier
       ├─> clarioo_email: User email (for metadata)
       ├─> workflow_{projectId}: Criteria + vendors
       ├─> vendors_{projectId}: Vendor list
       ├─> vendor_selection_{projectId}: Selected vendors
       ├─> chat_{projectId}: Chat history (not exported, for context)
       ├─> comparison_state_{projectId}: Comparison data
       ├─> stage1_results_{projectId}: Evidence
       ├─> stage2_results_{projectId}: Rankings
       ├─> clarioo_executive_summary_{projectId}: Pre-Demo Brief
       ├─> clarioo_battlecards_state_{projectId}: Battlecard state
       ├─> clarioo_battlecards_rows_{projectId}: Battlecard rows
       ├─> vendor_scatterplot_positions_{projectId}: AI scatter plot positioning
       ├─> positioning_data_{projectId}: Template positioning (if exists)
       └─> clarioo_vendor_summary_{vendorName}: Vendor cards (for each vendor)

2. Generate Excel Workbook
   └─> Tab 1: INDEX (project info, metadata, TOC)
   └─> Tab 2: Evaluation Criteria (sorted by category)
   └─> Tab 3: Vendor List (with scatter plot screenshot if available)
   └─> Tab 4: Vendor Evaluation (comparison matrix with categories)
   └─> Tab 5: Detailed Matching (evidence + sources)
   └─> Tab 6: Battlecards (if exists)
   └─> Tab 7: Pre-Demo Brief (executive summary, if exists)

3. Download Excel File
   └─> Filename: "{ProjectName10}_Clarioo_{YY_MM_DD}.xlsx"
```

---

## Notes

### Security & Privacy
- All data is stored in browser localStorage (client-side only)
- No server-side data persistence (except n8n webhook logs)
- User email stored only after explicit submission (as JSON object in `clarioo_email`)
- All identifiers (user_id, session_id) are UUIDs generated client-side
- Landing page data (`landing_company_info`, `landing_tech_needs`) is temporary and cleared after project creation
- Admin mode (`clarioo_admin_mode`) controls access to template features

### Performance Considerations
- Vendor card summaries cached globally by vendor name (until cache cleared)
- Scatter plot positions cached per project (invalidated on vendor list change)
- Template positioning data cached per project in `positioning_data_{projectId}`
- Comparison results cached per project (must be cleared manually to re-run)
- Chat history persisted per project for conversation context
- Executive summary regenerated on each request (not cached currently)
- Landing page data is temporary (cleared after project creation)

### Migration Notes
- `compared_vendors_{projectId}` (legacy) → Being replaced by two-stage system
- `criteria_{projectId}` (legacy) → Data now in `workflow_{projectId}`
- `mock_auth_session` → To be replaced by Supabase authentication
- `mock_projects` → To be replaced by real project management system

### Future Considerations
- Consider IndexedDB for large data sets (e.g., detailed evidence)
- Consider cache expiration policies (e.g., 24h for vendor summaries)
- Consider compression for large comparison results
- Consider backend sync for cross-device access

### Recent Updates (2026-01-15)
**Added 8 missing localStorage keys:**
1. `clarioo_admin_mode` - Admin mode toggle for template access
2. `landing_company_info` - Landing page company context (temporary)
3. `landing_tech_needs` - Landing page tech requirements (temporary)
4. `vendors_{projectId}` - Discovered vendor list
5. `vendor_selection_{projectId}` - Selected vendor IDs
6. `chat_{projectId}` - Criteria chat history
7. `positioning_data_{projectId}` - Template-based positioning data

**Corrected documentation:**
- `clarioo_email` - Updated from String to JSON Object structure
- Added new Storage Patterns section entries for landing page flow
- Updated Data Lifecycle to include landing page and vendor discovery flows
- Enhanced Data Flow Examples with complete localStorage key coverage

**Documentation completeness:** 100% (27 keys documented)

---

**End of Documentation**
