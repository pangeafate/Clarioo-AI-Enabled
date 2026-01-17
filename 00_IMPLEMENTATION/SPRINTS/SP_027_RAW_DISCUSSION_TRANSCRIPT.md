# SP_027 - Raw Discussion Transcript

**Date**: January 14, 2026
**Participants**: User (Sergey), Claude (Assistant)
**Topic**: Excel & JSON Export Feature Planning

---

## Initial User Requirements

**User Message 1:**

For the next sprint we are going to implement the export functionality at each of the stages, starting with the last stage when the project is done and the vendors are selected for comparison. The export will be done in the formatted Excel table that looks nice and holds all of the information that we provide to the user, including the information available upon the double-click.

In this Excel table there will be five tabs.
1. The tab with criteria, the first stage
2. Then the tab with the vendors with the screenshot of their positioning on the scatterplot
3. The tab with the comparison matrix (stars, summaries, criteria, vendor descriptions)
4. The extended comparison matrix, with each cell's content
5. The battle cards

This Excel should be done according to the provided example. In the provided example there are tabs with CX that demonstrate how the final result must look. To better understand it first convert the Excel into the Json and thoroughly investigate. For the battle cards I want the vendors and categories to be transposed. Categories on a vertical axis and vendors on a horizontal axis.

The button on every page that exports the excel will export the same version of excel that is either filled completely (for the last stage), or semi-filled, depending on the data in the local storage.

If the data hasn't been fully populated on a page, for example, the vendor comparison metrics, the non-populated cells should be grayed out.

When the table is not fully populated and you're trying to export, the button should prompt you that the work is not yet done and ask if you want to still export the current state. This is only when the current stage is not finished running between the stages. For example if I just want to export criteria, that should not happen.

In addition to the export_excel there should be a button export JSON.

The ultimate idea is that we will be storing the projects in the json format in the n8n workflow for sharing purposes. This will be done in the next sprint.

@"00_IMPLEMENTATION/WIP/V3 Updated Excel templates for download (with CX example ).xlsx" here is the example output. Pay attention that the tabs are duplicated - there is an empty tab and filled one with examples. In the exported version there will not be duplicates. Now ask me clarifying questions. PS: i would also like to beautify the downloaded excel by adding vendor logos and using other improvements in the style of our UI. After clarifying everything you need to know, you will prepare the sprint planning documents. Stay very precise to details

---

## Excel Template Analysis

**Assistant analyzed the template and asked 30 clarifying questions organized in sections:**

1. INDEX Tab (Cover Page) - Questions 1-2
2. Tab 1: Evaluation Criteria - Questions 3-4
3. Tab 2: Vendor List + Scatter Plot - Questions 5-8
4. Tab 3.1: Vendor Evaluation (Summary Matrix) - Questions 9-11
5. Tab 3.2: Extended Comparison Matrix - Questions 12-13
6. Tab 3.3: Battlecards (Transposed) - Questions 14-16
7. Export Button & Behavior - Questions 17-20
8. Excel Styling & Beautification - Questions 21-23
9. JSON Export - Questions 24-25
10. File Naming - Questions 26-27
11. Technical Implementation - Questions 28-30

**Assistant also provided what was already understood:**
- ✅ Color scheme: #0066FF (primary blue)
- ✅ Font: Inter, 12pt headers, 11pt body
- ✅ Cell background colors for match status
- ✅ Basic table structures for all 5 tabs
- ✅ Need to transpose battlecards (categories → rows, vendors → columns)
- ✅ 2-3 word summaries show below match status in cells
- ✅ Full evidence text goes in Tab 3.2 (Detailed Matching)

---

## User's Detailed Responses

**User Message 2:**

For the project information yes, you should populate project name, prepared, and everything.
Include the table of context with the hyperlinks to other tabs. Add the button "Clowness Project" in Clario but keep it gray and unclickable with the comment by its side "soon to come"

