# Schema Update Implementation Guide

## Overview
This guide walks through updating the template schema from old field names to the new standardized schema for complete template functionality.

---

## Changes Summary

### Field Name Changes
1. ~~`searched_by`~~ → `project_description`
2. ~~`looking_for`~~ → `project_name`
3. ~~`summary_data`~~ → `executive_summary`

### New Fields Added
4. `software_category` - Specific software type (distinct from `template_category`)
5. `detailed_matching` - Enhanced evidence data from detailed matching sheet

### Total Schema
**18 columns** (was 16):
- `template_id`, `template_category`, **`project_name`**, **`project_description`**, **`software_category`**, `key_features`, `client_quote`, `current_tool`, `criteria`, `vendors`, `comparison_matrix`, **`detailed_matching`**, `battlecards`, **`executive_summary`**, `positioning_data`, `uploaded_by`, `is_active`, `created_at`

---

## Step-by-Step Implementation

### Step 1: Update n8n Data Table

**Location:** n8n Cloud → Data Tables → `clarioo_templates`

**Actions:**
1. **Backup existing data** (export to CSV if needed)
2. **Delete old table** (or create new one with different name for testing)
3. **Import new CSV:**
   - File: `clarioo_templates_schema_v2.csv`
   - Column mapping: Auto-detect
   - Verify 18 columns created

**Verification:**
- [ ] 18 columns exist in Data Table
- [ ] Column types are correct (string for most, boolean for `is_active`, datetime for `created_at`)
- [ ] Sample data imported successfully

---

### Step 2: Update TypeScript Interface

**File:** `src/types/template.types.ts`

**Current (OLD):**
```typescript
export interface Template {
  templateId: string;
  templateCategory: string;
  searchedBy: string;        // ❌ OLD
  lookingFor: string;        // ❌ OLD
  keyFeatures: string;
  clientQuote: string | null;
  currentTool: string | null;
  criteria: Criterion[];
  vendors?: any[];
  comparisonMatrix?: any;
  battlecards?: any;
  positioningData?: any;
  summaryData?: any;         // ❌ OLD
}
```

**Updated (NEW):**
```typescript
export interface Template {
  templateId: string;
  templateCategory: string;
  projectName: string;              // ✅ NEW (was lookingFor)
  projectDescription: string;       // ✅ NEW (was searchedBy)
  softwareCategory?: string;        // ✅ NEW (optional)
  keyFeatures: string;
  clientQuote: string | null;
  currentTool: string | null;
  criteria: Criterion[];
  vendors?: any[];
  comparisonMatrix?: any;
  detailedMatching?: any;           // ✅ NEW (optional)
  battlecards?: any;
  executiveSummary?: any;           // ✅ NEW (was summaryData)
  positioningData?: any;
}
```

**Implementation:**
```bash
# Replace the interface in template.types.ts
# Lines 17-31
```

---

### Step 3: Update TemplateCard Component

**File:** `src/components/templates/TemplateCard.tsx`

**Changes Required:**

#### Line 118: Template Title
```typescript
// OLD
<h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">{template.lookingFor}</h3>

// NEW
<h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">{template.projectName}</h3>
```

#### Line 121-125: Searched By Section
```typescript
// OLD
{template.searchedBy && (
  <p className="text-sm text-gray-600 mb-3">
    <span className="font-medium">SEARCHED BY:</span> {template.searchedBy}
  </p>
)}

// NEW
{template.projectDescription && (
  <p className="text-sm text-gray-600 mb-3">
    <span className="font-medium">SEARCHED BY:</span> {template.projectDescription}
  </p>
)}
```

#### Line 176: Delete Dialog
```typescript
// OLD
Are you sure you want to delete "{template.lookingFor}"? This action cannot be undone.

// NEW
Are you sure you want to delete "{template.projectName}"? This action cannot be undone.
```

**Implementation:**
```bash
# Update 3 occurrences of template field references
# Lines 118, 121-125, 176
```

---

### Step 4: Update Format List Response Node (n8n)

**Location:** n8n Workflow → "Format List Response" Code Node

**Current Code Issue:**
The Format List Response node returns field names that don't match the new TypeScript interface.

