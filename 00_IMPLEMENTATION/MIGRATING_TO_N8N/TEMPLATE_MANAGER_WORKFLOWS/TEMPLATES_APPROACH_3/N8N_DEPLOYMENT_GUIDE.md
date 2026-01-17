# n8n Template Manager - Deployment Guide

**Sprint**: SP_029 - Excel Template Upload with Zero Transformation
**Version**: 1.0
**Last Updated**: January 16, 2026

---

## Overview

This guide explains how to set up the n8n Data Table for template storage and deploy the complete template management workflow.

### Architecture

```
User uploads Excel
  ↓
[Frontend] excelImportService.ts parses Excel → ExportProjectData JSON
  ↓
[Frontend] templateService.uploadTemplateWithJSON() → n8n webhook
  ↓
[n8n] Store in Data Table with 21 metadata columns + JSON blob
  ↓
[Frontend] getTemplatesFromN8n() → parse templateData JSON
  ↓
[Frontend] createProjectFromExportData() → localStorage (zero transformation!)
```

**Key Innovation**: The complete project data is stored as JSON in `template_data_json` column. All other columns are metadata for search/filter.

---

## Part 1: Create n8n Data Table

### Step 1: Import CSV Schema

1. Go to n8n → **Settings** → **Data Tables**
2. Click **Create Data Table**
3. Name it: `clarioo_templates`
4. Click **Import from CSV**
5. Upload the file: `n8n_templates_table.csv`

### Step 2: Verify Columns

Ensure these 21 columns are created:

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| `template_id` | string | ✓ | Primary key (UUID) |
| `template_name` | string | ✓ | Template name (searchable) |
| `project_description` | string | | Project description |
| `template_category` | string | ✓ | Category for filtering |
| `searched_by` | string | | Who searched (company context) |
| `software_category` | string | | Software category |
| `key_features` | string | | Key features summary |
| `client_quote` | string | | Client testimonial |
| `current_tools` | string | | Current tools list |
| `company_context` | string | | Company background |
| `solution_requirements` | string | | Solution requirements |
| `criteria_count` | number | ✓ | Number of criteria |
| `vendors_count` | number | ✓ | Number of vendors |
| `has_comparison_matrix` | boolean | ✓ | Has comparison data |
| `has_battlecards` | boolean | ✓ | Has battlecards |
| `has_executive_summary` | boolean | ✓ | Has executive summary |
| `project_stage` | string | ✓ | Project stage enum |
| `template_data_json` | string | ✓ | **COMPLETE JSON DATA** |
| `user_id` | string | ✓ | User who uploaded |
| `uploaded_at` | string | ✓ | ISO 8601 timestamp |
| `updated_at` | string | ✓ | ISO 8601 timestamp |

### Step 3: Set Primary Key

- Set `template_id` as the **primary key**
- Ensure it's set to **unique** and **required**

---

## Part 2: Configure n8n Workflow

### Webhook Endpoint

**URL**: `https://n8n.lakestrom.com/webhook/templates`
**Method**: POST
**Content-Type**: application/json

### Actions Supported

#### 1. Upload Template (action: `upload_json`)

**Request Body**:
```json
{
  "action": "upload_json",
  "template": {
    "template_id": "uuid-here",
    "template_name": "CX Platform Selection",
    "project_description": "Luxury fashion retailer...",
    "template_category": "CX Platform",
    "searched_by": "Luxury Fashion Retailer",
    "software_category": "CX Platform",
    "key_features": "Omnichannel support, AI...",
    "client_quote": "",
    "current_tools": "Salesforce, Zendesk",
    "company_context": "30+ boutiques...",
    "solution_requirements": "Need unified CX...",
    "criteria_count": 12,
    "vendors_count": 5,
    "has_comparison_matrix": true,
    "has_battlecards": false,
    "has_executive_summary": false,
    "project_stage": "comparison_matrix",
    "template_data_json": "{\"projectId\":\"...\",\"projectName\":\"...\",\"criteria\":[...],\"vendors\":[...],\"comparisonMatrix\":{...}}",
    "user_id": "user_123",
    "uploaded_at": "2026-01-16T10:30:00Z",
    "updated_at": "2026-01-16T10:30:00Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "template_id": "uuid-here",
  "warnings": []
}
```

