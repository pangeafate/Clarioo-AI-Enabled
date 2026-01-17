# Excel Export Service - Data Schema

> Extracted from `excelExportService.ts` (Sprint SP_027)

---

## Overview

The Excel export service generates a 7-tab workbook using data from multiple localStorage sources. This document defines all data categories, their fields, and storage locations.

---

## 1. Project

**Source:** `clarioo_projects` (localStorage)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | ✓ | Unique project identifier |
| `name` | string | ✓ | Display name |
| `description` | string | | Optional project description |

---

## 2. Workflow

**Source:** `workflow_{projectId}` (localStorage)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `criteria` | Criterion[] | ✓ | Array of evaluation criteria |
| `selectedVendors` | Vendor[] | ✓ | Array of shortlisted vendors |
| `category` | string | | Software category (from template) |
| `techRequest` | TechRequest | | Optional request details |

### TechRequest

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `description` | string | | Fallback for project name (truncated to 50 chars) |
| `companyContext` | string | | Company background information |
| `solutionRequirements` | string | | Solution requirements text |

---

## 3. Criterion

**Source:** `workflow_{projectId}.criteria`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | ✓ | Unique criterion identifier |
| `name` | string | ✓ | Criterion name/title |
| `explanation` | string | | Primary description field |
| `description` | string | | Fallback for `explanation` |
| `importance` | ImportanceLevel | ✓ | Priority level |
| `type` | CriterionType | ✓ | Category classification |
| `isArchived` | boolean | | If true, can be filtered out |

### ImportanceLevel (enum)

```typescript
type ImportanceLevel = 'high' | 'medium' | 'low'
```

### CriterionType (enum)

```typescript
type CriterionType = 
  | 'Feature'
  | 'Technical'
  | 'Business'
  | 'Compliance'
  | string  // Custom types allowed
```

**Sort Order:** Feature → Technical → Business → Compliance → Custom

---

## 4. Vendor

**Source:** `workflow_{projectId}.selectedVendors`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | ✓ | Unique vendor identifier |
| `name` | string | ✓ | Vendor name |
| `description` | string | ✓ | Vendor description |
| `website` | string | | URL, used for logo generation via img.logo.dev |

---

## 5. ComparisonMatrix

**Source:** `comparison_state_{projectId}` (localStorage)

### Structure

```typescript
interface ComparisonMatrix {
  criteria: {
    [criterionId: string]: {
      cells: {
        [vendorId: string]: CellState
      }
    }
  }
}
```

### CellState

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `value` | MatchStatus | | Primary status field |
| `status` | MatchStatus | | Alternate status field |
| `evidenceDescription` | string | | Main evidence text |
| `researchNotes` | string | | Additional research notes |
| `vendorSiteEvidence` | string | | URL from vendor's website |
| `thirdPartyEvidence` | string | | URL from third-party source |
| `evidenceUrl` | string | | Fallback URL |

### MatchStatus (enum)

```typescript
type MatchStatus = 
  | 'yes'      // ✓ - Meets criterion
  | 'no'       // X - Does not meet criterion
  | 'partial'  // +/- - Partially meets
  | 'unknown'  // ? - Unknown/unclear
  | 'pending'  // 🔄 - Not yet evaluated
  | 'star'     // ⭐ - Standout (exceeds expectations)
  | 'loading'  // In progress (treated as pending)
```

---

## 6. Battlecards

**Source:** `clarioo_battlecards_state_{projectId}` (localStorage)

**Fallback Source:** `clarioo_battlecards_rows_{projectId}` (localStorage)

### Storage Structure

```typescript
interface BattlecardsState {
  rows: BattlecardRow[]
}
```

### BattlecardRow

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `category_title` | string | ✓ | Battlecard category name |
| `status` | BattlecardStatus | ✓ | Row generation status |
| `cells` | BattlecardCell[] | ✓ | Content per vendor |

### BattlecardStatus (enum)

```typescript
type BattlecardStatus = 'pending' | 'failed' | 'complete'
```

> Note: Rows with `pending` or `failed` status are **skipped** in export.

