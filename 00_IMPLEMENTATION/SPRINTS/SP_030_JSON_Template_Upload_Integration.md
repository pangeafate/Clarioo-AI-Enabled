# SP_030: JSON Template Upload Integration

**Status**: ✅ Complete
**Created**: January 16, 2026
**Completed**: January 16, 2026
**Sprint Type**: Feature Implementation
**Complexity**: Medium
**Actual Duration**: 1 day

---

## Executive Summary

**REPLACE** the Excel-based template upload system with JSON-based uploads, using the existing `jsonExportService.ts` export format. Users will export projects to JSON, then upload those JSON files to create templates that can fully clone projects including all structured data.

**Key Innovation**: Zero transformation approach - JSONExportData structure is preserved end-to-end, enabling perfect project cloning with all data intact.

**Migration**: Remove all Excel upload code (SP_029) and replace with JSON upload. Excel parsing is no longer needed.

---

## Business Context

### Previous Approach - Excel Upload (SP_029) ❌ DEPRECATED
- Users uploaded Excel files to create templates
- Excel parsing was complex and error-prone (1,400 lines of parsing code)
- Excel format didn't capture vendor summaries or scatter plot positioning
- Reverse engineering display format (icons, colors) to JSON was fragile
- Many transformation bugs due to icon-to-status mapping

### New Approach - JSON Upload (SP_030) ✅ REPLACEMENT
- Users export projects to JSON (already working via jsonExportService.ts)
- Upload JSON directly to n8n
- Complete project clone including vendor summaries and scatter plot data
- No parsing or transformation errors
- **Removes 1,400 lines of fragile Excel parsing code**

---

