# Vendor Battlecards n8n Workflow - Creation Summary

**Date**: January 10, 2026
**Sprint**: SP_023 - Vendor Battlecards
**Phase**: 1-2 Complete, n8n Workflow Designed

---

## ✅ What Was Created

### 1. n8n Workflow File
**File**: `/00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_AI_Battlecard_Row.json`

**Key Features**:
- Row-by-row battlecard generation (one category at a time)
- 3 mandatory categories + 5-9 dynamic categories
- GPT-4o-mini + Perplexity integration
- Duplicate prevention logic
- Structured JSON output
- 90-second timeout per row
- 15 search budget per row

### 2. Workflow Documentation
**File**: `/00_IMPLEMENTATION/SPRINTS/SP_023_Vendor_Battlecards/n8n_workflow_design.md`

**Contents**:
- Complete workflow architecture diagram
- Input/output specifications
- AI research process (3 phases)
- Search budget management
- Deployment instructions
- Testing examples
- Error handling strategies
- Performance optimization tips

---

## 🎯 Workflow Design Highlights

### Input Format
```json
{
  "vendor_names": ["Salesforce", "HubSpot", "Pipedrive"],
  "project_context": "B2B SaaS CRM comparison",
  "criteria": [...],  // User's evaluation criteria (for context)
  "already_filled_categories": ["Target Verticals", "Key Customers"],
  "is_mandatory_category": false,
  "requested_category": null
}
```

### Output Format
```json
{
  "success": true,
  "row": {
    "row_id": "battlecard_row_4",
    "category_title": "Pricing Model",
    "category_definition": "How vendors structure pricing and billing",
    "cells": [
      {
        "vendor_name": "Salesforce",
        "text": "$25-300/user/month across 5 editions...",
        "source_url": "https://salesforce.com/pricing"
      }
    ]
  }
}
```

### Key Differences from Vendor Comparison Workflow

| Aspect | Vendor Comparison | Vendor Battlecards |
|--------|-------------------|-------------------|
| Input | 1 vendor + all criteria | Multiple vendors + 1 category |
| Output | Complete vendor evaluation | 1 row with cells per vendor |
| Searches | 25 per vendor | 15 per category |
| Data | Scores (yes/star/no) | Text descriptions |
| Purpose | Evaluate vendor fit | Compare vendor differences |

---

## 📋 Mandatory Categories (Rows 1-3)

These MUST be generated first:

1. **Target Verticals**: Industries/sectors the solution focuses on
   - Example: "Retail (40%), Manufacturing (30%), Healthcare (20%)"

2. **Key Customers**: Notable clients, case studies, customer types
   - Example: "Major clients include Walmart, Amazon, Toyota"

3. **Main Integrations**: Key partnerships, ecosystem integrations
   - Example: "Native integrations with Salesforce, SAP, Oracle"

---

## 🔄 Dynamic Category Pool (Rows 4-12)

AI selects 5-9 from this pool based on vendor context:

- Pricing Model
- Company Size/Maturity
- Geographic Focus
- Implementation Complexity
- Support Model
- Security/Compliance
- Deployment Options
- Contract Terms
- Target Company Size
- Industry Vertical Specialization

---

## 🚀 Next Steps to Deploy

### 1. Import into n8n (5 min)
```bash
1. Open n8n dashboard
2. Click "Add workflow" → "Import from File"
3. Select: Clarioo_AI_Battlecard_Row.json
4. Configure credentials:
   - OpenAI API key
   - Perplexity API key
5. Update CORS headers to your domain
6. Activate workflow
```

### 2. Get Webhook URL
After activation, copy the webhook URL:
```
https://your-n8n-domain.com/webhook/clarioo-battlecard-row
```

### 3. Update Frontend Config
Add to `src/config/n8n.config.ts` (or wherever webhooks are configured):
```typescript
export const N8N_WEBHOOKS = {
  // ... existing webhooks
  BATTLECARD_ROW: 'https://your-n8n-domain.com/webhook/clarioo-battlecard-row',
};
```

### 4. Test the Workflow
Use the curl examples from `n8n_workflow_design.md` to test:
- Mandatory category generation
- Dynamic category selection
- Error handling
- Response format

---

## 🧪 Testing Checklist

