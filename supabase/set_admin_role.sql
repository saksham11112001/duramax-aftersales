-- Run this after creating the admin user in Supabase Auth.
-- Replace the email if you used something different.

update profiles
set
  role      = 'admin',
  full_name = 'Duromax Admin'
where id = (
  select id from auth.users
  where email = 'admin@duromax.in'
);

-- Confirm it worked — should return one row with role = 'admin'
select id, full_name, role, created_at
from profiles
where role = 'admin';
