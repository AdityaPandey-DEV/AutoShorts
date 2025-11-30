# AutoShorts - Site Navigation Map

## Overview

This document provides a comprehensive navigation map of all pages in the AutoShorts application, showing navigation flows, access requirements, and relationships between pages.

## Public Pages (No Authentication Required)

### 🏠 Home Page (`/`)
- **Route**: `/`
- **Layout**: Root layout (no authentication header)
- **Access**: Public
- **Purpose**: Landing page with 3D flowchart visualization
- **Navigation From**:
  - Direct URL access
  - App logo click
- **Navigation To**:
  - `/signin` - Sign In button
  - `/signup` - Start Free Trial button
  - `/pricing` - View Pricing link
- **Features**:
  - Hero section with main CTA
  - 3D interactive flowchart showing automation process
  - Feature cards (AI Thinking, Video Creator, Auto Upload, Smart Learning)
  - Benefits section
  - Multiple CTA sections

---

## Authentication Pages

### 🔐 Sign In (`/signin`)
- **Route**: `/signin`
- **Layout**: Auth layout
- **Access**: Public (redirects to dashboard if already authenticated)
- **Purpose**: User login
- **Navigation From**:
  - Home page "Sign In" button
  - Protected pages when not authenticated
- **Navigation To**:
  - `/dashboard` - After successful login
  - `/signup` - Sign up link
  - Home page - Logo/back link
- **Features**:
  - Email/password login
  - Google OAuth login
  - "Forgot password" (if implemented)

### 📝 Sign Up (`/signup`)
- **Route**: `/signup`
- **Layout**: Auth layout
- **Access**: Public
- **Purpose**: New user registration
- **Navigation From**:
  - Home page "Start Free Trial" buttons
  - Sign in page "Sign up" link
- **Navigation To**:
  - `/dashboard` - After successful registration
  - `/signin` - Sign in link
  - Home page - Logo/back link
- **Features**:
  - User registration form
  - Google OAuth signup
  - Terms and conditions

---

## Authenticated Pages (Dashboard Layout)

All pages below require authentication. Users are redirected to `/signin` if not authenticated.

### 📊 Dashboard (`/dashboard`)
- **Route**: `/dashboard`
- **Layout**: Dashboard layout (includes Header with navigation)
- **Access**: Authenticated users only
- **Purpose**: Main user dashboard
- **Navigation From**:
  - After login/signup
  - Header "Dashboard" link
  - Logo click (when authenticated)
- **Navigation To**:
  - `/flowchart` - Create Flowchart button
  - `/pricing` - Upgrade Plan button
  - `/settings` - Account Settings button
  - `/admin` - Admin link (if user is admin)
- **Features**:
  - Stats cards (plan, videos generated, limit, remaining)
  - Video creator form
  - Recent jobs list
  - Quick actions panel
  - Trial banner (if on trial)

### 🎨 Flowchart Editor (`/flowchart`)
- **Route**: `/flowchart`
- **Query Params**: `?id=<flowchart_id>` (optional, for editing existing flowchart)
- **Layout**: Dashboard layout (includes Header)
- **Access**: Authenticated users only
- **Purpose**: Create and edit automation flowcharts
- **Navigation From**:
  - Dashboard "Create Flowchart" button
  - Flowchart list "Edit" button
  - Header "Flowchart" link
- **Navigation To**:
  - `/flowchart/list` - Via browser back or list link
  - Dashboard - Via header
- **Features**:
  - 3D interactive flowchart canvas
  - Drag-and-drop nodes
  - AI chat assistant (right sidebar)
  - Toolbar (Save, Add Node, Delete, Export/Import)
  - Auto-save every 30 seconds
  - Multiple node types (AI Thinking, Video Creator, YouTube Upload, Feedback Loop, etc.)

### 📋 Flowchart List (`/flowchart/list`)
- **Route**: `/flowchart/list`
- **Layout**: Dashboard layout (includes Header)
- **Access**: Authenticated users only
- **Purpose**: View all saved flowcharts
- **Navigation From**:
  - Header "Flowchart" link (if implemented)
  - Direct navigation
- **Navigation To**:
  - `/flowchart?id=<id>` - Edit button on each flowchart card
  - `/flowchart` - Create New Flowchart button
- **Features**:
  - Grid of flowchart cards
  - Each card shows: name, description, last updated, node count
  - Edit and Delete actions per flowchart
  - Empty state with "Create First Flowchart" CTA

