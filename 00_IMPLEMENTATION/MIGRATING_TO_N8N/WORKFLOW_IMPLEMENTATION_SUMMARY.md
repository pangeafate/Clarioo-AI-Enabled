# Template Manager Workflow - Implementation Summary

## ✅ Completed Workflows

### 1. Clarioo_Template_Manager_TESTING_V2.json
- **Webhook URL**: `http://localhost:8080/webhook/template-manager-testing`
- **Node Type**: `n8n-nodes-base.dataTable` (correct)
- **Operations**: LIST, GET, UPLOAD, DELETE

### 2. Clarioo_Template_Manager_PRODUCTION_V2.json
- **Webhook URL**: `https://n8n.lakestrom.com/webhook/template-manager-production`
- **Node Type**: `n8n-nodes-base.dataTable` (correct)
- **Operations**: LIST, GET, UPLOAD, DELETE

## 🔧 Technical Implementation

### Correct Data Table Node Structure

Based on DataTableNodeReference.json analysis:

```json
{
  "type": "n8n-nodes-base.dataTable",
  "parameters": {
    "dataTableId": {
      "__rl": true,
      "value": "clarioo_templates",
      "mode": "list"
    }
  }
}
```

### Operations Implemented

#### 1. LIST Templates (`action=list`)
**Flow**: Webhook → Validation → Switch → Get All Templates → Format → Response

**Data Table Node**:
```json
{
  "operation": "get",
  "dataTableId": { "__rl": true, "value": "clarioo_templates", "mode": "list" },
  "options": { "returnAll": true }
}
```

**Features**:
- Filters by `is_active=true`
- Optional category filtering
- Returns formatted template array with parsed JSON fields

#### 2. GET Single Template (`action=get`)
**Flow**: Webhook → Validation → Switch → Get By ID → Format → Response

**Data Table Node**:
```json
{
  "operation": "get",
  "dataTableId": { "__rl": true, "value": "clarioo_templates", "mode": "list" },
  "filters": {
    "conditions": [{
      "keyName": "template_id",
      "condition": "equals",
      "keyValue": "={{ $json.query?.template_id }}"
    }]
  },
  "options": { "returnAll": false, "limit": 1 }
}
```

**Features**:
- Filters by template_id
- Returns 404 if not found or inactive
- Parses all JSON fields (criteria, vendors, etc.)

#### 3. UPLOAD Template (`action=upload`)
**Flow**: Webhook → Validation → Switch → Parse Excel → Transform → Insert → Format → Response

**Excel Parsing** (Spreadsheet File node):
- Tab 0: INDEX (metadata)
- Tab 1: Criteria (evaluation criteria)
- Tab 2: Vendors (vendor list)

**Data Table Node**:
```json
{
  "dataTableId": { "__rl": true, "value": "clarioo_templates", "mode": "list" },
  "columns": {
    "mappingMode": "autoMapInputData",
    "schema": [
      { "id": "template_id", "type": "string" },
      { "id": "template_category", "type": "string" },
      { "id": "criteria", "type": "string" },
      { "id": "is_active", "type": "boolean" },
      ...
    ]
  }
}
```

**Features**:
- Generates unique template_id: `tpl_{timestamp}_{random}`
- Auto-extracts key_features from first 4 criteria
- Stringifies JSON fields (criteria, vendors, etc.)
- Sets is_active=true and uploaded_by from user_id

#### 4. DELETE Template (`action=delete`)
**Flow**: Webhook → Validation → Switch → Update Row → Format → Response

**Data Table Node**:
```json
{
  "operation": "update",
  "dataTableId": { "__rl": true, "value": "clarioo_templates", "mode": "list" },
  "filters": {
    "conditions": [{
      "keyName": "template_id",
      "condition": "equals",
      "keyValue": "={{ $json.body.template_id }}"
    }]
  },
  "columns": {
    "mappingMode": "defineBelow",
    "value": { "is_active": false }
  }
}
```

**Features**:
- Soft delete (sets `is_active=false`)
- Requires user_id for authorization
- Returns success message with template_id

## 📋 Key Differences from Initial Version

