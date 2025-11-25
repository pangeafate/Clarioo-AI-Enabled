# Known Errors and Solutions

## ERROR-001: GitHub Pages White Screen - Stale Deployment Cache

**Date**: 2025-11-13
**Severity**: Critical (Production outage)
**Status**: Resolved

### Symptoms

1. White screen displayed on deployed GitHub Pages site (https://pangeafate.github.io/Clarioo-AI-Enabled/)
2. Browser console shows 404 errors for JavaScript and CSS assets:
   - `/Clarioo-AI-Enabled/assets/index-[hash].js` � 404
   - `/Clarioo-AI-Enabled/assets/index-[hash].css` � 404
3. Deployed HTML serves development index.html instead of production build:
   ```html
   <!-- WRONG (Development version): -->
   <script type="module" src="/src/main.tsx"></script>

   <!-- CORRECT (Production version): -->
   <script type="module" crossorigin src="/Clarioo-AI-Enabled/assets/index-DbRf_9uW.js"></script>
   <link rel="stylesheet" crossorigin href="/Clarioo-AI-Enabled/assets/index-C42ZvNTV.css">
   ```

### Root Cause

**GitHub Pages deployment served stale/incorrect artifact despite successful build.**

The deployment system cached an old version of the site or failed to properly extract the `dist/` folder contents during deployment. Even though:
- GitHub Actions build completed successfully 
- Vite build generated correct files in `dist/` 
- `dist/index.html` had correct production asset paths 
- Workflow uploaded correct `dist/` folder as artifact 

The deployed site still served incorrect files, indicating a GitHub Pages caching/extraction issue.

### Why This Happened

1. **GitHub Pages Caching**: GitHub Pages may have cached the old deployment
2. **Artifact Extraction Issue**: The `actions/upload-pages-artifact@v3` or `actions/deploy-pages@v4` may have had issues extracting the artifact
3. **Race Condition**: Multiple rapid deployments may have caused deployment artifacts to become out of sync

### Solution Applied

**Manually triggered fresh deployment via GitHub Actions:**

```bash
gh workflow run deploy.yml
```

This forced GitHub Actions to:
1. Pull latest code from git
2. Run fresh `npm ci` and `npm run build`
3. Create new deployment artifact
4. Deploy fresh build to GitHub Pages

**Result**: Site deployed successfully with correct production assets (HTTP 200 for all resources).

### Prevention Steps

1. **Always verify deployment after push:**
   ```bash
   # After pushing, check deployment status
   gh run list --limit 1

   # Verify deployed site serves correct assets
   curl -s https://pangeafate.github.io/Clarioo-AI-Enabled/ | grep -E "script|link.*css"

   # Check assets return 200 OK
   curl -I https://pangeafate.github.io/Clarioo-AI-Enabled/assets/index-*.js
   ```

2. **If white screen occurs, immediately check:**
   ```bash
   # Check if production assets exist
   curl -s https://pangeafate.github.io/Clarioo-AI-Enabled/ | grep "src="

   # Should show production path:
   # /Clarioo-AI-Enabled/assets/index-[hash].js

   # NOT development path:
   # /src/main.tsx
   ```

3. **Quick fix - trigger fresh deployment:**
   ```bash
   gh workflow run deploy.yml

   # Wait for completion (30-60 seconds)
   sleep 30 && gh run list --limit 1

   # Verify fix
   curl -s https://pangeafate.github.io/Clarioo-AI-Enabled/ | grep "assets/index"
   ```

4. **If issue persists, clear GitHub Pages cache:**
   - Go to repository Settings � Pages
   - Temporarily change source branch, save
   - Change back to original branch (`gh-pages` or `main`), save
   - This forces GitHub Pages to rebuild from scratch

### What NOT To Do

L **DO NOT remove `index.html` from git**
- Vite requires root `index.html` to build
- Removing it causes: `error during build` - ` 0 modules transformed`
- Keep root `index.html` in git (it's the development template)
- Only `dist/` folder should be in `.gitignore`

L **DO NOT modify `.github/workflows/deploy.yml` during debugging**
- The workflow is correct (uploads `./dist` folder)
- Problem was deployment cache, not workflow configuration

L **DO NOT trust immediate deployment results**
- GitHub Pages caching can take 1-2 minutes to update
- Always wait 30-60 seconds after deployment completes
- Test in incognito/private window to avoid browser cache

### Related Files

- `.github/workflows/deploy.yml` - Deployment workflow (uploads `./dist`)
- `vite.config.ts` - Build configuration (`base: '/Clarioo-AI-Enabled/'`)
- `index.html` (root) - Development template (DO NOT REMOVE)
- `dist/index.html` - Production build (generated, not committed)
- `.gitignore` - Excludes `dist/` from git (correct)

### Impact

- **Duration**: ~10 minutes (from detection to fix)
- **User Impact**: Production site showed white screen
- **Data Loss**: None (frontend-only issue)
- **Recovery**: Manual workflow trigger resolved issue

### Lessons Learned

1. GitHub Pages deployment can have caching issues independent of build success
2. Manual workflow trigger is a reliable solution for stale deployments
3. Always verify deployed assets return 200 OK, not just workflow success
4. Browser caching can hide deployment issues - always test in incognito mode
5. Root `index.html` must stay in git for Vite to build correctly

---

## ERROR-002: Template for Future Errors

**Date**: YYYY-MM-DD
**Severity**: [Critical|High|Medium|Low]
**Status**: [Open|In Progress|Resolved]

### Symptoms
- What users see/experience

### Root Cause
- Technical explanation of why it happened

### Solution Applied
- Exact steps taken to fix

### Prevention Steps
- How to avoid in future

### Related Files
- Files involved in error/fix
