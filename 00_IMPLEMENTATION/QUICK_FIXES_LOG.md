# Quick Fixes Log
**Date:** January 10, 2026

## Fixed Issues:

### 1. EmailCollectionModal - Wrong Prop Name ✅
**Error:** `TypeError: onSuccess is not a function`

**Root Cause:** EmailCollectionModal expects `onSuccess` prop but was being called with `onEmailSubmitted`

**Files Fixed:**
- `src/components/templates/TemplatesModal.tsx` - Line 251
- `src/components/landing/TemplateCarouselSection.tsx` - Line 347

**Change:**
```diff
- onEmailSubmitted={handleEmailSubmitted}
+ onSuccess={handleEmailSubmitted}
```

---

## Remaining Issues (Not Critical):

### 2. Email Collection CORS Error ⚠️
**Error:** CORS policy blocking `https://n8n.lakestrom.com/webhook/clarioo-email-collection`

**Status:** Not urgent - separate from battlecards feature

**Solution (when needed):**
Update the email collection n8n workflow CORS headers from:
```json
"Access-Control-Allow-Origin": "https://demo.clarioo.io"
```
To:
```json
"Access-Control-Allow-Origin": "*"
```

### 3. React Key Warning in TemplatesModal ⚠️
**Warning:** `Each child in a list should have a unique "key" prop`

**Status:** False positive - keys are already present (line 215: `key={template.id}`)

**Note:** May be caused by duplicate template IDs in templates.json (non-critical)

---

## Battlecards Status:

✅ Vendor limit increased (5 → 10)
✅ CORS fixed for battlecards webhooks
✅ Reduced to 3 rows for testing (3-5 min vs 12-15 min)
✅ Improved loading states with Loader2 spinner
⚠️ **User must clear localStorage before testing** (25 corrupted rows cached)

### Clear Cache Command:
```javascript
Object.keys(localStorage)
  .filter(k => k.includes('clarioo_battlecards'))
  .forEach(k => localStorage.removeItem(k));
window.location.reload();
```
