# Schema-Excel Mismatch Analysis - v3
**Sprint**: SP_029 - Excel Template Upload
**Created**: 2026-01-16
**Purpose**: Identify mismatches between Excel INDEX tab fields and n8n schema

---

## 🎯 Goal: 1-to-1 Schema Match with Excel INDEX Tab

The schema must match the Excel INDEX tab **exactly** so that:
1. All Excel fields can be stored in schema (for searching/filtering)
2. All schema fields can be populated from Excel (no orphaned columns)
3. Round-trip works: Export → Upload → Retrieve → Display (no data loss)

---

## 📊 Excel INDEX Tab Fields (18 Fields)

From `excelExportService.ts` lines 435-655:

| # | Field Label in Excel | Value Source | Line | Populated? |
|---|---------------------|--------------|------|-----------|
| 1 | Project Name | `data.projectName` | 437 | ✅ Always |
| 2 | Category | `workflow.category` | 456 | ⚠️ Conditional |
| 3 | Company Context | `techRequest.companyContext` | 466 | ⚠️ Conditional |
| 4 | Solution Requirements | `techRequest.solutionRequirements` | 478 | ⚠️ Conditional |
| 5 | Description | `data.projectDescription` | 490 | ⚠️ Conditional |
| 6 | Software Category | `''` (empty, manual fill) | 500 | ✅ Empty placeholder |
| 7 | Searched By | `''` (empty, manual fill) | 507 | ✅ Empty placeholder |
| 8 | Key Features | `''` (empty, manual fill) | 515 | ✅ Empty placeholder |
| 9 | Client Quote | `''` (empty, manual fill) | 524 | ✅ Empty placeholder |
| 10 | Current Tools | `''` (empty, manual fill) | 532 | ✅ Empty placeholder |
| 11 | Created By | `emailData.email` | 567 | ✅ From localStorage |
| 12 | User ID | `localStorage.getItem('clarioo_user_id')` | 577 | ✅ From localStorage |
| 13 | Project ID | `data.projectId` | 586 | ✅ UUID |
| 14 | Export Date | `new Date()` | 594 | ✅ Generated |
| 15 | Project Stage | `data.stage` | 617 | ✅ Always |
| 16 | Total Criteria | `data.criteria.length` | 637 | ✅ Count |
| 17 | Total Vendors | `data.vendors.length` | 644 | ✅ Count |
| 18 | Battlecard Categories | `data.battlecards.length` | 652 | ✅ Count (if exists) |

**Note**: Empty placeholders (fields 6-10) are **intentional** - they will be filled manually by admins when creating template library.

---

## 🔍 Current Schema (21 Columns)

```csv
template_id,template_name,project_description,template_category,
software_category,searched_by,key_features,client_quote,current_tools,
company_context,solution_requirements,criteria_count,vendors_count,
has_comparison_matrix,has_battlecards,has_executive_summary,
project_stage,template_data_json,user_id,uploaded_at,updated_at
```

---

## ❌ Mismatches Identified

### Mismatch 1: Missing "Created By" Email
**Excel Field**: "Created By" (line 567) → `emailData.email`
**Schema**: ❌ Missing
**Impact**: Cannot display who created the template
**Fix**: Add `created_by_email` column

---

### Mismatch 2: Missing "Project ID" (Top-Level)
**Excel Field**: "Project ID" (line 586) → `data.projectId`
**Schema**: ⚠️ Only in `template_data_json` blob (not searchable)
**Impact**: Cannot query templates by original project ID
**Fix**: Add `original_project_id` column

---

### Mismatch 3: Battlecard Count vs Boolean
**Excel Field**: "Battlecard Categories" (line 652) → `data.battlecards.length` (NUMBER)
**Schema**: `has_battlecards` (BOOLEAN)
**Impact**:
- Cannot display battlecard count (shows yes/no instead of "5 categories")
- When retrieving template, don't know how many battlecards without parsing JSON
**Fix**: Change `has_battlecards` → `battlecard_count` (number)

---

### Mismatch 4: Schema Has Fields NOT in Excel INDEX Tab

**Schema columns that don't exist in INDEX tab**:
1. `has_comparison_matrix` (boolean) - NOT shown in INDEX
2. `has_executive_summary` (boolean) - NOT shown in INDEX

**Purpose**: These were designed for filtering/search, but they're **derived fields** not stored in Excel.

**Impact**: Schema-Excel mismatch - these booleans are calculated, not exported/imported.

**Options**:
- **Option A**: Remove these fields (rely on `template_data_json` for filtering)
- **Option B**: Keep them as calculated fields during upload (derived from JSON parsing)

**Recommendation**: Keep as calculated fields (Option B) - they're useful for template filtering in UI.

---

### Mismatch 5: Export Date vs Upload Date
**Excel Field**: "Export Date" (line 594) → Generated timestamp when exporting
**Schema**: `uploaded_at`, `updated_at` (server timestamps)

**Impact**:
- Excel shows when file was EXPORTED
- Schema shows when template was UPLOADED to n8n

**Note**: This is **acceptable** - different timestamps for different purposes. No fix needed.

---

## ✅ Correct Schema Structure (21 Columns)

### Fields Matching Excel INDEX Tab (1-to-1)

