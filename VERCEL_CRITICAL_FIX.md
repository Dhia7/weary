# CRITICAL: Vercel Root Directory Must Be Set in Dashboard

## Current Error
```
npm error path /vercel/path0/package.json
npm error enoent Could not read package.json
```

This means Vercel is trying to build from the repository root instead of the `frontend/` folder.

## Solution: Set Root Directory in Vercel Dashboard

**You MUST set this in the Vercel dashboard. The `vercel.json` file cannot set the root directory.**

### Step-by-Step:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: `wearx-seven`

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Click **General** in left sidebar

3. **Find Root Directory Section:**
   - Scroll down to **"Root Directory"**
   - It might say "No root directory" or be empty

4. **Set Root Directory:**
   - Click **"Edit"** button
   - Type: `frontend`
   - Click **"Save"**

5. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

## Why This Is Required

- `vercel.json` **cannot** set `rootDirectory` (not a valid property)
- Vercel needs to know where your `package.json` is located
- Without this setting, Vercel looks in the repository root
- Your Next.js app is in the `frontend/` subfolder

## Verification

After setting root directory, the build logs should show:

✅ **Correct:**
```
[frontend] Installing dependencies...
[frontend] Running "npm install"...
next@15.5.2
```

❌ **Wrong (current):**
```
Running "npm install"...
npm error path /vercel/path0/package.json
```

## Alternative: Delete vercel.json

If setting root directory in dashboard doesn't work, you can try:

1. **Delete `vercel.json`** from repository
2. Set Root Directory in dashboard to `frontend`
3. Redeploy

Next.js will auto-detect everything else.

## Quick Checklist

- [ ] Root Directory set to `frontend` in Vercel dashboard (MANDATORY)
- [ ] `vercel.json` doesn't have `rootDirectory` property (already fixed)
- [ ] Redeployed after setting root directory
- [ ] Build logs show `[frontend]` prefix

## Still Not Working?

If it still fails after setting root directory:

1. **Check if setting was saved:**
   - Go back to Settings → General
   - Verify Root Directory shows `frontend`

2. **Try deleting and re-importing project:**
   - Delete project in Vercel
   - Re-import from GitHub
   - **During import**, set Root Directory to `frontend`

3. **Check Vercel build logs:**
   - Look for where it's trying to install dependencies
   - Should show `[frontend]` prefix if root directory is set correctly

