# How to Import the Modified Vendor Summary Workflow

## Files Created
1. ✅ `modified_vendor_summary_workflow.json` - The complete modified workflow
2. ✅ `N8N_WORKFLOW_MODIFICATION_GUIDE.md` - Detailed explanation of changes

---

## Option 1: Import as New Workflow (Recommended for Testing)

### Step 1: Import the JSON
1. Go to https://n8n.lakestrom.com/workflows
2. Click **"Import from File"** (top right)
3. Select `modified_vendor_summary_workflow.json`
4. The workflow will be imported with a new ID

### Step 2: Add Perplexity Credentials
1. Click on the **"Perplexity Chat Model"** node
2. Click **"Create New Credential"**
3. Enter your Perplexity API key
4. Save the credential

### Step 3: Delete the Old OpenAI Node
1. The workflow still has the old **"OpenAI Chat Model"** node (not connected)
2. Click on it and press **Delete** or right-click → Delete
3. It's no longer needed

### Step 4: Test the Workflow
Use the test webhook URL or production URL:

**Test Request:**
```bash
curl -X POST https://n8n.lakestrom.com/webhook/6e32f3ef-1103-404b-ac0b-8ce2da70b7b4 \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Salesforce",
    "vendor_website": "https://www.salesforce.com",
    "project_id": "test-123",
    "project_context": "CRM platform evaluation for B2B SaaS company"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "vendor_summary": {
    "vendor_name": "Salesforce",
    "killerFeature": "Einstein AI integrates predictive analytics...",
    "executiveSummary": "Salesforce is the world's leading cloud-based CRM...",
    "keyFeatures": [
      "AI-powered lead scoring",
      "360-degree customer view",
      "AppExchange marketplace",
      "Advanced workflow automation",
      "Slack integration"
    ]
  },
  "generated_at": "2025-12-03T..."
}
```

### Step 5: Activate the Workflow
1. Click **"Active"** toggle (top right)
2. Save the workflow

### Step 6: Update Your Client Code (Optional)
If you imported as a new workflow with a different webhook URL:
1. Copy the new webhook URL from the Webhook Trigger node
2. Update `src/config/webhooks.ts` line 60:
   ```typescript
   VENDOR_SUMMARY: 'https://n8n.lakestrom.com/webhook/YOUR-NEW-WEBHOOK-ID'
   ```

---

## Option 2: Replace Existing Workflow

### Warning
This will **overwrite** your existing workflow (ID: HjFKACyxaP2aqbvk). Make a backup first!

### Steps
1. Go to https://n8n.lakestrom.com/workflow/HjFKACyxaP2aqbvk
2. Click **Settings** → **Export Workflow** → Save as backup
3. Click **"⋮" menu** → **"Delete Workflow"**
4. Import `modified_vendor_summary_workflow.json` as a new workflow
5. Manually change the webhook path in the Webhook Trigger node to match the old one:
   - Path: `6e32f3ef-1103-404b-ac0b-8ce2da70b7b4`
6. Add Perplexity credentials (see Option 1, Step 2)
7. Delete the OpenAI node
8. Save and activate

---

## What Changed in This Workflow?

### 1. Input Validation Node
**Before:** Expected `project_id`, `session_id`, `criteria[]`, `vendors[]`
**After:** Expects `vendor_name`, `vendor_website`, `project_id`, `project_context`

### 2. AI Analysis Agent Prompt
**Before:** "Analyze vendor comparison results and generate executive summary"
**After:** "Research this vendor and generate a summary for a comparison tool vendor card"

### 3. Language Model
**Before:** OpenAI GPT-4o-mini
**After:** Perplexity `llama-3.1-sonar-large-128k-online` (with web search)

### 4. Structured Output Parser
**Before:** Executive summary schema (keyCriteria, vendorRecommendations, etc.)
**After:** Vendor card schema (vendor_name, killerFeature, executiveSummary, keyFeatures)

### 5. Response Format
**Before:** `{ success: true, data: { keyCriteria: [...], ... } }`
**After:** `{ success: true, vendor_summary: { vendor_name, killerFeature, ... } }`

---

## Troubleshooting

### Error: "Perplexity credentials not found"
- Add your Perplexity API key in the credentials manager
- Get a key from https://www.perplexity.ai/settings/api

### Error: "Missing required vendor summary fields"
- The AI didn't return the expected JSON structure
- Check the Perplexity response in the workflow execution log
- Adjust the system message if needed

### Workflow returns empty/undefined summaries
- Check that the workflow is **Active** (toggle in top right)
- Verify the webhook URL matches in `src/config/webhooks.ts`
- Check browser console for client-side errors

### Client still shows empty vendor cards
1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Run a new comparison
4. Check browser console for `[n8n-vendor-summary]` logs

---

## Next Steps

Once the workflow is working:

1. **Test with multiple vendors** - The client batches 3 concurrent requests
2. **Monitor costs** - Perplexity charges per API call
3. **Create production version** - Duplicate this workflow for production use
4. **Update webhook mode** - Switch from testing to production in the app

---

## Support

- **Workflow Guide:** See `N8N_WORKFLOW_MODIFICATION_GUIDE.md` for detailed explanations
- **Client Integration:** All code is already integrated in `VendorComparisonNew.tsx`
- **Service Functions:** See `src/services/n8nService.ts` for API integration
