# Custom Domain Setup Guide: demo.clarioo.io

This guide explains how to connect your custom domain `demo.clarioo.io` to the GitHub Pages deployment.

## 📋 Prerequisites

- Access to your DNS provider (where clarioo.io domain is registered)
- Admin access to GitHub repository: `pangeafate/Clarioo-AI-Enabled`

---

## 🔧 Step 1: Update Vite Configuration

Currently, the base URL is set to `/Clarioo-AI-Enabled/` (subdirectory). For a custom domain, we need to change it to `/` (root).

**File to modify**: `vite.config.ts`

**Change from**:
```typescript
base: mode === 'production' ? '/Clarioo-AI-Enabled/' : '/',
```

**Change to**:
```typescript
base: '/', // Root path for custom domain
```

This ensures assets load from the root URL (demo.clarioo.io/assets/...) instead of subdirectory (demo.clarioo.io/Clarioo-AI-Enabled/assets/...).

---

## 🌐 Step 2: Configure DNS Records

Go to your DNS provider (e.g., GoDaddy, Namecheap, Cloudflare) and add the following records:

### Option A: Using CNAME (Recommended for subdomains)

Add a **CNAME record**:

```
Type: CNAME
Name: demo
Value: pangeafate.github.io
TTL: 3600 (or default)
```

This maps `demo.clarioo.io` → `pangeafate.github.io`

### Option B: Using A Records (Alternative)

If CNAME doesn't work, add **A records** pointing to GitHub Pages IPs:

```
Type: A
Name: demo
Value: 185.199.108.153
TTL: 3600

Type: A
Name: demo
Value: 185.199.109.153
TTL: 3600

Type: A
Name: demo
Value: 185.199.110.153
TTL: 3600

Type: A
Name: demo
Value: 185.199.111.153
TTL: 3600
```

**Note**: DNS changes can take 5-60 minutes to propagate worldwide.

---

## 📄 Step 3: Create CNAME File in Public Directory

GitHub Pages needs a CNAME file to recognize your custom domain.

**Create file**: `public/CNAME`

**Content**:
```
demo.clarioo.io
```

This file will be copied to the `dist/` folder during build and deployed automatically.

---

## ⚙️ Step 4: Configure GitHub Pages Custom Domain

1. Go to your GitHub repository: https://github.com/pangeafate/Clarioo-AI-Enabled
2. Navigate to **Settings** → **Pages**
3. Under **Custom domain**, enter: `demo.clarioo.io`
4. Click **Save**
5. ✅ Enable **Enforce HTTPS** (wait ~5 minutes for SSL certificate to provision)

GitHub will automatically verify your DNS settings and issue a free SSL certificate via Let's Encrypt.

---

## 🚀 Step 5: Deploy Changes

After making all changes above:

```bash
# 1. Update vite.config.ts (base: '/')
# 2. Create public/CNAME file
# 3. Commit changes
git add vite.config.ts public/CNAME
git commit -m "Configure custom domain demo.clarioo.io"
git push origin main

# 4. Wait for GitHub Actions to deploy (~45 seconds)
# 5. Verify deployment
gh run list --limit 1
```

---

## ✅ Step 6: Verification

### Test DNS Propagation
```bash
# Check CNAME record
dig demo.clarioo.io CNAME

# Should show:
# demo.clarioo.io. 3600 IN CNAME pangeafate.github.io.
```

### Test Site Access
```bash
# Check if site loads
curl -I https://demo.clarioo.io

# Should return HTTP/2 200
```

### Browser Test
Open https://demo.clarioo.io in browser (wait 5-10 mins after DNS changes)

---

## 🔍 Troubleshooting

### Issue 1: "Domain's DNS record could not be retrieved"

**Solution**: Wait 15-30 minutes for DNS propagation, then click "Check again" in GitHub Pages settings.

### Issue 2: Assets return 404 errors

**Problem**: Base URL still set to `/Clarioo-AI-Enabled/`

**Solution**:
```bash
# Verify vite.config.ts has:
base: '/',

# Rebuild and redeploy
npm run build
git add dist/ # (if committing build)
git push
```

### Issue 3: SSL Certificate not provisioning

**Solution**:
- Ensure DNS is correctly configured
- Disable "Enforce HTTPS" temporarily
- Wait 10-15 minutes
- Re-enable "Enforce HTTPS"

### Issue 4: Old GitHub Pages URL still works

**Expected**: Both URLs will work:
- ✅ https://demo.clarioo.io (custom domain)
- ✅ https://pangeafate.github.io/Clarioo-AI-Enabled/ (original)

To redirect the old URL to custom domain, you would need a `404.html` redirect script (already exists in `public/404.html`).

---

## 📝 Summary of Changes Needed

### Code Changes:
- [ ] **vite.config.ts**: Change `base` from `/Clarioo-AI-Enabled/` to `/`
- [ ] **public/CNAME**: Create file with content `demo.clarioo.io`

### DNS Changes:
- [ ] Add CNAME record: `demo` → `pangeafate.github.io`

### GitHub Settings:
- [ ] Add custom domain in Settings → Pages
- [ ] Enable "Enforce HTTPS"

### Deployment:
- [ ] Commit and push changes
- [ ] Wait for GitHub Actions to complete
- [ ] Verify site loads at https://demo.clarioo.io

---

## ⏱️ Expected Timeline

| Step | Time Required |
|------|--------------|
| Code changes | 2 minutes |
| DNS propagation | 5-60 minutes |
| GitHub Actions deploy | 45 seconds |
| SSL certificate provisioning | 5-15 minutes |
| **Total** | **15-75 minutes** |

---

## 🔗 Useful Links

- GitHub Pages Docs: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- DNS Checker: https://dnschecker.org/#CNAME/demo.clarioo.io
- SSL Checker: https://www.sslshopper.com/ssl-checker.html#hostname=demo.clarioo.io
- Vite Base URL Docs: https://vitejs.dev/config/shared-options.html#base

---

## 📞 Need Help?

If you encounter issues:
1. Check DNS propagation: `dig demo.clarioo.io`
2. Verify GitHub Actions deployment succeeded
3. Check browser console for asset loading errors
4. Test in incognito mode (clear cache)
5. Consult ERRORS.md for known issues
