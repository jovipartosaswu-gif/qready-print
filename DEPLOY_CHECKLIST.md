# ✅ Vercel Deployment Checklist

## 📋 Pre-Deployment (DONE ✅)

- [x] Git repository initialized
- [x] Code committed
- [x] Webhook backend created (`api/xendit-webhook.js`)
- [x] `.gitignore` configured (protects `.env`)
- [x] `vercel.json` created

---

## 🚀 Deployment Steps

### **Step 1: Sign Up for Vercel**

1. Go to: https://vercel.com/signup
2. Sign up with email or GitHub
3. Verify your email

---

### **Step 2: Create GitHub Repository (Easiest Method)**

1. Go to: https://github.com/new
2. Repository name: `qready-print-system`
3. **Leave everything else default** (don't check README, gitignore, license)
4. Click **"Create repository"**

5. **Copy the commands** shown on the next page
6. Run them in PowerShell:

```powershell
cd c:\Users\joeri\Documents\QReady
git remote add origin https://github.com/YOUR_USERNAME/qready-print-system.git
git branch -M main  
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username!

---

### **Step 3: Import to Vercel**

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Find `qready-print-system` in the list
5. Click **"Import"**

---

### **Step 4: Configure Build Settings**

Vercel should auto-detect Vite. Verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

### **Step 5: Add Environment Variables** ⚠️ IMPORTANT

Click **"Environment Variables"** and add these **ONE BY ONE**:

#### **Supabase Variables:**
```
Name: VITE_SUPABASE_URL
Value: https://fkhggdraoqmtjnzxuyzt.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraGdnZHJhb3FtdGpuenh1eXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDQzMTksImV4cCI6MjEwNDI4MDMxOX0.RffbZkfbrH7utyVxwyDllfawRf3a6wUu2Fszg7YDhcc
```

#### **Xendit Variables:**
```
Name: VITE_XENDIT_PUBLIC_KEY
Value: xnd_public_development_bUzSDKlOGd5Jv4m7EVcY_HQC1lKJlqJr7mC0jj7oMv2PfgIJODcm_XLSIY97C
```

```
Name: VITE_XENDIT_SECRET_KEY
Value: xnd_development_6PW5GPsildweGu9RjUOM9MZjbEUUiG1SZEfM60KMPWdrSiVTwkewD6zFEcjq9
```

#### **Webhook Token (Generate New):**
```
Name: XENDIT_WEBHOOK_TOKEN
Value: [Go to https://www.uuidgenerator.net/ and copy a UUID]
```

**Example webhook token:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

### **Step 6: Deploy!**

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. ✅ You'll get a URL like: `https://qready-print-system.vercel.app`

---

### **Step 7: Update Xendit Webhook URL**

1. Copy your new Vercel URL (e.g., `https://qready-print-system.vercel.app`)
2. Go to Xendit Dashboard: https://dashboard.xendit.co/settings/developers#webhooks
3. Find **"eWallet Payment Status"**
4. Replace the webhook.site URL with:
   ```
   https://qready-print-system.vercel.app/api/xendit-webhook
   ```
5. Click **"Test and save"**

---

### **Step 8: Set Callback Token in Xendit**

1. In Xendit, click **"Callback Token"** or **"Verification Token"**
2. Paste the **same UUID** you used in `XENDIT_WEBHOOK_TOKEN`
3. Save

---

## 🧪 **Step 9: Test Your Live App!**

### **Test 1: Visit Your App**
1. Go to your Vercel URL: `https://qready-print-system.vercel.app`
2. Should see QReady homepage ✅

### **Test 2: Cash Payment**
1. Click "Place Order"
2. Fill form
3. Choose "Cash"
4. Submit
5. ✉️ Email should be sent immediately (if email service configured)

### **Test 3: Online Payment** 🎉
1. Click "Place Order"
2. Fill form  
3. Choose "GCash"
4. Complete payment (use test number: 09123456789)
5. Wait 10 seconds
6. ✉️ Email should arrive automatically! 🎊

---

## 🔍 **Troubleshooting**

### **Deploy Failed?**
- Check build logs in Vercel
- Make sure all environment variables are added
- Try redeploying

### **Page Shows 404?**
- Check if `vercel.json` was included
- Verify output directory is `dist`
- Check deployment logs

### **Webhook Not Working?**
- View logs: Vercel Dashboard → Functions → `xendit-webhook`
- Check if webhook URL is correct
- Verify callback token matches in both places

### **Email Not Sending?**
- Webhook might be working but email service not configured
- Check function logs for errors
- Order status should still update to "Accepted"

---

## 📊 **After Deployment**

### **View Your Live App:**
```
https://qready-print-system.vercel.app
```

### **Staff Login:**
- Username: `admin`
- PIN: `9999`

### **Check Logs:**
- Vercel Dashboard → Your Project → Deployments → Click latest → View Function Logs

---

## 🎉 **Success Checklist**

Once deployed, verify:

- [ ] App loads at your Vercel URL
- [ ] Can place cash order
- [ ] Can place online order (GCash/Maya)
- [ ] Webhook receives payment notifications (check logs)
- [ ] Order status updates to "Accepted" after payment
- [ ] Staff dashboard shows orders
- [ ] Admin dashboard works

---

## 📝 **Your Deployment Info**

Fill this in after deployment:

**Vercel URL:** `_______________________________`

**GitHub Repo:** `_______________________________`

**Webhook Token (save securely):** `_______________________________`

**Deployed Date:** `_______________________________`

---

## 🔄 **Updating Your App**

After deployment, to update:

```powershell
cd c:\Users\joeri\Documents\QReady
git add .
git commit -m "Updated feature"
git push
```

Vercel auto-redeploys on every push! 🚀

---

## ❓ **Need Help?**

- Vercel Support: https://vercel.com/support
- Vercel Docs: https://vercel.com/docs
- Check deployment logs for errors

---

**Good luck with your deployment! 🎊**
