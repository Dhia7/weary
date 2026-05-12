# Render Deployment Guide

## Environment Variables for Production

Set these environment variables in your Render service:

### Required Variables:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=your_super_secure_jwt_secret_key_for_production
FRONTEND_URL=https://your-frontend-app.onrender.com
```

### Sign in with Google (backend):
```
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```
Use the same OAuth Web client ID as on Vercel (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`). See [GOOGLE_SIGNIN.md](./GOOGLE_SIGNIN.md).

### Sign in with Google (Vercel frontend):
In the Vercel project → Environment Variables:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```
Redeploy the frontend after adding it. In Google Cloud Console, add your Vercel URL under **Authorized JavaScript origins** for that OAuth client.

### Important Notes:
- **Do NOT set any SSL-related environment variables** (SSL_CERT, SSL_KEY, SSL_CA, HTTPS_PORT, SSL_PORT)
- Render handles SSL termination at the load balancer level
- The application runs HTTP internally, Render provides HTTPS externally
- Use a strong JWT_SECRET in production
- Update FRONTEND_URL with your actual frontend URL

## Build and Start Commands:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## Troubleshooting:
If you see SSL/PEM errors:
1. Ensure NODE_ENV=production is set
2. Verify no SSL environment variables are set
3. Check that the application only creates HTTP servers
4. Render automatically handles SSL termination

## Database:
- Use Render's managed PostgreSQL service
- Set the DATABASE_URL environment variable
- No additional SSL configuration needed for database connections






