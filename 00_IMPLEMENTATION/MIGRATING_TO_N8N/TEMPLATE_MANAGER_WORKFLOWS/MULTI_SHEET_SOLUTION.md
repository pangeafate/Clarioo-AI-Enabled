# Multi-Sheet Excel Reading Solution

## Problem
The current Spreadsheet File node only reads the first sheet (INDEX). We have 7 sheets total:
- Sheet 0: INDEX
- Sheet 1: "1. Evaluation Criteria"
- Sheet 2: "2. Vendor List"
- Sheet 3: "3. Vendor Evaluation"
- Sheet 4: "4. Detailed Matching"
- Sheet 5: "5. Battlecards"
- Sheet 6: "6. Pre-Demo Brief"

## Phase 1: Essential 3 Sheets (MVP)
For now, we'll read the 3 essential sheets needed for template creation:
- INDEX → template metadata
- 1. Evaluation Criteria → criteria array
- 2. Vendor List → vendors array

Later we can add the other 4 sheets for comparison_matrix, battlecards, etc.

## Solution: Use Extract From File Node (3 times)

Replace the single **Parse Excel File** node with THREE **Extract From File** nodes in parallel, each reading a different sheet.

## New Workflow Structure

```
Extract File
    ├──> Extract Sheet: INDEX
    ├──> Extract Sheet: Criteria
    └──> Extract Sheet: Vendors
          └──> Merge All Sheets
                └──> Transform Excel Data
                      └──> Insert Template
```

## Step-by-Step Instructions

### 1. Delete Current "Parse Excel File" Node

Delete the Spreadsheet File node that's currently after Extract File.

### 2. Add Three "Extract From File" Nodes

Add three **Extract From File** nodes:

**Node 1: Extract Sheet INDEX**
- Type: Extract From File
- Operation: Extract data from file → xlsx
- Binary Property: `file`
- Options → Sheet Name: `INDEX` (or `0` for sheet index)

**Node 2: Extract Sheet Criteria**
- Type: Extract From File
- Operation: Extract data from file → xlsx
- Binary Property: `file`
- Options → Sheet Name: `1. Evaluation Criteria`

**Node 3: Extract Sheet Vendors**
- Type: Extract From File
- Operation: Extract data from file → xlsx
- Binary Property: `file`
- Options → Sheet Name: `2. Vendor List`

### 3. Connect Extract File to All Three Nodes

Connect the **Extract File** node output to ALL THREE Extract From File nodes (parallel connections).

### 4. Add Merge Node

Add a **Merge** node after the three Extract From File nodes:
- Type: Merge
- Mode: Combine
- Combination Mode: Merge By Position
- Connect all three Extract nodes to this Merge node

### 5. Update Transform Excel Data

The Transform node will now receive THREE items (one per sheet):
- `items[0]` = INDEX sheet data
- `items[1]` = Criteria sheet data
- `items[2]` = Vendors sheet data

I'll create the updated Transform code separately.

## Future: Add Remaining 4 Sheets

After getting the first 3 sheets working, we can add:

**Node 4: Extract Sheet Vendor Evaluation**
- Sheet Name: `3. Vendor Evaluation`
- Data → comparison_matrix field

**Node 5: Extract Sheet Detailed Matching**
- Sheet Name: `4. Detailed Matching`
- Data → positioning_data field

**Node 6: Extract Sheet Battlecards**
- Sheet Name: `5. Battlecards`
- Data → battlecards field

**Node 7: Extract Sheet Pre-Demo Brief**
- Sheet Name: `6. Pre-Demo Brief`
- Data → summary_data field

This would require:
- 7 Extract From File nodes total
- 1 Merge node combining all 7
- Updated Transform code to parse all 7 sheets

But let's start with MVP (3 sheets) first.

## Testing

After setting this up:
1. Test the workflow
2. Check what data each Extract From File node outputs
3. Send me the structure so I can write the correct Transform code

Expected: Each Extract node should output the rows from that specific sheet.
