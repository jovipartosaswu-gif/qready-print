/**
 * PayMongo Payment Service
 * Handles GCash and Maya (PayMaya) payments for QReady
 * 
 * Documentation: https://developers.paymongo.com/docs
 */

// PayMongo API Configuration
const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || 'pk_test_YOUR_PUBLIC_KEY_HERE'
const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY_HERE'
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1'

/**
 * Check if PayMongo is configured
 */
export function isPaymentConfigured() {
  return PAYMONGO_PUBLIC_KEY && 
         PAYMONGO_PUBLIC_KEY !== 'pk_test_YOUR_PUBLIC_KEY_HERE' &&
         PAYMONGO_SECRET_KEY && 
         PAYMONGO_SECRET_KEY !== 'sk_test_YOUR_SECRET_KEY_HERE'
}

/**
 * Create a PayMongo Payment Intent for e-wallets (GCash, Maya)
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment Intent object with checkout URL
 */
export async function createPaymentIntent(paymentData) {
  const {
    amount,        // Amount in PHP (will be converted to cents)
    description,   // Order description
    paymentMethod, // 'gcash' or 'paymaya'
    orderId,       // Order ID for reference
    customerEmail, // Customer email
    customerName   // Customer name
  } = paymentData

  if (!isPaymentConfigured()) {
    console.warn('⚠️ PayMongo not configured. Using test mode.')
    // Return mock payment intent for testing
    return {
      id: 'pi_test_' + Date.now(),
      status: 'awaiting_payment_method',
      amount: Math.round(amount * 100),
      checkout_url: '#test-payment',
      isMock: true
    }
  }

  try {
    // Convert amount to centavos (PayMongo uses smallest currency unit)
    const amountInCentavos = Math.round(amount * 100)

    // Create Payment Intent
    const response = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            payment_method_allowed: [paymentMethod], // 'gcash' or 'paymaya'
            payment_method_options: {
              [paymentMethod]: {
                redirect: {
                  success: `${window.location.origin}/#/payment-success`,
                  failed: `${window.location.origin}/#/payment-failed`
                }
              }
            },
            currency: 'PHP',
            description: description || `QReady Order ${orderId}`,
            statement_descriptor: 'QReady Print',
            metadata: {
              order_id: orderId,
              customer_email: customerEmail,
              customer_name: customerName
            }
          }
        }
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.errors?.[0]?.detail || 'Payment intent creation failed')
    }

    // Attach payment method to create checkout URL
    const paymentIntent = result.data
    const attachResponse = await attachPaymentMethod(paymentIntent.id, paymentMethod)

    return {
      id: paymentIntent.id,
      status: paymentIntent.attributes.status,
      amount: paymentIntent.attributes.amount,
      checkout_url: attachResponse.attributes.next_action?.redirect?.url,
      payment_method: paymentMethod
    }

  } catch (error) {
    console.error('PayMongo Payment Error:', error)
    throw error
  }
}

/**
 * Attach payment method to payment intent
 * @param {string} paymentIntentId - Payment Intent ID
 * @param {string} paymentMethod - Payment method ('gcash' or 'paymaya')
 * @returns {Promise<Object>} Updated payment intent with checkout URL
 */
async function attachPaymentMethod(paymentIntentId, paymentMethod) {
  const response = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`
    },
    body: JSON.stringify({
      data: {
        attributes: {
          payment_method: paymentMethod,
          return_url: `${window.location.origin}/#/payment-callback`
        }
      }
    })
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.errors?.[0]?.detail || 'Payment method attachment failed')
  }

  return result.data
}

/**
 * Retrieve payment intent status
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<Object>} Payment intent details
 */
export async function getPaymentStatus(paymentIntentId) {
  if (!isPaymentConfigured()) {
    return {
      id: paymentIntentId,
      status: 'succeeded', // Mock success for testing
      amount: 0,
      isMock: true
    }
  }

  try {
    const response = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.errors?.[0]?.detail || 'Failed to retrieve payment status')
    }

    const paymentIntent = result.data

    return {
      id: paymentIntent.id,
      status: paymentIntent.attributes.status,
      amount: paymentIntent.attributes.amount / 100, // Convert back to PHP
      metadata: paymentIntent.attributes.metadata,
      payments: paymentIntent.attributes.payments
    }

  } catch (error) {
    console.error('Payment Status Error:', error)
    throw error
  }
}

/**
 * Process e-wallet payment (GCash or Maya)
 * @param {Object} order - Order details
 * @param {string} paymentMethod - 'GCash' or 'PayMaya'
 * @returns {Promise<Object>} Payment intent with checkout URL
 */
export async function processEwalletPayment(order, paymentMethod) {
  // Map payment method names to PayMongo format
  const paymentMethodMap = {
    'GCash': 'gcash',
    'PayMaya': 'paymaya',
    'Maya': 'paymaya'
  }

  const pmCode = paymentMethodMap[paymentMethod]

  if (!pmCode) {
    throw new Error(`Unsupported payment method: ${paymentMethod}`)
  }

  const paymentData = {
    amount: parseFloat(order.price),
    description: `Print Order - ${order.fileName}`,
    paymentMethod: pmCode,
    orderId: order.id,
    customerEmail: order.email,
    customerName: order.name
  }

  return await createPaymentIntent(paymentData)
}

/**
 * Create a payment link (alternative to checkout)
 * Useful for SMS or email payments
 */
export async function createPaymentLink(order, paymentMethod) {
  if (!isPaymentConfigured()) {
    console.warn('⚠️ PayMongo not configured. Using test mode.')
    return {
      link: `${window.location.origin}/#/test-payment/${order.id}`,
      isMock: true
    }
  }

  try {
    const amountInCentavos = Math.round(parseFloat(order.price) * 100)

    const response = await fetch(`${PAYMONGO_API_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            description: `QReady Order ${order.id} - ${order.fileName}`,
            remarks: `Print order for ${order.name}`
          }
        }
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.errors?.[0]?.detail || 'Payment link creation failed')
    }

    return {
      link: result.data.attributes.checkout_url,
      reference: result.data.id
    }

  } catch (error) {
    console.error('Payment Link Error:', error)
    throw error
  }
}

/**
 * Handle payment webhook (for backend integration)
 * This should be implemented on a backend server for security
 */
export function setupWebhookHandler() {
  console.info('💡 Webhook handling should be implemented on backend server')
  console.info('📘 See: https://developers.paymongo.com/docs/webhooks')
}

// Export configuration check
export const PAYMENT_METHODS = {
  GCASH: {
    code: 'gcash',
    name: 'GCash',
    icon: '💙',
    available: true
  },
  MAYA: {
    code: 'paymaya',
    name: 'Maya',
    icon: '💚',
    available: true
  }
}
