# Battlecard Webhook Deployment Checklist

**Sprint**: SP_023 - Vendor Battlecards
**Date Created**: January 10, 2026
**Status**: ⚠️ Pending Production Deployment

---

## 📋 Pre-Deployment Requirements

### 1. n8n Workflow Deployment

The battlecard workflow file is ready at:
```
/00_IMPLEMENTATION/MIGRATING_TO_N8N/Clarioo_AI_Battlecard_Row.json
```

#### Production Deployment Steps:

1. **Import workflow to n8n production**:
   - Open n8n dashboard: `https://n8n.lakestrom.com`
   - Click "Add workflow" → "Import from File"
   - Select: `Clarioo_AI_Battlecard_Row.json`

2. **Configure credentials**:
   - OpenAI API key (GPT-4o-mini)
   - Perplexity API key (for web search)

3. **Update CORS headers**:
   - In the Webhook node, set `Access-Control-Allow-Origin` to:
     - Production: `https://demo.clarioo.io`
     - Or wildcard: `*` (if domain changes)

4. **Activate workflow**:
   - Toggle workflow to "Active"
   - Copy the production webhook URL

5. **Expected Production URL**:
   ```
   https://n8n.lakestrom.com/webhook/clarioo-battlecard-row
   ```

   ✅ This URL is already configured in `src/config/webhooks.ts` (line 50)

---

### 2. Testing Workflow Deployment (Optional but Recommended)

1. **Create a duplicate workflow in n8n** for testing:
   - Import the same JSON file
   - Name it: "Clarioo AI Battlecard Row (TESTING)"

2. **Activate testing workflow**:
   - Get the UUID-based webhook URL
   - Example format: `https://n8n.lakestrom.com/webhook/[uuid-here]`

3. **Update frontend configuration**:
   - Edit `src/config/webhooks.ts` line 63
   - Replace `TODO-REPLACE-WITH-TESTING-UUID` with actual UUID:
     ```typescript
     BATTLECARD_ROW: 'https://n8n.lakestrom.com/webhook/abc123-uuid-here',
     ```

---

## 🧪 Testing Guide

### Local Development Testing (Current Setup)

To test with your local n8n instance:

1. **Enable local override in browser console**:
   ```javascript
   localStorage.setItem('WEBHOOK_LOCAL_OVERRIDE', 'true');
   ```

2. **Ensure local n8n is running**:
   - Webhook should be accessible at: `http://localhost:8080/webhook/clarioo-battlecard-row`

3. **Test the integration**:
   - Navigate to vendor comparison stage in the app
   - Battlecards section should appear below comparison matrix
   - Click "Start Generation" to trigger row-by-row generation

4. **Disable local override when done**:
   ```javascript
   localStorage.removeItem('WEBHOOK_LOCAL_OVERRIDE');
   ```

---

### Production Testing

After deploying to n8n production:

1. **Set webhook mode to production** (default):
   ```javascript
   localStorage.setItem('clarioo_webhook_mode', 'production');
   ```

2. **Test end-to-end flow**:
   - Complete vendor discovery
   - Wait for comparison matrix to load
   - Observe battlecards generation below
   - Verify all 8-12 rows generate successfully

3. **Check for errors**:
   - Open browser DevTools → Console
   - Look for `[n8n-battlecard]` log messages
   - Verify no 404 or CORS errors

---

### Testing Mode (UUID Webhooks)

To test with UUID testing webhooks:

1. **Switch to testing mode**:
   ```javascript
   localStorage.setItem('clarioo_webhook_mode', 'testing');
   ```

2. **Verify testing UUID is configured**:
   - Check `src/config/webhooks.ts` line 63
   - Should NOT be `TODO-REPLACE-WITH-TESTING-UUID`

3. **Run tests as above**

---

## ✅ Deployment Verification Checklist

Before marking this feature as production-ready:

### Frontend Configuration
- [ ] `PRODUCTION_WEBHOOKS.BATTLECARD_ROW` points to `https://n8n.lakestrom.com/webhook/clarioo-battlecard-row`
- [ ] `TESTING_WEBHOOKS.BATTLECARD_ROW` has actual UUID (not TODO placeholder)
- [ ] Local override is disabled in production build (verify localStorage is clean)

