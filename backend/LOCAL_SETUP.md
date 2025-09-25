# Local PostgreSQL Setup Guide

## 🚀 **Quick Setup (Without Docker)**

Since Docker Desktop is not available due to BIOS/Virtual Machine limitations, here's how to set up PostgreSQL locally.

### **Step 1: Install PostgreSQL**

#### **Option A: Official Installer (Recommended)**
1. Go to https://www.postgresql.org/download/windows/
2. Download the PostgreSQL installer
3. Run the installer and follow the setup wizard
4. **Important**: Remember the password you set for the `postgres` user
5. Make sure PostgreSQL service is running

#### **Option B: Using Package Managers**
```bash
# Using Chocolatey
choco install postgresql

# Using Scoop
scoop install postgresql
```

### **Step 2: Verify PostgreSQL Installation**

1. Open Command Prompt or PowerShell
2. Navigate to your backend directory:
   ```bash
   cd backend
   ```
3. Test PostgreSQL connection:
   ```bash
   npm run test:postgres
   ```

### **Step 3: Set Up Database**

1. Run the database setup script:
   ```bash
   npm run setup:db
   ```

2. This will:
   - Create the `wear_db` database
   - Create the `.env` file with correct configuration
   - Set up the database structure

### **Step 4: Start the Backend Server**

```bash
npm run dev
```

The server will automatically:
- Connect to PostgreSQL
- Create all necessary tables
- Set up relationships between tables

### **Step 5: Test the System**

1. Open your frontend application
2. Go to the admin orders page
3. Check the browser console for debug information
4. Verify that product details are showing correctly

## 🔧 **Troubleshooting**

### **PostgreSQL Not Running**
```bash
# Windows - Start PostgreSQL service
net start postgresql-x64-14

# Or use Services.msc to start PostgreSQL service
```

### **Connection Refused**
- Make sure PostgreSQL is running on port 5432
- Check if Windows Firewall is blocking the connection
- Verify the password in the `.env` file

### **Authentication Failed**
- Update the password in `setup-local-db.js` and `check-postgresql.js`
- Or manually edit the `.env` file with the correct password

### **Database Already Exists**
- This is normal, the setup script will handle it gracefully

## 📁 **File Structure**

After setup, you should have:
```
backend/
├── .env                    # Database configuration
├── setup-local-db.js       # Database setup script
├── check-postgresql.js     # Connection test script
├── validate-product-data.js # Data validation script
└── src/
    ├── config/
    │   └── database.js      # Database connection config
    └── models/             # Database models
```

## 🎯 **Expected Results**

Once everything is set up:

1. **Backend Server**: Running on http://localhost:3001
2. **Database**: PostgreSQL with `wear_db` database
3. **Tables**: Products, Orders, OrderItems, Users, etc.
4. **Admin Orders**: Showing product details correctly

## 🔍 **Debugging Product Data**

If product details still show "Unknown Product":

1. **Check Browser Console**: Look for debug output
2. **Run Validation**: `npm run validate:products`
3. **Check API Response**: Verify the `/admin/orders` endpoint
4. **Database Check**: Ensure products exist in the database

## 📞 **Need Help?**

If you encounter issues:

1. Run `npm run test:postgres` to check PostgreSQL connection
2. Check the backend server logs for errors
3. Verify the `.env` file has correct database credentials
4. Make sure PostgreSQL service is running

The system will automatically create all necessary tables and relationships when you start the backend server!



