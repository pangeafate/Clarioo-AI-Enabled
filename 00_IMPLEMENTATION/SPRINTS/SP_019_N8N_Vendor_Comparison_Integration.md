# Sprint 019: n8n Vendor Comparison Integration

**Status**: Planned
**Priority**: High
**Duration**: TBD
**Sprint Goal**: Replace mock vendor comparison with n8n AI workflow to generate match scores and executive summary

---

## 🎯 Sprint Objectives

1. Create n8n workflow for vendor comparison analysis
2. Implement comparison types in n8n.types.ts
3. Update comparison service to use n8n webhooks (COMPARE_VENDORS + EXECUTIVE_SUMMARY)
4. Integrate with VendorComparison component
5. Generate AI-powered match scores per criterion
6. Generate executive summary with pros/cons analysis
7. Implement progressive loading for multiple vendors

---

## 📋 Key Deliverables

### n8n Workflows
- **Workflow 1**: `Clarioo_AI_Compare_Vendors.json` - Match score generation
- **Workflow 2**: `Clarioo_AI_Executive_Summary.json` - Summary generation
- **AI Model**: GPT-4o-mini for analysis
- **Input**: Vendor details, evaluation criteria, company context
- **Output**: Match scores per criterion + executive summary

### Type Definitions
- **File**: `src/types/n8n.types.ts`
- Add VendorComparisonRequest interface
- Add VendorComparisonResponse interface
- Add ExecutiveSummaryRequest interface
- Add ExecutiveSummaryResponse interface

### Service Integration
- **File**: `src/services/n8nService.ts`
- Add compareVendorsWithAI() function
- Add generateExecutiveSummary() function
- Use COMPARE_VENDORS and EXECUTIVE_SUMMARY webhooks
- Implement progressive loading (compare vendors sequentially)
- Add retry logic for failed comparisons

### Component Updates
- **File**: `src/components/vendor-discovery/VendorComparison.tsx`
- Replace mock comparison data with n8n API calls
- Add progressive loading states (Vendor 1 → Vendor 2 → Executive Summary)
- Update wave charts with AI-generated match scores
- Display AI-generated executive summary
- Handle timeout and error scenarios

---

## 🔄 Expected Outcomes

- Real AI-powered vendor comparison with intelligent match scoring
- Criterion-by-criterion analysis for each vendor
- Executive summary with strengths, weaknesses, and recommendations
- Progressive loading UX (vendors load one at a time)
- Proper error handling and retry logic
- localStorage persistence for comparison results

---

## 📝 Technical Details

### n8n Webhooks
- **Compare URL**: `src/config/webhooks.ts` → `getCompareVendorsUrl()`
- **Summary URL**: `src/config/webhooks.ts` → `getExecutiveSummaryUrl()`
- **Mode**: Production/Testing switchable
- **Timeout**: 120 seconds per vendor comparison

### Comparison Request Format
```typescript
{
  user_id: string,
  session_id: string,
  project_id: string,
  vendor: {
    id: string,
    name: string,
    description: string
  },
  criteria: Criterion[],
  company_context: string
}
```

### Comparison Response Format
```typescript
{
  success: boolean,
  vendor_id: string,
  match_percentage: number,
  criterion_scores: Array<{
    criterion_id: string,
    score: number, // 0-100
    explanation: string
  }>
}
```

### Executive Summary Request Format
```typescript
{
  user_id: string,
  session_id: string,
  project_id: string,
  vendors: Array<{
    name: string,
    match_percentage: number,
    top_strengths: string[],
    top_weaknesses: string[]
  }>,
  criteria: Criterion[]
}
```

### Executive Summary Response Format
```typescript
{
  success: boolean,
  summary: {
    recommendation: string, // Top vendor with reasoning
    strengths: string[], // Overall strengths across vendors
    weaknesses: string[], // Overall weaknesses to consider
    key_differentiators: string[], // What sets top vendors apart
    next_steps: string[] // Recommended actions
  }
}
```

---

## 🎯 Progressive Loading Strategy

1. **Phase 1**: Load Vendor 1 comparison (show wave chart update)
2. **Phase 2**: Load Vendor 2 comparison (show wave chart update)
3. **Phase 3**: Generate executive summary (show summary panel)
4. **Error Handling**: If vendor comparison fails, show error + retry button
5. **Retry Logic**: Silent retry for failed comparisons (max 2 retries per vendor)

---

## ✅ Definition of Done

- [ ] n8n workflows created and tested (compare + summary)
- [ ] Type definitions added to n8n.types.ts
- [ ] compareVendorsWithAI() function implemented
- [ ] generateExecutiveSummary() function implemented
- [ ] VendorComparison component integrated with n8n
- [ ] Progressive loading UX implemented
- [ ] Wave charts update with AI-generated scores
- [ ] Executive summary displays AI-generated insights
- [ ] Retry logic functional for failed comparisons
- [ ] localStorage persistence functional
- [ ] Build successful with 0 TypeScript errors
- [ ] Manual testing with multiple vendors
- [ ] Documentation updated (PROGRESS.md, PROJECT_ROADMAP.md)

---

**Sprint Created**: November 27, 2024
**Next Steps**: Complete SP_018 first → Then begin SP_019 implementation
