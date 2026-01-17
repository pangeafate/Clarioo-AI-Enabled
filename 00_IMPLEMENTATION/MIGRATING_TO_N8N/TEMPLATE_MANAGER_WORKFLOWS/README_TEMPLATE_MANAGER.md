# Template Manager n8n Workflows - SP_028 MVP

**Status**: ✅ Backend Service Layer Complete | ⏳ n8n Data Tables Pending | ⏳ Frontend Components Pending

---

## 📋 Overview

This document describes the Template Manager n8n workflows for SP_028 MVP (Phase 1: Basic Templates - Tabs 0-2 Only).

The Template Manager enables:
- **Admin users**: Upload Excel templates, delete templates
- **All users**: Browse templates, create projects from templates
- **System**: Track template usage for analytics

---

## 🔗 Workflow Files

### Testing Environment
- **File**: `Clarioo_Template_Manager_TESTING.json`
- **Webhook**: `http://localhost:8080/webhook/template-manager-testing`
- **Environment**: Development, local testing
- **Mode**: Set `clarioo_webhook_mode` = `testing` in localStorage

### Production Environment
- **File**: `Clarioo_Template_Manager_PRODUCTION.json`
- **Webhook**: `https://n8n.lakestrom.com/webhook/template-manager-production`
- **Environment**: Production
- **Mode**: Set `clarioo_webhook_mode` = `production` in localStorage (default)

---

## 🏗️ Workflow Architecture

Both workflows follow the same structure (based on `Clarioo_AI_Summarize_Criterion_Row` pattern):

```
┌─────────────────┐
│ Webhook Trigger │
│  GET/POST/DEL   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Input Validation│  ← Validates action + parameters
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Check Validation│  ← If Node: validation_error == true?
└────┬───────┬────┘
     │       │
     │ TRUE  │ FALSE
     v       v
┌────────┐  ┌───────────────┐
│ Return │  │ Route         │
│ 400    │  │ Operation     │
└────────┘  └───────┬───────┘
                    │
         ┌──────────┼──────────┬─────────┬───────────┐
         │          │          │         │           │
         v          v          v         v           v
    ┌─────┐    ┌─────┐    ┌──────┐  ┌──────┐   ┌────────┐
    │LIST │    │ GET │    │UPLOAD│  │DELETE│   │ TRACK  │
    │ 200 │    │ 200 │    │ 200  │  │ 200  │   │USAGE   │
    └─────┘    └─────┘    └──────┘  └──────┘   │ 200    │
                                                 └────────┘
```

---

## 📡 API Operations

### 1. LIST Templates
**Method**: `GET`
**Endpoint**: `/webhook/template-manager-testing?action=list&category={optional}`

**Query Parameters**:
- `action=list` (required)
- `category` (optional): Filter by category

**Response**:
```json
{
  "success": true,
  "templates": [
    {
      "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
      "category": "CX Platform",
      "company_type": "Luxury Fashion Retailer",
      "looking_for": "Customer experience platform...",
      "criteria_count": 21,
      "vendor_count": 5,
      "usage_count": 45,
      "created_at": "2026-01-14T12:00:00Z"
    }
  ],
  "count": 5
}
```

---

### 2. GET Single Template
**Method**: `GET`
**Endpoint**: `/webhook/template-manager-testing?action=get&template_id={id}`

**Query Parameters**:
- `action=get` (required)
- `template_id` (required): Template UUID

**Response**:
```json
{
  "success": true,
  "template": {
    "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
    "category": "CX Platform",
    "company_type": "Luxury Fashion Retailer",
    "company_details": "30+ boutiques • E-commerce • Europe",
    "looking_for": "Customer experience platform...",
    "criteria": [
      {
        "id": "crit_001",
        "name": "Unified 360° Customer Profile",
        "explanation": "Platform provides...",
        "importance": "high",
        "type": "feature",
        "isArchived": false
      }
    ],
    "vendors": [],
    "usage_count": 45,
    "created_at": "2026-01-14T12:00:00Z"
  }
}
```

---

### 3. UPLOAD Template
**Method**: `POST`
**Endpoint**: `/webhook/template-manager-testing`
**Content-Type**: `multipart/form-data`

**Form Data**:
- `action=upload` (required)
- `excel_file` (required): Excel file binary
- `user_id` (required): User UUID
- `category` (optional): Category override

**Excel Structure Expected (MVP - Tabs 0-2)**:
- **Tab 0 (INDEX)**: Project metadata
  - Row 6: `Project Name:` | [value]
  - Row 7: `Category:` | [value]
  - Row 8: `Company Context:` | [value]
  - Row 9: `Solution Requirements:` | [value]
