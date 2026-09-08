# 📧 Email Notifications Setup Guide

## Overview
QReady now sends automatic email notifications to customers when:
- ✅ Order is placed (Confirmation)
- ✅ Order is accepted by staff (Processing)
- ✅ Order is ready for pickup (Ready)
- ✅ Order is completed (Thank you)

## Setup Instructions

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **Sign Up** (it's FREE!)
3. Verify your email address

### Step 2: Add Email Service
1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended):
   - **Gmail**: Select Gmail and connect your Google account
   - **Outlook**: Select Outlook and sign in
   - **Other**: Select "Other" and configure SMTP
4. Give it a name like "QReady Notifications"
5. Click **Create Service**
6. **Copy the Service ID** (looks like `service_abc123`)

### Step 3: Create Email Templates

**Important**: The FREE plan only allows **2 email templates**. We'll create the 2 most important ones:
1. ✅ **Order Confirmation** - When customer places order
2. ✅ **Order Status Update** - For all status changes (Accepted, Ready, Completed)

---

#### Template 1: Order Confirmation ✉️
**Click "Create New Template" and enter:**
- **Template Name**: `Order Confirmation`
- **Template ID**: `template_order_confirm` *(important: use this exact ID)*
- **To Email**: `{{to_email}}`
- **From Name**: `QReady Print Services`
- **Subject**: `Order Confirmed - {{order_id}} | QReady`
- **Content**: (copy and paste this into the message box)

```
Hi {{customer_name}},

Thank you for your order! We've received your print request.

ORDER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order ID: {{order_id}}
Document: {{file_name}}
Paper Size: {{paper_size}}
Color Mode: {{color_mode}}
Sides: {{sides}}
Copies: {{copies}}
Binding: {{binding}}
Pages: {{pages}}
Total: {{total_price}}
Payment: {{payment_method}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your order is now in queue and will be processed shortly.
We'll notify you when there are updates!

Best regards,
QReady Campus Print Services
```

6. Click **Save**

---

#### Template 2: Order Status Update ✉️
**Click "Create New Template" again and enter:**
- **Template Name**: `Order Status Update`
- **Template ID**: `template_order_update` *(important: use this exact ID)*
- **To Email**: `{{to_email}}`
- **From Name**: `QReady Print Services`
- **Subject**: `Order Update: {{status}} - {{order_id}} | QReady`
- **Content**: (copy and paste this - it handles all status updates!)

```
Hi {{customer_name}},

Thank you for your order! We've received your print request.

ORDER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order ID: {{order_id}}
Document: {{file_name}}
Paper Size: {{paper_size}}
Color Mode: {{color_mode}}
Sides: {{sides}}
Copies: {{copies}}
Binding: {{binding}}
Pages: {{pages}}
Total: {{total_price}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your order is now in queue and will be processed shortly.
We'll notify you when it's ready for pickup!

```
Hi {{customer_name}},

{{status_message}}

ORDER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order ID: {{order_id}}
Document: {{file_name}}
Status: {{status}}
Total: {{total_price}}
Payment: {{payment_method}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{action_message}}

Best regards,
QReady Campus Print Services
```

6. Click **Save**

---

**✅ You should now have 2 templates created!**

Check your Email Templates list - you should see:
- Order Confirmation (template_order_confirm)
- Order Status Update (template_order_update)

---
1. In EmailJS dashboard, go to **Account** > **General**
2. Find **Public Key** section
3. Copy your Public Key (looks like `user_abc123xyz`)

### Step 5: Configure QReady

Open `src/emailService.js` and update these lines:

```javascript
const EMAIL_CONFIG = {
  serviceId: 'service_YOUR_ID',        // Paste your Service ID here
  publicKey: 'YOUR_PUBLIC_KEY',        // Paste your Public Key here
  templates: {
    orderConfirmation: 'template_order_confirm',
    orderUpdate: 'template_order_update',
  }
}
```

### Step 6: Test It!
1. Save the file
2. Refresh your browser
3. Place a test order with your real email
4. Check your inbox for the confirmation email!

## Troubleshooting

### Emails not sending?
- ✅ Check Service ID and Public Key are correct
- ✅ Make sure template IDs match exactly
- ✅ Open browser console (F12) and look for errors
- ✅ Check EmailJS dashboard for usage limits (free tier: 200 emails/month)

### Emails going to spam?
- ✅ Add your EmailJS email address to contacts
- ✅ Check spam folder and mark as "Not Spam"
- ✅ For production, upgrade EmailJS plan for better deliverability

### Template variables not showing?
- ✅ Make sure template variable names match exactly (case-sensitive!)
- ✅ Use double curly braces: `{{variable_name}}`

## Email Limits

**Free Plan:**
- 200 emails per month
- **2 email templates** ← This is why we'll use only 2 templates!
- 1 email service

**Paid Plans:**
- Starting at $7/month
- Unlimited emails
- Multiple services
- Custom domain

For production use with high volume, consider upgrading or using a dedicated email service like SendGrid or AWS SES.

## Support

- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS Support: support@emailjs.com

---

**That's it!** Your QReady system now has professional email notifications! 🎉
