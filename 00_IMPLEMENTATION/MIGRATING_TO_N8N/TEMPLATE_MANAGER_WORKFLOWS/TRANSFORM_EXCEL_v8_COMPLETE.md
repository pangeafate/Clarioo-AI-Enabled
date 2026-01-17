# Transform Excel Data v8 - Complete Parsing (All 7 Sheets)

## Complete Transform Code

This code parses all 7 sheets into proper project format for seamless "Clone as Project" functionality.

```javascript
// ============================================================================
// TRANSFORM EXCEL DATA v8 - COMPLETE PARSING
// Parses all 7 sheets into full project format for template cloning
// ============================================================================

const userId = $node["Extract File"].json.user_id || 'unknown';

if (!items || items.length === 0) {
  throw new Error('No Excel data received');
}

// ============================================================================
// STEP 1: GROUP ROWS BY SHEET (detect by column name)
// ============================================================================

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

// ============================================================================
// STEP 2: PARSE INDEX SHEET → Project Metadata
// ============================================================================

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

const templateId = 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

const projectName = indexData['Project Name'] || indexData['Looking For'] || 'Untitled Template';
const projectDescription = indexData['Description'] || '';
const softwareCategory = indexData['Software Category'] || indexData['Category'] || '';
const templateCategory = softwareCategory || 'UNCATEGORIZED';

let keyFeatures = indexData['Key Features'] || indexData['Features'] || '';
const clientQuote = indexData['Client Quote'] || indexData['Quote'] || null;
const currentTool = indexData['Current Tool'] || indexData['Current Tools'] || indexData['Existing Solution'] || null;

// ============================================================================
// STEP 3: PARSE CRITERIA SHEET → TransformedCriterion[]
// ============================================================================

const criteria = [];

for (const row of sheets.CRITERIA) {
  const criterionNum = row['EVALUATION CRITERIA'];
  const criterionName = row.__EMPTY || '';

  // Skip header rows
  if (criterionName && typeof criterionName === 'string' &&
      criterionName.toLowerCase().includes('criterion')) {
    continue;
  }

  if (typeof criterionNum !== 'number') continue;

  if (criterionName && typeof criterionName === 'string' && criterionName.trim() !== '') {
    const explanation = row.__EMPTY_1 || '';
    const importanceRaw = (row.__EMPTY_2 || 'Medium').toString().toLowerCase();
    const importance = importanceRaw === 'high' ? 'high' :
                       importanceRaw === 'low' ? 'low' : 'medium';
    const type = (row.__EMPTY_3 || 'feature').toString().toLowerCase();

    criteria.push({
      id: 'crit_' + String(criteria.length + 1).padStart(3, '0'),
      name: criterionName.trim(),
      explanation: explanation,
      importance: importance,
      type: type,
      isArchived: false
    });
  }
}

// Auto-generate key features if not provided
if (!keyFeatures && criteria.length > 0) {
  keyFeatures = criteria.slice(0, 4).map(c => c.name).join(', ');
}

// ============================================================================
// STEP 4: PARSE VENDORS SHEET → Vendor[]
// ============================================================================

const vendors = [];

for (const row of sheets.VENDORS) {
  const vendorNum = row['SHORTLISTED VENDORS'];
  const vendorName = row.__EMPTY_1 || '';

  if (typeof vendorNum !== 'number') continue;

  if (vendorName && typeof vendorName === 'string' && vendorName.trim() !== '') {
    const description = row.__EMPTY_2 || '';
    const website = row.__EMPTY_3 || '';

    vendors.push({
      id: 'vendor_' + String(vendors.length + 1).padStart(3, '0'),
      name: vendorName.trim(),
      website: website,
      description: description,
      matchPercentage: null // Will be calculated from comparison matrix
    });
  }
}

// ============================================================================
// STEP 5: PARSE COMPARISON MATRIX → ComparisonMatrixData
// ============================================================================

const stage1Results = {};
const stage2Results = {};
const cellSummaries = {};

// Symbol mapping
const symbolToStatus = {
  '⭐': 'star',
  '✓': 'yes',
  'X': 'no',
  '?': 'unknown',
  '+/-': 'partial',
  '🔄': 'unknown'
};

// Parse comparison matrix rows
let headerRow = null;
let vendorColumns = [];

for (let i = 0; i < sheets.EVALUATION.length; i++) {
  const row = sheets.EVALUATION[i];
  const category = row['CRITERIA VS VENDORS'];
  const criterionName = row.__EMPTY || '';

  // Find header row with vendor names
  if (!headerRow && criterionName && criterionName.toLowerCase().includes('criteria')) {
    headerRow = row;
    // Extract vendor column keys (__EMPTY_1, __EMPTY_2, etc.)
    vendorColumns = Object.keys(row)
      .filter(key => key.startsWith('__EMPTY_') || key === '__EMPTY_1')
      .sort();
    continue;
  }

  // Skip non-data rows
  if (!criterionName || typeof category !== 'string') continue;
  if (criterionName.toLowerCase().includes('criteria')) continue;

  // Find matching criterion
  const criterion = criteria.find(c => c.name === criterionName.trim());
  if (!criterion) continue;

  const criterionId = criterion.id;

  // Initialize rankings for stage 2
  const rankings = [];

  // Parse each vendor column
  vendorColumns.forEach((colKey, vendorIndex) => {
    const vendor = vendors[vendorIndex];
    if (!vendor) return;

    const vendorId = vendor.id;
    const symbol = row[colKey] || '?';
    const matchStatus = symbolToStatus[symbol] || 'unknown';

    // Stage 1: Individual cell result
    const resultKey = `${vendorId}:${criterionId}`;
    stage1Results[resultKey] = {
      vendor_id: vendorId,
      criterion_id: criterionId,
      match_status: matchStatus === 'star' ? 'yes' : matchStatus,
      evidence_description: `${vendor.name} ${matchStatus} for ${criterionName}`,
      research_notes: '',
      source_urls: [],
      timestamp: new Date().toISOString()
    };

    // Stage 2: Ranking based on status
    const rank = matchStatus === 'star' ? 1 :
                 matchStatus === 'yes' ? 2 :
                 matchStatus === 'partial' ? 3 :
                 matchStatus === 'no' ? 4 : 5;

    rankings.push({
      vendor_id: vendorId,
      rank: rank,
      final_match_status: matchStatus,
      comparative_notes: `Ranked ${rank} for ${criterionName}`
    });
  });

  // Stage 2: Criterion rankings
  stage2Results[criterionId] = {
    criterion_id: criterionId,
    rankings: rankings.sort((a, b) => a.rank - b.rank),
    comparative_summary: `Comparison completed for ${criterionName}`,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// STEP 6: PARSE DETAILED MATCHING → Enhance Stage 1 Results
// ============================================================================

for (const row of sheets.MATCHING) {
  const category = row["VENDORS' DETAILED CRITERIA MATCHING"];
  const vendorName = row.__EMPTY || '';
  const criterionName = row.__EMPTY_1 || '';
  const status = row.__EMPTY_2 || '';
  const evidence = row.__EMPTY_3 || '';
  const sources = row.__EMPTY_4 || '';

  // Skip header rows
  if (!vendorName || vendorName.toLowerCase().includes('vendor')) continue;

  // Find matching vendor and criterion
  const vendor = vendors.find(v => v.name === vendorName.trim());
  const criterion = criteria.find(c => c.name === criterionName.trim());

  if (vendor && criterion) {
    const resultKey = `${vendor.id}:${criterion.id}`;
    if (stage1Results[resultKey]) {
      stage1Results[resultKey].evidence_description = evidence || stage1Results[resultKey].evidence_description;
      stage1Results[resultKey].source_urls = sources ? sources.split(',').map(s => s.trim()) : [];
    }
  }
}

// ============================================================================
// STEP 7: PARSE BATTLECARDS → BattlecardRowState[]
// ============================================================================

const battlecardRows = [];
let battlecardHeaderRow = null;
let battlecardVendorColumns = [];

for (let i = 0; i < sheets.BATTLECARDS.length; i++) {
  const row = sheets.BATTLECARDS[i];
  const category = row['VENDOR BATTLECARDS'];

  // Find header row
  if (!battlecardHeaderRow && Object.values(row).some(v =>
      typeof v === 'string' && vendors.some(vendor => v.includes(vendor.name)))) {
    battlecardHeaderRow = row;
    battlecardVendorColumns = Object.keys(row)
      .filter(key => key.startsWith('__EMPTY'))
      .sort();
    continue;
  }

  // Skip non-data rows
  if (!category || typeof category !== 'string') continue;
  if (category.toLowerCase().includes('category')) continue;

  // Parse battlecard row
  const cells = [];

  battlecardVendorColumns.forEach((colKey, vendorIndex) => {
    const vendor = vendors[vendorIndex];
    if (!vendor) return;

    const content = row[colKey] || '';
    if (content && content !== '') {
      cells.push({
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        content: content,
        sources: []
      });
    }
  });

  if (cells.length > 0) {
    battlecardRows.push({
      row_id: 'bc_row_' + String(battlecardRows.length + 1).padStart(3, '0'),
      category_title: category,
      category_definition: '',
      cells: cells,
      status: 'completed',
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// STEP 8: PARSE EXECUTIVE SUMMARY → ExecutiveSummaryData
// ============================================================================

const executiveSummary = {
  overview: {
    projectGoal: projectDescription,
    keyRequirements: criteria.slice(0, 7).map(c => c.name),
    evaluationCriteria: criteria.length
  },
  vendorAnalysis: [],
  recommendation: {
    topPick: '',
    reason: '',
    considerations: []
  }
};

// Parse vendor recommendations
let currentVendor = null;
let section = null;

for (const row of sheets.PREDEMO) {
  const text = row['PRE-DEMO BRIEF'] || '';

  // Detect vendor recommendation sections (e.g., "1. Yotpo - 84% Match")
  const vendorMatch = text.match(/^\d+\.\s+(.+?)\s*-\s*(\d+)%\s*Match/);
  if (vendorMatch) {
    if (currentVendor) {
      executiveSummary.vendorAnalysis.push(currentVendor);
    }
    currentVendor = {
      vendorName: vendorMatch[1],
      matchPercentage: parseInt(vendorMatch[2]),
      overallAssessment: '',
      strengths: [],
      weaknesses: [],
      bestFor: ''
    };
    // Set top pick as first vendor
    if (!executiveSummary.recommendation.topPick) {
      executiveSummary.recommendation.topPick = vendorMatch[1];
    }
    continue;
  }

  if (!currentVendor) continue;

  // Parse vendor sections
  if (text.includes('Key Strengths:')) {
    section = 'strengths';
  } else if (text.includes('Key Weaknesses:')) {
    section = 'weaknesses';
  } else if (text.includes('Best For:')) {
    section = 'bestFor';
  } else if (text.startsWith('•') && section) {
    const bulletText = text.replace(/^•\s*/, '').trim();
    if (section === 'strengths') {
      currentVendor.strengths.push(bulletText);
    } else if (section === 'weaknesses') {
      currentVendor.weaknesses.push(bulletText);
    }
  } else if (section === 'bestFor' && text.trim() !== '') {
    currentVendor.bestFor = text.trim();
    section = null;
  } else if (!section && currentVendor.overallAssessment === '' && text.trim() !== '') {
    currentVendor.overallAssessment = text.trim();
  }
}

// Add last vendor
if (currentVendor) {
  executiveSummary.vendorAnalysis.push(currentVendor);
}

// Set recommendation reason (first vendor's overall assessment)
if (executiveSummary.vendorAnalysis.length > 0) {
  executiveSummary.recommendation.reason = executiveSummary.vendorAnalysis[0].overallAssessment;
}

// ============================================================================
// STEP 9: CALCULATE VENDOR MATCH PERCENTAGES
// ============================================================================

vendors.forEach(vendor => {
  const vendorResults = Object.values(stage1Results).filter(r => r.vendor_id === vendor.id);
  if (vendorResults.length === 0) return;

  const yesCount = vendorResults.filter(r => r.match_status === 'yes' || r.match_status === 'star').length;
  vendor.matchPercentage = Math.round((yesCount / vendorResults.length) * 100);
});

// ============================================================================
// STEP 10: RETURN COMPLETE TEMPLATE
// ============================================================================

const comparisonMatrix = {
  stage1_results: {
    projectId: '', // Will be set when cloned
    results: stage1Results,
    timestamp: new Date().toISOString()
  },
  stage2_results: {
    projectId: '',
    results: stage2Results,
    timestamp: new Date().toISOString()
  }
};

return [{
  json: {
    // Core metadata
    template_id: templateId,
    template_category: templateCategory.toUpperCase(),

    // Project metadata
    project_name: projectName,
    project_description: projectDescription,
    software_category: softwareCategory,
    key_features: keyFeatures,
    client_quote: clientQuote,
    current_tool: currentTool,

    // Arrays
    criteria: JSON.stringify(criteria),
    vendors: JSON.stringify(vendors),

    // Comparison data
    comparison_matrix: JSON.stringify(comparisonMatrix),
    detailed_matching: JSON.stringify({ parsed: true }), // Already merged into stage1

    // Analysis data
    battlecards: JSON.stringify(battlecardRows),
    executive_summary: JSON.stringify(executiveSummary),

    // Positioning (null for now, can be added later)
    positioning_data: JSON.stringify(null),

    // Template admin
    uploaded_by: userId,
    is_active: true,
    created_at: new Date().toISOString()
  }
}];
```

## What This Parses

1. ✅ **INDEX** → Project metadata (name, description, category, features, quote)
2. ✅ **Criteria** → Full `TransformedCriterion[]` array (17 items)
3. ✅ **Vendors** → Full `Vendor[]` array with match percentages (5 items)
4. ✅ **Comparison Matrix** → `stage1_results` + `stage2_results` with all match statuses
5. ✅ **Detailed Matching** → Enhanced evidence in stage1_results
6. ✅ **Battlecards** → Complete `BattlecardRowState[]` array
7. ✅ **Executive Summary** → Full `ExecutiveSummaryData` structure with vendor analysis

## Test This Code

1. Replace Transform Excel Data node code with above
2. Save workflow
3. Test upload with LoyaltyMan_Clarioo_TEST2.xlsx
4. Expected response:
```json
{
  "success": true,
  "template_id": "tpl_...",
  "criteria_count": 17,
  "vendor_count": 5,
  "template_category": "..." // or UNCATEGORIZED if empty
}
```

5. Check the database/stored template to verify all fields are populated correctly
