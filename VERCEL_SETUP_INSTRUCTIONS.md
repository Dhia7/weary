# Vercel Setup Instructions - CRITICAL FIX

## Problem: Vercel Not Detecting Next.js

Vercel is trying to build from the repository root instead of the `frontend/` folder.

## Solution: Set Root Directory in Vercel Dashboard

**This is the most reliable fix.** The `vercel.json` file may not always be read before dependency installation.

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project: `wearx-seven` (or your project name)

2. **Navigate to Settings:**
   - Click on **Settings** tab
   - Click on **General** in the left sidebar

3. **Set Root Directory:**
   - Scroll down to find **"Root Directory"** section
   - Click **"Edit"** button
   - Enter: `frontend`
   - Click **"Save"**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**
   - OR push a new commit to trigger auto-deploy

## Verification

After setting the root directory, check the build logs. You should see:

✅ **Before fix:**
```
Installing dependencies...
up to date in 514ms
Error: No Next.js version detected
```

✅ **After fix:**
```
Installing dependencies...
[frontend] Installing dependencies...
next@15.5.2
✓ Next.js version detected: 15.5.2
```

## Why This Happens

Vercel installs dependencies **before** reading `vercel.json` in some cases. Setting the Root Directory in the dashboard ensures Vercel knows where your Next.js app is located from the start.

## Alternative: If Root Directory Setting Doesn't Work

If setting root directory doesn't work, try:

1. **Delete and Re-import Project:**
   - Delete the project in Vercel
   - Re-import from GitHub
   - **During import**, set Root Directory to `frontend`

2. **Check Git Repository Structure:**
   - Ensure `frontend/package.json` exists
   - Ensure `frontend/package.json` has `"next"` in dependencies

## Quick Checklist

- [ ] Root Directory set to `frontend` in Vercel dashboard
- [ ] `frontend/package.json` exists
- [ ] `frontend/package.json` contains `"next": "15.5.2"` in dependencies
- [ ] `vercel.json` exists in repository root (optional, but helpful)
- [ ] Redeployed after setting root directory

## Still Having Issues?

1. **Check Build Logs:**
   - Look at where it's installing dependencies
   - Should say `[frontend]` or show frontend path

2. **Verify File Structure:**
   ```bash
   # Should exist:
   wear/
     frontend/
       package.json  (with "next" dependency)
       next.config.ts
       src/
         app/
           page.tsx
   ```

3. **Contact Vercel Support:**
   - If root directory setting doesn't work
   - They can check project configuration

