# 🗄️ Supabase Database Setup Guide

## Overview

QReady now supports **Supabase** - a powerful PostgreSQL database with real-time updates and built-in API.

**Why Supabase?**
- ✅ Real PostgreSQL database
- ✅ No ID or verification required
- ✅ Free tier (500 MB database)
- ✅ Real-time subscriptions
- ✅ Automatic REST API
- ✅ Better than localStorage

---

## 🚀 Quick Setup (10 Minutes)

### **Step 1: Create Supabase Account**

1. Go to: https://supabase.com
2. Click **"Start your project"**
3. Sign up with **GitHub** or **Google**
4. Verify your email

### **Step 2: Create New Project**

1. Click **"New Project"**
2. Fill in details:
   - **Organization:** Create new or select existing
   - **Name:** `qready-db` (or any name)
   - **Database Password:** Create strong password (**SAVE THIS!**)
   - **Region:** Choose closest to Philippines:
     - 🇸🇬 Singapore (ap-southeast-1)
     - 🇯🇵 Tokyo (ap-northeast-1)
   - **Pricing Plan:** Free
3. Click **"Create new project"**
4. Wait ~2 minutes for setup ⏳

### **Step 3: Get API Keys**

1. Once ready, click **"Settings"** (⚙️ icon)
2. Click **"API"** in left sidebar
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc... (long string)
```

### **Step 4: Create Database Tables**

1. Click **"SQL Editor"** in left sidebar
2. Click **"+ New query"**
3. **Copy and paste this SQL:**

```sql
-- Create orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  fileName TEXT NOT NULL,
  paperSize TEXT NOT NULL,
  colorMode TEXT NOT NULL,
  sides TEXT NOT NULL,
  copies INTEGER NOT NULL,
  binding TEXT NOT NULL,
  pages INTEGER NOT NULL,
  price TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  paymentMethod TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_email ON orders(email);
CREATE INDEX idx_orders_created ON orders(createdAt DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can tighten later)
CREATE POLICY "Enable all for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Enable all for accounts" ON accounts FOR ALL USING (true);

-- Insert default admin and staff accounts
INSERT INTO accounts (id, username, pin, company, role, createdAt) VALUES
  ('1', 'admin', '9999', 'Master HQ', 'admin', NOW()),
  ('2', 'staff1', '1234', 'Campus Prints', 'staff', NOW());
```

4. Click **"Run"** (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

### **Step 5: Configure QReady**

Update your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key_here

# PayMongo (existing)
VITE_PAYMONGO_PUBLIC_KEY=pk_test_...
VITE_PAYMONGO_SECRET_KEY=sk_test_...
```

### **Step 6: Restart Your App**

```powershell
# Stop dev server (Ctrl + C)
# Start again
npm run dev
```

**Done!** Your orders are now saved to Supabase! 🎉

---

## 🔄 Migrating Existing Data

If you already have orders in localStorage:

1. Open browser console (F12)
2. Run this command:
```javascript
import { migrateFromLocalStorage } from './src/supabaseService.js'
await migrateFromLocalStorage()
```

Or just let the app run - it will auto-detect and migrate!

---

## 📊 Database Schema

### **Orders Table**

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Order ID (PK) - e.g., "QR-A79X2" |
| name | TEXT | Customer name |
| email | TEXT | Customer email |
| fileName | TEXT | Uploaded file name |
| paperSize | TEXT | A4, A3, Letter, Legal |
| colorMode | TEXT | Black & White, Full Color |
| sides | TEXT | Single-sided, Double-sided |
| copies | INTEGER | Number of copies |
| binding | TEXT | None, Staple, Spiral, Comb |
| pages | INTEGER | Number of pages |
| price | TEXT | Total price (PHP) |
| status | TEXT | Pending, Accepted, Printing, Ready, Completed |
| paymentMethod | TEXT | Cash, GCash, Maya, etc. |
| createdAt | TIMESTAMP | Order creation time |
| updatedAt | TIMESTAMP | Last update time |

### **Accounts Table**

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Account ID (PK) |
| username | TEXT | Login username (unique) |
| pin | TEXT | 4-digit PIN |
| company | TEXT | Company/shop name |
| role | TEXT | 'staff' or 'admin' |
| createdAt | TIMESTAMP | Account creation time |

---

## 🎯 Features

### **What You Get:**

✅ **Persistent Storage**
- Orders saved permanently
- Survives browser clearing
- Works across devices

✅ **Real-time Updates**
- See new orders instantly
- Staff dashboard auto-refreshes
- No manual polling needed

✅ **Powerful Queries**
- Search by email
- Filter by status
- Sort by date

✅ **Multi-device Sync**
- Access from phone
- Access from tablet
- Access from computer

✅ **Automatic API**
- REST API included
- GraphQL available
- No backend code needed

---

## 🔔 Real-time Subscriptions

Orders update automatically across all devices!

```javascript
// Subscribe to order changes
subscribeToOrders((payload) => {
  if (payload.eventType === 'INSERT') {
    console.log('New order:', payload.new)
  }
  if (payload.eventType === 'UPDATE') {
    console.log('Order updated:', payload.new)
  }
})
```

