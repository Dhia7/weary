# Fix Vercel Root Directory Error

## Error: "No Next.js version detected"

This error occurs because Vercel is trying to build from the repository root, but your Next.js app is in the `frontend/` folder.

## Solution 1: Set Root Directory in Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (`wearx-seven`)
3. Go to **Settings** → **General**
4. Scroll down to **Root Directory**
5. Click **Edit**
6. Enter: `frontend`
7. Click **Save**
8. Redeploy your project

## Solution 2: Use vercel.json (Already Created)

I've created a `vercel.json` file in the repository root that tells Vercel to use the `frontend` directory.

**File location:** `wear/vercel.json`

The file contains:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs",
  "rootDirectory": "frontend"
}
```

After committing this file, Vercel should automatically detect it.

## Quick Fix Steps

1. **Commit the vercel.json file:**
   ```bash
   git add vercel.json
   git commit -m "Add vercel.json to specify frontend root directory"
   git push
   ```

2. **OR Set in Vercel Dashboard:**
   - Settings → General → Root Directory → `frontend`
   - Save and redeploy

3. **Verify:**
   - Check build logs
   - Should see: "Installing dependencies..." in the frontend folder
   - Should detect Next.js version

## Verification

After fixing, check the build logs. You should see:
- ✅ "Installing dependencies..." (in frontend folder)
- ✅ "Next.js version detected: 15.5.2"
- ✅ Build completes successfully

## Still Having Issues?

If you still get the error:

1. **Check Root Directory Setting:**
   - Vercel Dashboard → Settings → General
   - Root Directory should be `frontend` (not empty or `/`)

2. **Verify vercel.json is committed:**
   ```bash
   git ls-files | grep vercel.json
   ```

3. **Clear Build Cache:**
   - Settings → General → Clear Build Cache
   - Redeploy

4. **Check Build Logs:**
   - Look for where it's trying to install dependencies
   - Should be in `frontend/` folder

