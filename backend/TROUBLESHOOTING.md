# 🔧 Troubleshooting "Failed to fetch" Error

## ❌ **The Problem**
You're getting "Failed to fetch" errors in multiple places:
- Login page
- Featured products
- Admin orders
- Any API call

This means the **backend server is not running**.

## ✅ **The Solution**

### **Method 1: Using Batch File (Windows)**
```bash
cd backend
start-backend.bat
```

### **Method 2: Using PowerShell**
```bash
cd backend
.\start-backend.ps1
```

### **Method 3: Manual Steps**
```bash
cd backend

# Step 1: Test database connection
npm run test:postgres

# Step 2: Start server
npm run dev
```

## 🔍 **What to Look For**

### **Successful Startup:**
```
🚀 Starting Wear Backend Server...
📡 Connecting to database...
✅ Database connected successfully
🌐 Starting Express server...
Server running on port 3000
```

### **If Database Fails:**
```
❌ PostgreSQL connection failed!
💡 Please install PostgreSQL and run: npm run setup:db
```

## 🚨 **Common Issues & Fixes**

### **Issue 1: PostgreSQL Not Installed**
**Solution:**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with password: `dhianaija123`
3. Start PostgreSQL service

### **Issue 2: PostgreSQL Not Running**
**Solution:**
```bash
# Start PostgreSQL service
net start postgresql-x64-14

# Or use Services.msc
# Go to Services → PostgreSQL → Start
```

### **Issue 3: Port 5000 Busy**
**Solution:**
```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <process_id> /F
```

### **Issue 4: Database Not Created**
**Solution:**
```bash
npm run setup:db
```

## 📋 **Step-by-Step Fix**

1. **Install PostgreSQL** (if not installed)
2. **Start PostgreSQL service**
3. **Run setup script**: `npm run setup:db`
4. **Test connection**: `npm run test:postgres`
5. **Start backend**: `npm run dev`
6. **Test frontend**: Open http://localhost:3000

## 🎯 **Verification**

After starting the backend, test these URLs:

- **Backend Health**: http://localhost:3000/api/products
- **Frontend**: http://localhost:3000
- **Login**: Should work without "Failed to fetch"
- **Products**: Should load without errors
- **Admin Orders**: Should show product details

## 💡 **Quick Commands**

```bash
# Setup everything
npm run setup:db
npm run test:postgres
npm run dev

# Or use the batch file
start-backend.bat
```

## 🔄 **If Still Not Working**

1. **Check Windows Firewall**: Allow Node.js and PostgreSQL
2. **Check Antivirus**: May be blocking connections
3. **Restart Computer**: Sometimes helps with service issues
4. **Check Logs**: Look at backend console output for errors

The "Failed to fetch" error will disappear once the backend server is running on port 3000!
