# Fixed Transform Excel Data Node Code v3

Updated to handle Spreadsheet File node output as array of objects (not 2D array).

## Replace the "Transform Excel Data" node code with this:

```javascript
// Parse Excel data - handles object format from Spreadsheet File node
const userId = $node["Extract File"].json.user_id || 'unknown';

// Extract sheet data - Spreadsheet File node returns array of objects
let sheetData = items;

if (!sheetData || sheetData.length === 0) {
  throw new Error('Could not parse Excel file. No sheets found.');
}

// Tab 0: INDEX - Extract metadata
// Data format: array of objects like { "CLARIOO": "Project Name:", "__EMPTY": "value" }
const indexSheet = sheetData[0].json;

if (!indexSheet || !Array.isArray(indexSheet)) {
  throw new Error('INDEX tab invalid. Expected array of objects.');
}

// Parse INDEX tab - extract key-value pairs
const indexData = {};
for (const row of indexSheet) {
  // Look for rows that have a key in first column and value in second
  const key = row.CLARIOO || row.A || row['0'] || '';
  const value = row.__EMPTY || row.B || row['1'] || '';

  if (key && typeof key === 'string' && key.trim() !== '') {
    const cleanKey = key.trim().replace(/:$/, ''); // Remove trailing colon
    if (value && value !== '') {
      indexData[cleanKey] = value;
    }
  }
}

// Extract template metadata
const templateId = 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Look for common field names in the parsed data
const templateCategory = (
  indexData['Category'] ||
  indexData['category'] ||
  indexData['Template Category'] ||
  indexData['Type'] ||
  indexData['Software Category'] ||
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

let keyFeatures =
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

// Tab 1: Evaluation Criteria
const criteriaSheet = sheetData[1] ? sheetData[1].json : null;
const criteria = [];

if (criteriaSheet && Array.isArray(criteriaSheet)) {
  // Skip header row (first row is usually headers)
  let headerSkipped = false;

  for (const row of criteriaSheet) {
    // Get criterion name from first column
    const criterionName = row.CLARIOO || row.A || row['0'] || row['Criterion'] || row['Name'] || '';

    // Skip header row (usually contains "Criterion" or similar)
    if (!headerSkipped && (
      criterionName.toLowerCase().includes('criterion') ||
      criterionName.toLowerCase().includes('name') ||
      criterionName.toLowerCase().includes('requirement')
    )) {
      headerSkipped = true;
      continue;
    }

    if (criterionName && typeof criterionName === 'string' && criterionName.trim() !== '') {
      const importance = row.__EMPTY || row.B || row['1'] || row['Importance'] || 'Medium';
      const explanation = row.__EMPTY_1 || row.C || row['2'] || row['Explanation'] || '';
      const type = row.__EMPTY_2 || row.D || row['3'] || row['Type'] || 'feature';

      criteria.push({
        id: 'crit_' + String(criteria.length + 1).padStart(3, '0'),
        name: criterionName.trim(),
        importance: importance,
        explanation: explanation,
        type: type,
        isArchived: false
      });
    }
  }
}

// If no key features specified, extract from first 4 criteria
if (!keyFeatures && criteria.length > 0) {
  keyFeatures = criteria.slice(0, 4).map(c => c.name).join(', ');
}

// Tab 2: Vendor List
const vendorsSheet = sheetData[2] ? sheetData[2].json : null;
const vendors = [];

if (vendorsSheet && Array.isArray(vendorsSheet)) {
  let headerSkipped = false;

  for (const row of vendorsSheet) {
    // Get vendor name from first column
    const vendorName = row.CLARIOO || row.A || row['0'] || row['Vendor'] || row['Name'] || '';

    // Skip header row
    if (!headerSkipped && (
      vendorName.toLowerCase().includes('vendor') ||
      vendorName.toLowerCase().includes('name') ||
      vendorName.toLowerCase().includes('company')
    )) {
      headerSkipped = true;
      continue;
    }

    if (vendorName && typeof vendorName === 'string' && vendorName.trim() !== '') {
      const website = row.__EMPTY || row.B || row['1'] || row['Website'] || '';
      const description = row.__EMPTY_1 || row.C || row['2'] || row['Description'] || '';

      vendors.push({
        name: vendorName.trim(),
        website: website,
        description: description
      });
    }
  }
}

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

## Key Changes:

1. **Access data from `items` directly** - Each sheet is in `items[i].json`
2. **Handle object format** - Access columns by name (CLARIOO, __EMPTY) instead of array index
3. **Multiple column name fallbacks** - Tries different column names (A, B, 0, 1, etc.)
4. **Better header detection** - Skips header rows intelligently
5. **Remove trailing colons** - Cleans up keys like "Project Name:"

## Steps:

1. Open the workflow in n8n
2. Click on **"Transform Excel Data"** node
3. Replace the code with the above
4. **Save** the workflow
5. Test upload again