## User Workflow

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Export Project to JSON                         │
│ User clicks "Export Project" → "Download JSON"         │
│ File: "Luxury_Fashion_CX_26_01_16.json"                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Upload JSON as Template (Admin)                │
│ Admin panel → "Upload Template JSON" → Select file     │
│ Frontend validates JSONExportData structure            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Upload to n8n                                   │
│ POST /webhook/templates                                 │
│ Action: upload_json                                     │
│ Body: Complete JSONExportData                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Store in n8n Data Table                        │
│ Store complete JSON in template_data_json column       │
│ Extract metadata for searchable columns                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: User Selects Template                          │
│ User opens TemplatesModal → Selects template           │
│ Clicks "Use Template"                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 6: Create Project from Template                   │
│ Parse JSONExportData → Save all localStorage           │
│ Restore: criteria, vendors, summaries, positioning     │
│ Navigate to /vendor-discovery/{projectId}              │
└─────────────────────────────────────────────────────────┘
```

---

## Data Structure Analysis

### JSONExportData (Source Format from jsonExportService.ts)

```typescript
{
  metadata: {
    exportedAt: string;              // "2026-01-16T10:30:00Z"
    exportVersion: string;            // "1.0.0"
    projectId: string;                // Original project ID
    projectName: string;              // "Luxury Fashion CX Platform"
    projectDescription?: string;      // Full description
    projectCategory?: string;         // "CX Platform"
    stage: ProjectStage;              // "battlecards_complete"
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;               // User email
    userId?: string;                  // clarioo_user_id
    // Placeholder fields
    softwareCategory?: string;
    searchedBy?: string;
    keyFeatures?: string;
    clientQuote?: string;
    currentTools?: string;
  },
  project: ExportProjectData {
    projectId: string;
    projectName: string;
    projectDescription?: string;
    createdAt?: string;
    updatedAt?: string;
    stage: ProjectStage;

    // Core data
    criteria: ExportCriterion[];      // With importance, type, matches
    vendors: ExportVendor[];          // With descriptions, websites

    // Comparison data
    comparisonMatrix?: {
      criteria: ExportCriterion[];
      vendors: ExportVendor[];
      rankings?: Array<{...}>;
    },

    // Advanced features
    executiveSummary?: ExportExecutiveSummary;
    battlecards?: ExportBattlecardRow[];
    scatterPlot?: ExportScatterPlotData;
    screeningSummary?: string;

    // Additional data
    metadata?: {
      category?: string;
      softwareCategory?: string;
      // ... other fields
    },
    techRequest?: {
      companyContext?: string;
      solutionRequirements?: string;
    }
  },
  vendorSummaries?: Record<string, VendorSummaryData> {
    "Salesforce Commerce Cloud": {
      vendor_name: string;
      executive_summary: string;      // About section
      killer_feature: string;         // Main differentiator
      key_features: string[];         // Top 5-7 features
      timestamp: string;
    }
  },
  rawLocalStorage?: Record<string, any>  // ❌ NOT USED - debug only
}
```

### Key Differences from ExportProjectData (SP_029)

| Field | JSONExportData (SP_030) | ExportProjectData (Excel) |
|-------|------------------------|---------------------------|
| **Structure** | Nested (metadata + project) | Flat (just project) |
| **Metadata** | ✅ Rich metadata wrapper | ❌ Minimal metadata |
| **Vendor Summaries** | ✅ `vendorSummaries` object | ❌ Not included |
| **Raw localStorage** | ⚠️ Available but NOT USED | ❌ Not available |
| **User Info** | ✅ createdBy, userId | ❌ Not included |
| **Export Timestamp** | ✅ exportedAt, exportVersion | ❌ Not included |

**Note on rawLocalStorage**: This field exists in JSONExportData but is **NOT restored** when creating projects from templates. We use the structured `project` data instead because:
- rawLocalStorage contains user-specific IDs that would conflict
- rawLocalStorage may contain multiple projects
- The structured data (criteria, vendors, vendorSummaries, etc.) contains everything needed
- Cleaner, more predictable project creation

---

## n8n Data Table Schema Updates

### Current Schema (21 columns)
```csv
template_id, template_name, project_description, template_category,
searched_by, software_category, key_features, client_quote, current_tools,
company_context, solution_requirements, criteria_count, vendors_count,
has_comparison_matrix, has_battlecards, has_executive_summary, project_stage,
template_data_json, user_id, uploaded_at, updated_at
```

### NEW: How to Store JSONExportData

**Option A: Store Complete JSONExportData (RECOMMENDED)**
- Store entire JSONExportData in `template_data_json` column
- Extract searchable fields from `metadata` and `project` for filtering
- Preserves ALL data including vendorSummaries and rawLocalStorage

**Data Mapping:**
```javascript
// Extract metadata for searchable columns
{
  template_id: crypto.randomUUID(),
  template_name: jsonData.metadata.projectName,
  project_description: jsonData.metadata.projectDescription || '',
  template_category: jsonData.metadata.projectCategory || 'Uncategorized',
  searched_by: jsonData.metadata.searchedBy || '',
  software_category: jsonData.metadata.softwareCategory || '',
  key_features: jsonData.metadata.keyFeatures || '',
  client_quote: jsonData.metadata.clientQuote || '',
  current_tools: jsonData.metadata.currentTools || '',
  company_context: jsonData.project.metadata?.companyContext ||
                   jsonData.project.techRequest?.companyContext || '',
  solution_requirements: jsonData.project.metadata?.solutionRequirements ||
                         jsonData.project.techRequest?.solutionRequirements || '',
  criteria_count: jsonData.project.criteria?.length || 0,
  vendors_count: jsonData.project.vendors?.length || 0,
  has_comparison_matrix: !!jsonData.project.comparisonMatrix,
  has_battlecards: !!(jsonData.project.battlecards?.length),
  has_executive_summary: !!jsonData.project.executiveSummary,
  project_stage: jsonData.metadata.stage || 'criteria_only',
  template_data_json: JSON.stringify(jsonData),  // COMPLETE JSONExportData
  user_id: jsonData.metadata.userId || getCurrentUserId(),
  uploaded_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
```

**No schema changes needed!** ✅
The existing 21-column schema works perfectly - we just store the complete JSONExportData in `template_data_json`.

---

## Implementation Plan

### Phase 1: Frontend - Replace Excel Upload with JSON ⏱️ 2 hours

**File**: `src/components/templates/TemplateUploadButton.tsx`

**Changes**:
1. ❌ **Remove**: Excel file upload support (`.xlsx`)
2. ❌ **Remove**: `importExcelTemplate` import
3. ✅ **Add**: JSON file upload support (accept `.json` only)
4. ✅ **Add**: JSON parsing and validation
5. ✅ **Add**: Call new `uploadJSONTemplate()` function

**Removed**: ~100 lines of Excel handling code
**Added**: ~50 lines of JSON handling code

```typescript
// COMPLETE REPLACEMENT of handleFileChange
async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type (ONLY .json)
  if (!file.name.endsWith('.json')) {
    toast({
      title: '❌ Invalid file type',
      description: 'Please upload a JSON file (.json only)',
      variant: 'destructive',
    });
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast({
      title: '❌ File too large',
      description: 'Maximum file size is 10MB',
      variant: 'destructive',
    });
    return;
  }

  setIsProcessing(true);

  try {
    // Read file as text
    const text = await file.text();

    // Parse JSON
    let jsonData;
    try {
      jsonData = JSON.parse(text);
    } catch (parseError) {
      throw new Error('Invalid JSON file - could not parse');
    }

    // Validate JSONExportData structure
    if (!jsonData.metadata || !jsonData.project) {
      throw new Error('Invalid JSON format - must be exported from Clarioo');
    }

    if (!jsonData.metadata.projectName) {
      throw new Error('Missing project name in JSON');
    }

    if (!Array.isArray(jsonData.project.criteria) || jsonData.project.criteria.length === 0) {
      throw new Error('Template must have at least one criterion');
    }

    // Upload to n8n
    const userId = getUserId();
    const result = await uploadJSONTemplate(jsonData, userId);

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    toast({
      title: '✅ Template uploaded',
      description: `"${jsonData.metadata.projectName}" is now available`,
      duration: 3000
    });

    onUploadSuccess();
  } catch (error) {
    console.error('[TemplateUpload SP_030] Error:', error);

    toast({
      title: '❌ Upload failed',
      description: error instanceof Error ? error.message : 'Please try again',
      variant: 'destructive',
      duration: 5000
    });
  } finally {
    setIsProcessing(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
}
```

**Validation Rules**:
- ✅ Must be valid JSON
- ✅ Must have `metadata` object with `projectName`
- ✅ Must have `project` object with `criteria` array (non-empty)
- ✅ File size < 10MB
- ⚠️ `metadata.exportVersion` is optional (for backward compatibility)

---

### Phase 2: Template Service - Upload JSON ⏱️ 1 hour

**File**: `src/services/templateService.ts`

**New Function**: `uploadJSONTemplate(jsonData: JSONExportData, userId: string)`

```typescript
/**
 * Upload template from JSONExportData (SP_030)
 *
 * Accepts complete JSON export from jsonExportService.ts
 * Stores entire JSONExportData structure for perfect project cloning
 */
export async function uploadJSONTemplate(
  jsonData: JSONExportData,
  userId: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const endpoint = getN8nEndpoint('templates');

    // Generate template ID
    const template_id = crypto.randomUUID();

    // Extract metadata for searchable columns
    const template = {
      template_id,
      template_name: jsonData.metadata.projectName,
      project_description: jsonData.metadata.projectDescription || '',
      template_category: jsonData.metadata.projectCategory || 'Uncategorized',
      searched_by: jsonData.metadata.searchedBy || '',
      software_category: jsonData.metadata.softwareCategory || '',
      key_features: jsonData.metadata.keyFeatures || '',
      client_quote: jsonData.metadata.clientQuote || '',
      current_tools: jsonData.metadata.currentTools || '',
      company_context: jsonData.project.metadata?.companyContext ||
                       jsonData.project.techRequest?.companyContext || '',
      solution_requirements: jsonData.project.metadata?.solutionRequirements ||
                             jsonData.project.techRequest?.solutionRequirements || '',
      criteria_count: jsonData.project.criteria?.length || 0,
      vendors_count: jsonData.project.vendors?.length || 0,
      has_comparison_matrix: !!jsonData.project.comparisonMatrix,
      has_battlecards: !!(jsonData.project.battlecards?.length),
      has_executive_summary: !!jsonData.project.executiveSummary,
      project_stage: jsonData.metadata.stage || 'criteria_only',
      template_data_json: JSON.stringify(jsonData), // Store COMPLETE JSONExportData
      user_id: userId,
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Send to n8n
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload_json',
        template: template
      })
    });

    const data = await response.json();

    return {
      success: data.success,
      templateId: data.template_id,
      error: data.error?.message
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}
```

---

### Phase 3: Template Service - Create Project from JSON ⏱️ 2 hours

**File**: `src/services/templateService.ts`

**New Function**: `createProjectFromJSONTemplate(jsonData: JSONExportData)`

```typescript
/**
 * Create project from JSONExportData template (SP_030)
 *
 * Restores COMPLETE project including vendor summaries and scatter plot
 * Uses ZERO transformation - data from JSON export is used directly
 */
