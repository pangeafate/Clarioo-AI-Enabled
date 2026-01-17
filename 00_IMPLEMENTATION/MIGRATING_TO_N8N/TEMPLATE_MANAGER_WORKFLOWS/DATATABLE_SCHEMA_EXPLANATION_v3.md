# n8n Data Tables Schema v3 - Template Storage
**Sprint**: SP_029 - Excel Template Upload
**Version**: v3 (Updated 2026-01-16)
**Created**: 2026-01-15
**Purpose**: Define n8n Data Table structure for storing uploaded templates

## 🎯 Architecture Overview

### Zero Transformation Approach
```
Excel File → Frontend Parse (excelImportService) → ExportProjectData JSON → n8n Storage
                                                                              ↓
                                                                    No transformation
                                                                              ↓
                                                              Store complete JSON blob
```

### Data Flow
1. **Upload**: Admin uploads Excel → Frontend parses → Builds ExportProjectData JSON → Uploads to n8n
2. **Storage**: n8n stores complete JSON in `template_data_json` column (no processing)
3. **Retrieval**: Frontend fetches template → Copies JSON directly to localStorage
4. **Usage**: localStorage structure matches stored JSON structure (zero transformation)

## 📋 Schema Structure

### File: `clarioo_templates_schema_v3.csv`

| Column Name | Type | Purpose | Source |
|-------------|------|---------|--------|
| `template_id` | string (UUID) | Primary key, unique template identifier | Generated on upload |
| `template_name` | string | Project name for display | `ExportProjectData.projectName` |
| `template_category` | string | Category for filtering | Template metadata or INDEX tab |
| `searched_by` | string | Author/contributor name | INDEX tab (optional) |
| `software_category` | string | Type of software being evaluated | INDEX tab (optional) |
| `key_features` | string | Notable features of this template | INDEX tab (optional) |
| `client_quote` | string | Testimonial/use case | INDEX tab (optional) |
| `current_tools` | string | Tools being replaced/evaluated | INDEX tab (optional) |
| `criteria_count` | number | Number of evaluation criteria | `ExportProjectData.criteria.length` |
| `vendors_count` | number | Number of vendors in template | `ExportProjectData.vendors.length` |
| `has_comparison_matrix` | boolean | Whether comparison matrix exists | Check `ExportProjectData.comparisonMatrix` |
| `has_battlecards` | boolean | Whether battlecards exist | Check `ExportProjectData.battlecards` |
| `has_executive_summary` | boolean | Whether executive summary exists | Check `ExportProjectData.executiveSummary` |
| `project_stage` | string | Stage of template completion | `ExportProjectData.stage` |
| `template_data_json` | json | **Complete ExportProjectData object** | Full JSON blob |
| `user_id` | string | User who uploaded template | `localStorage.getItem('clarioo_user_id')` |
| `uploaded_at` | datetime | Initial upload timestamp | Server timestamp |
| `updated_at` | datetime | Last modification timestamp | Server timestamp |

## 🔑 Key Design Decisions

### 1. Complete JSON Storage (`template_data_json`)
**Why**: Zero transformation - store exactly what frontend sends
**Contains**: Complete `ExportProjectData` object including:
- Project metadata (projectId, projectName, projectDescription)
- Criteria array (name, explanation, importance, type)
- Vendors array (id, name, description, website, logo)
- Comparison matrix (criteria-vendor scoring)
- Stage 1/2 results
- Executive summary
- Battlecards and battlecard rows
- Screening summary
- Tech request (companyContext, solutionRequirements)

### 2. Metadata Columns for Searching/Filtering
**Why**: Enable efficient queries without parsing JSON
**Enables**:
- Category filtering in TemplatesModal
- Display template cards without parsing full JSON
- Quick counts (criteria_count, vendors_count)
- Feature flags (has_comparison_matrix, has_battlecards)

### 3. localStorage Structure Replication
**Why**: Templates are copied directly to localStorage when used

