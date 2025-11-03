# Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Client Onboarding Portal to Vercel.

## Pre-Deployment Checklist

### ✅ Completed Verifications
- [x] Project structure verified - all Next.js directories in place
- [x] Database migrations verified - 3 migrations ready to run
- [x] Next.js configuration verified - ready for Vercel
- [x] Authentication setup verified - middleware and Supabase clients configured
- [x] Build configuration verified - package.json and .gitignore properly configured

### ❌ Required Actions Before Deployment

**CRITICAL: Two environment variables are missing and must be set before deployment:**

1. **SUPABASE_JWT_SECRET** - Required for JWT token validation
2. **SUPABASE_SECRET_PASSPHRASE** - Required for encrypting secrets in database (minimum 16 characters)

---

## Step 1: Set Missing Environment Variables

### 1.1 Get SUPABASE_JWT_SECRET

**Where to find it:**
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project: `bnttpjowaxmhknvpitnn`
3. Navigate to **Settings** (gear icon in sidebar)
4. Click **API** in the settings menu
5. Scroll to the **JWT Settings** section
6. Copy the value labeled **JWT Secret**

**How to set it:**
```bash
# Add to .env.local (for local development)
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

### 1.2 Generate SUPABASE_SECRET_PASSPHRASE

**Requirements:**
- Minimum 16 characters
- Use strong random string
- Should include letters, numbers, and special characters

**How to generate (choose one method):**

**Option A - Using PowerShell:**
```powershell
# Generate 32-character random string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option B - Using online generator:**
1. Visit: https://passwordsgenerator.net/
2. Set length to 32 characters
3. Enable: Letters (upper+lower), Numbers, Symbols
4. Generate and copy

**Option C - Using Node.js:**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

**How to set it:**
```bash
# Add to .env.local (for local development)
SUPABASE_SECRET_PASSPHRASE=your-generated-passphrase-here
```

### 1.3 Complete .env.local File

After setting both values, your `.env.local` should look like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bnttpjowaxmhknvpitnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudHRwam93YXhtaGtudnBpdG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTA1ODYsImV4cCI6MjA3NzY2NjU4Nn0.MSF0vaf8j_Y8WapuSteguyZcrPwRMQX4Esy5-Uk0eso
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudHRwam93YXhtaGtudnBpdG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA5MDU4NiwiZXhwIjoyMDc3NjY2NTg2fQ.oTKt4oXryDavpsitcsA7rEAvN0O9qCg6nQQijXdONEg
SUPABASE_JWT_SECRET=<your-jwt-secret-from-step-1.1>
SITE_URL=http://localhost:3000
SUPABASE_SECRET_PASSPHRASE=<your-generated-passphrase-from-step-1.2>
```

---

## Step 2: Verify Supabase Database Setup

### 2.1 Confirm Migrations Are Applied

**Check if migrations have run:**
1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query:
```sql
SELECT * FROM public.companies LIMIT 1;
```
3. If the query succeeds (even with no results), migrations are applied ✅
4. If you get "relation does not exist" error, migrations need to be run ❌

**How to run migrations if needed:**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref bnttpjowaxmhknvpitnn

# Push migrations to database
supabase db push
```

### 2.2 Verify Google OAuth Configuration

**Check OAuth settings:**
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Verify **Google** provider is enabled ✅
3. Confirm redirect URLs include:
   - `http://localhost:3000` (for local development)
   - Your Vercel deployment URL (will be added after first deploy)

**Note:** You'll need to add the Vercel URL to allowed redirect URLs after deployment.

---

## Step 3: Deploy to Vercel

### 3.1 Prerequisites

**Required:**
- GitHub account with repository access
- Vercel account (free tier is sufficient)
- Code pushed to GitHub repository

**Initialize Git repository if needed:**
```bash
cd "C:\Users\johan\Desktop\Created Software\Client Onboarding\onboarding-app"
git init
git add .
git commit -m "Initial commit - client onboarding portal"
```

