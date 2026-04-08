-- Run in Supabase SQL Editor

-- Add photo_url column to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS photo_url text;

-- Create Supabase Storage bucket for ticket photos
-- NOTE: Also do this manually in Supabase → Storage → New Bucket:
--   Bucket name: ticket-photos
--   Public: YES (so the URL is directly accessible)
-- OR run this if you have the storage schema enabled:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-photos', 'ticket-photos', true)
-- ON CONFLICT (id) DO NOTHING;
