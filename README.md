# Duromax UPVC — After-Sales Service Portal

**Prepared by:** SGNG & Associates (I), Chartered Accountants  
**Client:** Duromax UPVC Pvt. Ltd.  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Razorpay · WhatsApp Cloud API · Resend · pdf-lib  
**Status:** All 7 phases complete. Gap fixes applied (SLA settings, photo upload, PDF invoices).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Full Codebase Structure](#3-full-codebase-structure)
4. [Database Schema](#4-database-schema)
5. [User Roles & Auth Flow](#5-user-roles--auth-flow)
6. [Ticket Lifecycle (10 Steps)](#6-ticket-lifecycle-10-steps)
7. [Environment Variables](#7-environment-variables)
8. [Fresh Setup Guide — New Developer](#8-fresh-setup-guide--new-developer)
9. [Third-Party Setup (Step by Step)](#9-third-party-setup-step-by-step)
10. [Deployment to Vercel](#10-deployment-to-vercel)
11. [Supabase Edge Functions](#11-supabase-edge-functions)
12. [Invoice System](#12-invoice-system)
13. [WhatsApp Templates](#13-whatsapp-templates)
14. [Known Dummy Values to Replace](#14-known-dummy-values-to-replace)
15. [End-to-End Test Checklist](#15-end-to-end-test-checklist)
16. [What Was Built Phase by Phase](#16-what-was-built-phase-by-phase)

---

## 1. Project Overview

A complete after-sales service management system for Duromax UPVC. Replaces manual WhatsApp-based coordination with a structured, trackable, automated platform.

### Three user types
| Role | How they log in | What they can do |
|---|---|---|
| **Customer** | No login — ticket number + mobile | Submit requests, track status, pay invoices, give feedback |
| **Admin** | Email + password at `/login` | Manage all tickets, raise invoices, assign staff, close tickets |
| **Supervisor** | Mobile OTP at `/supervisor/verify` | See assigned visits, file inspection reports, submit spare parts list |
| **Installer** | Mobile OTP at `/supervisor/verify` | See assigned repairs, complete jobs |

### Two-stage payment model
1. **Stage 1 — Site Visit Fee:** ₹3,000 (Delhi NCR) or ₹4,500 (Outstation, includes boarding). Paid before supervisor visits.
2. **Stage 2 — Repair Invoice:** Spare parts + labour. Raised after supervisor inspection. Customer pays only after approving the quote.

Both payments via Razorpay (UPI, GPay, PhonePe, Paytm, BHIM, net banking, cards).

---

## 2. Architecture Summary

```
Customer Browser  ──→  Next.js App (Vercel)  ──→  Supabase (PostgreSQL + Auth + Storage)
                                │
                                ├──→  Razorpay (payments + webhook)
                                ├──→  WhatsApp Cloud API (notifications)
                                ├──→  Resend (admin emails)
                                └──→  Supabase Edge Functions (cron jobs)
```

### Real-time flow
```
Customer pays on Razorpay
  → Razorpay fires webhook → /api/razorpay/webhook
  → HMAC signature verified
  → payments table updated (status = 'paid')
  → tickets table updated (next status)
  → Supabase Realtime broadcasts change
  → Admin dashboard updates in <200ms (no refresh)
  → Supervisor dashboard updates in <200ms
  → PDF regenerated with PAID stamp
  → WhatsApp notification fired to customer
```

---

## 3. Full Codebase Structure

```
duromax-aftercare/
│
├── app/
│   ├── layout.tsx                          Root layout, loads DM Sans + DM Serif fonts
│   ├── globals.css                         CSS variables (--teal, --gold, --coral, etc.)
│   ├── page.tsx                            Customer portal (New Request / Track tabs)
│   │
│   ├── (admin)/
│   │   ├── login/page.tsx                  Admin email+password login
│   │   └── dashboard/
│   │       ├── page.tsx                    Role router → redirects to /dashboard/admin
│   │       ├── admin/page.tsx              Admin dashboard server component
│   │       └── staff/page.tsx              Staff management server component
│   │
│   ├── (supervisor)/
│   │   └── supervisor/
│   │       ├── verify/page.tsx             Mobile OTP login (supervisors + installers)
│   │       └── dashboard/page.tsx          Field staff dashboard server component
│   │
│   ├── (public)/
│   │   ├── pay/[token]/
│   │   │   ├── page.tsx                    Payment page server component
│   │   │   └── PaymentClient.tsx           Razorpay checkout UI (UPI/card/NB)
│   │   └── feedback/[token]/
│   │       ├── page.tsx                    Feedback page server component
│   │       └── FeedbackClient.tsx          4-category star rating form
│   │
│   └── api/
│       ├── tickets/
│       │   ├── route.ts                    POST create ticket (public)
│       │   ├── track/route.ts              GET track by ticket# + mobile
│       │   └── upload-photo/route.ts       POST upload customer photo to Storage
│       │
│       ├── pay/[token]/
│       │   └── create-order/route.ts       POST create Razorpay order
│       │
│       ├── razorpay/
│       │   └── webhook/route.ts            POST payment confirmed (HMAC verified)
│       │
│       ├── feedback/[token]/
│       │   └── route.ts                    GET + POST feedback by token
│       │
│       ├── supervisor/
│       │   ├── send-otp/route.ts           POST trigger SMS OTP via Supabase Auth
│       │   ├── verify-otp/route.ts         POST verify OTP → create session
│       │   ├── visits/route.ts             GET supervisor's assigned visits
│       │   ├── submit-report/route.ts      POST site visit report + spare parts
│       │   └── stats/route.ts              GET supervisor self-performance stats
│       │
│       └── admin/
│           ├── invoices/route.ts           POST raise invoice + generate PDF
│           ├── invoices/mark-paid/route.ts POST regenerate PDF with PAID stamp
│           ├── allocate-supervisor/route.ts POST assign supervisor/installer
│           ├── mark-visited/route.ts       POST advance ticket to 'visited'
│           ├── close-ticket/route.ts       POST close ticket + create feedback token
│           ├── send-reminder/route.ts      POST resend WhatsApp reminder
│           ├── sla-settings/route.ts       GET + POST editable SLA hours per stage
│           └── staff/
│               ├── route.ts               GET list staff / POST create staff member
│               ├── [id]/route.ts          PATCH update / DELETE deactivate
│               └── [id]/stats/route.ts    GET staff performance stats
│
├── components/
│   ├── customer/
│   │   ├── EnquiryForm.tsx                 Request form (brand dropdown, photo upload)
│   │   ├── TicketTracker.tsx               Track by ticket# + mobile
│   │   └── TicketTimeline.tsx              8-step visual progress timeline
│   │
│   ├── admin/
│   │   ├── AdminDashboard.tsx              Main dashboard (pipeline board, filters, realtime)
│   │   ├── TicketDetail.tsx                Right panel (action zone + invoice PDF download)
│   │   ├── InvoiceModal.tsx                Raise invoice modal (outstation toggle)
│   │   ├── AssignModal.tsx                 Assign supervisor/installer (auto-reminder note)
│   │   ├── FeedbackPanel.tsx               Feedback tab with star ratings
│   │   ├── SLASettingsModal.tsx            ⏱ Edit SLA hours per stage
│   │   └── StaffManagement.tsx             Add/edit/disable staff + performance stats
│   │
│   ├── supervisor/
│   │   ├── SupervisorDashboard.tsx         3 tabs: Overview / Pending / Completed
│   │   ├── SiteReportForm.tsx              Inspection report + digital sign-off
│   │   └── SparePartsTable.tsx             Dynamic spare parts rows
│   │
│   └── shared/
│       ├── LogoutButton.tsx                Used in all top bars
│       ├── StatusBadge.tsx                 Coloured status pills
│       └── SLABar.tsx                      SLA progress bar with breach colour
│
├── lib/
│   ├── types.ts                            TypeScript interfaces for all DB tables
│   ├── api-auth.ts                         requireAdminAuth() — admin-only API guard
│   ├── notifications.ts                    Central sendNotification(event, payload)
│   ├── razorpay.ts                         Singleton Razorpay client
│   ├── invoice-generator.ts                pdf-lib PDF invoice generator (COMPANY details here)
│   └── supabase/
│       ├── client.ts                       Browser Supabase client
│       ├── server.ts                       Server Supabase client (cookies)
│       └── admin.ts                        Service-role client (bypasses RLS)
│
├── middleware.ts                           Auth guard for /dashboard and /supervisor/dashboard
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql          All 8 tables + RLS + triggers
│   │   ├── 002_fix_roles.sql               Remove accounts, add installer role
│   │   ├── 003_sla_settings.sql            SLA settings table
│   │   ├── 004_photo_upload.sql            photo_url column on tickets
│   │   └── 005_invoice_columns.sql         invoice_number, invoice_pdf_url on payments
│   ├── set_admin_role.sql                  Set first admin user role
│   ├── cron_schedules.sql                  pg_cron schedules for edge functions
│   ├── whatsapp_templates.md               All 9 WhatsApp message templates
│   └── functions/
│       ├── payment-reminder/index.ts       Hourly: resend payment links unpaid 24h+
│       ├── sla-checker/index.ts            Hourly: email admin on SLA breach
│       ├── visit-reminder/index.ts         Daily 6PM IST: remind customer day before visit
│       └── expire-tokens/index.ts          Every 6h: expire stale payment tokens
│
├── .env.local                              All secrets (see Section 7)
├── package.json                            next, @supabase/ssr, razorpay, pdf-lib, resend
└── tailwind.config.ts
```

---

## 4. Database Schema

### 8 tables

| Table | Purpose |
|---|---|
| `profiles` | Staff accounts (admin / supervisor / installer). Linked to `auth.users`. |
| `tickets` | Core service requests. Has `status` enum driving the entire flow. Also has `photo_url`. |
| `payments` | Razorpay payment records. Has `token` (signed URL), `invoice_number`, `invoice_pdf_url`. |
| `supervisor_allocations` | Which staff member is assigned to which ticket, visit date/time, SLA deadline. |
| `site_visits` | Supervisor inspection report (observed issue, urgency, warranty status, sign-offs). |
| `spare_parts` | Line items from the supervisor's parts list (article name, number, qty, unit price). |
| `feedback` | Post-closure customer ratings (4 categories). One-time token. |
| `notification_log` | Every WhatsApp/email attempt (for debugging). |
| `sla_settings` | Admin-editable SLA hours per stage. |

### Ticket statuses (in order)
```
new → invoiced → paid → scheduled → visited → parts_invoiced → parts_paid → closed
```

### Auto-generated fields
- `ticket_number` — trigger auto-generates `DM-YYYY-NNNN` (e.g. `DM-2026-0001`)
- `updated_at` — trigger auto-updates on every change
- `payments.token` — UUID for signed payment URLs (48h expiry)
- `feedback.token` — UUID for one-time feedback link

---

## 5. User Roles & Auth Flow

### Admin
- Login: `/login` → email + password → Supabase email auth
- On success: redirected to `/dashboard` → role check → `/dashboard/admin`
- All admin API routes call `requireAdminAuth()` which checks `profiles.role = 'admin'`

### Supervisor / Installer
- Login: `/supervisor/verify` → mobile number → SMS OTP via Twilio → Supabase phone auth
- Session: 8 hours
- Only sees tickets assigned to them (via `supervisor_allocations.supervisor_id = auth.uid()`)
- No password — OTP only

### Customer
- Zero login. Tracks ticket via `ticket_number + mobile` combination.
- Payment via signed token URL `/pay/[token]` (48h expiry).
- Feedback via one-time token URL `/feedback/[token]`.

---

## 6. Ticket Lifecycle (10 Steps)

| Step | Who | Action | Ticket status |
|---|---|---|---|
| 1 | Customer | Submits enquiry form | `new` |
| 2 | Admin | Raises site visit invoice | `invoiced` |
| 3 | Customer | Pays visit fee | `paid` ← auto via webhook |
| 4 | Admin | Assigns supervisor + date | `scheduled` |
| 5 | Supervisor | Files inspection report | `visited` ← auto on report submit |
| 6 | Admin | Raises repair invoice | `parts_invoiced` |
| 7 | Customer | Pays repair invoice | `parts_paid` ← auto via webhook |
| 8 | Admin | Assigns installer | (status stays `parts_paid`, allocation created) |
| 9 | Installer | Completes repair | (logged in site_visits) |
| 10 | Admin | Closes ticket | `closed` → feedback link sent |

**Steps 3 and 7 are fully automatic** — Razorpay webhook fires → DB updates → Realtime pushes to all browsers.

---

## 7. Environment Variables

Create `.env.local` in project root:

```bash
# ── SUPABASE ─────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── RAZORPAY ─────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# ── WHATSAPP ─────────────────────────────────────
WHATSAPP_TOKEN=EAAxxxx
WHATSAPP_PHONE_NUMBER_ID=1234567890123
WHATSAPP_BUSINESS_ACCOUNT_ID=9876543210123

# ── RESEND (admin emails) ─────────────────────────
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=alerts@duromax.in

# ── APP ──────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_NOTIFICATION_EMAIL=admin@duromax.in
```

---

## 8. Fresh Setup Guide — New Developer

Follow these steps in exact order if you are setting up from a fresh code zip.

### Prerequisites
- Node.js 18+ installed
- npm 9+ installed
- Git (optional but recommended)

### Step 1 — Install dependencies
```bash
cd duromax-aftercare
npm install
```

### Step 2 — Create .env.local
Copy the template from Section 7 above. Fill in only Supabase keys first (you need those immediately). Add the rest as you set up each service.

### Step 3 — Run all SQL migrations in Supabase
Go to **Supabase → SQL Editor** and run these files one by one in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_fix_roles.sql`
3. `supabase/migrations/003_sla_settings.sql`
4. `supabase/migrations/004_photo_upload.sql`
5. `supabase/migrations/005_invoice_columns.sql`
6. `supabase/set_admin_role.sql` (after creating your admin user — see Section 9.1)

### Step 4 — Create Supabase Storage buckets
Go to **Supabase → Storage → New Bucket** and create:
- `ticket-photos` — Public: **YES**
- `invoices` — Public: **YES**

### Step 5 — Enable Realtime
Go to **Supabase → Database → Replication** and toggle ON:
- `tickets`
- `payments`

### Step 6 — Start dev server
```bash
npm run dev -- --no-turbopack
```

### Step 7 — Create admin user
Go to **Supabase → Authentication → Users → Add User** → enter email and password for the admin.

Then run in SQL Editor (replace email):
```sql
UPDATE profiles
SET full_name = 'Duromax Admin', role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@duromax.in');
```

### Step 8 — Verify it works
- Open `localhost:3000` — customer portal loads
- Open `localhost:3000/login` — log in as admin
- Dashboard loads with pipeline board

---

## 9. Third-Party Setup (Step by Step)

### 9.1 Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to India (Singapore or Mumbai)
3. **Settings → API** → copy `URL`, `anon key`, `service_role key` → paste into `.env.local`
4. **Authentication → Providers → Email** → Enable, turn OFF "Confirm email"
5. **Authentication → Providers → Phone** → Enable, connect Twilio (see 9.3)
6. Run all 5 SQL migrations (Section 8 Step 3)
7. Create 2 storage buckets (Section 8 Step 4)
8. Enable Realtime on `tickets` and `payments` (Section 8 Step 5)

### 9.2 Razorpay

1. Go to [razorpay.com](https://razorpay.com) → Sign Up → complete business KYC
2. **Settings → API Keys → Generate Test Key** → copy both keys into `.env.local`
3. For local testing: install ngrok → `ngrok http 3000` → copy the `https://xxx.ngrok-free.app` URL
4. **Settings → Webhooks → Add New Webhook**:
   - URL: `https://xxx.ngrok-free.app/api/razorpay/webhook`
   - Secret: any strong string → copy to `RAZORPAY_WEBHOOK_SECRET`
   - Events: check only `payment.captured`
5. After deploying to Vercel: update webhook URL to `https://your-domain.vercel.app/api/razorpay/webhook`

**Test cards:**
- Success: `4111 1111 1111 1111` · Any future expiry · Any CVV
- Failed: `4000 0000 0000 0002`
- UPI: `success@razorpay`

### 9.3 Twilio (SMS OTP for supervisors)

1. Go to [twilio.com](https://twilio.com) → Sign Up Free
2. Dashboard → copy **Account SID** and **Auth Token**
3. **Get a phone number** → Accept → copy the number (e.g. `+12015551234`)
4. **Phone Numbers → Verified Caller IDs** → add supervisor's mobile for testing (free trial restriction)
5. Go back to **Supabase → Authentication → Providers → Phone**:
   - SMS Provider: Twilio
   - Account SID: paste
   - Auth Token: paste
   - Phone Number: paste
   - Save

### 9.4 WhatsApp (Meta Cloud API)

1. Go to [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App → **Business**
2. App dashboard → Add Products → **WhatsApp → Set Up**
3. **WhatsApp → API Setup** → copy:
   - Temporary access token → `WHATSAPP_TOKEN`
   - Phone Number ID → `WHATSAPP_PHONE_NUMBER_ID`
   - Business Account ID → `WHATSAPP_BUSINESS_ACCOUNT_ID`
4. **Add test recipient:** API Setup → "To" field → Add Phone Number → enter your WhatsApp number → verify with code
5. **For permanent (non-expiring) token:**
   - Meta Business Suite → System Users → Create → Role: Admin
   - Generate Token → select your app → check `whatsapp_business_messaging`
   - Copy token → replace `WHATSAPP_TOKEN`
6. **Submit message templates:** WhatsApp → Message Templates → Create → submit all 9 from `supabase/whatsapp_templates.md`
   - Category: Utility · Language: English · Name: exact name from the file
   - Approval takes 24–48 hours. System works without approval but WA messages won't send.

### 9.5 Resend (Admin Emails)

1. Go to [resend.com](https://resend.com) → Sign Up → API Keys → Create API Key → copy to `RESEND_API_KEY`
2. **Without domain (for testing):** set `RESEND_FROM_EMAIL=onboarding@resend.dev`
3. **With your domain:** Resend → Domains → Add `duromax.in` → add 3 DNS records → verify → set `RESEND_FROM_EMAIL=alerts@duromax.in`

---

## 10. Deployment to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Duromax portal"
git remote add origin https://github.com/yourusername/duromax-aftercare.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → select repo
2. Framework: **Next.js** (auto-detected)
3. Click **Deploy**

### Step 3 — Add environment variables
Vercel → your project → **Settings → Environment Variables** → add every variable from `.env.local` one by one.

For `NEXT_PUBLIC_APP_URL` use: `https://your-project.vercel.app`

Click **Redeploy** after adding all variables.

### Step 4 — Update Razorpay webhook
Razorpay → Settings → Webhooks → edit webhook URL from ngrok to your Vercel URL.

---

## 11. Supabase Edge Functions

These run automatically on a schedule. They require the Supabase CLI.

### Deploy
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set WHATSAPP_TOKEN=EAAxxxx
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=1234567890123
supabase secrets set RESEND_API_KEY=re_xxxx
supabase secrets set RESEND_FROM_EMAIL=alerts@duromax.in
supabase secrets set ADMIN_NOTIFICATION_EMAIL=admin@duromax.in
supabase secrets set APP_URL=https://your-project.vercel.app

# Deploy functions
supabase functions deploy payment-reminder
supabase functions deploy sla-checker
supabase functions deploy visit-reminder
supabase functions deploy expire-tokens
```

### Set cron schedules
Go to **Supabase → Database → Extensions** → enable `pg_cron`.
Then run `supabase/cron_schedules.sql` in SQL Editor.

| Function | Schedule | What it does |
|---|---|---|
| `payment-reminder` | Every hour | Resends payment link if unpaid for 24h+ |
| `sla-checker` | Every hour | Emails admin if SLA breached (48h+ without supervisor assigned) |
| `visit-reminder` | Daily 6PM IST | WhatsApp reminder to customer day before scheduled visit |
| `expire-tokens` | Every 6h | Marks stale payment tokens as expired |

---

## 12. Invoice System

### What gets generated
When admin clicks **Raise Invoice**, the system:
1. Calculates amount (₹3,000 or ₹4,500 for visit; spare parts total for repair)
2. Generates a GST-compliant A4 PDF using `lib/invoice-generator.ts`
3. Uploads PDF to Supabase Storage (`invoices` bucket)
4. Stores the public URL in `payments.invoice_pdf_url`
5. Admin sees a **📄 Download PDF** button in the ticket detail panel

### After payment is confirmed
Razorpay webhook fires → `mark-paid` API is called → PDF regenerated with green **PAID** stamp and transaction ID.

### Invoice contents
- Duromax letterhead (teal header)
- Invoice number (INV-YYYY-NNNN), date, ticket reference
- Company GSTIN, address, SAC code
- Customer name, address, mobile
- Line items with HSN/SAC codes
- CGST 9% + SGST 9% breakdown
- Grand total + amount in words (Indian number system)
- PAID stamp with transaction ID (after payment)

---

## 13. WhatsApp Templates

9 templates — all must be submitted to Meta and approved before they work in production.

| Template name | Triggered when |
|---|---|
| `ticket_created` | Customer submits enquiry |
| `invoice_raised_visit` | Admin raises site visit invoice |
| `visit_fee_paid` | Customer pays visit fee |
| `supervisor_assigned` | Admin assigns supervisor or installer |
| `visit_reminder` | Day before scheduled visit (edge function) |
| `invoice_raised_parts` | Admin raises repair invoice |
| `parts_paid` | Customer pays repair invoice |
| `ticket_closed` | Admin closes ticket |
| `payment_reminder` | Invoice unpaid for 24h+ (edge function) |

Full template text in `supabase/whatsapp_templates.md`.

---

## 14. Known Dummy Values to Replace

All in one place: **`lib/invoice-generator.ts`** → `COMPANY` object at the top of the file.

| Field | Dummy value | Real value needed |
|---|---|---|
| Company name | Duromax UPVC Pvt. Ltd. | Confirm legal name |
| Address | A-12, Okhla Industrial Area, Phase I, New Delhi - 110 020 | Registered office address |
| GSTIN | `07AABCD1234E1Z5` | Client's actual GSTIN |
| PAN | `AABCD1234E` | Client's PAN |
| Phone | `+91 98765 00000` | Business phone |
| Email | `service@duromax.in` | Business email |
| SAC Code | `998714` | Confirm with CA (998714 = maintenance/repair services) |

Other fields to verify:
- `ADMIN_NOTIFICATION_EMAIL` in `.env.local` → admin's actual email
- `RESEND_FROM_EMAIL` → verified sender domain
- `NEXT_PUBLIC_APP_URL` → final production domain

---

## 15. End-to-End Test Checklist

Run in this order after setup:

| # | Test | Expected |
|---|---|---|
| 1 | Open `localhost:3000` | Customer portal loads, DM Serif font visible |
| 2 | Submit enquiry form (fill all fields, attach photo) | Ticket number shown, track tab opens |
| 3 | Check Supabase → tickets table | New row with photo_url populated |
| 4 | Login as admin at `/login` | Redirects to `/dashboard/admin` |
| 5 | Admin dashboard shows new ticket in pipeline | Appears under "Invoice Pending" |
| 6 | Click ticket → Raise Invoice (Delhi NCR) | PDF generated, modal shows ₹3,000 |
| 7 | Open Supabase → Storage → invoices | PDF file visible |
| 8 | Click ⏱ Edit SLAs | Modal opens, 9 rows editable |
| 9 | In ticket detail → Download PDF button | PDF opens in browser, shows GSTIN and line items |
| 10 | Open `/pay/[token]` (copy token from DB) | Payment page loads ₹3,000 |
| 11 | Pay with test card `4111 1111 1111 1111` | Success. Admin dashboard auto-updates to "Assign Supervisor" |
| 12 | PDF in Storage updated with PAID stamp | Check invoices bucket |
| 13 | Add supervisor via `/dashboard/staff` | Credentials card shown |
| 14 | Open `/supervisor/verify` in incognito | OTP screen |
| 15 | Enter supervisor mobile → receive SMS → enter OTP | Supervisor dashboard loads |
| 16 | Admin assigns supervisor | Supervisor dashboard updates live |
| 17 | Supervisor files report (sign both) | Ticket moves to "Raise Repair Invoice" |
| 18 | Admin raises repair invoice | Second PDF generated |
| 19 | Pay repair invoice | Ticket moves to "Assign Installer" |
| 20 | Admin assigns installer | Installer notified |
| 21 | Admin closes ticket | Feedback link created |
| 22 | Open feedback link | Star rating form |
| 23 | Submit feedback | Appears in admin Feedback tab |

---

## 16. What Was Built Phase by Phase

| Phase | What was built | Cost |
|---|---|---|
| 1 | Foundation: Next.js + Supabase schema (8 tables, RLS, triggers), admin login, role routing, middleware | ₹15,000 |
| 2 | Customer portal: enquiry form, ticket tracker, timeline | ₹18,000 |
| 3 | Admin dashboard: pipeline board, ticket management, invoice raising, SLA bars, feedback panel, realtime | ₹28,000 |
| 4 | Razorpay: checkout UI (UPI/card/NB), order creation, webhook reconciliation | ₹22,000 |
| 5 | Supervisor + installer: mobile OTP login, field dashboard, inspection report, spare parts table, digital sign-off | ₹25,000 |
| 6 | Notifications: WhatsApp (9 templates), Resend email, edge functions (4 cron jobs), SLA automation | ₹20,000 |
| 7 | Staff management: onboarding UI, credentials card, performance stats, ratings, revenue tracking | ₹12,000 |
| **Gap fixes** | Editable SLA settings, real photo upload (Supabase Storage), GST-compliant PDF invoices (pdf-lib) | Included |
| **Total** | | **₹1,40,000 + GST** |

---

## Key Files Reference for Debugging

| Problem | File to look at |
|---|---|
| Admin can't log in | `app/(admin)/login/page.tsx`, `app/(admin)/dashboard/page.tsx` |
| Supervisor OTP not working | `app/api/supervisor/send-otp/route.ts`, Supabase → Auth → Phone settings |
| Payment not updating dashboard | `app/api/razorpay/webhook/route.ts`, Supabase → Realtime settings |
| PDF not generating | `lib/invoice-generator.ts`, Supabase → Storage → invoices bucket exists? |
| Photo not uploading | `app/api/tickets/upload-photo/route.ts`, Supabase → Storage → ticket-photos bucket exists? |
| WhatsApp not sending | `lib/notifications.ts`, check `notification_log` table in Supabase |
| SLA breach not alerting | `supabase/functions/sla-checker/index.ts`, check cron is scheduled |
| Realtime not updating | Supabase → Database → Replication → tickets table toggled ON? |
| Staff not appearing in assign modal | Check `profiles.role` = 'supervisor' or 'installer', `profiles.is_active` = true |
| "New User" showing in dashboard | Run `set_admin_role.sql` in Supabase SQL Editor |

---

*Last updated: April 2026 · All 7 phases complete + 3 gap fixes applied.*
