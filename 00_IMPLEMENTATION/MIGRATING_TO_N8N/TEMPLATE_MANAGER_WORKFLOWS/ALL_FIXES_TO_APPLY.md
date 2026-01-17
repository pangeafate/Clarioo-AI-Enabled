# Complete Fix Instructions for Workflow

Apply these fixes in order to the **Clarioo Template Manager - LIST & CREATE (TESTING)** workflow.

---

## ✅ Fix 1: Route Action Node - Pass Binary Data

**Node**: "Route Action" (Code node after Webhook)

**Current Code**: Missing binary pass-through

**Replace with**:
```javascript
// Determine action from query or body
const query = items[0].json.query || {};
const body = items[0].json.body || {};
const action = query.action || body.action || 'list';

return [{
  json: {
    action: action,
    query: query,
    body: body,
    originalData: items[0].json
  },
  binary: items[0].binary || {}  // ← THIS LINE IS CRITICAL!
}];
```

**Why**: Without passing binary data, the uploaded Excel file is lost.

---

## ✅ Fix 2: Parse Excel File Node - Read from Binary

**Node**: "Parse Excel File" (Spreadsheet File node)

**Current Configuration**:
- Operation: `fromUrl`
- URL: `={{ $json.file }}`

**Change to**:
- Operation: `read` (from dropdown)
- Binary Property: `file`

**Steps**:
1. Click on "Parse Excel File" node
2. Change "Read As" from "File From Url" to "Read From File"
3. Set "Binary Property" to: `file`
4. Leave "Header Row" at: `0`

**Why**: File is uploaded as binary data, not a URL.

---

## ✅ Fix 3: Transform Excel Data Node - Handle Row Format

**Node**: "Transform Excel Data" (Code node)

**IMPORTANT**: Use v5 fix (not v3/v4) - we discovered Parse Excel outputs one item per ROW, not per sheet!

**Replace ENTIRE code with v5 fix from `FIXED_Transform_Excel_Data_v5_ROW_FORMAT.md`**:

```javascript
// Parse Excel data - handles object format from Spreadsheet File node
const userId = $node["Extract File"].json.user_id || 'unknown';

// Extract sheet data - Spreadsheet File node returns array of objects
let sheetData = items;

if (!sheetData || sheetData.length === 0) {
  throw new Error('Could not parse Excel file. No sheets found.');
}

// Tab 0: INDEX - Extract metadata
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

**Why**: Spreadsheet File node returns objects with column name keys (CLARIOO, __EMPTY), not 2D arrays.

---

## 🧪 Testing After Fixes

1. Save the workflow
2. Test LIST operation:
```bash
curl -X POST "https://n8n.lakestrom.com/webhook/template-manager?action=list"
```

3. Test UPLOAD operation:
```bash
cd "/Users/sergeypodolskiy/CODEBASE/25 10 24 Clarioo Copy AI Migration v260108WIP/00_IMPLEMENTATION/WIP"
curl -X POST "https://n8n.lakestrom.com/webhook/template-manager?action=upload" \
  -F "file=@LoyaltyMan_Clarioo_Test.xlsx" \
  -F "user_id=test_final"
```

Expected response:
```json
{
  "success": true,
  "template_id": "tpl_...",
  "message": "Template uploaded successfully",
  "criteria_count": 15,
  "vendor_count": 3,
  "template_category": "PROJECT MANAGEMENT"
}
```

---

## 📝 Checklist

- [ ] Fix 1: Route Action binary pass-through applied
- [ ] Fix 2: Parse Excel File changed to read from binary
- [ ] Fix 3: Transform Excel Data updated to v3 code
- [ ] Workflow saved
- [ ] LIST operation tested (should return 6 templates)
- [ ] UPLOAD operation tested (should add new template)
- [ ] Verify new template in LIST response

---

## ❗ Current Status

**What's working**: LIST operation returns 6 templates successfully

**What's broken**: UPLOAD operation returns empty response (HTTP 200 but 0 bytes)

**Root cause**: The three fixes above haven't been applied to the workflow yet

**Next step**: Apply all three fixes in the n8n UI, save, and test again
