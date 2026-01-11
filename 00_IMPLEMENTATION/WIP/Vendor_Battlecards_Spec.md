# Vendor Battlecards — Product Specification

**Feature Name**: Vendor Battlecards
**Sprint**: SP_023
**Status**: 📋 Planned
**Last Updated**: January 10, 2026

---

## 1) Purpose

The **Vendor Battlecards** module is an AI-generated, vendor-level comparison matrix that provides high-level, real-world comparison categories beyond user-defined criteria. It explains structural differences, positioning, and practical buying considerations that users typically search for on Google/ChatGPT.

**Key Differentiation**:
- **Vendor Comparison Matrix** (existing): Evaluates vendors against user's custom criteria
- **Vendor Battlecards** (new): Compares vendors on industry-standard dimensions (pricing, verticals, key clients, integrations)

This is **not a rewrite of the criteria grid**. It is closer to a "battle card" or "RFI-lite" overview highlighting:
- Pricing models and commercial terms
- Target industries/verticals
- Key customers and case studies
- Main integrations and partnerships
- Geographic focus
- Company size/maturity signals
- Implementation complexity

---

## 2) Placement and Timing

### UI Location
- **Component**: `VendorComparisonNew.tsx`
- **Position**: Below existing Vendor Comparison Matrix (VerticalBarChart), above Download/Share buttons
- **Visual Separation**: Border-top divider with "Vendor Battlecards" heading

### Component Hierarchy
```
VendorComparisonNew.tsx
├── Vendor Cards (top)
├── Vendor Comparison Matrix (Stage 1/Stage 2) ← EXISTING
│   └── VerticalBarChart.tsx
│
└── Vendor Battlecards ← NEW SECTION
    └── VendorBattlecardsMatrix.tsx
```

### Trigger Timing
- **When**: Immediately on page load (parallel with comparison matrix)
- **Parallelism**: Runs independently alongside Stage 1/Stage 2 comparison
- **Non-blocking**: Must not delay page render or existing comparison

---

## 3) Generation Strategy

### Row-by-Row AI Generation

**n8n Webhook**: `clarioo-battlecard-row`
**Timeout**: 90 seconds per row
**Execution**: Sequential row-by-row generation

#### Generation Sequence

1. **Mandatory Categories (Rows 1-3)**:
   - Target Verticals (e.g., Retail, Healthcare, Manufacturing)
   - Key Customers (e.g., Nike, Kaiser Permanente, Toyota)
   - Main Integrations (e.g., Shopify, Salesforce, SAP)

2. **Dynamic Categories (Rows 4-12)**:
   - AI selects 5-9 additional categories from pool based on vendor relevance
   - Examples: Pricing Model, Company Maturity, Geographic Focus, Implementation Complexity, Support Model

3. **Duplicate Prevention**:
   - Each API call sends `already_filled_categories` array
   - AI ensures new category doesn't duplicate existing ones
   - Continues until 8-12 total rows generated

#### Category Pool (AI Selection)
- Pricing Model (per user/month, per transaction, flat fee, custom)
- Company Size/Maturity (startup, growth-stage, enterprise, public company)
- Geographic Focus (North America, EMEA, APAC, global)
- Implementation Complexity (self-serve, assisted setup, professional services required)
- Support Model (email-only, chat, phone, dedicated account manager)
- Security/Compliance (SOC2, GDPR, HIPAA, ISO27001)
- Deployment Options (cloud-only, on-premise, hybrid)
- Contract Terms (monthly, annual, multi-year commitments)
- Target Company Size (SMB, mid-market, enterprise)
- Industry Vertical Specialization

---

## 4) UI Layout

### Desktop Layout (≥768px)

**Vendors Displayed**: 3 vendors visible (vs 5 in comparison matrix)