Executive summary should be a separate tab after the comparison matrix.
We don't need individual summaries, because we don't produce them in the frontend. We only do stuff that we have in the frontend. We don't add or remove anything in the excel.

For the criteria table show all criteria. Regarding the color code only color the text not the cell.

Regarding the vendor release and scatter plot yes, insert logos in column A before vendor names. Size 40x40px. Circular Crop. For missing logos generate initials badge.

For the scatter plot screenshot yes, place it below the vendor table. It should be 600px to 400px.
I support suggested capture methods and please include access labels and legend in the screenshot.
Vendor table columns - please use the template and use the data that we are producing now. We are not going to create anything new. We are just capturing what there is on the screen and transporting it to the Excel.

Show all vendors in the final ranking section. Include vendor logos and all the data there is.
For the comparison metrics show icons, not text. For the partial use +/- icon. Add one row with the legend for the icons.
Use background colors as you suggest. Include vendor logos in a header row above vendor names.

Gray out cells that still have pending or loading status and a background color as you suggested.
For the detailed matching the layout should be exactly like in the example I gave you. And the evidence should be full evidence description and research notes. Sources as hyperlink Word wrap enabled for evidence column, but there should be reasonable max height, decide yourself.

For the bottle card CSE shows all categories that we generate in the front end. Include source URLs and research text. Very similar to what we have in the detailed vendor comparison.

Category column styling is suggested.

Export button already exists on every stage under Download or Share button pop-up
Just add another Export Json button under Download Comparison Results button located in the pop-up (that exports excel)

For the incomplete data prompt - it should work both when the service is actively generating and when it is paused. Otherwise stick to your suggestion. From the comparison page you export what is ready. If user has generated the summary - you export summary, if no summary generated - you don't export it. I want at all times to export all data that the user can see on the screen.

Regarding the JSON format yes, the JSON should include all of the data that was generated and saved in the local storage. The main idea is that I can afterwards import this Json and get exactly the same project at exactly same stage of research. For the naming conventions you sanitize the project name and trim it after the first 10 letters, then go to _Clarioo_{YY_MM_DD} same for json and excel

Regarding the beautification - proceed with your suggestion, keep icons.
For the library use ExcelJS. When the excel is being exported show the suggestion modal.
Compress images.

---

## Key Requirements Summary (Extracted from Discussion)

### Tab Structure
1. **INDEX (Cover Page)**
   - Project information (name, prepared by, date)
   - Table of contents with hyperlinks
   - "Clone as Project in Clarioo" button - GRAYED OUT with comment "soon to come"

2. **Tab 1: Evaluation Criteria**
   - Show ALL criteria (including archived)
   - Color code importance: TEXT COLOR ONLY (not cell background)
     - High = Red
     - Medium = Orange
     - Low = Green
   - Columns: # | Criterion | Importance | Type | Description

3. **Tab 2: Vendor List + Scatter Plot Screenshot**
   - Vendor logos: 40x40px, circular crop, Column A before vendor names
   - Missing logos: Generate initials badge (colored circle)
   - Scatter plot: 600px x 400px, positioned BELOW vendor table
   - Include axis labels and legend in screenshot
   - Use template columns with existing frontend data (no new data generation)

4. **Tab 3.1: Vendor Evaluation (Comparison Matrix)**
   - Final rankings section: Show ALL vendors with logos
   - Comparison matrix: Show ICONS (✓, +/-, ?) not text
     - ✓ for Yes
     - +/- for Partial
     - ? for Unknown
   - One row with ICON LEGEND
   - Background colors: #E5EBFB (Yes), #F0EFFC (Partial), #F4F5F7 (Unknown)
   - Include vendor logos in HEADER ROW above vendor names
   - Gray out pending/loading cells: #D3D3D3 background

5. **Tab 3.2: Detailed Matching (Extended Evidence)**
   - Layout: Exactly like example template
   - Evidence: Full evidenceDescription + researchNotes combined
   - Sources: As hyperlinks
   - Word wrap enabled for Evidence column
   - Reasonable max height (decided by developer)

