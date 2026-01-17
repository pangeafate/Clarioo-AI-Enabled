# Sprint 29: Excel Template Upload with Reverse Engineering (SP_029)

**Status**: 🚧 IN PROGRESS (Day 3/4 - 95% Complete - Ready for Deployment)
**Type**: Feature Implementation + Excel Reverse Engineering + n8n Data Tables Integration
**Estimated Duration**: 3-4 days
**Priority**: HIGH
**Date Started**: January 15, 2026
**Current Date**: January 15, 2026
**Last Updated**: January 15, 2026 (n8n Workflow + Deployment Checklist Complete)
**Dependencies**: SP_027 (Excel Export Service), SP_028 (Admin Mode Toggle - partial)

---

## ✅ CURRENT IMPLEMENTATION STATUS (January 15, 2026)

### Completed ✅

#### 1. Frontend Excel Parsing (100%)
- ✅ **excelImportService.ts** (829 lines) - Complete reverse engineering service
  - ✅ `importExcelTemplate()` - Main entry point with validation
  - ✅ `parseIndexTab()` - Extract project metadata (12 fields)
  - ✅ `parseCriteriaTab()` - Parse evaluation criteria from row 4+
  - ✅ `parseVendorListTab()` - Parse vendor list from row 6+ (with hyperlink support)
  - ✅ `parseComparisonMatrixTab()` - Parse comparison matrix with icon mapping
  - ✅ `parseDetailedMatchingTab()` - Parse evidence and sources
  - ✅ `parseExecutiveSummaryTab()` - Parse pre-demo brief
  - ✅ `parseBattlecardsTab()` - Parse transposed battlecards layout
  - ✅ Icon to match status mapping (✓ → yes, ⭐ → star, etc.)
  - ✅ Error handling with partial upload support
  - ✅ Warnings system for missing optional tabs
  - ✅ ExportProjectData type compliance (zero transformation)

#### 2. Admin Mode System (100%)
- ✅ **AdminModeToggle.tsx** (135 lines) - Passcode-protected admin mode
  - ✅ 5-digit passcode: `71956`
  - ✅ localStorage persistence (`clarioo_admin_mode`)
  - ✅ Lock/Unlock icon states
  - ✅ Passcode dialog with validation
  - ✅ Toast notifications (activation/deactivation)
  - ✅ Custom event dispatch for cross-component updates
  - ✅ Integrated in VendorDiscovery.tsx (line 841)

#### 3. Upload UI Component (100%)
- ✅ **TemplateUploadButton.tsx** (200 lines) - Excel upload with progress tracking
  - ✅ File input validation (.xlsx only, 10MB max)
  - ✅ Two-stage processing: Parsing → Uploading
  - ✅ Progress indicators with animated icons
  - ✅ Error/warning toast notifications
  - ✅ Integration with `importExcelTemplate()` and `uploadTemplateWithJSON()`
  - ✅ File reset after upload
  - ✅ Integrated in TemplatesModal.tsx (line 287)

#### 4. Service Layer (100%)
- ✅ **templateService.ts** - Updated with zero-transformation approach
  - ✅ `uploadTemplateWithJSON()` (lines 641-693) - Upload parsed JSON to n8n
  - ✅ `createProjectFromExportData()` (lines 722+) - Create project with zero transformations
  - ✅ Direct localStorage population (no field mapping)
  - ✅ n8n endpoint: `action: 'upload_json'`
  - ✅ Warning propagation from n8n
  - ✅ Comprehensive logging

#### 5. UI Integration (100%)
- ✅ **TemplatesModal.tsx** - Admin-only upload button
  - ✅ Import TemplateUploadButton (line 26)
  - ✅ Render upload button when admin mode active (line 287)
  - ✅ Refresh template list on upload success
  - ✅ AdminModeToggle integration (line 343)

- ✅ **VendorDiscovery.tsx** - Admin mode toggle placement
  - ✅ Import AdminModeToggle (line 19)
  - ✅ Render toggle in page footer (line 841)

#### 6. n8n Backend Schema & Documentation (100%)
- ✅ **clarioo_templates_schema_v2.csv** - Data Table schema definition
  - 18 columns including `template_data_json` (complete JSON blob)
  - Metadata columns for filtering (template_name, template_category, counts, etc.)
  - Audit fields (user_id, uploaded_at, updated_at)
  - Follows zero-transformation approach

- ✅ **DATATABLE_SCHEMA_EXPLANATION.md** - Comprehensive schema documentation
  - Architecture overview (zero transformation)
  - Data flow diagrams
  - Column-by-column explanation
  - localStorage structure mapping
  - Template card display fields
  - Upload/retrieval workflows
  - Example data and usage

- ✅ **N8N_WEBHOOK_CONFIGURATION.md** - Complete n8n setup guide
  - Webhook workflow structure
  - Action routing (upload_json, list, delete, get)
  - Node configurations with code snippets
  - Error handling patterns
  - Testing checklist with curl commands
  - Security considerations
  - Integration examples
  - Deployment steps

#### 7. n8n Workflow Creation (100%)
- ✅ **Clarioo_Template_Manager_Upload_JSON_SP029.json** - Ready-to-upload n8n workflow
  - 18 nodes implementing zero-transformation approach
  - Webhook trigger on `/templates` (POST/GET)
  - Switch node for action routing (4 outputs)
  - **list** action: Get All Templates → Format → Return
  - **upload_json** action: Extract JSON → Insert → Return
  - **delete** action: Extract Params → Delete → Return
  - **get** action: Extract Params → Get Single → Return
  - CORS headers configured for cross-origin requests
  - Error handling with descriptive messages
  - Based on donor workflow but simplified (no Excel parsing)