**localStorage Keys** (from `excelExportService.ts:141-258`):
```javascript
clarioo_projects                              // Project metadata
workflow_{projectId}                          // Criteria, vendors, techRequest
comparison_state_{projectId}                  // Comparison matrix
stage1_results_{projectId}                    // Stage 1 results
stage2_results_{projectId}                    // Stage 2 results
clarioo_executive_summary_{projectId}         // Executive summary
clarioo_battlecards_state_{projectId}         // Battlecards
clarioo_battlecards_rows_{projectId}          // Battlecard rows
clarioo_screening_summary_{projectId}         // Screening summary
```

**Mapping**:
```typescript
// When template is used, copy from template_data_json to localStorage:
const templateData = JSON.parse(row.template_data_json);

// Create new project with new ID
const newProjectId = crypto.randomUUID();

// Copy all data to localStorage with new projectId
localStorage.setItem('clarioo_projects', JSON.stringify([...projects, newProject]));
localStorage.setItem(`workflow_${newProjectId}`, JSON.stringify({
  criteria: templateData.criteria,
  vendors: templateData.vendors,
  techRequest: templateData.techRequest
}));
localStorage.setItem(`comparison_state_${newProjectId}`, JSON.stringify(templateData.comparisonMatrix));
// ... and so on for all keys
```

## 📊 Template Card Display Fields

Template cards (`TemplateCard.tsx`) display the following from metadata columns:

```typescript
// Card Header
template_name                    // "Customer Experience Platform Selection"
template_category               // "Customer Experience"

// Card Body
searched_by                     // "Sarah Chen - VP Customer Success"
software_category               // "CX Platforms"
key_features                    // "AI-powered insights, Omnichannel..."
client_quote                    // "This template helped us..."

// Card Footer (Badges)
criteria_count                  // "12 criteria"
vendors_count                   // "5 vendors"
has_comparison_matrix           // Show matrix badge
has_battlecards                 // Show battlecards badge
```

**Performance**: No JSON parsing needed for card display - all fields are top-level columns.

## 🔄 Upload Workflow

### Frontend (`TemplateUploadButton.tsx`)
```typescript
1. Admin selects Excel file
2. Parse Excel → ExportProjectData (excelImportService.ts)
3. Extract metadata from ExportProjectData:
   - template_name = data.projectName
   - criteria_count = data.criteria.length
   - vendors_count = data.vendors.length
   - has_comparison_matrix = !!data.comparisonMatrix
   - etc.
4. Call uploadTemplateWithJSON(data, userId)
```

### Service Layer (`templateService.ts:641-693`)
```typescript
async function uploadTemplateWithJSON(
  templateData: ExportProjectData,
  userId: string
): Promise<UploadResult> {
  const template_id = crypto.randomUUID();

  // Build row for Data Table
  const row = {
    template_id,
    template_name: templateData.projectName,
    template_category: templateData.projectCategory || 'Uncategorized',
    criteria_count: templateData.criteria.length,
    vendors_count: templateData.vendors.length,
    has_comparison_matrix: !!templateData.comparisonMatrix,
    has_battlecards: !!templateData.battlecards?.length,
    has_executive_summary: !!templateData.executiveSummary,
    project_stage: templateData.stage,
    template_data_json: JSON.stringify(templateData), // Complete JSON blob
    user_id: userId,
    uploaded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // POST to n8n webhook
  const response = await fetch(TEMPLATE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'upload_json',
      template: row
    })
  });

  return { success: true, template_id };
}
```

### n8n Webhook Handler
```json
{
  "action": "upload_json",
  "template": {
    "template_id": "uuid-123",
    "template_name": "CX Platform Selection",
    "template_category": "Customer Experience",
    "criteria_count": 12,
    "vendors_count": 5,
    "template_data_json": "{...complete ExportProjectData...}",
    "user_id": "user-456",
    "uploaded_at": "2026-01-15T10:30:00Z"
  }
}
```

