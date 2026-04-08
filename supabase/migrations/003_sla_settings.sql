-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sla_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key   text NOT NULL UNIQUE,
  stage_label text NOT NULL,
  hours       integer NOT NULL DEFAULT 48,
  updated_at  timestamptz DEFAULT now()
);

-- Insert defaults for all 9 stages
INSERT INTO sla_settings (stage_key, stage_label, hours) VALUES
  ('enquiry_to_invoice',    'Enquiry → Invoice raised',            4),
  ('invoice_to_payment',    'Invoice sent → Payment received',    48),
  ('payment_to_supervisor', 'Payment → Supervisor assigned',      48),
  ('supervisor_to_visit',   'Assigned → Supervisor visits site',  72),
  ('visit_to_quote',        'Visit done → Repair invoice sent',    6),
  ('quote_to_payment',      'Quote sent → Customer pays',         48),
  ('payment_to_installer',  'Payment → Installer assigned',       24),
  ('installer_to_complete', 'Installer assigned → Repair done',  120),
  ('complete_to_close',     'Repair done → Ticket closed',         4)
ON CONFLICT (stage_key) DO NOTHING;

-- RLS: only admins can read/update
ALTER TABLE sla_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manages_sla" ON sla_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