#### 8. Deployment Documentation (100%)
- ✅ **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment guide
  - Pre-deployment verification checklist
  - 5-step deployment process (19-24 minutes)
  - Step 1: Create n8n Data Table (5 min)
  - Step 2: Import workflow and update Data Table IDs (5 min)
  - Step 3: Activate workflow and get webhook URL (2 min)
  - Step 4: Update frontend .env file (2 min)
  - Step 5: Test deployment with 5 test scenarios (5-10 min)
  - Troubleshooting guide for common issues
  - Success criteria checklist
  - Real-world testing instructions (optional round-trip test)

### Remaining Work ⏳

#### 1. n8n Manual Deployment (5% - Ready for Deployment)
- ✅ Schema CSV created (`clarioo_templates_schema_v2.csv`)
- ✅ Schema documentation complete (`DATATABLE_SCHEMA_EXPLANATION.md`)
- ✅ Webhook configuration guide complete (`N8N_WEBHOOK_CONFIGURATION.md`)
- ✅ Workflow JSON created (`Clarioo_Template_Manager_Upload_JSON_SP029.json`)
- ✅ Deployment checklist created (`DEPLOYMENT_CHECKLIST.md`)
- ⏳ **Manual Step**: Upload CSV to n8n to create Data Table
- ⏳ **Manual Step**: Import workflow JSON to n8n
- ⏳ **Manual Step**: Update Data Table IDs in 4 workflow nodes
- ⏳ **Manual Step**: Activate workflow and copy webhook URL
- ⏳ **Manual Step**: Update `.env` with `VITE_TEMPLATE_WEBHOOK_URL`
- ⏳ Test webhook endpoints (5 test scenarios in deployment checklist)

**Files Ready for Deployment**:
- Schema: `00_IMPLEMENTATION/MIGRATING_TO_N8N/clarioo_templates_schema_v2.csv`
- Workflow: `00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_Template_Manager_Upload_JSON_SP029.json`
- Guide 1: `00_IMPLEMENTATION/MIGRATING_TO_N8N/DATATABLE_SCHEMA_EXPLANATION.md`
- Guide 2: `00_IMPLEMENTATION/MIGRATING_TO_N8N/N8N_WEBHOOK_CONFIGURATION.md`
- Guide 3: `00_IMPLEMENTATION/MIGRATING_TO_N8N/DEPLOYMENT_CHECKLIST.md` **(START HERE)**

#### 2. Integration Testing (Pending)
- ⏳ Test Excel parsing with real exported files
  - Basic template (criteria + vendors only)
  - Complete template (all 7 tabs)
  - Partial template (missing optional tabs)
  - Invalid file handling
  - Large file handling (near 10MB limit)

- ⏳ Test round-trip flow
  - Export project → Upload Excel → Create from template → Export again
  - Verify data integrity (should be identical)
  - Test with different project stages

- ⏳ Test admin mode flow
  - Toggle activation with correct/incorrect passcode
  - Upload button visibility
  - Cross-window/tab admin state sync

### Implementation Summary

**Lines of Code**: ~1,164 lines implementation + ~900 lines documentation
- excelImportService: 829 lines
- TemplateUploadButton: 200 lines
- AdminModeToggle: 135 lines
- Documentation: ~900 lines (3 guides + workflow JSON)

**Files Created**: 8
**Frontend Implementation (3)**:
- `src/services/excelImportService.ts` (829 lines)
- `src/components/templates/TemplateUploadButton.tsx` (200 lines)
- `src/components/admin/AdminModeToggle.tsx` (135 lines)

**Backend Files (5)**:
- `00_IMPLEMENTATION/MIGRATING_TO_N8N/clarioo_templates_schema_v2.csv` (CSV schema)
- `00_IMPLEMENTATION/MIGRATING_TO_N8N/DATATABLE_SCHEMA_EXPLANATION.md` (~450 lines)
- `00_IMPLEMENTATION/MIGRATING_TO_N8N/N8N_WEBHOOK_CONFIGURATION.md` (~450 lines)
- `00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_Template_Manager_Upload_JSON_SP029.json` (n8n workflow)
- `00_IMPLEMENTATION/MIGRATING_TO_N8N/DEPLOYMENT_CHECKLIST.md` (~500 lines)

**Files Modified**: 4
- `src/services/templateService.ts` (+52 lines - uploadTemplateWithJSON function)
- `src/components/templates/TemplatesModal.tsx` (+2 imports, upload button integration)
- `src/components/VendorDiscovery.tsx` (+1 import, admin toggle placement)
- `src/types/template.types.ts` (type updates - not confirmed)

**Key Innovation Implemented**: ✅ Zero transformation approach
- Excel → JSON parsing happens in frontend
- ExportProjectData structure preserved exactly
- No field mapping or nested transformations
- Direct n8n storage as JSON blob (`template_data_json` column)
- Direct localStorage population when creating projects
- Metadata columns enable filtering without JSON parsing

**Deployment Status**: 🟢 Ready for Manual Deployment
1. ✅ All code complete (frontend + documentation)
2. ✅ n8n workflow JSON ready for import
3. ⏳ Manual deployment required (follow `DEPLOYMENT_CHECKLIST.md`)
4. ⏳ Integration testing after deployment