### 💰 Pricing (`/pricing`)
- **Route**: `/pricing`
- **Layout**: Dashboard layout (includes Header)
- **Access**: Authenticated users only
- **Purpose**: View pricing plans and upgrade
- **Navigation From**:
  - Dashboard "Upgrade Plan" button
  - Header "Pricing" link
  - Home page "View Pricing" link (redirects to signin first)
- **Navigation To**:
  - Stripe/PayPal checkout - When selecting a plan
  - Dashboard - After checkout or via header
- **Features**:
  - Plan comparison table
  - Starter, Pro, Enterprise plans
  - Monthly/Yearly toggle
  - Checkout buttons (Stripe and PayPal)

### ⚙️ Settings (`/settings`)
- **Route**: `/settings`
- **Layout**: Dashboard layout (includes Header)
- **Access**: Authenticated users only
- **Purpose**: User account settings
- **Navigation From**:
  - Dashboard "Account Settings" button
  - Header "Settings" link
- **Navigation To**:
  - Dashboard - Via header
  - YouTube OAuth connection flow
- **Features**:
  - Profile settings
  - YouTube account connection
  - Subscription management
  - Account deletion

---

## Admin Pages (Admin Layout)

All admin pages require authentication AND admin privileges.

### 👑 Admin Dashboard (`/admin`)
- **Route**: `/admin`
- **Layout**: Admin layout (includes AdminHeader and AdminSidebar)
- **Access**: Admin users only (redirects to `/dashboard` if not admin)
- **Purpose**: Admin overview dashboard
- **Navigation From**:
  - Header "Admin" link (visible only to admins)
  - Admin sidebar "Dashboard" link
- **Navigation To**:
  - `/admin/users` - Users link
  - `/admin/jobs` - Jobs link
  - `/admin/stats` - Stats link
  - `/admin/settings` - Settings link
- **Features**:
  - System statistics cards
  - Recent activity feed
  - Quick overview metrics

### 👥 Admin Users (`/admin/users`)
- **Route**: `/admin/users`
- **Layout**: Admin layout
- **Access**: Admin users only
- **Purpose**: Manage all users
- **Navigation From**:
  - Admin dashboard "Users" card
  - Admin sidebar "Users" link
- **Navigation To**:
  - `/admin/users/[id]` - Click on user row
  - `/admin` - Via sidebar
- **Features**:
  - Users table with search
  - User details (email, plan, status)
  - Edit user button per row

### 👤 Admin User Detail (`/admin/users/[id]`)
- **Route**: `/admin/users/[id]`
- **Layout**: Admin layout
- **Access**: Admin users only
- **Purpose**: View and edit specific user
- **Navigation From**:
  - Admin users table row click
- **Navigation To**:
  - `/admin/users` - Back button or sidebar
- **Features**:
  - User profile editing
  - Subscription management
  - Delete user
  - User activity history

### 📦 Admin Jobs (`/admin/jobs`)
- **Route**: `/admin/jobs`
- **Layout**: Admin layout
- **Access**: Admin users only
- **Purpose**: View all video generation jobs
- **Navigation From**:
  - Admin dashboard "Jobs" card
  - Admin sidebar "Jobs" link
- **Navigation To**:
  - `/admin/jobs/[id]` - Click on job row (if implemented)
  - `/admin` - Via sidebar
- **Features**:
  - Jobs table with filters
  - Job status, user, prompt, YouTube video ID
  - Delete job action

### 📊 Admin Stats (`/admin/stats`)
- **Route**: `/admin/stats`
- **Layout**: Admin layout
- **Access**: Admin users only
- **Purpose**: System-wide statistics
- **Navigation From**:
  - Admin dashboard "Stats" card
  - Admin sidebar "Stats" link
- **Navigation To**:
  - `/admin` - Via sidebar
- **Features**:
  - Usage statistics
  - Revenue metrics
  - User growth charts
  - Plan distribution

### 🔧 Admin Settings (`/admin/settings`)
- **Route**: `/admin/settings`
- **Layout**: Admin layout
- **Access**: Admin users only
- **Purpose**: Manage API keys and system settings
- **Navigation From**:
  - Admin sidebar "Settings" link
- **Navigation To**:
  - `/admin` - Via sidebar
- **Features**:
  - API keys management (Gemini, OpenAI, Pexels, TTS)
  - System configuration
  - Admin-only settings

---

## API Routes

