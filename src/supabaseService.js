/**
 * Supabase Database Service for QReady
 * PostgreSQL database with real-time updates
 * 
 * Documentation: https://supabase.com/docs
 */

import { createClient } from '@supabase/supabase-js'

// Supabase Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export function isSupabaseConfigured() {
  return SUPABASE_URL && SUPABASE_ANON_KEY && 
         SUPABASE_URL !== '' && 
         !SUPABASE_URL.includes('YOUR_PROJECT')
}

// Initialize Supabase client
let supabase = null
if (isSupabaseConfigured()) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  console.log('✅ Supabase connected:', SUPABASE_URL)
} else {
  console.warn('⚠️ Supabase not configured. Using localStorage fallback.')
}

/**
 * Database Schema:
 * 
 * Table: orders
 * - id (text, primary key) - Order ID like "QR-A79X2"
 * - name (text) - Customer name
 * - email (text) - Customer email
 * - fileName (text) - Uploaded file name
 * - paperSize (text) - A4, A3, Letter, Legal
 * - colorMode (text) - Black & White, Full Color
 * - sides (text) - Single-sided, Double-sided
 * - copies (int) - Number of copies
 * - binding (text) - None, Staple, Spiral Binding, Comb Binding
 * - pages (int) - Number of pages
 * - price (text) - Total price
 * - status (text) - Pending, Accepted, Printing, Ready, Completed
 * - paymentMethod (text) - Cash, GCash, Maya, etc.
 * - createdAt (timestamp) - When order was created
 * - updatedAt (timestamp) - Last update time
 * 
 * Table: accounts
 * - id (text, primary key) - Account ID
 * - username (text, unique) - Login username
 * - pin (text) - 4-digit PIN (encrypted in production!)
 * - company (text) - Company/shop name
 * - role (text) - 'staff' or 'admin'
 * - createdAt (timestamp)
 */

// ────────────────────────────────────────────────────────────────────────────
// ORDERS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get all orders
 */
export async function getAllOrders() {
  if (!supabase) return null

  try {
    console.log('🔍 Fetching orders from Supabase...')
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false })  // Use camelCase with quotes

    if (error) {
      console.error('❌ Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
    console.log('✅ Fetched orders:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Error fetching orders:', error.message || error)
    return null
  }
}

/**
 * Get single order by ID
 */
export async function getOrderById(orderId) {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

/**
 * Create new order
 */
export async function createOrder(order) {
  if (!supabase) return null

  try {
    const orderData = {
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) throw error
    console.log('✅ Order created in Supabase:', data.id)
    return data
  } catch (error) {
    console.error('Error creating order:', error)
    return null
  }
}

/**
 * Update order
 */
export async function updateOrder(orderId, updates) {
  if (!supabase) return null

  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    console.log('✅ Order updated in Supabase:', orderId)
    return data
  } catch (error) {
    console.error('Error updating order:', error)
    return null
  }
}

/**
 * Delete order
 */
export async function deleteOrder(orderId) {
  if (!supabase) return null

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) throw error
    console.log('✅ Order deleted from Supabase:', orderId)
    return true
  } catch (error) {
    console.error('Error deleting order:', error)
    return false
  }
}

/**
 * Delete all orders
 */
export async function deleteAllOrders() {
  if (!supabase) return null

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('id', '') // Delete all records

    if (error) throw error
    console.log('✅ All orders deleted from Supabase')
    return true
  } catch (error) {
    console.error('Error deleting all orders:', error)
    return false
  }
}

/**
 * Search orders by email and order ID
 */
export async function searchOrder(orderId, email) {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('email', email)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error searching order:', error)
    return null
  }
}

// ────────────────────────────────────────────────────────────────────────────
// ACCOUNTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get all accounts
 */
export async function getAllAccounts() {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('createdAt', { ascending: true })  // Use camelCase

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return null
  }
}

/**
 * Create new account
 */
export async function createAccount(account) {
  if (!supabase) return null

  try {
    const accountData = {
      ...account,
      createdAt: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert([accountData])
      .select()
      .single()

    if (error) throw error
    console.log('✅ Account created in Supabase:', data.username)
    return data
  } catch (error) {
    console.error('Error creating account:', error)
    return null
  }
}

/**
 * Update account
 */
export async function updateAccount(accountId, updates) {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single()

    if (error) throw error
    console.log('✅ Account updated in Supabase:', accountId)
    return data
  } catch (error) {
    console.error('Error updating account:', error)
    return null
  }
}

/**
 * Delete account
 */
export async function deleteAccount(accountId) {
  if (!supabase) return null

  try {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId)

    if (error) throw error
    console.log('✅ Account deleted from Supabase:', accountId)
    return true
  } catch (error) {
    console.error('Error deleting account:', error)
    return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// REAL-TIME SUBSCRIPTIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to order changes (real-time)
 */
export function subscribeToOrders(callback) {
  if (!supabase) return null

  const subscription = supabase
    .channel('orders_channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('📡 Real-time order update:', payload)
        callback(payload)
      }
    )
    .subscribe()

  return subscription
}

/**
 * Unsubscribe from changes
 */
export function unsubscribe(subscription) {
  if (subscription && supabase) {
    supabase.removeChannel(subscription)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SYNC WITH LOCALSTORAGE (for migration/fallback)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Sync localStorage data to Supabase (one-time migration)
 */
export async function migrateFromLocalStorage() {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping migration')
    return false
  }

  try {
    // Migrate orders
    const localOrders = localStorage.getItem('qready_orders')
    if (localOrders) {
      const orders = JSON.parse(localOrders)
      console.log(`📦 Migrating ${orders.length} orders to Supabase...`)
      
      for (const order of orders) {
        await createOrder(order)
      }
      console.log('✅ Orders migrated successfully')
    }

    // Migrate accounts
    const localAccounts = localStorage.getItem('qready_accounts')
    if (localAccounts) {
      const accounts = JSON.parse(localAccounts)
      console.log(`📦 Migrating ${accounts.length} accounts to Supabase...`)
      
      for (const account of accounts) {
        await createAccount(account)
      }
      console.log('✅ Accounts migrated successfully')
    }

    return true
  } catch (error) {
    console.error('❌ Migration error:', error)
    return false
  }
}

/**
 * Export Supabase client for advanced queries
 */
export { supabase }