**Next Steps**:
1. **Follow deployment checklist**: `00_IMPLEMENTATION/MIGRATING_TO_N8N/DEPLOYMENT_CHECKLIST.md`
2. Upload CSV schema to n8n → Create Data Table
3. Import workflow JSON to n8n → Update Data Table IDs
4. Test webhook endpoints (5 test scenarios)
5. Test round-trip flow: Export → Upload → Clone → Export
6. Mark SP_029 as 100% complete in PROGRESS.md

---

## 🎯 Objective

Enable admin users to upload Excel files exported by the system, reverse-engineer them back into `ExportProjectData` JSON format, and store them as templates in n8n Data Tables for public browsing.

**Core Goal**: Implement the exact reverse operation of `excelExportService.ts` - read Excel files, extract all 7 tabs, transform to JSON, and store in n8n without any intermediate transformations.

**Key Innovation**: **Zero transformation approach** - Excel exports become templates directly, eliminating the multi-step transformation bugs we've been fighting.

---

## 📋 Problem Statement

### Current Approach Issues ❌

**Flow**:
```
Excel File
  ↓ [n8n parses Excel + transforms to flat keys]
Template with vendor_001:crit_001 structure
  ↓ [templateService transforms flat → nested]
Frontend nested structure
  ↓ [Multiple bugs from transformations]
```

**Problems**:
1. ❌ 3 transformation steps = 3 places for bugs
2. ❌ Stage1 structure mismatches (just fixed in session)
3. ❌ Field mapping errors (match_status vs value)
4. ❌ Wrapped vs unwrapped data confusion
5. ❌ Vendor loading failures
6. ❌ Comparison matrix empty despite data

### New Approach ✅

**Flow**:
```
Excel File
  ↓ [Frontend: excelImportService.ts reads Excel]
ExportProjectData JSON (exact format from excelExportService.ts)
  ↓ [n8n: Store JSON in Data Table as-is]
Template JSON (same structure)
  ↓ [templateService: Use data directly, NO transformation]
Frontend (works immediately!)
  ↓ [excelExportService: Export back to Excel]
Excel File (perfect round-trip)
```

**Benefits**:
1. ✅ **Zero transformations** - data flows unchanged
2. ✅ **Type safety** - ExportProjectData interface enforces structure
3. ✅ **No bugs** - what you export is what you import
4. ✅ **Perfect round-trip** - export → upload → clone → export = identical
5. ✅ **Easy debugging** - one data structure everywhere
6. ✅ **Future-proof** - add fields to ExportProjectData, everything just works

---

## 🎯 Sprint Requirements

### 1. Admin Mode Toggle (Reuse from SP_028)

**Implementation**: Use existing localStorage key from SP_028 (if already implemented)

```typescript
// Check admin mode
const isAdminMode = localStorage.getItem('clarioo_admin_mode') === 'true';
```

**If SP_028 not yet implemented**, add simple admin check:
- Admin passcode: `71956`
- localStorage key: `clarioo_admin_mode`
- Toggle in settings or bottom of page
- Show "Admin mode activated" toast

**For this sprint**: We only need the boolean check, not the full toggle UI (can be added later).

### 2. Upload Excel Button in TemplatesModal

**Location**: Bottom of TemplatesModal (below template grid)

**Design**:
```tsx
{isAdminMode && (
  <div className="mt-6 pt-6 border-t border-gray-200">
    <Button
      variant="outline"
      onClick={handleUploadClick}
      className="w-full"
    >
      <Upload className="w-4 h-4 mr-2" />
      Upload Excel Template
    </Button>
    <input
      ref={fileInputRef}
      type="file"
      accept=".xlsx"
      onChange={handleFileSelect}
      className="hidden"
    />
  </div>
)}
```

**Behavior**:
- Click button → triggers hidden file input
- User selects `.xlsx` file
- Show loading state with progress indicator
- Parse Excel → Generate JSON → Upload to n8n
- On success: Refresh template list, show success toast
- On error: Show error toast with details

### 3. Excel Import Service (`src/services/excelImportService.ts`)

**Purpose**: Reverse-engineer Excel files back to `ExportProjectData` format

**Key Function**:
```typescript
/**
 * Import Excel file and convert to ExportProjectData JSON
 * Exact reverse of exportProjectToExcel() in excelExportService.ts
 *
 * @param file - Excel file (.xlsx only)
 * @returns ExportProjectData or error
 */
export async function importExcelTemplate(
  file: File
): Promise<{
  success: boolean;
  data?: Partial<ExportProjectData>;
  errors?: string[];
  warnings?: string[];
}>;
```

**Implementation Strategy**:

#### Step 1: Read Excel File
```typescript
import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(await file.arrayBuffer());
```

#### Step 2: Validate Basic Structure
```typescript
// Check for required tabs
const requiredTabs = ['INDEX', '1. Evaluation Criteria'];
const missingTabs = requiredTabs.filter(name => !workbook.getWorksheet(name));

if (missingTabs.length > 0) {
  return {
    success: false,
    errors: [`Missing required tabs: ${missingTabs.join(', ')}`]
  };
}
```