| Schema Column | Excel Field | Type | Notes |
|--------------|-------------|------|-------|
| `template_name` | Project Name | string | Always populated |
| `template_category` | Category | string | Conditional |
| `company_context` | Company Context | string | Conditional |
| `solution_requirements` | Solution Requirements | string | Conditional |
| `project_description` | Description | string | Conditional |
| `software_category` | Software Category | string | Empty placeholder (manual fill) |
| `searched_by` | Searched By | string | Empty placeholder (manual fill) |
| `key_features` | Key Features | string | Empty placeholder (manual fill) |
| `client_quote` | Client Quote | string | Empty placeholder (manual fill) |
| `current_tools` | Current Tools | string | Empty placeholder (manual fill) |
| `created_by_email` | Created By | string | **MISSING - ADD** |
| `user_id` | User ID | string | Already exists |
| `original_project_id` | Project ID | string | **MISSING - ADD** |
| `project_stage` | Project Stage | string | Already exists |
| `criteria_count` | Total Criteria | number | Already exists |
| `vendors_count` | Total Vendors | number | Already exists |
| `battlecard_count` | Battlecard Categories | number | **WRONG TYPE - FIX** (currently boolean) |

### System/Metadata Fields (Not in INDEX Tab)

| Schema Column | Type | Purpose |
|--------------|------|---------|
| `template_id` | string (UUID) | Primary key (generated on upload) |
| `template_data_json` | json | Complete ExportProjectData blob |
| `uploaded_at` | datetime | Upload timestamp (similar to Export Date) |
| `updated_at` | datetime | Last update timestamp |

### Calculated/Derived Fields (Not in INDEX Tab)

| Schema Column | Type | Purpose | Source |
|--------------|------|---------|--------|
| `has_comparison_matrix` | boolean | Template filtering | Calculated from `template_data_json.comparisonMatrix` |
| `has_executive_summary` | boolean | Template filtering | Calculated from `template_data_json.executiveSummary` |

**Note**: These calculated fields are useful for UI filtering but don't appear in Excel INDEX tab.

---

## 🔧 Required Schema Changes

### Change 1: Add Missing Email Field
```csv
created_by_email,string
```
**Source**: `localStorage.getItem('clarioo_email')` → parsed email
**Populate from**: Excel INDEX tab "Created By" field

---

### Change 2: Add Missing Project ID Field
```csv
original_project_id,string
```
**Source**: `data.projectId`
**Populate from**: Excel INDEX tab "Project ID" field

---

### Change 3: Fix Battlecard Field Type
**Current**: `has_battlecards,boolean`
**New**: `battlecard_count,number`

**Source**: `data.battlecards.length`
**Populate from**: Excel INDEX tab "Battlecard Categories" count

---

### Change 4: Decision on Calculated Fields
**Keep**: `has_comparison_matrix`, `has_executive_summary`
**Rationale**: Useful for template filtering, calculated during upload
**Note**: Mark these as "derived" in documentation

---

## 📋 Final Schema (21 Columns) - CORRECTED

```csv
template_id,template_name,project_description,template_category,
software_category,searched_by,key_features,client_quote,current_tools,
company_context,solution_requirements,created_by_email,original_project_id,
project_stage,criteria_count,vendors_count,battlecard_count,
has_comparison_matrix,has_executive_summary,
template_data_json,user_id,uploaded_at,updated_at
```

### Column Breakdown
- **17 fields from Excel INDEX tab** (exact 1-to-1 match)
- **2 calculated fields** (has_comparison_matrix, has_executive_summary)
- **2 system fields** (template_id, template_data_json, uploaded_at, updated_at)
- **Total**: 21 columns (same as before, but correct mapping)

---

## 📊 Summary of Changes

| Change | Old Column | New Column | Type Change | Reason |
|--------|-----------|------------|-------------|--------|
| ✅ Add | N/A | `created_by_email` | string | Missing from Excel INDEX |
| ✅ Add | N/A | `original_project_id` | string | Missing from Excel INDEX |
| ✅ Fix | `has_battlecards` | `battlecard_count` | boolean → number | Excel shows COUNT, not boolean |
| ✅ Keep | `has_comparison_matrix` | `has_comparison_matrix` | boolean | Calculated field (useful for filtering) |
| ✅ Keep | `has_executive_summary` | `has_executive_summary` | boolean | Calculated field (useful for filtering) |

**Net Change**: Still 21 columns, but correct alignment with Excel INDEX tab.

---

## ✅ Design Principles (Clarified)

1. **Empty placeholders are intentional** - `software_category`, `searched_by`, `key_features`, `client_quote`, `current_tools` will be filled manually
2. **Schema matches INDEX tab** - Every field in INDEX tab has a corresponding schema column
3. **Calculated fields are acceptable** - `has_comparison_matrix`, `has_executive_summary` are derived during upload
4. **System fields are necessary** - `template_id`, `template_data_json`, `uploaded_at`, `updated_at` for template management
5. **Complete data in JSON blob** - `template_data_json` contains full ExportProjectData (all 7 tabs), top-level fields are for search/display

---

## 🚀 Next Steps

1. ✅ Update `clarioo_templates_schema_v3.csv` with corrected columns
2. ✅ Update `src/services/templateService.ts` to populate new fields
3. ✅ Update `Clarioo_Template_Manager_Upload_JSON_v3.json` workflow mappings
4. ✅ Update all v3 documentation files
5. ✅ Test round-trip: Export → Upload → Retrieve → Verify counts/emails display correctly

---

**Last Updated**: 2026-01-16
**Status**: Analysis Complete - Ready for schema update
