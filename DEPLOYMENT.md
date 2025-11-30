# AutoShorts Deployment Guide

This guide will walk you through deploying AutoShorts to Vercel with all necessary environment variables and configurations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Redis Setup](#redis-setup)
4. [Google OAuth Setup](#google-oauth-setup)
5. [YouTube API Setup](#youtube-api-setup)
6. [Stripe Setup](#stripe-setup)
7. [PayPal Setup](#paypal-setup)
8. [Environment Variables Setup](#environment-variables-setup)
9. [Vercel Deployment](#vercel-deployment)
10. [Post-Deployment Steps](#post-deployment-steps)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account (for repository)
- Vercel account (sign up at https://vercel.com)
- Google Cloud Platform account
- Stripe account
- PayPal Developer account (optional, if using PayPal)

---

## Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to your project → **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose a name (e.g., `autoshorts-db`)
5. Select a region close to your users
6. Click **Create**
7. Copy the **Connection String** (you'll need this for `DATABASE_URL`)

### Option 2: External PostgreSQL

You can use any PostgreSQL database (Supabase, Railway, Neon, etc.):

1. Create a PostgreSQL database on your preferred provider
2. Get the connection string
3. Format: `postgresql://username:password@host:port/database`

### Database Migration

After setting up the database, run migrations:

```bash
npm run migrate
npm run seed-plans
```

**Note:** For Vercel, you'll need to run migrations manually using a database client or after first deployment.

---

## Redis Setup

### Option 1: Upstash Redis (Recommended for Vercel)

1. Go to https://upstash.com and sign up
2. Create a new Redis database
3. Choose a region close to your Vercel deployment
4. Copy the **REST URL** or **Redis URL**
5. You'll use this for `REDIS_URL`

**Upstash Free Tier:**
- 10,000 commands per day
- Perfect for development and small deployments

### Option 2: External Redis

You can use any Redis provider:
- Redis Cloud
- AWS ElastiCache
- Self-hosted Redis

Connection string format: `redis://username:password@host:port`

---

## Google OAuth Setup

### Step 1: Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** and **People API**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
   - Search for "People API" and enable it

### Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Fill in required information:
   - App name: AutoShorts
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (if in testing mode)

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://your-domain.vercel.app/api/auth/google/callback`
5. Click **Create**
6. Copy **Client ID** and **Client Secret**

---

## YouTube API Setup

### Step 1: Enable YouTube Data API v3

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click **Enable**

### Step 2: Update OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Edit your existing OAuth 2.0 client (same one from Google OAuth)
3. Add additional authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/youtube/callback`
   - Production: `https://your-domain.vercel.app/api/auth/youtube/callback`
4. The same Client ID and Client Secret will work for both Google and YouTube OAuth

**Note:** The YouTube OAuth flow requires users to grant permission separately for video uploads.

---

## Stripe Setup

### Step 1: Create Stripe Account

1. Sign up at https://stripe.com
2. Complete account setup
3. Toggle **Test mode** for development

### Step 2: Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Reveal and copy **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Use test keys for development, live keys for production

### Step 3: Create Products and Prices

1. Go to **Products** → **Add product**
2. Create products for each plan:

   **Starter Plan:**
   - Name: Starter Plan
   - Create two prices:
     - Monthly: $9/month, recurring
     - Yearly: $90/year, recurring
   - Copy the Price IDs (starts with `price_`)

   **Pro Plan:**
   - Name: Pro Plan
   - Monthly: $29/month
   - Yearly: $290/year

   **Enterprise Plan:**
   - Name: Enterprise Plan
   - Monthly: $99/month
   - Yearly: $990/year

### Step 4: Set Up Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.vercel.app/api/payments/webhook/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

---

## PayPal Setup

### Step 1: Create PayPal App

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Go to **My Apps & Credentials**

### Step 2: Create Sandbox App (for testing)

1. Under **Sandbox** tab, click **Create App**
2. App name: AutoShorts
3. Select **Merchant** account type
4. Click **Create App**
5. Copy **Client ID** and **Secret**

### Step 3: Create Live App (for production)

1. Under **Live** tab, click **Create App**
2. Follow same steps as sandbox
3. Use these credentials in production

**Note:** You'll need to set `PAYPAL_MODE=live` for production and update credentials.

---

## Environment Variables Setup

### Step 1: Generate Required Secrets

```bash
# Generate JWT Secret
openssl rand -hex 32

# Generate Master Key (for API key encryption)
openssl rand -hex 32
```

### Step 2: Prepare Your Variables

Use the `.env.example` file as a template. Here's a checklist:

#### Required Variables:

- [ ] `DATABASE_URL` - From Vercel Postgres or external database
- [ ] `REDIS_URL` - From Upstash or external Redis
- [ ] `JWT_SECRET` - Generated with openssl
- [ ] `MASTER_KEY` - Generated with openssl (64 hex chars)
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] `GOOGLE_OAUTH_REDIRECT_URI` - Your Vercel domain + `/api/auth/google/callback`
- [ ] `OAUTH_REDIRECT_URI` - Your Vercel domain + `/api/auth/youtube/callback`
- [ ] `STRIPE_SECRET_KEY` - From Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe Webhooks
- [ ] `STRIPE_PRICE_ID_STARTER_MONTHLY` - From Stripe Products
- [ ] `STRIPE_PRICE_ID_STARTER_YEARLY` - From Stripe Products
- [ ] `STRIPE_PRICE_ID_PRO_MONTHLY` - From Stripe Products
- [ ] `STRIPE_PRICE_ID_PRO_YEARLY` - From Stripe Products
- [ ] `STRIPE_PRICE_ID_ENTERPRISE_MONTHLY` - From Stripe Products
- [ ] `STRIPE_PRICE_ID_ENTERPRISE_YEARLY` - From Stripe Products
- [ ] `PAYPAL_CLIENT_ID` - From PayPal Developer
- [ ] `PAYPAL_CLIENT_SECRET` - From PayPal Developer
- [ ] `PAYPAL_MODE` - `sandbox` or `live`
- [ ] `FRONTEND_URL` - Your Vercel deployment URL
- [ ] `NEXT_PUBLIC_FRONTEND_URL` - Same as FRONTEND_URL

#### Optional Variables:

- [ ] `TEMP_DIR` - Default: `/tmp/autoshorts`
- [ ] `LOG_LEVEL` - Default: `INFO`
- [ ] `NODE_ENV` - Default: `production`

---

## Vercel Deployment

### Step 1: Connect Repository

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (if repo root)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 2: Add Environment Variables

1. In Vercel project settings, go to **Environment Variables**
2. Add each variable from your checklist:
   - Click **Add New**
   - Paste variable name and value
   - Select environments (Production, Preview, Development)
   - Click **Save**

**Important:** 
- Add all variables before first deployment
- Update redirect URIs in Google Console to match your Vercel domain
- Update Stripe webhook URL to match your Vercel domain

### Step 3: Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Note your deployment URL (e.g., `autoshorts.vercel.app`)

### Step 4: Update OAuth Redirect URIs

After getting your Vercel URL, update:

1. **Google OAuth:**
   - Google Cloud Console → Credentials
   - Edit OAuth client
   - Add: `https://your-domain.vercel.app/api/auth/google/callback`
   - Add: `https://your-domain.vercel.app/api/auth/youtube/callback`

2. **Stripe Webhook:**
   - Stripe Dashboard → Webhooks
   - Update endpoint URL: `https://your-domain.vercel.app/api/payments/webhook/stripe`

3. **Vercel Environment Variables:**
   - Update `FRONTEND_URL` and `NEXT_PUBLIC_FRONTEND_URL`
   - Update `GOOGLE_OAUTH_REDIRECT_URI`
   - Update `OAUTH_REDIRECT_URI`
   - Redeploy after updating

---

## Post-Deployment Steps

### Step 1: Run Database Migrations

After first deployment, you need to run migrations:

**Option A: Using Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run migrate
npm run seed-plans
```

**Option B: Using Database Client**
Connect to your database using a client (pgAdmin, DBeaver, etc.) and run:
- All SQL files from `src/db/migrations/`
- Seed file: `src/db/seed-plans.ts` (convert to SQL or run via Node)

### Step 2: Set Admin User

Run this SQL to set your admin email:
```sql
UPDATE users SET is_admin = true WHERE email = 'adityapandey.dev.in@gmail.com';
```

Or manually update in database.

### Step 3: Test Deployment

1. Visit your Vercel URL
2. Test sign up/sign in
3. Test Google OAuth login
4. Test creating a video job
5. Test payment flow (use Stripe test cards)

### Step 4: Configure Admin API Keys

1. Log in as admin
2. Go to `/admin/settings`
3. Add API keys:
   - Gemini API key (for AI story generation)
   - Pexels API key (for video clips)
   - Google Cloud TTS credentials (for text-to-speech)

---

## Troubleshooting

### Build Errors

**Error: Missing environment variable**
- Check all required variables are in Vercel
- Ensure variable names match exactly (case-sensitive)

**Error: Database connection failed**
- Verify `DATABASE_URL` format is correct
- Check database is accessible from Vercel
- Ensure database accepts connections from Vercel IPs

### Runtime Errors

**OAuth redirect mismatch**
- Ensure redirect URIs in Google Console match exactly
- Check `GOOGLE_OAUTH_REDIRECT_URI` and `OAUTH_REDIRECT_URI` in Vercel

**Stripe webhook not working**
- Verify webhook URL is correct in Stripe
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Ensure webhook events are selected correctly

**Redis connection errors**
- Verify `REDIS_URL` is correct
- Check Upstash dashboard for connection status
- Ensure Redis is in same region as Vercel deployment

### Performance Issues

**Slow video generation**
- Check worker process is running (separate from Vercel)
- Monitor Redis queue for job processing
- Consider upgrading Redis plan if hitting limits

**Database connection pool exhaustion**
- Increase `max` connections in `src/db.ts` if needed
- Monitor database connections in dashboard

---

## Quick Reference

### Generate Secrets Commands

```bash
# JWT Secret
openssl rand -hex 32

# Master Key (must be exactly 64 hex characters)
openssl rand -hex 32
```

### Environment Variable Checklist

Copy this checklist and mark off as you configure:

```
☐ DATABASE_URL
☐ REDIS_URL
☐ JWT_SECRET
☐ MASTER_KEY
☐ GOOGLE_CLIENT_ID
☐ GOOGLE_CLIENT_SECRET
☐ GOOGLE_OAUTH_REDIRECT_URI
☐ OAUTH_REDIRECT_URI
☐ STRIPE_SECRET_KEY
☐ STRIPE_WEBHOOK_SECRET
☐ STRIPE_PRICE_ID_STARTER_MONTHLY
☐ STRIPE_PRICE_ID_STARTER_YEARLY
☐ STRIPE_PRICE_ID_PRO_MONTHLY
☐ STRIPE_PRICE_ID_PRO_YEARLY
☐ STRIPE_PRICE_ID_ENTERPRISE_MONTHLY
☐ STRIPE_PRICE_ID_ENTERPRISE_YEARLY
☐ PAYPAL_CLIENT_ID
☐ PAYPAL_CLIENT_SECRET
☐ PAYPAL_MODE
☐ FRONTEND_URL
☐ NEXT_PUBLIC_FRONTEND_URL
```

### Important URLs

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Google Cloud Console:** https://console.cloud.google.com
- **Stripe Dashboard:** https://dashboard.stripe.com
- **PayPal Developer:** https://developer.paypal.com
- **Upstash:** https://upstash.com

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Vercel deployment logs
3. Check environment variables are set correctly
4. Verify all services (Database, Redis, OAuth) are configured properly

---

**Good luck with your deployment! 🚀**