#### Step 3: Extract INDEX Tab (Tab 0)
```typescript
const indexSheet = workbook.getWorksheet('INDEX');

// Extract project metadata (rows with labels in column A)
const projectName = findCellValue(indexSheet, 'Project Name:');
const category = findCellValue(indexSheet, 'Software Category:');
const searchedBy = findCellValue(indexSheet, 'Searched By:');
const keyFeatures = findCellValue(indexSheet, 'Key Features:');
const clientQuote = findCellValue(indexSheet, 'Client Quote:');
const currentTools = findCellValue(indexSheet, 'Current Tools:');
const companyContext = findCellValue(indexSheet, 'Company Context:');
const solutionRequirements = findCellValue(indexSheet, 'Solution Requirements:');
const description = findCellValue(indexSheet, 'Description:');

// Helper function to find cell value by label in column A
function findCellValue(sheet, label: string): string | undefined {
  for (let row = 1; row <= sheet.rowCount; row++) {
    const cell = sheet.getCell(`A${row}`);
    if (cell.value === label) {
      return sheet.getCell(`B${row}`).value?.toString();
    }
  }
  return undefined;
}
```

#### Step 4: Extract Criteria (Tab 1)
```typescript
const criteriaSheet = workbook.getWorksheet('1. Evaluation Criteria');

// Header row is row 3, data starts row 4
const criteria: Criterion[] = [];
const dataStartRow = 4;

for (let row = dataStartRow; row <= criteriaSheet.rowCount; row++) {
  const rowData = criteriaSheet.getRow(row);

  // Skip empty rows
  if (!rowData.getCell(2).value) break;

  criteria.push({
    id: `crit_${String(criteria.length + 1).padStart(3, '0')}`,
    name: rowData.getCell(2).value?.toString() || '',
    explanation: rowData.getCell(3).value?.toString() || '',
    importance: (rowData.getCell(4).value?.toString().toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
    type: (rowData.getCell(5).value?.toString().toLowerCase() || 'feature'),
    isArchived: false
  });
}
```

#### Step 5: Extract Vendors (Tab 2)
```typescript
const vendorSheet = workbook.getWorksheet('2. Vendor List');

const vendors: Vendor[] = [];
const vendorDataStartRow = 6; // After header and logo row

for (let row = vendorDataStartRow; row <= vendorSheet.rowCount; row++) {
  const rowData = vendorSheet.getRow(row);

  if (!rowData.getCell(3).value) break;

  vendors.push({
    id: `vendor_${String(vendors.length + 1).padStart(3, '0')}`,
    name: rowData.getCell(3).value?.toString() || '',
    description: rowData.getCell(4).value?.toString() || '',
    website: rowData.getCell(5).value?.toString() || '',
    pricing: '', // Not in Excel export
    rating: 4.0, // Default
    criteriaScores: {}, // Will be populated from comparison matrix
    criteriaAnswers: {}, // Will be populated from detailed matching
    features: [] // Not in Excel export
  });
}
```

#### Step 6: Extract Comparison Matrix (Tab 3) - CRITICAL
```typescript
const comparisonSheet = workbook.getWorksheet('3. Vendor Evaluation');

// Build comparison state in correct nested format
const comparisonMatrix: any = {
  criteria: {},
  activeWorkflows: 0,
  isPaused: false,
  currentCriterionIndex: criteria.length,
  lastUpdated: new Date().toISOString()
};

// Header row tells us vendor order (columns 3+)
const headerRow = comparisonSheet.getRow(5); // After logo row
const vendorColumns: string[] = [];
for (let col = 3; col <= 2 + vendors.length; col++) {
  vendorColumns.push(headerRow.getCell(col).value?.toString() || '');
}

// Data rows start after header
const comparisonDataStartRow = 6;
for (let row = comparisonDataStartRow; row < comparisonDataStartRow + criteria.length; row++) {
  const rowData = comparisonSheet.getRow(row);
  const criterionName = rowData.getCell(2).value?.toString();

  // Find criterion by name
  const criterion = criteria.find(c => c.name === criterionName);
  if (!criterion) continue;

  // Build cells object for this criterion
  const cells: Record<string, any> = {};

  vendorColumns.forEach((vendorName, index) => {
    const vendor = vendors.find(v => v.name === vendorName);
    if (!vendor) return;

    const cellValue = rowData.getCell(3 + index).value?.toString() || 'pending';

    // Map icon back to status
    const iconToStatus: Record<string, string> = {
      '✓': 'yes',
      '⭐': 'star',
      'X': 'no',
      '+/-': 'partial',
      '?': 'unknown',
      '🔄': 'pending'
    };

    cells[vendor.id] = {
      status: 'completed',
      value: iconToStatus[cellValue] || 'pending',
      evidenceUrl: '',
      evidenceDescription: '',
      comment: ''
    };
  });

  comparisonMatrix.criteria[criterion.id] = {
    criterionId: criterion.id,
    stage1Complete: Object.keys(cells).length > 0,
    stage2Status: 'pending',
    cells: cells
  };
}
```

#### Step 7: Extract Detailed Matching (Tab 4)
```typescript
const detailedSheet = workbook.getWorksheet('4. Detailed Matching');

// This populates the evidence fields in comparison matrix cells
const detailedDataStartRow = 4;

for (let row = detailedDataStartRow; row <= detailedSheet.rowCount; row++) {
  const rowData = detailedSheet.getRow(row);

  const vendorName = rowData.getCell(2).value?.toString();
  const criterionName = rowData.getCell(3).value?.toString();
  const evidence = rowData.getCell(5).value?.toString() || '';
  const sourceUrl = rowData.getCell(6).value?.toString() || '';

  const vendor = vendors.find(v => v.name === vendorName);
  const criterion = criteria.find(c => c.name === criterionName);

  if (vendor && criterion && comparisonMatrix.criteria[criterion.id]) {
    const cell = comparisonMatrix.criteria[criterion.id].cells[vendor.id];
    if (cell) {
      cell.evidenceDescription = evidence;
      cell.evidenceUrl = sourceUrl;
    }
  }
}
```

