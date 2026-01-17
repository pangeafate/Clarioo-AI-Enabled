# Fixed Transform Excel Data Node v5 - Row Format

## The Actual Data Structure

The Parse Excel File node outputs **one item per row** (not per sheet):
- `items[0].json` = Row 1: `{ "CLARIOO": "Software Discovery & Selection Co-pilot" }`
- `items[1].json` = Row 2: `{ "CLARIOO": "PROJECT REPORT" }`
- `items[2].json` = Row 3: `{ "CLARIOO": "Project Name:", "__EMPTY": "Loyalty Management Platform Evaluation" }`
- ... (24 rows total from INDEX sheet only)

## Issue: Only INDEX Sheet is Being Read

Currently the Parse Excel File node is only reading the first sheet (INDEX). We need to:
1. Parse the INDEX sheet rows for metadata (this fix)
2. Configure Parse Excel to read ALL sheets (next step)

## Replace Transform Excel Data code with this:

```javascript
// Parse Excel data - Parse Excel File outputs one item per row
// Currently only getting INDEX sheet rows
const userId = $node["Extract File"].json.user_id || 'unknown';

if (!items || items.length === 0) {
  throw new Error('No Excel data received');
}

// Parse INDEX sheet rows - each item is one row object
const indexData = {};

for (const item of items) {
  const row = item.json;

  // Look for key-value pairs in CLARIOO and __EMPTY columns
  const key = row.CLARIOO || '';
  const value = row.__EMPTY || '';

  if (key && typeof key === 'string' && key.trim() !== '') {
    const cleanKey = key.trim().replace(/:$/, ''); // Remove trailing colon

    // Only store if there's a value in __EMPTY column
    if (value && value !== '') {
      indexData[cleanKey] = value;
    }
  }
}

// Extract template metadata from parsed INDEX data
const templateId = 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

const templateCategory = (
  indexData['Category'] ||
  indexData['Software Category'] ||
  indexData['Type'] ||
  'UNCATEGORIZED'
).toUpperCase();

const searchedBy =
  indexData['Searched By'] ||
  indexData['Company'] ||
  indexData['Client'] ||
  indexData['Description'] ||
  '';

const lookingFor =
  indexData['Looking For'] ||
  indexData['Project Name'] ||
  indexData['Objective'] ||
  '';

const keyFeatures =
  indexData['Key Features'] ||
  indexData['Features'] ||
  '';

const clientQuote =
  indexData['Client Quote'] ||
  indexData['Quote'] ||
  null;

const currentTool =
  indexData['Current Tool'] ||
  indexData['Existing Solution'] ||
  null;

// NOTE: Criteria and Vendors will be empty until we configure Parse Excel
// to read multiple sheets. For now, we only have INDEX sheet data.
const criteria = [];
const vendors = [];

// Return formatted template
return [{
  json: {
    template_id: templateId,
    template_category: templateCategory,
    searched_by: searchedBy,
    looking_for: lookingFor,
    key_features: keyFeatures,
    client_quote: clientQuote,
    current_tool: currentTool,
    criteria: JSON.stringify(criteria),
    vendors: JSON.stringify(vendors),
    comparison_matrix: JSON.stringify({}),
    battlecards: JSON.stringify({}),
    positioning_data: JSON.stringify({}),
    summary_data: JSON.stringify({}),
    uploaded_by: userId,
    is_active: true,
    created_at: new Date().toISOString()
  }
}];
```

## What This Does:

1. ✅ Parses the INDEX sheet rows correctly
2. ✅ Extracts Project Name, Description, etc.
3. ✅ Will create template with proper metadata
4. ⚠️ Criteria and Vendors will be empty arrays (only INDEX sheet available)

## Expected Result After This Fix:

```json
{
  "template_category": "UNCATEGORIZED" (or actual category if found),
  "searched_by": "As a small company in Denmark...",
  "looking_for": "Loyalty Management Platform Evaluation",
  "criteria": [],
  "vendors": []
}
```

## Next Step - Read All Sheets:

After verifying this works, we need to configure the **Parse Excel File** node to read ALL sheets.

**In the Parse Excel File node settings:**
1. Click on "Add Option"
2. Look for "Sheet Name" or "Read All Sheets" option
3. Enable reading multiple sheets

OR we might need to:
1. Add a Loop node to process each sheet separately
2. Or use a different approach to read multi-sheet Excel files

But first, let's verify this v5 code correctly extracts the INDEX metadata.
