# SP_029 Deployment Checklist v3 - n8n Template Manager Setup

**Sprint**: SP_029 - Excel Template Upload
**Version**: v3 (Updated 2026-01-16)
**Status**: Ready for Deployment
**Created**: 2026-01-15
**Estimated Time**: 15-20 minutes

## 📋 Overview

This checklist guides you through deploying the SP_029 template management system to n8n. All frontend code is complete - this checklist covers the backend n8n configuration only.

## ✅ Pre-Deployment Verification

Before starting, verify these files exist:

- [ ] `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/clarioo_templates_schema_v3.csv`
- [ ] `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/Clarioo_Template_Manager_Upload_JSON_v3.json`
- [ ] `00_IMPLEMENTATION/MIGRATING_TO_N8N/N8N_WEBHOOK_CONFIGURATION.md` (reference guide)
- [ ] Frontend components:
  - [ ] `src/services/excelImportService.ts` (829 lines)
  - [ ] `src/services/templateService.ts` (uploadTemplateWithJSON function)
  - [ ] `src/components/templates/TemplateUploadButton.tsx` (200 lines)
  - [ ] `src/components/admin/AdminModeToggle.tsx` (135 lines)

## 🚀 Deployment Steps

### Step 1: Create n8n Data Table (5 minutes)

1. **Login to n8n**
   - [ ] Open https://n8n.lakestrom.com (or your n8n instance)
   - [ ] Navigate to **Data Tables** section

2. **Create New Table**
   - [ ] Click **"Create Table"** button
   - [ ] Click **"Import from CSV"**
   - [ ] Upload file: `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/clarioo_templates_schema_v3.csv`
   - [ ] Set table name: `clarioo_templates`
   - [ ] Verify 21 columns are created:
     ```
     template_id, template_name, project_description, template_category,
     software_category, searched_by, key_features, client_quote,
     current_tools, company_context, solution_requirements,
     criteria_count, vendors_count, has_comparison_matrix,
     has_battlecards, has_executive_summary, project_stage,
     template_data_json, user_id, uploaded_at, updated_at
     ```
   - [ ] Click **"Create Table"**

3. **Copy Data Table ID**
   - [ ] After creation, open the table
   - [ ] Copy the **Data Table ID** (looks like: `12345678-1234-1234-1234-123456789abc`)
   - [ ] Save this ID - you'll need it in Step 2

### Step 2: Import n8n Workflow (5 minutes)

1. **Import Workflow JSON**
   - [ ] Go to **Workflows** section in n8n
   - [ ] Click **"Import from File"**
   - [ ] Upload file: `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/Clarioo_Template_Manager_Upload_JSON_v3.json`
   - [ ] Workflow name should be: `Clarioo Template Manager - Upload JSON (SP_029)`

2. **Update Data Table IDs**
   - [ ] Open the imported workflow
   - [ ] Find and update **4 nodes** with the Data Table ID you copied in Step 1:

   **Node 1: "Get All Templates"** (in list action branch)
   - [ ] Click on node
   - [ ] Find parameter: `Data Table` → Replace `YOUR_DATA_TABLE_ID` with your actual ID

   **Node 2: "Insert Template"** (in upload_json action branch)
   - [ ] Click on node
   - [ ] Find parameter: `Data Table` → Replace `YOUR_DATA_TABLE_ID` with your actual ID

   **Node 3: "Delete Template"** (in delete action branch)
   - [ ] Click on node
   - [ ] Find parameter: `Data Table` → Replace `YOUR_DATA_TABLE_ID` with your actual ID

   **Node 4: "Get Single Template"** (in get action branch)
   - [ ] Click on node
   - [ ] Find parameter: `Data Table` → Replace `YOUR_DATA_TABLE_ID` with your actual ID

3. **Save Workflow**
   - [ ] Click **"Save"** button
   - [ ] Verify no errors appear

### Step 3: Activate Workflow and Get Webhook URL (2 minutes)

1. **Activate Workflow**
   - [ ] Toggle **"Active"** switch in top-right corner
   - [ ] Verify status shows **"Active"**

2. **Copy Production Webhook URL**
   - [ ] Click on **"Webhook"** node (first node)
   - [ ] Copy the **Production URL** (looks like: `https://n8n.lakestrom.com/webhook/templates`)
   - [ ] Save this URL - you'll need it in Step 4

### Step 4: Update Frontend Environment Variable (2 minutes)

1. **Update .env File**
   - [ ] Open `.env` file in project root
   - [ ] Add or update this line:
     ```bash
     VITE_TEMPLATE_WEBHOOK_URL=https://n8n.lakestrom.com/webhook/templates
     ```
   - [ ] Replace with your actual webhook URL from Step 3
   - [ ] Save file

2. **Restart Development Server**
   - [ ] Stop `npm run dev` (Ctrl+C)
   - [ ] Run `npm run dev` again
   - [ ] Verify app starts without errors

### Step 5: Test Deployment (5-10 minutes)