#### Step 8: Extract Battlecards (Tab 5) - OPTIONAL
```typescript
const battlecardsSheet = workbook.getWorksheet('5. Battlecards');
if (!battlecardsSheet) {
  warnings.push('Battlecards tab not found - skipping');
  return;
}

const battlecards: BattlecardRow[] = [];
const battlecardsDataStartRow = 4;

// Vendor names from header row (columns 2+)
const battlecardsHeaderRow = battlecardsSheet.getRow(3);
const battlecardVendorNames: string[] = [];
for (let col = 2; col <= 1 + vendors.length; col++) {
  battlecardVendorNames.push(battlecardsHeaderRow.getCell(col).value?.toString() || '');
}

for (let row = battlecardsDataStartRow; row <= battlecardsSheet.rowCount; row++) {
  const rowData = battlecardsSheet.getRow(row);
  const categoryTitle = rowData.getCell(1).value?.toString();
  if (!categoryTitle) break;

  const cells: BattlecardCell[] = [];
  battlecardVendorNames.forEach((vendorName, index) => {
    const vendor = vendors.find(v => v.name === vendorName);
    if (!vendor) return;

    cells.push({
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      text: rowData.getCell(2 + index).value?.toString() || '',
      source_urls: []
    });
  });

  battlecards.push({
    row_id: `battlecard_${String(battlecards.length + 1).padStart(3, '0')}`,
    category_title: categoryTitle,
    status: 'completed',
    cells: cells
  });
}
```

#### Step 9: Extract Executive Summary (Tab 6) - OPTIONAL
```typescript
const summarySheet = workbook.getWorksheet('6. Pre-Demo Brief');
if (!summarySheet) {
  warnings.push('Pre-Demo Brief tab not found - skipping');
  return;
}

// Read all cells and reconstruct structured executive summary
// This is complex - may just store as plain text initially
const executiveSummary = {
  keyCriteria: [],
  vendorRecommendations: [],
  keyDifferentiators: [],
  riskFactors: {},
  recommendation: {}
};

// For MVP, just store the text content
let summaryText = '';
for (let row = 1; row <= summarySheet.rowCount; row++) {
  const cellValue = summarySheet.getCell(`A${row}`).value?.toString();
  if (cellValue) {
    summaryText += cellValue + '\n';
  }
}
```

#### Step 10: Build Final ExportProjectData
```typescript
const exportData: Partial<ExportProjectData> = {
  projectId: generateTemplateId(), // Generate new template ID
  projectName: projectName || 'Untitled Template',
  projectDescription: description,
  stage: determineStage(criteria, vendors, comparisonMatrix, battlecards, executiveSummary),
  criteria: criteria,
  vendors: vendors,
  comparisonMatrix: comparisonMatrix,
  battlecards: battlecards,
  executiveSummary: executiveSummary,
  // Template-specific metadata
  templateCategory: category || 'Custom',
  softwareCategory: category,
  searchedBy: searchedBy,
  keyFeatures: keyFeatures,
  clientQuote: clientQuote,
  currentTools: currentTools
};

function determineStage(criteria, vendors, comparison, battlecards, summary): ProjectStage {
  if (battlecards && battlecards.length > 0) return 'battlecards_complete';
  if (summary) return 'executive_summary';
  if (comparison && comparison.criteria) return 'comparison_matrix';
  if (vendors && vendors.length > 0) return 'vendors_selected';
  return 'criteria_only';
}

return {
  success: true,
  data: exportData,
  warnings: warnings
};
```

**Error Handling**:
```typescript
// Collect errors but don't fail completely
const errors: string[] = [];
const warnings: string[] = [];

try {
  // Parse each tab
  parseIndexTab(workbook, data, errors);
  parseCriteriaTab(workbook, data, errors);
  parseVendorsTab(workbook, data, errors);

  // Optional tabs
  try {
    parseComparisonMatrixTab(workbook, data, warnings);
  } catch (e) {
    warnings.push(`Comparison matrix parsing failed: ${e.message}`);
  }

  try {
    parseBattlecardsTab(workbook, data, warnings);
  } catch (e) {
    warnings.push(`Battlecards parsing failed: ${e.message}`);
  }

  // Return partial data with warnings
  return {
    success: errors.length === 0,
    data: data,
    errors: errors,
    warnings: warnings
  };
} catch (error) {
  return {
    success: false,
    errors: [`Critical parsing error: ${error.message}`],
    warnings: warnings
  };
}
```

### 4. n8n Data Tables Integration

**Approach**: Store complete ExportProjectData as JSON

**Schema**:
```
Template Data Table Schema:
- template_id (string, primary key)
- template_name (string) - from INDEX tab
- template_category (string) - from INDEX tab
- software_category (string) - from INDEX tab
- searched_by (string) - from INDEX tab
- key_features (text) - from INDEX tab
- client_quote (text) - from INDEX tab
- current_tools (string) - from INDEX tab
- template_data (JSON/TEXT) - Complete ExportProjectData
- created_at (datetime)
- created_by (string) - user email
- upload_source (string) - 'excel_upload'
```

