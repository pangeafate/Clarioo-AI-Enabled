# SP_028 MVP Implementation Guide
**Template Management n8n Migration - Phase 1**
**Created:** 2026-01-14

## 📋 Overview

This guide outlines the complete implementation of SP_028 Phase 1 (MVP), which enables template management through n8n Data Tables with admin controls.

**Scope:** Templates with Tabs 0-2 only (INDEX, Criteria, Vendors)
**Future:** Phase 2 will add full 7-tab support (all Excel data)

---

## ✅ Completed Frontend Components

### 1. **AdminModeToggle Component**
- **Location:** `/src/components/admin/AdminModeToggle.tsx`
- **Features:**
  - Passcode protection (71956)
  - localStorage persistence (`clarioo_admin_mode`)
  - Lock/Unlock icons
  - Dialog-based passcode entry
- **Integration:** Added to VendorDiscovery page (bottom)

### 2. **TemplateUploadButton Component**
- **Location:** `/src/components/templates/TemplateUploadButton.tsx`
- **Features:**
  - Excel file upload (.xlsx, .xls)
  - File validation (type, size < 10MB)
  - Upload to n8n via `uploadTemplateExcel()`
  - Loading states and toasts
- **Integration:** Shown in TemplatesModal when admin mode active

### 3. **Updated TemplateCard Component**
- **Location:** `/src/components/templates/TemplateCard.tsx`
- **Changes:**
  - Added delete button (admin only)
  - AlertDialog confirmation before delete
  - Props: `isAdminMode`, `onDelete`

### 4. **Updated TemplatesModal Component**
- **Location:** `/src/components/templates/TemplatesModal.tsx`
- **Changes:**
  - Load templates from n8n on open
  - Fallback to static JSON on error
  - Admin mode state from localStorage
  - Pass admin props to TemplateCard
  - Show TemplateUploadButton when admin

### 5. **Updated templateService.ts**
- **Location:** `/src/services/templateService.ts`
- **New Functions:**
  - `getTemplatesFromN8n(category?)`
  - `uploadTemplateExcel(file, userId, category?)`
  - `deleteTemplate(templateId, userId)`
  - `trackTemplateUsage(templateId, userId, projectId)`
  - `getN8nEndpoint(webhookName)` - mode switcher

### 6. **Updated template.types.ts**
- **Location:** `/src/types/template.types.ts`
- **Changes:**
  - Updated `TemplateCardProps` interface with admin props
  - Maintained Template interface structure

---

## ✅ Completed n8n Infrastructure

### 1. **n8n Workflows (JSON files)**
- **Testing:** `/00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_Template_Manager_TESTING.json`
  - Webhook: `http://localhost:8080/webhook/template-manager-testing`
- **Production:** `/00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_Template_Manager_PRODUCTION.json`
  - Webhook: `https://n8n.lakestrom.com/webhook/template-manager-production`

**Operations:**
1. List Templates (`GET ?action=list&category=optional`)
2. Get Template (`GET ?action=get&template_id=X`)
3. Upload Template (`POST action=upload` with Excel file)
4. Delete Template (`DELETE action=delete` with template_id)
5. Track Usage (`POST action=track_usage`)

**Features:**
- CORS headers on all responses
- Input validation
- Error handling with structured responses
- Based on existing Summarize Criterion Row pattern

### 2. **Data Tables Schema Documentation**
- **File:** `/00_IMPLEMENTATION/MIGRATING_TO_N8N/SETUP_DATA_TABLES.md`
- **Tables:**
  - `clarioo_templates` (13 columns)
  - `clarioo_template_usage` (5 columns)
- **Includes:**
  - Step-by-step setup instructions
  - JSON schema definitions
  - Testing procedures
  - Troubleshooting guide

### 3. **Workflow Documentation**
- **File:** `/00_IMPLEMENTATION/MIGRATING_TO_N8N/README_TEMPLATE_MANAGER.md`
- **Contents:**
  - API reference for all 5 operations
  - curl examples for testing
  - Deployment instructions
  - Error handling patterns

### 4. **Migration Script**
- **File:** `/00_IMPLEMENTATION/MIGRATING_TO_N8N/migrate_templates.js`
- **Purpose:** Migrate 5 existing templates from JSON to n8n
- **Output:**
  - SQL INSERT statements
  - JSON export file for n8n import
- **Usage:** `node migrate_templates.js [testing|production]`

---

## 🔧 Manual Steps Required (n8n Setup)