- **Tab 1 (1. Evaluation Criteria)**: Data starts row 4
  - Columns: #, Criterion, Explanation, Importance, Type
- **Tab 2 (2. Vendor List)**: Data starts row 6 (optional)
  - Columns: #, Logo, Vendor, Description, Website

**Response**:
```json
{
  "success": true,
  "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
  "message": "Template uploaded successfully",
  "criteria_count": 21,
  "vendor_count": 5
}
```

**Validation Errors** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Template exceeds maximum criteria count",
    "details": {
      "criteria_count": 35,
      "max_allowed": 30
    }
  }
}
```

---

### 4. DELETE Template
**Method**: `DELETE`
**Endpoint**: `/webhook/template-manager-testing`
**Content-Type**: `application/json`

**Body**:
```json
{
  "action": "delete",
  "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

**Note**: This is a **soft delete** (sets `is_active=false` in Data Tables, preserves history)

---

### 5. TRACK_USAGE
**Method**: `POST`
**Endpoint**: `/webhook/template-manager-testing`
**Content-Type**: `application/json`

**Body**:
```json
{
  "action": "track_usage",
  "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_550e8400-e29b-41d4-a716-446655440000",
  "project_id": "proj_550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "usage_count": 46
}
```

---

## 🗃️ n8n Data Tables Schema

### Table 1: `clarioo_templates`

| Column | Type | Description |
|--------|------|-------------|
| `template_id` | STRING (PK) | UUID |
| `category` | STRING | Template category |
| `company_type` | STRING | Company description |
| `company_details` | STRING | Company metadata |
| `company_context` | STRING (nullable) | Company context from INDEX |
| `solution_requirements` | STRING (nullable) | Solution requirements |
| `looking_for` | STRING | Solution requirements |
| `criteria` | JSON | Array of criteria objects |
| `vendors` | JSON (nullable) | Array of vendor objects |
| `created_at` | DATETIME | Upload timestamp |
| `created_by` | STRING | User ID who uploaded |
| `usage_count` | INTEGER | Number of times used |
| `is_active` | BOOLEAN | Soft delete flag |

### Table 2: `clarioo_template_usage`

| Column | Type | Description |
|--------|------|-------------|
| `usage_id` | STRING (PK) | UUID |
| `template_id` | STRING (FK) | Template used |
| `user_id` | STRING | User who used template |
| `project_id` | STRING | Project created |
| `used_at` | DATETIME | When used |

---

## 📦 Frontend Integration

### templateService.ts Functions

All functions are now implemented in `/src/services/templateService.ts`:

```typescript
// Get all templates from n8n
await getTemplatesFromN8n(category?: string): Promise<Template[]>

// Get single template by ID
await getTemplateByIdFromN8n(templateId: string): Promise<Template | null>

// Upload Excel template
await uploadTemplateExcel(file: File, userId: string, category?: string): Promise<{success, templateId?, error?}>

// Delete template (soft delete)
await deleteTemplate(templateId: string, userId: string): Promise<{success, error?}>

// Track template usage
await trackTemplateUsage(templateId: string, userId: string, projectId: string): Promise<void>

// Get user ID (exported)
getUserId(): string
```

### Usage Example

```typescript
import {
  getTemplatesFromN8n,
  uploadTemplateExcel,
  deleteTemplate,
  getUserId
} from '@/services/templateService';

// Load templates
const templates = await getTemplatesFromN8n('CX Platform');

// Upload template (admin only)
const userId = getUserId();
const file = event.target.files[0];
const result = await uploadTemplateExcel(file, userId);

if (result.success) {
  console.log(`Template uploaded: ${result.templateId}`);
}

// Delete template (admin only)
await deleteTemplate('tpl_123', userId);
```

---

## ⚙️ Current Implementation Status

### ✅ Completed
- [x] `templateService.ts` n8n integration functions
- [x] n8n workflow JSON files (testing + production)
- [x] Input validation logic
- [x] CORS headers configuration
- [x] Error handling structure
- [x] API operation routing

### ⏳ Pending (Next Steps)
1. **n8n Data Tables**:
   - [ ] Create `clarioo_templates` table in n8n
   - [ ] Create `clarioo_template_usage` table in n8n

2. **n8n Workflow Enhancements**:
   - [ ] Add Excel Parser node (Spreadsheet File)
   - [ ] Add Data Tables CRUD nodes
   - [ ] Implement LIST operation with filtering
   - [ ] Implement GET operation
   - [ ] Implement UPLOAD operation (parse tabs 0-2)
   - [ ] Implement DELETE operation (soft delete)
   - [ ] Implement TRACK_USAGE operation

3. **Frontend Components**:
   - [ ] AdminModeToggle component (passcode: 71956)
   - [ ] TemplateUploadButton component
   - [ ] Update TemplateCard with delete button
   - [ ] Update TemplatesModal to load from n8n
   - [ ] Template preview modal

4. **Testing**:
   - [ ] Test all 5 operations end-to-end
   - [ ] Test admin mode toggle
   - [ ] Test Excel upload validation
   - [ ] Test template usage tracking

5. **Migration**:
   - [ ] Create migration script for 5 existing templates
   - [ ] Run migration to n8n Data Tables

---

## 🔐 Admin Mode

Admin functionality is controlled by localStorage flag:

```javascript
// Check admin mode
const isAdmin = localStorage.getItem('clarioo_admin_mode') === 'true';

// Enable admin mode (requires passcode: 71956)
if (passcode === '71956') {
  localStorage.setItem('clarioo_admin_mode', 'true');
}

// Disable admin mode
localStorage.setItem('clarioo_admin_mode', 'false');
```

**Admin-only features**:
- Upload Template Excel button
- Delete template buttons on template cards

---

## 🚀 Deployment Instructions

### 1. Import Workflows to n8n

**Testing Workflow**:
1. Open n8n at `http://localhost:8080`
2. Go to Workflows → Import from File
3. Select `Clarioo_Template_Manager_TESTING.json`
4. Activate workflow

**Production Workflow**:
1. Open n8n at `https://n8n.lakestrom.com`
2. Go to Workflows → Import from File
3. Select `Clarioo_Template_Manager_PRODUCTION.json`
4. Activate workflow

### 2. Create Data Tables

In n8n:
1. Go to Data Tables
2. Create `clarioo_templates` with columns as per schema
3. Create `clarioo_template_usage` with columns as per schema

### 3. Enhance Workflows

Add the following nodes to both workflows:
- **Spreadsheet File** node for Excel parsing
- **Data Tables** nodes for CRUD operations
- **If** nodes for operation routing
- **Code** nodes for data transformation

### 4. Test Webhooks

```bash
# Test LIST operation
curl "http://localhost:8080/webhook/template-manager-testing?action=list"

# Test GET operation
curl "http://localhost:8080/webhook/template-manager-testing?action=get&template_id=tpl_123"

# Test UPLOAD operation (with Excel file)
curl -X POST "http://localhost:8080/webhook/template-manager-testing" \
  -F "action=upload" \
  -F "excel_file=@template.xlsx" \
  -F "user_id=user_123"

# Test DELETE operation
curl -X DELETE "http://localhost:8080/webhook/template-manager-testing" \
  -H "Content-Type: application/json" \
  -d '{"action":"delete","template_id":"tpl_123","user_id":"user_123"}'

# Test TRACK_USAGE operation
curl -X POST "http://localhost:8080/webhook/template-manager-testing" \
  -H "Content-Type: application/json" \
  -d '{"action":"track_usage","template_id":"tpl_123","user_id":"user_123","project_id":"proj_456"}'
```

---

## 📝 MVP Scope Notes

**MVP Phase 1 focuses on**:
- ✅ Tabs 0-2 parsing only (INDEX, Criteria, Vendors)
- ✅ Basic templates (no comparison matrix, battlecards, or executive summary)
- ✅ Admin upload/delete functionality
- ✅ Usage tracking

**Future Phase 2 will add**:
- Tabs 3-6 parsing (Comparison Matrix, Detailed Matching, Battlecards, Pre-Demo Brief)
- Complete project snapshots
- Template preview/browse modal
- Template completeness badges

---

## 🐛 Troubleshooting

### Workflow Returns 400 Error
- Check that `action` parameter is valid (list, get, upload, delete, track_usage)
- Verify required parameters are provided for each action
- Check n8n execution logs for validation errors

### CORS Errors
- Verify all response nodes include CORS headers
- Check webhook is accessible from frontend origin

### Template Not Found
- Verify `template_id` exists in Data Tables
- Check `is_active=true` (soft delete flag)

### Excel Upload Fails
- Verify file is .xlsx or .xls format
- Check file size < 10MB
- Verify Excel structure matches expected format (tabs 0-2)
- Check for validation errors (max 30 criteria, max 20 vendors)

---

**Last Updated**: 2026-01-14
**Sprint**: SP_028 MVP
**Phase**: 1 (Tabs 0-2 Only)
