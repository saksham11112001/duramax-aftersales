-- Add site visit photo and physical signoff document columns
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS site_photo_url TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS signoff_photo_url TEXT;
