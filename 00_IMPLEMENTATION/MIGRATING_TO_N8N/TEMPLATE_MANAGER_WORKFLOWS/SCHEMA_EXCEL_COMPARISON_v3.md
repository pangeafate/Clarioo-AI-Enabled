# Excel Export vs Schema Comparison - v3
**Sprint**: SP_029 - Excel Template Upload
**Version**: v3
**Created**: 2026-01-16
**Purpose**: Compare fields exported by excelExportService.ts with current n8n schema

---

## 📊 Summary

**Total Excel Fields**: 18 fields written to INDEX tab
**Current Schema Columns**: 21 columns
**Populated Fields**: 13 fields (72% of Excel fields have data)
**Empty Placeholder Fields**: 5 fields (28% are empty in Excel export)

---

## 🔍 Detailed Field Comparison

### ✅ Populated Fields (Exported by Excel with Data)

| Field Label in Excel | Source in excelExportService.ts | Line | In Schema? | Schema Column Name | Notes |
|---------------------|--------------------------------|------|------------|-------------------|-------|
| **Project Name** | `data.projectName` | 437 | ✅ Yes | `template_name` | Always populated |
| **Category** | `workflow.category` | 456 | ✅ Yes | `template_category` | Conditional - only if exists in workflow |
| **Company Context** | `techRequest.companyContext` | 466 | ✅ Yes | `company_context` | Conditional - only if exists in techRequest |
| **Solution Requirements** | `techRequest.solutionRequirements` | 478 | ✅ Yes | `solution_requirements` | Conditional - only if exists in techRequest |
| **Description** | `data.projectDescription` | 490 | ✅ Yes | `project_description` | Conditional - only if different from context/requirements |
| **Created By** | `localStorage.getItem('clarioo_email')` → `emailData.email` | 567 | ❌ No | N/A | **MISSING**: Email field not in schema |
| **User ID** | `localStorage.getItem('clarioo_user_id')` | 577 | ✅ Yes | `user_id` | System metadata |
| **Project ID** | `data.projectId` | 586 | ❌ No | N/A | **STORED IN**: `template_data_json` (not top-level) |
| **Export Date** | `new Date()` (generated) | 594-603 | ❌ No | N/A | **ALTERNATIVE**: Use `uploaded_at` or `updated_at` |
| **Project Stage** | `data.stage` | 617 | ✅ Yes | `project_stage` | Stage names mapped |
| **Total Criteria** | `data.criteria?.length` | 637 | ✅ Yes | `criteria_count` | Count of criteria |
| **Total Vendors** | `data.vendors?.length` | 644 | ✅ Yes | `vendors_count` | Count of vendors |
| **Battlecard Categories** | `data.battlecards.length` | 652 | ⚠️ Partial | `has_battlecards` (boolean) | **MISMATCH**: Schema only has boolean, not count |

### ❌ Empty Placeholder Fields (Not Populated in Excel Export)

| Field Label in Excel | Source in excelExportService.ts | Line | In Schema? | Schema Column Name | Status |
|---------------------|--------------------------------|------|------------|-------------------|--------|
| **Software Category** | `''` (empty string) | 500 | ✅ Yes | `software_category` | **UNUSED**: Empty placeholder in Excel |
| **Searched By** | `''` (empty string) | 507 | ✅ Yes | `searched_by` | **UNUSED**: Empty placeholder in Excel |
| **Key Features** | `''` (empty string) | 515 | ✅ Yes | `key_features` | **UNUSED**: Empty placeholder in Excel |
| **Client Quote** | `''` (empty string) | 524 | ✅ Yes | `client_quote` | **UNUSED**: Empty placeholder in Excel |
| **Current Tools** | `''` (empty string) | 532 | ✅ Yes | `current_tools` | **UNUSED**: Empty placeholder in Excel |

---

## 📋 Schema-Only Fields (Not in Excel INDEX Tab)

These fields exist in the schema but are NOT written to the Excel INDEX tab:

| Schema Column Name | Type | Purpose | Source | Populated? |
|-------------------|------|---------|--------|-----------|
| `template_id` | string (UUID) | Primary key | Generated on upload | ✅ Yes |
| `has_comparison_matrix` | boolean | Feature flag | Derived from `data.comparisonMatrix` | ✅ Yes |
| `has_battlecards` | boolean | Feature flag | Derived from `data.battlecards?.length > 0` | ✅ Yes |
| `has_executive_summary` | boolean | Feature flag | Derived from `data.executiveSummary` | ✅ Yes |
| `template_data_json` | json | Complete data blob | Full `ExportProjectData` object | ✅ Yes |
| `uploaded_at` | datetime | Upload timestamp | Server timestamp | ✅ Yes |
| `updated_at` | datetime | Update timestamp | Server timestamp | ✅ Yes |

**Note**: These are metadata/system fields used for:
- Template management (template_id, timestamps)
- Template filtering/search (has_* flags)
- Complete data storage (template_data_json)

---

## ⚠️ Issues Identified

### Issue 1: Empty Placeholder Fields (5 fields)
**Problem**: Schema includes 5 fields that are NEVER populated by excelExportService.ts:
- `software_category`
- `searched_by`
- `key_features`
- `client_quote`
- `current_tools`

**Impact**: These fields waste storage space and create confusion. They were designed for future template metadata but are not currently used.

**Evidence**: Lines 498-533 in excelExportService.ts explicitly set these to empty strings:
```typescript
worksheet.getCell(`B${currentRow}`).value = ''; // Software Category (line 500)
worksheet.getCell(`B${currentRow}`).value = ''; // Searched By (line 507)
keyFeaturesCell.value = ''; // Key Features (line 515)
clientQuoteCell.value = ''; // Client Quote (line 524)
worksheet.getCell(`B${currentRow}`).value = ''; // Current Tools (line 532)
```

**Recommendation**: Remove these 5 fields from schema OR populate them in future Excel exports.

---

### Issue 2: Missing Email Field
**Problem**: Excel exports "Created By" email (line 567) but schema doesn't have dedicated email column.

**Current Workaround**: Email is stored in localStorage but not in schema.

**Evidence**:
```typescript
// excelExportService.ts:564-567
const emailStorage = localStorage.getItem('clarioo_email');
const emailData = JSON.parse(emailStorage);
worksheet.getCell(`B${currentRow}`).value = emailData.email; // Created By
```

**Recommendation**: Add `created_by_email` column to schema OR rely on `user_id` only.

---

### Issue 3: Battlecard Count vs Boolean
**Problem**: Excel exports battlecard count (line 652) but schema only stores boolean `has_battlecards`.

**Evidence**:
```typescript
// excelExportService.ts:649-652
worksheet.getCell(`A${currentRow}`).value = 'Battlecard Categories:';
worksheet.getCell(`B${currentRow}`).value = data.battlecards.length; // COUNT
```

**Current Schema**:
```csv
has_battlecards,boolean
```

**Recommendation**: Change `has_battlecards` to `battlecard_count` (number) OR keep boolean for filtering.

---

### Issue 4: Project ID Storage
**Problem**: Excel exports "Project ID" (line 586) but schema doesn't have top-level column for it.

**Current Workaround**: Project ID is stored inside `template_data_json` blob.

**Impact**: Cannot query/filter templates by original project ID without parsing JSON.

**Recommendation**: Add `original_project_id` column OR accept that it's only in JSON blob.

---

## 🎯 Recommended Schema Changes

### Option A: Minimal Schema (Remove Unused Fields)
**Remove 5 empty placeholder fields**, keep only populated data:

```csv
template_id,template_name,project_description,template_category,
company_context,solution_requirements,criteria_count,vendors_count,
has_comparison_matrix,has_battlecards,has_executive_summary,
project_stage,template_data_json,user_id,uploaded_at,updated_at
```

**Columns**: 16 (down from 21)
**Benefits**: Cleaner schema, no wasted storage, matches actual data
**Drawbacks**: Future template metadata features require schema changes

---

### Option B: Enhanced Schema (Add Missing Fields)
**Keep all fields**, add missing ones from Excel:

```csv
template_id,template_name,project_description,template_category,
software_category,searched_by,key_features,client_quote,current_tools,
company_context,solution_requirements,criteria_count,vendors_count,
battlecard_count,has_comparison_matrix,has_executive_summary,
project_stage,created_by_email,original_project_id,
template_data_json,user_id,uploaded_at,updated_at
```

**Columns**: 23 (up from 21)
**Benefits**: Complete field coverage, ready for future features
**Drawbacks**: More storage, still have empty fields initially

