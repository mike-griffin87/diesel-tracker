# 🔧 Setup Instructions - Fix Your Diesel Tracker

## ⚠️ Root Cause Identified

Both issues (cron job failing + empty garage dropdown) are caused by **missing environment variables**.

---

## 📝 Step 1: Create `.env.local` File

1. **Get your Supabase credentials:**
   - Go to: https://app.supabase.com
   - Open your diesel-tracker project
   - Click **Settings** (gear icon) → **API**
   - Copy these two values:
     - **Project URL** (under "Project URL")
     - **service_role** key (under "Project API keys" - click to reveal)

2. **Create the file:**
   In this directory, create a new file named `.env.local` with this content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Replace the placeholder values with your actual credentials.

---

## 📝 Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your diesel-tracker project
   - Go to **Settings** → **Environment Variables**

2. **Add these variables:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
     - Value: (same as in .env.local)
     - Environment: **Production** ✓
   
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
     - Value: (same as in .env.local)
     - Environment: **Production** ✓

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click ⋯ (three dots) on latest deployment
   - Click **Redeploy**

---

## 📝 Step 3: (Optional) Set Up Failure Alerts

To get notified if the keepalive cron fails:

### Option A: Discord (Recommended - Free)

1. In Discord, create or use a server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Copy the webhook URL
5. Add to `.env.local`:
   ```env
   KEEPALIVE_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```
6. Add the same variable to Vercel (Step 2)

### Option B: Slack

1. Create an incoming webhook in Slack
2. Add to `.env.local` and Vercel:
   ```env
   KEEPALIVE_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

---

## ✅ Step 4: Test Everything

1. **Restart your dev server:**
   ```powershell
   npm run dev
   ```

2. **Test the keepalive endpoint:**
   ```powershell
   node test-keepalive.mjs
   ```
   
   You should see: `✅ SUCCESS: Keepalive endpoint is working!`

3. **Test the garage dropdown:**
   - Open http://localhost:3000/new
   - The "Garage" dropdown should now show station names

---

## 🎯 What Got Fixed

✅ **Cron job frequency:** Increased from daily to every 6 hours
✅ **Error alerts:** Added webhook notifications on failure
✅ **Better logging:** Console logs for debugging in Vercel
✅ **Garage dropdown:** Fixed to properly fetch stations from database
✅ **Test script:** Created for easy verification

---

## 🔍 Verify Cron Job is Working (After Deployment)

1. Wait 6 hours OR check immediately in Vercel:
   - Go to **Deployments** → **Functions** → Filter logs by `/api/keepalive`
   - You should see logs like: `[timestamp] Keepalive: Success ✓`

2. If you set up alerts, you'll get Discord/Slack messages on failures

---

## ❓ Troubleshooting

**Still seeing empty garage dropdown?**
- Make sure you have some data in your `fills` table with `station_name` values

**Test script still failing?**
- Verify `.env.local` file exists in the project root
- Check that the values are correct (no extra spaces, quotes, etc.)
- Restart the dev server after creating/editing `.env.local`

**Cron still not working in production?**
- Verify environment variables are set in Vercel for **Production** environment
- Redeploy after adding variables
- Check Vercel logs for error messages

---

Need help? The test script will give specific error messages to guide you!
