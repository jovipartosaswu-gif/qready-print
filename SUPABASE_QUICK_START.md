# 🚀 Supabase Quick Start (5 Steps)

## Step 1: Sign Up (2 minutes)

1. Go to: **https://supabase.com**
2. Click **"Start your project"**
3. Sign in with **GitHub** or **Google**
4. ✅ No ID required!

---

## Step 2: Create Project (2 minutes)

1. Click **"New Project"**
2. Fill in:
   - Name: `qready-db`
   - Password: (create strong password - SAVE IT!)
   - Region: **Singapore** or **Tokyo**
3. Click **"Create new project"**
4. Wait ~2 minutes ⏳

---

## Step 3: Get API Keys (1 minute)

1. Click **"Settings"** ⚙️
2. Click **"API"**
3. Copy:
   - **Project URL**
   - **anon public** key

---

## Step 4: Create Tables (2 minutes)

1. Click **"SQL Editor"**
2. Click **"+ New query"**
3. **Paste this SQL:**

```sql
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

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_email ON orders(email);
CREATE INDEX idx_orders_created ON orders(createdAt DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Enable all for accounts" ON accounts FOR ALL USING (true);

INSERT INTO accounts (id, username, pin, company, role, createdAt) VALUES
  ('1', 'admin', '9999', 'Master HQ', 'admin', NOW()),
  ('2', 'staff1', '1234', 'Campus Prints', 'staff', NOW());
```

4. Click **"Run"**

---

## Step 5: Configure QReady (1 minute)

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Restart app:
```powershell
npm run dev
```

---

## ✅ Done!

**Test it:**
1. Place an order
2. Check Supabase dashboard → Table Editor → orders
3. See your order! 🎉

**What you get:**
- ✅ Real PostgreSQL database
- ✅ Data saved permanently
- ✅ Works across devices
- ✅ Real-time updates
- ✅ Free forever (500MB)

---

**Need help?** Read: `SUPABASE_SETUP_GUIDE.md`

**Total time: ~8 minutes** ⏱️
