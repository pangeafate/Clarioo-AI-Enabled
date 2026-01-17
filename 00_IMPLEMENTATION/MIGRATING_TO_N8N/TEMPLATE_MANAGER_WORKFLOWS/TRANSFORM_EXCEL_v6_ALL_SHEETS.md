# Transform Excel Data v6 - All 7 Sheets

## Problem with Current Merge Approach

When we merge all 7 Extract nodes, we get all rows from all sheets mixed together. We can't tell where one sheet ends and another begins.

## Better Solution: Tag Each Sheet

We need to modify the workflow slightly to add sheet identification.

### Option 1: Add Code Nodes After Each Extract (RECOMMENDED)

Add a "Tag Sheet" Code node after each Extract node that adds metadata:

**After "Extract Sheet: INDEX":**
```javascript
return items.map(item => ({
  json: {
    ...item.json,
    __sheetName: 'INDEX'
  }
}));
```

**After "Extract Sheet: Criteria":**
```javascript
return items.map(item => ({
  json: {
    ...item.json,
    __sheetName: 'CRITERIA'
  }
}));
```

**After "Extract Sheet: Vendors":**
```javascript
return items.map(item => ({
  json: {
    ...item.json,
    __sheetName: 'VENDORS'
  }
}));
```

**After "Extract Sheet: Evaluation":**
```javascript
return items.map(item => ({
  json: {
    ...item.json,
    __sheetName: 'EVALUATION'
  }
}));
```

**After "Extract Sheet: Matching":**
```javascript
return items.map(item => ({
  json: {
    ...item.json,
    __sheetName: 'MATCHING'
  }
}));
```

**After "Extract Sheet: Battlecards":**
```javascript
return items.map(item => ({
  json: {
    ...item.json,
    __sheetName: 'BATTLECARDS'
  }
}));
```

**After "Extract Sheet: Pre-Demo":**
```javascript
return items.map(item => ({
  json: {
    ...item.json,
    __sheetName: 'PREDEMO'
  }
}));
```

### Transform Code (Use After Tagging):

```javascript
// Parse all 7 sheets - each row has __sheetName metadata
const userId = $node["Extract File"].json.user_id || 'unknown';

if (!items || items.length === 0) {
  throw new Error('No Excel data received');
}

// Group rows by sheet
const sheetGroups = {
  INDEX: [],
  CRITERIA: [],
  VENDORS: [],
  EVALUATION: [],
  MATCHING: [],
  BATTLECARDS: [],
  PREDEMO: []
};

for (const item of items) {
  const sheetName = item.json.__sheetName;
  if (sheetName && sheetGroups[sheetName]) {
    sheetGroups[sheetName].push(item.json);
  }
}

// ========== PARSE INDEX SHEET ==========
const indexData = {};
for (const row of sheetGroups.INDEX) {
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

// ========== PARSE CRITERIA SHEET ==========
const criteria = [];
let headerSkipped = false;

for (const row of sheetGroups.CRITERIA) {
  const criterionName = row.CLARIOO || row.A || row['0'] || '';

  // Skip header row
  if (!headerSkipped && (
    criterionName.toLowerCase().includes('criterion') ||
    criterionName.toLowerCase().includes('name') ||
    criterionName.toLowerCase().includes('requirement')
  )) {
    headerSkipped = true;
    continue;
  }

  if (criterionName && typeof criterionName === 'string' && criterionName.trim() !== '') {
    const importance = row.__EMPTY || row.B || row['1'] || 'Medium';
    const explanation = row.__EMPTY_1 || row.C || row['2'] || '';
    const type = row.__EMPTY_2 || row.D || row['3'] || 'feature';

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
headerSkipped = false;

for (const row of sheetGroups.VENDORS) {
  const vendorName = row.CLARIOO || row.A || row['0'] || '';

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
    const website = row.__EMPTY || row.B || row['1'] || '';
    const description = row.__EMPTY_1 || row.C || row['2'] || '';

    vendors.push({
      name: vendorName.trim(),
      website: website,
      description: description
    });
  }
}

// ========== PARSE EVALUATION SHEET (Comparison Matrix) ==========
// Store raw data for now - can parse into proper matrix structure later
const comparison_matrix = {
  rawData: sheetGroups.EVALUATION,
  parsedAt: new Date().toISOString()
};

// ========== PARSE MATCHING SHEET (Positioning Data) ==========
const positioning_data = {
  rawData: sheetGroups.MATCHING,
  parsedAt: new Date().toISOString()
};

// ========== PARSE BATTLECARDS SHEET ==========
const battlecards = {
  rawData: sheetGroups.BATTLECARDS,
  parsedAt: new Date().toISOString()
};

// ========== PARSE PRE-DEMO BRIEF SHEET (Summary) ==========
const summary_data = {
  rawData: sheetGroups.PREDEMO,
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
    comparison_matrix: JSON.stringify(comparison_matrix),
    battlecards: JSON.stringify(battlecards),
    positioning_data: JSON.stringify(positioning_data),
    summary_data: JSON.stringify(summary_data),
    uploaded_by: userId,
    is_active: true,
    created_at: new Date().toISOString()
  }
}];
```

## Summary

**This approach:**
1. ✅ Parses INDEX → template metadata
2. ✅ Parses CRITERIA → criteria array
3. ✅ Parses VENDORS → vendors array
4. ⚠️ Stores other 4 sheets as raw data (can parse later if needed)

**To implement:**
1. Add 7 "Code" nodes (one after each Extract Sheet node) to tag rows
2. These feed into the Merge node
3. Transform node groups by __sheetName and parses accordingly

**Alternative:** If you don't want to add tagging nodes, I can create a version that tries to detect sheet boundaries, but it will be less reliable.