**Create GitHub repository and push:**
```bash
# Create repository on GitHub first, then:
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### 3.2 Import Project to Vercel

1. **Go to Vercel:** https://vercel.com/new
2. **Import Git Repository:**
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `next build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

### 3.3 Set Environment Variables in Vercel

**CRITICAL: You must set these environment variables in Vercel:**

1. Click **Environment Variables** section during import (or go to Project Settings → Environment Variables after)

2. **Add each variable for Production environment:**

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://bnttpjowaxmhknvpitnn.supabase.co` | Production |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production |
   | `SUPABASE_JWT_SECRET` | *from Step 1.1* | Production |
   | `SUPABASE_SECRET_PASSPHRASE` | *from Step 1.2* | Production |
   | `SITE_URL` | *leave blank initially* | Production |

3. **For `SITE_URL`:**
   - Leave blank for first deployment
   - After deployment, update it to your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Redeploy to apply the change

**Important Notes:**
- ⚠️ **DO NOT commit** `.env.local` to Git - it's excluded by `.gitignore`
- ✅ `.gitignore` properly excludes all `.env*` files (verified in line 34)
- ✅ Vercel environment variables are encrypted and secure

### 3.4 Deploy

1. Click **Deploy** button
2. Wait for build to complete (typically 2-3 minutes)
3. Monitor build logs for any errors

**Expected build output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    [size]   [size]
└ ○ /app/...                             [size]   [size]

○  (Static)  automatically rendered as static HTML
```

---

## Step 4: Post-Deployment Configuration

### 4.1 Update SITE_URL

1. Copy your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
2. Go to Vercel Project → **Settings** → **Environment Variables**
3. Find `SITE_URL` and update to your Vercel URL
4. Click **Save**
5. Trigger redeploy: **Deployments** → **…** → **Redeploy**

### 4.2 Update Supabase Redirect URLs

**Add Vercel URL to allowed OAuth redirects:**
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```
3. Add to **Site URL** (optional):
   ```
   https://your-app.vercel.app
   ```
4. Click **Save**

### 4.3 Update Google OAuth Console

**If using custom Google OAuth app:**
1. Go to Google Cloud Console → **APIs & Services** → **Credentials**
2. Select your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://bnttpjowaxmhknvpitnn.supabase.co/auth/v1/callback
   https://your-app.vercel.app/auth/callback
   ```
4. Click **Save**

---

## Step 5: Post-Deployment Validation

### 5.1 Test Authentication Flow

1. **Visit your Vercel URL:** `https://your-app.vercel.app`
2. **Click "Sign in with Google"**
3. **Verify:**
   - ✅ Google OAuth consent screen appears
   - ✅ After authorization, redirected to `/app`
   - ✅ User session is maintained (refresh page stays logged in)
   - ✅ Logout works correctly

**If authentication fails:**
- Check Vercel logs: **Deployments** → Click deployment → **Function Logs**
- Verify `SUPABASE_JWT_SECRET` is set correctly
- Confirm redirect URLs match in Supabase and Google OAuth

### 5.2 Test Database Connectivity

1. **Create a test company:**
   - Navigate to intake wizard: `/app/intake`
   - Fill out company basics form
   - Submit and verify data saves

2. **Verify in Supabase:**
   ```sql
   SELECT * FROM public.companies ORDER BY created_at DESC LIMIT 1;
   ```
   - Should show your test company ✅

**If database operations fail:**
- Check Vercel logs for SQL errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Confirm migrations are applied (Step 2.1)

### 5.3 Test Secrets Functionality

1. **Navigate to secrets management:** `/app/console/secrets`
2. **Create a test secret**
3. **Verify:**
   - ✅ Secret creation succeeds
   - ✅ Encrypted value stored (check `secrets` table)
   - ✅ Decryption works when viewing secret

