# n8n Webhook Configuration v3 - Template Upload & Management
**Sprint**: SP_029 - Excel Template Upload
**Version**: v3 (Updated 2026-01-16)
**Created**: 2026-01-15
**Purpose**: Configure n8n webhook to handle template upload, list, and delete operations

## 🎯 Overview

This webhook replaces the Excel transformation approach from SP_028 with a **zero-transformation** approach:
- **OLD**: Excel file → n8n parses → transforms → stores
- **NEW**: Excel file → Frontend parses → JSON → n8n stores (no transformation)

## 📋 Prerequisites

1. **Data Table Created**: `clarioo_templates` table created from `clarioo_templates_schema_v3.csv`
2. **Schema Columns**: 21 columns including `template_data_json` (JSON type)
3. **Webhook URL**: Environment variable `VITE_TEMPLATE_WEBHOOK_URL` configured

## 🔧 Workflow Setup

### Workflow Name
`Clarioo Template Manager - Upload JSON (SP_029)`

### Trigger Node
**Type**: Webhook
- **Path**: `/templates` (or your preferred path)
- **Method**: POST (all actions use POST)
- **Authentication**: None (public webhook, validated by user_id)
- **Response Mode**: Immediate

### Action Router Node
**Type**: Switch
**Route By**: `{{ $json.body.action }}`

**Cases**:
1. `upload_json` - Upload new template
2. `list` - List all templates
3. `delete` - Delete template by ID
4. Default - Return error

## 📤 Action: `upload_json`

### Request Format
```json
POST /templates
Content-Type: application/json

{
  "action": "upload_json",
  "template": {
    "template_id": "550e8400-e29b-41d4-a716-446655440000",
    "template_name": "Customer Experience Platform Selection",
    "project_description": "Comprehensive evaluation criteria for CX platforms",
    "template_category": "Customer Experience",
    "searched_by": "Sarah Chen - VP Customer Success",
    "software_category": "CX Platforms",
    "key_features": "AI-powered insights, Omnichannel support, Analytics",
    "client_quote": "This template helped us evaluate 8 vendors...",
    "current_tools": "Zendesk",
    "company_context": "Mid-sized B2B SaaS company with 500+ enterprise customers",
    "solution_requirements": "Unified platform with AI-driven insights for proactive support",
    "criteria_count": 12,
    "vendors_count": 5,
    "has_comparison_matrix": true,
    "has_battlecards": true,
    "has_executive_summary": true,
    "project_stage": "battlecards_complete",
    "template_data_json": "{\"projectId\":\"...\",\"projectName\":\"...\",\"criteria\":[...],\"vendors\":[...]}",
    "user_id": "admin-user-123",
    "uploaded_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T10:30:00Z"
  }
}
```

### n8n Nodes Sequence

#### 1. Extract Template Data
**Node Type**: Set
**Operation**: Set multiple values
**Fields**:
```javascript
{
  "template_id": "={{ $json.body.template.template_id }}",
  "template_name": "={{ $json.body.template.template_name }}",
  "project_description": "={{ $json.body.template.project_description }}",
  "template_category": "={{ $json.body.template.template_category }}",
  "searched_by": "={{ $json.body.template.searched_by }}",
  "software_category": "={{ $json.body.template.software_category }}",
  "key_features": "={{ $json.body.template.key_features }}",
  "client_quote": "={{ $json.body.template.client_quote }}",
  "current_tools": "={{ $json.body.template.current_tools }}",
  "company_context": "={{ $json.body.template.company_context }}",
  "solution_requirements": "={{ $json.body.template.solution_requirements }}",
  "criteria_count": "={{ $json.body.template.criteria_count }}",
  "vendors_count": "={{ $json.body.template.vendors_count }}",
  "has_comparison_matrix": "={{ $json.body.template.has_comparison_matrix }}",
  "has_battlecards": "="{{ $json.body.template.has_battlecards }}",
  "has_executive_summary": "={{ $json.body.template.has_executive_summary }}",
  "project_stage": "={{ $json.body.template.project_stage }}",
  "template_data_json": "={{ $json.body.template.template_data_json }}",
  "user_id": "={{ $json.body.template.user_id }}",
  "uploaded_at": "={{ $json.body.template.uploaded_at }}",
  "updated_at": "={{ $json.body.template.updated_at }}"
}
```

#### 2. Insert into Data Table
**Node Type**: Data Table Insert
**Table**: `clarioo_templates`
**Columns**: Map all 21 fields from previous node
**Options**:
- Skip Duplicate On Conflict: `template_id` (prevent duplicate uploads)
- Return Inserted Data: Yes

#### 3. Success Response
**Node Type**: Respond to Webhook
**Response**:
```json
{
  "success": true,
  "template_id": "={{ $json.template_id }}",
  "message": "Template uploaded successfully",
  "warnings": []
}
```

### Error Handling
**On Error**: Return error response
```json
{
  "success": false,
  "error": "{{ $error.message }}",
  "details": "Failed to insert template into Data Table"
}
```

## 📥 Action: `list`