The following steps must be completed manually in the n8n interface:

### Step 1: Create Data Tables
Follow instructions in `/00_IMPLEMENTATION/MIGRATING_TO_N8N/SETUP_DATA_TABLES.md`

1. Log into n8n at https://n8n.lakestrom.com
2. Navigate to Data Tables
3. Create `clarioo_templates` table (13 columns)
4. Create `clarioo_template_usage` table (5 columns)
5. Verify column configuration

**Estimated time:** 15 minutes

### Step 2: Import n8n Workflows
1. Open n8n workflow editor
2. Click "Import from File"
3. Import `Clarioo_Template_Manager_TESTING.json`
4. Import `Clarioo_Template_Manager_PRODUCTION.json`
5. Activate both workflows

**Estimated time:** 5 minutes

### Step 3: Connect Workflows to Data Tables
For each workflow node that interacts with Data Tables:

**List Templates Operation:**
- Replace placeholder response with "Query Data Table" node
- Table: `clarioo_templates`
- Query: `SELECT * FROM clarioo_templates WHERE is_active = true`
- Optional filter: `AND category = {{ $json.query.category }}`

**Get Template Operation:**
- Replace placeholder with "Get Row" node
- Table: `clarioo_templates`
- Filter: `template_id = {{ $json.query.template_id }}`

**Upload Template Operation:**
- Add "Spreadsheet File" node to parse Excel
- Add "Code" node to extract tabs 0-2
- Add "Insert Row" node to save to `clarioo_templates`

**Delete Template Operation:**
- Replace placeholder with "Update Row" node
- Table: `clarioo_templates`
- Filter: `template_id = {{ $json.body.template_id }}`
- Set: `is_active = false`

**Track Usage Operation:**
- Replace placeholder with "Insert Row" node
- Table: `clarioo_template_usage`

**Estimated time:** 30 minutes

### Step 4: Implement Excel Parser (Tabs 0-2)
Add nodes to parse Excel file in Upload operation:

```
[Webhook] → [Spreadsheet File] → [Code: Extract Tabs] → [Code: Validate] → [Insert Row] → [Response]
```

**Code node logic:**
```javascript
// Extract INDEX tab (Tab 0)
const indexData = $input.item.json.sheets['0. INDEX'];

// Extract Criteria tab (Tab 1)
const criteriaData = $input.item.json.sheets['1. Criteria'];

// Extract Vendors tab (Tab 2)
const vendorsData = $input.item.json.sheets['2. Vendors'];

// Map to template format
const template = {
  template_id: indexData.template_id,
  category: indexData.category,
  company_type: indexData.company_type,
  company_details: indexData.company_details,
  current_tool: indexData.current_tool,
  pain_quote: indexData.pain_quote,
  looking_for: indexData.looking_for,
  criteria: criteriaData.map(row => ({
    id: row.id,
    name: row.name,
    explanation: row.explanation,
    importance: row.importance,
    type: row.type
  })),
  vendors: vendorsData.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    website: row.website,
    pricing: row.pricing,
    rating: row.rating
  })),
  uploaded_by: $json.body.user_id,
  is_active: true
};

return { template };
```

**Estimated time:** 45 minutes

### Step 5: Run Migration Script
After Data Tables and workflows are ready:

1. Open terminal in `/00_IMPLEMENTATION/MIGRATING_TO_N8N/`
2. Run: `node migrate_templates.js testing`
3. Copy SQL statements or import JSON file
4. Insert templates into `clarioo_templates` table

**Verification:**
```bash
curl "http://localhost:8080/webhook/template-manager-testing?action=list" | jq '.templates | length'
# Expected: 5
```

**Estimated time:** 10 minutes

---

## 🧪 Testing Checklist

### Frontend Testing

#### 1. Admin Mode Toggle
- [ ] Navigate to VendorDiscovery page
- [ ] Admin toggle appears at bottom
- [ ] Click toggle → passcode dialog opens
- [ ] Enter wrong code → error toast
- [ ] Enter correct code (71956) → admin mode activates
- [ ] Toggle off → admin mode deactivates
- [ ] Refresh page → admin state persists (localStorage)

#### 2. Template Upload (Admin Only)
- [ ] Enable admin mode
- [ ] Open TemplatesModal (landing page button)
- [ ] Upload button visible in header
- [ ] Click upload → file input opens
- [ ] Select .xlsx file → upload starts
- [ ] Wait for success toast
- [ ] Templates list refreshes with new template
- [ ] Try uploading .txt file → validation error
- [ ] Try uploading 15MB file → size error

