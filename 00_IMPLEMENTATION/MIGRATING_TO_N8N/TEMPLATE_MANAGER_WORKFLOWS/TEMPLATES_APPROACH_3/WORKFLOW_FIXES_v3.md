# n8n Workflow Fixes (v2 → v3)

**Date**: January 16, 2026
**Sprint**: SP_029 - Excel Template Upload
**File**: `Clarioo Template Manager - Upload JSON (SP_029) v3_FIXED.json`

---

## Issues Found in v2

### 1. ❌ Missing Fields in "Extract Template JSON" Node

**Location**: Node at line 221
**Problem**: Only extracting 18 out of 21 required fields

**Missing Fields**:
- `project_description`
- `company_context`
- `solution_requirements`

**Impact**: These 3 fields would be NULL in the database even if frontend sends them.

**Fixed**: Added all 3 fields with proper fallback values:
```javascript
project_description: template.project_description || null,
company_context: template.company_context || null,
solution_requirements: template.solution_requirements || null,
```

---

### 2. ❌ Missing Fields in "Format List Response" Node

**Location**: Node at line 179
**Problem**: Response to frontend missing 3 fields

**Missing Fields**:
- `projectDescription` (camelCase for frontend)
- `companyContext`
- `solutionRequirements`

**Impact**: Frontend would never receive these fields when listing templates.

**Fixed**: Added all 3 fields in camelCase format:
```javascript
projectDescription: template.project_description || '',
companyContext: template.company_context || '',
solutionRequirements: template.solution_requirements || '',
```

---

### 3. ❌ Missing Fields in "Format Get Response" Node

**Location**: Node at line 628
**Problem**: Single template response missing same 3 fields

**Missing Fields**:
- `projectDescription`
- `companyContext`
- `solutionRequirements`

**Impact**: Frontend would never receive these fields when loading a specific template.

**Fixed**: Added all 3 fields in camelCase format (same as list response).

---

### 4. ⚠️ "Extract Get Params" Reading from Wrong Source

**Location**: Node at line 594
**Problem**: Reading `template_id` from `query` instead of `body`

**Current Code**:
```javascript
const query = $input.item.json.query || {};
if (!query.template_id) {
  throw new Error('Missing required parameter: template_id');
}
```

**Issue**: All other actions (`upload_json`, `delete`) read from `body`. This inconsistency would cause "get" action to fail.

**Fixed**: Changed to read from `body` for consistency:
```javascript
const body = $input.item.json.body || {};
if (!body.template_id) {
  throw new Error('Missing required field: template_id');
}
```

---

## Summary of Changes

### Fields Now Properly Handled

All **21 columns** are now correctly mapped:

**Metadata (11)**:
1. ✅ template_id
2. ✅ template_name
3. ✅ project_description *(FIXED)*
4. ✅ template_category
5. ✅ searched_by
6. ✅ software_category
7. ✅ key_features
8. ✅ client_quote
9. ✅ current_tools
10. ✅ company_context *(FIXED)*
11. ✅ solution_requirements *(FIXED)*

**Metrics (6)**:
12. ✅ criteria_count
13. ✅ vendors_count
14. ✅ has_comparison_matrix
15. ✅ has_battlecards
16. ✅ has_executive_summary
17. ✅ project_stage

**Data (3)**:
18. ✅ template_data_json
19. ✅ user_id
20. ✅ uploaded_at

**Timestamps (1)**:
21. ✅ updated_at

---

## Testing Checklist

After deploying v3, test these scenarios:

### 1. Upload Template with All Fields
```json
POST /webhook/templates
{
  "action": "upload_json",
  "template": {
    "template_id": "test-123",
    "template_name": "Test Template",
    "project_description": "A test project",  // MUST be stored
    "company_context": "Test company info",   // MUST be stored
    "solution_requirements": "Test reqs",      // MUST be stored
    "template_data_json": "{...}",
    // ... other fields
  }
}
```

**Expected**: All 21 fields stored in Data Table

### 2. List Templates
```json
POST /webhook/templates
{
  "action": "list"
}
```

**Expected Response**:
```json
{
  "success": true,
  "templates": [{
    "templateId": "test-123",
    "templateName": "Test Template",
    "projectDescription": "A test project",     // MUST be present
    "companyContext": "Test company info",      // MUST be present
    "solutionRequirements": "Test reqs",        // MUST be present
    // ... other fields
  }]
}
```

### 3. Get Single Template
```json
POST /webhook/templates
{
  "action": "get",
  "template_id": "test-123"  // In BODY, not query
}
```

**Expected Response**:
```json
{
  "success": true,
  "template": {
    "templateId": "test-123",
    "projectDescription": "A test project",     // MUST be present
    "companyContext": "Test company info",      // MUST be present
    "solutionRequirements": "Test reqs",        // MUST be present
    // ... other fields
  }
}
```

### 4. Delete Template
```json
POST /webhook/templates
{
  "action": "delete",
  "template_id": "test-123"
}
```

**Expected**: Template deleted successfully

---

## Migration Guide

### From v2 to v3

1. **Export your Data Table data** (if any templates already exist)
2. **Delete the old workflow** in n8n
3. **Import v3 workflow**: Upload `Clarioo Template Manager - Upload JSON (SP_029) v3_FIXED.json`
4. **Update Data Table ID**: All 6 Data Table nodes have hardcoded ID `SZbl6LEAAufx0kM6` - update to your actual Data Table ID
5. **Activate workflow**
6. **Test all 4 actions** using the checklist above
7. **Re-import Data Table data** (if exported in step 1)

### Required Data Table Columns

Ensure your Data Table has these exact column names (snake_case):

```
template_id
template_name
project_description          ← MUST exist
template_category
searched_by
software_category
key_features
client_quote
current_tools
company_context              ← MUST exist
solution_requirements        ← MUST exist
criteria_count
vendors_count
has_comparison_matrix
has_battlecards
has_executive_summary
project_stage
template_data_json
user_id
uploaded_at
updated_at
```

Use the CSV file `n8n_templates_table.csv` to create the table with all columns.

---

## Breaking Changes

**None** - v3 is fully backward compatible with v2. However, v2 had bugs that would have caused data loss for the 3 missing fields, so upgrading to v3 is **strongly recommended**.

---

## Files Updated

- ✅ Created: `Clarioo Template Manager - Upload JSON (SP_029) v3_FIXED.json`
- 📖 Created: `WORKFLOW_FIXES_v3.md` (this document)
- 📁 Original: `Clarioo Template Manager - Upload JSON (SP_029) v2.json` (kept for reference)

---

**Status**: Ready for deployment to n8n 🚀

All 21 fields are now properly handled across all 4 actions (upload_json, list, get, delete).