### n8n Workflow
- [ ] Production workflow imported and activated
- [ ] OpenAI credentials configured
- [ ] Perplexity credentials configured
- [ ] CORS headers allow production domain
- [ ] Webhook responds with valid JSON structure
- [ ] Response time is under 90 seconds per row

### End-to-End Testing
- [ ] 3 mandatory categories generate correctly:
  - [ ] Target Verticals
  - [ ] Key Customers
  - [ ] Main Integrations
- [ ] 5-9 dynamic categories generate (total 8-12 rows)
- [ ] No duplicate categories
- [ ] All vendor cells populated with text
- [ ] Source URLs are present and valid
- [ ] Retry works for failed rows (max 3 attempts)
- [ ] localStorage caching works (refresh page, state persists)
- [ ] Pause/resume functionality works
- [ ] Progress bar updates correctly

### Performance
- [ ] Each row generates in 60-90 seconds
- [ ] Total generation time: 12-15 minutes for 10 rows
- [ ] No memory leaks during generation
- [ ] Mobile responsive (2 vendors visible)
- [ ] Desktop displays 3 vendors correctly

---

## 🚨 Troubleshooting

### Issue: 404 Error on Webhook

**Symptom**: `[n8n-battlecard] HTTP error: 404`

**Solutions**:
1. Verify workflow is activated in n8n
2. Check webhook URL matches exactly (case-sensitive)
3. Ensure CORS headers are configured

---

### Issue: CORS Error

**Symptom**: `Access-Control-Allow-Origin` error in browser console

**Solutions**:
1. Update n8n webhook node CORS headers to include `https://demo.clarioo.io`
2. Or use wildcard `*` for development

---

### Issue: Timeout Errors

**Symptom**: `[n8n-battlecard] Request timeout` after 90 seconds

**Solutions**:
1. Reduce vendor count (max 3 recommended)
2. Check Perplexity API rate limits
3. Verify OpenAI API is responding
4. Increase timeout in `src/services/n8nService.ts` line 45 (if necessary)

---

### Issue: Empty Cells or Missing Data

**Symptom**: Rows complete but cells have no text

**Solutions**:
1. Check AI prompt in n8n workflow (ensure it returns text)
2. Verify vendors have public documentation (Perplexity can find data)
3. Check n8n execution logs for AI response format

---

## 📊 Expected Costs

Based on the n8n workflow design:

- **Per Row**: ~$0.09-$0.12
  - GPT-4o-mini: ~$0.015 per row (6K tokens)
  - Perplexity searches: ~$0.005 per search (15 searches max)

- **Per Project**: ~$0.90-$1.20 (10 rows average)

- **Combined with Comparison**: ~$2-3 total per project
  - Vendor comparison: ~$1-2
  - Battlecards: ~$1-1.20

---

## 🔄 Rollback Plan

If issues occur in production:

1. **Disable battlecards in UI** (quick fix):
   ```typescript
   // In src/components/VendorComparisonNew.tsx, comment out lines 974-993
   ```

2. **Switch to testing mode**:
   ```javascript
   localStorage.setItem('clarioo_webhook_mode', 'testing');
   ```

3. **Investigate and fix**:
   - Check n8n execution logs
   - Review browser console errors
   - Test with reduced vendor count

4. **Re-enable after fix**

---

## 📝 Next Steps After Deployment

1. Monitor first 10-20 production battlecard generations
2. Review text quality (specific, scannable, factual)
3. Verify source URLs are relevant
4. Check category diversity (good mix, no duplicates)
5. Gather user feedback on usefulness
6. Optimize AI prompts if needed

---

**Deployment Owner**: Engineering Team
**Last Updated**: January 10, 2026
**Related Docs**:
- [n8n_workflow_design.md](./n8n_workflow_design.md)
- [WORKFLOW_CREATION_SUMMARY.md](./WORKFLOW_CREATION_SUMMARY.md)
- [SP_023_Vendor_Battlecards.md](./SP_023_Vendor_Battlecards.md)
