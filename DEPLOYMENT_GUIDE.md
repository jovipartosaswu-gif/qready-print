# 🚀 QReady - Deployment Guide (Vercel)

This guide will help you deploy your QReady app to Vercel with automatic email notifications after payment.

---

## 📋 **Prerequisites**

✅ GitHub account (to push your code)  
✅ Vercel account (free - sign up at https://vercel.com)  
✅ Supabase configured  
✅ Xendit API keys  

---

## 🎯 **Step 1: Prepare Your Code**

### **1.1 Initialize Git Repository**

```bash
cd c:\Users\joeri\Documents\QReady
git init
git add .
git commit -m "Initial commit - QReady Print System"
```

### **1.2 Create GitHub Repository**

1. Go to https://github.com/new
2. Name: `qready-print-system`
3. Click **"Create repository"**
4. Copy the commands shown and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/qready-print-system.git
git branch -M main
git push -u origin main
```

---

## 🚀 **Step 2: Deploy to Vercel**

### **2.1 Sign Up for Vercel**

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Allow Vercel to access your repositories

### **2.2 Import Project**

1. Click **"Add New Project"**
2. Select **"Import Git Repository"**
3. Find `qready-print-system`
4. Click **"Import"**

### **2.3 Configure Project**

**Framework Preset:** Vite  
**Root Directory:** ./  
**Build Command:** `npm run build`  
**Output Directory:** `dist`

### **2.4 Add Environment Variables**

Click **"Environment Variables"** and add:

```
VITE_SUPABASE_URL=https://fkhggdraoqmtjnzxuyzt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_XENDIT_PUBLIC_KEY=xnd_public_development_bUzSDKlOGd5Jv4m7EVcY...
VITE_XENDIT_SECRET_KEY=xnd_development_6PW5GPsildweGu9RjUOM9MZj...
XENDIT_WEBHOOK_TOKEN=generate_random_token_here
```

**To generate webhook token:**
1. Go to https://www.uuidgenerator.net/
2. Copy the UUID
3. Paste as `XENDIT_WEBHOOK_TOKEN`

### **2.5 Deploy**

Click **"Deploy"**

Wait 2-3 minutes for deployment to complete.

---

## ⚙️ **Step 3: Configure Xendit Webhook**

Once deployed, you'll get a URL like: `https://qready-xxx.vercel.app`

### **3.1 Update Webhook URL**

1. Go to Xendit Dashboard: https://dashboard.xendit.co/settings/developers#webhooks
2. Find **"eWallet Payment Status"**
3. **Replace** the webhook.site URL with:
   ```
   https://qready-xxx.vercel.app/api/xendit-webhook
   ```
4. Click **"Test and save"**

### **3.2 Set Webhook Token in Xendit**

1. In Xendit, go to **Settings → Developers → Webhooks**
2. Click **"Callback Token"**
3. Paste the same `XENDIT_WEBHOOK_TOKEN` you used in Vercel
4. Save

---

## ✅ **Step 4: Test the Flow**

### **4.1 Test Cash Payment**
1. Visit your live app: `https://qready-xxx.vercel.app`
2. Place order → Choose "Cash"
3. ✉️ Email sent immediately

### **4.2 Test Online Payment**
1. Place order → Choose "GCash"
2. Complete test payment (use `09123456789`)
3. ⏱️ Wait 5-10 seconds
4. ✉️ Email sent automatically via webhook!

### **4.3 Check Logs**
- Go to Vercel Dashboard → Your Project → Functions → `api/xendit-webhook`
- View logs to see webhook activity

---

## 🔧 **Troubleshooting**

### **Webhook Not Working**

**Check 1: Webhook URL correct?**
```
https://qready-xxx.vercel.app/api/xendit-webhook
```

**Check 2: Token matches?**
- Vercel env: `XENDIT_WEBHOOK_TOKEN`
- Xendit callback token: Same value

**Check 3: View function logs**
- Vercel Dashboard → Functions → Click on `xendit-webhook`
- See if webhook is being received

### **Email Not Sending**

The webhook updates order status but email might fail if email service not configured.

**To add email:**
1. Sign up for SendGrid, Resend, or Postmark
2. Get API key
3. Add to Vercel environment variables
4. Update webhook function to use email service

---

## 📧 **Step 5: Configure Email Service (Optional)**

Currently the webhook logs email sending but doesn't actually send it. To enable:

### **Option A: Use Resend (Recommended)**

1. Sign up: https://resend.com/signup
2. Get API key
3. Add to Vercel env: `RESEND_API_KEY`
4. Install package:
   ```bash
   npm install resend
   ```
5. Update `api/xendit-webhook.js`:
   ```javascript
   import { Resend } from 'resend'
   
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   async function sendEmail(order) {
     await resend.emails.send({
       from: 'QReady <noreply@yourdomain.com>',
       to: order.email,
       subject: `Order Confirmation - ${order.id}`,
       html: `Your order ${order.id} has been confirmed...`
     })
   }
   ```

### **Option B: Use SendGrid**

Similar process with SendGrid API.

---

## 🎉 **You're Live!**

Your QReady app is now deployed with:
✅ Public URL accessible from anywhere  
✅ Automatic emails after online payment  
✅ Real-time order updates  
✅ Production-ready infrastructure  

**Share your URL:**
- Students: `https://qready-xxx.vercel.app`
- Staff login: `https://qready-xxx.vercel.app` → Login (admin/9999)

---

## 🔄 **Updating Your App**

To deploy updates:

```bash
git add .
git commit -m "Updated features"
git push
```

Vercel automatically redeploys on every push!

---

## 📊 **Monitoring**

**View activity:**
- Vercel Dashboard: Deployment logs, function logs
- Supabase Dashboard: Database records
- Xendit Dashboard: Payment transactions

---

## 🔐 **Security Checklist**

Before going live with real payments:

- [ ] Enable Supabase RLS (Row Level Security)
- [ ] Use LIVE Xendit keys (not TEST)
- [ ] Configure custom domain
- [ ] Set up SSL certificate (automatic with Vercel)
- [ ] Review webhook token security
- [ ] Test all payment flows thoroughly

---

Need help? Check the logs or reach out! 🚀
