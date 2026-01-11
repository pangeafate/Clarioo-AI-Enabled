# n8n Workflow Deployment Instructions

**Sprint**: SP_023 - Vendor Battlecards
**Date**: January 10, 2026

---

## 📦 Workflow Files Ready for Upload

Two workflow JSON files have been created and are ready to import into n8n:

### 1. Production Workflow
**File**: `/00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_AI_Battlecard_Row_PRODUCTION.json`

**Webhook URL** (after activation):
```
https://n8n.lakestrom.com/webhook/clarioo-battlecard-row
```

### 2. Testing Workflow
**File**: `/00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_AI_Battlecard_Row_TESTING.json`

**Webhook URL** (after activation):
```
https://n8n.lakestrom.com/webhook/e08eae12-70d9-4669-8ee5-f31ffe5b1407
```

---

## 🚀 Deployment Steps

### Step 1: Import Production Workflow

1. Open n8n dashboard: `https://n8n.lakestrom.com`
2. Click **"Add workflow"** → **"Import from File"**
3. Select: `Clarioo_AI_Battlecard_Row_PRODUCTION.json`
4. Workflow will appear with name: **"Clarioo AI Battlecard Row Generator (PRODUCTION)"**

### Step 2: Configure Production Credentials

The workflow requires two API credentials:

#### OpenAI API (GPT-4o-mini)
- Node: "OpenAI Chat Model"
- Current credential ID in JSON: `jKn3GZ9W5ZRgXc2d`
- If this credential exists in your n8n, it will auto-link
- If not, add your OpenAI API key

#### Perplexity API (Web Search)
- Node: "Message a model in Perplexity"
- Current credential ID in JSON: `r8zUmq6Bxb6qMTW3`
- If this credential exists in your n8n, it will auto-link
- If not, add your Perplexity API key

### Step 3: Verify CORS Settings (Production)

The webhook is pre-configured with CORS headers for:
```
Access-Control-Allow-Origin: https://demo.clarioo.io
```

**If your domain is different**, update these nodes:
- "Webhook Trigger" (line 14)
- "Return Validation Error" (line 94)
- "Return Success Response" (line 233)
- "Return Error Response" (line 279)

Change the origin value to your production domain or use `*` for wildcard.

### Step 4: Activate Production Workflow

1. Click the **"Active"** toggle in the top-right
2. Verify the webhook status shows "Waiting for webhook call"
3. Copy the production webhook URL:
   ```
   https://n8n.lakestrom.com/webhook/clarioo-battlecard-row
   ```

---

### Step 5: Import Testing Workflow

1. Click **"Add workflow"** → **"Import from File"**
2. Select: `Clarioo_AI_Battlecard_Row_TESTING.json`
3. Workflow will appear with name: **"Clarioo AI Battlecard Row Generator (TESTING)"**

### Step 6: Configure Testing Credentials

Same as production:
- OpenAI API credential
- Perplexity API credential

### Step 7: Verify Testing Webhook Path

The testing workflow uses UUID-based path:
```
Path: e08eae12-70d9-4669-8ee5-f31ffe5b1407
```

This should be visible in the "Webhook Trigger" node.

### Step 8: Activate Testing Workflow

1. Click **"Active"** toggle
2. Verify webhook URL:
   ```
   https://n8n.lakestrom.com/webhook/e08eae12-70d9-4669-8ee5-f31ffe5b1407
   ```

---

## ✅ Verification Checklist

After importing and activating both workflows:

### Production Workflow
- [ ] Workflow name: "Clarioo AI Battlecard Row Generator (PRODUCTION)"
- [ ] Webhook path: `clarioo-battlecard-row` (named path)
- [ ] OpenAI credentials configured
- [ ] Perplexity credentials configured
- [ ] CORS headers match your domain
- [ ] Workflow is **Active**
- [ ] Webhook URL: `https://n8n.lakestrom.com/webhook/clarioo-battlecard-row`

### Testing Workflow
- [ ] Workflow name: "Clarioo AI Battlecard Row Generator (TESTING)"
- [ ] Webhook path: `e08eae12-70d9-4669-8ee5-f31ffe5b1407` (UUID path)
- [ ] OpenAI credentials configured
- [ ] Perplexity credentials configured
- [ ] Workflow is **Active**
- [ ] Webhook URL: `https://n8n.lakestrom.com/webhook/e08eae12-70d9-4669-8ee5-f31ffe5b1407`

---

## 🧪 Testing the Workflows

### Test Production Webhook

```bash
curl -X POST https://n8n.lakestrom.com/webhook/clarioo-battlecard-row \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "session_id": "test-session-456",
    "project_id": "test-proj-789",
    "project_context": "B2B SaaS company looking for CRM solution for 50-person sales team",
    "vendor_names": ["Salesforce", "HubSpot", "Pipedrive"],
    "criteria": [
      {
        "id": "crit_1",
        "name": "Email Integration",
        "explanation": "Must sync with Gmail/Outlook",
        "importance": "high",
        "type": "technical"
      }
    ],
    "already_filled_categories": [],
    "is_mandatory_category": true,
    "requested_category": "Target Verticals",
    "timestamp": "2026-01-10T12:00:00Z"
  }'
```

