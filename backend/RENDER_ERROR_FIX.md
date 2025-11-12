# Render Deployment Error Fix Guide

## Error: "Instance failed: nfng6 - Exited with status 1"

This error means the application crashed during startup. Here's how to fix it:

## Step 1: Check Render Logs

1. Go to https://dashboard.render.com
2. Click on your backend service
3. Go to **"Logs"** tab
4. Look for the **actual error message** (scroll to the bottom for most recent)

Common error messages and fixes:

### Error: "Cannot find module 'X'"
**Fix:** Missing dependency
- Check if all dependencies are in `package.json`
- Render should run `npm install` automatically
- Verify `package.json` is committed to git

### Error: "Database connection failed"
**Fix:** Check environment variables
- Verify `DATABASE_URL` is set correctly
- Check `DB_SSL=true` is set (or auto-detected)
- Ensure PostgreSQL service is running (not suspended)

### Error: "Port already in use" or "EADDRINUSE"
**Fix:** Port configuration
- Verify `PORT=3001` is set in environment variables
- Render sets `PORT` automatically, but our code uses `process.env.PORT || 3001`
- Make sure no conflicting port settings

### Error: "JWT_SECRET is required"
**Fix:** Missing JWT secret
- Set `JWT_SECRET` in environment variables
- Use a strong random string

### Error: Syntax errors
**Fix:** Code issues
- Check git commit for syntax errors
- Verify all files are saved correctly
- Test locally first: `npm start`

## Step 2: Verify Environment Variables

In Render dashboard → Your service → **Environment** tab, ensure these are set:

```
✅ NODE_ENV=production
✅ PORT=3001
✅ DATABASE_URL=postgresql://...
✅ DB_SSL=true
✅ JWT_SECRET=your-secret-here
✅ FRONTEND_URL=https://weary-iota.vercel.app
```

## Step 3: Check Build & Start Commands

In Render dashboard → Your service → **Settings** → **Build & Deploy**:

- **Build Command:** `npm install`
- **Start Command:** `npm start`

## Step 4: Common Fixes

### Fix 1: Redeploy Latest Commit
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Watch the logs for errors

### Fix 2: Check Database Connection
1. Go to PostgreSQL service in Render
2. Verify it's "Available" (not suspended)
3. Copy the connection string from "Connections" tab
4. Update `DATABASE_URL` in backend service environment variables

### Fix 3: Verify Code is Committed
```bash
# Make sure all changes are committed
git add .
git commit -m "Fix product image display"
git push
```

### Fix 4: Test Locally First
```bash
cd backend
npm install
npm start
# If it works locally, the issue is with Render config
```

## Step 5: Check Specific Error in Logs

The actual error message will tell you exactly what's wrong. Common patterns:

- **"Error: listen EADDRINUSE"** → Port conflict
- **"SequelizeConnectionError"** → Database connection issue
- **"MODULE_NOT_FOUND"** → Missing dependency
- **"SyntaxError"** → Code syntax issue
- **"Cannot read property X"** → Runtime error

## Quick Checklist

- [ ] All environment variables set correctly
- [ ] PostgreSQL service is running
- [ ] Code is committed and pushed to git
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] PORT environment variable set (or using default 3001)
- [ ] DATABASE_URL is correct
- [ ] JWT_SECRET is set
- [ ] Checked Render logs for actual error message

## Still Having Issues?

1. **Copy the exact error from Render logs**
2. **Check if it works locally** (`npm start`)
3. **Verify all environment variables** are set
4. **Check Render status page** for service outages

