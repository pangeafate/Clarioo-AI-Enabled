# Template Data Requirements Checklist

## Purpose
This document ensures that our n8n Data Table schema contains all required fields for:
1. **Template Card Display** - All fields needed to render template cards in the UI
2. **Project Cloning** - All data required to create a complete, functional project from a template

---

## Template Card Display Requirements

Based on `TemplateCard.tsx`, the following fields are displayed:

### Required Fields for Template Card
- ✅ `template_category` - Category tag (e.g., "PROJECT MANAGEMENT")
- ✅ `project_name` - Main title/heading (was `looking_for`)
- ✅ `project_description` - "SEARCHED BY:" text (was `searched_by`)
- ✅ `key_features` - Comma-separated feature tags
- ✅ `client_quote` - Optional quote displayed in card
- ✅ `criteria` (JSON array) - Used to display count: "Get 8 criteria →"

### Additional Card Context
- ✅ `vendors` (JSON array) - For "Compare vendors" text (optional)

---

## Project Cloning Requirements

Based on `COMPLETE_TEMPLATE_SCHEMA.md` and project localStorage structure, these fields are required to create a complete project:

### 1. Core Project Metadata
```typescript
{
  id: crypto.randomUUID(),
  name: template.project_name,              // ✅ REQUIRED
  description: template.project_description, // ✅ REQUIRED
  category: template.software_category || template.template_category, // ✅ REQUIRED
  status: 'in-progress',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: current_user_id
}
```

### 2. Workflow Data (`workflow_{projectId}`)
```typescript
{
  project: Project,
  criteria: JSON.parse(template.criteria),        // ✅ REQUIRED
  selectedVendors: JSON.parse(template.vendors),  // ✅ REQUIRED
  techRequest: {
    companyContext: template.project_description, // ✅ REQUIRED
    solutionRequirements: template.key_features,  // ✅ REQUIRED
    description: template.project_description     // ✅ REQUIRED
  }
}
```

### 3. Comparison Results
```typescript
// Stage 1 Results (workflow_{projectId}_stage1_results)
{
  projectId: projectId,
  results: comparisonMatrix.stage1_results.results, // ✅ REQUIRED
  timestamp: new Date().toISOString()
}

// Stage 2 Results (workflow_{projectId}_stage2_results)
{
  projectId: projectId,
  results: comparisonMatrix.stage2_results.results, // ✅ REQUIRED
  timestamp: new Date().toISOString()
}
```

### 4. Battlecards (`clarioo_battlecards_rows_{projectId}`)
```typescript
JSON.parse(template.battlecards) // ✅ REQUIRED - BattlecardRowState[]
```

### 5. Executive Summary (`clarioo_executive_summary_{projectId}`)
```typescript
JSON.parse(template.executive_summary) // ✅ REQUIRED - ExecutiveSummaryData
```

### 6. Vendor Positioning (Optional)
```typescript
// Only if template.positioning_data is not null
vendor_scatterplot_positions_{projectId} = {
  ...JSON.parse(template.positioning_data),
  project_id: projectId
}
```

---

## Complete Data Table Schema (18 Columns)

