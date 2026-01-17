# Fixed Transform Excel Data Node Code v4 FINAL

## The Issue

When Parse Excel File node outputs data, it creates **multiple items** - one per sheet:
- `items[0].json` = INDEX sheet data (array of row objects)
- `items[1].json` = Criteria sheet data (array of row objects)
- `items[2].json` = Vendors sheet data (array of row objects)

The v3 code incorrectly tried to access `sheetData[0].json` when `sheetData = items`, which means it was trying to access `items[0].json` - that part was correct, but the logic for accessing sheets was wrong.

## Replace the Transform Excel Data node code with this:

```javascript
// Parse Excel data - handles Spreadsheet File node output (one item per sheet)
const userId = $node["Extract File"].json.user_id || 'unknown';

// Spreadsheet File node outputs multiple items - one per sheet
// items[0].json = INDEX sheet (array of objects)
// items[1].json = Criteria sheet (array of objects)
// items[2].json = Vendors sheet (array of objects)

if (!items || items.length === 0) {
  throw new Error('Could not parse Excel file. No sheets found.');
}

// Tab 0: INDEX - Extract metadata
const indexSheet = items[0].json;

if (!indexSheet || !Array.isArray(indexSheet)) {
  throw new Error(`INDEX tab invalid. Got type: ${typeof indexSheet}, isArray: ${Array.isArray(indexSheet)}, items length: ${items.length}`);
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
const criteriaSheet = items.length > 1 ? items[1].json : null;
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
const vendorsSheet = items.length > 2 ? items[2].json : null;
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

## Key Changes from v3:

1. **Removed nested access**: Changed from `sheetData[0].json` to `items[0].json`
2. **Direct sheet access**:
   - INDEX: `items[0].json`
   - Criteria: `items[1].json`
   - Vendors: `items[2].json`
3. **Better error message**: Shows actual data type and structure when INDEX fails
4. **Safer checks**: Uses `items.length > N` before accessing `items[N]`

## Why This Works:

The Spreadsheet File node outputs:
- **One item per sheet** in the items array
- Each `items[N].json` contains that sheet's data as an array of row objects
- Each row object has keys like `CLARIOO`, `__EMPTY`, `__EMPTY_1`, etc.

## Testing:

After applying this fix, test with:
```bash
cd "/Users/sergeypodolskiy/CODEBASE/25 10 24 Clarioo Copy AI Migration v260108WIP/00_IMPLEMENTATION/WIP"
curl -X POST "https://n8n.lakestrom.com/webhook/template-manager?action=upload" \
  -F "file=@LoyaltyMan_Clarioo_Test.xlsx" \
  -F "user_id=test_v4_final"
```

Expected: Should extract Project Name from "Project Name:" row and parse all criteria/vendors correctly.