**Upload Function** (`src/services/n8nService.ts`):
```typescript
/**
 * Upload template to n8n Data Tables
 *
 * @param templateData - Complete ExportProjectData from Excel import
 * @returns Template ID and status
 */
export async function uploadTemplate(
  templateData: Partial<ExportProjectData>
): Promise<{
  success: boolean;
  templateId?: string;
  error?: string;
}> {
  const webhookUrl = 'https://n8n.lakestrom.com/webhook/clarioo-upload-template';

  // Get user email for attribution
  const userEmail = getStoredEmail() || 'anonymous';

  const payload = {
    template_id: templateData.projectId || generateTemplateId(),
    template_name: templateData.projectName || 'Untitled Template',
    template_category: templateData.templateCategory || 'Custom',
    software_category: templateData.softwareCategory || '',
    searched_by: templateData.searchedBy || '',
    key_features: templateData.keyFeatures || '',
    client_quote: templateData.clientQuote || '',
    current_tools: templateData.currentTools || '',
    template_data: JSON.stringify(templateData), // Store complete data as JSON
    created_by: userEmail,
    upload_source: 'excel_upload',
    created_at: new Date().toISOString()
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      templateId: payload.template_id
    };
  } catch (error) {
    console.error('[n8n] Template upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}
```

### 5. Update Template Service

**New Flow** (`src/services/templateService.ts`):
```typescript
/**
 * Create project from template (updated for JSON templates)
 * NO MORE TRANSFORMATIONS - use template data directly!
 */
export async function createProjectFromTemplate(
  template: Template
): Promise<{ projectId: string; success: boolean }> {
  const projectId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Parse template_data JSON (already in correct format!)
  const templateData = JSON.parse(template.template_data) as ExportProjectData;

  // Save directly to localStorage - NO TRANSFORMATION NEEDED
  localStorage.setItem(`criteria_${projectId}`, JSON.stringify(templateData.criteria));
  localStorage.setItem(`vendors_${projectId}`, JSON.stringify(templateData.vendors));
  localStorage.setItem(`vendor_selection_${projectId}`, JSON.stringify(
    templateData.vendors?.map(v => v.id) || []
  ));

  // Comparison state - already in correct nested format!
  if (templateData.comparisonMatrix) {
    localStorage.setItem(`comparison_state_${projectId}`, JSON.stringify(templateData.comparisonMatrix));
  }

  // Battlecards - already in correct format!
  if (templateData.battlecards) {
    localStorage.setItem(`clarioo_battlecards_rows_${projectId}`, JSON.stringify(templateData.battlecards));
    localStorage.setItem(`clarioo_battlecards_state_${projectId}`, JSON.stringify({
      rows: templateData.battlecards,
      status: 'completed',
      current_row_index: templateData.battlecards.length,
      timestamp: now
    }));
  }

  // Executive summary - already in correct format!
  if (templateData.executiveSummary) {
    localStorage.setItem(`clarioo_executive_summary_${projectId}`, JSON.stringify(templateData.executiveSummary));
  }

  // Workflow state
  const maxStepReached = determineMaxStep(templateData);
  const workflowState = {
    projectId: projectId,
    currentStep: 'criteria',
    maxStepReached: maxStepReached,
    lastSaved: now,
    criteria: templateData.criteria,
    selectedVendors: templateData.vendors || []
  };
  localStorage.setItem(`workflow_${projectId}`, JSON.stringify(workflowState));

  // Add to projects list
  const projects = JSON.parse(localStorage.getItem('clarioo_projects') || '[]');
  projects.push({
    id: projectId,
    name: templateData.projectName,
    description: templateData.projectDescription || '',
    status: 'draft',
    createdAt: now,
    updatedAt: now
  });
  localStorage.setItem('clarioo_projects', JSON.stringify(projects));

  console.log('[templateService] Created project from template (JSON format):', {
    projectId,
    criteriaCount: templateData.criteria?.length || 0,
    vendorsCount: templateData.vendors?.length || 0,
    hasBattlecards: !!templateData.battlecards,
    hasExecutiveSummary: !!templateData.executiveSummary,
    maxStepReached
  });

  return { projectId, success: true };
}
```

### 6. UI Integration in TemplatesModal

**Component Updates**:
```typescript
// TemplatesModal.tsx

const handleUploadExcel = async (file: File) => {
  setIsUploading(true);
  setUploadProgress(0);

  try {
    // Step 1: Parse Excel (30%)
    setUploadProgress(10);
    const importResult = await importExcelTemplate(file);
    setUploadProgress(30);

    if (!importResult.success) {
      showErrorToast(`Failed to parse Excel: ${importResult.errors?.join(', ')}`);
      return;
    }

    // Show warnings if any
    if (importResult.warnings && importResult.warnings.length > 0) {
      console.warn('[Upload] Warnings:', importResult.warnings);
      showWarningToast(`Template uploaded with warnings: ${importResult.warnings.length} issues`);
    }

    // Step 2: Upload to n8n (70%)
    setUploadProgress(50);
    const uploadResult = await uploadTemplate(importResult.data!);
    setUploadProgress(70);

    if (!uploadResult.success) {
      showErrorToast(`Failed to upload template: ${uploadResult.error}`);
      return;
    }

    // Step 3: Refresh template list (100%)
    setUploadProgress(90);
    await refreshTemplates();
    setUploadProgress(100);

    // Success!
    showSuccessToast(`Template "${importResult.data!.projectName}" uploaded successfully!`);

    // Reset state
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
    }, 1000);

  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    showErrorToast(`Upload failed: ${error.message}`);
  } finally {
    setIsUploading(false);
  }
};
```

