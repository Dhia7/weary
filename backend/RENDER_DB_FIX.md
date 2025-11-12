# Render Database Connection Fix

## Error: "Connection terminated unexpectedly"

This error means the SSL handshake is failing when connecting to Render's PostgreSQL database.

## Quick Fix Steps

### Step 1: Verify PostgreSQL Service is Running

1. Go to https://dashboard.render.com
2. Find your **PostgreSQL** service (not the backend)
3. Check status - must be **"Available"** (not "Suspended")
4. If suspended, click **"Resume"** or **"Activate"**

### Step 2: Get Correct DATABASE_URL

1. In PostgreSQL service → **"Connections"** tab
2. Copy the **"Internal Database URL"** (for services in same region)
3. Or copy **"External Database URL"** if needed
4. The URL should look like:
   ```
   postgresql://user:password@host:5432/database
   ```

### Step 3: Update Environment Variables

In your **backend service** → **Environment** tab:

1. **DATABASE_URL** - Paste the exact URL from PostgreSQL service
2. **DB_SSL=true** - Set this explicitly (or it auto-detects from render.com)
3. **NODE_ENV=production**
4. **PORT=3001**

### Step 4: Common Issues & Solutions

#### Issue 1: Database Service Suspended
**Solution:** Reactivate the PostgreSQL service in Render dashboard

#### Issue 2: Wrong DATABASE_URL Format
**Solution:** Use the Internal Database URL from PostgreSQL service connections tab

#### Issue 3: SSL Configuration
**Solution:** The code auto-detects SSL for render.com URLs. Ensure `DB_SSL=true` is set.

#### Issue 4: Database Credentials Changed
**Solution:** Get fresh credentials from PostgreSQL service → Connections tab

### Step 5: Verify Connection String Format

The DATABASE_URL should be:
```
postgresql://username:password@hostname:5432/database_name
```

**NOT:**
- `postgres://` (should be `postgresql://`)
- Missing port number
- Wrong hostname

### Step 6: Test Connection

After updating environment variables:
1. Render will auto-redeploy
2. Check logs for:
   - ✅ "🔒 SSL enabled for remote database connection"
   - ✅ "📊 Using DATABASE_URL for connection"
   - ✅ "Connected to PostgreSQL successfully"

## Debugging Steps

If still failing, check logs for:

1. **"SSL enabled: true"** - Confirms SSL is being used
2. **"Database host: xxx"** - Shows which host it's connecting to
3. **Error code** - Look for specific error codes:
   - `ECONNREFUSED` - Database not accessible
   - `ETIMEDOUT` - Connection timeout
   - `ENOTFOUND` - Hostname not found
   - `28000` - Authentication failed

## Alternative: Use Connection Pooling

If direct connection fails, Render PostgreSQL might need connection pooling. Check if your PostgreSQL service has a connection pooler URL.

## Still Not Working?

1. **Check Render Status**: https://status.render.com
2. **Verify Database Region**: Backend and database should be in same region
3. **Check Database Limits**: Free tier has connection limits
4. **Contact Render Support**: If database is accessible but connection fails

## Updated Code Features

The updated code now:
- ✅ Better error logging with connection details
- ✅ Auto-detects SSL for render.com URLs
- ✅ Shows troubleshooting tips on failure
- ✅ Logs connection attempts with details