#### 3. Template Delete (Admin Only)
- [ ] Admin mode enabled
- [ ] Open TemplatesModal
- [ ] Delete button (trash icon) visible on each card
- [ ] Click delete → confirmation dialog opens
- [ ] Click cancel → nothing happens
- [ ] Click delete again → confirm → deletion toast
- [ ] Template disappears from list
- [ ] Verify in n8n: `is_active = false`

#### 4. Template Browse (All Users)
- [ ] Open TemplatesModal without admin mode
- [ ] All active templates visible
- [ ] Category filters work
- [ ] Click template card → criteria preview opens
- [ ] Click "Use These Criteria" → email check
- [ ] After email → project created with criteria
- [ ] No upload or delete buttons visible

### Backend Testing (n8n)

#### 1. List Templates
```bash
# Testing
curl "http://localhost:8080/webhook/template-manager-testing?action=list" | jq

# Production
curl "https://n8n.lakestrom.com/webhook/template-manager-production?action=list" | jq

# Expected: { success: true, templates: [...] }
```

#### 2. Get Single Template
```bash
curl "http://localhost:8080/webhook/template-manager-testing?action=get&template_id=template_001" | jq

# Expected: { success: true, template: {...} }
```

#### 3. Upload Template
```bash
curl -X POST \
  -F "action=upload" \
  -F "excel_file=@template.xlsx" \
  -F "user_id=test_user" \
  http://localhost:8080/webhook/template-manager-testing

# Expected: { success: true, template_id: "template_006" }
```

#### 4. Delete Template
```bash
curl -X DELETE \
  -H "Content-Type: application/json" \
  -d '{"action":"delete","template_id":"template_006","user_id":"admin"}' \
  http://localhost:8080/webhook/template-manager-testing

# Expected: { success: true }
```

#### 5. Track Usage
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"track_usage","template_id":"template_001","user_id":"user_123","project_id":"proj_456"}' \
  http://localhost:8080/webhook/template-manager-testing

# Expected: { success: true }
```

### Integration Testing

#### End-to-End Flow
1. **Admin uploads new template:**
   - Enable admin mode (passcode: 71956)
   - Open TemplatesModal
   - Click "Upload Template Excel"
   - Select Excel file with tabs 0-2
   - Wait for success toast
   - Verify template appears in grid

2. **Regular user uses template:**
   - Disable admin mode (or use incognito)
   - Open TemplatesModal
   - Browse templates by category
   - Click template card → preview opens
   - Click "Use These Criteria"
   - (If no email) Submit email
   - Project created with criteria loaded
   - Navigate to Criteria Builder
   - Verify all criteria from template are loaded

3. **Admin deletes template:**
   - Enable admin mode
   - Open TemplatesModal
   - Find template to delete
   - Click trash icon → confirm dialog
   - Confirm deletion
   - Template disappears from list
   - Regular users can no longer see it

4. **Usage tracking:**
   - Check n8n Data Table: `clarioo_template_usage`
   - Verify row created with:
     - template_id
     - user_id
     - project_id
     - used_at timestamp

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  Landing Page   │
│  (User clicks   │
│   Templates)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│              TemplatesModal Opens                   │
│  - Checks localStorage for admin_mode               │
│  - Calls getTemplatesFromN8n()                      │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           templateService.ts                        │
│  - getN8nEndpoint('template-manager')               │
│  - Mode: testing or production                      │
│  - Fetch: webhook?action=list                       │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│          n8n Workflow (Template Manager)            │
│  1. Webhook receives request                        │
│  2. Validate input (action=list)                    │
│  3. Query clarioo_templates (is_active=true)        │
│  4. Return JSON: { success: true, templates: [...] }│
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           TemplatesModal Renders                    │
│  - Display template cards                           │
│  - If admin: Show upload button & delete buttons    │
│  - User clicks template → CriteriaPreviewModal      │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│      User Clicks "Use These Criteria"               │
│  - Check hasSubmittedEmail()                        │
│  - If no: EmailCollectionModal                      │
│  - If yes: createProjectFromTemplate()              │
│  - Call trackTemplateUsage()                        │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│         Project Created + Toast Shown               │
│  - Criteria loaded from template                    │
│  - User redirected to VendorDiscovery               │
│  - Usage tracked in clarioo_template_usage          │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### Admin Mode Protection
- **Passcode:** 71956 (stored in AdminModeToggle.tsx)
- **Storage:** localStorage (`clarioo_admin_mode`)
- **Scope:** Client-side only (no server validation)
- **Recommendation:** Add server-side admin validation in Phase 2

### Template Upload Validation
- **Client-side:**
  - File type: .xlsx, .xls only
  - File size: < 10MB
- **Server-side (n8n):**
  - Excel structure validation
  - Required fields check
  - SQL injection prevention (parameterized queries)

### Soft Delete Pattern
- Templates never permanently deleted
- `is_active = false` allows recovery
- Admin can manually restore via n8n UI

---

## 🚀 Deployment Steps

### Development Environment (Testing Mode)
1. Set webhook mode: `localStorage.setItem('clarioo_webhook_mode', 'testing')`
2. Ensure n8n running locally: `http://localhost:8080`
3. Import testing workflow
4. Create Data Tables
5. Run migration script with `testing` mode