Before integrating with frontend:

- [ ] Test mandatory category: "Target Verticals"
- [ ] Test mandatory category: "Key Customers"
- [ ] Test mandatory category: "Main Integrations"
- [ ] Test dynamic category selection (4th row)
- [ ] Test duplicate prevention (already_filled_categories)
- [ ] Test with 2 vendors (minimum)
- [ ] Test with 5 vendors (maximum)
- [ ] Test error handling (invalid input)
- [ ] Test timeout behavior (>90s)
- [ ] Verify source URLs are present
- [ ] Check text quality (specific, factual, 1-3 sentences)

---

## 📊 Expected Performance

### Timing
- **Per Row**: 60-90 seconds
- **3 Mandatory Rows**: ~4-5 minutes
- **10 Total Rows**: ~12-15 minutes
- **Parallel with Comparison**: Both run simultaneously

### Cost
- **Per Row**: ~$0.09-$0.12
- **10 Rows**: ~$0.90-$1.20
- **Per Project**: Battlecards + Comparison ~$2-3 total

### Quality
- **Text Specificity**: Numbers, names, features included
- **Source Evidence**: 90%+ cells should have URLs
- **Category Diversity**: 8-12 unique, relevant categories
- **Duplicate Prevention**: 100% (enforced by logic)

---

## 🎨 Frontend Integration Plan (Phase 3)

### Required Files to Create

1. **Service Function** (`src/services/n8nService.ts`):
   ```typescript
   export async function generateBattlecardRow(
     projectId: string,
     vendorNames: string[],
     projectContext: string,
     criteria: any[],
     alreadyFilledCategories: string[],
     isMandatory?: boolean,
     requestedCategory?: string
   ): Promise<BattlecardRowResponse>
   ```

2. **Hook** (`src/hooks/useBattlecardsGeneration.ts`):
   - Orchestrate row-by-row generation
   - Track progress (0-100%)
   - Handle errors and retries
   - Cache to localStorage

3. **Storage Utilities** (`src/utils/battlecardsStorage.ts`):
   - Save/load battlecard rows
   - Cache key: `clarioo_battlecards_{projectId}`
   - Clear cache on regenerate

4. **Types** (`src/types/n8n.types.ts`):
   - Add `BattlecardRowRequest`
   - Add `BattlecardRowResponse`
   - Add `BattlecardCellData`

---

## 🔧 Troubleshooting

### Common Issues

**1. Webhook not responding**
- Check workflow is "Active" in n8n
- Verify CORS headers match your domain
- Check n8n logs for errors

**2. Slow response times (>120s)**
- Reduce vendor count (max 3 recommended)
- Check Perplexity API rate limits
- Reduce search budget in prompt

**3. Poor text quality (vague descriptions)**
- Review AI prompt in "AI Battlecard Research Agent" node
- Add more examples of good/bad text
- Increase temperature slightly (0.3 → 0.4)

**4. Missing source URLs**
- Check Perplexity search results in execution log
- Ensure vendors have public documentation
- Add validation in "Format Success Response" node

---

## 📝 Documentation Links

- **Sprint Plan**: [SP_023_Vendor_Battlecards.md](./SP_023_Vendor_Battlecards.md)
- **Product Spec**: [Vendor_Battlecards_Spec.md](../../WIP/Vendor_Battlecards_Spec.md)
- **Workflow Design**: [n8n_workflow_design.md](./n8n_workflow_design.md)
- **Progress Tracking**: [PROGRESS.md](../../PROGRESS.md)

---

## ✨ Success Criteria

The workflow is ready when:

1. ✅ n8n workflow imported and active
2. ✅ Credentials configured (OpenAI + Perplexity)
3. ✅ Webhook URL accessible
4. ✅ Test requests return valid JSON
5. ✅ Mandatory categories generate correctly
6. ✅ Dynamic categories avoid duplicates
7. ✅ Text quality is specific and scannable
8. ✅ Source URLs are present and relevant
9. ✅ Response time <90s per row
10. ✅ Error handling works as expected

---

**Status**: ✅ **n8n Workflow Complete - Ready for Import**

**Next Phase**: Phase 3 - Frontend Integration (n8nService + Hook)

**Estimated Time to Production**: 2-3 days (Phase 3-6)
