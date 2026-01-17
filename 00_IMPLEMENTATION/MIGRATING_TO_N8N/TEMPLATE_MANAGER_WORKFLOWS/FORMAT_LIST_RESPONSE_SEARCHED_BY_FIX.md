# Format List Response - Map searched_by Column

## Issue
The frontend "SEARCHED BY" label should display data from the `searched_by` column in the data table, not from `project_description`.

Current mapping:
- `project_description` → `projectDescription` (used for "SEARCHED BY" display) ❌
- `searched_by` → not mapped ❌

Desired mapping:
- `project_name` → `projectName` (template title)
- `searched_by` → `searchedBy` (for "SEARCHED BY" display) ✅
- `project_description` → `projectDescription` (for other uses)

## Solution

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

    // Map database columns to frontend fields
    projectName: template.project_name || template.looking_for || '',
    searchedBy: template.searched_by || '',                                // ✅ NEW: Map searched_by column to searchedBy field
    projectDescription: template.project_description || '',
    softwareCategory: template.software_category || '',

    keyFeatures: template.key_features,
    clientQuote: template.client_quote,
    currentTool: template.current_tool,

    // Parse JSON fields
    criteria: typeof template.criteria === 'string' ? JSON.parse(template.criteria) : (template.criteria || []),
    vendors: typeof template.vendors === 'string' ? JSON.parse(template.vendors) : (template.vendors || []),
    comparisonMatrix: typeof template.comparison_matrix === 'string' ? JSON.parse(template.comparison_matrix) : (template.comparison_matrix || {}),
    detailedMatching: typeof template.detailed_matching === 'string' ? JSON.parse(template.detailed_matching) : (template.detailed_matching || {}),
    battlecards: typeof template.battlecards === 'string' ? JSON.parse(template.battlecards) : (template.battlecards || []),
    executiveSummary: typeof template.executive_summary === 'string' ? JSON.parse(template.executive_summary) : (template.summary_data ? (typeof template.summary_data === 'string' ? JSON.parse(template.summary_data) : template.summary_data) : {}),
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

## Changes Made

1. **Added `searchedBy` field**: Maps from `template.searched_by` column
2. **Kept `projectDescription`**: Still maps from `template.project_description` column
3. **Both fields available**: Frontend can use either field

## Apply This Fix

1. Open n8n workflow: "Clarioo Template Manager - LIST & CREATE (TESTING)"
2. Click on "Format List Response" node
3. Replace the entire code with the code above
4. Click "Save"
5. Test the workflow

## Test Command

```bash
curl -s -X POST "https://n8n.lakestrom.com/webhook/template-manager?action=list" | jq '.templates[0] | {projectName, searchedBy, projectDescription}'
```

Expected output:
```json
{
  "projectName": "Customer experience platform. Advanced clienteling...",
  "searchedBy": "Luxury Fashion Retailer – 30+ boutiques",
  "projectDescription": "..."
}
```
