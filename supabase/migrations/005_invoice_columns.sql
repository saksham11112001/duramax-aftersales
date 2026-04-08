-- Run in Supabase SQL Editor
-- Adds invoice_number and invoice_pdf_url to payments table

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS invoice_number  text,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url text;

-- Create invoices storage bucket
-- Do this in Supabase → Storage → New Bucket:
--   Name: invoices
--   Public: YES
-- Then come back and run:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true)
-- ON CONFLICT (id) DO NOTHING;