### Production Environment
1. Set webhook mode: `localStorage.setItem('clarioo_webhook_mode', 'production')`
2. Import production workflow to n8n.lakestrom.com
3. Verify CORS headers in workflow
4. Run migration script with `production` mode
5. Test all endpoints with production webhook URL

---

## 📚 Files Modified/Created

### Frontend Components (7 files)
1. `/src/components/admin/AdminModeToggle.tsx` ✨ NEW
2. `/src/components/templates/TemplateUploadButton.tsx` ✨ NEW
3. `/src/components/templates/TemplateCard.tsx` ✏️ UPDATED
4. `/src/components/templates/TemplatesModal.tsx` ✏️ UPDATED
5. `/src/components/VendorDiscovery.tsx` ✏️ UPDATED
6. `/src/services/templateService.ts` ✏️ UPDATED
7. `/src/types/template.types.ts` ✏️ UPDATED

### n8n Infrastructure (5 files)
1. `/00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_Template_Manager_TESTING.json` ✨ NEW
2. `/00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_Template_Manager_PRODUCTION.json` ✨ NEW
3. `/00_IMPLEMENTATION/MIGRATING_TO_N8N/README_TEMPLATE_MANAGER.md` ✨ NEW
4. `/00_IMPLEMENTATION/MIGRATING_TO_N8N/SETUP_DATA_TABLES.md` ✨ NEW
5. `/00_IMPLEMENTATION/MIGRATING_TO_N8N/migrate_templates.js` ✨ NEW
6. `/00_IMPLEMENTATION/MIGRATING_TO_N8N/MVP_IMPLEMENTATION_GUIDE.md` ✨ NEW (this file)

---

## 🎯 Next Steps (Phase 2)

After MVP is tested and deployed:

1. **Full 7-Tab Support:**
   - Parse all Excel tabs (0-6)
   - Store complete project snapshots
   - Update Template interface

2. **Enhanced Admin Features:**
   - Server-side admin validation
   - Template editing (not just upload/delete)
   - Template versioning
   - Template analytics (usage stats)

3. **Template Discovery:**
   - Search templates by keyword
   - Sort by popularity, date, category
   - Featured templates section

4. **Template Sharing:**
   - Public vs private templates
   - Share templates between organizations
   - Template marketplace

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** "Failed to load templates" toast
- **Cause:** n8n workflow not activated or Data Tables empty
- **Fix:** Check n8n workflow status, verify Data Tables have data

**Issue:** Upload fails with "Invalid file type"
- **Cause:** File is not .xlsx or .xls
- **Fix:** Convert file to Excel format, ensure extension is correct

**Issue:** Admin mode doesn't persist after refresh
- **Cause:** localStorage not working (private browsing mode?)
- **Fix:** Use regular browser window, check browser settings

**Issue:** Templates don't appear after migration
- **Cause:** Migration script didn't run or n8n import failed
- **Fix:** Check n8n Data Tables manually, re-run migration

---

## ✅ Definition of Done

SP_028 MVP is considered complete when:

- [x] All frontend components created/updated
- [x] All n8n workflows designed (JSON files)
- [x] Data Tables schema documented
- [x] Migration script created
- [ ] Data Tables created in n8n (MANUAL)
- [ ] Workflows imported and activated (MANUAL)
- [ ] Excel parser implemented in workflow (MANUAL)
- [ ] Migration script executed (MANUAL)
- [ ] All testing checklist items pass (MANUAL)
- [ ] Documentation reviewed and approved

**Status:** Ready for manual n8n setup and testing

---

**Last Updated:** 2026-01-14
**Author:** Claude (SP_028 Implementation)
