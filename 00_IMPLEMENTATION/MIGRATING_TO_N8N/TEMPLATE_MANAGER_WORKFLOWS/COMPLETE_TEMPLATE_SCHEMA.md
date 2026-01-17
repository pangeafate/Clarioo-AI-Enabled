# Complete Template Schema - Full Project Format

## Template Storage Structure

Templates should store ALL data needed to create a complete project, matching the exact localStorage format used by projects.

### Database Schema

```typescript
interface Template {
  // Core metadata
  template_id: string;
  template_category: string;

  // Project metadata (from INDEX sheet)
  project_name: string;           // "Project Name:" from INDEX
  project_description: string;    // "Description:" from INDEX
  software_category: string;      // "Software Category:" from INDEX
  key_features: string;           // "Key Features:" from INDEX or auto-generated
  client_quote: string | null;    // "Client Quote:" from INDEX
  current_tool: string | null;    // "Current Tools:" from INDEX

  // Arrays (JSON stringified)
  criteria: string;               // TransformedCriterion[] - Sheet 1
  vendors: string;                // Vendor[] - Sheet 2

  // Comparison data (JSON stringified)
  comparison_matrix: string;      // ComparisonMatrixData - Sheet 3
  detailed_matching: string;      // DetailedMatchingData - Sheet 4

  // Analysis data (JSON stringified)
  battlecards: string;            // BattlecardRowState[] - Sheet 5
  executive_summary: string;      // ExecutiveSummaryData - Sheet 6

  // Positioning data (JSON stringified) - can be extracted from other sheets or null
  positioning_data: string;       // VendorPositioningData | null

  // Template admin
  uploaded_by: string;
  is_active: boolean;
  created_at: string;
}
```

## Detailed Data Structures

### 1. Criteria (Sheet 1: Evaluation Criteria)

**Excel Format:**
```
# | Criterion | Explanation | Importance | Type
1 | User-friendly Interface | The platform should... | High | feature
```

**Parsed Format (TransformedCriterion[]):**
```typescript
[{
  id: string;                    // "crit_001", "crit_002", etc.
  name: string;                  // "User-friendly Interface"
  explanation: string;           // Full explanation text
  importance: 'high' | 'medium' | 'low';
  type: string;                  // "feature", "technical", "business", "compliance"
  isArchived: false;
}]
```

### 2. Vendors (Sheet 2: Vendor List)

**Excel Format:**
```
# | Logo | Vendor | Description | Website
1 | [img] | Lobyco | Lobyco is a powerful... | https://...
```

**Parsed Format (Vendor[]):**
```typescript
[{
  id: string;                    // Generated UUID
  name: string;                  // "Lobyco"
  description: string;           // "Lobyco is a powerful..."
  website: string;               // "https://www.lobyco.com"
  logo?: string;                 // Logo URL if available (optional for now)
  matchPercentage?: number;      // Can be calculated from comparison matrix
}]
```

### 3. Comparison Matrix (Sheet 3: Vendor Evaluation)

**Excel Format:**
```
Category | Criteria | Lobyco | KlikNGo | SessionM | Yotpo | OptCulture
Feature  | User-friendly Interface | ✓ | ⭐ | ? | ⭐ | ✓
```

**Symbol Mapping:**
- ⭐ → "star"
- ✓ → "yes"
- X → "no"
- ? → "unknown"
- +/- → "partial"

**Parsed Format (ComparisonMatrixData):**
```typescript
{
  // Stage 1 Results - Individual cell research
  stage1_results: {
    projectId: string;           // Will be set when cloned
    results: Record<string, VendorCriterionResult>;
    timestamp: string;
  };

  // Stage 2 Results - Comparative rankings
  stage2_results: {
    projectId: string;
    results: Record<string, CriterionRankingResult>;
    timestamp: string;
  };

  // Cell summaries (from Sheet 3 or can be null)
  cell_summaries?: Record<string, Record<string, string>>; // criterionId -> vendorId -> summary
}

// VendorCriterionResult (for stage1_results)
{
  vendor_id: string;
  criterion_id: string;
  match_status: 'yes' | 'no' | 'unknown' | 'partial';
  evidence_description: string;  // From Sheet 4 if available
  research_notes: string;        // From Sheet 4 if available
  source_urls: string[];         // From Sheet 4 if available
  timestamp: string;
}

// CriterionRankingResult (for stage2_results)
{
  criterion_id: string;
  rankings: Array<{
    vendor_id: string;
    rank: number;
    final_match_status: 'star' | 'yes' | 'partial' | 'no' | 'unknown';
    comparative_notes: string;
  }>;
  comparative_summary: string;
  timestamp: string;
}
```

### 4. Detailed Matching (Sheet 4: Detailed Matching)

**Excel Format:**
```
Category | Vendor | Criterion | Status | Evidence | Sources
Feature | Lobyco | User-friendly Interface | ✓ | Lobyco provides... | https://...
```