```
┌─────────────────────────────────────────────────────────────┐
│  VENDOR BATTLECARDS                                         │
│  ┌─────────────┬──────────────┬──────────────┬────────────┐│
│  │ Category    │ Vendor 1     │ Vendor 2     │ Vendor 3   ││
│  ├─────────────┼──────────────┼──────────────┼────────────┤│
│  │ Target      │ Retail,      │ Healthcare,  │ Manufac-   ││
│  │ Verticals   │ E-commerce   │ Finance      │ turing     ││
│  │             │ [🔗 source]  │ [🔗 source]  │ [🔗 source]││
│  ├─────────────┼──────────────┼──────────────┼────────────┤│
│  │ Key         │ Nike, Target │ Kaiser, BCBS │ Toyota,    ││
│  │ Customers   │ Walmart      │ Anthem       │ Boeing     ││
│  │             │ [🔗 source]  │ [🔗 source]  │ [🔗 source]││
│  ├─────────────┼──────────────┼──────────────┼────────────┤│
│  │ Pricing     │ $49-199/user │ Custom       │ $99+/user  ││
│  │ Model       │ per month    │ enterprise   │ volume     ││
│  │             │ [🔗 source]  │ [🔗 source]  │ [🔗 source]││
│  └─────────────┴──────────────┴──────────────┴────────────┘│
│                                                             │
│  [Regenerate] [Stop] [Executive Summary (inactive)]        │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)

**Vendors Displayed**: 2 vendors visible (vs 3 in comparison matrix)

```
┌───────────────────────────────┐
│  VENDOR BATTLECARDS           │
│  Vendor 1 ◀──▶ Vendor 2       │
│                               │
│  ┌───────────┬──────────────┐│
│  │ Category  │ Vendor 1     ││
│  ├───────────┼──────────────┤│
│  │ Target    │ Retail,      ││
│  │ Verticals │ E-commerce   ││
│  │           │ [🔗]         ││
│  ├───────────┼──────────────┤│
│  │ Key       │ Nike, Target ││
│  │ Customers │ Walmart      ││
│  │           │ [🔗]         ││
│  └───────────┴──────────────┘│
│                               │
│  ← Swipe to compare vendors →│
│                               │
│  [Regenerate] [Stop]          │
└───────────────────────────────┘
```

**Mobile Navigation**: Identical swipe pattern to existing comparison matrix, just 2 vendors instead of 3

---

## 5) Cell Content Requirements

### Text Content
- **Length**: 1-3 sentences (can be longer if needed)
- **Display**: Truncate after X characters if too long
- **Expansion**: Click to expand/collapse (same as comparison matrix)
- **Short text**: Show full text if under truncation limit

### Source URLs
- **Display**: Small external link icon (same as comparison matrix)
- **Behavior**: Click opens in new tab
- **Format**: Identical to existing Stage 1 evidence_url pattern

### No Blank Cells
- Every cell must contain either:
  - Factual synthesized statement, OR
  - "Unknown / not found" (if AI cannot find data)

### Tone and Safety
- No marketing hype or unverified claims
- No invented customers or certifications
- Neutral language (avoid "best" or ranking claims)

---

## 6) Data Inputs to n8n Webhook

### Request Payload
```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "project_id": "proj_123",
  "project_context": "Company context + solution requirements",
  "vendor_names": ["Vendor A", "Vendor B", "Vendor C"],
  "criteria": [
    {
      "name": "Criterion 1",
      "explanation": "...",
      "importance": "high",
      "type": "feature"
    }
  ],
  "already_filled_categories": ["Target Verticals", "Key Customers"],
  "is_mandatory_category": false,
  "requested_category": null
}
```

### Context Data
- **Project context**: Company description + solution requirements
- **Vendor names**: Array of vendor names to compare
- **Criteria**: User's original criteria (for context, not for comparison)
- **Already filled categories**: Prevents duplicate category generation

---

## 7) Expected Output Format

### Response Structure
```json
{
  "row_id": "battlecard_row_4",
  "category_title": "Pricing Model",
  "category_definition": "How vendors charge for their solution",
  "cells": [
    {
      "vendor_name": "Vendor A",
      "text": "$49-199 per user per month with volume discounts",
      "source_url": "https://vendora.com/pricing"
    },
    {
      "vendor_name": "Vendor B",
      "text": "Custom enterprise pricing based on seats and features",
      "source_url": "https://vendorb.com/enterprise"
    }
  ],
  "timestamp": "2026-01-10T12:00:00Z"
}
```

---

## 8) Runtime Behavior

### Loading States
- **Initial**: Show skeleton table with vendor headers
- **Progressive**: Reveal rows one-by-one as they complete
- **Progress indicator**: Same as VerticalBarChart (percentage based on rows completed)

### Auto-Retry Logic
- **Pattern**: Identical to VerticalBarChart implementation
- **Max retries**: 3 attempts per row
- **On failure**: Automatic retry with exponential backoff
- **User control**: Stop button to pause generation

### Regeneration
- **Trigger**: User clicks "Regenerate" button
- **Behavior**: Clear localStorage cache and restart generation
- **UI**: Keep existing data visible until new data arrives (no flicker)

### Caching
- **Storage**: localStorage with key pattern: `clarioo_battlecards_{projectId}`
- **Cache check**: Load on page refresh if available
- **Invalidation**: Manual regenerate clears cache

---

## 9) Component Architecture

### Cloning Strategy

**Source Components** (DO NOT MODIFY):
- `VendorComparisonNew.tsx`
- `VerticalBarChart.tsx`
- `VendorCard.tsx`
- `DesktopColumnHeader.tsx`
- `ExecutiveSummaryDialog.tsx`

**New Components** (CLONED + MODIFIED):
- `VendorBattlecardsMatrix.tsx` (clone of VendorComparisonNew)
- `BattlecardsBarChart.tsx` (clone of VerticalBarChart)
- `BattlecardVendorCard.tsx` (clone of VendorCard)
- `BattlecardsColumnHeader.tsx` (clone of DesktopColumnHeader)
- `BattlecardsExecutiveSummaryDialog.tsx` (clone of ExecutiveSummaryDialog, inactive)

### Hook Pattern
- Clone `useTwoStageComparison.ts` → `useBattlecardsGeneration.ts`
- Modify for row-by-row battlecard generation
- Preserve all existing patterns (progress, retry, caching)

---

## 10) Acceptance Criteria

### Must Have
1. ✅ Battlecards appear below comparison matrix in VendorComparisonNew.tsx
2. ✅ 3 mandatory categories always generated first (Verticals, Customers, Integrations)
3. ✅ 5-9 dynamic categories generated by AI (total 8-12 rows)
4. ✅ Desktop shows 3 vendors, mobile shows 2 vendors
5. ✅ Progressive row-by-row reveal with loading states
6. ✅ Source URLs displayed as clickable icons
7. ✅ Cell text expandable on click (same as comparison matrix)
8. ✅ Regenerate and Stop buttons functional
9. ✅ Automatic retry on error (max 3 attempts)
10. ✅ localStorage caching with same patterns as comparison matrix
11. ✅ Runs in parallel with comparison matrix (non-blocking)
12. ✅ No modifications to existing comparison components

### Out of Scope (Future Sprints)
- ❌ Battlecards executive summary generation
- ❌ Confidence levels (Confirmed/Likely/Unknown)
- ❌ Key Differences summary strip
- ❌ Row replacement logic for unknown cells

---

## 11) Notes

### Why "Vendor Battlecards"?
- Industry-standard term for vendor comparison summaries
- Emphasizes practical buying considerations
- Complements criteria-based evaluation with real-world context

### Relationship to Other Features
- **Independent from Comparison Matrix**: Completely standalone module
- **Same vendors**: Uses exact same vendor array (no separate vendor selection)
- **Different data source**: AI-generated categories vs user-defined criteria
- **Parallel execution**: Both generate simultaneously on page load

### Future Enhancements
- Battlecards executive summary (separate n8n workflow)
- Confidence indicators for cell data
- Category prioritization based on project type
- Export battlecards separately from comparison matrix

---

**Document Owner**: Engineering Team
**Related Sprint**: [SP_023_Vendor_Battlecards.md](../SPRINTS/SP_023_Vendor_Battlecards.md)
**Status**: Ready for Implementation