**If secrets fail:**
- Verify `SUPABASE_SECRET_PASSPHRASE` is set and matches Step 1.2
- Check function logs for encryption errors
- Confirm `pgcrypto` extension is enabled in Supabase

### 5.4 Test File Uploads

1. **Navigate to a form with file upload**
2. **Upload a test file**
3. **Verify in Supabase Storage:**
   - Go to **Storage** → `company-assets` bucket
   - Confirm file appears ✅

**If uploads fail:**
- Check Supabase Storage policies are correct
- Verify bucket `company-assets` exists
- Check Vercel function logs for errors

### 5.5 Monitor Application Logs

**Check for runtime errors:**
1. Vercel Dashboard → **Deployments** → Click latest → **Function Logs**
2. Look for:
   - ❌ Uncaught exceptions
   - ❌ Database connection errors
   - ❌ Authentication failures
   - ✅ Normal request/response logs

---

## Step 6: Troubleshooting

### 6.1 Build Failures

**Error: "Module not found"**
- **Cause:** Missing dependency
- **Fix:** Verify `package.json` includes all imports
- **Command:** `npm install <missing-package>`

**Error: "Type errors"**
- **Cause:** TypeScript compilation failure
- **Fix:** Run `npm run build` locally to see full error
- **Check:** `tsconfig.json` configuration (verified in src/env/server.ts:16)

**Error: "Environment variable required"**
- **Cause:** Missing environment variable in Vercel
- **Fix:** Go to Project Settings → Environment Variables and add missing variable
- **Note:** Redeploy after adding variables

### 6.2 Authentication Issues

**Error: "Invalid JWT"**
- **Cause:** `SUPABASE_JWT_SECRET` is incorrect or missing
- **Fix:** Get correct JWT secret from Supabase Dashboard (Step 1.1)
- **Verify:** Secret must be from **Settings** → **API** → **JWT Settings**

**Error: "Redirect URI mismatch"**
- **Cause:** Vercel URL not in Supabase allowed redirects
- **Fix:** Add `https://your-app.vercel.app/auth/callback` to Supabase (Step 4.2)

**Error: "Session not persisting"**
- **Cause:** Cookie configuration issue
- **Fix:** Verify `SITE_URL` is set to Vercel URL (Step 4.1)
- **Check:** Middleware is running (middleware.ts:57 verified)

### 6.3 Database Connection Errors

**Error: "relation does not exist"**
- **Cause:** Migrations not applied
- **Fix:** Run migrations (Step 2.1)
- **Command:** `supabase db push`

**Error: "RLS policy violation"**
- **Cause:** Row Level Security blocking access
- **Fix:** Verify user is authenticated and is_member() function works
- **Check:** Policies in supabase/migrations/0002_policies.sql:7

**Error: "Permission denied for table"**
- **Cause:** Service role key incorrect or missing
- **Fix:** Verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables

### 6.4 Secrets Encryption Errors

**Error: "pgp_sym_encrypt failed"**
- **Cause:** `SUPABASE_SECRET_PASSPHRASE` is missing, too short, or incorrect
- **Fix:** Generate new passphrase (Step 1.2, minimum 16 characters)
- **Verify:** Same passphrase used for encrypt and decrypt

**Error: "pgp_sym_decrypt failed: Wrong key or corrupt data"**
- **Cause:** Passphrase changed or doesn't match encryption passphrase
- **Fix:** Use original passphrase or re-encrypt all secrets with new passphrase
- **Warning:** Changing passphrase makes old secrets unreadable

### 6.5 File Upload Issues

**Error: "Storage bucket not found"**
- **Cause:** `company-assets` bucket doesn't exist
- **Fix:** Create bucket in Supabase Dashboard → **Storage** → **New bucket**
- **Config:** Name: `company-assets`, Public: false

**Error: "Storage policy denied"**
- **Cause:** RLS policies on storage bucket are too restrictive
- **Fix:** Review storage policies and ensure authenticated users can upload

