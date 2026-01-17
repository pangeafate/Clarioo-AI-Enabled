# Template Manager Workflows - Complete Package

All files related to the n8n Template Manager implementation.

## 📁 Workflow Files (Import These)

### 1. **Clarioo_Template_Manager_LIST_AND_CREATE.json** ⭐ CURRENT
- **Status**: Active development
- **Operations**: LIST and UPLOAD
- **Webhook**: `/webhook/template-manager`
- **Use this**: For testing LIST and UPLOAD operations

### 2. **Clarioo_Template_Manager_LIST_ONLY.json**
- **Status**: Initial version (working)
- **Operations**: LIST only
- **Webhook**: `/webhook/template-manager-list-only`
- **Use this**: If you need a simple list-only workflow

### 3. **Clarioo_Template_Manager_TESTING_V2.json**
- **Status**: Complete version (not tested yet)
- **Operations**: LIST, GET, UPLOAD, DELETE
- **Webhook**: `/webhook/template-manager-testing`
- **Use this**: After current workflow is working

### 4. **Clarioo_Template_Manager_PRODUCTION_V2.json**
- **Status**: Production version
- **Operations**: LIST, GET, UPLOAD, DELETE
- **Webhook**: `/webhook/template-manager-production`
- **Use this**: Deploy to production after testing

---

## 🔧 Node Fix Instructions

### **⭐ ALL_FIXES_TO_APPLY.md** - START HERE!
**Complete checklist with all 3 fixes needed**
- Fix 1: Route Action - Add binary pass-through
- Fix 2: Parse Excel File - Change to read from binary (not URL)
- Fix 3: Transform Excel Data - Update to v3 code for object format
**Status**: These fixes are NOT yet applied to the workflow. Apply them now!

### Individual Fix Documentation (for reference):

**FIXED_Route_Action_Node.md**
- Problem: Route Action node wasn't passing through binary data
- Fix: Add `binary: items[0].binary || {}` to return

**FIXED_Extract_File_Node.md**
- Problem: Looking for file in wrong place
- Fix: Access file from `items[0].binary.file`

**FIXED_Parse_Excel_Node.md**
- Problem: Reading from URL instead of binary data
- Fix: Change "Read From" to "Binary Data"

**FIXED_Transform_Excel_Data_Node_v3.md**
- Problem: Excel returns objects not 2D arrays
- Fix: Parse object format with CLARIOO/__EMPTY keys

---

## 📊 Data Table Schema Files

### **clarioo_templates_schema.csv**
- **Purpose**: Import to create `clarioo_templates` Data Table
- **Columns**: 16 columns + 1 auto-generated ID
- **Rows**: 5 sample templates included
- **How to use**: Data Tables → Import from CSV

### **clarioo_template_usage_schema.csv**
- **Purpose**: Import to create `clarioo_template_usage` Data Table
- **Columns**: 4 columns (template_id, user_id, project_id, used_at)
- **Rows**: 1 sample usage record
- **How to use**: Data Tables → Import from CSV

---

## 📝 Documentation Files

### **SETUP_DATA_TABLES.md**
Complete guide for setting up n8n Data Tables manually or via CSV import.
Includes:
- Table schemas
- Column definitions
- JSON structure examples
- Manual setup instructions

### **WORKFLOW_IMPLEMENTATION_SUMMARY.md**
Technical documentation covering:
- Node types and configuration
- API examples
- Error responses
- Validation checklist

---

## 🚀 Migration Script

### **migrate_templates.cjs**
Node.js script to migrate existing templates from `templates.json` to n8n Data Tables.

**Usage**:
```bash
node migrate_templates.cjs testing   # For local testing
node migrate_templates.cjs production # For production
```

**What it does**:
- Reads templates from `../../src/data/templates/templates.json`
- Converts to new schema
- Generates SQL INSERT statements
- Creates JSON export file for manual import

---

## 📋 Current Implementation Status

### ✅ Completed
- [x] Schema design with new fields
- [x] CSV import files created
- [x] Frontend components updated
- [x] Static templates.json converted
- [x] LIST operation working
- [x] Workflow imported and activated

### 🔄 In Progress
- [ ] UPLOAD operation (fixing Transform Excel Data node)
- [ ] Testing with real Excel files

### ⏳ Pending
- [ ] GET single template operation
- [ ] DELETE template operation
- [ ] Full end-to-end testing
- [ ] Production deployment

---

## 🐛 Current Issue

**Problem**: Upload returns empty response (HTTP 200 but 0 bytes)

**Root Cause**: The workflow still has OLD code - fixes haven't been applied yet!

**What needs to be done**:
1. ✅ LIST operation works - returns 6 templates
2. ❌ UPLOAD operation broken - three nodes need fixes
3. 📋 **Action Required**: Apply all fixes from `ALL_FIXES_TO_APPLY.md`

**Specific Issues**:
- Route Action: Missing `binary` pass-through (line 37 of workflow JSON)
- Parse Excel File: Still set to read from URL (line 180)
- Transform Excel Data: Still using v1 code expecting arrays (line 194)

**Next Step**: Open workflow in n8n UI → Apply 3 fixes → Save → Test

---

## 🧪 Testing

### Test LIST Operation:
```bash
curl -X POST https://n8n.lakestrom.com/webhook/template-manager?action=list
```

### Test UPLOAD Operation:
```bash
curl -X POST "https://n8n.lakestrom.com/webhook/template-manager?action=upload" \
  -F "file=@path/to/template.xlsx" \
  -F "user_id=test_user"
```

---

## 📞 API Reference

### LIST Templates
**Request**:
```bash
POST /webhook/template-manager?action=list
POST /webhook/template-manager  # default is list
```

**Response**:
```json
{
  "success": true,
  "templates": [...],
  "count": 5
}
```

### UPLOAD Template
**Request**:
```bash
POST /webhook/template-manager?action=upload
Content-Type: multipart/form-data

Fields:
- file: Excel file (.xlsx)
- user_id: String
```

**Response**:
```json
{
  "success": true,
  "template_id": "tpl_1737012345_abc123",
  "message": "Template uploaded successfully",
  "criteria_count": 15,
  "vendor_count": 3,
  "template_category": "PROJECT MANAGEMENT"
}
```

---

## 🔗 Related Files (Outside This Folder)

- Frontend: `/src/types/template.types.ts`
- Frontend: `/src/components/templates/TemplateCard.tsx`
- Frontend: `/src/components/templates/TemplatesModal.tsx`
- Static Data: `/src/data/templates/templates.json`
