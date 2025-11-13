# Fix Vercel Homepage 404 Error

## Error: 404 NOT_FOUND on Homepage

If your Vercel deployment shows a 404 error on the homepage (`https://wearx-seven.vercel.app/`), follow these steps:

## Critical Fix: Set Environment Variable

**The most common cause:** `NEXT_PUBLIC_API_URL` is not set in Vercel.

### Step 1: Set Environment Variable in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (`wearx-seven`)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-name.onrender.com/api`
     - Replace `your-backend-name` with your actual Render backend URL
     - Example: `https://weary-backend.onrender.com/api`
   - **Environment:** Select **Production** (or all environments)
6. Click **Save**

### Step 2: Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deploy

## Other Potential Issues

### Issue 1: Root Directory Configuration

If your project is in a `frontend` folder:

1. Go to Vercel → **Settings** → **General**
2. Scroll to **Root Directory**
3. Set it to `frontend` (if your frontend code is in a subfolder)
4. Save and redeploy

### Issue 2: Build Command

Verify build settings:

1. Go to **Settings** → **General** → **Build & Development Settings**
2. **Build Command:** Should be `npm run build` or `next build`
3. **Output Directory:** Should be `.next` (default) or leave empty
4. **Install Command:** Should be `npm install` (default)

### Issue 3: Check Build Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check **Build Logs** for errors
4. Look for:
   - Missing dependencies
   - Build failures
   - TypeScript errors
   - Missing files

### Issue 4: Verify Files Are Committed

Ensure these files are in your git repository:

```bash
# Check if these files exist
src/app/page.tsx       # Homepage
src/app/layout.tsx     # Root layout
src/app/not-found.tsx  # 404 page (we just created)
```

## Quick Checklist

- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel environment variables
- [ ] Environment variable value includes `/api` at the end
- [ ] Value uses `https://` (not `http://`)
- [ ] Root directory is set correctly (if using subfolder)
- [ ] Build command is correct (`npm run build`)
- [ ] All files are committed to git
- [ ] Latest deployment completed successfully
- [ ] No build errors in deployment logs

## Verification Steps

After fixing:

1. **Check Environment Variable:**
   - Vercel dashboard → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_API_URL` is set

2. **Check Build Logs:**
   - Look for: "Next.js rewrite config - Backend URL:"
   - Should show your Render backend URL (not localhost)

3. **Test Homepage:**
   - Visit `https://wearx-seven.vercel.app/`
   - Should load homepage (not 404)

4. **Test API Calls:**
   - Open browser DevTools → Network tab
   - API calls should go to your Render backend

## What We Fixed

1. ✅ **Improved rewrites configuration** - Better handling of missing env vars
2. ✅ **Added not-found.tsx** - Custom 404 page
3. ✅ **Fixed syntax error** - Corrected condition check in rewrites

## Still Not Working?

If the homepage still shows 404 after setting the environment variable:

1. **Check Vercel Build Logs:**
   - Look for specific errors
   - Check if `page.tsx` is being found

2. **Verify File Structure:**
   ```bash
   # Should exist:
   frontend/src/app/page.tsx
   frontend/src/app/layout.tsx
   ```

3. **Try Clean Deploy:**
   - Clear Vercel build cache
   - Settings → General → Clear Build Cache
   - Redeploy

4. **Check Next.js Version:**
   - Ensure compatible Next.js version
   - Check `package.json` for version

## Common Error Messages

### "NEXT_PUBLIC_API_URL not set"
**Solution:** Set the environment variable in Vercel

### "Cannot find module"
**Solution:** Check build logs, ensure all dependencies are installed

### "Build failed"
**Solution:** Check build logs for specific errors

### "Page not found"
**Solution:** Verify `src/app/page.tsx` exists and is committed

