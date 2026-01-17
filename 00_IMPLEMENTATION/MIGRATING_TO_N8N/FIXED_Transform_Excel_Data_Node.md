# Fixed Transform Excel Data Node Code

The Spreadsheet File node returns data in a different format than expected. Here's the corrected code:

```javascript
// Parse Excel data from Spreadsheet File node output
// The node returns sheets in items array or in json format

const userId = $node["Extract File"].json.user_id || 'unknown';

// The Spreadsheet File node can return data in different formats
// Let's check what we have
let sheetData;

// Check if data is in items[0].json directly (flat structure)
if (items[0].json && typeof items[0].json === 'object') {
  // Check if it's already parsed sheet data
  if (Array.isArray(items[0].json)) {
    sheetData = items[0].json;
  } else if (items[0].json.data && Array.isArray(items[0].json.data)) {
    sheetData = items[0].json.data;
  } else {
    // Try to extract sheets from the JSON
    // Spreadsheet File node might return sheets as separate properties
    const sheets = [];
    for (let i = 0; i < 10; i++) {
      const sheetKey = `Sheet${i}`;
      if (items[0].json[sheetKey]) {
        sheets.push(items[0].json[sheetKey]);
      }
    }
    if (sheets.length > 0) {
      sheetData = sheets;
    }
  }
}

// If still no data, try to collect from multiple items (each sheet as an item)
if (!sheetData && items.length > 0) {
  sheetData = items.map(item => item.json);
}

if (!sheetData || sheetData.length === 0) {
  throw new Error('Could not parse Excel file. Please check the file format.');
}

// Now sheetData should be an array where each element is a sheet (array of rows)
// Tab 0: INDEX - Extract metadata
const indexTab = sheetData[0];
if (!indexTab || indexTab.length < 2) {
  throw new Error('INDEX tab is missing or invalid. Expected at least 2 rows.');
}

const indexData = {};
for (let i = 1; i < indexTab.length; i++) {
  const row = indexTab[i];
  if (row && row.length >= 2) {
    const key = String(row[0]).trim();
    const value = row[1];
    if (key) {
      indexData[key] = value;
    }
  }
}

const templateId = 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
const templateCategory = (indexData['Category'] || indexData['category'] || 'UNCATEGORIZED').toUpperCase();
const searchedBy = indexData['Searched By'] || indexData['searched_by'] || '';
const lookingFor = indexData['Looking For'] || indexData['looking_for'] || '';
let keyFeatures = indexData['Key Features'] || indexData['key_features'] || '';
const clientQuote = indexData['Client Quote'] || indexData['client_quote'] || null;
const currentTool = indexData['Current Tool'] || indexData['current_tool'] || null;

// Tab 1: Criteria
const criteriaTab = sheetData[1];
const criteria = [];

if (criteriaTab && criteriaTab.length > 1) {
  for (let i = 1; i < criteriaTab.length; i++) {
    const row = criteriaTab[i];
    if (row && row[0]) {
      criteria.push({
        id: 'crit_' + String(i).padStart(3, '0'),
        name: row[0] || '',
        importance: row[1] || 'Medium',
        explanation: row[2] || '',
        type: row[3] || 'feature',
        isArchived: false
      });
    }
  }
}

if (!keyFeatures && criteria.length > 0) {
  keyFeatures = criteria.slice(0, 4).map(c => c.name).join(', ');
}

// Tab 2: Vendors
const vendorsTab = sheetData[2];
const vendors = [];

if (vendorsTab && vendorsTab.length > 1) {
  for (let i = 1; i < vendorsTab.length; i++) {
    const row = vendorsTab[i];
    if (row && row[0]) {
      vendors.push({
        name: row[0] || '',
        website: row[1] || '',
        description: row[2] || ''
      });
    }
  }
}

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

## What Changed:
1. Added multiple ways to extract sheet data from the Spreadsheet File node output
2. Better error messages that show what's actually wrong
3. More flexible parsing that handles different output formats

## Steps:
1. Open the workflow in n8n
2. Click on **"Transform Excel Data"** node
3. Replace the entire JavaScript code with the above
4. Click **Save**
5. Test upload again