### Request Format
```json
POST /templates
Content-Type: application/json

{
  "action": "list"
}
```

### n8n Nodes Sequence

#### 1. Fetch All Templates
**Node Type**: Data Table Select
**Table**: `clarioo_templates`
**Select Columns**: All columns
**Sort By**: `uploaded_at` DESC
**Options**:
- Return All Data: Yes

#### 2. Transform Response
**Node Type**: Set
**Operation**: Keep only subset of fields for listing
**Fields** (for each item):
```javascript
{
  "templateId": "={{ $json.template_id }}",
  "templateName": "={{ $json.template_name }}",
  "templateCategory": "={{ $json.template_category }}",
  "searchedBy": "={{ $json.searched_by }}",
  "softwareCategory": "={{ $json.software_category }}",
  "keyFeatures": "={{ $json.key_features }}",
  "clientQuote": "={{ $json.client_quote }}",
  "currentTools": "={{ $json.current_tools }}",
  "criteriaCount": "={{ $json.criteria_count }}",
  "vendorsCount": "={{ $json.vendors_count }}",
  "hasComparisonMatrix": "={{ $json.has_comparison_matrix }}",
  "hasBattlecards": "={{ $json.has_battlecards }}",
  "hasExecutiveSummary": "={{ $json.has_executive_summary }}",
  "projectStage": "={{ $json.project_stage }}",
  "templateData": "={{ $json.template_data_json }}",  // Keep as string, parse in frontend
  "uploadedAt": "={{ $json.uploaded_at }}"
}
```

#### 3. Success Response
**Node Type**: Respond to Webhook
**Response**:
```json
{
  "success": true,
  "templates": "={{ $json }}",
  "count": "={{ $json.length }}"
}
```

### Error Handling
```json
{
  "success": false,
  "error": "{{ $error.message }}",
  "templates": []
}
```

## 🗑️ Action: `delete`

### Request Format
```json
POST /templates
Content-Type: application/json

{
  "action": "delete",
  "template_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "admin-user-123"
}
```

### n8n Nodes Sequence

#### 1. Extract Parameters
**Node Type**: Set
**Fields**:
```javascript
{
  "template_id": "={{ $json.body.template_id }}",
  "user_id": "={{ $json.body.user_id }}"
}
```

#### 2. Validate User (Optional - Admin Check)
**Node Type**: IF
**Condition**: Check if user_id matches uploaded user or is admin
```javascript
={{ $json.user_id === 'admin-user-123' || $json.user_id === $json.template_user_id }}
```

#### 3. Delete from Data Table
**Node Type**: Data Table Delete
**Table**: `clarioo_templates`
**Filter**: `template_id` = `{{ $json.template_id }}`
**Options**:
- Return Deleted Data: Yes (to confirm deletion)

#### 4. Success Response
**Node Type**: Respond to Webhook
**Response**:
```json
{
  "success": true,
  "template_id": "={{ $json.template_id }}",
  "message": "Template deleted successfully"
}
```

### Error Handling
```json
{
  "success": false,
  "error": "{{ $error.message }}",
  "details": "Failed to delete template or template not found"
}
```

## 🔍 Action: `get` (Optional - Single Template)

### Request Format
```json
POST /templates
Content-Type: application/json

{
  "action": "get",
  "template_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### n8n Nodes Sequence

#### 1. Extract Template ID
**Node Type**: Set
**Fields**:
```javascript
{
  "template_id": "={{ $json.body.template_id }}"
}
```

#### 2. Fetch Template
**Node Type**: Data Table Select
**Table**: `clarioo_templates`
**Filter**: `template_id` = `{{ $json.template_id }}`
**Select Columns**: All columns
**Limit**: 1

#### 3. Success Response
**Node Type**: Respond to Webhook
**Response**:
```json
{
  "success": true,
  "template": "={{ $json }}"
}
```

### Error Handling
```json
{
  "success": false,
  "error": "Template not found",
  "template_id": "={{ $json.template_id }}"
}
```

## 🧪 Testing Checklist

### 1. Upload Test
```bash
curl -X POST https://your-n8n-instance.com/webhook/templates \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upload_json",
    "template": {
      "template_id": "test-123",
      "template_name": "Test Template",
      "project_description": "Test project description",
      "template_category": "Testing",
      "searched_by": "Test User",
      "software_category": "Test Category",
      "key_features": "Feature 1, Feature 2",
      "client_quote": "Test quote",
      "current_tools": "Test tools",
      "company_context": "Test company context",
      "solution_requirements": "Test requirements",
      "criteria_count": 5,
      "vendors_count": 3,
      "has_comparison_matrix": true,
      "has_battlecards": false,
      "has_executive_summary": false,
      "project_stage": "comparison_matrix",
      "template_data_json": "{\"projectId\":\"test-123\",\"projectName\":\"Test\"}",
      "user_id": "test-user",
      "uploaded_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    }
  }'
```

**Expected**:
```json
{
  "success": true,
  "template_id": "test-123",
  "message": "Template uploaded successfully"
}
```

### 2. List Test
```bash
curl -X POST https://your-n8n-instance.com/webhook/templates \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

