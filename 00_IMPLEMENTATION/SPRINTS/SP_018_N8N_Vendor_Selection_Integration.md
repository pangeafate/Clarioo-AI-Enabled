# Sprint 018: n8n Vendor Selection Integration

**Status**: Planned
**Priority**: High
**Duration**: TBD
**Sprint Goal**: Replace mock vendor selection with n8n AI workflow to generate vendor recommendations based on criteria

---

## 🎯 Sprint Objectives

1. Create n8n workflow for vendor selection based on evaluation criteria
2. Implement vendor selection types in n8n.types.ts
3. Update vendor selection service to use n8n webhook
4. Integrate with VendorSelection component
5. Handle AI-generated vendor recommendations with proper error handling
6. Implement loading states and timeout handling (180 seconds)

---

## 📋 Key Deliverables

### n8n Workflow
- **Workflow File**: `Clarioo_AI_Find_Vendors.json`
- **AI Model**: GPT-4o-mini for vendor discovery
- **Input**: Project criteria, company context, solution requirements
- **Output**: 5-10 vendor recommendations with match scores

### Type Definitions
- **File**: `src/types/n8n.types.ts`
- Add VendorSelectionRequest interface
- Add VendorSelectionResponse interface
- Add TransformedVendor type

### Service Integration
- **File**: `src/services/n8nService.ts`
- Add findVendorsWithAI() function
- Use FIND_VENDORS webhook from webhooks config
- Implement 180-second timeout
- Add localStorage persistence

### Component Updates
- **File**: `src/components/vendor-discovery/VendorSelection.tsx`
- Replace mock vendor data with n8n API call
- Add loading states during vendor discovery
- Handle timeout and error scenarios
- Display AI-generated vendor recommendations

---

## 🔄 Expected Outcomes

- Real AI-powered vendor discovery based on user criteria
- Intelligent vendor matching with relevance scores
- Proper error handling for failed vendor discovery
- User-friendly loading states during AI processing
- localStorage persistence for discovered vendors

---

## 📝 Technical Details

### n8n Webhook
- **URL**: Configured via `src/config/webhooks.ts` → `getFindVendorsUrl()`
- **Mode**: Production/Testing switchable
- **Timeout**: 180 seconds (vendor search may take longer)

### Request Format
```typescript
{
  user_id: string,
  session_id: string,
  project_id: string,
  criteria: Criterion[],
  company_context: string,
  solution_requirements: string
}
```

### Response Format
```typescript
{
  success: boolean,
  vendors: Array<{
    id: string,
    name: string,
    description: string,
    match_score: number,
    key_features: string[],
    pricing_model: string,
    website_url?: string
  }>,
  total_vendors_found: number
}
```

---

## ✅ Definition of Done

- [ ] n8n workflow created and tested
- [ ] Type definitions added to n8n.types.ts
- [ ] findVendorsWithAI() function implemented
- [ ] VendorSelection component integrated with n8n
- [ ] Loading states and error handling implemented
- [ ] Timeout handling (180s) working correctly
- [ ] localStorage persistence functional
- [ ] Build successful with 0 TypeScript errors
- [ ] Manual testing completed with various criteria
- [ ] Documentation updated (PROGRESS.md, PROJECT_ROADMAP.md)

---

**Sprint Created**: November 27, 2024
**Next Steps**: Await sprint planning approval → Begin implementation