**n8n Workflow**:
```
HTTP Request Trigger (Webhook)
  ↓
[Extract JSON] Get template object from body.template
  ↓
[Insert Row] Insert into clarioo_templates Data Table
  ↓
[Return Response] { success: true, template_id: "..." }
```

#### 2. List Templates (action: `list`)

**Request Body**:
```json
{
  "action": "list",
  "category": "CX Platform"  // Optional filter
}
```

**Response**:
```json
{
  "success": true,
  "templates": [
    {
      "templateId": "uuid-1",
      "templateName": "CX Platform Selection",
      "templateCategory": "CX Platform",
      "searchedBy": "Luxury Fashion Retailer",
      "projectDescription": "...",
      "softwareCategory": "CX Platform",
      "keyFeatures": "...",
      "clientQuote": "",
      "currentTools": "...",
      "templateData": "{...}"  // JSON string
    }
  ]
}
```

**n8n Workflow**:
```
HTTP Request Trigger (Webhook)
  ↓
[Check Category] If body.category exists
  ↓
[Query Data Table] SELECT * FROM clarioo_templates WHERE template_category = category
  OR
[Query Data Table] SELECT * FROM clarioo_templates
  ↓
[Transform] Convert snake_case to camelCase for frontend
  ↓
[Return Response] { success: true, templates: [...] }
```

#### 3. Get Single Template (action: `get`)

**Request Body**:
```json
{
  "action": "get",
  "template_id": "uuid-here"
}
```

**Response**:
```json
{
  "success": true,
  "template": {
    "templateId": "uuid-here",
    "templateName": "CX Platform Selection",
    "templateData": "{...}"
  }
}
```

**n8n Workflow**:
```
HTTP Request Trigger (Webhook)
  ↓
[Query Data Table] SELECT * FROM clarioo_templates WHERE template_id = body.template_id
  ↓
[Transform] Convert snake_case to camelCase
  ↓
[Return Response] { success: true, template: {...} }
```

#### 4. Delete Template (action: `delete`)

**Request Body**:
```json
{
  "action": "delete",
  "template_id": "uuid-here",
  "user_id": "user_123"
}
```

**Response**:
```json
{
  "success": true
}
```

**n8n Workflow**:
```
HTTP Request Trigger (Webhook)
  ↓
[Validate] Check user_id matches template owner (optional)
  ↓
[Delete Row] DELETE FROM clarioo_templates WHERE template_id = body.template_id
  ↓
[Return Response] { success: true }
```

---

## Part 3: Frontend Integration

### Files Modified

1. **`src/services/excelImportService.ts`** (1,393 lines)
   - Comprehensive Excel parser with all 7 tabs
   - Exports: `importExcelToJson()`, `importExcelTemplate()` (backward compat)
   - Returns: `ImportResult` with `ExportProjectData`

2. **`src/services/templateService.ts`** (1,075 lines)
   - n8n integration functions
   - `uploadTemplateWithJSON()` - Upload to n8n
   - `getTemplatesFromN8n()` - List templates
   - `getTemplateByIdFromN8n()` - Get single template
   - `createProjectFromExportData()` - Zero transformation project creation

3. **`src/components/templates/TemplateUploadButton.tsx`** (existing)
   - Admin UI for uploading Excel files

### Data Flow

**Upload Flow**:
```typescript
// 1. User selects Excel file
const file = event.target.files[0];

// 2. Parse Excel → JSON
const result = await importExcelToJson(file);

if (result.success && result.data) {
  // 3. Upload JSON to n8n
  const uploadResult = await uploadTemplateWithJSON(
    result.data,
    getUserId()
  );

  if (uploadResult.success) {
    console.log('Template uploaded:', uploadResult.templateId);
  }
}
```

