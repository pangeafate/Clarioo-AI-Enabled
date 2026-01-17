# Template to Project Conversion Analysis

## Current Template Storage Structure

From the uploaded TEST2.xlsx file, we have 7 sheets:

1. **INDEX** → Template metadata
2. **1. Evaluation Criteria** → Criteria array (17 items) ✅
3. **2. Vendor List** → Vendors array (5 items) ✅
4. **3. Vendor Evaluation** → Comparison matrix ❌ (currently raw data)
5. **4. Detailed Matching** → Evidence/positioning data ❌ (currently raw data)
6. **5. Battlecards** → Battlecard rows ❌ (currently raw data)
7. **6. Pre-Demo Brief** → Executive summary ❌ (currently raw data)

## Project localStorage Structure (from LOCALSTORAGE_AND_WEBHOOKS.md)

### 1. Project Core (`clarioo_projects`)
```typescript
{
  id: string;              // UUID
  name: string;            // Project name
  description: string;     // Project description
  category: string;        // e.g., "CRM", "CX Platform"
  status: 'in-progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  user_id: string;
  techRequest?: {
    companyContext: string;
    solutionRequirements: string;
  };
}
```

### 2. Workflow (`workflow_{projectId}`)
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

### 3. Comparison Results (`stage1_results_{projectId}`, `stage2_results_{projectId}`)
Stage 1 - Individual cell research:
```typescript
{
  projectId: string;
  results: Record<string, VendorCriterionResult>; // key: "{vendorId}:{criterionId}"
  timestamp: string;
}
```

Stage 2 - Comparative rankings:
```typescript
{
  projectId: string;
  results: Record<string, CriterionRankingResult>; // key: criterionId
  timestamp: string;
}
```

### 4. Executive Summary (`clarioo_executive_summary_{projectId}`)
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

### 5. Battlecards (`clarioo_battlecards_rows_{projectId}`)
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

### 6. Scatter Plot (`vendor_scatterplot_positions_{projectId}`)
```typescript
{
  project_id: string;
  vendor_ids: string[];
  positions: Array<{
    vendor_id: string;
    vendor_name: string;
    solution_scope: number;       // 0-100
    industry_focus: number;       // 0-100
    reasoning: string;
  }>;
  timestamp: string;
}
```

## Mapping: Excel Sheets → Project Data

| Excel Sheet | Maps To | Current Status |
|-------------|---------|----------------|
| INDEX | `Project` metadata | ✅ Partially (need to align fields) |
| 1. Evaluation Criteria | `criteria: TransformedCriterion[]` | ✅ Working (17 items) |
| 2. Vendor List | `selectedVendors: Vendor[]` | ✅ Working (5 items) |
| 3. Vendor Evaluation | `stage1_results` + `stage2_results` | ❌ Raw data - needs parsing |
| 4. Detailed Matching | `stage1_results` (evidence) | ❌ Raw data - needs parsing |
| 5. Battlecards | `clarioo_battlecards_rows_{projectId}` | ❌ Raw data - needs parsing |
| 6. Pre-Demo Brief | `clarioo_executive_summary_{projectId}` | ❌ Raw data - needs parsing |

## Questions for User

### 1. Template Metadata → Project Mapping

**Current template fields:**
- `template_category` (e.g., "UNCATEGORIZED")
- `searched_by` (long description)
- `looking_for` (project name)
- `key_features` (extracted from criteria)
- `client_quote`
- `current_tool`

**Should map to:**
```typescript
Project {
  name: ??? // looking_for OR should we extract from INDEX?
  description: ??? // searched_by OR should we extract from INDEX?
  category: ??? // template_category OR Software Category from INDEX?
}
```

**Questions:**
- What INDEX fields should map to `project.name`?
- What INDEX fields should map to `project.description`?
- Should `category` be auto-detected or specified in template?

### 2. Comparison Matrix Structure

**Excel "3. Vendor Evaluation" has:**
```
Category | Criteria | Lobyco | KlikNGo | SessionM | Yotpo | OptCulture
Feature  | User-friendly Interface | ✓ | ⭐ | ? | ⭐ | ✓
```

**This should map to:**
- Stage 1: Match status per vendor-criterion
- Stage 2: Star ratings (⭐ = star, ✓ = yes, X = no, ? = unknown)

**Questions:**
- Do we need to parse the comparison matrix into `stage1_results` + `stage2_results` format?
- Or can we store it in a simplified format?

### 3. Detailed Matching Structure

**Excel "4. Detailed Matching" has:**
```
Category | Vendor | Criterion | Status | Evidence | Sources
```

**Questions:**
- Should we parse this into `stage1_results` with evidence + sources?
- Or store in a custom template-specific format?

### 4. Battlecards Structure

**Excel "5. Battlecards" has categories and vendor cells.**

**Questions:**
- Should we parse into `BattlecardRowState[]` format?
- Or keep a simplified version?

### 5. Executive Summary Structure

**Excel "6. Pre-Demo Brief" has vendor recommendations, key criteria, questions.**

**Questions:**
- Should we parse into `ExecutiveSummaryData` format?
- Or keep as free-form text?

### 6. "Clone as Project" Functionality

**Questions:**
- When a template is "cloned as project", what should happen?
  1. Create new project with template data
  2. Copy criteria, vendors to workflow
  3. Copy comparison results to stage1/stage2 results
  4. Copy battlecards, summary, scatter plot positions
- Should templates be "read-only blueprints" or "editable starting points"?

## Recommendations

### Option A: Minimal Parsing (Quick)
Store only structured data we can display:
- ✅ Criteria array
- ✅ Vendors array
- ❌ Raw data for comparison, battlecards, summary (parse on "Clone as Project")

### Option B: Full Parsing (Complete)
Parse all 7 sheets into proper project format:
- ✅ Criteria array
- ✅ Vendors array
- ✅ Comparison results (stage1 + stage2 format)
- ✅ Battlecards (BattlecardRowState[] format)
- ✅ Executive summary (ExecutiveSummaryData format)
- ✅ Scatter plot positions (if available)

### Option C: Hybrid (Recommended)
- Parse essential data: criteria, vendors, comparison matrix
- Store summaries as simplified text blocks
- Generate full project structure on "Clone as Project"
