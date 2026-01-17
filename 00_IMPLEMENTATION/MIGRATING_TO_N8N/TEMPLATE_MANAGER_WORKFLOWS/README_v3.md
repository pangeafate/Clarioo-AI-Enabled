# Template Manager v3 - All Files

**Version**: v3 (Latest - 2026-01-16)
**Sprint**: SP_029 - Excel Template Upload
**Status**: Ready for Deployment

## 📦 Core Files (Use These for Deployment)

### 1. n8n Data Table Schema
- **File**: `clarioo_templates_schema_v3.csv`
- **Purpose**: CSV schema for creating n8n Data Table (21 columns)
- **Usage**: Upload to n8n → Data Tables → Import from CSV
- **Note**: Contains ONLY header and type rows (no example data to avoid CSV parsing errors)

### 2. n8n Workflow
- **File**: `Clarioo_Template_Manager_Upload_JSON_v3.json`
- **Purpose**: Complete n8n workflow with webhook endpoint and all actions
- **Usage**: Import to n8n → Update 4 Data Table IDs → Activate
- **Actions**: upload_json, list, delete, get

### 3. Deployment Guide
- **File**: `DEPLOYMENT_CHECKLIST_v3.md`
- **Purpose**: Step-by-step deployment instructions
- **Estimated Time**: 15-20 minutes
- **Includes**: Testing commands, troubleshooting, success criteria

### 4. Webhook Configuration Reference
- **File**: `N8N_WEBHOOK_CONFIGURATION_v3.md`
- **Purpose**: Detailed webhook configuration guide
- **Includes**: Request/response formats, node configurations, field mappings

### 5. Schema Design Documentation
- **File**: `DATATABLE_SCHEMA_EXPLANATION_v3.md`
- **Purpose**: Schema structure and design decisions
- **Includes**: Column definitions, data flow architecture, zero-transformation approach

### 6. Schema vs Excel Field Comparison
- **File**: `SCHEMA_EXCEL_COMPARISON_v3.md`
- **Purpose**: Side-by-side comparison of excelExportService.ts fields vs schema
- **Includes**: Field usage analysis, issues identified, 3 schema optimization options
- **Status**: Analysis complete - shows 5 empty placeholder fields and 4 schema issues

## 🔄 Version History

### v3 (2026-01-16) - Current
- **CSV Fix**: Removed example data row to prevent parsing errors
- **Schema Update**: 18 → 21 columns (added project_description, company_context, solution_requirements)
- **File Organization**: All files moved to TEMPLATE_MANAGER_WORKFLOWS folder
- **Documentation**: All docs updated with v3 versioning and cross-references
- **Status**: Ready for deployment

### v2 (2026-01-15)
- Added 3 new columns to match Excel INDEX tab structure
- Updated Pre-Demo Brief parser to preserve structure

### v1 (2026-01-15)
- Initial implementation with 18 columns
- Basic upload/list/delete functionality

## 📋 Schema Structure (21 Columns)

```
template_id, template_name, project_description, template_category,
software_category, searched_by, key_features, client_quote,
current_tools, company_context, solution_requirements,
criteria_count, vendors_count, has_comparison_matrix,
has_battlecards, has_executive_summary, project_stage,
template_data_json, user_id, uploaded_at, updated_at
```

## 🚀 Quick Start

1. Create n8n Data Table from `clarioo_templates_schema_v3.csv`
2. Import workflow from `Clarioo_Template_Manager_Upload_JSON_v3.json`
3. Update 4 Data Table IDs in workflow nodes
4. Activate workflow and copy webhook URL
5. Update frontend `.env` with `VITE_TEMPLATE_WEBHOOK_URL`
6. Test with curl commands from deployment checklist

**Full instructions**: See `DEPLOYMENT_CHECKLIST_v3.md`

## 🗂️ Previous Versions (Archive)

All previous workflow iterations are preserved in this folder for reference:
- `Clarioo Template Manager - LIST & CREATE (TESTING) v4 - 7 Sheets v2.json` (pre-v3)
- `clarioo_templates_schema_v2.csv` (18 columns)
- Various fix and implementation notes (*.md files)

## ⚠️ Schema Analysis (2026-01-16)

**Issue Identified**: Current schema (21 columns) includes 5 fields that are NOT populated by excelExportService.ts:
- `software_category`, `searched_by`, `key_features`, `client_quote`, `current_tools`

**Analysis**: See `SCHEMA_EXCEL_COMPARISON_v3.md` for:
- Complete field-by-field comparison with excelExportService.ts
- 4 identified issues (empty fields, missing email, battlecard count, project ID)
- 3 recommended schema options (Minimal, Enhanced, Hybrid)

**Next Step**: Review comparison file and decide on schema optimization approach

## 🔗 Related Documentation

- **Sprint Plan**: `00_IMPLEMENTATION/SPRINTS/SP_029_Excel_Template_Upload.md`
- **Schema Analysis**:
  - `SCHEMA_EXCEL_COMPARISON_v3.md` - Field comparison and schema optimization recommendations
  - `DATATABLE_SCHEMA_EXPLANATION_v3.md` - Schema structure documentation
- **Frontend Services**:
  - `src/services/excelImportService.ts` (Excel parsing)
  - `src/services/excelExportService.ts` (Excel generation - source of truth for fields)
  - `src/services/templateService.ts` (Upload to n8n)
- **Frontend Components**:
  - `src/components/templates/TemplateUploadButton.tsx`
  - `src/components/admin/AdminModeToggle.tsx`
  - `src/components/templates/TemplatesModal.tsx`

## ✅ Data Fidelity Status

All 7 Excel tabs verified with zero data loss:
1. ✅ INDEX - All metadata fields preserved (21 fields)
2. ✅ Evaluation Criteria - Complete structure
3. ✅ Vendor List - All vendor data
4. ✅ Vendor Evaluation - Comparison matrix with icon mapping
5. ✅ Battlecards - Transposed comparison
6. ✅ Pre-Demo Brief - All 5 structured sections preserved
7. ✅ Detailed Matching - Evidence and sources

**Round-trip verified**: Export → Upload → Clone → Export = Identical

## 🐛 Known Issues

None. CSV parsing error from v2 has been resolved in v3.

## 📝 Notes

- **Zero Transformation**: Frontend parses Excel, n8n stores JSON (no backend transformations)
- **Admin Mode**: Passcode `71956` (hardcoded in frontend)
- **CSV Format**: Only header + type rows (no example data to prevent parsing errors)
- **File Naming**: All v3 files use consistent naming convention

---

**Last Updated**: 2026-01-16
**Maintainer**: Claude (SP_029)
**Next Version**: TBD (based on production feedback)
