# n8n Data Table Schema Fix

**Date**: January 16, 2026
**Issue**: Schema CSV had data in rows instead of columns

---

## Problem

The original `n8n_data_table_schema.csv` was structured as **documentation** with each row describing a column:

```csv
column_name,data_type,nullable,default_value,description
template_id,string,false,,Primary key - UUID
template_name,string,false,,Template name
...
```

**Issue**: This format shows data items as ROWS (each row = one column definition), but n8n Data Tables expect:
- Columns as COLUMNS (header row)
- Data as ROWS (each row = one template)

---

## Solution

Restructured `n8n_data_table_schema.csv` to match proper table format:

### New Structure

**Row 1 - Column Headers** (21 columns):
```csv
template_id,template_name,project_description,template_category,...
```

**Row 2 - Data Types**:
```csv
string,string,string,string,string,string,string,string,string,string,string,number,number,boolean,boolean,boolean,string,string,string,string,string
```

**Row 3-4 - Sample Data** (2 example templates):
```csv
luxury-fashion-cx-001,"Luxury Fashion CX Platform","Customer experience platform...",CX PLATFORM,...
agency-pm-tools-002,"Agency Project Management with Billing","Lightweight PM...",PROJECT MANAGEMENT,...
```

---

## Data Types by Column

| Column | Data Type | Example |
|--------|-----------|---------|
| template_id | string | `luxury-fashion-cx-001` |
| template_name | string | `Luxury Fashion CX Platform` |
| project_description | string | `Customer experience platform for luxury retail...` |
| template_category | string | `CX PLATFORM` |
| searched_by | string | `Luxury Fashion Retailer` |
| software_category | string | `Customer Experience Platform` |
| key_features | string | `Unified customer profiles, Advanced clienteling...` |
| client_quote | string | `Our tools don't give us a unified...` |
| current_tools | string | `Legacy POS system` |
| company_context | string | `Luxury fashion retailer with 30+ boutiques...` |
| solution_requirements | string | `Need unified customer profiles and advanced...` |
| criteria_count | **number** | `12` |
| vendors_count | **number** | `5` |
| has_comparison_matrix | **boolean** | `true` |
| has_battlecards | **boolean** | `true` |
| has_executive_summary | **boolean** | `true` |
| project_stage | string | `battlecards_complete` |
| template_data_json | string (JSON) | `{"projectId":"...", "criteria":[...]}` |
| user_id | string | `migration_admin` |
| uploaded_at | string (ISO 8601) | `2026-01-14T00:00:00Z` |
| updated_at | string (ISO 8601) | `2026-01-14T00:00:00Z` |

---

## Key Differences

### Before (Wrong ❌)
```
Each ROW = One column definition
Columns = Metadata about columns (column_name, data_type, etc.)
```

### After (Correct ✅)
```
Each ROW = One complete template
Columns = Actual data fields (template_id, template_name, etc.)
```

---

## How It Works in n8n

When you import `n8n_templates_table.csv` (or this schema file) into n8n:

1. **n8n reads Row 1** → Creates 21 columns in the Data Table
2. **n8n reads Row 2+** → Inserts data rows (if any)
3. **Templates added via webhook** → Each template becomes a new ROW

Example after 3 templates uploaded:

| template_id | template_name | criteria_count | vendors_count | project_stage |
|-------------|---------------|----------------|---------------|---------------|
| luxury-001 | Luxury CX | 12 | 5 | battlecards_complete |
| agency-002 | Agency PM | 8 | 4 | comparison_matrix |
| saas-003 | SaaS CRM | 15 | 8 | executive_summary |

Each template = 1 ROW with data in 21 COLUMNS ✅

---

## Files Updated

- ✅ **`n8n_data_table_schema.csv`** - Fixed structure with data types and sample rows
- ✅ **`README.md`** - Updated documentation to clarify the new format
- 📄 **`n8n_templates_table.csv`** - Unchanged (already correct - just headers)

---

## Impact on Deployment

**No changes needed** to:
- n8n workflow JSON
- Frontend code
- Data Table import process

The fix only affects the **documentation** format to make it clearer and match the actual table structure.

---

## Verification

To verify the schema is correct, check that:

1. ✅ Row 1 has exactly 21 column names (comma-separated)
2. ✅ Row 2 shows data types for each column
3. ✅ Rows 3+ contain sample template data
4. ✅ Each data row has 21 values matching the column headers
5. ✅ Data types are clear: string, number, boolean

All ✅ = Schema is correct and ready for n8n deployment!