**n8n Action**: Insert row directly into Data Table (no transformation)

## 🔍 Retrieval Workflow

### Frontend (`templateService.ts`)
```typescript
async function getTemplatesFromN8n(): Promise<Template[]> {
  // Fetch from n8n Data Tables
  const response = await fetch(TEMPLATE_WEBHOOK_URL + '?action=list');
  const rows = await response.json();

  // Transform rows to Template objects
  return rows.map(row => ({
    templateId: row.template_id,
    templateName: row.template_name,
    templateCategory: row.template_category,
    searchedBy: row.searched_by,
    softwareCategory: row.software_category,
    keyFeatures: row.key_features,
    criteriaCount: row.criteria_count,
    vendorsCount: row.vendors_count,
    hasComparisonMatrix: row.has_comparison_matrix,
    hasBattlecards: row.has_battlecards,
    // Parse JSON only when template is used (not for display)
    templateData: row.template_data_json  // Store as string, parse on demand
  }));
}
```

### When Template is Used
```typescript
async function createProjectFromTemplate(template: Template): Promise<void> {
  // Parse complete JSON
  const templateData: ExportProjectData = JSON.parse(template.templateData);

  // Generate new project ID
  const newProjectId = crypto.randomUUID();

  // Copy to localStorage using createProjectFromExportData
  await createProjectFromExportData(templateData, newProjectId);

  // Result: All localStorage keys populated with template data
}
```

## 📝 Example Data

### Row 1 (Header - Data Types)
```csv
string,string,string,string,string,string,string,string,number,number,boolean,boolean,boolean,string,json,string,datetime,datetime
```

### Row 2 (Example Template)
```csv
uuid-example-123,
Customer Experience Platform Selection,
Customer Experience,
Sarah Chen - VP Customer Success,
CX Platforms,
"AI-powered insights, Omnichannel support, Analytics dashboard",
"This template helped us evaluate 8 vendors systematically",
Zendesk,
12,
5,
true,
true,
true,
battlecards_complete,
"{\"projectId\":\"uuid-example-123\",\"projectName\":\"Customer Experience Platform Selection\",...}",
admin-user-123,
2026-01-15T10:30:00Z,
2026-01-15T10:30:00Z
```

## 🎯 Benefits of This Schema

1. **Zero Transformation**: Frontend sends JSON → n8n stores JSON → Frontend retrieves JSON
2. **Performance**: Metadata columns enable fast filtering without JSON parsing
3. **Flexibility**: Can add/remove fields in ExportProjectData without schema changes
4. **localStorage Alignment**: Direct copy from `template_data_json` to localStorage
5. **Audit Trail**: user_id, uploaded_at, updated_at for tracking
6. **Feature Detection**: Boolean flags (has_comparison_matrix, has_battlecards) for UI

## 🚀 Next Steps (SP_029 Remaining 15%)

1. **Create n8n Data Table**:
   - Upload `clarioo_templates_schema_v3.csv` to n8n
   - Create new Data Table named `clarioo_templates`

2. **Configure n8n Webhook**:
   - Action: `upload_json` → Insert row into Data Table
   - Action: `list` → Fetch all rows from Data Table
   - Action: `delete` → Delete row by template_id

3. **Integration Testing**:
   - Export project to Excel
   - Upload Excel as template (admin mode)
   - List templates (verify card display)
   - Create project from template
   - Export new project → Verify identical structure

## 📚 Related Files

- `src/services/excelExportService.ts` - ExportProjectData structure (2077 lines)
- `src/services/excelImportService.ts` - Excel parsing (829 lines)
- `src/services/templateService.ts` - Upload/retrieve functions
- `src/components/templates/TemplateUploadButton.tsx` - Upload UI
- `src/types/export.types.ts` - ExportProjectData TypeScript type
- `00_IMPLEMENTATION/SPRINTS/SP_029_Excel_Template_Upload.md` - Sprint documentation
