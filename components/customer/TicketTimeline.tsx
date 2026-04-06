import type { Ticket } from '@/lib/types'

const STEPS = [
  { s:'new',            icon:'📋', l:'Request Received',      d:'Your request has been logged.' },
  { s:'invoiced',       icon:'🧾', l:'Visit Invoice Sent',    d:'Pay to confirm your supervisor visit.' },
  { s:'paid',           icon:'💳', l:'Payment Confirmed',     d:'Supervisor being assigned.' },
  { s:'scheduled',      icon:'🔧', l:'Supervisor Assigned',   d:'Inspection visit confirmed.' },
  { s:'visited',        icon:'🔍', l:'Inspection Complete',   d:'Quote ready for your approval.' },
  { s:'parts_invoiced', icon:'📦', l:'Repair Invoice Sent',   d:'Pay to confirm the repair.' },
  { s:'parts_paid',     icon:'🛠️', l:'Installer Assigned',   d:'Repair is being carried out.' },
  { s:'closed',         icon:'🛡️', l:'Service Complete',     d:'Warranty activated for 1 year.' },
]
const ORDER = STEPS.map(s => s.s)

export default function TicketTimeline({ ticket }: { ticket: Ticket }) {
  const curIdx = ORDER.indexOf(ticket.status)
  const alloc  = ticket.supervisor_allocations?.[0]
  const visitP = ticket.payments?.find(p => p.payment_type === 'visit_fee')
  const partsP = ticket.payments?.find(p => p.payment_type === 'spare_parts')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Ticket card */}
      <div style={{ background: 'linear-gradient(160deg,var(--teal) 0%,var(--teal-m) 100%)', borderRadius: 13, padding: '18px 20px', color: 'white' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Service Ticket</div>
        <div className="serif" style={{ fontSize: 24, marginBottom: 12, letterSpacing: '-.2px' }}>{ticket.ticket_number}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { l:'Customer', v: ticket.client_name },
            { l:'Status',   v: ticket.status.replace(/_/g,' ') },
            { l:'Issue',    v: ticket.complaint_description.substring(0,38)+'…' },
            { l:'Submitted',v: new Date(ticket.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) },
          ].map(item => (
            <div key={item.l}>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>{item.l}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, textTransform: item.l === 'Status' ? 'capitalize' : 'none' }}>{item.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: 'white', borderRadius: 13, border: '1px solid var(--border)', padding: '18px 18px 14px', boxShadow: 'var(--sh)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>Your Journey</div>
        {STEPS.map((step, i) => {
          const done    = i < curIdx
          const current = i === curIdx
          const pending = i > curIdx
          return (
            <div key={step.s} style={{ display: 'flex', gap: 11, marginBottom: i < STEPS.length - 1 ? 0 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${done?'var(--teal)':current?'var(--coral)':'var(--border)'}`, background: done?'var(--teal)':current?'var(--coral-l)':'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done?9:13, color: done?'white':current?'var(--coral)':'var(--muted)', fontWeight: 800, zIndex: 1, flexShrink: 0 }}>
                  {done ? '✓' : step.icon}
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 1, height: 26, background: done?'var(--teal)':'var(--border)', margin: '2px 0' }}/>}
              </div>
              <div style={{ paddingTop: 3, paddingBottom: i < STEPS.length - 1 ? 18 : 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: pending?'var(--border)':'var(--ink)' }}>{step.l}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{step.d}</div>
                {current && step.s === 'invoiced' && visitP && (
                  <div style={{ marginTop: 8, background: 'var(--gold-l)', border: '1px solid #F0D090', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--gold)' }}>
                    <strong style={{ display: 'block', marginBottom: 2 }}>Payment Required</strong>
                    Amount: ₹{(visitP.amount_paise/100).toLocaleString('en-IN')} · Payment link sent to WhatsApp. Valid 48 hours.
                  </div>
                )}
                {(done||current) && step.s === 'scheduled' && alloc && (
                  <div style={{ marginTop: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700 }}>{alloc.profiles?.full_name || 'Supervisor Assigned'}</div>
                    <div style={{ color: 'var(--muted)', marginTop: 2 }}>📅 {new Date(alloc.visit_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · {alloc.time_slot}</div>
                  </div>
                )}
                {current && step.s === 'parts_invoiced' && partsP && (
                  <div style={{ marginTop: 8, background: 'var(--blue-l)', border: '1px solid #90B8E8', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--blue)' }}>
                    <strong style={{ display: 'block', marginBottom: 2 }}>Repair Invoice Ready</strong>
                    ₹{(partsP.amount_paise/100).toLocaleString('en-IN')} · Pay only after you approve the quote.
                  </div>
                )}
                {done && step.s === 'closed' && (
                  <div style={{ marginTop: 8, background: '#F0FAF6', border: '1px solid #86EFAC', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#15803D', fontWeight: 600 }}>🛡️ Warranty active — 1 year from today</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
