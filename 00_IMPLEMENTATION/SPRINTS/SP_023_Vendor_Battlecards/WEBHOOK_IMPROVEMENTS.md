# Battlecard Webhook Configuration Improvements

**Date**: January 10, 2026
**Issue**: Battlecard webhook was configured with localhost URLs for both production and testing modes

---

## ❌ Previous Configuration (BROKEN)

```typescript
const PRODUCTION_WEBHOOKS = {
  // ... other webhooks
  BATTLECARD_ROW: 'http://localhost:8080/webhook/clarioo-battlecard-row', // ❌ Would fail in production!
};

const TESTING_WEBHOOKS = {
  // ... other webhooks
  BATTLECARD_ROW: 'http://localhost:8080/webhook/clarioo-battlecard-row', // ❌ Same localhost URL!
};
```

**Problem**: The app would try to call `http://localhost:8080` in production, which doesn't exist, causing all battlecard requests to fail.

---

## ✅ New Configuration (FIXED)

### Production Webhook
```typescript
const PRODUCTION_WEBHOOKS = {
  BATTLECARD_ROW: 'https://n8n.lakestrom.com/webhook/clarioo-battlecard-row', // ✅ Production n8n server
};
```

**Benefits**:
- Points to actual production n8n server
- Follows same pattern as other webhooks
- Will work when deployed to production

---

### Testing Webhook
```typescript
const TESTING_WEBHOOKS = {
  BATTLECARD_ROW: 'https://n8n.lakestrom.com/webhook/TODO-REPLACE-WITH-TESTING-UUID', // ⚠️ TODO
};
```

**Action Required**:
1. Deploy testing workflow to n8n
2. Get UUID webhook URL
3. Replace TODO placeholder with actual UUID

**Example**:
```typescript
BATTLECARD_ROW: 'https://n8n.lakestrom.com/webhook/a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
```

---

### Local Development Override (NEW)

Added optional override for local testing:

```typescript
const LOCAL_DEVELOPMENT_WEBHOOKS = {
  ...PRODUCTION_WEBHOOKS,
  BATTLECARD_ROW: 'http://localhost:8080/webhook/clarioo-battlecard-row', // ✅ Only used when explicitly enabled
};

export const getWebhookUrls = () => {
  const mode = getWebhookMode();

  // Check for local development override
  const localOverride = localStorage.getItem('WEBHOOK_LOCAL_OVERRIDE');
  if (localOverride === 'true') {
    console.warn('[webhooks] 🔧 Using LOCAL_DEVELOPMENT_WEBHOOKS (localhost)');
    return LOCAL_DEVELOPMENT_WEBHOOKS;
  }

  return mode === 'testing' ? TESTING_WEBHOOKS : PRODUCTION_WEBHOOKS;
};
```

**How to Use**:

To test with local n8n instance:
```javascript
// In browser console:
localStorage.setItem('WEBHOOK_LOCAL_OVERRIDE', 'true');

// When done testing:
localStorage.removeItem('WEBHOOK_LOCAL_OVERRIDE');
```

**Benefits**:
- Localhost only used when explicitly enabled
- Production/testing modes unaffected
- Easy to toggle for local development
- Clear console warning when override is active

---

## 📊 Comparison with Other Webhooks

All webhooks now follow the same pattern:

| Webhook | Production URL | Testing URL | Local Override |
|---------|---------------|-------------|----------------|
| **PROJECT_CREATION** | `https://n8n.../clarioo-project-creation` | `https://n8n.../[uuid]` | N/A |
| **CRITERIA_CHAT** | `https://n8n.../clarioo-criteria-chat` | `https://n8n.../[uuid]` | N/A |
| **FIND_VENDORS** | `https://n8n.../clarioo-find-vendors` | `https://n8n.../[uuid]` | N/A |
| **COMPARE_VENDOR_CRITERION** | `https://n8n.../find-criterion-vendor-stage1` | `https://n8n.../[uuid]` | N/A |
| **BATTLECARD_ROW** | `https://n8n.../clarioo-battlecard-row` ✅ | `https://n8n.../[uuid]` ⚠️ TODO | `http://localhost:8080/...` (optional) |

---

## 🚀 Deployment Impact

### Before Fix:
- ❌ Would fail in production (localhost doesn't exist)
- ❌ Would fail in testing (localhost doesn't exist)
- ✅ Only works on developer's machine with local n8n

### After Fix:
- ✅ Will work in production (n8n.lakestrom.com)
- ✅ Will work in testing (after UUID configured)
- ✅ Can still test locally with override flag

---

## 🔧 Files Modified

1. **`src/config/webhooks.ts`**:
   - Line 50: Fixed production URL
   - Line 63: Added testing URL placeholder
   - Lines 74-77: Added local development override
   - Lines 87-98: Added override logic in `getWebhookUrls()`

---

## 📝 Action Items

### Immediate (Required for Production):
1. ✅ Fixed production webhook URL
2. ⚠️ Deploy testing workflow to n8n and update UUID (line 63)
3. ⚠️ Deploy production workflow to n8n (see DEPLOYMENT_CHECKLIST.md)

### For Testing:
1. Use local override flag when testing with local n8n
2. Switch to testing mode when testing UUID workflow
3. Switch to production mode for final verification

### Documentation:
1. ✅ Created DEPLOYMENT_CHECKLIST.md
2. ✅ Created this improvements document
3. Updated webhook configuration comments

---

## ✨ Benefits of This Approach

1. **Follows Existing Patterns**: Matches how all other webhooks are configured
2. **Production Ready**: Won't fail when deployed to production
3. **Flexible Testing**: Can test locally, with testing UUID, or with production
4. **Safe Defaults**: Production mode by default, override is explicit and obvious
5. **Easy Debugging**: Console warning when using local override
6. **Clear TODOs**: Placeholder makes it obvious what needs to be configured

---

**Status**: ✅ **Production URL Fixed, Testing URL Pending**

**Next Steps**:
1. Deploy battlecard workflow to n8n production
2. Get testing UUID and update line 63
3. Test end-to-end in all three modes (local, testing, production)
