# Stage 2 Prompt V2 - Changes Summary

## Problem Identified

**Issue**: Stage 2 was incorrectly downgrading vendors from "yes" (✓ tick) to "no" (❌ cross) when no competitive advantage was found.

**Example of Wrong Behavior**:
- Stage 1: Vendor A has feature → "yes" ✓
- Stage 2: No competitive advantage found → Changed to "no" ❌ with comment "No competitive advantage found"

**Why This Was Wrong**:
- Stage 1 already determined the feature exists
- Stage 2's job is to COMPARE and allocate STARS, not re-evaluate existence
- Lack of competitive advantage ≠ Feature doesn't exist

## Correct Stage 2 Behavior (V2)

### State Transition Rules

| Stage 1 Input | Stage 2 Analysis | Stage 2 Output | Notes |
|--------------|------------------|----------------|-------|
| **yes** ✓ | Competitive advantage found | **star** ⭐ | Replace evidence_url with 3rd party |
| **yes** ✓ | No competitive advantage | **yes** ✓ | KEEP AS-IS (do not downgrade) |
| **no** ❌ | Evidence clearly states absent | **no** ❌ | Keep as-is |
| **no** ❌ | Evidence does NOT clearly state absent | **unknown** ❓ | Upgrade to unknown |
| **unknown** ❓ | N/A | **unknown** ❓ | Keep as-is (do not research) |

### Key Changes in V2

#### 1. **NEVER Downgrade "yes" to "no"**
```
❌ OLD: yes + no competitive advantage → "no"
✅ NEW: yes + no competitive advantage → "yes" (keep as-is)
```

#### 2. **Evidence Verification for "no" Status**
- NEW: Stage 2 now reviews evidence links for vendors marked "no"
- Verifies if feature is truly absent or just unclear
- Upgrades "no" to "unknown" if evidence is vague/contradictory

#### 3. **Star Evidence Requirements**
- NEW: When assigning star, REPLACE evidence_url with 3rd party source
- OLD: Could keep vendor website URL
- NEW: MUST be G2, Reddit, Capterra, TrustRadius, etc.

#### 4. **Preserve "unknown" Status**
- NEW: Explicitly keep "unknown" as-is
- Do not attempt to clarify "unknown" to "yes" or "no"

## Updated Prompt Structure

### Core Principles (NEW)
1. Stage 1 determined if features exist/don't exist
2. Stage 2's job is to COMPARE and VERIFY, not re-evaluate existence
3. NEVER downgrade "yes" to "no" based on lack of competitive advantage
4. Stars are ONLY for competitive advantages with 3rd party evidence

### Search Budget Logic (UPDATED)
```
- 0 vendors with "yes" → search_count = 0 (only verify "no" evidence)
- 1 vendor with "yes" → search_count = 0 (no comparison possible)
- 2+ vendors with "yes" → search_count = 1-10 (comparative analysis)
```

### Evidence Verification (NEW SECTION)
For each vendor with Stage 1 "no":
1. Read the evidence_url provided by Stage 1
2. Check if the link clearly states the feature is absent
3. Clearly absent = explicit statement like "This feature is not available"
4. NOT clearly absent = vague, contradictory, or no clear statement
5. Update state accordingly

## Examples of Correct Behavior

### Example 1: No Competitive Advantage Found
**Stage 1 Result:**
```json
{
  "vendor_id": "abc123",
  "evidence_strength": "yes",
  "evidence_url": "https://vendor.com/docs",
  "evidence_description": "Feature available in Pro plan"
}
```

**Stage 2 Output (V2 - CORRECT):**
```json
{
  "vendor_id": "abc123",
  "state": "yes",  // ← KEPT AS YES
  "evidence_url": "https://vendor.com/docs",  // ← KEPT FROM STAGE 1
  "comment": "Feature available, no standout advantage identified"
}
```

**Stage 2 Output (OLD - WRONG):**
```json
{
  "vendor_id": "abc123",
  "state": "no",  // ← WRONG: Downgraded from yes
  "comment": "No competitive advantage found"  // ← WRONG LOGIC
}
```

### Example 2: Competitive Advantage Found
**Stage 1 Result:**
```json
{
  "vendor_id": "def456",
  "evidence_strength": "yes",
  "evidence_url": "https://vendor.com/features"
}
```

**Stage 2 Output (V2 - CORRECT):**
```json
{
  "vendor_id": "def456",
  "state": "star",  // ← UPGRADED TO STAR
  "evidence_url": "https://g2.com/compare/vendor-vs-competitor",  // ← REPLACED WITH 3RD PARTY
  "comment": "Rated #1 for automation vs Salesforce and Zoho per G2 reviews"
}
```

### Example 3: Evidence Verification (no → unknown)
**Stage 1 Result:**
```json
{
  "vendor_id": "ghi789",
  "evidence_strength": "no",
  "evidence_url": "https://vendor.com/pricing"
}
```

**Stage 2 Analysis:** Pricing page doesn't clearly state feature is absent

**Stage 2 Output (V2 - NEW BEHAVIOR):**
```json
{
  "vendor_id": "ghi789",
  "state": "unknown",  // ← UPGRADED FROM NO
  "evidence_url": "https://vendor.com/pricing",
  "comment": "Evidence unclear, feature absence not explicitly stated"
}
```

## Files Updated

1. **Created**: `00_IMPLEMENTATION/STAGE2_IMPROVED_PROMPT_V2.txt`
   - New comprehensive prompt with correct state transition rules
   - Added evidence verification section
   - Added examples of correct behavior

2. **Created**: `00_IMPLEMENTATION/STAGE2_SYSTEM_MESSAGE_V2.txt`
   - Updated system message with correct rules
   - Added prohibited actions section
   - Clarified evidence reuse priority

3. **Updated**: `00_IMPLEMENTATION/MIGRATING_TO_N8N/N8N_improvements/Clarioo TESTING AI Rank Criterion Results (Stage 2) (1).json`
   - Replaced user prompt (line 120) with V2 prompt
   - Replaced system message (line 123) with V2 system message

## Testing Checklist

After importing the updated workflow into n8n:

- [ ] Vendor with "yes" + no competitive advantage → Stays "yes" (not downgraded)
- [ ] Vendor with "yes" + competitive advantage → Upgraded to "star"
- [ ] Star vendors have 3rd party evidence URLs (not vendor.com)
- [ ] Vendor with "no" + clear absence → Stays "no"
- [ ] Vendor with "no" + unclear evidence → Upgraded to "unknown"
- [ ] Vendor with "unknown" → Stays "unknown"
- [ ] Stars awarded only when clear competitive advantage exists
- [ ] Star comments name specific competitors
- [ ] Criterion insight generated for all cases

## Migration Notes

**Action Required**:
1. Import the updated Stage 2 workflow JSON into n8n
2. Test with a sample criterion that has mixed results
3. Verify state transitions match the V2 rules
4. Archive old Stage 2 workflow as backup

**Backward Compatibility**:
- Frontend code already supports all states (yes, star, no, unknown)
- No frontend changes needed
- Stage 1 workflow unchanged
- Only Stage 2 logic updated