#### Test 1: List Templates (Empty State)
```bash
curl -X POST https://n8n.lakestrom.com/webhook/templates \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

**Expected Response**:
```json
{
  "success": true,
  "templates": [],
  "count": 0
}
```

- [ ] Test passed: Received empty templates list

#### Test 2: Upload Test Template
```bash
curl -X POST https://n8n.lakestrom.com/webhook/templates \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upload_json",
    "template": {
      "template_id": "test-deployment-001",
      "template_name": "Test Template - Deployment Verification",
      "template_category": "Testing",
      "searched_by": "Deployment Test",
      "software_category": "Test Category",
      "key_features": "Test feature 1, Test feature 2",
      "client_quote": "This is a test template",
      "current_tools": "None",
      "criteria_count": 3,
      "vendors_count": 2,
      "has_comparison_matrix": true,
      "has_battlecards": false,
      "has_executive_summary": false,
      "project_stage": "comparison_matrix",
      "template_data_json": "{\"projectId\":\"test-deployment-001\",\"projectName\":\"Test Template\",\"criteria\":[],\"vendors\":[]}",
      "user_id": "deployment-test-user",
      "uploaded_at": "2026-01-15T12:00:00Z",
      "updated_at": "2026-01-15T12:00:00Z"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "template_id": "test-deployment-001",
  "message": "Template uploaded successfully",
  "warnings": []
}
```

- [ ] Test passed: Template uploaded successfully

#### Test 3: List Templates (With Data)
```bash
curl -X POST https://n8n.lakestrom.com/webhook/templates \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

**Expected Response**:
```json
{
  "success": true,
  "templates": [
    {
      "templateId": "test-deployment-001",
      "templateName": "Test Template - Deployment Verification",
      "templateCategory": "Testing",
      ...
    }
  ],
  "count": 1
}
```

- [ ] Test passed: Template appears in list

#### Test 4: Frontend Integration Test

1. **Open Application**
   - [ ] Navigate to http://localhost:5173
   - [ ] Click **"Templates"** button (or navigate to templates section)

2. **Verify Template Display**
   - [ ] Test template card should be visible
   - [ ] Card shows: "Test Template - Deployment Verification"
   - [ ] Card shows category: "Testing"
   - [ ] Card shows: "3 criteria, 2 vendors"

3. **Test Admin Mode**
   - [ ] Click **"Admin Mode"** toggle
   - [ ] Enter passcode: `71956`
   - [ ] Verify "Upload Template" button appears

4. **Clean Up Test Template**
   - [ ] Click **"Delete"** button on test template card
   - [ ] Confirm deletion
   - [ ] Verify template disappears from list

#### Test 5: Delete Test Template (API)
```bash
curl -X POST https://n8n.lakestrom.com/webhook/templates \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "template_id": "test-deployment-001",
    "user_id": "deployment-test-user"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "template_id": "test-deployment-001",
  "message": "Template deleted successfully"
}
```

- [ ] Test passed: Template deleted successfully

## 🎯 Post-Deployment Verification

### Verify All Components

- [ ] **n8n Data Table**: `clarioo_templates` exists with 21 columns
- [ ] **n8n Workflow**: Active and responding to webhook requests
- [ ] **Frontend**: Templates modal loads without errors
- [ ] **Admin Mode**: Toggle works, passcode accepted
- [ ] **Upload Button**: Visible in admin mode
- [ ] **API Endpoints**: All 4 actions working (list, upload_json, delete, get)

### Verify Logs

1. **n8n Workflow Executions**
   - [ ] Go to n8n → Workflows → "Clarioo Template Manager - Upload JSON (SP_029)"
   - [ ] Click **"Executions"** tab
   - [ ] Verify test executions show **"Success"** status
   - [ ] No error logs in failed executions

2. **Browser Console**
   - [ ] Open DevTools → Console
   - [ ] Navigate to Templates section
   - [ ] Verify no errors related to template loading
   - [ ] Check Network tab: Webhook requests return 200 OK

## 🧪 Real-World Test (Optional but Recommended)

### Upload Real Excel Template

1. **Export Existing Project**
   - [ ] Open existing Clarioo project (with criteria, vendors, comparison matrix)
   - [ ] Click **"Export"** → Download Excel file
   - [ ] Save file as `test-real-template.xlsx`

2. **Upload as Template**
   - [ ] Enter admin mode (passcode: `71956`)
   - [ ] Click **"Upload Template"** button
   - [ ] Select `test-real-template.xlsx`
   - [ ] Wait for processing (parsing + upload)
   - [ ] Verify success toast: "Template uploaded"

3. **Verify Template Card**
   - [ ] Template card appears in list
   - [ ] Project name displayed correctly
   - [ ] Criteria count matches original
   - [ ] Vendor count matches original
   - [ ] Badges show correct features (matrix, battlecards, etc.)

4. **Clone Template to New Project**
   - [ ] Click **"Use This Template"** button
   - [ ] Verify new project created in Projects list
   - [ ] Open new project
   - [ ] Verify all criteria loaded
   - [ ] Verify all vendors loaded
   - [ ] Verify comparison matrix populated (if applicable)

5. **Round-Trip Test** (Ultimate Verification)
   - [ ] Export the cloned project to Excel
   - [ ] Compare with original Excel file
   - [ ] Verify data is identical (project name, criteria, vendors, scores)
   - [ ] **Expected**: Zero data loss in round-trip

