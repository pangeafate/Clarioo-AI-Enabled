# Fixed Transform Excel Data Node Code v2

Updated to handle the actual LoyaltyMan Excel structure with numbered tabs.

## Replace the "Transform Excel Data" node code with this:

```javascript
    // Parse Excel data - handles numbered tabs like "1. Evaluation Criteria"
    const userId = $node["Extract File"].json.user_id || 'unknown';
    
    // Extract sheet data from Spreadsheet File node
    let sheetData;
    
    if (items[0].json && typeof items[0].json === 'object') {
      if (Array.isArray(items[0].json)) {
        sheetData = items[0].json;
      } else if (items[0].json.data && Array.isArray(items[0].json.data)) {
        sheetData = items[0].json.data;
      } else {
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
    
    if (!sheetData && items.length > 0) {
      sheetData = items.map(item => item.json);
    }
    
    if (!sheetData || sheetData.length === 0) {
      throw new Error('Could not parse Excel file. Spreadsheet File node returned no data.');
    }
    
    // Tab 0: INDEX - Extract metadata
    const indexTab = sheetData[0];
    if (!indexTab || !Array.isArray(indexTab) || indexTab.length < 2) {
      throw new Error(`INDEX tab invalid. Found ${indexTab ? indexTab.length : 0} rows. Expected at least 2 rows with key-value pairs.`);
    }
    
    // Parse INDEX tab as key-value pairs
    const indexData = {};
    for (let i = 0; i < indexTab.length; i++) {
      const row = indexTab[i];
      if (row && Array.isArray(row) && row.length >= 2) {
        const key = String(row[0] || '').trim();
        const value = row[1];
        if (key && key !== '') {
          indexData[key] = value;
        }
      }
    }
    
    // Extract template metadata with multiple possible key names
    const templateId = 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Try different possible field names
    const templateCategory = (
      indexData['Category'] ||
      indexData['category'] ||
      indexData['Template Category'] ||
      indexData['Type'] ||
      'UNCATEGORIZED'
    ).toUpperCase();
    
    const searchedBy =
      indexData['Searched By'] ||
      indexData['searched_by'] ||
      indexData['Company'] ||
      indexData['Client'] ||
      '';
    
    const lookingFor =
      indexData['Looking For'] ||
      indexData['looking_for'] ||
      indexData['Description'] ||
      indexData['Objective'] ||
      '';
    
    let keyFeatures =
      indexData['Key Features'] ||
      indexData['key_features'] ||
      indexData['Features'] ||
      '';
    
    const clientQuote =
      indexData['Client Quote'] ||
      indexData['client_quote'] ||
      indexData['Quote'] ||
      null;
    
    const currentTool =
      indexData['Current Tool'] ||
      indexData['current_tool'] ||
      indexData['Existing Solution'] ||
      null;
    
    // Tab 1: Evaluation Criteria (or Criteria)
    const criteriaTab = sheetData[1];
    const criteria = [];
    
    if (criteriaTab && Array.isArray(criteriaTab) && criteriaTab.length > 1) {
      // Skip header row (index 0), process data rows
      for (let i = 1; i < criteriaTab.length; i++) {
        const row = criteriaTab[i];
        if (row && Array.isArray(row) && row[0]) {
          const criterionName = String(row[0] || '').trim();
          if (criterionName && criterionName !== '') {
            criteria.push({
              id: 'crit_' + String(i).padStart(3, '0'),
              name: criterionName,
              importance: row[1] || 'Medium',
              explanation: row[2] || '',
              type: row[3] || 'feature',
              isArchived: false
            });
          }
        }
      }
    }
    
    // If no key features specified, extract from first 4 criteria
    if (!keyFeatures && criteria.length > 0) {
      keyFeatures = criteria.slice(0, 4).map(c => c.name).join(', ');
    }
    
    // Tab 2: Vendor List (or Vendors)
    const vendorsTab = sheetData[2];
    const vendors = [];
    
    if (vendorsTab && Array.isArray(vendorsTab) && vendorsTab.length > 1) {
      // Skip header row (index 0), process data rows
      for (let i = 1; i < vendorsTab.length; i++) {
        const row = vendorsTab[i];
        if (row && Array.isArray(row) && row[0]) {
          const vendorName = String(row[0] || '').trim();
          if (vendorName && vendorName !== '') {
            vendors.push({
              name: vendorName,
              website: row[1] || '',
              description: row[2] || ''
            });
          }
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

## Key Improvements:

1. **Better error messages** - Shows exactly what's wrong
2. **Multiple field name variations** - Tries different possible column names
3. **Row validation** - Ensures rows are arrays with data
4. **Empty row skipping** - Ignores blank rows
5. **Better string handling** - Trims whitespace and checks for empty strings

## Steps:

1. Open the workflow in n8n
2. Click on **"Transform Excel Data"** node
3. Replace the code with the above
4. **Save** the workflow
5. Test upload again

This should now correctly parse:
- Sheet 0: INDEX
- Sheet 1: "1. Evaluation Criteria"
- Sheet 2: "2. Vendor List"