**Template Loading Flow**:
```typescript
// 1. Fetch templates from n8n
const templates = await getTemplatesFromN8n('CX Platform');

// 2. Display in TemplatesModal (already exists)
// templates[0].criteria, templates[0].vendors are parsed from templateData JSON

// 3. User selects template
const template = templates[0];

// 4. Create project (zero transformation!)
const result = await createProjectFromExportData(template);

if (result.success) {
  navigate(`/vendor-discovery/${result.projectId}`);
}
```

---

## Part 4: Testing Checklist

### Prerequisites
- [ ] n8n Data Table `clarioo_templates` created with 21 columns
- [ ] n8n webhook `/templates` configured with 4 actions
- [ ] Admin mode enabled in frontend (passcode: 71956)

### Test Cases

#### Test 1: Upload Basic Template
1. Export a project with criteria + vendors only
2. Upload Excel via TemplateUploadButton
3. Verify n8n Data Table has new row
4. Check `template_data_json` contains complete JSON

**Expected**:
- `criteria_count`: 5-10
- `vendors_count`: 3-5
- `has_comparison_matrix`: false
- `project_stage`: "vendors_selected"

#### Test 2: Upload Complete Template
1. Export a project with all tabs (comparison, battlecards, executive summary)
2. Upload Excel via TemplateUploadButton
3. Verify all boolean flags are true

**Expected**:
- `has_comparison_matrix`: true
- `has_battlecards`: true
- `has_executive_summary`: true
- `project_stage`: "battlecards_complete"

#### Test 3: List Templates
1. Call `getTemplatesFromN8n()` from browser console
2. Verify templates array returned
3. Check `templateData` is parsed JSON (not string)

**Expected**:
```javascript
const templates = await getTemplatesFromN8n();
console.log(templates[0].criteria); // Should be array, not string
```

#### Test 4: Create Project from Template
1. Load template in TemplatesModal
2. Click "Use Template"
3. Verify project created in localStorage
4. Check criteria, vendors loaded correctly

**Expected**:
- `localStorage.getItem('clarioo_projects')` has new project
- `localStorage.getItem('criteria_{projectId}')` has criteria array
- `localStorage.getItem('vendors_{projectId}')` has vendors array

#### Test 5: Manual Excel Editing
1. Export a project to Excel
2. Manually edit cell text (change criterion name, vendor description)
3. Upload modified Excel
4. Verify changes reflected in template

**Expected**:
- Modified text appears in template
- No parsing errors
- Structure preserved

---

## Part 5: ExportProjectData Schema Reference

The `template_data_json` column stores this complete structure:

```typescript
interface ExportProjectData {
  projectId: string;
  projectName: string;
  projectDescription?: string;
  stage: ProjectStage;
  category?: string;

  techRequest?: {
    description?: string;
    companyContext?: string;
    solutionRequirements?: string;
  };

  criteria: Array<{
    id: string;
    name: string;
    explanation?: string;
    description?: string;
    importance: 'high' | 'medium' | 'low';
    type: string;
    isArchived?: boolean;
  }>;

  vendors: Array<{
    id: string;
    name: string;
    description: string;
    website?: string;
  }>;

  comparisonMatrix?: {
    criteria: {
      [criterionId: string]: {
        cells: {
          [vendorId: string]: {
            value: MatchStatus;
            status?: MatchStatus;
            evidenceDescription?: string;
            researchNotes?: string;
            vendorSiteEvidence?: string;
            thirdPartyEvidence?: string;
            evidenceUrl?: string;
          };
        };
      };
    };
  };

  executiveSummary?: {
    generatedAt?: string;
    projectSummary?: string;
    keyCriteria?: Array<{
      name: string;
      importance?: string;
      description?: string;
    }>;
    vendorRecommendations?: Array<{
      rank: number;
      name: string;
      matchPercentage?: number;
      overallAssessment?: string;
      keyStrengths?: string[];
      keyWeaknesses?: string[];
      bestFor?: string;
    }>;
    keyDifferentiators?: Array<{
      category: string;
      leader: string;
      details?: string;
    }>;
    riskFactors?: {
      vendorSpecific?: Array<{
        vendor: string;
        questions: string[];
      }>;
      generalConsiderations?: string[];
    };
    recommendation?: {
      topPick?: string;
      reason?: string;
      considerations?: string[];
    };
  };

  battlecards?: Array<{
    category_title: string;
    status: 'pending' | 'failed' | 'complete';
    cells: Array<{
      vendor_name: string;
      text: string;
    }>;
  }>;

  screeningSummary?: string;

  metadata?: {
    exportDate?: string;
    createdBy?: string;
    userId?: string;
    softwareCategory?: string;
    searchedBy?: string;
    keyFeatures?: string;
    clientQuote?: string;
    currentTools?: string;
  };
}
```