**Updated Code:**
```javascript
// Filter active templates and format response
const allTemplates = items;

let activeTemplates = allTemplates.filter(item => item.json.is_active === true);

const templates = activeTemplates.map(item => {
  const template = item.json;

  return {
    templateId: template.template_id,
    templateCategory: template.template_category,
    projectName: template.project_name,                    // ✅ NEW
    projectDescription: template.project_description,      // ✅ NEW
    softwareCategory: template.software_category,          // ✅ NEW
    keyFeatures: template.key_features,
    clientQuote: template.client_quote,
    currentTool: template.current_tool,
    criteria: typeof template.criteria === 'string' ? JSON.parse(template.criteria) : (template.criteria || []),
    vendors: typeof template.vendors === 'string' ? JSON.parse(template.vendors) : (template.vendors || []),
    comparisonMatrix: typeof template.comparison_matrix === 'string' ? JSON.parse(template.comparison_matrix) : (template.comparison_matrix || {}),
    detailedMatching: typeof template.detailed_matching === 'string' ? JSON.parse(template.detailed_matching) : (template.detailed_matching || {}), // ✅ NEW
    battlecards: typeof template.battlecards === 'string' ? JSON.parse(template.battlecards) : (template.battlecards || []),
    executiveSummary: typeof template.executive_summary === 'string' ? JSON.parse(template.executive_summary) : (template.executive_summary || {}),  // ✅ NEW
    positioningData: typeof template.positioning_data === 'string' ? JSON.parse(template.positioning_data) : (template.positioning_data || null)
  };
});

return [{
  json: {
    success: true,
    templates: templates,
    count: templates.length
  }
}];
```

**Changes:**
- ✅ Added `projectName` mapping from `template.project_name`
- ✅ Added `projectDescription` mapping from `template.project_description`
- ✅ Added `softwareCategory` mapping from `template.software_category`
- ✅ Added `detailedMatching` parsing
- ✅ Changed `summaryData` to `executiveSummary`

---

### Step 5: Update Transform Excel Data Node (Already Done)

**Status:** ✅ Already updated in v8 complete parsing code

The Transform Excel Data node already outputs the new field names:
- `project_name`
- `project_description`
- `software_category`
- `detailed_matching`
- `executive_summary`

**No changes needed.**

---

### Step 6: Test End-to-End Flow

#### Test 1: Upload Template
```bash
curl -X POST "https://n8n.lakestrom.com/webhook/template-manager?action=upload" \
  -F "file=@LoyaltyMan_Clarioo_TEST2.xlsx" \
  -F "user_id=test_new_schema"
```

**Expected Response:**
```json
{
  "success": true,
  "template_id": "tpl_...",
  "message": "Template uploaded successfully",
  "criteria_count": 17,
  "vendor_count": 5,
  "template_category": "UNCATEGORIZED"
}
```

**Verify in n8n Data Table:**
- [ ] `project_name` populated (not `looking_for`)
- [ ] `project_description` populated (not `searched_by`)
- [ ] `software_category` populated
- [ ] `executive_summary` populated (not `summary_data`)
- [ ] `detailed_matching` populated

#### Test 2: LIST Templates
```bash
curl -X POST "https://n8n.lakestrom.com/webhook/template-manager?action=list"
```

**Verify Response:**
```json
{
  "success": true,
  "templates": [{
    "templateId": "...",
    "templateCategory": "...",
    "projectName": "...",        // ✅ Should be projectName (not lookingFor)
    "projectDescription": "...", // ✅ Should be projectDescription (not searchedBy)
    "softwareCategory": "...",   // ✅ Should exist
    "keyFeatures": "...",
    "clientQuote": "...",
    "criteria": [...],
    "vendors": [...],
    "comparisonMatrix": {...},
    "detailedMatching": {...},   // ✅ Should exist
    "battlecards": [...],
    "executiveSummary": {...},   // ✅ Should be executiveSummary (not summaryData)
    "positioningData": null
  }],
  "count": 1
}
```