**Upload Progress UI**:
```tsx
{isUploading && (
  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-blue-900">
        Uploading template...
      </span>
      <span className="text-sm text-blue-700">{uploadProgress}%</span>
    </div>
    <Progress value={uploadProgress} className="h-2" />
    <p className="text-xs text-blue-600 mt-2">
      {uploadProgress < 30 && 'Parsing Excel file...'}
      {uploadProgress >= 30 && uploadProgress < 70 && 'Uploading to server...'}
      {uploadProgress >= 70 && 'Finalizing...'}
    </p>
  </div>
)}
```

---

## 📁 File Structure

### New Files

```
src/services/
  excelImportService.ts          (500-700 lines)
    - importExcelTemplate()
    - parseIndexTab()
    - parseCriteriaTab()
    - parseVendorsTab()
    - parseComparisonMatrixTab()
    - parseDetailedMatchingTab()
    - parseBattlecardsTab()
    - parseExecutiveSummaryTab()
    - validateExcelStructure()
    - generateTemplateId()

src/components/templates/
  UploadTemplateButton.tsx       (150 lines)
    - File input handling
    - Upload progress
    - Error/success states
    - Admin mode check
```

### Modified Files

```
src/services/
  templateService.ts             (Update createProjectFromTemplate)
  n8nService.ts                  (Add uploadTemplate function)

src/components/templates/
  TemplatesModal.tsx             (Add upload button at bottom)

src/types/
  export.types.ts                (Add TemplateMetadata interface)
  template.types.ts              (Update Template interface)
```

---

## 🧪 Testing Plan

### Unit Tests

**Test Excel Import**:
```typescript
describe('excelImportService', () => {
  test('parses INDEX tab correctly', async () => {
    const file = await loadTestFile('test-template.xlsx');
    const result = await importExcelTemplate(file);

    expect(result.success).toBe(true);
    expect(result.data?.projectName).toBe('Loyalty Management Platform');
    expect(result.data?.searchedBy).toBe('Mid-market retail company');
  });

  test('parses criteria correctly', async () => {
    const file = await loadTestFile('test-template.xlsx');
    const result = await importExcelTemplate(file);

    expect(result.data?.criteria).toHaveLength(17);
    expect(result.data?.criteria?.[0].name).toBe('Points Earning');
    expect(result.data?.criteria?.[0].importance).toBe('high');
  });

  test('handles missing optional tabs gracefully', async () => {
    const file = await loadTestFile('criteria-only-template.xlsx');
    const result = await importExcelTemplate(file);

    expect(result.success).toBe(true);
    expect(result.warnings).toContain('Battlecards tab not found - skipping');
    expect(result.data?.criteria).toBeDefined();
  });

  test('validates required tabs', async () => {
    const file = await loadTestFile('invalid-template.xlsx');
    const result = await importExcelTemplate(file);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Missing required tabs: INDEX, 1. Evaluation Criteria');
  });
});
```

### Integration Tests

**Test Round-Trip**:
```typescript
test('export → upload → clone → export produces identical Excel', async () => {
  // 1. Export existing project
  const originalExport = await exportProjectToExcel({
    projectId: 'test-project',
    projectName: 'Test Project'
  });

  // 2. Import that Excel
  const importResult = await importExcelTemplate(originalExport.blob);
  expect(importResult.success).toBe(true);

  // 3. Create project from imported data
  const { projectId } = await createProjectFromTemplate({
    template_id: 'test-template',
    template_data: JSON.stringify(importResult.data)
  });

  // 4. Export the cloned project
  const clonedExport = await exportProjectToExcel({
    projectId: projectId,
    projectName: 'Test Project'
  });

  // 5. Compare exports (should be identical)
  expect(clonedExport.filename).toBe(originalExport.filename);
  // Deep comparison of data...
});
```

### Manual Testing

**Test Scenarios**:

1. **Admin Mode Toggle**
   - Toggle admin mode with passcode
   - Verify "Upload Template Excel" button appears
   - Verify button hidden when admin mode off

2. **Upload Valid Excel**
   - Export a completed project
   - Toggle admin mode
   - Upload that Excel file
   - Verify parsing success
   - Verify template appears in list
   - Clone template
   - Verify all data loads correctly

3. **Upload Criteria-Only Excel**
   - Export project with only criteria
   - Upload Excel
   - Verify partial template created
   - Clone and verify only criteria loads

4. **Upload Invalid Excel**
   - Upload random Excel file
   - Verify validation error shown
   - Verify no partial template created

5. **Upload Excel with Warnings**
   - Upload Excel missing optional tabs
   - Verify warning toast shown
   - Verify partial template created
   - Clone and verify available data loads

6. **Round-Trip Test**
   - Export project → Upload → Clone → Export
   - Verify final export matches original

---

## ✅ Success Criteria

### Technical Requirements
- [ ] excelImportService.ts successfully parses all 7 Excel tabs
- [ ] ExportProjectData JSON format matches excelExportService.ts output
- [ ] n8n uploadTemplate webhook stores JSON in Data Tables
- [ ] templateService.ts uses template JSON directly (no transformations)
- [ ] Admin mode toggle functional (localStorage-based)
- [ ] Upload button appears only for admin users
- [ ] File validation prevents invalid Excel uploads
- [ ] Partial uploads work with warnings (missing optional tabs)
- [ ] Empty templates allowed (criteria-only minimum)

### Data Integrity
- [ ] INDEX tab metadata extracted correctly (8 fields)
- [ ] Criteria parsed with correct types and importance
- [ ] Vendors parsed with descriptions and websites
- [ ] Comparison matrix in correct nested format (criteria → vendors → cells)
- [ ] Detailed matching evidence populates cell fields
- [ ] Battlecards parsed with transposed layout (optional)
- [ ] Executive summary structure preserved (optional)
- [ ] Vendor logos NOT extracted (fetch fresh on use)
- [ ] Scatter plot NOT extracted (regenerate on use)