### BattlecardCell

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vendor_name` | string | ✓ | Vendor identifier |
| `text` | string | ✓ | Battlecard content for this vendor |

---

## 7. ExecutiveSummary (Pre-Demo Brief)

**Source:** `clarioo_executive_summary_{projectId}` (localStorage)

**Fallback Source:** `stage2_results_{projectId}` (localStorage)

### Storage Wrapper

```typescript
interface ExecutiveSummaryStorage {
  data: ExecutiveSummaryData
  generated_at: string  // ISO date (snake_case in storage)
}
```

### ExecutiveSummaryData

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `generatedAt` | string | | ISO date timestamp |
| `projectSummary` | string | | Fallback summary text |
| `keyCriteria` | KeyCriterion[] | | Key evaluation criteria |
| `vendorRecommendations` | VendorRecommendation[] | | Ranked vendor list |
| `keyDifferentiators` | KeyDifferentiator[] | | Comparison differentiators |
| `riskFactors` | RiskFactors | | Risk analysis |
| `recommendation` | Recommendation | | Final recommendation |

### KeyCriterion

| Field | Type | Required |
|-------|------|----------|
| `name` | string | ✓ |
| `importance` | string | |
| `description` | string | |

### VendorRecommendation

| Field | Type | Required |
|-------|------|----------|
| `rank` | number | ✓ |
| `name` | string | ✓ |
| `matchPercentage` | number | |
| `overallAssessment` | string | |
| `keyStrengths` | string[] | |
| `keyWeaknesses` | string[] | |
| `bestFor` | string | |

### KeyDifferentiator

| Field | Type | Required |
|-------|------|----------|
| `category` | string | ✓ |
| `leader` | string | ✓ |
| `details` | string | |

### RiskFactors

| Field | Type | Required |
|-------|------|----------|
| `vendorSpecific` | VendorRisk[] | |
| `generalConsiderations` | string[] | |

### VendorRisk

| Field | Type | Required |
|-------|------|----------|
| `vendor` | string | ✓ |
| `questions` | string[] | ✓ |

### Recommendation

| Field | Type | Required |
|-------|------|----------|
| `topPick` | string | |
| `reason` | string | |
| `considerations` | string[] | |

---

## 8. User Metadata

### Email

**Source:** `clarioo_email` (localStorage)

```typescript
interface EmailStorage {
  email: string
}
```

### User ID

**Source:** `clarioo_user_id` (localStorage)

Type: `string`

---

## 9. ProjectStage (enum)

```typescript
type ProjectStage = 
  | 'criteria_only'        // Only criteria defined
  | 'vendors_selected'     // Vendors added
  | 'comparison_matrix'    // Stage 1 comparison done
  | 'detailed_matching'    // Detailed matching available
  | 'executive_summary'    // Pre-demo brief generated
  | 'battlecards_complete' // Battlecards generated
```

### Stage Detection Logic

| Condition | Stage |
|-----------|-------|
| `clarioo_battlecards_state_{id}` exists | `battlecards_complete` |
| `stage2_results_{id}` exists | `executive_summary` |
| `comparison_state_{id}` exists | `comparison_matrix` |
| `workflow.selectedVendors.length > 0` | `vendors_selected` |
| `workflow.criteria.length > 0` | `criteria_only` |
| Default | `criteria_only` |

---

## 10. ExportProjectData (Assembled Object)

This is the complete data object assembled by `loadProjectData()`:

| Field | Type | Source |
|-------|------|--------|
| `projectId` | string | Input parameter |
| `projectName` | string | `clarioo_projects` → `workflow.techRequest.description` |
| `projectDescription` | string | `clarioo_projects` |
| `stage` | ProjectStage | Detected from localStorage |
| `criteria` | Criterion[] | `workflow_{id}` |
| `vendors` | Vendor[] | `workflow_{id}` |
| `comparisonMatrix` | ComparisonMatrix | `comparison_state_{id}` |
| `stage1Results` | any | `stage1_results_{id}` ⚠️ **Loaded but NOT used** |
| `executiveSummary` | ExecutiveSummaryData | `clarioo_executive_summary_{id}` |
| `battlecards` | BattlecardRow[] | `clarioo_battlecards_state_{id}` |
| `battlecardsRows` | BattlecardRow[] | `clarioo_battlecards_rows_{id}` (fallback) |
| `screeningSummary` | string | ⚠️ **Referenced but NOT loaded** (placeholder) |

---

## 11. Placeholder Fields (INDEX Tab)

These fields are defined in the INDEX tab but **not currently populated**:

| Field | Description |
|-------|-------------|
| `softwareCategory` | Software category classification |
| `searchedBy` | User who performed the search |
| `keyFeatures` | Key features summary |
| `clientQuote` | Client quote/testimonial |
| `currentTools` | Comma-separated list of current tools |

---

## 12. Export Options

**Interface:** `ExcelExportOptions`

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `projectId` | string | - | Required |
| `projectName` | string | - | Required |
| `includeArchived` | boolean | `true` | Include archived criteria |
| `skipPrompt` | boolean | `false` | Skip incomplete data warning |
| `stage` | ProjectStage | - | Override detected stage |

---

## localStorage Key Reference

| Key Pattern | Content |
|-------------|---------|
| `clarioo_projects` | Array of all projects |
| `workflow_{projectId}` | Workflow state (criteria, vendors, techRequest) |
| `comparison_state_{projectId}` | Comparison matrix with cell states |
| `stage1_results_{projectId}` | Stage 1 results (unused) |
| `stage2_results_{projectId}` | Legacy executive summary location |
| `clarioo_executive_summary_{projectId}` | Executive summary data |
| `clarioo_battlecards_state_{projectId}` | Battlecards with rows |
| `clarioo_battlecards_rows_{projectId}` | Battlecards rows (fallback) |
| `clarioo_email` | User email object |
| `clarioo_user_id` | User ID string |

---

## Excel Tabs Generated

| # | Tab Name | Condition |
|---|----------|-----------|
| 1 | INDEX | Always |
| 2 | 1. Evaluation Criteria | Always |
| 3 | 2. Vendor List | `stage !== 'criteria_only'` |
| 4 | 3. Vendor Evaluation | `stage in [comparison_matrix, detailed_matching, executive_summary, battlecards_complete]` |
| 5 | 4. Detailed Matching | `stage in [detailed_matching, executive_summary, battlecards_complete]` |
| 6 | 5. Battlecards | `battlecards.length > 0` |
| 7 | 6. Pre-Demo Brief | `executiveSummary` exists |
