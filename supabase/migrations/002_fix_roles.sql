-- Run in Supabase SQL Editor
-- Remove accounts, add installer as valid role

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'supervisor', 'installer'));

-- Update current_user_role() helper
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admin policy (no accounts)
DROP POLICY IF EXISTS "admin_accounts_manage_tickets"    ON tickets;
DROP POLICY IF EXISTS "admin_accounts_update_tickets"    ON tickets;
DROP POLICY IF EXISTS "admin_accounts_see_payments"      ON payments;
DROP POLICY IF EXISTS "admin_accounts_manage_payments"   ON payments;
DROP POLICY IF EXISTS "admin_accounts_manage_visits"     ON site_visits;
DROP POLICY IF EXISTS "admin_accounts_manage_parts"      ON spare_parts;
DROP POLICY IF EXISTS "admin_reads_all_feedback"         ON feedback;
DROP POLICY IF EXISTS "admin_accounts_payments"          ON payments;
DROP POLICY IF EXISTS "admin reads notification log"     ON notification_log;
DROP POLICY IF EXISTS "admin_manages_profiles"           ON profiles;

CREATE POLICY "admin_manages_tickets"    ON tickets    FOR ALL  USING (current_user_role() = 'admin');
CREATE POLICY "admin_updates_tickets"    ON tickets    FOR UPDATE USING (current_user_role() = 'admin');
CREATE POLICY "admin_manages_payments"   ON payments   FOR ALL  USING (current_user_role() = 'admin');
CREATE POLICY "admin_manages_visits"     ON site_visits FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "admin_manages_parts"      ON spare_parts FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "admin_reads_feedback"     ON feedback   FOR SELECT USING (current_user_role() = 'admin');
CREATE POLICY "admin_updates_feedback"   ON feedback   FOR UPDATE USING (current_user_role() = 'admin');
CREATE POLICY "admin_reads_notif_log"    ON notification_log FOR SELECT USING (current_user_role() = 'admin');
CREATE POLICY "admin_manages_profiles"   ON profiles   FOR ALL  USING (current_user_role() = 'admin');

-- Installer can see their allocated tickets (same as supervisor)
DROP POLICY IF EXISTS "installer_sees_assigned_tickets"  ON tickets;
CREATE POLICY "installer_sees_assigned_tickets" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM supervisor_allocations sa
      WHERE sa.ticket_id = tickets.id AND sa.supervisor_id = auth.uid()
    )
  );
