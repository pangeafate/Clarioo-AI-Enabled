# Complete 7-Sheet Excel Reading Workflow

## All 7 Sheets to Extract

1. **INDEX** → template metadata (category, searchedBy, lookingFor, etc.)
2. **1. Evaluation Criteria** → criteria array
3. **2. Vendor List** → vendors array
4. **3. Vendor Evaluation** → comparison_matrix
5. **4. Detailed Matching** → positioning_data
6. **5. Battlecards** → battlecards
7. **6. Pre-Demo Brief** → summary_data

## New Workflow Design

```
Extract File
    ├──> Extract: INDEX
    ├──> Extract: Criteria
    ├──> Extract: Vendors
    ├──> Extract: Evaluation
    ├──> Extract: Matching
    ├──> Extract: Battlecards
    └──> Extract: Pre-Demo
          └──> Merge (7 inputs)
                └──> Transform Excel Data
                      └──> Insert Template
```

## Step-by-Step Setup

### 1. Delete Current "Parse Excel File" Node

### 2. Add 7 "Extract From File" Nodes

Create these nodes in parallel after "Extract File":

**Extract Sheet 0: INDEX**
- Node Type: `Extract From File`
- Operation: `Extract data from file` → `xlsx`
- Binary Property: `file`
- Options → Sheet Name: `INDEX`
- Name the node: `Extract Sheet: INDEX`

**Extract Sheet 1: Criteria**
- Node Type: `Extract From File`
- Operation: `Extract data from file` → `xlsx`
- Binary Property: `file`
- Options → Sheet Name: `1. Evaluation Criteria`
- Name the node: `Extract Sheet: Criteria`

**Extract Sheet 2: Vendors**
- Node Type: `Extract From File`
- Operation: `Extract data from file` → `xlsx`
- Binary Property: `file`
- Options → Sheet Name: `2. Vendor List`
- Name the node: `Extract Sheet: Vendors`

**Extract Sheet 3: Evaluation**
- Node Type: `Extract From File`
- Operation: `Extract data from file` → `xlsx`
- Binary Property: `file`
- Options → Sheet Name: `3. Vendor Evaluation`
- Name the node: `Extract Sheet: Evaluation`

**Extract Sheet 4: Matching**
- Node Type: `Extract From File`
- Operation: `Extract data from file` → `xlsx`
- Binary Property: `file`
- Options → Sheet Name: `4. Detailed Matching`
- Name the node: `Extract Sheet: Matching`

**Extract Sheet 5: Battlecards**
- Node Type: `Extract From File`
- Operation: `Extract data from file` → `xlsx`
- Binary Property: `file`
- Options → Sheet Name: `5. Battlecards`
- Name the node: `Extract Sheet: Battlecards`

**Extract Sheet 6: Pre-Demo**
- Node Type: `Extract From File`
- Operation: `Extract data from file` → `xlsx`
- Binary Property: `file`
- Options → Sheet Name: `6. Pre-Demo Brief`
- Name the node: `Extract Sheet: Pre-Demo`

### 3. Connect Extract File to All 7 Nodes

From the **Extract File** node, create 7 connections (one to each Extract Sheet node).

### 4. Add Merge Node

**Merge All Sheets**
- Node Type: `Merge`
- Mode: `Combine`
- Combination Mode: `Merge By Position`
- Connect all 7 Extract nodes to this Merge node

### 5. Connect Merge to Transform

Connect the Merge node output to **Transform Excel Data**.

## Transform Excel Data Structure

After merging, the Transform node will receive items in this order:
- `items[0...N]` = INDEX sheet rows
- `items[N+1...M]` = Criteria sheet rows
- `items[M+1...P]` = Vendors sheet rows
- `items[P+1...Q]` = Evaluation sheet rows
- `items[Q+1...R]` = Matching sheet rows
- `items[R+1...S]` = Battlecards sheet rows
- `items[S+1...T]` = Pre-Demo sheet rows

This is complex to parse. **Alternative approach below:**

## Alternative: Better Approach - Parse Each Sheet Separately

Instead of merging all at once, use a different structure:

```
Extract File
    ├──> Extract: INDEX → Transform INDEX → Set Variable: metadata
    ├──> Extract: Criteria → Transform Criteria → Set Variable: criteria
    ├──> Extract: Vendors → Transform Vendors → Set Variable: vendors
    ├──> Extract: Evaluation → Transform Evaluation → Set Variable: comparison_matrix
    ├──> Extract: Matching → Transform Matching → Set Variable: positioning_data
    ├──> Extract: Battlecards → Transform Battlecards → Set Variable: battlecards
    └──> Extract: Pre-Demo → Transform Pre-Demo → Set Variable: summary_data
          └──> Merge All Variables
                └──> Format Final Template
                      └──> Insert Template
```

This is cleaner but requires more nodes.

## Recommended: Start Simple

**For MVP, let's try the 3-sheet approach first:**

1. Just add 3 Extract nodes (INDEX, Criteria, Vendors)
2. Test to see what output format we get
3. Then decide: merge approach or separate transform approach
4. Once working, add the other 4 sheets

## Next Step

Please set up the **3 Extract From File nodes** for:
- INDEX
- 1. Evaluation Criteria
- 2. Vendor List

Then test and show me:
1. What does the Merge node output look like?
2. How many items?
3. What's the structure of each item?

Then I'll write the Transform code that handles all sheets correctly.
