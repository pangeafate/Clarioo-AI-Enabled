# Sprint 27: Excel & JSON Export Feature

**Sprint ID**: SP_027_Excel_JSON_Export_Feature
**Type**: Feature Implementation - Data Export & Sharing
**Status**: 📋 PLANNED
**Estimated Duration**: 5-7 days
**Date Created**: January 14, 2026
**Phase**: Phase 1 - n8n AI Integration (Enhancement)
**Previous Sprint**: [SP_026_Vendor_Positioning_Scatter_Plot.md](./SP_026_Vendor_Positioning_Scatter_Plot.md)

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Business Requirements](#business-requirements)
3. [Technical Architecture](#technical-architecture)
4. [Excel Export Specifications](#excel-export-specifications)
5. [JSON Export Specifications](#json-export-specifications)
6. [Implementation Plan](#implementation-plan)
7. [Files to Create/Modify](#files-to-createmodify)
8. [Testing Requirements](#testing-requirements)
9. [Acceptance Criteria](#acceptance-criteria)

---

## Executive Summary

### Purpose
Implement comprehensive Excel and JSON export functionality enabling users to download beautifully formatted Excel reports and JSON project backups at any stage of the vendor selection workflow. This feature serves dual purposes:
1. **Excel Export**: Professional, print-ready reports for stakeholder sharing
2. **JSON Export**: Complete project state export for future import/sharing via n8n (Sprint 28)

### Key Features
- **7-Tab Excel Workbook**: INDEX (cover), Criteria, Vendor List + Scatter Plot Screenshot, Comparison Matrix, Detailed Evidence, Executive Summary, Battlecards
- **Progressive Export**: Export partial data at any stage (criteria-only, vendors-only, incomplete comparison)
- **Visual Excellence**: Vendor logos, brand colors (#0066FF), icons for match status, professional styling
- **Smart Incomplete Data Handling**: Gray out pending/loading cells, prompt user before exporting incomplete data
- **JSON Backup**: Full project state export for reconstruction in future sessions
- **Integration**: Buttons added to existing "Download or Share" popup on all pages

### Business Value
- **Professional Reports**: Executive-ready Excel documents for decision-making
- **Data Portability**: JSON exports enable project sharing and backup
- **Workflow Flexibility**: Export at any stage without waiting for completion
- **Foundation for n8n Import** (SP_028): JSON format designed for n8n workflow storage

---

## Business Requirements

### User Stories

**US-027-1: Excel Export at Any Stage**
> As a user, I want to export my vendor analysis to Excel at any stage so that I can share progress with stakeholders without waiting for completion.

**Acceptance Criteria**:
- ✅ Export button available on all workflow pages (Landing, Criteria, Vendor Discovery, Comparison)
- ✅ Exported Excel contains only data visible on current page
- ✅ Incomplete data cells are grayed out with #D3D3D3 background
- ✅ User is prompted when exporting incomplete data (generation running/paused)

**US-027-2: Beautifully Formatted Excel Reports**
> As a user, I want Excel exports to look professional with vendor logos, colors, and clear formatting so that I can present them to executives.

**Acceptance Criteria**:
- ✅ All tabs use Clarioo brand colors (#0066FF headers)
- ✅ Vendor logos appear as 40x40px circular images (or 30x30px in headers)
- ✅ Match status shown as icons (✓, +/-, ?) with color-coded backgrounds
- ✅ Scatter plot embedded as high-quality screenshot (600x400px)
- ✅ Text properly formatted with word wrap, reasonable row heights

**US-027-3: JSON Project Backup**
> As a user, I want to export my entire project as JSON so that I can back it up and potentially share it via link in the future.

**Acceptance Criteria**:
- ✅ JSON contains ALL localStorage data (project, criteria, vendors, comparison state, battlecards, scatter plot positions)
- ✅ JSON is structured to allow complete project reconstruction
- ✅ Export includes metadata (exportedAt, exportedBy, version)
- ✅ File size is reasonable (<2MB for typical project)

**US-027-4: Smart File Naming**
> As a user, I want exported files to have clear, standardized names so that I can easily organize multiple project exports.

**Acceptance Criteria**:
- ✅ Excel: `{ProjectName10}_Clarioo_{YY_MM_DD}.xlsx`
- ✅ JSON: `{ProjectName10}_Clarioo_{YY_MM_DD}.json`
- ✅ Project name sanitized (special characters removed, max 10 characters)
- ✅ Date format: YY_MM_DD with underscores (e.g., 26_01_14)

---

## Technical Architecture

### High-Level Flow

```
User clicks "Download or Share" button
  ↓
Popup modal opens
  ↓
User selects "Download Comparison Results" (Excel) OR "Export JSON"
  ↓
[Excel Path]                          [JSON Path]
  ↓                                     ↓
Check if data is complete            Gather all localStorage data
  ↓                                     ↓
If incomplete → Show warning         Structure JSON with metadata
  ↓                                     ↓
User confirms export                 Pretty-print JSON
  ↓                                     ↓
Show loading modal                   Trigger download
"Generating Excel file..."              ↓
  ↓                                   Done
Gather data from localStorage
  ↓
Generate scatter plot screenshot (html2canvas)
  ↓
Process vendor logos (fetch + circular crop)
  ↓
Build Excel workbook (ExcelJS)
  - INDEX tab (cover page)
  - Criteria tab
  - Vendor List + Scatter Plot tab
  - Comparison Matrix tab
  - Detailed Matching tab
  - Executive Summary tab (if available)
  - Battlecards tab (if available)
  ↓
Apply styling (colors, fonts, logos, icons)
  ↓
Gray out incomplete cells
  ↓
Generate .xlsx file blob
  ↓
Trigger download
  ↓
Done
```

### Key Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| **ExcelJS** | Excel file generation with advanced styling | ^4.4.0 |
| **html2canvas** | Scatter plot screenshot capture | ^1.4.1 |
| **file-saver** | Browser file download trigger | ^2.0.5 |

### Data Sources (localStorage Keys)

```typescript
// Primary data sources
- `clarioo_project_{projectId}` - Project metadata
- `clarioo_techRequest_{projectId}` - Tech request details
- `clarioo_criteria_{projectId}` - Criteria array
- `clarioo_vendors_{projectId}` - Vendor discovery results
- `clarioo_comparison_state_{projectId}` - Comparison orchestration state
- `clarioo_stage1_{projectId}` - Stage 1 research results
- `clarioo_stage2_{projectId}` - Stage 2 ranking results
- `clarioo_battlecards_state_{projectId}` - Battlecards generation state
- `clarioo_battlecards_rows_{projectId}` - Battlecards row data
- `vendor_scatterplot_positions_{projectId}` - Scatter plot positions
- `clarioo_executive_summary_{projectId}` - Executive summary text
```

---

## Excel Export Specifications

### Tab 1: INDEX (Cover Page)

**Purpose**: Professional cover page with project information and table of contents

**Structure**:
```
Row 1: [Button placeholder] "Clone as Project in Clarioo" [GRAYED OUT]
       - Cell A1: Text "Clone as Project in Clarioo" with strikethrough, gray background (#CCCCCC)
       - Cell Comment (Excel note): "soon to come" (appears on hover)
Row 2: "SOFTWARE SELECTION PROJECT" (Large, Bold)
Row 3: "Powered by Clarioo AI — Your Software Discovery & Selection Co-pilot"
Row 5: PROJECT INFORMATION (Section Header)
Row 6: Project Name: | [Project Name from localStorage]
Row 7: Prepared By: | [User email/name]
Row 8: Date: | [Export date: DD/MM/YYYY]
Row 9: Category: | [Project category]

Row 11: TABLE OF CONTENTS (Section Header)
Row 12: Section | Description
Row 13: 1. Evaluation Criteria | All requirements and evaluation criteria (HYPERLINK to Tab 2)
Row 14: 2. Vendor List | Shortlisted vendors with strategic positioning (HYPERLINK to Tab 3)
Row 15: 3. Vendor Evaluation | Comparison matrix with final rankings (HYPERLINK to Tab 4)
Row 16: 4. Detailed Matching | Evidence and reasoning for each vendor-criterion match (HYPERLINK to Tab 5)
Row 17: 5. Executive Summary | AI-generated project summary (HYPERLINK to Tab 6, IF EXISTS)
Row 18: 6. Battlecards | Deep research of key vendor differences (HYPERLINK to Tab 7, IF EXISTS)
```

**Styling**:
- Row 1 Button: Gray background (#CCCCCC), strikethrough text, disabled appearance
- Row 2 Title: Font size 20pt, Bold, Color #0066FF
- Row 3 Subtitle: Font size 12pt, Italic, Color #666666
- Section Headers: Font size 14pt, Bold, Background #0066FF, White text
- Data cells: Font size 11pt, Background #F9FAFB (light gray)
- Table of Contents: Hyperlinks in blue (#0066FF), underlined

**Data Sources**:
```typescript
const project = JSON.parse(localStorage.getItem(`clarioo_project_${projectId}`));
const projectName = project.name;
const preparedBy = localStorage.getItem('user_email') || 'Anonymous User';
const exportDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
const category = project.category || 'Uncategorized';
```

---

### Tab 2: 1. Evaluation Criteria

**Purpose**: Complete list of all evaluation criteria with descriptions

**Structure**:
```
Row 1: "EVALUATION CRITERIA & REQUIREMENTS SPECIFICATION" (Large Header)

Row 3: "EVALUATION CRITERIA" (Section Header)

Row 4: # | Criterion | Importance | Type | Description
Row 5+: [Data rows]
  1 | Advanced clienteling profiles | High | Feature | 360° customer view...
  2 | Omnichannel endless aisle | Medium | Feature | Ability for in-store...
  ...
```

**Column Specifications**:
- Column A (#): Width 5, Center-aligned, Bold
- Column B (Criterion): Width 40, Left-aligned, Bold
- Column C (Importance): Width 12, Center-aligned, **TEXT COLOR ONLY**:
  - High = Red (#FF0000)
  - Medium = Orange (#FFA500)
  - Low = Green (#00AA00)
- Column D (Type): Width 12, Center-aligned
- Column E (Description): Width 80, Left-aligned, Word wrap enabled

**Styling**:
- Header row (Row 4): Background #0066FF, White text, Bold, Font size 12pt
- Data rows: Alternating backgrounds (#FFFFFF, #F9FAFB)
- Borders: Light gray (#D3D3D3) around all cells
- Freeze panes: Freeze Row 4 (header row)

**Data Source**:
```typescript
const criteria = JSON.parse(localStorage.getItem(`clarioo_criteria_${projectId}`)) || [];
// Include ALL criteria (even archived ones)
const allCriteria = criteria; // Don't filter out archived
```

**Logic**:
- Show ALL criteria including `isArchived: true`
- Sort by: importance (High → Medium → Low), then by creation order
- Number sequentially (1, 2, 3...)

---

### Tab 3: 2. Vendor List + Scatter Plot Screenshot

**Purpose**: Shortlisted vendors with descriptions and strategic positioning visualization

**Structure**:
```
Row 1: "SHORTLISTED VENDORS" (Large Header)

Row 3: "SCREENING SUMMARY" (Section Header)
Row 4: [Summary text IF EXISTS in localStorage - otherwise leave empty]
       Note: Do NOT generate new data. Only export what exists in localStorage.

Row 6: "VENDOR LIST" (Section Header)
Row 7: # | [Logo] | Vendor | Description | Website
Row 8+: [Data rows]
  1 | [Logo] | Tulip | Luxury-focused clienteling... | https://tulip.com/
  2 | [Logo] | Salesfloor | Leading omnichannel... | https://salesfloor.net/
  ...

[After vendor table, empty row]

Row N: "STRATEGIC POSITIONING" (Section Header)
Row N+1: [Scatter Plot Screenshot - 600px x 400px]
```

**Column Specifications**:
- Column A (#): Width 5, Center-aligned, Bold
- Column B (Logo): Width 8, Center-aligned
  - **Logo Specifications**:
    - Size: 40x40px
    - Circular crop (use circular mask)
    - Fallback: Colored circle with vendor initials (first 2 letters)
    - Fallback color: Use vendor's match color from `comparisonVendors[].color`
- Column C (Vendor): Width 20, Left-aligned, Bold, Font size 12pt
- Column D (Description): Width 60, Left-aligned, Word wrap enabled
- Column E (Website): Width 30, Left-aligned, Blue hyperlink

**Styling**:
- Header row (Row 7): Background #0066FF, White text, Bold
- Logo row height: 50 (to accommodate 40px logos + padding)
- Data rows: Standard row height 30
- Scatter plot: Embedded as image, anchor to cell, size 600px x 400px

**Scatter Plot Screenshot Specifications**:
```typescript
// Capture scatter plot using html2canvas
const scatterPlotElement = document.querySelector('.scatter-plot-container');
const canvas = await html2canvas(scatterPlotElement, {
  scale: 2, // 2x resolution for retina displays
  backgroundColor: '#FFFFFF',
  useCORS: true, // Allow cross-origin images (vendor logos)
  logging: false,
});

// Convert to blob (JPEG, 85% quality)
const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));

// Embed in Excel
worksheet.addImage({
  buffer: blob,
  extension: 'jpeg',
  position: {
    type: 'twoCellAnchor',
    from: { col: 1, row: vendorCount + 10 }, // Below vendor table
    to: { col: 8, row: vendorCount + 30 }, // Span ~20 rows, 7 columns
  },
});
```

**Data Source**:
```typescript
const vendors = JSON.parse(localStorage.getItem(`clarioo_vendors_${projectId}`)) || [];
const comparisonVendors = JSON.parse(localStorage.getItem(`comparison_vendors_${projectId}`)) || [];
// Use comparisonVendors for color assignments if available

const screeningSummary = ""; // TODO: Generate or pull from localStorage if added in future
```

**Logo Processing Logic**:
```typescript
async function processVendorLogo(vendor: Vendor): Promise<Buffer> {
  if (vendor.logo) {
    try {
      // Fetch logo image
      const response = await fetch(vendor.logo);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Apply circular crop using Sharp (if available) or canvas
      const circularLogo = await applyCircularMask(buffer, 40);
      return circularLogo;
    } catch (error) {
      console.warn(`Failed to fetch logo for ${vendor.name}, using fallback`);
      return generateInitialsBadge(vendor.name, vendor.color || '#0066FF');
    }
  } else {
    // Generate colored circle with initials
    return generateInitialsBadge(vendor.name, vendor.color || '#0066FF');
  }
}

function generateInitialsBadge(vendorName: string, color: string): Buffer {
  // Create 40x40px canvas
  // Draw circle with 'color' background
  // Add white text with first 2 letters of vendorName (uppercase)
  // Return as PNG buffer
}
```

---

### Tab 4: 3. Vendor Evaluation (Summary Matrix)

**Purpose**: Comparison matrix with final rankings and match status summary

**Structure**:
```
Row 1: "VENDOR COMPARISON MATRIX" (Large Header)

Row 3: "FINAL VENDOR RANKINGS" (Section Header)
Row 4: Rank | [Logo] | Vendor | Score | Yes | Partial | Unknown | About Vendor | Research Insights
Row 5+: [Ranking data rows]
  #1 | [Logo] | Proximity Insight | 97% | 16 | 1 | 0 | All-in-one super-app... | Best-in-class for...
  #2 | [Logo] | Salesfloor | 97% | 15 | 2 | 0 | Leading omnichannel... | Strong AI-assisted...
  ...

Row N: [Scoring formula explanation]

Row N+3: "CRITERIA VS VENDORS" (Section Header)
Row N+4: [Icon Legend] ✓ = Yes | +/- = Partial | ? = Unknown
Row N+5: # | Criterion | Priority | Type | [Vendor1 Logo] | [Vendor2 Logo] | ...
Row N+6:                              | Vendor1        | Vendor2        | ...
Row N+7+: [Matrix data rows]
  1 | Advanced clienteling | High | Feature | ✓           | ✓           | ...
                                            | Real-time   | Omnichannel | ...
  2 | Endless aisle        | High | Feature | +/-         | ✓           | ...
                                            | Partial vis.| Full access | ...
  ...
```

**Column Specifications (Ranking Table)**:
- Column A (Rank): Width 5, Center-aligned, Bold
- Column B (Logo): Width 6, Center-aligned, 40x40px circular logos
- Column C (Vendor): Width 18, Left-aligned, Bold, Font size 11pt
- Column D (Score): Width 8, Center-aligned, Bold, Font size 12pt, Color based on score:
  - 90%+ = Green (#00AA00)
  - 75-89% = Orange (#FFA500)
  - <75% = Red (#FF0000)
- Columns E-G (Yes/Partial/Unknown): Width 8, Center-aligned
  - Background colors match matrix colors (#E5EBFB, #F0EFFC, #F4F5F7)
- Column H (About Vendor): Width 40, Left-aligned, Word wrap, Max height 60
- Column I (Research Insights): Width 40, Left-aligned, Word wrap, Max height 60

**Column Specifications (Comparison Matrix)**:
- Columns A-D: Same as above (# | Criterion | Priority | Type)
- Vendor columns (E onwards): Width 12, Center-aligned
  - **Header Row 1 (Logos)**: 30x30px circular logos, Center-aligned
  - **Header Row 2 (Names)**: Vendor names, Bold, Font size 10pt, Wrap text
  - **Data Cells**:
    - **Line 1 (Icon)**: ✓ (Yes), +/- (Partial), ? (Unknown), Font size 16pt, Bold
    - **Line 2 (Summary)**: 2-3 word summary (IF AVAILABLE), Font size 9pt, Italic, Gray (#666666)
    - Word wrap enabled, row height auto-fit (min 40, max 80)
  - **Background colors**:
    - Yes: #E5EBFB (light blue)
    - Partial: #F0EFFC (light purple)
    - Unknown: #F4F5F7 (light gray)
    - Pending/Loading: #D3D3D3 (darker gray) ← **INCOMPLETE DATA**

**Icon Mapping**:
```typescript
const matchStatusIcons = {
  yes: '✓',      // Unicode U+2713 (Check Mark)
  star: '+/-',   // Or use '⭐' U+2B50
  no: '✗',       // Unicode U+2717 (Ballot X)
  unknown: '?',  // Question mark
  pending: '',   // Empty for pending cells
};
```

**Icon Legend Row**:
- Insert after "CRITERIA VS VENDORS" header
- Format: `✓ = Yes  |  +/- = Partial  |  ? = Unknown`
- Background: White (#FFFFFF)
- Border: Bold border (#0066FF)

**Data Sources**:
```typescript
// Ranking data
const comparisonState = JSON.parse(localStorage.getItem(`clarioo_comparison_state_${projectId}`));
const vendors = JSON.parse(localStorage.getItem(`clarioo_vendors_${projectId}`));
const stage2Results = JSON.parse(localStorage.getItem(`clarioo_stage2_${projectId}`));

// Calculate scores (mimic frontend scoring logic)
function calculateVendorScore(vendorId: string): number {
  // Priority weights: HIGH = 3x, MEDIUM = 2x, LOW = 1x
  // Status scores: YES = 100%, PARTIAL = 50%, UNKNOWN = 25%, NO = 0%
  // Formula: Score = Σ(Priority Weight × Status Score) / Max Possible Score
}

// Matrix data
const criteria = JSON.parse(localStorage.getItem(`clarioo_criteria_${projectId}`));
const cellStates = comparisonState.criteria[criterionId].cells[vendorId];
// cellStates.value = 'yes' | 'no' | 'star' | 'unknown'
// cellStates.summary = "2-3 word summary" (IF AVAILABLE)
// cellStates.status = 'completed' | 'pending' | 'loading' | 'failed'
```

**Incomplete Data Handling**:
```typescript
if (cellState.status === 'pending' || cellState.status === 'loading') {
  // Apply gray background #D3D3D3
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' },
  };
  cell.value = ''; // Leave empty
} else if (cellState.status === 'completed') {
  const icon = matchStatusIcons[cellState.value];
  const summary = cellState.summary || '';
  cell.value = summary ? `${icon}\n${summary}` : icon;
  // Apply appropriate background color
}
```

---

### Tab 5: 4. Detailed Matching (Extended Evidence)

**Purpose**: Full evidence and reasoning for every vendor-criterion match

**Structure**:
```
Row 1: "VENDORS' DETAILED CRITERIA MATCHING" (Large Header)

Row 3: "DETAILED EVIDENCE & REASONING" (Section Header)
Row 4: Vendor | Criterion | Priority | Status | Evidence | Sources
Row 5+: [One row per vendor-criterion pair]
  Salesfloor | Advanced Clienteling | High | Yes | 360° customer profiles accessible... | [Hyperlink]
  Salesfloor | Omnichannel Endless | High | Yes | Associates can serve online shoppers... | [Hyperlink]
  ...
  Tulip | Advanced Clienteling | High | Yes | Deep 360° customer profiles capturing... | [Hyperlink]
  ...
```

**Column Specifications**:
- Column A (Vendor): Width 18, Left-aligned, Bold, Font size 11pt
- Column B (Criterion): Width 30, Left-aligned, Bold, Font size 10pt
- Column C (Priority): Width 10, Center-aligned, Text color coded (High=Red, Medium=Orange, Low=Green)
- Column D (Status): Width 10, Center-aligned, Background color coded:
  - Yes: #E5EBFB
  - Partial: #F0EFFC
  - Unknown: #F4F5F7
  - Pending: #D3D3D3
- Column E (Evidence): Width 80, Left-aligned, Word wrap enabled
  - Max row height: 150px (approx. 7-8 lines at font size 10pt)
  - Font size: 10pt
  - Combine: `evidenceDescription + "\n\n" + researchNotes`
- Column F (Sources): Width 30, Left-aligned
  - Hyperlink format: Display text = shortened URL (first 50 chars), Link = full URL
  - Font size: 9pt, Blue color (#0066FF), Underlined

**Styling**:
- Header row (Row 4): Background #0066FF, White text, Bold, Font size 12pt
- Data rows: Alternating backgrounds (#FFFFFF, #F9FAFB)
- Borders: Light gray (#D3D3D3) around all cells
- Freeze panes: Freeze Row 4

**Data Source**:
```typescript
const stage1Results = JSON.parse(localStorage.getItem(`clarioo_stage1_${projectId}`));
const stage2Results = JSON.parse(localStorage.getItem(`clarioo_stage2_${projectId}`));
const criteria = JSON.parse(localStorage.getItem(`clarioo_criteria_${projectId}`));
const vendors = JSON.parse(localStorage.getItem(`clarioo_vendors_${projectId}`));

// Flatten data into rows
const detailedRows = [];
for (const criterion of criteria) {
  for (const vendor of vendors) {
    const stage1Data = stage1Results.results[criterion.id]?.[vendor.id];
    const stage2Data = stage2Results.results[criterion.id]?.vendorUpdates?.[vendor.id];

    const evidence = [
      stage1Data?.evidenceDescription || '',
      stage1Data?.researchNotes || '',
      stage2Data?.evidenceDescription || '', // Stage 2 may update evidence
    ].filter(Boolean).join('\n\n');

    detailedRows.push({
      vendor: vendor.name,
      criterion: criterion.name,
      priority: criterion.importance,
      status: stage2Data?.value || stage1Data?.value || 'unknown',
      evidence: evidence || 'No evidence available',
      source: stage1Data?.evidenceUrl || stage2Data?.evidenceUrl || '',
    });
  }
}

// Sort by vendor name, then criterion order
detailedRows.sort((a, b) => {
  if (a.vendor !== b.vendor) return a.vendor.localeCompare(b.vendor);
  return criteriaOrder.indexOf(a.criterion) - criteriaOrder.indexOf(b.criterion);
});
```

---

### Tab 6: Executive Summary (NEW)

**Purpose**: AI-generated executive summary of the entire project

**Structure**:
```
Row 1: "EXECUTIVE SUMMARY" (Large Header)

Row 3: "PROJECT OVERVIEW" (Section Header)
Row 4: Project Name: | [Project Name]
Row 5: Date: | [Export Date]
Row 6: Criteria Evaluated: | [Count]
Row 7: Vendors Compared: | [Count]

Row 9: "SUMMARY" (Section Header)
Row 10+: [Full executive summary text]
  [AI-generated summary explaining the project findings, top vendors, key insights...]

  [Word wrap enabled, reasonable line breaks every 80-100 characters]
```

**Column Specifications**:
- Columns A-B merged for full-width text
- Column width: 100
- Row heights: Auto-fit based on content
- Font size: 11pt
- Line spacing: 1.5

**Styling**:
- Headers: Background #0066FF, White text, Bold, Font size 14pt
- Summary text: Normal weight, Word wrap enabled
- Max height per merged cell: No limit (let it expand)

**Data Source**:
```typescript
const executiveSummary = localStorage.getItem(`clarioo_executive_summary_${projectId}`) || '';

// If no executive summary available, SKIP THIS TAB entirely
if (!executiveSummary) {
  // Don't create this tab
  return;
}
```

**Conditional Logic**:
- **ONLY create this tab IF** `executiveSummary` exists in localStorage
- If not available, skip this tab and adjust table of contents on INDEX tab

---

### Tab 7: 6. Battlecards (TRANSPOSED)

**Purpose**: Deep research of key vendor differences across standard categories

**Structure (TRANSPOSED)**:
```
Row 1: "VENDOR BATTLECARDS" (Large Header)

Row 3: "DEEP RESEARCH OF KEY VENDOR DIFFERENCES" (Section Header)

Row 4: [Category] | [Vendor1 Logo] | [Vendor2 Logo] | [Vendor3 Logo] | ...
Row 5:            | Vendor1        | Vendor2        | Vendor3        | ...
Row 6: Ideal For | [Text + URL]  | [Text + URL]  | [Text + URL]  | ...
Row 7: Target Verticals | [Text + URL] | [Text + URL] | ...
Row 8: Key Customers | [Text + URL] | [Text + URL] | ...
Row 9: Pricing Model | [Text + URL] | [Text + URL] | ...
Row 10: Company Stage | [Text + URL] | [Text + URL] | ...
Row 11: Primary Geo | [Text + URL] | [Text + URL] | ...
Row 12: Main Integrations | [Text + URL] | [Text + URL] | ...
Row 13: [Dynamic Category 1] | [Text + URL] | ...
Row 14: [Dynamic Category 2] | [Text + URL] | ...
Row 15: [Dynamic Category 3] | [Text + URL] | ...
```

**Column Specifications**:
- Column A (Category): Width 25, Left-aligned, Bold, Font size 11pt
  - Background: #0066FF (brand blue)
  - Text: White, Bold
- Vendor columns (B onwards): Width 30, Left-aligned, Word wrap enabled
  - **Header Row 1 (Logos)**: 30x30px circular logos, Center-aligned
  - **Header Row 2 (Names)**: Vendor names, Bold, Font size 11pt, Center-aligned
  - **Data Cells**:
    - Format: `[Research Text]\n\nSource: [URL]`
    - Font size: 10pt
    - Max row height: 150px (approx. 8-10 lines)
    - Source URL: Blue hyperlink (#0066FF), Font size 9pt

**Styling**:
- Category column: Background #0066FF, White text, Bold
- Header rows: Background #E5F3FF (light blue)
- Data cells: Alternating row backgrounds (#FFFFFF, #F9FAFB)
- Borders: Light gray (#D3D3D3) around all cells
- Freeze panes: Freeze Row 5 (after header rows) and Column A (category column)

**Data Source**:
```typescript
const battlecardsState = JSON.parse(localStorage.getItem(`clarioo_battlecards_state_${projectId}`));
const battlecardsRows = JSON.parse(localStorage.getItem(`clarioo_battlecards_rows_${projectId}`));
const vendors = JSON.parse(localStorage.getItem(`clarioo_vendors_${projectId}`));

// battlecardsRows structure:
// [
//   {
//     row_id: "row_1",
//     category_title: "Ideal For",
//     cells: [
//       { vendor_id: "v1", text: "Research text here", sources: ["url1", "url2"] },
//       { vendor_id: "v2", text: "Research text here", sources: ["url1"] },
//       ...
//     ],
//     status: "completed"
//   },
//   ...
// ]

// Transpose: Categories → Rows, Vendors → Columns
for (const row of battlecardsRows) {
  const categoryRow = worksheet.addRow([row.category_title]);

  for (const vendor of vendors) {
    const cell = row.cells.find(c => c.vendor_id === vendor.id);
    if (cell && cell.text) {
      const sources = cell.sources?.map(url => url).join('\n') || '';
      const cellValue = sources ? `${cell.text}\n\nSource: ${sources}` : cell.text;
      // Add to row
    } else {
      // Gray out incomplete cell
      // Background: #D3D3D3
    }
  }
}
```

**Conditional Logic**:
- **ONLY create this tab IF** battlecards have been generated (at least 1 row with status='completed')
- If no battlecards, skip this tab and adjust table of contents on INDEX tab

---

## JSON Export Specifications

### Purpose
Export complete project state as JSON for:
1. **Backup**: Users can save entire project locally
2. **Future Import** (Sprint 28): Upload JSON to n8n workflow for project sharing via link
3. **Debugging**: Developers can inspect full project state

### JSON Structure

```json
{
  "metadata": {
    "exportedAt": "2026-01-14T10:30:00.000Z",
    "exportedBy": "user@example.com",
    "version": "4.4.0",
    "projectId": "proj_abc123"
  },
  "data": {
    "project": {
      "id": "proj_abc123",
      "name": "CX Platform Selection",
      "description": "Luxury retail CX platform for 30+ EU boutiques",
      "category": "Customer Experience",
      "createdAt": "2026-01-10T...",
      "updatedAt": "2026-01-14T..."
    },
    "techRequest": {
      "companyContext": "Luxury fashion retailer with 30+ boutiques across EU...",
      "solutionRequirements": "Need clienteling platform with 360° customer view..."
    },
    "criteria": [
      {
        "id": "crit_001",
        "name": "Advanced clienteling profiles",
        "explanation": "360° customer view consolidating...",
        "importance": "high",
        "type": "Feature",
        "isArchived": false,
        "order": 1
      },
      ...
    ],
    "vendors": [
      {
        "id": "vendor_001",
        "name": "Tulip",
        "description": "Luxury-focused clienteling...",
        "website": "https://tulip.com/",
        "logo": "https://tulip.com/logo.png",
        "pricing": "Enterprise",
        "rating": 4.8,
        "features": [...],
        "criteriaScores": {...}
      },
      ...
    ],
    "comparisonState": {
      "status": "completed",
      "criteria": {
        "crit_001": {
          "criterionId": "crit_001",
          "stage1Complete": true,
          "stage2Status": "completed",
          "cells": {
            "vendor_001": {
              "status": "completed",
              "value": "yes",
              "evidenceUrl": "...",
              "evidenceDescription": "...",
              "researchNotes": "...",
              "summary": "Real-time omnichannel"
            },
            ...
          },
          "criterionInsight": "...",
          "starsAwarded": 3
        },
        ...
      }
    },
    "stage1Results": {
      "projectId": "proj_abc123",
      "results": {
        "crit_001": {
          "vendor_001": {
            "status": "completed",
            "value": "yes",
            "evidenceDescription": "...",
            "evidenceUrl": "...",
            ...
          },
          ...
        },
        ...
      }
    },
    "stage2Results": {
      "projectId": "proj_abc123",
      "results": {
        "crit_001": {
          "criterionId": "crit_001",
          "criterionInsight": "...",
          "starsAwarded": 3,
          "vendorUpdates": {
            "vendor_001": {
              "value": "star",
              "evidenceDescription": "Updated evidence...",
              ...
            },
            ...
          },
          "vendorSummaries": {
            "vendor_001": "Real-time omnichannel",
            ...
          }
        },
        ...
      }
    },
    "battlecardsState": {
      "rows": [
        {
          "row_id": "row_1",
          "category_title": "Ideal For",
          "status": "completed",
          "cells": [
            {
              "vendor_id": "vendor_001",
              "text": "Ideal for luxury retailers...",
              "sources": ["url1", "url2"],
              "is_expanded": false
            },
            ...
          ],
          "timestamp": "..."
        },
        ...
      ],
      "status": "completed",
      "current_row_index": 10,
      "total_rows_target": 10
    },
    "scatterPlotPositions": {
      "vendor_001": {
        "x": 75,
        "y": 60,
        "solutionScope": 75,
        "industryFocus": 60
      },
      ...
    },
    "executiveSummary": "This analysis evaluated 10 CX platforms for luxury retail..."
  }
}
```

### Export Function

```typescript
/**
 * Export complete project state as JSON
 * SP_027: JSON Export Feature
 */
export async function exportProjectAsJSON(projectId: string): Promise<void> {
  try {
    // Gather all data from localStorage
    const project = JSON.parse(localStorage.getItem(`clarioo_project_${projectId}`) || '{}');
    const techRequest = JSON.parse(localStorage.getItem(`clarioo_techRequest_${projectId}`) || '{}');
    const criteria = JSON.parse(localStorage.getItem(`clarioo_criteria_${projectId}`) || '[]');
    const vendors = JSON.parse(localStorage.getItem(`clarioo_vendors_${projectId}`) || '[]');
    const comparisonState = JSON.parse(localStorage.getItem(`clarioo_comparison_state_${projectId}`) || '{}');
    const stage1Results = JSON.parse(localStorage.getItem(`clarioo_stage1_${projectId}`) || '{}');
    const stage2Results = JSON.parse(localStorage.getItem(`clarioo_stage2_${projectId}`) || '{}');
    const battlecardsState = JSON.parse(localStorage.getItem(`clarioo_battlecards_state_${projectId}`) || '{}');
    const scatterPlotPositions = JSON.parse(localStorage.getItem(`vendor_scatterplot_positions_${projectId}`) || '{}');
    const executiveSummary = localStorage.getItem(`clarioo_executive_summary_${projectId}`) || '';

    // Build export object
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: localStorage.getItem('user_email') || 'anonymous',
        version: '4.4.0',
        projectId: projectId,
      },
      data: {
        project,
        techRequest,
        criteria,
        vendors,
        comparisonState,
        stage1Results,
        stage2Results,
        battlecardsState,
        scatterPlotPositions,
        executiveSummary,
      },
    };

    // Pretty-print JSON (2-space indent)
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Generate filename
    const sanitizedProjectName = sanitizeProjectName(project.name || 'Untitled', 10);
    const dateStr = formatDate(new Date(), 'YY_MM_DD');
    const filename = `${sanitizedProjectName}_Clarioo_${dateStr}.json`;

    // Trigger download
    saveAs(blob, filename);

    console.log(`[Export] JSON exported successfully: ${filename}`);
  } catch (error) {
    console.error('[Export] Failed to export JSON:', error);
    throw error;
  }
}
```

---

## Implementation Plan

### Phase 1: Setup & Dependencies (Day 1 - Morning)

**Tasks**:
1. ✅ Install required libraries:
   ```bash
   npm install exceljs@^4.4.0 html2canvas@^1.4.1 file-saver@^2.0.5
   npm install --save-dev @types/file-saver
   ```

2. ✅ Create utility functions:
   - `src/utils/exportHelpers.ts` - File naming, sanitization, date formatting
   - `src/utils/imageProcessing.ts` - Logo fetching, circular crop, initials badge generation
   - `src/utils/screenshotCapture.ts` - html2canvas wrapper for scatter plot

3. ✅ Create type definitions:
   - `src/types/export.types.ts` - Export-related interfaces

### Phase 2: Excel Export - Core Infrastructure (Day 1 - Afternoon)

**Tasks**:
1. ✅ Create `src/services/excelExportService.ts`:
   - Main export orchestration
   - Workbook creation
   - Data gathering from localStorage
   - Styling utilities (colors, fonts, borders)

2. ✅ Implement data completeness detection:
   - Function to check if comparison is running/paused
   - Function to check if battlecards are running/paused
   - Determine which tabs can be exported

3. ✅ Implement incomplete data prompt:
   - Modal component: `src/components/export/IncompleteDataPrompt.tsx`
   - Show warning message with completion percentage
   - "Cancel" / "Export Anyway" buttons

### Phase 3: Excel Export - Tab Implementation (Day 2)

**Tasks (One tab at a time)**:
1. ✅ **INDEX Tab** (2 hours):
   - Project information population
   - Table of contents with hyperlinks
   - "Clone as Project" button (grayed out)

2. ✅ **Criteria Tab** (1.5 hours):
   - Criteria table generation
   - Importance color coding (text color only)
   - Styling and borders

3. ✅ **Vendor List + Scatter Plot Tab** (3 hours):
   - Vendor table with logos (40x40px circular)
   - Logo processing (fetch, crop, fallback)
   - Scatter plot screenshot capture (html2canvas)
   - Image embedding in Excel

4. ✅ **Comparison Matrix Tab** (3 hours):
   - Ranking table with scores
   - Matrix with icons (✓, +/-, ?)
   - Two-row headers (logos + names)
   - Cell background colors
   - Summary text below icons
   - Gray out incomplete cells

### Phase 4: Excel Export - Extended Tabs (Day 3)

**Tasks**:
1. ✅ **Detailed Matching Tab** (2 hours):
   - Flatten vendor-criterion pairs into rows
   - Evidence text (evidenceDescription + researchNotes)
   - Source URLs as hyperlinks
   - Word wrap with max height

2. ✅ **Executive Summary Tab** (1 hour):
   - Conditional creation (only if summary exists)
   - Project overview section
   - Full summary text with word wrap

3. ✅ **Battlecards Tab** (2 hours):
   - TRANSPOSED layout (categories → rows, vendors → columns)
   - Vendor logos in header row (30x30px)
   - Category column styling (#0066FF background)
   - Research text + source URLs per cell
   - Conditional creation (only if battlecards exist)

### Phase 5: JSON Export Implementation (Day 4 - Morning)

**Tasks**:
1. ✅ Create `src/services/jsonExportService.ts`:
   - Gather all localStorage data
   - Build structured JSON object
   - Add metadata (exportedAt, exportedBy, version)
   - Pretty-print with 2-space indent
   - Trigger download

2. ✅ Test JSON structure:
   - Validate all required fields present
   - Test import-ability (manual verification)
   - Check file size (<2MB typical)

### Phase 6: UI Integration (Day 4 - Afternoon)

**Tasks**:
1. ✅ Update `src/components/landing/DownloadSharePopup.tsx`:
   - Add "Export JSON" button below "Download Comparison Results"
   - Wire up to `exportProjectAsJSON()`

2. ✅ Update all pages with export buttons:
   - Ensure "Download or Share" button exists on:
     - Landing page
     - Criteria page
     - Vendor Discovery page
     - Comparison page (already exists)

3. ✅ Add loading modal:
   - `src/components/export/ExportLoadingModal.tsx`
   - Show during Excel generation
   - Message: "Generating Excel file... (Capturing screenshots, formatting data)"
   - Progress indicator (indeterminate spinner)

### Phase 7: Testing & Refinement (Day 5)

**Tasks**:
1. ✅ **Unit Tests**:
   - Test file naming and sanitization
   - Test logo processing (fetch, crop, fallback)
   - Test data completeness detection
   - Test JSON structure validation

2. ✅ **Integration Tests**:
   - Export from criteria page (Tab 1 only)
   - Export from vendor discovery (Tabs 1-2)
   - Export from partial comparison (grayed cells)
   - Export from complete comparison (all tabs)
   - Export JSON at all stages

3. ✅ **Visual Testing**:
   - Verify Excel styling matches template
   - Verify logos are circular and properly sized
   - Verify scatter plot screenshot quality
   - Verify icons display correctly (✓, +/-, ?)
   - Verify word wrap and row heights
   - Verify incomplete cells are grayed out

4. ✅ **Edge Cases**:
   - Export with no vendors selected
   - Export with no comparison started
   - Export with failed/errored cells
   - Export with missing vendor logos
   - Export with very long text (truncation/wrapping)
   - Export with special characters in project name

### Phase 8: Documentation & Cleanup (Day 6)

**Tasks**:
1. ✅ Update documentation:
   - Add export feature to USER_STORIES.md
   - Update FEATURE_LIST.md
   - Update PROGRESS.md

2. ✅ Add inline code comments:
   - Document all export functions
   - Add usage examples
   - Document file structures

3. ✅ Create user guide:
   - How to export Excel reports
   - How to export JSON backups
   - Understanding incomplete data warnings
   - File naming conventions

---

## Files to Create/Modify

### New Files

#### Services
1. **`src/services/excelExportService.ts`** (~800 lines)
   - Main Excel export orchestration
   - Functions for each tab generation
   - Styling utilities
   - Data gathering from localStorage

2. **`src/services/jsonExportService.ts`** (~150 lines)
   - JSON export functionality
   - Data structure building
   - Metadata addition

#### Utils
3. **`src/utils/exportHelpers.ts`** (~100 lines)
   - `sanitizeProjectName(name: string, maxLength: number): string`
   - `formatDate(date: Date, format: string): string`
   - `generateFilename(projectName: string, type: 'excel' | 'json'): string`
   - `checkDataCompleteness(projectId: string): CompletenessSummary`

4. **`src/utils/imageProcessing.ts`** (~200 lines)
   - `fetchVendorLogo(url: string): Promise<Buffer>`
   - `applyCircularMask(imageBuffer: Buffer, size: number): Promise<Buffer>`
   - `generateInitialsBadge(name: string, color: string, size: number): Buffer`
   - `compressImage(buffer: Buffer, quality: number): Promise<Buffer>`

5. **`src/utils/screenshotCapture.ts`** (~80 lines)
   - `captureScatterPlot(element: HTMLElement): Promise<Blob>`
   - Wait for animations to complete
   - html2canvas wrapper with optimal settings

#### Types
6. **`src/types/export.types.ts`** (~100 lines)
   - `ExportOptions` interface
   - `CompletenessSummary` interface
   - `ExcelTabConfig` interface
   - `JSONExportData` interface

#### Components
7. **`src/components/export/IncompleteDataPrompt.tsx`** (~120 lines)
   - Modal for warning about incomplete data
   - Show completion percentage
   - "Cancel" and "Export Anyway" buttons

8. **`src/components/export/ExportLoadingModal.tsx`** (~80 lines)
   - Loading modal during export generation
   - Progress indicator (spinner)
   - Message: "Generating Excel file..."

### Modified Files

#### Components
1. **`src/components/landing/DownloadSharePopup.tsx`** (~20 lines changed)
   - Add "Export JSON" button below "Download Comparison Results"
   - Wire up to `exportProjectAsJSON(projectId)`

#### Config
2. **`package.json`** (dependencies)
   - Add `exceljs`, `html2canvas`, `file-saver`

---

## Testing Requirements

### Unit Tests

**File**: `test/unit/services/excelExportService.test.ts`

```typescript
describe('excelExportService', () => {
  test('generates INDEX tab with correct project info', () => {
    // Mock localStorage data
    // Call generateINDEXTab()
    // Verify rows contain project name, date, author
    // Verify table of contents has hyperlinks
  });

  test('generates Criteria tab with color-coded importance', () => {
    // Mock criteria with High/Medium/Low importance
    // Call generateCriteriaTab()
    // Verify text colors: High=Red, Medium=Orange, Low=Green
  });

  test('grays out incomplete cells in comparison matrix', () => {
    // Mock comparisonState with some cells pending
    // Call generateComparisonMatrixTab()
    // Verify pending cells have #D3D3D3 background
    // Verify completed cells have normal background
  });

  test('correctly transposes battlecards (categories → rows)', () => {
    // Mock battlecards data
    // Call generateBattlecardsTab()
    // Verify categories in Column A
    // Verify vendors in Row 1
    // Verify cell data matches vendor-category pairs
  });
});
```

**File**: `test/unit/utils/exportHelpers.test.ts`

```typescript
describe('exportHelpers', () => {
  test('sanitizes project name correctly', () => {
    expect(sanitizeProjectName('CX Platform Selection!', 10)).toBe('CXPlatform');
    expect(sanitizeProjectName('Test@#$%', 5)).toBe('Test');
  });

  test('formats date correctly', () => {
    const date = new Date('2026-01-14');
    expect(formatDate(date, 'YY_MM_DD')).toBe('26_01_14');
    expect(formatDate(date, 'DD/MM/YYYY')).toBe('14/01/2026');
  });

  test('generates correct filenames', () => {
    const name = generateFilename('CX Platform Selection', 'excel');
    expect(name).toMatch(/CXPlatform_Clarioo_\d{2}_\d{2}_\d{2}\.xlsx/);
  });
});
```

**File**: `test/unit/utils/imageProcessing.test.ts`

```typescript
describe('imageProcessing', () => {
  test('generates initials badge with correct color', async () => {
    const badge = await generateInitialsBadge('Tulip', '#0066FF', 40);
    expect(badge).toBeInstanceOf(Buffer);
    expect(badge.length).toBeGreaterThan(0);
    // Visual verification: save to file and inspect
  });

  test('fetches and processes vendor logo', async () => {
    const mockUrl = 'https://example.com/logo.png';
    // Mock fetch response
    const logo = await fetchVendorLogo(mockUrl);
    expect(logo).toBeInstanceOf(Buffer);
  });

  test('applies circular mask to image', async () => {
    // Load test image
    const testImage = fs.readFileSync('test/fixtures/logo.png');
    const circular = await applyCircularMask(testImage, 40);
    expect(circular).toBeInstanceOf(Buffer);
    // Verify dimensions are 40x40
  });
});
```

### Integration Tests

**File**: `test/integration/excelExport.test.ts`

```typescript
describe('Excel Export Integration', () => {
  test('exports Excel from criteria page', async () => {
    // Setup: localStorage with project + criteria only
    const projectId = 'test_proj_001';
    localStorage.setItem(`clarioo_project_${projectId}`, JSON.stringify({ name: 'Test Project' }));
    localStorage.setItem(`clarioo_criteria_${projectId}`, JSON.stringify([...]));

    // Export
    const blob = await exportProjectToExcel(projectId);

    // Verify
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(blob.size).toBeGreaterThan(0);

    // Load workbook and verify structure
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    expect(workbook.worksheets.length).toBe(2); // INDEX + Criteria only
  });

  test('exports Excel with incomplete comparison data', async () => {
    // Setup: localStorage with partial comparison (some cells pending)
    const projectId = 'test_proj_002';
    setupPartialComparisonData(projectId);

    // Export (should prompt, but auto-confirm for test)
    const blob = await exportProjectToExcel(projectId, { skipPrompt: true });

    // Load and verify
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    const matrixTab = workbook.getWorksheet('3. Vendor Evaluation');

    // Verify some cells are grayed out
    const grayCell = matrixTab.getCell('E19'); // Example pending cell
    expect(grayCell.fill.fgColor.argb).toBe('FFD3D3D3');
  });

  test('exports JSON with all localStorage data', async () => {
    // Setup: Full project data
    const projectId = 'test_proj_003';
    setupCompleteProjectData(projectId);

    // Export JSON
    const jsonBlob = await exportProjectAsJSON(projectId);
    const jsonText = await jsonBlob.text();
    const jsonData = JSON.parse(jsonText);

    // Verify structure
    expect(jsonData.metadata.projectId).toBe(projectId);
    expect(jsonData.data.project).toBeDefined();
    expect(jsonData.data.criteria).toBeInstanceOf(Array);
    expect(jsonData.data.vendors).toBeInstanceOf(Array);
    expect(jsonData.data.comparisonState).toBeDefined();
    expect(jsonData.data.battlecardsState).toBeDefined();
    expect(jsonData.data.scatterPlotPositions).toBeDefined();
  });
});
```

### Visual/Manual Testing Checklist

- [ ] **Excel Styling**:
  - [ ] Headers use #0066FF background with white text
  - [ ] Font is Inter, size 11-12pt
  - [ ] Borders are light gray (#D3D3D3)
  - [ ] Alternating row colors (#FFFFFF, #F9FAFB)

- [ ] **Logos**:
  - [ ] Vendor List logos are 40x40px circular
  - [ ] Matrix header logos are 30x30px circular
  - [ ] Battlecards header logos are 30x30px circular
  - [ ] Fallback initials badges use correct colors
  - [ ] Missing logos trigger fallback (no broken images)

- [ ] **Scatter Plot Screenshot**:
  - [ ] Screenshot is 600x400px
  - [ ] Axis labels visible
  - [ ] Legend visible
  - [ ] Vendor logos visible in plot
  - [ ] Screenshot quality is good (2x resolution)

- [ ] **Icons**:
  - [ ] ✓ icon displays for "Yes" matches
  - [ ] +/- icon displays for "Partial" matches
  - [ ] ? icon displays for "Unknown" matches
  - [ ] Icons are properly sized (16pt font)
  - [ ] Icon legend row is visible and clear

- [ ] **Incomplete Data**:
  - [ ] Pending cells have #D3D3D3 gray background
  - [ ] Pending cells are empty (no icon/text)
  - [ ] Warning prompt appears when exporting incomplete data
  - [ ] Prompt shows correct completion percentage

- [ ] **Battlecards Transposition**:
  - [ ] Categories appear in Column A (rows)
  - [ ] Vendors appear in Row 1 (columns)
  - [ ] Cell data matches vendor-category pairs correctly
  - [ ] Research text + source URLs display properly

- [ ] **JSON Export**:
  - [ ] JSON file downloads successfully
  - [ ] JSON is valid (no syntax errors)
  - [ ] All required fields present
  - [ ] File size is reasonable (<2MB)

- [ ] **File Naming**:
  - [ ] Excel filename: `{ProjectName10}_Clarioo_{YY_MM_DD}.xlsx`
  - [ ] JSON filename: `{ProjectName10}_Clarioo_{YY_MM_DD}.json`
  - [ ] Special characters removed from project name
  - [ ] Project name truncated to 10 characters

---

## Acceptance Criteria

### Excel Export

**✅ Functional Requirements**:
1. Export button accessible from all workflow pages via "Download or Share" popup
2. Excel contains 5-7 tabs (depending on data availability):
   - Always: INDEX, Criteria, Vendor List
   - Conditional: Comparison Matrix, Detailed Matching, Executive Summary, Battlecards
   - Note: Create only ONE version of each tab (no duplicate empty/filled versions)
3. Incomplete data cells are grayed out (#D3D3D3 background)
4. User is prompted when exporting incomplete data (running/paused states)
5. No prompt when exporting complete data or stage-appropriate data (e.g., just criteria)

**✅ Styling Requirements**:
1. All tabs use Clarioo brand color (#0066FF) for headers
2. Font: Inter, size 11-12pt for headers/body
3. Vendor logos appear as circular images (40x40px in tables, 30x30px in headers)
4. Match status icons: ✓ (Yes), +/- (Partial), ? (Unknown)
5. Background colors for match status: #E5EBFB (Yes), #F0EFFC (Partial), #F4F5F7 (Unknown)
6. Scatter plot embedded as 600x400px screenshot with axis labels and legend
7. Borders, alternating row colors, and proper spacing applied

**✅ Data Accuracy**:
1. All visible data from localStorage is accurately transferred to Excel
2. Evidence text includes both evidenceDescription and researchNotes
3. Source URLs are hyperlinked
4. Battlecards transposed correctly (categories → rows, vendors → columns)
5. Rankings calculated correctly with proper scoring formula
6. Icon legend row appears in comparison matrix

**✅ Performance**:
1. Excel generation completes in <10 seconds for typical project (10 vendors, 20 criteria)
2. Loading modal displays during generation
3. UI remains responsive (async export)
4. File size is reasonable (<5MB)

### JSON Export

**✅ Functional Requirements**:
1. JSON export button in "Download or Share" popup below Excel export
2. JSON contains ALL localStorage data:
   - Project metadata
   - Tech request
   - Criteria (all, including archived)
   - Vendors (full objects)
   - Comparison state
   - Stage 1 & 2 results
   - Battlecards state
   - Scatter plot positions
   - Executive summary
3. JSON includes metadata: exportedAt, exportedBy, version, projectId
4. JSON is pretty-printed with 2-space indent

**✅ Data Completeness**:
1. Exported JSON can reconstruct entire project state
2. All localStorage keys captured
3. No data loss or corruption
4. File size <2MB for typical project

**✅ Format**:
1. Valid JSON syntax (no errors)
2. Structured with metadata wrapper
3. Human-readable (pretty-printed)
4. Filename follows convention: `{ProjectName10}_Clarioo_{YY_MM_DD}.json`

---

## Related Documents

- **Template Reference**: `00_IMPLEMENTATION/WIP/V3 Updated Excel templates for download (with CX example).xlsx`
- **Previous Sprint**: [SP_026_Vendor_Positioning_Scatter_Plot.md](./SP_026_Vendor_Positioning_Scatter_Plot.md)
- **Next Sprint**: SP_028_JSON_Import_N8N_Sharing (JSON import via n8n workflow)
- **Architecture**: [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Progress Tracking**: [PROGRESS.md](../PROGRESS.md)
- **Project Roadmap**: [PROJECT_ROADMAP.md](../PROJECT_ROADMAP.md)

---

## Risk Assessment

### High Risk
- ⚠️ **Logo fetching failures**: External URLs may be unreachable or blocked by CORS
  - **Mitigation**: Implement fallback to initials badges, test with proxy if needed
- ⚠️ **Large file sizes**: Many vendor logos + screenshot could exceed browser limits
  - **Mitigation**: Compress images to 85% quality, use JPEG for screenshot, monitor file size
- ⚠️ **Screenshot timing**: Scatter plot animations may not complete before capture
  - **Mitigation**: Add explicit wait (e.g., 2 seconds) after animations, detect animation completion

### Medium Risk
- ⚠️ **Complex Excel formatting**: ExcelJS may have styling limitations
  - **Mitigation**: Test all styling early, use fallback styles if advanced features unavailable
- ⚠️ **Memory usage**: Processing large datasets (50+ vendors, 50+ criteria) may cause memory issues
  - **Mitigation**: Process data in chunks, use streaming if possible, monitor memory usage

### Low Risk
- ✅ **JSON export**: Straightforward data serialization, low risk
- ✅ **File naming**: Simple string operations, well-tested

---

## Success Metrics

### User Adoption
- **Target**: 80% of users who complete comparison export at least one report
- **Measurement**: Track export button clicks vs comparison completions

### Export Quality
- **Target**: <5% of exports have styling issues or missing data
- **Measurement**: User feedback, bug reports

### Performance
- **Target**: 95% of exports complete in <10 seconds
- **Measurement**: Log export duration, track outliers

### File Size
- **Target**: 90% of Excel files <5MB
- **Measurement**: Track file sizes, identify compression opportunities

---

## Future Enhancements (Out of Scope)

1. **PDF Export**: Generate PDF reports for non-Excel users
2. **Custom Branding**: Allow users to upload company logo for cover page
3. **Template Selection**: Multiple Excel templates (e.g., Executive Summary vs Detailed)
4. **Email Integration**: Send reports directly via email
5. **Scheduled Exports**: Auto-export on project completion
6. **Export History**: Track previous exports, allow re-download
7. **Comparison Export**: Export only selected vendors/criteria
8. **Multi-Language**: Export reports in different languages

---

**Sprint Created**: January 14, 2026
**Status**: 📋 Ready for Implementation
**Next Step**: Begin Phase 1 - Setup & Dependencies
**Estimated Delivery**: January 21, 2026 (7 days)
