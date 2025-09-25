# 🚀 How to Start the Backend Server

## ❌ **The Problem**
You're getting "Failed to fetch" because the backend server is not running.

## ✅ **The Solution**

### **Step 1: Check if PostgreSQL is Running**
```bash
cd backend
npm run test:postgres
```

### **Step 2: Set Up Database (if needed)**
```bash
npm run setup:db
```

### **Step 3: Start the Backend Server**
```bash
npm run dev
```

### **Step 4: Verify Server is Running**
```bash
npm run verify:server
```

## 🔍 **What You Should See**

### **Successful Server Start:**
```
🚀 Starting Wear Backend Server...
📡 Connecting to database...
✅ Database connected successfully
🌐 Starting Express server...
Server running on port 3000
Environment: development
```

### **Successful Verification:**
```
🔍 Checking if backend server is running...

✅ Server is running on port 3000!
   Status: 200
   Response: OK
   Products found: X
🎉 Backend server is working correctly!
💡 You can now use the frontend application.
```

## 🚨 **Common Issues & Fixes**

### **Issue 1: PostgreSQL Not Running**
**Error:** `❌ PostgreSQL connection failed!`
**Fix:**
```bash
# Start PostgreSQL service
net start postgresql-x64-14

# Or use Services.msc
# Go to Services → PostgreSQL → Start
```

### **Issue 2: Database Not Created**
**Error:** `Database does not exist`
**Fix:**
```bash
npm run setup:db
```

### **Issue 3: Port 3000 Busy**
**Error:** `EADDRINUSE: address already in use`
**Fix:**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <process_id> /F
```

### **Issue 4: Server Starts but API Fails**
**Error:** `❌ Server is not running or not accessible`
**Fix:**
1. Check Windows Firewall
2. Check Antivirus settings
3. Restart the server

## 📋 **Complete Startup Sequence**

```bash
# 1. Navigate to backend
cd backend

# 2. Test database connection
npm run test:postgres

# 3. Set up database (if first time)
npm run setup:db

# 4. Start server
npm run dev

# 5. In another terminal, verify server
npm run verify:server

# 6. Start frontend (in another terminal)
cd ../frontend
npm run dev
```

## 🎯 **Expected Results**

After successful startup:
- ✅ **Backend**: Running on http://localhost:3000
- ✅ **API**: Accessible at http://localhost:3000/api/products
- ✅ **Frontend**: Can connect without "Failed to fetch" errors
- ✅ **Featured Products**: Load correctly
- ✅ **Login**: Works properly
- ✅ **Admin Orders**: Show product details

## 💡 **Quick Commands**

```bash
# Start everything
npm run test:postgres && npm run dev

# Verify server
npm run verify:server

# Test API
npm run test:api
```

## 🔄 **If Still Not Working**

1. **Restart Computer**: Sometimes helps with service issues
2. **Check Windows Firewall**: Allow Node.js and PostgreSQL
3. **Check Antivirus**: May be blocking connections
4. **Check Logs**: Look at backend console output for specific errors

The "Failed to fetch" error will disappear once the backend server is running on port 3000!