| Column Name | Type | Required | Used For | Notes |
|-------------|------|----------|----------|-------|
| `template_id` | string | ✅ | Identification | Unique template ID |
| `template_category` | string | ✅ | Card display, Project category | "CX PLATFORM", "PROJECT MANAGEMENT", etc. |
| `project_name` | string | ✅ | Card title, Project name | Main template title (was `looking_for`) |
| `project_description` | string | ✅ | Card "SEARCHED BY", Project description | Company context (was `searched_by`) |
| `software_category` | string | ⚠️ Optional | Project category fallback | Specific software type (can be empty) |
| `key_features` | string | ✅ | Card feature tags, Tech request | Comma-separated features |
| `client_quote` | string | ⚠️ Optional | Card quote display | Client pain point quote |
| `current_tool` | string | ⚠️ Optional | Context only | Not displayed but stored |
| `criteria` | string (JSON) | ✅ | Card count, Workflow criteria | `TransformedCriterion[]` array |
| `vendors` | string (JSON) | ✅ | Workflow vendors | `Vendor[]` array with match percentages |
| `comparison_matrix` | string (JSON) | ✅ | Stage 1 & 2 results | Contains `stage1_results` and `stage2_results` |
| `detailed_matching` | string (JSON) | ⚠️ Optional | Enhanced evidence | Can be `{parsed: true}` or empty |
| `battlecards` | string (JSON) | ✅ | Battlecard rows | `BattlecardRowState[]` array |
| `executive_summary` | string (JSON) | ✅ | Executive summary | `ExecutiveSummaryData` structure |
| `positioning_data` | string (JSON) | ⚠️ Optional | Scatter plot positions | `VendorPositioningData` or `null` |
| `uploaded_by` | string | ✅ | Admin tracking | User who uploaded template |
| `is_active` | boolean | ✅ | Filtering | Only active templates shown |
| `created_at` | datetime | ✅ | Sorting, Display | Template creation timestamp |

---

## Migration from Old Schema

### Field Name Changes
| Old Name | New Name | Reason |
|----------|----------|--------|
| `searched_by` | `project_description` | More accurate semantic meaning |
| `looking_for` | `project_name` | Clearer as project name |
| `summary_data` | `executive_summary` | Matches data structure name |

### New Fields Added
- ✅ `software_category` - Specific software type (distinct from template_category)
- ✅ `detailed_matching` - Enhanced evidence data
- ✅ `executive_summary` - Structured summary data (was `summary_data`)

### Backward Compatibility
For existing templates using old field names, the n8n LIST operation should map:
- `searched_by` → `projectDescription`
- `looking_for` → `projectName`
- `summary_data` → `executiveSummary`

---

## Validation Checklist

Before deploying updated Data Table schema:

### Template Card Display
- [ ] Can display template category tag
- [ ] Can display project name as main title
- [ ] Can display "SEARCHED BY:" description
- [ ] Can render key features as tags (split by comma)
- [ ] Can display client quote (if present)
- [ ] Can show criteria count from array length

### Project Cloning
- [ ] Can create new project with all metadata
- [ ] Can populate workflow with criteria and vendors
- [ ] Can create stage1_results from comparison_matrix
- [ ] Can create stage2_results from comparison_matrix
- [ ] Can populate battlecards from template
- [ ] Can populate executive_summary from template
- [ ] Can populate vendor positioning (if available)
- [ ] All localStorage keys are created correctly

### Data Integrity
- [ ] All JSON fields are valid JSON strings
- [ ] Vendor match percentages are calculated
- [ ] Comparison matrix has both stage1 and stage2 results
- [ ] Battlecard rows have cells for all vendors
- [ ] Executive summary has vendorAnalysis array

---

## Testing Procedure

1. **Upload Test**
   - Upload `LoyaltyMan_Clarioo_TEST2.xlsx`
   - Verify all 18 columns populated
   - Check JSON validity for all JSON fields

2. **Display Test**
   - Fetch templates via LIST operation
   - Verify TemplateCard renders correctly
   - Check all text displays properly

3. **Clone Test**
   - Clone template to create project
   - Verify all localStorage keys created
   - Check project is fully functional
   - Navigate through all project views (comparison, battlecards, summary)

---

## Summary

**Total Columns:** 18
**Required for Display:** 6 (template_category, project_name, project_description, key_features, client_quote, criteria)
**Required for Cloning:** 12 (+ vendors, comparison_matrix, battlecards, executive_summary, uploaded_by, is_active)
**Optional:** 3 (software_category, detailed_matching, positioning_data)
**Administrative:** 3 (template_id, uploaded_by, created_at)

**Critical Fields:**
- `project_name` - Primary identifier for users
- `criteria` - Must be valid JSON array
- `vendors` - Must be valid JSON array with match percentages
- `comparison_matrix` - Must contain stage1_results and stage2_results
- `battlecards` - Must be valid BattlecardRowState[] array
- `executive_summary` - Must be valid ExecutiveSummaryData structure