| Aspect | Initial (Incorrect) | V2 (Correct) |
|--------|-------------------|--------------|
| Node Type | `n8n-nodes-base.n8nDataTables` | `n8n-nodes-base.dataTable` |
| dataTableId | Simple string | Resource locator object with `__rl: true` |
| Operations | Used operation property wrong | Correct operation values (get, update, etc.) |
| Filters | Incorrect structure | Proper conditions array with keyName/condition |
| Insert | Used fieldsUi parameter | Uses columns with schema array |

## 🎯 API Examples

### 1. List All Templates
```bash
curl -X POST http://localhost:8080/webhook/template-manager-testing \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

**Response**:
```json
{
  "success": true,
  "templates": [...],
  "count": 5,
  "category": "all"
}
```

### 2. List by Category
```bash
curl -X POST http://localhost:8080/webhook/template-manager-testing \
  -H "Content-Type: application/json" \
  -d '{"action": "list", "category": "CX PLATFORM"}'
```

### 3. Get Single Template
```bash
curl -X POST http://localhost:8080/webhook/template-manager-testing \
  -H "Content-Type: application/json" \
  -d '{"action": "get", "template_id": "luxury-fashion-retailer-001"}'
```

**Response**:
```json
{
  "success": true,
  "template": {
    "templateId": "luxury-fashion-retailer-001",
    "templateCategory": "CX PLATFORM",
    "searchedBy": "Luxury Fashion Retailer – 30+ boutiques",
    "lookingFor": "Customer experience platform...",
    "keyFeatures": "Unified customer profiles, Advanced clienteling, ...",
    "criteria": [...],
    "vendors": [...]
  }
}
```

### 4. Upload Template
```bash
curl -X POST http://localhost:8080/webhook/template-manager-testing \
  -H "Content-Type: multipart/form-data" \
  -F 'action=upload' \
  -F 'user_id=admin_001' \
  -F 'file=@template.xlsx'
```

**Response**:
```json
{
  "success": true,
  "template_id": "tpl_1737000000_abc123",
  "message": "Template uploaded successfully",
  "criteria_count": 12,
  "vendor_count": 5,
  "template_category": "CX PLATFORM"
}
```

### 5. Delete Template
```bash
curl -X POST http://localhost:8080/webhook/template-manager-testing \
  -H "Content-Type: application/json" \
  -d '{"action": "delete", "template_id": "tpl_123", "user_id": "admin_001"}'
```

**Response**:
```json
{
  "success": true,
  "message": "Template deleted successfully",
  "template_id": "tpl_123"
}
```

## 🚨 Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "template_id is required for get action"
  }
}
```

### Processing Error (500)
```json
{
  "success": false,
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Invalid Excel file format"
  }
}
```

### Not Found (200 with error object)
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "Template not found or has been deleted"
  }
}
```

## 📦 Next Steps

1. **Import Workflows to n8n**:
   - Open n8n interface
   - Import `Clarioo_Template_Manager_TESTING_V2.json`
   - Import `Clarioo_Template_Manager_PRODUCTION_V2.json`
   - Activate both workflows

2. **Configure Data Table IDs**:
   - After importing, update the `dataTableId.value` in each Data Table node
   - Use the actual Data Table ID from your n8n instance
   - Current value is placeholder: `"clarioo_templates"`

3. **Run Migration Script**:
   ```bash
   cd 00_IMPLEMENTATION/MIGRATING_TO_N8N
   node migrate_templates.cjs testing
   ```

4. **Test Each Operation**:
   - Test LIST: `curl ... -d '{"action":"list"}'`
   - Test GET: `curl ... -d '{"action":"get","template_id":"..."}'`
   - Test UPLOAD: Upload a sample Excel file
   - Test DELETE: `curl ... -d '{"action":"delete","template_id":"...","user_id":"..."}'`

5. **Update Frontend Service**:
   - Update webhook URLs in frontend service configuration
   - Test end-to-end from React app

## ✅ Validation Checklist

- [x] Correct node type: `n8n-nodes-base.dataTable`
- [x] Resource locator structure with `__rl: true`
- [x] Proper filter conditions with keyName/condition
- [x] Schema array for insert/update operations
- [x] Error handling with error branches
- [x] CORS headers on all responses
- [x] Input validation before operations
- [x] JSON parsing/stringification for complex fields
- [x] Soft delete pattern (is_active flag)
- [ ] Data Table IDs configured (manual step)
- [ ] Workflows imported and activated (manual step)
- [ ] Templates migrated (manual step)
- [ ] End-to-end testing completed (manual step)
