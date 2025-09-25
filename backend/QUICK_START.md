# 🚀 Quick Start Guide - Fix "Failed to fetch" Error

## ❌ **The Problem**
You're getting "Failed to fetch" error because:
1. Backend server is not running
2. Database is not connected
3. API endpoints are not accessible

## ✅ **The Solution**

### **Step 1: Install PostgreSQL**
1. Download from: https://www.postgresql.org/download/windows/
2. Install with password: `dhianaija123` (or update scripts with your password)
3. Make sure PostgreSQL service is running

### **Step 2: Set Up Database**
```bash
cd backend
npm run setup:db
```

### **Step 3: Test Database Connection**
```bash
npm run test:postgres
```

### **Step 4: Start Backend Server**
```bash
npm run dev
```

You should see:
```
🚀 Starting Wear Backend Server...
📡 Connecting to database...
✅ Database connected successfully
🌐 Starting Express server...
Server running on port 3000
```

### **Step 5: Test Frontend**
1. Open your frontend application
2. Try to login
3. Check admin orders page

## 🔧 **Troubleshooting**

### **If Database Connection Fails:**
```bash
# Check if PostgreSQL is running
net start postgresql-x64-14

# Or start PostgreSQL service manually
# Go to Services.msc → PostgreSQL → Start
```

### **If Port 5000 is Busy:**
```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process if needed
taskkill /PID <process_id> /F
```

### **If Frontend Still Can't Connect:**
1. Check browser console for errors
2. Verify backend is running on http://localhost:5000
3. Test API directly: http://localhost:5000/api/auth/login

## 📋 **Expected Results**

After successful setup:

✅ **Backend**: Running on http://localhost:5000  
✅ **Database**: PostgreSQL connected  
✅ **API**: All endpoints working  
✅ **Frontend**: Can login and view orders  
✅ **Orders**: Product details showing correctly  

## 🎯 **Quick Commands**

```bash
# Setup everything
npm run setup:db
npm run test:postgres
npm run dev

# In another terminal, start frontend
cd ../frontend
npm run dev
```

## 🔍 **Verify Everything Works**

1. **Backend**: http://localhost:3000/api/auth/login
2. **Frontend**: http://localhost:3000
3. **Admin Orders**: Should show product details
4. **Console**: No "Failed to fetch" errors

The "Failed to fetch" error will be resolved once the backend server is running and connected to the database!
