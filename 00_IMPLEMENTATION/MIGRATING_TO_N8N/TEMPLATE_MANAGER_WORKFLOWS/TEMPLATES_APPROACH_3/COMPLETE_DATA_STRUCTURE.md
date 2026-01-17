# Complete ExportProjectData Structure in template_data_json

**Updated**: January 16, 2026
**Status**: ✅ Simplified to 5-column schema (SP_030)

---

## ✅ SIMPLIFIED SCHEMA (5 columns only)

The n8n Data Table schema has been simplified from 21 columns to **only 5 columns**:

1. **template_id** - Unique identifier
2. **template_name** - Display name for the template
3. **template_category** - Category for filtering (e.g., "CX PLATFORM", "PROJECT MANAGEMENT")
4. **template_data_json** - Complete JSONExportData with ALL project data
5. **uploaded_at** - Upload timestamp

**Why simplified?**
- All other fields (criteria count, vendor count, boolean flags) were redundant
- They could be derived from `template_data_json` on the frontend
- Storing data twice was poor design (as noted by user feedback)

---

## What's Included in template_data_json

The `template_data_json` column in row 3 of `n8n_data_table_schema.csv` contains a **complete JSONExportData** with all project data.

---

## ✅ Complete Structure Breakdown

### 1. Core Metadata
```json
{
  "projectId": "luxury-fashion-cx-001",
  "projectName": "Luxury Fashion CX Platform",
  "projectDescription": "Customer experience platform for luxury retail...",
  "stage": "battlecards_complete"
}
```

### 2. Criteria Array (Section 3)
```json
"criteria": [
  {
    "id": "crit_001",
    "name": "Unified 360° Customer Profile",
    "explanation": "Platform provides a single, real-time customer profile...",
    "importance": "high",
    "type": "feature",
    "isArchived": false
  },
  {
    "id": "crit_002",
    "name": "Advanced Clienteling Workspace",
    "explanation": "Store and remote associates can access...",
    "importance": "high",
    "type": "feature",
    "isArchived": false
  }
]
```

### 3. Vendors Array (Section 4)
```json
"vendors": [
  {
    "id": "vendor_001",
    "name": "Salesforce Commerce Cloud",
    "description": "Enterprise commerce platform with customer engagement tools",
    "website": "https://www.salesforce.com"
  },
  {
    "id": "vendor_002",
    "name": "SAP Customer Experience",
    "description": "Comprehensive CX suite for luxury retail",
    "website": "https://www.sap.com"
  }
]
```

### 4. ✅ Comparison Matrix with ALL Evidence Fields (Section 5)
```json
"comparisonMatrix": {
  "criteria": {
    "crit_001": {
      "cells": {
        "vendor_001": {
          "value": "yes",
          "status": "yes",
          "evidenceDescription": "Salesforce CDP provides unified customer profiles with real-time data sync across all touchpoints. Profiles include transaction history, browsing behavior, preferences, and custom attributes.",
          "researchNotes": "Verified in product documentation and customer case studies. Nordstrom uses this for their clienteling program.",
          "vendorSiteEvidence": "https://www.salesforce.com/products/commerce-cloud/customer-profiles/",
          "thirdPartyEvidence": "https://www.gartner.com/reviews/market/customer-data-platforms/vendor/salesforce",
          "evidenceUrl": "https://www.salesforce.com/products/commerce-cloud/customer-profiles/"
        },
        "vendor_002": {
          "value": "partial",
          "status": "partial",
          "evidenceDescription": "SAP provides customer profiles through SAP Customer Data Cloud integration, but requires additional setup...",
          "researchNotes": "Requires SAP CDC license separately. Integration complexity noted in user reviews.",
          "vendorSiteEvidence": "https://www.sap.com/products/crm/customer-data-cloud.html",
          "thirdPartyEvidence": "https://www.trustradius.com/products/sap-customer-data-cloud/reviews",
          "evidenceUrl": "https://www.sap.com/products/crm/customer-data-cloud.html"
        }
      }
    },
    "crit_002": {
      "cells": {
        "vendor_001": {
          "value": "star",
          "status": "star",
          "evidenceDescription": "Salesforce includes Einstein-powered recommendations, virtual styling tools, clienteling mobile app, and outreach automation...",
          "researchNotes": "This is a standout feature. Multiple luxury brands cite this as key differentiator.",
          "vendorSiteEvidence": "https://www.salesforce.com/products/commerce-cloud/clienteling/",
          "thirdPartyEvidence": "https://www.retaildive.com/news/how-salesforce-is-helping-luxury-brands-personalize",
          "evidenceUrl": "https://www.salesforce.com/products/commerce-cloud/clienteling/"
        }
        // ... vendor_002 cell with all evidence fields
      }
    }
  }
}
```

