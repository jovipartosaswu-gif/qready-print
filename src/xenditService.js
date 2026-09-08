/**
 * Xendit Payment Service for QReady
 * Handles GCash, Maya, and other e-wallet payments
 * 
 * Documentation: https://developers.xendit.co/api-reference
 */

// Xendit API Configuration
const XENDIT_PUBLIC_KEY = import.meta.env.VITE_XENDIT_PUBLIC_KEY || ''
const XENDIT_SECRET_KEY = import.meta.env.VITE_XENDIT_SECRET_KEY || ''
const XENDIT_API_URL = 'https://api.xendit.co'

/**
 * Check if Xendit is configured
 */
export function isXenditConfigured() {
  const isConfigured = XENDIT_PUBLIC_KEY && 
         XENDIT_PUBLIC_KEY !== 'your_public_key_here' &&
         XENDIT_SECRET_KEY && 
         XENDIT_SECRET_KEY !== 'your_secret_key_here'
  
  console.log('🔍 Xendit Configuration Check:', {
    hasPublicKey: !!XENDIT_PUBLIC_KEY && XENDIT_PUBLIC_KEY !== 'your_public_key_here',
    hasSecretKey: !!XENDIT_SECRET_KEY && XENDIT_SECRET_KEY !== 'your_secret_key_here',
    isConfigured
  })
  
  return isConfigured
}

/**
 * Create Xendit eWallet Charge for GCash or Maya
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Charge object with checkout URL
 */
export async function createEwalletCharge(paymentData) {
  const {
    amount,        // Amount in PHP
    orderId,       // Order ID for reference
    customerEmail, // Customer email
    customerName,  // Customer name
    paymentMethod  // 'GCASH' or 'PAYMAYA'
  } = paymentData

  if (!isXenditConfigured()) {
    console.warn('⚠️ Xendit not configured.')
    return {
      id: 'ewc_test_' + Date.now(),
      status: 'PENDING',
      checkout_url: '#test-payment',
      isMock: true
    }
  }

  try {
    // Ensure amount is an integer (Xendit requires whole numbers, no decimals)
    const amountInteger = Math.round(parseFloat(amount))
    
    const requestBody = {
      reference_id: orderId,
      currency: 'PHP',
      amount: amountInteger,
      checkout_method: 'ONE_TIME_PAYMENT',
      channel_code: paymentMethod,
      channel_properties: {
        success_redirect_url: window.location.origin + '/#/payment-success?order=' + orderId,
        failure_redirect_url: window.location.origin + '/#/payment-failed?order=' + orderId
      }
    }

    console.log('📤 Xendit Request:', requestBody)

    const response = await fetch(`${XENDIT_API_URL}/ewallets/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(XENDIT_SECRET_KEY + ':')}`
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    console.log('📥 Xendit Response:', result)

    if (!response.ok) {
      console.error('❌ Xendit Error Details:', result)
      throw new Error(result.message || result.error_code || 'Failed to create e-wallet charge')
    }

    return {
      id: result.id,
      status: result.status,
      checkout_url: result.actions?.desktop_web_checkout_url || result.actions?.mobile_web_checkout_url,
      payment_method: paymentMethod
    }

  } catch (error) {
    console.error('Xendit Payment Error:', error)
    throw error
  }
}

/**
 * Get charge status
 * @param {string} chargeId - Charge ID
 * @returns {Promise<Object>} Charge details
 */
export async function getChargeStatus(chargeId) {
  if (!isXenditConfigured()) {
    return {
      id: chargeId,
      status: 'SUCCEEDED',
      isMock: true
    }
  }

  try {
    const response = await fetch(`${XENDIT_API_URL}/ewallets/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(XENDIT_SECRET_KEY + ':')}`
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to retrieve charge status')
    }

    return {
      id: result.id,
      status: result.status,
      amount: result.charge_amount,
      metadata: result.metadata
    }

  } catch (error) {
    console.error('Charge Status Error:', error)
    throw error
  }
}

/**
 * Process e-wallet payment (GCash or Maya)
 * @param {Object} order - Order details
 * @param {string} paymentMethod - 'GCash' or 'Maya'
 * @returns {Promise<Object>} Charge with checkout URL
 */
export async function processXenditPayment(order, paymentMethod) {
  console.log('💳 Processing Xendit Payment:', {
    orderId: order.id,
    amount: order.price,
    paymentMethod,
    isConfigured: isXenditConfigured()
  })
  
  // Map payment method names to Xendit format
  // Xendit uses 'PH_GCASH' and 'PH_PAYMAYA' for Philippines
  const paymentMethodMap = {
    'GCash': 'PH_GCASH',
    'Maya': 'PH_PAYMAYA',
    'PayMaya': 'PH_PAYMAYA'
  }

  const channelCode = paymentMethodMap[paymentMethod]

  if (!channelCode) {
    throw new Error(`Unsupported payment method: ${paymentMethod}`)
  }

  const paymentData = {
    amount: parseFloat(order.price),
    orderId: order.id,
    customerEmail: order.email,
    customerName: order.name,
    paymentMethod: channelCode
  }

  const result = await createEwalletCharge(paymentData)
  console.log('✅ Xendit Payment Result:', result)
  return result
}

// Export configuration check
export const XENDIT_PAYMENT_METHODS = {
  GCASH: {
    code: 'GCASH',
    name: 'GCash',
    icon: '💙',
    available: true
  },
  MAYA: {
    code: 'PAYMAYA',
    name: 'Maya',
    icon: '💚',
    available: true
  }
}