### Authentication APIs
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/youtube` - Initiate YouTube OAuth
- `GET /api/auth/youtube/callback` - YouTube OAuth callback

### Flowchart APIs
- `GET /api/flowchart` - List user's flowcharts
- `POST /api/flowchart` - Create new flowchart
- `GET /api/flowchart/[id]` - Get flowchart by ID
- `PUT /api/flowchart/[id]` - Update flowchart
- `DELETE /api/flowchart/[id]` - Delete flowchart
- `POST /api/flowchart/ai-chat` - AI chat for flowchart assistance

### User APIs
- `GET /api/users/me` - Get current user profile
- `GET /api/users/me/subscription` - Get user subscription
- `GET /api/users/me/usage` - Get user usage stats

### Job APIs
- `GET /api/jobs` - List user's jobs
- `POST /api/jobs` - Create video generation job
- `GET /api/jobs/[id]` - Get job by ID
- `DELETE /api/jobs/[id]` - Cancel/delete job

### Payment APIs
- `POST /api/payments/checkout/stripe` - Stripe checkout
- `POST /api/payments/checkout/paypal` - PayPal checkout
- `GET /api/payments/history` - Payment history
- `POST /api/payments/cancel` - Cancel subscription
- `POST /api/payments/webhook/stripe` - Stripe webhook
- `GET /api/payments/paypal/success` - PayPal success callback

### Admin APIs
- `GET /api/admin/auth/check` - Check if user is admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `PUT /api/admin/users/[id]/subscription` - Update user subscription
- `GET /api/admin/jobs` - List all jobs
- `GET /api/admin/jobs/[id]` - Get job details
- `DELETE /api/admin/jobs/[id]` - Delete job
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/usage` - Usage statistics
- `GET /api/admin/api-keys` - Get admin API keys
- `POST /api/admin/api-keys` - Store admin API key
- `DELETE /api/admin/api-keys` - Delete admin API key

---

## Navigation Flow Diagram

```
                    HOME (/)
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    SIGN IN      SIGN UP      PRICING
    (/signin)   (/signup)    (/pricing)
        │             │
        └──────┬──────┘
               │
          DASHBOARD (/dashboard)
               │
    ┌──────────┼──────────┬──────────────┐
    │          │          │              │
FLOWCHART  PRICING   SETTINGS       ADMIN (/admin)
(/flowchart)         (/settings)         │
    │                                      │
    ├─ EDITOR (/flowchart?id=1)      ┌────┼────┬────────┐
    │                                 │    │    │        │
    └─ LIST (/flowchart/list)      USERS JOBS STATS SETTINGS
```

---

## Access Control Summary

| Page | Public | Authenticated | Admin |
|------|--------|---------------|-------|
| `/` | ✅ | ✅ | ✅ |
| `/signin` | ✅ | ✅ (redirects) | ✅ (redirects) |
| `/signup` | ✅ | ✅ (redirects) | ✅ (redirects) |
| `/dashboard` | ❌ | ✅ | ✅ |
| `/flowchart` | ❌ | ✅ | ✅ |
| `/flowchart/list` | ❌ | ✅ | ✅ |
| `/pricing` | ❌ | ✅ | ✅ |
| `/settings` | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ✅ |
| `/admin/*` | ❌ | ❌ | ✅ |

---

## Layouts

1. **Root Layout** (`app/layout.tsx`)
   - Used for: Public pages (home)
   - Includes: Global styles, fonts
   - No header

2. **Dashboard Layout** (`app/(dashboard)/layout.tsx`)
   - Used for: All authenticated pages
   - Includes: Header component with navigation
   - Redirects: Unauthenticated users to `/signin`

3. **Admin Layout** (`app/(admin)/admin/layout.tsx`)
   - Used for: All admin pages
   - Includes: AdminHeader and AdminSidebar
   - Redirects: Non-admin users to `/dashboard`

4. **Auth Layout** (`app/(auth)/layout.tsx`)
   - Used for: Sign in, sign up pages
   - May include: Auth-specific styling or layout

5. **Flowchart Layout** (`app/(dashboard)/flowchart/layout.tsx`)
   - Used for: Flowchart pages
   - Includes: Authentication check

---

## Key Features by Page

### Home Page
- 3D interactive flowchart visualization
- Feature showcase
- Multiple CTAs
- Public access

### Dashboard
- Video generation interface
- Usage statistics
- Recent jobs
- Quick actions

### Flowchart Editor
- 3D canvas with React Three Fiber
- AI chat assistant
- Drag-and-drop nodes
- Auto-save
- Export/Import

### Admin Panel
- User management
- Job monitoring
- System statistics
- API key management

---

## Notes

- All authenticated pages check for auth token via middleware or layout
- Admin pages have additional check for `is_admin` flag
- Redirects preserve intended destination via query params when possible
- API routes are protected separately with authentication checks
- Static pages are pre-rendered where possible for performance