**✅ All Evidence Fields Included:**
- ✅ `evidenceDescription` - Main evidence text
- ✅ `researchNotes` - Additional research notes
- ✅ `vendorSiteEvidence` - URL from vendor's website
- ✅ `thirdPartyEvidence` - URL from third-party source (Gartner, G2, TrustRadius)
- ✅ `evidenceUrl` - Fallback URL
- ✅ `value` - Match status (yes/no/partial/star/unknown/pending)
- ✅ `status` - Alternate status field

### 5. ✅ Executive Summary with All Nested Sections (Section 7)
```json
"executiveSummary": {
  "generatedAt": "2026-01-14T10:30:00Z",
  "projectSummary": "Evaluation of customer experience platforms...",
  "keyCriteria": [
    {
      "name": "Unified 360° Customer Profile",
      "importance": "high",
      "description": "Single real-time view of customer across all channels"
    }
  ],
  "vendorRecommendations": [
    {
      "rank": 1,
      "name": "Salesforce Commerce Cloud",
      "matchPercentage": 95,
      "overallAssessment": "Best-in-class solution with standout clienteling features...",
      "keyStrengths": [
        "Unified customer profiles with real-time sync",
        "Einstein AI for personalized recommendations",
        "Mobile clienteling app for store associates",
        "Strong luxury retail customer base"
      ],
      "keyWeaknesses": [
        "Higher cost than alternatives",
        "Requires Salesforce ecosystem commitment"
      ],
      "bestFor": "Luxury brands seeking cutting-edge clienteling with AI-powered personalization"
    }
  ],
  "keyDifferentiators": [
    {
      "category": "AI-Powered Personalization",
      "leader": "Salesforce Commerce Cloud",
      "details": "Einstein AI provides superior product recommendations and predictive insights"
    }
  ],
  "riskFactors": {
    "vendorSpecific": [
      {
        "vendor": "Salesforce Commerce Cloud",
        "questions": [
          "What is total cost including Einstein AI licenses?",
          "Migration timeline from legacy POS system?",
          "Training requirements for store associates?"
        ]
      }
    ],
    "generalConsiderations": [
      "Change management for 30+ boutiques",
      "Data migration from legacy systems",
      "Training program for store associates",
      "Integration with existing POS/inventory systems"
    ]
  },
  "recommendation": {
    "topPick": "Salesforce Commerce Cloud",
    "reason": "Best alignment with luxury clienteling requirements, proven track record with luxury brands, standout AI capabilities",
    "considerations": [
      "Higher investment but best long-term value",
      "Prioritize Einstein AI features in implementation",
      "Plan comprehensive training program for associates",
      "Consider phased rollout across boutiques"
    ]
  }
}
```

**✅ All Executive Summary Sub-types Included:**
- ✅ `keyCriteria[]` - KeyCriterion objects
- ✅ `vendorRecommendations[]` - VendorRecommendation objects with rank, strengths, weaknesses
- ✅ `keyDifferentiators[]` - KeyDifferentiator objects
- ✅ `riskFactors` - RiskFactors with vendorSpecific and generalConsiderations
- ✅ `recommendation` - Recommendation with topPick, reason, considerations

### 6. ✅ Battlecards with Complete Content (Section 6)
```json
"battlecards": [
  {
    "category_title": "Unified Customer Profile",
    "status": "complete",
    "cells": [
      {
        "vendor_name": "Salesforce Commerce Cloud",
        "text": "**What they say:** Salesforce CDP provides 360° customer views with real-time data sync.\n\n**The reality:** TRUE - Industry-leading unified profiles. Nordstrom and other luxury retailers use this successfully. Real-time sync works well.\n\n**Evidence:** Product docs + Gartner reviews + customer case studies.\n\n**Positioning:** Best-in-class for unified profiles. Set the standard.\n\n**When to use:** Emphasize real-time capabilities and luxury brand track record."
      },
      {
        "vendor_name": "SAP Customer Experience",
        "text": "**What they say:** SAP CDC provides comprehensive customer data management.\n\n**The reality:** PARTIALLY TRUE - Requires separate CDC license. Integration adds complexity. Not as seamless as competitors.\n\n**Evidence:** SAP documentation + user reviews noting integration challenges.\n\n**Positioning:** Good for existing SAP customers, but adds licensing complexity.\n\n**When to use:** Acknowledge capability but highlight integration and licensing requirements."
      }
    ]
  },
  {
    "category_title": "AI-Powered Clienteling",
    "status": "complete",
    "cells": [
      {
        "vendor_name": "Salesforce Commerce Cloud",
        "text": "**What they say:** Einstein AI delivers personalized product recommendations and insights.\n\n**The reality:** TRUE - This is a standout feature. Multiple luxury brands cite AI recommendations as key differentiator. Mobile app is well-designed.\n\n**Evidence:** Customer testimonials + analyst reports + product demonstrations.\n\n**Positioning:** Clear leader in AI-powered clienteling. Industry-proven.\n\n**When to use:** Lead with this when AI/personalization is priority. Strong competitive advantage."
      }
      // ... SAP cell
    ]
  }
]
```