6. **Executive Summary Tab (NEW - Separate Tab)**
   - Positioned AFTER comparison matrix (between Tab 4 and 5)
   - ONLY create if executive summary exists in frontend
   - Don't generate new content - only use what exists

7. **Tab 3.3: Battlecards (TRANSPOSED)**
   - Categories on VERTICAL axis (rows in Column A)
   - Vendors on HORIZONTAL axis (columns starting from Column B)
   - Show ALL categories generated in frontend (10 rows: 7 mandatory + 3 dynamic)
   - Include source URLs and research text (similar to detailed matching)
   - Category column styling: Bold, blue background (#0066FF)
   - Vendor logos in header row (30x30px)

### Export Behavior
- **Button Location**: Existing "Download or Share" popup on ALL pages
- **Excel Export**: "Download Comparison Results" button (already exists)
- **JSON Export**: NEW button "Export JSON" UNDER "Download Comparison Results"

### Incomplete Data Handling
- **Prompt Trigger**: When service is ACTIVELY GENERATING **OR PAUSED**
- **Gray Out**: Cells with status='pending' or status='loading'
- **Background Color**: #D3D3D3 (darker gray)
- **Export Logic**: Export ALL data visible on screen
  - If executive summary generated → include it
  - If executive summary NOT generated → skip that tab
  - Same for battlecards, comparison matrix, etc.

### File Naming Convention
- **Format**: `{ProjectName10}_Clarioo_{YY-MM-DD}.xlsx` or `.json`
- **Project Name**:
  - Sanitize (remove special characters)
  - Trim to first 10 characters max
- **Date Format**: YY-MM-DD (e.g., 26-01-14)
- **Examples**:
  - "CX Platform Selection" → "CXPlatform_Clarioo_26-01-14.xlsx"
  - "Test@#$%" → "Test_Clarioo_26-01-14.json"

### JSON Export Requirements
- **Include ALL localStorage data**:
  - Project metadata
  - Tech request
  - Criteria (all, including archived)
  - Vendors (full objects)
  - Comparison state
  - Stage 1 & Stage 2 results
  - Battlecards state
  - Scatter plot positions
  - Executive summary
- **Purpose**: Enable complete project reconstruction at exact same stage
- **Format**: Pretty-printed JSON (for readability)
- **Metadata**: Include exportedAt, exportedBy, version, projectId

### Styling & Beautification
- **Primary Color**: #0066FF (brand blue)
- **Font**: Inter, 12pt headers, 11pt body
- **Vendor Logos**:
  - Vendor List: 40x40px circular
  - Matrix headers: 30x30px circular
  - Battlecards headers: 30x30px circular
  - Fallback: Colored circle with initials (first 2 letters)
- **Icons**: Keep icons (✓, +/-, ?)
- **Images**: Compress all images (85% quality suggested)
- **Library**: Use ExcelJS
- **Loading Modal**: Show modal during export generation

### Technical Specifications from Template Analysis

**Discovered from Excel Template:**

1. **INDEX Tab**:
   - Row 1: "Clone as Project in Clarioo" button placeholder
   - Row 2: "SOFTWARE SELECTION PROJECT" (large, bold)
   - Row 3: "Powered by Clarioo AI — Your Software Discovery & Selection Co-pilot"
   - Row 5: PROJECT INFORMATION section
   - Row 11: TABLE OF CONTENTS section

2. **Header Styling**:
   - Background: #0066FF (bright blue)
   - Text: White, Bold
   - Font: Inter, Size 12pt

3. **Cell Background Colors** (from template):
   - Yes cells: #E5EBFB (light blue)
   - Partial cells: #F0EFFC (light purple)
   - Unknown cells: #F4F5F7 (light gray)

4. **Criteria Tab Structure**:
   - Row 1: "EVALUATION CRITERIA & REQUIREMENTS SPECIFICATION"
   - Row 3: "EVALUATION CRITERIA" (section header)
   - Row 4: Header row (# | Criterion | Importance | Type | Description)
   - Row 5+: Data rows

5. **Vendor List Tab Structure**:
   - Row 1: "SHORTLISTED VENDORS"
   - Row 3: "SCREENING SUMMARY" (section header)
   - Row 4: Summary text (if available)
   - Row 6: "VENDOR LIST" (section header)
   - Row 7: Header row (# | [Logo] | Vendor | Description | Website)
   - Row 8+: Data rows
   - Below table: "STRATEGIC POSITIONING" section with scatter plot

6. **Comparison Matrix Structure**:
   - Row 1: "VENDOR COMPARISON MATRIX"
   - Row 3: "FINAL VENDOR RANKINGS"
   - Row 4: Header (Rank | [Logo] | Vendor | Score | Yes | Partial | Unknown | About Vendor | Research Insights)
   - Row 5+: Ranking data
   - Row N: Scoring formula explanation
   - Row N+3: "CRITERIA VS VENDORS"
   - Row N+4: Icon legend (✓ = Yes | +/- = Partial | ? = Unknown)
   - Row N+5: Matrix header (# | Criterion | Priority | Type | [Vendor Logos])
   - Row N+6: Vendor names
   - Row N+7+: Matrix data (icons + summaries)

7. **Detailed Matching Structure**:
   - Row 1: "VENDORS' DETAILED CRITERIA MATCHING"
   - Row 3: "DETAILED EVIDENCE & REASONING"
   - Row 4: Header (Vendor | Criterion | Priority | Status | Evidence | Sources)
   - Row 5+: One row per vendor-criterion pair

8. **Battlecards Structure** (from template, but NEEDS TRANSPOSITION):
   - Template shows: Vendor | Ideal For | Target Verticals | Key Customers | ...
   - **OUR VERSION (TRANSPOSED)**:
     - Row 1: "VENDOR BATTLECARDS"
     - Row 3: "DEEP RESEARCH OF KEY VENDOR DIFFERENCES"
     - Row 4: [Category] | [Vendor1 Logo] | [Vendor2 Logo] | ...
     - Row 5: (blank) | Vendor1 Name | Vendor2 Name | ...
     - Row 6: Ideal For | [text+url] | [text+url] | ...
     - Row 7: Target Verticals | [text+url] | [text+url] | ...
     - ... (10 total category rows)

### Progressive Export Logic

**Stage 1: Criteria Only**
- Export Tabs: INDEX + Criteria
- No prompt (complete stage)

**Stage 2: Vendors Discovered**
- Export Tabs: INDEX + Criteria + Vendor List (with scatter plot)
- No prompt (complete stage)

**Stage 3: Comparison In Progress**
- Export Tabs: INDEX + Criteria + Vendor List + Comparison Matrix (partial)
- Prompt: "⚠️ Data Collection In Progress - [Stage X] is still generating (Y% complete). Exported file will contain incomplete data with grayed-out cells."
- Gray out pending/loading cells

**Stage 4: Comparison Complete, No Summary/Battlecards**
- Export Tabs: INDEX + Criteria + Vendor List + Comparison Matrix + Detailed Matching
- No summary tab (not generated)
- No battlecards tab (not generated)
- No prompt (user hasn't started those stages)

**Stage 5: Comparison Complete, Summary Generated, Battlecards In Progress**
- Export Tabs: All tabs including Executive Summary
- Battlecards tab with partial data (gray out incomplete rows)
- Prompt if battlecards actively generating/paused

**Stage 6: Everything Complete**
- Export all 7 tabs (INDEX + 6 data tabs)
- No prompt (everything complete)

### Data Sources (localStorage Keys)

```typescript
// Complete list from discussion
const dataSources = {
  project: `clarioo_project_${projectId}`,
  techRequest: `clarioo_techRequest_${projectId}`,
  criteria: `clarioo_criteria_${projectId}`,
  vendors: `clarioo_vendors_${projectId}`,
  comparisonState: `clarioo_comparison_state_${projectId}`,
  stage1Results: `clarioo_stage1_${projectId}`,
  stage2Results: `clarioo_stage2_${projectId}`,
  battlecardsState: `clarioo_battlecards_state_${projectId}`,
  battlecardsRows: `clarioo_battlecards_rows_${projectId}`,
  scatterPlotPositions: `vendor_scatterplot_positions_${projectId}`,
  executiveSummary: `clarioo_executive_summary_${projectId}`,
  comparisonVendors: `comparison_vendors_${projectId}`, // For vendor colors
  userEmail: 'user_email', // For "Prepared By" field
};
```

### Logo Processing Logic

```typescript
// From discussion
interface LogoProcessing {
  // Fetch logo from URL
  fetch: {
    method: 'GET',
    cors: true, // Use CORS for cross-origin images
    fallback: 'initials badge if fetch fails'
  },

  // Circular crop
  crop: {
    method: 'Canvas API or Sharp library',
    shape: 'circle',
    size: {
      vendorList: '40x40px',
      matrixHeaders: '30x30px',
      battlecardsHeaders: '30x30px',
      rankingTable: '40x40px'
    }
  },

  // Initials badge fallback
  fallback: {
    shape: 'circle',
    backgroundColor: 'vendor.color from comparisonVendors OR #0066FF default',
    text: 'First 2 letters of vendor name (uppercase)',
    textColor: 'white',
    font: 'Inter, Bold'
  },

  // Compression
  compression: {
    format: 'JPEG for photos, PNG for badges',
    quality: 85, // 85% quality
    method: 'ExcelJS built-in or Sharp'
  }
}
```

### Scatter Plot Screenshot Logic

```typescript
// From discussion
interface ScatterPlotCapture {
  library: 'html2canvas v1.4.1',
  element: '.scatter-plot-container', // CSS selector
  size: {
    width: '600px',
    height: '400px'
  },
  resolution: '2x', // Retina display quality
  options: {
    scale: 2,
    backgroundColor: '#FFFFFF',
    useCORS: true, // Allow cross-origin vendor logos
    logging: false
  },
  waitFor: 'animations to complete', // ~2 seconds after load
  includeInScreenshot: [
    'axis labels',
    'legend',
    'vendor logos on plot',
    'axis titles'
  ],
  format: 'JPEG',
  quality: 85, // 85% compression
  embedIn: 'Excel as image, anchor to cell'
}
```

### Icon Mapping

```typescript
// From discussion and template
const matchStatusIcons = {
  yes: '✓',      // Unicode U+2713 (Check Mark)
  star: '+/-',   // For partial matches
  no: '✗',       // Unicode U+2717 (Ballot X) - if ever needed
  unknown: '?',  // Question mark
  pending: '',   // Empty for pending cells
  loading: ''    // Empty for loading cells
};

// Background colors per status
const matchStatusColors = {
  yes: '#E5EBFB',     // Light blue
  partial: '#F0EFFC', // Light purple
  star: '#F0EFFC',    // Same as partial
  unknown: '#F4F5F7', // Light gray
  pending: '#D3D3D3', // Darker gray (incomplete)
  loading: '#D3D3D3'  // Darker gray (incomplete)
};
```

### Importance Color Coding

```typescript
// From discussion - TEXT COLOR ONLY
const importanceColors = {
  high: '#FF0000',    // Red
  medium: '#FFA500',  // Orange
  low: '#00AA00'      // Green
};

// NOT cell background - just text color
```

### Scoring Formula (from template)

```
Priority Weights:
  HIGH = 3x
  MEDIUM = 2x
  LOW = 1x

Status Scores:
  YES = 100%
  PARTIAL = 50%
  UNKNOWN = 25%
  NO = 0%

Formula:
  Score = Σ(Priority Weight × Status Score) / Max Possible Score

Example:
  - 10 criteria total
  - 5 HIGH (weight=3), 3 MEDIUM (weight=2), 2 LOW (weight=1)
  - Max possible = (5*3 + 3*2 + 2*1) * 100 = 2100
  - Vendor A: 4 HIGH YES (1200) + 2 MEDIUM YES (400) + 1 LOW PARTIAL (50) = 1650
  - Vendor A Score = 1650 / 2100 = 78.57%
```

### Tab Names (Exact)

```typescript
const tabNames = {
  index: 'INDEX',
  criteria: '1. Evaluation Criteria',
  vendorList: '2. Vendor List',
  comparisonMatrix: '3.1 Vendor evaluation',
  detailedMatching: '3.2 Detailed Matching',
  executiveSummary: 'Executive Summary', // NEW - separate tab
  battlecards: '3.3 Battlecards'
};
```

### Important "Don'ts" from Discussion

1. ❌ **Don't create individual executive summaries per tab** - only one separate tab
2. ❌ **Don't generate new data** - only export what exists in frontend/localStorage
3. ❌ **Don't color cell backgrounds for importance** - only text color
4. ❌ **Don't show text for match status** - use icons (✓, +/-, ?)
5. ❌ **Don't prompt when exporting stage-appropriate data** (e.g., just criteria)
6. ❌ **Don't create duplicate tabs** (template has CX examples - we only create one version)
7. ❌ **Don't add/remove anything** - exact replica of frontend data

### Important "Do's" from Discussion

1. ✅ **Do transpose battlecards** - categories in rows, vendors in columns
2. ✅ **Do gray out incomplete cells** - #D3D3D3 background
3. ✅ **Do prompt for incomplete data** - both running AND paused states
4. ✅ **Do export all visible screen data** - progressive export based on stage
5. ✅ **Do include vendor logos** - circular, various sizes per tab
6. ✅ **Do compress images** - 85% quality
7. ✅ **Do use ExcelJS** - advanced styling capabilities
8. ✅ **Do show loading modal** - during export generation
9. ✅ **Do include axis labels and legend** - in scatter plot screenshot
10. ✅ **Do add icon legend row** - in comparison matrix
11. ✅ **Do sanitize and trim project name** - max 10 chars in filename
12. ✅ **Do include source URLs** - as hyperlinks in detailed matching and battlecards

### Edge Cases Mentioned

1. **Missing vendor logos**: Generate initials badge with vendor color
2. **No executive summary**: Skip that tab entirely
3. **No battlecards generated**: Skip that tab entirely
4. **Partial comparison data**: Gray out incomplete cells, show prompt
5. **Very long text**: Word wrap enabled with reasonable max height
6. **Special characters in project name**: Sanitize before using in filename
7. **Archived criteria**: Include ALL criteria (even archived ones) in export

### Performance Considerations

1. **File size target**: <5MB for typical project
2. **Generation time target**: <10 seconds
3. **Image compression**: 85% quality JPEG/PNG
4. **Loading modal**: Show immediately when export starts
5. **Async operation**: Don't block UI during generation
6. **Memory management**: Process data in chunks if needed

---

## Validation Checklist

After sprint document creation, verify:

- [ ] All 7 tabs documented with exact structure
- [ ] Tab numbering matches template (1, 2, 3.1, 3.2, Executive Summary, 3.3)
- [ ] INDEX tab includes "Clone as Project" grayed button with "soon to come" comment
- [ ] Criteria: Text color only for importance (not cell background)
- [ ] Vendor logos: 40x40px in tables, 30x30px in headers, circular crop
- [ ] Scatter plot: 600x400px, positioned below vendor table
- [ ] Comparison matrix: Icons (✓, +/-, ?), not text
- [ ] Icon legend row included in comparison matrix
- [ ] Vendor logos in header row above vendor names (comparison matrix)
- [ ] Detailed matching: evidenceDescription + researchNotes combined
- [ ] Executive summary: SEPARATE tab after comparison matrix
- [ ] Battlecards: TRANSPOSED (categories→rows, vendors→columns)
- [ ] Incomplete data: Gray (#D3D3D3) for pending/loading cells
- [ ] Prompt: Shown for actively generating OR paused states
- [ ] Export button: In existing "Download or Share" popup
- [ ] JSON button: UNDER "Download Comparison Results" button
- [ ] File naming: {ProjectName10}_Clarioo_{YY-MM-DD}
- [ ] JSON includes ALL localStorage data
- [ ] Library: ExcelJS confirmed
- [ ] Loading modal: Confirmed
- [ ] Image compression: 85% quality confirmed
- [ ] Progressive export: Export only what's visible on screen
- [ ] No new data generation: Only use existing frontend data

---

## Questions Asked and Answered

### Question: Should Executive Summary be a separate tab?
**Answer**: Yes, separate tab AFTER comparison matrix (between Tab 3.2 and 3.3)

### Question: Should we generate individual summaries per tab?
**Answer**: No, we don't produce them in frontend. Don't add/remove anything.

### Question: Color code importance on cell background or text?
**Answer**: TEXT COLOR ONLY (High=Red, Medium=Orange, Low=Green)

### Question: Show "Yes"/"Partial" text or icons in comparison matrix?
**Answer**: Show ICONS (✓, +/-, ?), not text. Add icon legend row.

### Question: Where to position scatter plot screenshot?
**Answer**: BELOW vendor table (not side-by-side)

### Question: Scatter plot size?
**Answer**: 600px x 400px

### Question: Where is export button?
**Answer**: Existing "Download or Share" popup on all pages. JSON button goes UNDER Excel button.

### Question: When to prompt for incomplete data?
**Answer**: Both when actively generating AND when paused. Don't prompt for stage-appropriate exports.

### Question: What to do if executive summary not generated?
**Answer**: Skip that tab entirely. Export all data visible on screen.

### Question: File naming convention?
**Answer**: {ProjectName10}_Clarioo_{YY-MM-DD} - Sanitize and trim to 10 chars

### Question: What data should JSON include?
**Answer**: ALL localStorage data for complete project reconstruction

### Question: Vendor logo sizes?
**Answer**: 40x40px in vendor list/ranking, 30x30px in matrix/battlecard headers

### Question: How to handle missing logos?
**Answer**: Generate colored initials badge (first 2 letters)

### Question: What library to use?
**Answer**: ExcelJS (confirmed for advanced styling)

### Question: Should we show loading indicator?
**Answer**: Yes, modal during export generation

### Question: Should we compress images?
**Answer**: Yes, 85% quality

### Question: What goes in Evidence column of Detailed Matching?
**Answer**: Full evidenceDescription + researchNotes combined

### Question: Should battlecards be transposed?
**Answer**: YES - Categories in rows (vertical), Vendors in columns (horizontal)

---

## Critical Implementation Notes

1. **Button Text Correction**: User wrote "Clowness Project" but clearly meant "Clone as Project" (typo in original message)

2. **Tab Count Discrepancy**: User initially said "five tabs" but then executive summary adds a 6th tab, plus INDEX = 7 total tabs. This was clarified to be 7 tabs total.

3. **Icon for Partial**: User specified "+/-" icon specifically, not star emoji (⭐)

4. **Export Logic Key Point**: "I want at all times to export all data that the user can see on the screen" - This means progressive export based on what's completed, not fixed tab structure.

5. **Prompt Trigger**: Must trigger prompt for BOTH actively generating AND paused states (not just running)

6. **Source URLs**: Include in both Detailed Matching AND Battlecards as hyperlinks

7. **Category Column in Battlecards**: Use suggested styling (bold, blue background #0066FF)

8. **Date Format**: YY-MM-DD not YYYY-MM-DD (e.g., 26-01-14, not 2026-01-14)

---

## End of Discussion Transcript