**Expected Response** (60-90 seconds):
```json
{
  "success": true,
  "row": {
    "row_id": "battlecard_row_1",
    "category_title": "Target Verticals",
    "category_definition": "Industries and sectors the solution focuses on",
    "cells": [
      {
        "vendor_name": "Salesforce",
        "text": "Strong presence in retail (40%), manufacturing (30%), financial services (20%)...",
        "source_url": "https://salesforce.com/industries"
      },
      {
        "vendor_name": "HubSpot",
        "text": "Primarily serves B2B SaaS, marketing agencies, and professional services...",
        "source_url": "https://hubspot.com/customers"
      },
      {
        "vendor_name": "Pipedrive",
        "text": "Focus on SMB sales teams across real estate, consulting, and B2B services...",
        "source_url": "https://pipedrive.com/case-studies"
      }
    ]
  }
}
```

### Test Testing Webhook

Same curl command but with testing URL:
```bash
curl -X POST https://n8n.lakestrom.com/webhook/e08eae12-70d9-4669-8ee5-f31ffe5b1407 \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 🔧 Frontend Integration Status

The frontend configuration has been updated to use these webhooks:

### File: `src/config/webhooks.ts`

**Production Mode** (default):
```typescript
BATTLECARD_ROW: 'https://n8n.lakestrom.com/webhook/clarioo-battlecard-row'
```

**Testing Mode**:
```typescript
BATTLECARD_ROW: 'https://n8n.lakestrom.com/webhook/e08eae12-70d9-4669-8ee5-f31ffe5b1407'
```

**Local Override** (for development):
```typescript
BATTLECARD_ROW: 'http://localhost:8080/webhook/clarioo-battlecard-row'
```

### Switching Between Modes

In browser console:

```javascript
// Use production webhook
localStorage.setItem('clarioo_webhook_mode', 'production');

// Use testing webhook
localStorage.setItem('clarioo_webhook_mode', 'testing');

// Use local n8n instance
localStorage.setItem('WEBHOOK_LOCAL_OVERRIDE', 'true');
```

---

## 📊 Expected Performance

### Timing
- Per row: 60-90 seconds
- 3 mandatory rows: ~4-5 minutes
- 10 total rows: ~12-15 minutes

### Cost
- Per row: ~$0.09-$0.12
- 10 rows: ~$0.90-$1.20
- Combined with comparison: ~$2-3 total per project

### Search Budget
- 15 searches maximum per row
- 2-3 searches per vendor
- Prioritizes official documentation

---

## ⚠️ Troubleshooting

### Issue: Credentials Not Found

**Symptom**: Error about missing OpenAI or Perplexity credentials

**Solution**:
1. Go to n8n → Settings → Credentials
2. Add OpenAI API credential if missing
3. Add Perplexity API credential if missing
4. Reopen the workflow and link credentials in each node

---

### Issue: CORS Errors

**Symptom**: Browser console shows CORS policy errors

**Solution**:
1. Edit the workflow in n8n
2. Update "Access-Control-Allow-Origin" in all response nodes
3. Change to your domain or `*` for wildcard

---

### Issue: 404 Not Found

**Symptom**: Webhook returns 404

**Solutions**:
- Verify workflow is **Active** (toggle in top-right)
- Check webhook path matches exactly (case-sensitive)
- Verify you're using POST method, not GET

---

## 📝 Next Steps

After activating both workflows:

1. **Test in browser**: Visit your app and navigate to vendor comparison
2. **Watch battlecards generate**: Should appear below comparison matrix
3. **Check n8n execution logs**: Verify searches and AI responses
4. **Monitor costs**: Track API usage in OpenAI and Perplexity dashboards
5. **Gather feedback**: Test with real vendor comparisons

---

## ✨ Key Differences Between Workflows

| Aspect | Production | Testing |
|--------|-----------|---------|
| **Workflow Name** | (PRODUCTION) | (TESTING) |
| **Webhook Path** | `clarioo-battlecard-row` (named) | `e08eae12-70d9-4669-8ee5-f31ffe5b1407` (UUID) |
| **Webhook URL** | `.../webhook/clarioo-battlecard-row` | `.../webhook/e08eae12-...` |
| **Frontend Mode** | `production` (default) | `testing` (manual switch) |
| **Use Case** | Live user traffic | Development testing |

Everything else (logic, credentials, CORS, timeout) is identical.

---

**Status**: ✅ **Ready to Deploy**

**Time to Deploy**: ~10-15 minutes (import + credential setup)

**Documentation**: See `/00_IMPLEMENTATION/SPRINTS/SP_023_Vendor_Battlecards/` for complete specs