#### Test 3: Frontend Display
1. Open app in browser
2. Click "Start with a template" button
3. Verify template cards display:
   - [ ] Category tag shows correctly
   - [ ] Project name as main title
   - [ ] "SEARCHED BY:" shows project description
   - [ ] Key features display as tags
   - [ ] Client quote shows (if present)
   - [ ] Criteria count shows at bottom

#### Test 4: Template Details Modal
1. Click on a template card
2. Verify criteria preview modal:
   - [ ] All criteria display
   - [ ] Template metadata shown correctly
   - [ ] "Use this template" button works

---

## Rollback Plan

If issues occur:

1. **Keep old CSV backup:** `clarioo_templates_schema.csv` (original)
2. **Frontend fallback:** Add backward compatibility in code:
```typescript
// In TemplateCard.tsx
const displayName = template.projectName || template.lookingFor || 'Untitled';
const displayDescription = template.projectDescription || template.searchedBy || '';
```
3. **n8n fallback:** Keep old workflow active, switch webhook path if needed

---

## Migration Checklist

### Pre-Migration
- [ ] Export existing n8n Data Table to CSV (backup)
- [ ] Document current template count
- [ ] Test old workflow one last time

### Migration Steps
- [ ] Delete old n8n Data Table (or rename)
- [ ] Import `clarioo_templates_schema_v2.csv` to create new table
- [ ] Update TypeScript interface (`template.types.ts`)
- [ ] Update TemplateCard component (3 changes)
- [ ] Update Format List Response node in n8n
- [ ] Update workflow to use new Transform Excel Data v8 code
- [ ] Activate updated workflow

### Post-Migration Testing
- [ ] Upload test Excel file
- [ ] Verify Data Table columns populated
- [ ] Test LIST operation
- [ ] Test frontend display
- [ ] Test template details modal
- [ ] Test project cloning (if implemented)

### Verification
- [ ] All templates display correctly
- [ ] No console errors in browser
- [ ] No errors in n8n workflow
- [ ] Template count matches pre-migration

---

## Expected Outcome

After successful migration:
- ✅ Templates use semantic field names (`projectName` instead of `lookingFor`)
- ✅ Complete data for project cloning (all 7 sheets parsed)
- ✅ UI displays templates correctly with new schema
- ✅ Upload workflow parses all Excel data into proper format
- ✅ Ready for implementing "Clone as Project" functionality

---

## Next Steps After Migration

1. **Implement Project Cloning Function**
   - Create `cloneTemplateAsProject()` function
   - Populate all localStorage keys from template data
   - Test cloned project functionality

2. **Add Template Management Features**
   - Edit template functionality
   - Delete template (already has UI)
   - Template versioning

3. **Enhance Template Display**
   - Add vendor count to card
   - Show match percentages
   - Preview comparison matrix data

---

## Support & Troubleshooting

### Common Issues

**Issue:** "Unknown column name 'project_name'" error
- **Cause:** Data Table still has old schema
- **Fix:** Rebuild Data Table with new CSV

**Issue:** Templates not displaying in UI
- **Cause:** Field name mismatch between API and TypeScript
- **Fix:** Verify Format List Response node returns correct field names

**Issue:** Upload works but data missing
- **Cause:** Transform Excel Data not outputting all fields
- **Fix:** Verify v8 complete parsing code is in Transform node

**Issue:** Frontend shows "undefined" for template names
- **Cause:** TemplateCard still uses old field names
- **Fix:** Update template.lookingFor to template.projectName

---

## Files Modified

1. **CSV Schema:** `clarioo_templates_schema_v2.csv` (NEW)
2. **TypeScript:** `src/types/template.types.ts` (3 fields renamed, 2 added)
3. **Component:** `src/components/templates/TemplateCard.tsx` (3 occurrences)
4. **n8n Workflow:** Format List Response node code (field mappings)
5. **Documentation:** This guide + `TEMPLATE_DATA_REQUIREMENTS_CHECKLIST.md`

---

## Summary

This migration standardizes template field names, adds missing fields for complete project cloning, and ensures consistency between backend (n8n) and frontend (React) schemas.

**Key Benefits:**
- Semantic field names (projectName vs lookingFor)
- Complete data for project cloning
- Consistent with project localStorage structure
- Ready for advanced template features