**✅ All Battlecard Fields Included:**
- ✅ `category_title` - Battlecard category name
- ✅ `status` - 'complete' (only complete battlecards are exported)
- ✅ `cells[]` - Array of vendor-specific battlecard content
  - ✅ `vendor_name` - Vendor identifier
  - ✅ `text` - Rich markdown content with competitive positioning

### 7. ✅ Battlecards Rows (Fallback)
```json
"battlecardsRows": [
  // Same structure as battlecards[] above
  // Fallback storage location for backward compatibility
]
```

### 8. Additional Fields
```json
"stage1Results": null,
"screeningSummary": ""
```

---

## Evidence URL Examples in Sample Data

### Vendor Site Evidence:
- `https://www.salesforce.com/products/commerce-cloud/customer-profiles/`
- `https://www.salesforce.com/products/commerce-cloud/clienteling/`
- `https://www.sap.com/products/crm/customer-data-cloud.html`
- `https://www.sap.com/products/crm/cx-sales.html`

### Third-Party Evidence:
- `https://www.gartner.com/reviews/market/customer-data-platforms/vendor/salesforce`
- `https://www.trustradius.com/products/sap-customer-data-cloud/reviews`
- `https://www.g2.com/products/sap-sales-cloud/reviews`
- `https://www.retaildive.com/news/how-salesforce-is-helping-luxury-brands-personalize`

---

## Complete Data Map

| Section | Fields Included | Status |
|---------|----------------|--------|
| Core Metadata | projectId, projectName, projectDescription, stage | ✅ |
| Criteria | id, name, explanation, importance, type, isArchived | ✅ |
| Vendors | id, name, description, website | ✅ |
| Comparison Matrix Cells | value, status, evidenceDescription, researchNotes, vendorSiteEvidence, thirdPartyEvidence, evidenceUrl | ✅ |
| Executive Summary - Key Criteria | name, importance, description | ✅ |
| Executive Summary - Vendor Recs | rank, name, matchPercentage, overallAssessment, keyStrengths, keyWeaknesses, bestFor | ✅ |
| Executive Summary - Differentiators | category, leader, details | ✅ |
| Executive Summary - Risk Factors | vendorSpecific, generalConsiderations | ✅ |
| Executive Summary - Recommendation | topPick, reason, considerations | ✅ |
| Battlecards | category_title, status, cells[vendor_name, text] | ✅ |
| Battlecards Rows | Same as battlecards | ✅ |

---

## What This Means

When you upload this CSV to n8n, the sample row (row 3) demonstrates:

1. ✅ **Complete comparison matrix** with all evidence URLs and research notes
2. ✅ **Full battlecard content** with competitive positioning for each vendor
3. ✅ **Complete executive summary** with recommendations, risks, and differentiators
4. ✅ **All nested arrays and objects** properly structured as JSON

This is now a **production-ready example** showing exactly what real template data looks like! 🎯

---

## Verification

To verify the sample data includes everything:

```bash
# Extract template_data_json from row 3
# Parse it as JSON
# Check for these keys:

✅ projectId, projectName, projectDescription, stage
✅ criteria[] with all fields
✅ vendors[] with all fields
✅ comparisonMatrix.criteria[].cells[].evidenceDescription
✅ comparisonMatrix.criteria[].cells[].vendorSiteEvidence
✅ comparisonMatrix.criteria[].cells[].thirdPartyEvidence
✅ executiveSummary.vendorRecommendations[]
✅ executiveSummary.keyDifferentiators[]
✅ executiveSummary.riskFactors
✅ battlecards[].cells[].text
✅ battlecardsRows[].cells[].text
```

All present! ✅
