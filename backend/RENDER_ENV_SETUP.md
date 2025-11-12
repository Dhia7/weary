# Render Environment Variables Setup

## Required Environment Variables for Render

Set these in your Render dashboard under your backend service → Environment:

### 1. Database Configuration
```
DATABASE_URL=postgresql://wear_db_user:wk1P7UbWrTpFBmSEDcPWzkQKRt9lycap@dpg-d3ahmn49c44c73dtfeag-a.frankfurt-postgres.render.com:5432/wear_db
DB_SSL=true
```
**Note:** Get your `DATABASE_URL` from your Render PostgreSQL service dashboard → "Connections" tab.

### 2. Server Configuration
```
NODE_ENV=production
PORT=3001
```

### 3. JWT Secret (IMPORTANT: Use a strong, unique secret)
```
JWT_SECRET=your_super_secure_jwt_secret_key_for_production_make_it_long_and_random
```
**⚠️ Generate a strong secret:** Use a random string generator or run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Frontend URL (for CORS)
```
FRONTEND_URL=https://weary-iota.vercel.app
```
**Update this with your actual Vercel frontend URL.**

### 5. Admin Configuration (Optional)
```
ADMIN_SEED_TOKEN=your-super-secret-random-token-here
ADMIN_EMAIL=admin@weary.com
```

### 6. File Upload (Optional)
```
UPLOAD_DIR=uploads
```

## How to Set Environment Variables in Render

1. Go to https://dashboard.render.com
2. Click on your backend service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable above
6. Click "Save Changes"
7. Render will automatically redeploy

## Important Notes

- ✅ **DO NOT** set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in Render (use `DATABASE_URL` instead)
- ✅ SSL is automatically enabled for Render databases (detected by `render.com` in URL)
- ✅ The code automatically detects Render's database and enables SSL
- ✅ Make sure `NODE_ENV=production` is set for production optimizations

## Verification

After setting environment variables, check your Render logs to confirm:
- ✅ "Connected to PostgreSQL successfully"
- ✅ "Database synchronized"
- ✅ Server running on port 3001

## Troubleshooting

If you see database connection errors:
1. Verify `DATABASE_URL` is correct (copy from PostgreSQL service dashboard)
2. Check that `DB_SSL=true` is set (or the code will auto-detect from URL)
3. Ensure PostgreSQL service is running (not suspended)
4. Check Render logs for specific error messages

