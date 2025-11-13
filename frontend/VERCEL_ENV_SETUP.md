# Vercel Environment Variables Setup

## Required Environment Variables for Vercel

Set these in your Vercel dashboard under your project → **Settings** → **Environment Variables**:

### 1. Backend API URL (REQUIRED)
```
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com/api
```

**Important:** 
- Replace `your-backend-name` with your actual Render backend service name
- Example: `https://weary-backend.onrender.com/api`
- Must include `/api` at the end
- Use `https://` (not `http://`)

### 2. App Configuration (Optional but Recommended)
```
NEXT_PUBLIC_APP_NAME=Wear
NEXT_PUBLIC_APP_DESCRIPTION=Premium Clothing Marketplace
```

## How to Set Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (e.g., `weary-iota` or your project name)
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. Click **Add New**
6. Add each variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-name.onrender.com/api`
   - **Environment:** Select all (Production, Preview, Development)
7. Click **Save**
8. Repeat for other variables if needed

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: https://your-backend-name.onrender.com/api

vercel env add NEXT_PUBLIC_APP_NAME production
# When prompted, enter: Wear
```

## Complete Environment Variables List

### For Production (Required)
```env
NEXT_PUBLIC_API_URL=https://weary-backend.onrender.com/api
```

### For Production (Optional)
```env
NEXT_PUBLIC_APP_NAME=Wear
NEXT_PUBLIC_APP_DESCRIPTION=Premium Clothing Marketplace
```

## Important Notes

### 1. NEXT_PUBLIC_ Prefix
- All environment variables that need to be accessible in the browser **must** start with `NEXT_PUBLIC_`
- Variables without this prefix are only available server-side

### 2. Backend URL Format
- Must be the **full URL** including `https://`
- Must include `/api` at the end
- Example: `https://weary-backend.onrender.com/api`

### 3. After Adding Variables
- **Redeploy** your Vercel project for changes to take effect
- Go to **Deployments** → Click **"..."** → **Redeploy**

### 4. Environment-Specific Variables
You can set different values for:
- **Production** - Live site
- **Preview** - Preview deployments (PRs)
- **Development** - Local development (via Vercel CLI)

## Finding Your Render Backend URL

1. Go to https://dashboard.render.com
2. Click on your backend service
3. Copy the URL from the top (e.g., `https://weary-backend.onrender.com`)
4. Add `/api` to the end: `https://weary-backend.onrender.com/api`

## Verification

After setting environment variables:

1. **Redeploy** your Vercel project
2. Check browser console (F12) - should not show API errors
3. Test API calls:
   - Open your site
   - Check Network tab in browser DevTools
   - API calls should go to your Render backend

## Troubleshooting

### Issue: "Failed to fetch" errors
**Solution:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check Render backend is running and accessible
- Ensure CORS is configured on backend (should include your Vercel domain)

### Issue: API calls going to localhost
**Solution:**
- Verify environment variable is set for **Production** environment
- Redeploy after adding variables
- Check variable name is exactly `NEXT_PUBLIC_API_URL` (case-sensitive)

### Issue: CORS errors
**Solution:**
- Backend needs to allow your Vercel domain
- In Render backend, set `FRONTEND_URL` to your Vercel URL:
  ```
  FRONTEND_URL=https://weary-iota.vercel.app
  ```

## Quick Setup Checklist

- [ ] Get Render backend URL (e.g., `https://weary-backend.onrender.com`)
- [ ] Add `/api` to create: `https://weary-backend.onrender.com/api`
- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel dashboard
- [ ] Set environment to **Production** (or all environments)
- [ ] Redeploy Vercel project
- [ ] Test API calls work
- [ ] Verify CORS is configured on backend

## Example Configuration

**Vercel Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://weary-backend.onrender.com/api
NEXT_PUBLIC_APP_NAME=Wear
```

**Render Backend Environment Variables (for reference):**
```
FRONTEND_URL=https://weary-iota.vercel.app
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3001
JWT_SECRET=...
```

## Need Help?

If you're still having issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Render backend is accessible: `curl https://your-backend.onrender.com/health`
4. Check CORS configuration on backend

