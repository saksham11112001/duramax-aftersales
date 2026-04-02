export type TicketStatus =
  | 'new' | 'invoiced' | 'paid' | 'scheduled'
  | 'visited' | 'parts_invoiced' | 'parts_paid' | 'closed'

export type StaffRole = 'admin' | 'supervisor' | 'installer'

export interface Profile {
  id:         string
  full_name:  string
  mobile:     string | null
  role:       StaffRole
  is_active:  boolean
  created_at: string
}

export interface SupervisorAllocation {
  id:            string
  ticket_id:     string
  supervisor_id: string
  visit_date:    string
  time_slot:     string
  notes:         string | null
  allocated_at:  string
  sla_deadline:  string
  sla_alerted:   boolean
  profiles?:     { full_name: string; mobile: string | null; role: string }
}

export interface SiteVisit {
  id:                string
  ticket_id:         string
  supervisor_id:     string
  visit_date:        string
  client_complaint:  string
  observed_issue:    string
  urgency_level:     string | null
  est_repair_time:   string | null
  warranty_status:   string | null
  supervisor_signed: boolean
  client_signed:     boolean
  remarks:           string | null
  submitted_at:      string
}

export interface SparePart {
  id:               string
  site_visit_id:    string
  s_no:             number
  article_name:     string
  article_number:   string | null
  quantity:         number
  unit_price_paise: number | null
  remarks:          string | null
}

export interface Payment {
  id:                  string
  ticket_id:           string
  payment_type:        'visit_fee' | 'spare_parts'
  token:               string
  token_expires_at:    string
  razorpay_order_id:   string | null
  razorpay_payment_id: string | null
  amount_paise:        number
  status:              'pending' | 'paid' | 'failed' | 'expired'
  paid_at:             string | null
  created_at:          string
}

export interface Feedback {
  id:                string
  ticket_id:         string
  token:             string
  token_used:        boolean
  overall_rating:    number | null
  supervisor_rating: number | null
  quality_rating:    number | null
  timeliness_rating: number | null
  comment:           string | null
  submitted_at:      string | null
}

export interface Ticket {
  id:                    string
  ticket_number:         string
  client_name:           string
  client_mobile:         string
  site_address:          string
  complaint_description: string
  brand_installed:       string | null
  duromax_installation:  boolean | null
  preferred_slot:        string | null
  is_outstation:         boolean
  status:                TicketStatus
  created_at:            string
  updated_at:            string
  supervisor_allocations?: SupervisorAllocation[]
  site_visits?:          SiteVisit[]
  payments?:             Payment[]
  feedback?:             Feedback | null
}

// Staff performance stats
export interface StaffStats {
  total_assigned:   number
  total_closed:     number
  in_progress:      number
  avg_rating:       number | null
  total_revenue:    number   // paise
  this_month:       number   // closed this month
  on_time_pct:      number   // % closed within SLA
}
