# n8n Data Tables Setup Guide
**Sprint: SP_028 - Template Management n8n Migration**
**Created:** 2026-01-14

## Overview

This guide provides step-by-step instructions for creating the n8n Data Tables required for the Clarioo Template Management system.

## Prerequisites

- Access to n8n instance at https://n8n.lakestrom.com
- Admin permissions to create Data Tables

## Data Tables Required

### 1. `clarioo_templates` Table

**Purpose:** Store all template data including metadata and complete template content (all 7 tabs)

**Table Name:** `clarioo_templates`

**Columns (15 total):**

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|-------------|
| `id` | String | Unique template identifier (UUID) | Primary Key, Auto-generated |
| `template_id` | String | Custom template ID (e.g., "template_001") | Unique, Required |
| `template_category` | String | Display category (e.g., "PROJECT MANAGEMENT", "CRM") | Required |
| `searched_by` | String | Company type and size (e.g., "Agency – 10-100 employees") | Required |
| `looking_for` | String | What the company is looking for | Required |
| `key_features` | String | Comma-separated list of 4 key features | Required |
| `client_quote` | String | Positive client quote/testimonial | Optional |
| `current_tool` | String | Current solution being replaced | Optional |
| `criteria` | JSON | Array of criteria objects (Tab 1) | Required |
| `vendors` | JSON | Array of vendor objects (Tab 2) | Optional |
| `comparison_matrix` | JSON | Comparison matrix data (Tab 3) | Optional |
| `battlecards` | JSON | Battlecard data (Tab 4) | Optional |
| `positioning_data` | JSON | Positioning scatter plot data (Tab 5) | Optional |
| `summary_data` | JSON | Executive summary data (Tab 6) | Optional |
| `uploaded_by` | String | User ID who uploaded template | Required |
| `created_at` | DateTime | Timestamp of creation | Auto-generated |
| `is_active` | Boolean | Soft delete flag (true = active) | Default: true |

**JSON Schema for `criteria` column (Tab 1):**
```json
[
  {
    "id": "string",
    "name": "string",
    "explanation": "string",
    "importance": "low|medium|high",
    "type": "string",
    "isArchived": "boolean"
  }
]
```

