# 🔒 HTTPS Setup Guide for Wear Project

This guide will help you set up HTTPS for your Wear e-commerce application in development.

## 📋 Prerequisites

- Node.js installed
- SSL certificates generated (self-signed for development)

## 🚀 Quick Start

### 1. Generate SSL Certificates

```bash
# Run the SSL generation script
node scripts/generate-ssl.js

# Or on Windows PowerShell:
powershell -ExecutionPolicy Bypass -File scripts/generate-ssl.ps1
```

### 2. Setup HTTPS Configuration

```bash
# Run the HTTPS setup script
node scripts/setup-https.js
```

### 3. Start Your Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev:https
```

### 4. Access Your Application

- **Frontend**: https://localhost:3000
- **Backend API**: https://localhost:3001

## ⚠️ Important Notes

### Browser Security Warning
Since we're using self-signed certificates, your browser will show a security warning. To proceed:

1. Click **"Advanced"** or **"Show Details"**
2. Click **"Proceed to localhost (unsafe)"** or **"Accept the Risk and Continue"**

### Certificate Trust (Optional)
To avoid the security warning every time, you can add the certificate to your system's trusted certificates:

**Windows:**
1. Double-click `ssl/server.crt`
2. Click "Install Certificate"
3. Choose "Local Machine"
4. Place in "Trusted Root Certification Authorities"

**macOS:**
1. Double-click `ssl/server.crt`
2. Add to "System" keychain
3. Set trust to "Always Trust"

**Linux:**
```bash
sudo cp ssl/server.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

## 🔧 Manual Configuration

If you prefer to configure manually:

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://localhost:3001/api
BACKEND_PROTOCOL=https
```

### Backend (.env)
```env
FRONTEND_URL=https://localhost:3000
```

## 🛠️ Troubleshooting

### Certificate Issues
- **Error**: "SSL certificates not found"
- **Solution**: Run `node scripts/generate-ssl.js` first

### CORS Issues
- **Error**: "CORS policy" errors
- **Solution**: Ensure both frontend and backend are using HTTPS URLs

### Port Conflicts
- **Error**: "Port already in use"
- **Solution**: Kill existing processes or use different ports

### Browser Cache
- Clear browser cache and cookies
- Try incognito/private browsing mode

## 🔄 Switching Between HTTP and HTTPS

### To HTTPS:
```bash
node scripts/setup-https.js
```

### To HTTP:
1. Delete `frontend/.env.local`
2. Update `backend/.env` to use `http://localhost:3000`

## 📁 File Structure

```
wear/
├── ssl/
│   ├── server.key     # Private key
│   └── server.crt     # Certificate
├── scripts/
│   ├── generate-ssl.js    # Generate certificates
│   ├── generate-ssl.ps1   # Windows PowerShell version
│   └── setup-https.js     # Configure for HTTPS
├── frontend/
│   ├── server.js      # Custom HTTPS server
│   └── .env.local     # HTTPS environment variables
└── backend/
    ├── src/index.js   # Updated for HTTPS
    └── .env           # HTTPS environment variables
```

## 🎯 Production Deployment

For production, you'll need:

1. **Real SSL certificates** from a trusted Certificate Authority (CA)
2. **Domain name** with proper DNS configuration
3. **Reverse proxy** (nginx, Apache) for better performance
4. **Environment variables** for production URLs

### Production Environment Variables

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
BACKEND_PROTOCOL=https
```

**Backend:**
```env
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

## 🆘 Support

If you encounter issues:

1. Check the console logs for specific error messages
2. Verify SSL certificates are properly generated
3. Ensure all environment variables are set correctly
4. Check that ports 3000 and 3001 are available

## 🔐 Security Notes

- Self-signed certificates are **only for development**
- Never use self-signed certificates in production
- Always use HTTPS in production environments
- Consider implementing HSTS (HTTP Strict Transport Security) for production
