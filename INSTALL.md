# Installation Steps for Gap Fixes

## 1. Install new npm package (pdf-lib)
```bash
npm install pdf-lib
```

## 2. Run SQL migrations in Supabase SQL Editor (in order)

### Migration 003 — SLA Settings table
Run: supabase/migrations/003_sla_settings.sql

### Migration 004 — Add photo_url to tickets
Run: supabase/migrations/004_photo_upload.sql

### Migration 005 — Add invoice columns to payments
Run: supabase/migrations/005_invoice_columns.sql

## 3. Create Supabase Storage buckets

Go to Supabase → Storage → New Bucket:

**Bucket 1:**
- Name: ticket-photos
- Public: YES (toggle ON)
- Click Create

**Bucket 2:**
- Name: invoices
- Public: YES (toggle ON)
- Click Create

## 4. Drop this zip into your project (replace when asked)

All files in this zip replace their counterparts.

## 5. Restart dev server
```bash
npm run dev -- --no-turbopack
```

## What you will see after these steps

### Gap 1 — Editable SLAs
- Admin dashboard now has an "⏱ Edit SLAs" button next to the filter chips
- Click it → modal shows all 9 stages with editable hour values
- Changes are saved to Supabase and affect breach detection

### Gap 2 — Real photo upload
- Customer form photo button now opens a file picker
- Selected photo shows a preview with a remove button
- On submit, photo is uploaded to Supabase Storage (ticket-photos bucket)
- Admin can see the photo in the ticket detail panel

### Gap 3 — PDF Invoice
- When admin clicks Raise Invoice, a GST-compliant PDF is generated
- PDF is stored in Supabase Storage (invoices bucket)
- "📄 Download PDF" button appears in the ticket detail panel
- After customer pays, PDF is regenerated with a green PAID stamp
- Invoice includes: invoice number, date, GSTIN (dummy: 07AABCD1234E1Z5),
  company address, customer details, line items, CGST 9%, SGST 9%, grand total,
  amount in words

## Dummy values used in invoices (replace when client confirms)

| Field | Dummy Value | Where to change |
|---|---|---|
| GSTIN | 07AABCD1234E1Z5 | lib/invoice-generator.ts → COMPANY.gstin |
| Company Name | Duromax UPVC Pvt. Ltd. | lib/invoice-generator.ts → COMPANY.name |
| Address | A-12, Okhla Industrial Area, Phase I, New Delhi - 110 020 | lib/invoice-generator.ts → COMPANY.address |
| PAN | AABCD1234E | lib/invoice-generator.ts → COMPANY.pan |
| Phone | +91 98765 00000 | lib/invoice-generator.ts → COMPANY.phone |
| Email | service@duromax.in | lib/invoice-generator.ts → COMPANY.email |
| SAC Code | 998714 | lib/invoice-generator.ts → COMPANY.sac |

All in one place — edit the COMPANY object at the top of lib/invoice-generator.ts
