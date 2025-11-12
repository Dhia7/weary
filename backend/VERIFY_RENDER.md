# Render Deployment Verification Checklist

## Step 1: Check Render Dashboard

1. Go to https://dashboard.render.com
2. Find your backend service (likely named `weary-backend` or similar)
3. Check the status - should show "Live" ✅
4. Note your service URL (e.g., `https://weary-backend.onrender.com`)

## Step 2: Check Environment Variables

In Render dashboard → Your service → Environment tab, verify these are set:

- ✅ `DATABASE_URL` - Should start with `postgresql://`
- ✅ `DB_SSL=true` (or auto-detected)
- ✅ `NODE_ENV=production`
- ✅ `PORT=3001`
- ✅ `JWT_SECRET` - Should be set
- ✅ `FRONTEND_URL` - Should be your Vercel URL

## Step 3: Check Render Logs

In Render dashboard → Your service → Logs tab, look for:

✅ **Success indicators:**
- "Connected to PostgreSQL successfully"
- "Database synchronized"
- "HTTP Server running on port 3001"
- "Environment: production"

❌ **Error indicators to watch for:**
- "Database connection attempt X failed"
- "Connection terminated unexpectedly"
- "EADDRINUSE" (port already in use)
- SSL/TLS errors

## Step 4: Test API Endpoints

### Test Health Endpoint
```bash
curl https://your-backend-name.onrender.com/health
```

**Expected response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": {
    "status": "connected",
    "responseTime": "Xms"
  }
}
```

### Test Database Status
```bash
curl https://your-backend-name.onrender.com/health/db
```

### Test Products Endpoint
```bash
curl https://your-backend-name.onrender.com/api/products
```

## Step 5: Verify Database Connection

Check if database is accessible:
- Go to Render dashboard → PostgreSQL service
- Check status is "Available"
- Verify the database URL matches your `DATABASE_URL` env var

## Step 6: Test from Frontend

1. Make sure your frontend `.env.local` has:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com/api
   ```

2. Deploy/update your Vercel frontend

3. Test API calls from your frontend app

## Common Issues & Solutions

### Issue: "Database connection failed"
**Solution:** 
- Verify `DATABASE_URL` is correct
- Check PostgreSQL service is running (not suspended)
- Ensure `DB_SSL=true` is set

### Issue: "Service won't start"
**Solution:**
- Check logs for specific errors
- Verify `PORT=3001` is set
- Check build logs for npm install errors

### Issue: "CORS errors from frontend"
**Solution:**
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Check CORS configuration in `src/index.js`

### Issue: "Service spins down"
**Solution:**
- This is normal for free tier after inactivity
- First request will wake it up (may take 30-60 seconds)
- Consider upgrading to keep-alive if needed

## Quick Test Commands

Replace `YOUR_BACKEND_URL` with your actual Render URL:

```bash
# Health check
curl https://YOUR_BACKEND_URL/health

# Database status
curl https://YOUR_BACKEND_URL/health/db

# Products list
curl https://YOUR_BACKEND_URL/api/products

# Test CORS (from browser console on your frontend)
fetch('https://YOUR_BACKEND_URL/api/products')
  .then(r => r.json())
  .then(console.log)
```

