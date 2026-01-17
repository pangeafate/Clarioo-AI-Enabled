# Transform Excel Data v7 - Append Mode (All 7 Sheets)

## How It Works

When using **Merge mode: Append**, all rows from all 7 sheets are combined into one array. We can identify which sheet each row belongs to by checking which column exists:

- `CLARIOO` column → INDEX sheet
- `EVALUATION CRITERIA` column → Criteria sheet
- `SHORTLISTED VENDORS` column → Vendors sheet
- `CRITERIA VS VENDORS` column → Comparison Matrix sheet
- `VENDORS' DETAILED CRITERIA MATCHING` column → Detailed Matching sheet
- `VENDOR BATTLECARDS` column → Battlecards sheet
- `PRE-DEMO BRIEF` column → Pre-Demo Brief sheet

## Transform Excel Data Code

Replace the Transform Excel Data node code with this:

```javascript
// Parse all 7 sheets appended together - detect sheet by column name
const userId = $node["Extract File"].json.user_id || 'unknown';

if (!items || items.length === 0) {
  throw new Error('No Excel data received');
}

// Group rows by sheet based on column names
const sheets = {
  INDEX: [],
  CRITERIA: [],
  VENDORS: [],
  EVALUATION: [],
  MATCHING: [],
  BATTLECARDS: [],
  PREDEMO: []
};

for (const item of items) {
  const row = item.json;

  if (row.CLARIOO !== undefined) {
    sheets.INDEX.push(row);
  } else if (row['EVALUATION CRITERIA'] !== undefined) {
    sheets.CRITERIA.push(row);
  } else if (row['SHORTLISTED VENDORS'] !== undefined) {
    sheets.VENDORS.push(row);
  } else if (row['CRITERIA VS VENDORS'] !== undefined) {
    sheets.EVALUATION.push(row);
  } else if (row["VENDORS' DETAILED CRITERIA MATCHING"] !== undefined) {
    sheets.MATCHING.push(row);
  } else if (row['VENDOR BATTLECARDS'] !== undefined) {
    sheets.BATTLECARDS.push(row);
  } else if (row['PRE-DEMO BRIEF'] !== undefined) {
    sheets.PREDEMO.push(row);
  }
}

// ========== PARSE INDEX SHEET ==========
const indexData = {};
for (const row of sheets.INDEX) {
  const key = row.CLARIOO || '';
  const value = row.__EMPTY || '';

  if (key && typeof key === 'string' && key.trim() !== '') {
    const cleanKey = key.trim().replace(/:$/, '');
    if (value && value !== '') {
      indexData[cleanKey] = value;
    }
  }
}

// Extract template metadata
const templateId = 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

const templateCategory = (
  indexData['Software Category'] ||
  indexData['Category'] ||
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
  indexData['Current Tools'] ||
  indexData['Existing Solution'] ||
  null;

// ========== PARSE CRITERIA SHEET ==========
const criteria = [];
let headerSkipped = false;

for (const row of sheets.CRITERIA) {
  const criterionNum = row['EVALUATION CRITERIA'];
  const criterionName = row.__EMPTY || '';

  // Skip header row (has "Criterion" text)
  if (criterionName && typeof criterionName === 'string' &&
      criterionName.toLowerCase().includes('criterion')) {
    continue;
  }

  // Skip rows without a number
  if (typeof criterionNum !== 'number') {
    continue;
  }

  if (criterionName && typeof criterionName === 'string' && criterionName.trim() !== '') {
    const explanation = row.__EMPTY_1 || '';
    const importance = row.__EMPTY_2 || 'Medium';
    const type = row.__EMPTY_3 || 'feature';

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

// If no key features specified, extract from first 4 criteria
if (!keyFeatures && criteria.length > 0) {
  keyFeatures = criteria.slice(0, 4).map(c => c.name).join(', ');
}

// ========== PARSE VENDORS SHEET ==========
const vendors = [];

for (const row of sheets.VENDORS) {
  const vendorNum = row['SHORTLISTED VENDORS'];
  const vendorName = row.__EMPTY_1 || '';

  // Skip header and non-data rows
  if (typeof vendorNum !== 'number') {
    continue;
  }

  if (vendorName && typeof vendorName === 'string' && vendorName.trim() !== '') {
    const description = row.__EMPTY_2 || '';
    const website = row.__EMPTY_3 || '';

    vendors.push({
      name: vendorName.trim(),
      website: website,
      description: description
    });
  }
}

// ========== PARSE EVALUATION SHEET (Comparison Matrix) ==========
const comparisonMatrix = {
  rows: sheets.EVALUATION.length,
  rawData: sheets.EVALUATION.slice(0, 20), // Store first 20 rows as sample
  parsedAt: new Date().toISOString()
};

// ========== PARSE MATCHING SHEET (Positioning Data) ==========
const positioningData = {
  rows: sheets.MATCHING.length,
  rawData: sheets.MATCHING.slice(0, 10),
  parsedAt: new Date().toISOString()
};

// ========== PARSE BATTLECARDS SHEET ==========
const battlecards = {
  rows: sheets.BATTLECARDS.length,
  rawData: sheets.BATTLECARDS.slice(0, 10),
  parsedAt: new Date().toISOString()
};

// ========== PARSE PRE-DEMO BRIEF SHEET (Summary) ==========
const summaryData = {
  rows: sheets.PREDEMO.length,
  rawData: sheets.PREDEMO.slice(0, 50),
  parsedAt: new Date().toISOString()
};

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
    comparison_matrix: JSON.stringify(comparisonMatrix),
    battlecards: JSON.stringify(battlecards),
    positioning_data: JSON.stringify(positioningData),
    summary_data: JSON.stringify(summaryData),
    uploaded_by: userId,
    is_active: true,
    created_at: new Date().toISOString()
  }
}];
```

## What This Does

1. ✅ **Groups rows by sheet** - Detects sheet by column name
2. ✅ **Parses INDEX** - Extracts template metadata (category, description, project name)
3. ✅ **Parses CRITERIA** - Builds criteria array with 17 items
4. ✅ **Parses VENDORS** - Builds vendors array with 5 items
5. ✅ **Stores other sheets** - Saves raw data from Evaluation, Matching, Battlecards, Pre-Demo

## Expected Result

After uploading LoyaltyMan_Clarioo_TEST2.xlsx:

```json
{
  "success": true,
  "template_id": "tpl_...",
  "message": "Template uploaded successfully",
  "criteria_count": 17,
  "vendor_count": 5,
  "template_category": "UNCATEGORIZED" (or actual category if in Software Category field)
}
```

## Apply This Fix

1. Open Transform Excel Data node
2. Replace entire code with above
3. Save workflow
4. Test upload