**Expected**:
```json
{
  "success": true,
  "templates": [
    {
      "templateId": "test-123",
      "templateName": "Test Template",
      "criteriaCount": 5,
      ...
    }
  ],
  "count": 1
}
```

### 3. Delete Test
```bash
curl -X POST https://your-n8n-instance.com/webhook/templates \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "template_id": "test-123",
    "user_id": "test-user"
  }'
```

**Expected**:
```json
{
  "success": true,
  "template_id": "test-123",
  "message": "Template deleted successfully"
}
```

## 🔒 Security Considerations

### Current Approach (MVP)
- **No authentication** on webhook (public endpoint)
- **User tracking** via `user_id` in localStorage
- **Admin mode** protected by frontend passcode (71956)

### Future Enhancements (Post-MVP)
- Add API key authentication
- Implement role-based access control (RBAC)
- Add rate limiting to prevent abuse
- Validate JSON structure before storage
- Add file size limits for `template_data_json`

## 📊 Data Table Interaction

### Insert Operation
```sql
INSERT INTO clarioo_templates (
  template_id,
  template_name,
  template_category,
  -- ... all 21 columns
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Customer Experience Platform Selection',
  'Customer Experience',
  -- ... all values
)
ON CONFLICT (template_id) DO NOTHING;
```

### Select Operation
```sql
SELECT * FROM clarioo_templates
ORDER BY uploaded_at DESC;
```

### Delete Operation
```sql
DELETE FROM clarioo_templates
WHERE template_id = '550e8400-e29b-41d4-a716-446655440000';
```

## 🎯 Integration with Frontend

### Upload Flow
```typescript
// src/services/templateService.ts:641-693
async function uploadTemplateWithJSON(
  templateData: ExportProjectData,
  userId: string
): Promise<UploadResult> {
  const template_id = crypto.randomUUID();

  const row = {
    template_id,
    template_name: templateData.projectName,
    template_category: templateData.projectCategory || 'Uncategorized',
    criteria_count: templateData.criteria.length,
    vendors_count: templateData.vendors.length,
    has_comparison_matrix: !!templateData.comparisonMatrix,
    has_battlecards: !!templateData.battlecards?.length,
    has_executive_summary: !!templateData.executiveSummary,
    project_stage: templateData.stage,
    template_data_json: JSON.stringify(templateData),
    user_id: userId,
    uploaded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(TEMPLATE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'upload_json',
      template: row
    })
  });

  const result = await response.json();
  return result;
}
```

### List Flow
```typescript
async function getTemplatesFromN8n(): Promise<Template[]> {
  const response = await fetch(TEMPLATE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list' })
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.templates;
}
```

### Delete Flow
```typescript
async function deleteTemplate(
  templateId: string,
  userId: string
): Promise<DeleteResult> {
  const response = await fetch(TEMPLATE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete',
      template_id: templateId,
      user_id: userId
    })
  });

  const result = await response.json();
  return result;
}
```

## 📝 Environment Variables

### Frontend (.env)
```bash
VITE_TEMPLATE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/templates
```

### n8n
- No additional environment variables needed
- Data Table name: `clarioo_templates` (hardcoded in workflow)

## 🚀 Deployment Steps

1. **Create Data Table**:
   - Go to n8n → Data Tables
   - Click "Create Table"
   - Upload `clarioo_templates_schema_v3.csv`
   - Name: `clarioo_templates`

2. **Create Webhook Workflow**:
   - Create new workflow
   - Add Webhook trigger node
   - Add Switch node for action routing
   - Add nodes for each action (upload_json, list, delete)
   - Connect to `clarioo_templates` Data Table

3. **Test Webhook**:
   - Get production webhook URL
   - Update `.env` with `VITE_TEMPLATE_WEBHOOK_URL`
   - Test each action using curl commands above

4. **Activate Workflow**:
   - Save workflow
   - Activate workflow
   - Monitor executions for errors

## 📚 Related Documentation

- `DATATABLE_SCHEMA_EXPLANATION_v3.md` - Schema structure and design decisions
- `clarioo_templates_schema_v3.csv` - CSV schema for Data Table creation
- `Clarioo_Template_Manager_Upload_JSON_v3.json` - n8n workflow (current version)
- `DEPLOYMENT_CHECKLIST_v3.md` - Step-by-step deployment guide
- `SP_029_Excel_Template_Upload.md` - Sprint documentation (in /SPRINTS folder)
- Previous workflow: `Clarioo Template Manager - LIST & CREATE (TESTING) v4 - 7 Sheets v2.json`

## ✅ Success Criteria

- [ ] Upload action successfully inserts rows into Data Table
- [ ] List action returns all templates with correct structure
- [ ] Delete action removes templates by ID
- [ ] Frontend can upload parsed Excel templates
- [ ] Frontend can list templates (display template cards)
- [ ] Frontend can create projects from templates
- [ ] Round-trip test passes: Export → Upload → Clone → Export (identical structure)
