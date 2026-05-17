# 🔧 Fix OAuth Error (localhost:64747)

## The Problem

You're seeing this OAuth URL:
```
https://accounts.google.com/v3/signin/accountchooser?...
redirect_uri=http://localhost:64747/oauth-callback
```

## What This Means

**This error is NOT from your NotebookLM application!**

Your app uses:
- ✅ Direct PostgreSQL connection (no OAuth needed)
- ✅ Simple Gemini API key (no OAuth needed)

The OAuth error is from:
- ❌ Google Cloud SDK (`gcloud` CLI)
- ❌ Google Cloud Code extension in VS Code
- ❌ Another Google development tool

---

## Quick Fixes

### Fix 1: Re-authenticate gcloud CLI

```bash
# Clear existing credentials
gcloud auth revoke

# Re-authenticate
gcloud auth login

# Set application default credentials
gcloud auth application-default login
```

### Fix 2: Check What's Using Port 64747

```bash
# Windows (PowerShell)
netstat -ano | findstr :64747

# Find the process ID (PID) and kill it
taskkill /PID <PID> /F
```

### Fix 3: Ignore It (If Not Using gcloud)

If you're not using `gcloud` commands, you can safely ignore this error. Your app will work fine.

---

## Deploy to Production (Vercel)

Your app doesn't need OAuth for production. Just set environment variables:

### Step 1: Go to Vercel Dashboard

1. Open your project: https://vercel.com/dashboard
2. Go to **Settings** → **Environment Variables**

### Step 2: Add These Variables

```
Variable Name: GOOGLE_API_KEY
Value: your_google_gemini_api_key_here
Environment: Production, Preview, Development

Variable Name: DATABASE_URL
Value: postgresql://postgres:OfficialGradeBench-2025@34.93.143.147:5432/postgres
Environment: Production, Preview, Development

Variable Name: NEXT_PUBLIC_API_URL
Value: https://your-project.vercel.app
Environment: Production, Preview, Development
```

### Step 3: Redeploy

```bash
# Push to GitHub (triggers auto-deploy)
git push origin main

# Or manual deploy
vercel deploy --prod
```

---

## Verify Production Works

### Test 1: Health Check

```bash
curl https://your-project.vercel.app/api/health
```

Expected:
```json
{"status":"ok","timestamp":"..."}
```

### Test 2: Upload Document

1. Go to https://your-project.vercel.app
2. Upload a PDF or TXT file
3. Should see: "Document uploaded! X chunks indexed."

### Test 3: Ask Question

1. Type a question about your document
2. Click Send
3. Should get an answer based on the document

---

## Still Getting OAuth Error?

### Check 1: Is it from your app or gcloud?

```bash
# Your app runs on port 3000
# OAuth error is on port 64747 (different!)

# Check what's running on 3000
netstat -ano | findstr :3000

# Check what's running on 64747
netstat -ano | findstr :64747
```

### Check 2: Disable Google Cloud Code Extension

If using VS Code:
1. Go to Extensions
2. Search "Google Cloud Code"
3. Click **Disable** or **Uninstall**
4. Restart VS Code

### Check 3: Use Service Account (Advanced)

For production deployments using gcloud:

```bash
# Create service account
gcloud iam service-accounts create notebook-lm \
  --display-name="NotebookLM Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:notebook-lm@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Create key
gcloud iam service-accounts keys create key.json \
  --iam-account=notebook-lm@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Use key
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/key.json"
```

---

## Summary

✅ **Your NotebookLM app does NOT need OAuth**
✅ **It uses direct PostgreSQL connection**
✅ **The OAuth error is from gcloud CLI or another tool**
✅ **You can deploy to Vercel without fixing the OAuth error**

Just set the 3 environment variables in Vercel and deploy!

---

## Need Help?

If you're still stuck, tell me:
1. When does the OAuth error appear? (during build, at runtime, or when running a command?)
2. What command triggers it?
3. Are you using `gcloud` commands?

I'll help you fix it! 🚀