**JSON Schema for `vendors` column (Tab 2):**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "website": "string",
    "pricing": "string",
    "rating": "number"
  }
]
```

**JSON Schema for `comparison_matrix` column (Tab 3):**
```json
{
  "criteria": {},
  "vendors": {},
  "cells": {}
}
```

**JSON Schema for `battlecards` column (Tab 4):**
```json
{
  "vendors": []
}
```

**JSON Schema for `positioning_data` column (Tab 5):**
```json
{
  "vendors": [],
  "axes": {}
}
```

**JSON Schema for `summary_data` column (Tab 6):**
```json
{
  "executive_summary": "string",
  "recommendations": []
}
```

---

### 2. `clarioo_template_usage` Table

**Purpose:** Track when users apply templates to their projects

**Table Name:** `clarioo_template_usage`

**Columns (5 total):**

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|-------------|
| `id` | String | Unique usage record ID (UUID) | Primary Key, Auto-generated |
| `template_id` | String | Reference to template used | Required |
| `user_id` | String | User who used the template | Required |
| `project_id` | String | Project created from template | Required |
| `used_at` | DateTime | Timestamp of usage | Auto-generated |

---

## Setup Instructions

### Step 1: Log into n8n

1. Navigate to https://n8n.lakestrom.com
2. Log in with admin credentials

### Step 2: Create `clarioo_templates` Table

**RECOMMENDED:** Import via CSV for faster setup:
1. Download `clarioo_templates_schema.csv` from the MIGRATING_TO_N8N folder
2. Go to **Data Tables** → **Import from CSV**
3. Upload the CSV file
4. Verify column types and constraints
5. Click **Create Table**

**ALTERNATIVE:** Manual column creation:
1. Go to **Data Tables** section
2. Click **Create New Table**
3. Set table name: `clarioo_templates`
4. Add columns one by one:

   **Column 1:** `id`
   - Type: String
   - Primary Key: Yes
   - Auto-generate: Yes (UUID)

   **Column 2:** `template_id`
   - Type: String
   - Unique: Yes
   - Required: Yes

   **Column 3:** `template_category`
   - Type: String
   - Required: Yes

   **Column 4:** `searched_by`
   - Type: String
   - Required: Yes

   **Column 5:** `looking_for`
   - Type: String
   - Required: Yes

   **Column 6:** `key_features`
   - Type: String
   - Required: Yes

   **Column 7:** `client_quote`
   - Type: String
   - Required: No

   **Column 8:** `current_tool`
   - Type: String
   - Required: No

   **Column 9:** `criteria`
   - Type: JSON
   - Required: Yes
   - Default: `[]`

   **Column 10:** `vendors`
   - Type: JSON
   - Required: No
   - Default: `[]`

   **Column 11:** `comparison_matrix`
   - Type: JSON
   - Required: No
   - Default: `{}`

   **Column 12:** `battlecards`
   - Type: JSON
   - Required: No
   - Default: `{}`

   **Column 13:** `positioning_data`
   - Type: JSON
   - Required: No
   - Default: `{}`

   **Column 14:** `summary_data`
   - Type: JSON
   - Required: No
   - Default: `{}`

   **Column 15:** `uploaded_by`
   - Type: String
   - Required: Yes

   **Column 16:** `created_at`
   - Type: DateTime
   - Auto-generate: Yes (Current timestamp)

   **Column 17:** `is_active`
   - Type: Boolean
   - Required: Yes
   - Default: `true`

5. Click **Save Table**

### Step 3: Create `clarioo_template_usage` Table

1. Click **Create New Table**
2. Set table name: `clarioo_template_usage`
3. Add columns:

   **Column 1:** `id`
   - Type: String
   - Primary Key: Yes
   - Auto-generate: Yes (UUID)

   **Column 2:** `template_id`
   - Type: String
   - Required: Yes

   **Column 3:** `user_id`
   - Type: String
   - Required: Yes

   **Column 4:** `project_id`
   - Type: String
   - Required: Yes

   **Column 5:** `used_at`
   - Type: DateTime
   - Auto-generate: Yes (Current timestamp)

4. Click **Save Table**

### Step 4: Verify Tables

1. Navigate to **Data Tables** section
2. Confirm both tables are listed:
   - `clarioo_templates` (17 columns total including auto-generated `id`)
   - `clarioo_template_usage` (5 columns)
3. Click on each table to verify column configuration

---

## Testing the Tables

### Manual Insert Test

After creating the tables, test by manually inserting a sample template:

**Navigate to:** Data Tables → `clarioo_templates` → **Add Row**

**Sample Data:**
```json
{
  "template_id": "template_test_001",
  "template_category": "CRM",
  "searched_by": "Mid-market SaaS – 500 employees",
  "looking_for": "CRM with better automation and API integrations",
  "key_features": "API integrations, Workflow automation, Sales pipeline, Mobile access",
  "client_quote": "Our sales team finally has a CRM that works with them, not against them",
  "current_tool": "HubSpot",
  "criteria": [
    {
      "id": "crm_test_001",
      "name": "API Integration Quality",
      "explanation": "REST API with comprehensive documentation",
      "importance": "high",
      "type": "technical",
      "isArchived": false
    },
    {
      "id": "crm_test_002",
      "name": "Workflow Automation",
      "explanation": "Visual workflow builder with triggers",
      "importance": "high",
      "type": "feature",
      "isArchived": false
    }
  ],
  "vendors": [],
  "comparison_matrix": {},
  "battlecards": {},
  "positioning_data": {},
  "summary_data": {},
  "uploaded_by": "admin_test",
  "is_active": true
}
```

Click **Save** and verify the row appears in the table.

### API Test via Workflow

After the tables are created and the workflow is imported, test the API:

**List Templates:**
```bash
curl -X GET "https://n8n.lakestrom.com/webhook/template-manager-production?action=list"
```

Expected response:
```json
{
  "success": true,
  "templates": [
    {
      "template_id": "template_test_001",
      "template_category": "CRM",
      "searched_by": "Mid-market SaaS – 500 employees",
      "looking_for": "CRM with better automation and API integrations",
      "key_features": "API integrations, Workflow automation, Sales pipeline, Mobile access",
      "client_quote": "Our sales team finally has a CRM that works with them, not against them",
      "criteria": [...]
    }
  ]
}
```

---

## Next Steps

After creating the Data Tables:

1. ✅ Import the n8n workflows:
   - `Clarioo_Template_Manager_TESTING.json`
   - `Clarioo_Template_Manager_PRODUCTION.json`

2. ✅ Update workflow nodes to connect to Data Tables:
   - List operation → Query Data Table
   - Get operation → Get Row by ID
   - Upload operation → Insert Row
   - Delete operation → Update Row (`is_active = false`)
   - Track Usage operation → Insert Row in usage table

3. ✅ Run migration script to populate templates from JSON

4. ✅ Test end-to-end flow:
   - Upload template via Excel
   - Browse templates in TemplatesModal
   - Delete template (admin mode)
   - Use template to create project

---

## Troubleshooting

### Table Creation Fails

**Issue:** Cannot create table with JSON columns

**Solution:** Check n8n version supports JSON data type. Alternative: Use String column and manually parse JSON in workflow.

### Template ID Conflicts

**Issue:** Duplicate `template_id` values

**Solution:** The `template_id` column has UNIQUE constraint. Use sequential IDs: `template_001`, `template_002`, etc.

### Query Performance

**Issue:** Slow query responses with many templates

**Solution:** Add index on frequently queried columns:
- `category`
- `is_active`
- `created_at`

---

## Data Migration

See `MIGRATION_SCRIPT.md` for instructions on migrating existing templates from `templates.json` to n8n Data Tables.

---

## Backup and Recovery

### Backup Data Tables

**Method 1: n8n Export**
1. Go to Data Tables → `clarioo_templates`
2. Click **Export** → Download as JSON

**Method 2: API Export**
```bash
curl -X GET "https://n8n.lakestrom.com/webhook/template-manager-production?action=list" > templates_backup.json
```

### Restore from Backup

1. Delete all rows in Data Tables
2. Use migration script with backup JSON file
3. Verify data integrity

---

## Security Considerations

1. **Access Control:**
   - Only admin users can upload/delete templates
   - Template usage tracking logs all user interactions

2. **Data Validation:**
   - All uploads validated by n8n workflow before insertion
   - JSON schema validation for `criteria` and `vendors` columns

3. **Soft Delete:**
   - Templates are never permanently deleted
   - `is_active = false` allows for recovery if needed

---

## Support

For issues with Data Table setup:
1. Check n8n documentation
2. Review workflow logs in n8n UI
3. Test with sample data before production migration

---

**Created by:** Claude (SP_028)
**Last Updated:** 2026-01-14
