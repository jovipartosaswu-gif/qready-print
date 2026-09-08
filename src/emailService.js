import emailjs from '@emailjs/browser'

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL SERVICE CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════
// 
// SETUP INSTRUCTIONS:
// 1. Go to https://www.emailjs.com/
// 2. Sign up for a free account
// 3. Add an email service (Gmail, Outlook, etc.)
// 4. Create email templates (see templates below)
// 5. Get your Public Key from Account > API Keys
// 6. Replace the values below with your actual keys
//
// ══════════════════════════════════════════════════════════════════════════════

const EMAIL_CONFIG = {
  serviceId: 'service_ieaxlwv',        // Replace with your EmailJS service ID
  publicKey: 'soKTUB2oHbjGVuTdc',        // Replace with your EmailJS public key
  templates: {
    orderConfirmation: 'template_order_confirm',   // Order placed confirmation
    orderUpdate: 'template_order_update',          // All status updates (Accepted, Ready, Completed)
  }
}

// Initialize EmailJS with public key
const initEmailJS = () => {
  if (EMAIL_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY') {
    emailjs.init(EMAIL_CONFIG.publicKey)
    return true
  }
  console.warn('EmailJS not configured. Set up your keys in src/emailService.js')
  return false
}

// Check if email service is configured
export const isEmailConfigured = () => {
  return EMAIL_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY' && 
         EMAIL_CONFIG.serviceId !== 'YOUR_SERVICE_ID'
}

/**
 * Send order confirmation email when order is placed
 */
export const sendOrderConfirmation = async (order) => {
  if (!initEmailJS()) return { success: false, error: 'Email not configured' }

  try {
    const templateParams = {
      to_email: order.email,
      customer_name: order.name,
      order_id: order.id,
      file_name: order.fileName,
      paper_size: order.paperSize,
      color_mode: order.colorMode,
      sides: order.sides,
      copies: order.copies,
      binding: order.binding,
      pages: order.pages,
      total_price: `PHP ${order.price}`,
      payment_method: order.paymentMethod || 'Cash',
      order_date: new Date().toLocaleString(),
    }

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templates.orderConfirmation,
      templateParams
    )

    console.log('✓ Order confirmation email sent:', response.status)
    return { success: true, response }
  } catch (error) {
    console.error('✗ Failed to send confirmation email:', error)
    return { success: false, error: error.text || error.message }
  }
}

/**
 * Send email when order status changes (Accepted, Ready, Completed)
 */
export const sendOrderStatusUpdate = async (order, status) => {
  if (!initEmailJS()) return { success: false, error: 'Email not configured' }

  // Dynamic messages based on status
  const statusMessages = {
    Accepted: {
      message: 'Great news! Your order has been accepted and is now being printed.',
      action: "We'll notify you when it's ready for pickup. Estimated time: 15-30 minutes."
    },
    Ready: {
      message: '🎉 Your order is ready for pickup!',
      action: "Please visit our print shop to collect your order. Don't forget to bring your Order ID!"
    },
    Completed: {
      message: 'Thank you for using QReady! Your order has been completed.',
      action: "We hope you're satisfied with our service. See you again soon!"
    }
  }

  const statusInfo = statusMessages[status] || {
    message: `Your order status has been updated to: ${status}`,
    action: 'Thank you for using QReady!'
  }

  try {
    const templateParams = {
      to_email: order.email,
      customer_name: order.name,
      order_id: order.id,
      file_name: order.fileName,
      status: status,
      status_message: statusInfo.message,
      action_message: statusInfo.action,
      total_price: `PHP ${order.price}`,
      payment_method: order.paymentMethod || 'Cash',
    }

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templates.orderUpdate,
      templateParams
    )

    console.log(`✓ Order ${status} email sent:`, response.status)
    return { success: true, response }
  } catch (error) {
    console.error(`✗ Failed to send ${status} email:`, error)
    return { success: false, error: error.text || error.message }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE EXAMPLES FOR EMAILJS
// ══════════════════════════════════════════════════════════════════════════════
//
// Create these templates in your EmailJS dashboard:
//
// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1: Order Confirmation (template_order_confirm)
// ────────────────────────────────────────────────────────────────────────────
// Subject: Order Confirmed - {{order_id}} | QReady
//
// Body:
// Hi {{customer_name}},
//
// Thank you for your order! We've received your print request.
//
// ORDER DETAILS:
// Order ID: {{order_id}}
// Document: {{file_name}}
// Paper Size: {{paper_size}}
// Color Mode: {{color_mode}}
// Sides: {{sides}}
// Copies: {{copies}}
// Binding: {{binding}}
// Pages: {{pages}}
// Total: {{total_price}}
//
// Your order is now in queue and will be processed shortly.
// We'll notify you when it's ready for pickup!
//
// Best regards,
// QReady Team
//
// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2: Order Accepted (template_order_accepted)
// ────────────────────────────────────────────────────────────────────────────
// Subject: Your Order is Being Printed - {{order_id}} | QReady
//
// Body:
// Hi {{customer_name}},
//
// Great news! Your order has been accepted and is now being printed.
//
// Order ID: {{order_id}}
// Document: {{file_name}}
// Estimated time: {{estimated_time}}
//
// We'll send you another email when your order is ready for pickup.
//
// Best regards,
// QReady Team
//
// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3: Order Ready (template_order_ready)
// ────────────────────────────────────────────────────────────────────────────
// Subject: Your Order is Ready for Pickup! - {{order_id}} | QReady
//
// Body:
// Hi {{customer_name}},
//
// 🎉 Your order is ready for pickup!
//
// Order ID: {{order_id}}
// Document: {{file_name}}
// Total: {{total_price}}
// Payment: {{payment_method}}
//
// Please visit our print shop to collect your order.
// Don't forget to bring your Order ID: {{order_id}}
//
// Best regards,
// QReady Team
//
// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4: Order Completed (template_order_completed)
// ────────────────────────────────────────────────────────────────────────────
// Subject: Thank You! Order {{order_id}} Completed | QReady
//
// Body:
// Hi {{customer_name}},
//
// Thank you for using QReady! Your order has been completed.
//
// Order ID: {{order_id}}
// Document: {{file_name}}
// Total: {{total_price}}
//
// We hope you're satisfied with our service.
// See you again soon!
//
// Best regards,
// QReady Team
//
// ══════════════════════════════════════════════════════════════════════════════