---

## Part 6: Troubleshooting

### Issue: Template upload returns "Invalid format"

**Cause**: Excel file missing required tabs (INDEX or Criteria)

**Fix**: Ensure Excel was exported by excelExportService.ts with all tabs

### Issue: Imported template has empty criteria/vendors

**Cause**: Parsing failed due to modified Excel structure

**Fix**: Check Excel file has headers in row 1, data starting row 2

### Issue: n8n returns 404 on webhook

**Cause**: Webhook URL incorrect or workflow not activated

**Fix**:
1. Check URL is `https://n8n.lakestrom.com/webhook/templates`
2. Ensure workflow is **activated** (not paused)
3. Verify HTTP Request Trigger is set to POST

### Issue: templateData is string instead of object

**Cause**: Frontend not parsing JSON from n8n response

**Fix**: Check templateService.ts lines 492-527 - should parse `template.templateData` string to object

---

## Part 7: Deployment Steps

### Step 1: Deploy n8n Data Table
```bash
1. Import n8n_templates_table.csv to create Data Table
2. Set template_id as primary key
3. Verify 21 columns created correctly
```

### Step 2: Deploy n8n Workflow
```bash
1. Import workflow JSON (from SP_029 folder)
2. Configure webhook URL
3. Test each action (upload, list, get, delete)
4. Activate workflow
```

### Step 3: Deploy Frontend Code
```bash
# Already deployed in src/services/
- excelImportService.ts (replaced with v2)
- templateService.ts (n8n integration ready)
- TemplateUploadButton.tsx (admin UI ready)
```

### Step 4: Verify Integration
```bash
1. Enable admin mode (passcode 71956)
2. Upload test Excel file
3. Check n8n Data Table has row
4. Load templates in TemplatesModal
5. Create project from template
6. Verify localStorage has correct data
```

---

## Success Criteria

✅ **n8n Data Table**
- 21 columns configured
- template_id is primary key
- Can insert, query, and delete rows

✅ **Excel Import**
- All 7 tabs parsed successfully
- Icons mapped to status correctly
- Handles manual edits gracefully

✅ **Template Upload**
- Excel → JSON conversion works
- JSON uploaded to n8n successfully
- template_data_json contains complete data

✅ **Template Loading**
- Templates list displays correctly
- templateData parsed from JSON string
- Creating project works (zero transformation)

✅ **Round-Trip**
- Export → Edit → Upload → Load → Create Project
- No data loss
- No transformation bugs

---

**Deployment Complete!** 🎉

The template management system is now fully operational with:
- Comprehensive Excel parsing (1,393 lines)
- n8n persistent storage
- Zero transformation architecture
- Admin upload UI
- Template discovery and loading

For questions or issues, refer to:
- `SP_029_Excel_Template_Upload.md` - Sprint documentation
- `excel-export-data-schema.md` - Complete data schema
- `excelImportServicev2.ts` - Source code with comments