**This enhances Stage 1 Results with:**
- Detailed evidence descriptions
- Source URLs
- Research notes

### 5. Battlecards (Sheet 5: Battlecards)

**Excel Format:**
```
Category | Lobyco | KlikNGo | SessionM | Yotpo | OptCulture
[Row headers with content for each vendor]
```

**Parsed Format (BattlecardRowState[]):**
```typescript
[{
  row_id: string;                // Generated UUID
  category_title: string;        // Row header from Excel
  category_definition: string;   // Can be extracted or left empty
  cells: Array<{
    vendor_id: string;
    vendor_name: string;
    content: string;             // Cell content from Excel
    sources: string[];           // If sources are embedded
  }>;
  status: 'completed';           // All template battlecards are complete
  timestamp: string;
}]
```

### 6. Executive Summary (Sheet 6: Pre-Demo Brief)

**Excel Format:**
```
Key Evaluation Criteria
[List of key criteria]

Vendor Recommendations
1. Yotpo - 84% Match
[Description]
Key Strengths: ...
Key Weaknesses: ...

Risk Factors & Call Preparation
Questions to Ask Each Vendor:
...
```

**Parsed Format (ExecutiveSummaryData):**
```typescript
{
  overview: {
    projectGoal: string;         // Extracted from description
    keyRequirements: string[];   // Key criteria from Sheet 6
    evaluationCriteria: number;  // Count from criteria array
  };
  vendorAnalysis: Array<{
    vendorName: string;          // "Yotpo"
    matchPercentage?: number;    // "84% Match"
    overallAssessment: string;   // Description text
    strengths: string[];         // Key Strengths bullets
    weaknesses: string[];        // Key Weaknesses bullets
    bestFor: string;             // "Best For:" text
  }>;
  recommendation: {
    topPick: string;             // "Yotpo"
    reason: string;              // Why it's the top pick
    considerations: string[];    // General considerations
  };
  questions?: Record<string, string[]>; // Vendor -> Questions to ask
}
```

### 7. Vendor Positioning (Optional - can be null)

**Not in Excel (yet), but can be added:**
```typescript
{
  project_id: string;
  vendor_ids: string[];
  positions: Array<{
    vendor_id: string;
    vendor_name: string;
    solution_scope: number;      // 0-100
    industry_focus: number;      // 0-100
    reasoning: string;
  }>;
  timestamp: string;
}
```

## Field Mapping: INDEX Sheet → Template

| INDEX Field | Template Field | Notes |
|-------------|----------------|-------|
| "Project Name:" | `project_name` | Used for project.name when cloned |
| "Description:" | `project_description` | Used for project.description when cloned |
| "Software Category:" | `software_category` AND `template_category` | Both fields |
| "Key Features:" | `key_features` | Or auto-generate from top criteria |
| "Client Quote:" | `client_quote` | Optional |
| "Current Tools:" | `current_tool` | Optional |

## Clone to Project Workflow

When template is cloned to create a project:

1. **Create Project:**
```typescript
{
  id: crypto.randomUUID(),
  name: template.project_name,
  description: template.project_description,
  category: template.software_category || template.template_category,
  status: 'in-progress',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: current_user_id,
  techRequest: {
    companyContext: template.project_description,
    solutionRequirements: template.key_features
  }
}
```

2. **Create Workflow:**
```typescript
workflow_{projectId} = {
  project: project,
  criteria: JSON.parse(template.criteria),
  selectedVendors: JSON.parse(template.vendors),
  techRequest: {
    companyContext: template.project_description,
    solutionRequirements: template.key_features,
    description: template.project_description
  }
}
```

3. **Create Comparison Results:**
```typescript
const comparisonData = JSON.parse(template.comparison_matrix);

stage1_results_{projectId} = {
  ...comparisonData.stage1_results,
  projectId: projectId
};

stage2_results_{projectId} = {
  ...comparisonData.stage2_results,
  projectId: projectId
};
```

4. **Create Battlecards:**
```typescript
clarioo_battlecards_rows_{projectId} = JSON.parse(template.battlecards);
clarioo_battlecards_state_{projectId} = {
  rows: [...], // From battlecards
  status: 'completed',
  current_row_index: battlecards.length,
  timestamp: new Date().toISOString()
};
```

5. **Create Executive Summary:**
```typescript
clarioo_executive_summary_{projectId} = JSON.parse(template.executive_summary);
```

6. **Create Positioning (if available):**
```typescript
if (template.positioning_data) {
  vendor_scatterplot_positions_{projectId} = {
    ...JSON.parse(template.positioning_data),
    project_id: projectId
  };
}
```

## Summary

With this structure:
- ✅ Templates store complete project data
- ✅ All 7 Excel sheets parsed into proper formats
- ✅ "Clone as Project" creates fully populated project
- ✅ User can start using project immediately (view comparison, battlecards, summary)
- ✅ Data structures match existing localStorage format exactly