---

## Environment Variables Reference

### All Required Environment Variables

| Variable | Type | Description | Where to Get |
|----------|------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service role key | Supabase Dashboard → Settings → API |
| `SUPABASE_JWT_SECRET` | Secret | JWT signing secret | Supabase Dashboard → Settings → API → JWT Settings |
| `SUPABASE_SECRET_PASSPHRASE` | Secret | Encryption passphrase | Generate (Step 1.2) |
| `SITE_URL` | Public | Production URL | Your Vercel deployment URL |

### Which Variables Go Where

**Local Development (`.env.local`):**
- All 6 variables above
- Never commit this file (excluded by .gitignore:34)

**Vercel Production:**
- All 6 variables set in Project Settings → Environment Variables
- Encrypted at rest by Vercel

**Security Notes:**
- ✅ `.gitignore` excludes all `.env*` files (verified)
- ✅ Service role key only used in server components/actions
- ✅ Secrets encrypted before storage (supabase/migrations/0003_secret_helpers.sql:27)
- ✅ JWT secret validated on each request (src/env/server.ts:5)

---

## Deployment Checklist Summary

### Before First Deployment
- [ ] Set `SUPABASE_JWT_SECRET` in `.env.local` (Step 1.1)
- [ ] Generate and set `SUPABASE_SECRET_PASSPHRASE` in `.env.local` (Step 1.2)
- [ ] Verify Supabase migrations are applied (Step 2.1)
- [ ] Verify Google OAuth is configured (Step 2.2)
- [ ] Push code to GitHub repository (Step 3.1)

### During Vercel Deployment
- [ ] Import project from GitHub (Step 3.2)
- [ ] Set all 6 environment variables in Vercel (Step 3.3)
- [ ] Leave `SITE_URL` blank initially (update after deploy)
- [ ] Click Deploy and monitor build logs (Step 3.4)

### After First Deployment
- [ ] Update `SITE_URL` to Vercel URL (Step 4.1)
- [ ] Add Vercel URL to Supabase redirect URLs (Step 4.2)
- [ ] Update Google OAuth allowed redirects (Step 4.3)
- [ ] Redeploy to apply `SITE_URL` change

### Validation Tests
- [ ] Test Google OAuth login flow (Step 5.1)
- [ ] Create test company and verify database save (Step 5.2)
- [ ] Test secret creation and decryption (Step 5.3)
- [ ] Upload test file and verify storage (Step 5.4)
- [ ] Review function logs for errors (Step 5.5)

---

## Additional Resources

### Documentation
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Environment Variables:** https://vercel.com/docs/environment-variables
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Supabase Storage:** https://supabase.com/docs/guides/storage

### Project Files
- **Migration Scripts:** `supabase/migrations/` (3 files verified)
- **Environment Schema:** `src/env/server.ts` and `src/env/client.ts`
- **Auth Middleware:** `middleware.ts` (route protection at root:57)
- **Supabase Clients:** `src/lib/supabase/` (client.ts and server.ts)

### Support
- **Next.js Discord:** https://discord.gg/nextjs
- **Supabase Discord:** https://discord.supabase.com
- **Vercel Support:** https://vercel.com/support

---

## Conclusion

Your application is **ready for deployment** after completing Step 1 (setting the 2 missing environment variables).

**Current Status:**
- ✅ All code verified and ready
- ✅ All configurations validated
- ✅ Database migrations prepared
- ✅ Build configuration confirmed
- ✅ Security exclusions verified (.gitignore)

**Remaining Blockers:**
- ❌ `SUPABASE_JWT_SECRET` - Must be set (Step 1.1)
- ❌ `SUPABASE_SECRET_PASSPHRASE` - Must be generated (Step 1.2)

**Once these 2 variables are set, you can deploy immediately.**

Good luck with your deployment! 🚀