**Changes**:
1. Add `created_by_email` (from Excel line 567)
2. Add `original_project_id` (from Excel line 586)
3. Change `has_battlecards` → `battlecard_count` (number)

---

### Option C: Hybrid Schema (Keep Placeholders, Add Missing)
**Keep placeholder fields for future use**, add missing critical fields:

```csv
template_id,template_name,project_description,template_category,
software_category,searched_by,key_features,client_quote,current_tools,
company_context,solution_requirements,criteria_count,vendors_count,
has_comparison_matrix,has_battlecards,has_executive_summary,
project_stage,created_by_email,template_data_json,user_id,
uploaded_at,updated_at
```

**Columns**: 22
**Benefits**: Balanced - keeps placeholders, adds critical email field
**Drawbacks**: Still has empty fields (but intentional for future use)

**Changes**:
1. Add `created_by_email` (from Excel line 567)
2. Keep all existing fields (including empty placeholders)

---

## 📝 Field Usage by Source

### From `ExportProjectData` Interface
| Field | Source Property | Schema Column | Populated? |
|-------|----------------|---------------|-----------|
| Project Name | `data.projectName` | `template_name` | ✅ Yes |
| Description | `data.projectDescription` | `project_description` | ✅ Yes |
| Project ID | `data.projectId` | ❌ Missing | ✅ Yes (in JSON blob) |
| Stage | `data.stage` | `project_stage` | ✅ Yes |
| Criteria | `data.criteria` (array) | `criteria_count` (length) | ✅ Yes |
| Vendors | `data.vendors` (array) | `vendors_count` (length) | ✅ Yes |
| Battlecards | `data.battlecards` (array) | `has_battlecards` (boolean) | ✅ Yes |
| Comparison Matrix | `data.comparisonMatrix` | `has_comparison_matrix` (boolean) | ✅ Yes |
| Executive Summary | `data.executiveSummary` | `has_executive_summary` (boolean) | ✅ Yes |

### From `workflow` localStorage
| Field | Source Property | Schema Column | Populated? |
|-------|----------------|---------------|-----------|
| Category | `workflow.category` | `template_category` | ⚠️ Conditional |
| Company Context | `workflow.techRequest.companyContext` | `company_context` | ⚠️ Conditional |
| Solution Requirements | `workflow.techRequest.solutionRequirements` | `solution_requirements` | ⚠️ Conditional |

### From localStorage (User Data)
| Field | Source | Schema Column | Populated? |
|-------|--------|---------------|-----------|
| User ID | `localStorage.getItem('clarioo_user_id')` | `user_id` | ✅ Yes |
| Email | `localStorage.getItem('clarioo_email')` | ❌ Missing | ✅ Yes (in Excel) |

### System Generated
| Field | Source | Schema Column | Populated? |
|-------|--------|---------------|-----------|
| Template ID | `crypto.randomUUID()` | `template_id` | ✅ Yes |
| Upload Timestamp | `new Date().toISOString()` | `uploaded_at` | ✅ Yes |
| Update Timestamp | `new Date().toISOString()` | `updated_at` | ✅ Yes |

---

## 🚀 Next Steps

1. **Choose schema approach**: Minimal (Option A), Enhanced (Option B), or Hybrid (Option C)
2. **Update CSV schema**: Modify `clarioo_templates_schema_v3.csv` based on chosen option
3. **Update frontend**: Modify `src/services/templateService.ts` to match new schema
4. **Update documentation**: Update all v3 documentation files with new schema
5. **Update n8n workflow**: Modify `Clarioo_Template_Manager_Upload_JSON_v3.json` node mappings
6. **Test round-trip**: Export → Upload → Retrieve → Verify all fields match

---

## 📚 Related Files

- `src/services/excelExportService.ts` - Source of truth for Excel field structure (lines 435-653)
- `clarioo_templates_schema_v3.csv` - Current n8n Data Table schema (21 columns)
- `src/services/templateService.ts` - Upload/retrieve functions (needs update)
- `DATATABLE_SCHEMA_EXPLANATION_v3.md` - Schema documentation (needs update)
- `N8N_WEBHOOK_CONFIGURATION_v3.md` - Webhook node mappings (needs update)

---

**Last Updated**: 2026-01-16
**Maintainer**: Claude (SP_029)
**Status**: Analysis Complete - Awaiting schema decision