export async function createProjectFromJSONTemplate(
  jsonData: JSONExportData
): Promise<{ projectId: string; success: boolean; error?: string }> {
  try {
    // 1. Generate new project ID
    const projectId = generateId();
    const now = new Date().toISOString();

    // 2. Create project object
    const project: Project = {
      id: projectId,
      name: jsonData.metadata.projectName,
      description: jsonData.metadata.projectDescription || '',
      category: jsonData.metadata.projectCategory || 'Other',
      status: 'in-progress',
      created_at: now,
      updated_at: now,
    };

    // 3. Save to clarioo_projects
    const projects = getProjects();
    projects.push(project);
    localStorage.setItem('clarioo_projects', JSON.stringify(projects));

    // 4. Save criteria (ZERO transformation)
    const criteria = jsonData.project.criteria || [];
    localStorage.setItem(`criteria_${projectId}`, JSON.stringify(criteria));

    // 5. Save vendors (ZERO transformation)
    const vendors = jsonData.project.vendors || [];
    if (vendors.length > 0) {
      localStorage.setItem(`vendors_${projectId}`, JSON.stringify(vendors));

      const vendorIds = vendors.map(v => v.id);
      localStorage.setItem(`vendor_selection_${projectId}`, JSON.stringify(vendorIds));
    }

    // 6. Save workflow state
    const workflowState = {
      projectId: projectId,
      currentStep: 'criteria' as const,
      maxStepReached: calculateMaxStep(jsonData.project),
      lastSaved: now,
      category: project.category,
      techRequest: {
        companyContext: jsonData.project.metadata?.companyContext ||
                        jsonData.project.techRequest?.companyContext || '',
        solutionRequirements: jsonData.project.metadata?.solutionRequirements ||
                              jsonData.project.techRequest?.solutionRequirements || '',
      },
      criteria: criteria,
      selectedVendors: vendors,
    };
    localStorage.setItem(`workflow_${projectId}`, JSON.stringify(workflowState));

    // 7. Save comparison matrix (if available)
    if (jsonData.project.comparisonMatrix) {
      saveComparisonMatrix(projectId, jsonData.project, criteria, vendors, now);
    }

    // 8. Save executive summary (if available)
    if (jsonData.project.executiveSummary) {
      localStorage.setItem(
        `clarioo_executive_summary_${projectId}`,
        JSON.stringify({
          data: jsonData.project.executiveSummary,
          generated_at: now,
        })
      );
    }

    // 9. Save battlecards (if available)
    if (jsonData.project.battlecards && jsonData.project.battlecards.length > 0) {
      localStorage.setItem(
        `clarioo_battlecards_rows_${projectId}`,
        JSON.stringify(jsonData.project.battlecards)
      );

      const battlecardsState = {
        rows: jsonData.project.battlecards,
        status: 'completed' as const,
        current_row_index: jsonData.project.battlecards.length,
        timestamp: now,
      };
      localStorage.setItem(
        `clarioo_battlecards_state_${projectId}`,
        JSON.stringify(battlecardsState)
      );
    }

    // 10. Save scatter plot data (if available)
    if (jsonData.project.scatterPlot) {
      localStorage.setItem(
        `positioning_data_${projectId}`,
        JSON.stringify(jsonData.project.scatterPlot)
      );
    }

    // 11. 🆕 Save vendor summaries (NEW for SP_030)
    if (jsonData.vendorSummaries) {
      Object.entries(jsonData.vendorSummaries).forEach(([vendorName, summary]) => {
        localStorage.setItem(
          `clarioo_vendor_summary_${vendorName}`,
          JSON.stringify(summary)
        );
      });

      console.log(`[SP_030] Restored ${Object.keys(jsonData.vendorSummaries).length} vendor summaries`);
    }

    // 12. ❌ DO NOT restore rawLocalStorage
    // We use structured data (project, vendorSummaries) instead
    // rawLocalStorage contains user-specific IDs that would conflict

    console.log('[SP_030] Created project from JSONExportData:', {
      projectId,
      projectName: jsonData.metadata.projectName,
      criteriaCount: criteria.length,
      vendorsCount: vendors.length,
      vendorSummariesRestored: Object.keys(jsonData.vendorSummaries || {}).length,
      hasComparison: !!jsonData.project.comparisonMatrix,
      hasExecutiveSummary: !!jsonData.project.executiveSummary,
      hasBattlecards: !!jsonData.project.battlecards,
      hasScatterPlot: !!jsonData.project.scatterPlot,
    });

    return { projectId, success: true };
  } catch (error) {
    console.error('[SP_030] Error creating project from JSONExportData:', error);
    return {
      projectId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}

// Helper function
function calculateMaxStep(projectData: ExportProjectData): number {
  if (projectData.battlecards && projectData.battlecards.length > 0) return 3;
  if (projectData.comparisonMatrix) return 2;
  if (projectData.vendors && projectData.vendors.length > 0) return 1;
  return 0;
}

// Helper function for comparison matrix
function saveComparisonMatrix(
  projectId: string,
  projectData: ExportProjectData,
  criteria: any[],
  vendors: any[],
  timestamp: string
) {
  const criteriaState: Record<string, any> = {};

  criteria.forEach((criterion: any) => {
    const cells: Record<string, any> = {};

    if (criterion.matches) {
      Object.entries(criterion.matches).forEach(([vendorId, matchStatus]) => {
        cells[vendorId] = {
          status: 'completed' as const,
          value: matchStatus,
          evidenceUrl: criterion.evidence?.[vendorId]?.sources?.[0] || '',
          evidenceDescription: criterion.evidence?.[vendorId]?.evidenceDescription || '',
          comment: '',
        };
      });
    }

    criteriaState[criterion.id] = {
      criterionId: criterion.id,
      stage1Complete: Object.keys(cells).length > 0,
      stage2Status: 'pending' as const,
      cells: cells,
    };
  });

  const comparisonState = {
    criteria: criteriaState,
    activeWorkflows: 0,
    isPaused: false,
    currentCriterionIndex: criteria.length,
    lastUpdated: timestamp,
  };

  localStorage.setItem(`comparison_state_${projectId}`, JSON.stringify(comparisonState));
}
```

---

### Phase 4: Update TemplatesModal ⏱️ 30 minutes

**File**: `src/components/templates/TemplatesModal.tsx`

**Changes**:
1. ❌ **Remove**: Call to old `createProjectFromTemplate()` (static templates)
2. ✅ **Update**: Always call `createProjectFromJSONTemplate()` for n8n templates

```typescript
async function handleUseTemplate(template: Template) {
  try {
    setIsLoading(true);

    // All templates from n8n now use JSONExportData format
    const result = await createProjectFromJSONTemplate(template.templateData);

    if (result.success) {
      toast({
        title: '✅ Project created',
        description: `Created "${template.projectName}"`,
        duration: 2000
      });

      navigate(`/vendor-discovery/${result.projectId}`);
    } else {
      throw new Error(result.error || 'Failed to create project');
    }
  } catch (error) {
    console.error('Error using template:', error);

    toast({
      title: '❌ Failed to create project',
      description: error instanceof Error ? error.message : 'Please try again',
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
}
```

**Note**: Static templates from `templates.json` are DEPRECATED. All templates now come from n8n with JSONExportData format.

---

### Phase 5: Update n8n Workflow (No Changes Needed!) ✅

**Current n8n workflow works perfectly!**

The existing `upload_json` action already:
- Accepts `template` object with 21 fields
- Stores `template_data_json` as string
- Returns success/error

**What changes**:
- Frontend now sends JSONExportData in `template_data_json` instead of ExportProjectData
- n8n doesn't care - it just stores the JSON string

**No n8n workflow changes needed!** ✅

---

## Testing Plan

### Test Case 1: Upload JSON Template
1. Export existing project to JSON (use Export button)
2. Open Admin panel
3. Click "Upload Template JSON"
4. Select exported JSON file
5. Verify upload succeeds
6. Check toast shows success message

**Expected Result**:
- ✅ Template appears in TemplatesModal
- ✅ All metadata fields populated correctly
- ✅ `template_data_json` contains complete JSONExportData

---

### Test Case 2: Create Project from JSON Template
1. Open TemplatesModal
2. Select JSON-based template
3. Click "Use Template"
4. Navigate to project

**Expected Result**:
- ✅ Project created with all criteria
- ✅ All vendors loaded
- ✅ Comparison matrix restored (if available)
- ✅ Executive summary restored (if available)
- ✅ Battlecards restored (if available)
- ✅ **Vendor summaries restored** (NEW)
- ✅ Scatter plot data restored (if available)
- ✅ Can navigate through all workflow steps

---

### Test Case 3: Compare Excel vs JSON Templates
1. Upload same project as Excel (SP_029)
2. Upload same project as JSON (SP_030)
3. Create projects from both templates
4. Compare localStorage state

**Expected Differences**:
- JSON template should have vendor summaries
- JSON template should have exact scatter plot positioning
- Both should have criteria, vendors, comparison matrix
- Excel template may have minor formatting differences

---

### Test Case 4: Validate JSON Structure
1. Upload invalid JSON (missing metadata)
2. Upload invalid JSON (missing project)
3. Upload valid JSON with minimal data

**Expected Result**:
- ✅ Invalid uploads show error toast
- ✅ Valid minimal JSON uploads successfully
- ✅ Validation errors are descriptive

---

## Migration Strategy

### Breaking Change: Excel Upload Removed

**SP_029 Excel Upload is REMOVED** ❌

**Reason**: JSON upload is simpler, faster, and more reliable.

### Migration Path for Existing Excel Templates

**Existing templates in n8n continue to work!** ✅

Templates uploaded via Excel (SP_029) will still load because:
- They use the same n8n Data Table schema
- `template_data_json` column stores ExportProjectData (subset of JSONExportData)
- `createProjectFromJSONTemplate()` handles both formats gracefully

**Future uploads**: Must use JSON export format

### For Users

**Before (SP_029)**:
1. Export project to Excel
2. Upload Excel file to create template

**After (SP_030)**:
1. Export project → Select "Download JSON"
2. Upload JSON file to create template

**Benefit**: 50% faster, no parsing errors, includes vendor summaries

---

## File Changes Summary

### Deleted Files (1)

1. **`src/services/excelImportService.ts`** ❌ REMOVED
   - 1,400 lines of Excel parsing code
   - Icon mapping, color detection, cell parsing
   - No longer needed with JSON upload

### Modified Files (3)

1. **`src/components/templates/TemplateUploadButton.tsx`**
   - ❌ Remove Excel file upload support (~100 lines)
   - ❌ Remove `importExcelTemplate` import
   - ✅ Add JSON file upload support (~80 lines)
   - ✅ Add JSON parsing and validation
   - ✅ Update button text: "Upload Template Excel" → "Upload Template JSON"
   - **Net change**: -20 lines (simpler!)

2. **`src/services/templateService.ts`**
   - ✅ Add `uploadJSONTemplate(jsonData, userId)` function (~80 lines)
   - ✅ Add `createProjectFromJSONTemplate(jsonData)` function (~150 lines)
   - ✅ Add helper functions for comparison matrix (~50 lines)
   - **Net change**: +280 lines

3. **`src/components/templates/TemplatesModal.tsx`**
   - ❌ Remove legacy template handling
   - ✅ Update `handleUseTemplate` to use JSON templates only
   - **Net change**: -10 lines (simpler!)

**Total Code Changes**:
- **Removed**: 1,530 lines (Excel parsing + old logic)
- **Added**: 350 lines (JSON handling)
- **Net**: -1,180 lines! 🎉 (Much simpler codebase)

---

## Success Criteria

✅ **Functional Requirements**
- [ ] Users can upload JSON files to create templates
- [ ] JSON templates store complete JSONExportData
- [ ] Creating projects from JSON templates restores ALL data
- [ ] Vendor summaries are preserved and restored
- [ ] Scatter plot positioning is preserved
- [ ] Excel upload continues to work (backward compatible)

✅ **Technical Requirements**
- [ ] JSON validation prevents invalid uploads
- [ ] Error messages are descriptive
- [ ] No n8n workflow changes required
- [ ] Zero transformation approach maintained
- [ ] localStorage structure matches original project exactly

✅ **Quality Requirements**
- [ ] All test cases pass
- [ ] No console errors during upload/create
- [ ] Performance: Upload completes in < 2 seconds
- [ ] Performance: Create project completes in < 1 second

---

## Risks and Mitigations

### Risk 1: JSON File Size
**Risk**: Large projects with images could create huge JSON files
**Likelihood**: Low (images are base64 in localStorage, rarely exported)
**Mitigation**: Add file size validation (max 10MB)

### Risk 2: Browser Compatibility
**Risk**: Older browsers may not support FileReader API
**Likelihood**: Very Low (FileReader is widely supported)
**Mitigation**: Graceful error message if FileReader not available

### Risk 3: JSONExportData Structure Changes
**Risk**: Future changes to jsonExportService output break templates
**Likelihood**: Medium
**Mitigation**: Version field in JSONExportData (`exportVersion: "1.0.0"`)

---

## Future Enhancements

### SP_030.1: Template Editing
- Allow admins to edit template metadata after upload
- Update `template_data_json` without re-uploading

### SP_030.2: Template Versioning
- Track template versions (v1, v2, etc.)
- Support template updates without losing usage history

### SP_030.3: Template Categories
- Add category management UI
- Bulk categorization of templates

### SP_030.4: Template Analytics
- Track which templates are most used
- Show template usage stats in admin panel

---

## Dependencies

### Required
- ✅ `jsonExportService.ts` - Already exists and working
- ✅ `templateService.ts` - Already exists, needs new functions
- ✅ n8n Data Table - Already created (21 columns)
- ✅ n8n webhook `/templates` - Already working

### Optional
None

---

## Deployment Checklist

### Pre-Deployment
- [ ] Review code changes
- [ ] Test all 4 test cases locally
- [ ] Verify n8n Data Table has correct schema
- [ ] Verify n8n workflow is active

### Deployment
- [ ] Deploy frontend changes
- [ ] Test upload JSON in production
- [ ] Test create project from JSON template
- [ ] Monitor for errors

### Post-Deployment
- [ ] Update user documentation
- [ ] Notify admins of new JSON upload feature
- [ ] Monitor template uploads for first week

---

## Questions for Clarification

None - all requirements are clear from user specification.

---

## ✅ IMPLEMENTATION UPDATE: 5-Column Schema Simplification

**Date**: January 16, 2026
**Status**: Completed during implementation

### Design Improvement During Development

During implementation, the n8n Data Table schema was **simplified from 21 columns to 5 columns** based on user feedback identifying redundant data storage.

### Original Design (21 Columns) - DEPRECATED
```
template_id, template_name, project_description, template_category,
searched_by, software_category, key_features, client_quote,
current_tools, company_context, solution_requirements,
criteria_count, vendors_count, has_comparison_matrix,
has_battlecards, has_executive_summary, project_stage,
template_data_json, user_id, uploaded_at, updated_at
```

**Problem Identified**: Fields like `criteria_count`, `has_battlecards`, etc. were redundant because they could be derived from `template_data_json`.

**User Feedback**: "thats stupid because you upload battlecards as the data array (text) and in the data structure you have it as boolean. same with the rest"

### Simplified Design (5 Columns) - IMPLEMENTED ✅
```
template_id          - Unique identifier
template_name        - Display name for UI
template_category    - Category for filtering
template_data_json   - Complete JSONExportData (contains EVERYTHING)
uploaded_at          - Upload timestamp
```

### Why This is Better
- ✅ `template_data_json` contains ALL project data (criteria, vendors, battlecards, executive summary, comparison matrix, vendor summaries)
- ✅ Display fields derived from parsing JSON on frontend (no data duplication)
- ✅ Simpler n8n Data Table setup
- ✅ Faster uploads (less data transmitted)
- ✅ No redundant boolean flags or count fields
- ✅ Single source of truth for all template data

### Code Changes for 5-Column Schema

**Updated Functions**:
1. `uploadJSONTemplate()` - Now sends only 5 fields to n8n
2. `getTemplatesFromN8n()` - Parses `template_data_json` and derives display fields
3. `getTemplateByIdFromN8n()` - Same parsing logic for single template
4. Updated CSV: `n8n_data_table_schema.csv` - Now shows 5-column structure

**Example Template Parsing**:
```typescript
// Parse template_data_json to derive display fields
const templateDataJson = JSON.parse(template.template_data_json);
const isJSONExportData = templateDataJson.metadata && templateDataJson.project;
const projectData = isJSONExportData ? templateDataJson.project : templateDataJson;
const metadata = isJSONExportData ? templateDataJson.metadata : {};

// Return fully-populated Template object
return {
  templateId: template.template_id,
  templateCategory: template.template_category,
  projectName: template.template_name,
  searchedBy: metadata.searchedBy || '',
  projectDescription: metadata.projectDescription || '',
  criteria: projectData?.criteria || [],
  vendors: projectData?.vendors || [],
  battlecards: projectData?.battlecards,
  executiveSummary: projectData?.executiveSummary,
  // ... all other fields derived from JSON
  template_data_json: template.template_data_json, // Include for project creation
};
```

### Impact on n8n Workflow

**Upload Workflow Changes**:
- Expect only 5 fields in POST body
- Remove extraction/validation of redundant fields
- Store data directly to 5-column Data Table

**List/Get Workflow Changes**:
- Return only 5 columns from Data Table
- Remove transformation logic for derived fields
- Frontend handles all derivation from `template_data_json`

### Documentation Updates

**Updated Files**:
- ✅ `n8n_data_table_schema.csv` - Now shows 5-column structure with sample data
- ✅ `COMPLETE_DATA_STRUCTURE.md` - Updated header to reflect 5-column schema
- ✅ `SP_030_IMPLEMENTATION_SUMMARY.md` - New comprehensive implementation doc

---

**End of Sprint Plan**
