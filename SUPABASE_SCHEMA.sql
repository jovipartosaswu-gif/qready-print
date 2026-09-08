-- ============================================================================
-- QReady - Supabase Database Schema
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to create the correct table structure
-- https://app.supabase.com/project/fkhggdraoqmtjnzxuyzt/sql

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  -- Primary Key
  id TEXT PRIMARY KEY,
  
  -- Customer Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Document Details
  "fileName" TEXT,
  "fileSize" TEXT,
  pages INTEGER DEFAULT 1,
  
  -- Print Specifications
  "paperSize" TEXT NOT NULL DEFAULT 'A4',
  "colorMode" TEXT NOT NULL DEFAULT 'Black & White',
  sides TEXT NOT NULL DEFAULT 'Single-sided',
  copies INTEGER NOT NULL DEFAULT 1,
  binding TEXT NOT NULL DEFAULT 'None',
  
  -- Pricing
  price TEXT NOT NULL,
  
  -- Payment
  "paymentMethod" TEXT DEFAULT 'Cash',
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'Pending',
  
  -- Timestamps
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders("createdAt" DESC);

-- ============================================================================
-- ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS accounts (
  -- Primary Key
  id TEXT PRIMARY KEY,
  
  -- Login Credentials
  username TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  
  -- Business Info
  company TEXT NOT NULL,
  
  -- Role
  role TEXT NOT NULL DEFAULT 'staff',
  
  -- Timestamps
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster login queries
CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);

-- ============================================================================
-- INSERT DEFAULT ACCOUNTS (optional - for testing)
-- ============================================================================
INSERT INTO accounts (id, username, pin, company, role, "createdAt")
VALUES 
  ('1', 'admin', '9999', 'Master HQ', 'admin', NOW()),
  ('2', 'staff1', '1234', 'Campus Prints', 'staff', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DISABLE ROW LEVEL SECURITY (for development only!)
-- ============================================================================
-- For production, you should enable RLS with proper policies
-- See SUPABASE_SETUP_GUIDE.md for security best practices

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTIONAL: Enable Real-time Replication
-- ============================================================================
-- Uncomment these lines if you want real-time updates via websockets
-- ALTER TABLE orders REPLICA IDENTITY FULL;
-- ALTER TABLE accounts REPLICA IDENTITY FULL;

-- ============================================================================
-- VERIFY TABLES CREATED
-- ============================================================================
-- Run this to check if tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'accounts');

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Your database is now ready for QReady!
-- 
-- Next steps:
-- 1. Verify tables exist: Go to Table Editor
-- 2. Test the app: Visit http://localhost:5174
-- 3. Place a test order: Click "Place Order" button
-- 4. Check data: Refresh Table Editor to see the new order
-- 
-- For production deployment:
-- - Enable RLS with proper security policies
-- - Use environment variables for API keys
-- - Set up proper authentication
-- 
-- Security policies example (for later):
-- CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
-- CREATE POLICY "Authenticated insert orders" ON orders FOR INSERT WITH CHECK (true);
-- ============================================================================