**What this means:**
- Staff dashboard updates instantly when new order arrives
- Admin sees status changes in real-time
- No need to refresh page!

---

## 📈 Viewing Your Data

### **In Supabase Dashboard:**

1. Click **"Table Editor"**
2. Select **"orders"** or **"accounts"**
3. View/edit data in spreadsheet-like interface

### **Run SQL Queries:**

1. Click **"SQL Editor"**
2. Write custom queries:

```sql
-- Get all pending orders
SELECT * FROM orders WHERE status = 'Pending';

-- Get orders from today
SELECT * FROM orders 
WHERE DATE(createdAt) = CURRENT_DATE;

-- Count orders by status
SELECT status, COUNT(*) 
FROM orders 
GROUP BY status;

-- Total revenue
SELECT SUM(price::NUMERIC) as total_revenue 
FROM orders;
```

---

## 🔒 Security

### **Row Level Security (RLS)**

Already enabled! Tables are protected by default.

**Current Policy:** Allow all operations (for development)

**For Production:** Tighten security:

```sql
-- Only allow reading own orders
CREATE POLICY "Users can only read own orders" 
ON orders FOR SELECT 
USING (auth.email() = email);

-- Only staff can update orders
CREATE POLICY "Staff can update orders" 
ON orders FOR UPDATE 
USING (auth.role() = 'staff');
```

### **API Keys**

**anon/public key** - Safe for frontend
**service_role key** - Keep secret! (backend only)

---

## 💰 Free Tier Limits

**What you get for FREE:**
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth/month
- Unlimited API requests
- 2 GB egress
- 50 MB file uploads

**Estimated capacity:**
- ~50,000 orders
- ~1,000 accounts
- Perfect for campus print shop!

**Need more?**
- Pro plan: $25/month
- But free tier is plenty for you! ✅

---

## 🚀 Advanced Features

### **1. Automatic Backups**

Enabled by default! Point-in-time recovery available.

### **2. Storage for Files**

Upload PDFs directly to Supabase:

```javascript
const { data, error } = await supabase.storage
  .from('documents')
  .upload('file.pdf', fileBlob)
```

### **3. Authentication**

Built-in user auth (if you need customer accounts):

```javascript
const { user, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

### **4. Functions**

Serverless functions for backend logic:

```javascript
// Supabase Edge Function
Deno.serve(async (req) => {
  // Process order
  return new Response('OK')
})
```

---

## 🐛 Troubleshooting

### **Issue: "relation 'orders' does not exist"**

**Solution:** Run the SQL table creation script again

### **Issue: "Failed to fetch"**

**Solution:**
1. Check internet connection
2. Verify SUPABASE_URL is correct
3. Check Supabase project is running (not paused)

### **Issue: "Invalid API key"**

**Solution:**
1. Copy anon key (not service_role key!)
2. Check for extra spaces
3. Restart dev server

### **Issue: "Row Level Security" error**

**Solution:** Policies are too strict. Run:
```sql
DROP POLICY IF EXISTS "Enable all for orders" ON orders;
CREATE POLICY "Enable all for orders" ON orders FOR ALL USING (true);
```

---

## 🔄 localStorage Fallback

If Supabase is not configured, app automatically uses localStorage:

```javascript
if (isSupabaseConfigured()) {
  // Use Supabase
  await createOrder(order)
} else {
  // Fallback to localStorage
  localStorage.setItem('qready_orders', JSON.stringify(orders))
}
```

**You get the best of both worlds!**

---

## 📊 Monitoring

### **Dashboard Metrics:**

1. Click **"Database"** in sidebar
2. View:
   - Storage usage
   - API requests
   - Connection count
   - Query performance

### **Logs:**

1. Click **"Logs"** in sidebar
2. View:
   - API logs
   - Database logs
   - Error logs

---

## 🎓 Learning Resources

**Official Docs:**
- Quick Start: https://supabase.com/docs/guides/getting-started
- JavaScript Client: https://supabase.com/docs/reference/javascript
- SQL Editor: https://supabase.com/docs/guides/database

**Video Tutorials:**
- Supabase YouTube: https://youtube.com/@Supabase

**Community:**
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

---

## ✅ Checklist

Setup:
- [ ] Create Supabase account
- [ ] Create new project
- [ ] Copy API keys
- [ ] Run SQL table creation
- [ ] Add keys to `.env`
- [ ] Restart dev server
- [ ] Test order creation
- [ ] Verify data in dashboard

Optional:
- [ ] Migrate localStorage data
- [ ] Set up real-time subscriptions
- [ ] Tighten RLS policies
- [ ] Enable file storage
- [ ] Configure backups

---

## 🎉 Benefits Summary

**Before (localStorage):**
- ⚠️ Data only on one device
- ⚠️ Lost when clearing browser
- ⚠️ No backup
- ⚠️ No multi-device

**After (Supabase):**
- ✅ Data saved permanently
- ✅ Works on all devices
- ✅ Automatic backups
- ✅ Real-time updates
- ✅ Professional database
- ✅ Free forever!

---

**Questions?**
- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues

---

**Made with ❤️ for QReady Campus Print Order System**