### User Experience
- [ ] Upload button at bottom of TemplatesModal
- [ ] Loading state with progress indicator (0% → 100%)
- [ ] Success toast: "Template [name] uploaded successfully!"
- [ ] Error toast with clear error messages
- [ ] Warning toast for partial uploads
- [ ] Template appears immediately in list after upload
- [ ] Template cards show metadata (category, searched by, key features)
- [ ] Clone template → all data populates correctly

### Round-Trip Test
- [ ] Export → Upload → Clone → Export produces identical data
- [ ] No transformation errors
- [ ] No data loss
- [ ] Perfect data integrity

---

## 📊 Expected Impact

### Code Quality
- ✅ **Zero transformation bugs** - data unchanged through entire flow
- ✅ **50% less code** - eliminate transformation logic from templateService
- ✅ **Type safety** - ExportProjectData enforces structure
- ✅ **Easy maintenance** - one data structure everywhere
- ✅ **Future-proof** - add fields without touching multiple services

### User Benefits
- ✅ **Easy template creation** - any exported project becomes a template
- ✅ **Perfect data fidelity** - what you export is what you import
- ✅ **Admin control** - only admins can upload
- ✅ **Immediate availability** - uploaded templates appear instantly
- ✅ **Flexible templates** - partial templates (criteria-only) supported
- ✅ **No transformation bugs** - stage1 structure issues eliminated

### Technical Benefits
- ✅ **Eliminates 3 transformation steps**
- ✅ **Fixes all structure mismatch bugs permanently**
- ✅ **Simplifies templateService by ~200 lines**
- ✅ **Makes debugging trivial** (data never changes format)
- ✅ **Enables perfect round-trip** (export = import)

---

## 🚀 Implementation Order

### Day 1: Excel Import Foundation
1. Create excelImportService.ts
2. Implement parseIndexTab (metadata extraction)
3. Implement parseCriteriaTab
4. Implement parseVendorsTab
5. Write unit tests for basic parsing

### Day 2: Comparison Data Parsing
1. Implement parseComparisonMatrixTab (critical!)
2. Implement parseDetailedMatchingTab
3. Verify nested structure matches excelExportService
4. Write round-trip test for comparison data

### Day 3: Optional Tabs + n8n Integration
1. Implement parseBattlecardsTab (optional)
2. Implement parseExecutiveSummaryTab (optional)
3. Add uploadTemplate function to n8nService
4. Create n8n webhook and Data Table schema
5. Test full upload flow

### Day 4: UI Integration + Testing
1. Add admin mode check (reuse from SP_028 or implement simple version)
2. Add upload button to TemplatesModal
3. Integrate import → upload flow
4. Add progress indicators and toasts
5. Update templateService to use JSON directly
6. Run full manual testing suite
7. Verify round-trip test passes

---

## 📝 Notes

### Why This Approach is Superior

**Previous Approach Problems**:
1. Excel → n8n parses/transforms → Template (flat keys) → Frontend transforms → Nested structure
2. Result: 3 transformations, 3 places for bugs
3. We spent this entire session fixing structure mismatches

**New Approach Benefits**:
1. Excel → Frontend parses → ExportProjectData JSON → n8n stores as-is → Frontend uses directly
2. Result: 0 transformations, 0 places for bugs
3. What you export is exactly what you import

### Template Metadata Fields (from INDEX tab)

**Required**:
- Project Name (becomes template name)

**Optional (displayed on template cards)**:
- Software Category (e.g., "Loyalty Management")
- Searched By (e.g., "Mid-market retail company")
- Key Features (bullet points)
- Client Quote (testimonial-style text)
- Current Tools (comma-separated)
- Company Context (stored but not displayed on card)
- Solution Requirements (stored but not displayed on card)
- Description (stored but not displayed on card)

### Admin Mode Implementation

**Simple version for this sprint**:
```typescript
// Check if admin
const ADMIN_PASSCODE = '71956';
const isAdmin = localStorage.getItem('clarioo_admin_mode') === 'true';

// Toggle admin mode (can be a simple settings option)
function toggleAdminMode() {
  const passcode = prompt('Enter admin passcode:');
  if (passcode === ADMIN_PASSCODE) {
    localStorage.setItem('clarioo_admin_mode', 'true');
    showToast('Admin mode activated');
  } else {
    showToast('Invalid passcode');
  }
}
```

Full admin UI can be implemented in SP_028 or later sprint.

---

## 🔗 Dependencies

**Required**:
- ExcelJS library (already installed for SP_027)
- excelExportService.ts (SP_027 - provides ExportProjectData type)
- n8n Data Tables (infrastructure requirement)

**Optional**:
- Admin mode toggle UI from SP_028 (if not yet implemented, use simple passcode check)

---

## 📚 Documentation Updates

### Update After Sprint
- [ ] PROJECT_ROADMAP.md - Add SP_029
- [ ] PROGRESS.md - Document sprint completion
- [ ] FEATURE_LIST.md - Add "Excel Template Upload"
- [ ] USER_STORIES.md - Add admin template management stories
- [ ] Create EXCEL_IMPORT_GUIDE.md - How to create templates from Excel

---

**Sprint Owner**: Engineering Team
**Created**: January 15, 2026
**Last Updated**: January 15, 2026
**Status**: 📋 PLANNED - Ready to implement