## 🐛 Troubleshooting

### Issue: Workflow won't activate

**Symptoms**: Toggle switch bounces back to "Inactive"

**Solutions**:
- [ ] Check that all 4 Data Table nodes have valid Data Table IDs
- [ ] Verify Data Table exists and is named `clarioo_templates`
- [ ] Check n8n error logs for specific error message

### Issue: Template list returns empty array

**Symptoms**: `curl` test returns `{"templates": [], "count": 0}` even after upload

**Solutions**:
- [ ] Verify upload test passed successfully
- [ ] Check n8n Data Table directly - does the row appear?
- [ ] Check n8n execution logs - did "Get All Templates" node execute?
- [ ] Verify Data Table ID in "Get All Templates" node matches your table

### Issue: Frontend shows "Failed to load templates"

**Symptoms**: Templates modal shows error message

**Solutions**:
- [ ] Check `.env` file has correct `VITE_TEMPLATE_WEBHOOK_URL`
- [ ] Verify webhook URL ends with `/templates` (no trailing slash)
- [ ] Test webhook URL directly with curl (see Test 1)
- [ ] Check browser DevTools → Network tab for 404 or CORS errors
- [ ] Verify workflow is **Active** in n8n

### Issue: CORS errors in browser console

**Symptoms**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions**:
- [ ] Verify Webhook node has CORS headers configured:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- [ ] Re-save and re-activate workflow in n8n

### Issue: Upload fails with "Missing required field"

**Symptoms**: Upload returns `{"success": false, "error": "Missing required field: template_id"}`

**Solutions**:
- [ ] Verify frontend is sending all 18 required fields
- [ ] Check `src/services/templateService.ts` → `uploadTemplateWithJSON` function
- [ ] Verify `excelImportService.ts` is parsing all Excel tabs correctly
- [ ] Test with curl command (Test 2) to isolate frontend vs backend issue

## 📊 Success Criteria

Deployment is successful when ALL of these are true:

- [ ] ✅ n8n Data Table `clarioo_templates` exists with correct schema
- [ ] ✅ n8n Workflow active and responding to all 4 actions
- [ ] ✅ Frontend loads templates from n8n without errors
- [ ] ✅ Admin mode toggle works (passcode: 71956)
- [ ] ✅ Upload button appears in admin mode
- [ ] ✅ Real Excel file can be uploaded as template
- [ ] ✅ Template card displays correctly with all metadata
- [ ] ✅ Template can be cloned to new project
- [ ] ✅ Round-trip test passes (Export → Upload → Clone → Export = identical)

## 📚 Reference Documentation

- **Schema Design**: `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/DATATABLE_SCHEMA_EXPLANATION_v3.md`
- **Webhook Config**: `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/N8N_WEBHOOK_CONFIGURATION_v3.md`
- **Sprint Plan**: `00_IMPLEMENTATION/SPRINTS/SP_029_Excel_Template_Upload.md`
- **n8n Workflow**: `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/Clarioo_Template_Manager_Upload_JSON_v3.json`
- **CSV Schema**: `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/clarioo_templates_schema_v3.csv`
- **Deployment Checklist**: `00_IMPLEMENTATION/MIGRATING_TO_N8N/TEMPLATE_MANAGER_WORKFLOWS/DEPLOYMENT_CHECKLIST_v3.md`

## 🎉 Post-Deployment

Once all tests pass:

1. **Update Documentation**
   - [ ] Mark SP_029 as **100% Complete** in `PROGRESS.md`
   - [ ] Update `PROJECT_ROADMAP.md` with completion date
   - [ ] Add deployment notes to `SP_029_Excel_Template_Upload.md`

2. **Clean Up**
   - [ ] Delete test templates from n8n Data Table (if any remain)
   - [ ] Remove test project from frontend (if created)

3. **Production Readiness**
   - [ ] Consider adding API key authentication (see N8N_WEBHOOK_CONFIGURATION.md security section)
   - [ ] Set up monitoring/alerts for workflow failures
   - [ ] Document webhook URL in team wiki/knowledge base

## ⏱️ Estimated Time Breakdown

- Step 1 (Create Data Table): **5 minutes**
- Step 2 (Import Workflow): **5 minutes**
- Step 3 (Activate & Get URL): **2 minutes**
- Step 4 (Update .env): **2 minutes**
- Step 5 (Testing): **5-10 minutes**
- **Total**: **19-24 minutes**

## 🚨 Critical Notes

1. **Data Table ID**: Must be updated in exactly 4 nodes - do not skip any
2. **Webhook URL**: Must match exactly in `.env` file (no trailing slash)
3. **CORS Headers**: Must be present in Webhook node for browser requests
4. **Passcode**: Admin mode passcode is `71956` (hardcoded in frontend)
5. **Zero Transformation**: Workflow expects pre-parsed JSON - do not modify JSON in n8n

---

**Created**: 2026-01-15
**Sprint**: SP_029
**Completion Status**: Ready for Deployment (95% Complete)
**Next Sprint**: SP_030 (TBD - possibly testing automation or additional template features)
