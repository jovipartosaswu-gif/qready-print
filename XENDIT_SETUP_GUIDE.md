# 🚀 Xendit Payment Integration Guide

## Why Xendit?

✅ **No business verification required** for Test Mode  
✅ **Easier signup** - just email + phone  
✅ **Supports GCash & Maya** (PayMaya)  
✅ **Filipino-friendly** payment gateway  
✅ **Test mode works immediately**

---

## Step 1: Sign Up for Xendit

1. Go to: https://dashboard.xendit.co/register
2. Fill in:
   - Email address
   - Password
   - Phone number
3. Verify your email
4. You're in! You'll start in **Test Mode** automatically

---

## Step 2: Get Your API Keys

1. Log in to Xendit Dashboard: https://dashboard.xendit.co
2. Click **Settings** (gear icon) in the sidebar
3. Go to **"Developers" → "API Keys"**
4. You'll see two keys:
   - **Public Key**: `xnd_public_test_...` (for frontend)
   - **Secret Key**: `xnd_test_...` (click "Show" to reveal)
5. **Copy both keys**

---

## Step 3: Add Keys to Your `.env` File

1. Open `c:\Users\joeri\Documents\QReady\.env`
2. Find the Xendit section
3. Replace the placeholder values:

```env
VITE_XENDIT_PUBLIC_KEY=xnd_public_test_YOUR_KEY_HERE
VITE_XENDIT_SECRET_KEY=xnd_test_YOUR_KEY_HERE
```

**Example:**
```env
VITE_XENDIT_PUBLIC_KEY=xnd_public_test_abcd1234efgh5678
VITE_XENDIT_SECRET_KEY=xnd_test_xyz9876abc5432
```

⚠️ **Important**: Don't commit `.env` to git! It's already in `.gitignore`.

---

## Step 4: Restart the Dev Server

1. Stop the current server: **Ctrl + C** in terminal
2. Start it again: `npm run dev`
3. Open: http://localhost:5174

---

## Step 5: Test Payment Flow

### **Test with Cash (Always works)**
1. Place Order → Select "Pay at Counter"
2. Order saved to Supabase ✅

### **Test with GCash/Maya (After adding keys)**
1. Place Order → Select "Online Payment" → Choose GCash or Maya
2. Click "Proceed to Payment"
3. You'll be redirected to Xendit checkout page
4. Use Xendit test credentials to complete payment

---

## Xendit Test Credentials

When testing GCash/Maya payments in Test Mode, use these:

### **GCash Test Numbers**
- **Success**: Use mobile number `09123456789`
- **Failed**: Use mobile number `09111111111`

### **Maya Test Cards**
- **Success**: `4123450131000508`
- **Failed**: `5200000000000007`

---

## Payment Methods Supported

| Method | Code | Status |
|--------|------|--------|
| 💙 **GCash** | `GCASH` | ✅ Available |
| 💚 **Maya** | `PAYMAYA` | ✅ Available |
| 🏦 **Bank Transfer** | `BPI`, `BDO`, etc. | 🔄 Can add later |
| 💳 **Credit Card** | `CARD` | 🔄 Can add later |

---

## Going Live (Production)

When ready to accept real payments:

1. **Complete Business Verification** in Xendit Dashboard
   - Submit business documents (DTI/SEC registration)
   - Verify bank account
   - Wait for approval (usually 3-5 days)

2. **Switch to Live Keys**
   - Get Live keys from Xendit Dashboard
   - Replace TEST keys with LIVE keys in `.env`
   - Deploy to production

3. **Update Redirect URLs**
   - Update success/failure URLs to your production domain
   - Test thoroughly before going live

---

## Troubleshooting

### "Payment Integration not configured"
- ✅ Check if keys are in `.env` file
- ✅ Make sure keys don't have quotes or spaces
- ✅ Restart dev server after adding keys
- ✅ Check browser console for errors

### "Invalid API key"
- ❌ You might be using LIVE keys in Test Mode
- ✅ Use TEST keys (starts with `xnd_test_...`)
- ✅ Copy keys exactly as shown in Xendit Dashboard

### Payment not redirecting
- ✅ Check if checkout URL is returned
- ✅ Check browser console for JavaScript errors
- ✅ Make sure you're not blocking popups

---

## Security Best Practices

🔒 **Never commit `.env` to git**  
🔒 **Use environment variables for production**  
🔒 **Don't expose secret keys in frontend code**  
🔒 **Use HTTPS in production**  
🔒 **Validate webhooks with signatures**

---

## Next Steps

- [ ] Add Xendit API keys to `.env`
- [ ] Restart dev server
- [ ] Test GCash payment flow
- [ ] Test Maya payment flow
- [ ] Deploy to production
- [ ] Complete business verification
- [ ] Switch to Live Mode

---

## Resources

- 📘 Xendit Documentation: https://developers.xendit.co/api-reference
- 💬 Xendit Support: support@xendit.co
- 🎓 Xendit Academy: https://www.xendit.co/en-ph/academy/

---

**Need help?** Check the browser console (F12) for error messages or contact Xendit support.
