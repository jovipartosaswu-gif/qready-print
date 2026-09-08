/**
 * Xendit Webhook Handler - Vercel Serverless Function
 * 
 * This endpoint receives payment notifications from Xendit
 * and sends confirmation emails after successful payments.
 * 
 * URL: https://your-app.vercel.app/api/xendit-webhook
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

/**
 * Send order confirmation email using your email service
 * Note: This is a simplified version. You'll need to configure your email service.
 */
async function sendEmail(order) {
  // For now, we'll just log it
  // You can integrate with SendGrid, Resend, or any email service here
  console.log('📧 Sending email to:', order.email)
  console.log('Order ID:', order.id)
  
  // Example with fetch to an email service:
  // await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{
  //       to: [{ email: order.email }],
  //       subject: `Order Confirmation - ${order.id}`
  //     }],
  //     from: { email: 'noreply@qready.com' },
  //     content: [{
  //       type: 'text/html',
  //       value: `Your order ${order.id} has been confirmed...`
  //     }]
  //   })
  // })
  
  return { success: true }
}

/**
 * Main webhook handler
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const webhookData = req.body
    
    console.log('🔔 Webhook received:', {
      event: webhookData.event || webhookData.status,
      reference_id: webhookData.reference_id,
      status: webhookData.status
    })

    // Verify webhook is from Xendit
    const callbackToken = req.headers['x-callback-token']
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN
    
    if (expectedToken && callbackToken !== expectedToken) {
      console.error('❌ Invalid webhook token')
      return res.status(401).json({ error: 'Invalid webhook token' })
    }

    // Check if payment is successful
    // Xendit sends different webhook formats depending on the product
    const isSuccess = webhookData.status === 'SUCCEEDED' || 
                     webhookData.status === 'PAID' ||
                     webhookData.charge_status === 'SUCCEEDED'

    if (!isSuccess) {
      console.log('⏭️ Payment not successful, skipping')
      return res.status(200).json({ received: true, action: 'skipped' })
    }

    // Get order ID from webhook
    const orderId = webhookData.reference_id || 
                   webhookData.external_id ||
                   webhookData.data?.reference_id

    if (!orderId) {
      console.error('❌ No order ID in webhook')
      return res.status(400).json({ error: 'No order ID found' })
    }

    console.log('💳 Payment successful for order:', orderId)

    // Fetch order from Supabase
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      console.error('❌ Order not found:', orderId, fetchError)
      return res.status(404).json({ error: 'Order not found' })
    }

    console.log('✅ Order found:', order.id)

    // Update order status to Accepted (payment confirmed)
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'Accepted',
        updatedAt: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('❌ Failed to update order:', updateError)
      return res.status(500).json({ error: 'Failed to update order' })
    }

    console.log('✅ Order status updated to Accepted')

    // Send confirmation email
    try {
      await sendEmail(order)
      console.log('✅ Email sent successfully')
    } catch (emailError) {
      console.error('⚠️ Email failed but payment recorded:', emailError)
      // Don't fail the webhook - payment is already confirmed
    }

    // Return success
    return res.status(200).json({ 
      success: true, 
      orderId: orderId,
      action: 'email_sent'
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message 
    })
  }
}
