# 📧 Payment Webhook & Email Integration Guide

## Current Email Behavior

✅ **Cash Payments**: Email sent immediately after order is placed  
⏳ **Online Payments (GCash/Maya)**: Email sent AFTER successful payment

---

## How Payment Webhooks Work

When a customer completes payment via GCash/Maya:

1. **Customer pays** on Xendit checkout page
2. **Xendit sends webhook** to your server with payment status
3. **Your server receives** payment confirmation
4. **Email is sent** to customer with order details
5. **Order status updated** to "Paid" or "Accepted"

---

## 🚧 **Current Setup: Manual Email After Payment**

Since webhooks require a **backend server**, and your app is currently frontend-only, here's what happens now:

### **For Cash Payments:**
✅ Email sent immediately when order is placed

### **For Online Payments:**
⏳ Email NOT sent automatically (requires webhook setup)
- Customer pays on Xendit
- Order is created but no email sent yet
- **Manual workaround**: Staff can manually verify payment in Xendit dashboard
- Staff advances order status → triggers email notification

---

## 🔧 **Option 1: Add Backend for Webhooks** (Recommended for Production)

To automatically send emails after successful payment, you need a backend API endpoint.

### **Quick Setup with Vercel Serverless Functions:**

1. **Create API endpoint** at `/api/xendit-webhook.js`:

```javascript
// api/xendit-webhook.js
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmation } from '../src/emailService'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const webhookData = req.body
    
    // Verify webhook is from Xendit (check X-CALLBACK-TOKEN header)
    const callbackToken = req.headers['x-callback-token']
    if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Invalid webhook token' })
    }

    // Check if payment is successful
    if (webhookData.status === 'SUCCEEDED') {
      const orderId = webhookData.reference_id
      
      // Get order from Supabase
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
      
      if (order) {
        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'Accepted' })
          .eq('id', orderId)
        
        // Send confirmation email
        await sendOrderConfirmation(order)
      }
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
```

2. **Update webhook URL in Xendit**:
   - Change from `https://webhook.site/...`
   - To: `https://your-app.vercel.app/api/xendit-webhook`

3. **Add webhook verification token** to `.env`:
```env
XENDIT_WEBHOOK_TOKEN=your_verification_token_here
```

---

## 🎯 **Option 2: Current Workaround** (Simple, No Backend Needed)

For now, since you don't have a backend:

### **How it works:**

1. **Customer places online payment order**
   - Order created in Supabase
   - No email sent yet
   - Customer sees: "Complete payment to receive confirmation"

2. **Customer completes payment on Xendit**
   - Payment successful
   - Xendit webhook goes to webhook.site (test URL)
   - **No automatic email** (webhook.site doesn't process it)

3. **Staff checks payment manually**
   - Login to Staff Dashboard
   - See order in "Pending" status
   - Check Xendit dashboard to verify payment
   - Click "Mark Accepted" → **Email sent automatically**

### **Pros:**
✅ No backend needed  
✅ Works immediately  
✅ Simple to understand  

### **Cons:**
❌ Manual verification required  
❌ Email delayed until staff confirms  
❌ Not fully automated  

---

## 📊 **Option 3: Use Xendit Payment Links** (Alternative)

Instead of redirect-based checkout, use payment links that handle email notifications:

```javascript
// In xenditService.js
export async function createPaymentLink(order) {
  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(XENDIT_SECRET_KEY + ':')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      external_id: order.id,
      amount: parseFloat(order.price),
      description: `QReady Order - ${order.fileName}`,
      customer: {
        given_names: order.name,
        email: order.email
      },
      success_redirect_url: window.location.origin + '/payment-success',
      failure_redirect_url: window.location.origin + '/payment-failed'
    })
  })
  
  const invoice = await response.json()
  return invoice.invoice_url
}
```

**Benefits:**
- Xendit sends their own receipt email
- Customer gets immediate confirmation
- No webhook needed

---

## 🚀 **Recommended Path Forward**

### **For Development/Testing (Now):**
Use **Option 2** (Manual verification)
- Simple, works immediately
- Staff verifies and sends email

### **For Production (Later):**
Use **Option 1** (Webhook + Backend)
- Fully automated
- Professional experience
- Deploy with Vercel Functions

---

## 📝 **Next Steps**

1. **Test current setup**:
   - Place cash order → Email sent immediately ✅
   - Place online order → No email until staff confirms ⏳

2. **Choose your path**:
   - Keep manual (simple) 
   - Add webhook backend (automated)
   - Use payment links (alternative)

3. **Deploy to production**:
   - Set up Vercel account
   - Add email service (SendGrid, Resend, etc.)
   - Configure webhook endpoint

---

## ❓ **FAQ**

**Q: Can I test email without backend?**  
A: Yes! Use cash payments - email works immediately.

**Q: Will customers get confused?**  
A: Add clear message: "You'll receive confirmation email after payment is verified"

**Q: How long until staff confirms?**  
A: Usually instant if staff is monitoring. Can be automated with webhook.

**Q: Is manual verification secure?**  
A: Yes! Staff verifies in Xendit dashboard before accepting order.

---

Need help setting up webhooks? Let me know and I'll guide you through adding a backend API!
