# Format List Response Node - Fixed for Hybrid Schema

## Issue
The data table has these columns:
- `looking_for` (old) → needs to map to `projectName` (new)
- `searched_by` (added) → needs to map to `projectDescription` (new)

Frontend expects:
- `projectName`
- `projectDescription`

## Solution: Map Old Column Names to New Field Names

Replace the "Format List Response" node code with this:

```javascript
// Filter active templates and format response
const allTemplates = items;

let activeTemplates = allTemplates.filter(item => item.json.is_active === true);

const templates = activeTemplates.map(item => {
  const template = item.json;

  return {
    templateId: template.template_id,
    templateCategory: template.template_category,

    // Map old column names to new field names
    projectName: template.project_name || template.looking_for,           // ✅ NEW: Try project_name first, fallback to looking_for
    projectDescription: template.project_description || template.searched_by, // ✅ NEW: Try project_description first, fallback to searched_by
    softwareCategory: template.software_category || '',                   // ✅ NEW: Optional field

    keyFeatures: template.key_features,
    clientQuote: template.client_quote,
    currentTool: template.current_tool,

    // Parse JSON fields
    criteria: typeof template.criteria === 'string' ? JSON.parse(template.criteria) : (template.criteria || []),
    vendors: typeof template.vendors === 'string' ? JSON.parse(template.vendors) : (template.vendors || []),
    comparisonMatrix: typeof template.comparison_matrix === 'string' ? JSON.parse(template.comparison_matrix) : (template.comparison_matrix || {}),
    detailedMatching: typeof template.detailed_matching === 'string' ? JSON.parse(template.detailed_matching) : (template.detailed_matching || {}), // ✅ NEW
    battlecards: typeof template.battlecards === 'string' ? JSON.parse(template.battlecards) : (template.battlecards || []),
    executiveSummary: typeof template.executive_summary === 'string' ? JSON.parse(template.executive_summary) : (template.summary_data ? (typeof template.summary_data === 'string' ? JSON.parse(template.summary_data) : template.summary_data) : {}), // ✅ NEW: Try executive_summary first, fallback to summary_data
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

## What This Does

### Backward Compatibility Mappings:
1. **`projectName`**:
   - First tries `project_name` (new)
   - Falls back to `looking_for` (old)

2. **`projectDescription`**:
   - First tries `project_description` (new)
   - Falls back to `searched_by` (old)

3. **`executiveSummary`**:
   - First tries `executive_summary` (new)
   - Falls back to `summary_data` (old)

4. **`softwareCategory`**:
   - Optional new field
   - Returns empty string if not present

5. **`detailedMatching`**:
   - Optional new field
   - Returns empty object if not present

## How to Apply

1. Open n8n workflow: "Clarioo Template Manager - LIST & CREATE (TESTING)"
2. Click on "Format List Response" node
3. Replace the entire code with the code above
4. Click "Save"
5. Test the workflow

## Expected Result

After updating, the frontend should display:
- ✅ Template title (from `looking_for` mapped to `projectName`)
- ✅ "SEARCHED BY:" section (from `searched_by` mapped to `projectDescription`)
- ✅ All other fields work as before

## Test Command

```bash
curl -s -X POST "https://n8n.lakestrom.com/webhook/template-manager?action=list" | jq '.templates[0] | {projectName, projectDescription, templateCategory, keyFeatures}'
```

Expected output:
```json
{
  "projectName": "Customer experience platform. Advanced clienteling...",
  "projectDescription": "Luxury Fashion Retailer – 30+ boutiques",
  "templateCategory": "CX PLATFORM",
  "keyFeatures": "Unified customer profiles, Advanced clienteling..."
}
```

## Migration Path

This code supports **both old and new schemas**:

### Current State (Hybrid):
- Data table has: `looking_for`, `searched_by`, `key_features`, etc.
- Frontend expects: `projectName`, `projectDescription`, `keyFeatures`
- This code maps old → new ✅

### Future State (Full New Schema):
- Data table has: `project_name`, `project_description`, `key_features`, etc.
- Frontend expects: `projectName`, `projectDescription`, `keyFeatures`
- This code still works (tries new names first) ✅

## Verification Checklist

After applying this fix:

- [ ] Open http://localhost:8080
- [ ] Click "Start with a template"
- [ ] Check template cards show:
  - [ ] Template title (not blank)
  - [ ] "SEARCHED BY:" section (not blank)
  - [ ] Key features tags
  - [ ] Client quote
  - [ ] Category tag
- [ ] Check browser Console for no errors
- [ ] Check Network tab shows proper response format
