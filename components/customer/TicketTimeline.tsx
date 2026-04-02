import type { Ticket } from '@/lib/types'

const STEPS = [
  { status:'new',            icon:'📋', label:'Request Received',    desc:'Your request has been logged.' },
  { status:'invoiced',       icon:'🧾', label:'Invoice Sent',        desc:'Pay to confirm your appointment.' },
  { status:'paid',           icon:'💳', label:'Payment Confirmed',   desc:'Visit fee received.' },
  { status:'scheduled',      icon:'🗓️', label:'Technician Assigned', desc:'Visit date confirmed.' },
  { status:'visited',        icon:'🔧', label:'Visit Complete',      desc:'Report submitted by technician.' },
  { status:'parts_invoiced', icon:'📦', label:'Parts Invoice Sent',  desc:'Pay to complete the service.' },
  { status:'parts_paid',     icon:'✅', label:'Parts Paid',          desc:'Final payment received.' },
  { status:'closed',         icon:'🛡️', label:'Service Complete',    desc:'Warranty activated.' },
]
const ORDER = STEPS.map(s => s.status)

export default function TicketTimeline({ ticket }: { ticket: Ticket }) {
  const curIdx = ORDER.indexOf(ticket.status)
  const alloc  = ticket.supervisor_allocations?.[0]
  const visitP = ticket.payments?.find(p => p.payment_type === 'visit_fee')
  const partsP = ticket.payments?.find(p => p.payment_type === 'spare_parts')
  const fb     = ticket.feedback

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Ticket card */}
      <div style={{ background: 'linear-gradient(135deg,#0A5C48,#0D7A60)', borderRadius: 16, padding: '18px 20px', color: 'white' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Service Ticket</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.3px' }}>{ticket.ticket_number}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { l:'Customer', v: ticket.client_name },
            { l:'Status', v: ticket.status.replace(/_/g,' ') },
            { l:'Address', v: ticket.site_address.substring(0,40) + (ticket.site_address.length > 40 ? '…' : '') },
            { l:'Submitted', v: new Date(ticket.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) },
          ].map(item => (
            <div key={item.l}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing:'0.06em' }}>{item.l}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{item.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '20px 20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Progress</div>
        {STEPS.map((step, i) => {
          const isDone    = i < curIdx
          const isCurrent = i === curIdx
          const isPending = i > curIdx
          const isLast    = i === STEPS.length - 1
          return (
            <div key={step.status} style={{ display: 'flex', gap: 12, marginBottom: isLast ? 0 : 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${isDone ? '#0A5C48' : isCurrent ? '#F59E0B' : '#E5E7EB'}`, background: isDone ? '#0A5C48' : isCurrent ? '#FFF7ED' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isDone ? 10 : 13, color: isDone ? 'white' : isCurrent ? '#F59E0B' : '#D1D5DB', fontWeight: 800, zIndex: 1, flexShrink: 0 }}>
                  {isDone ? '✓' : step.icon}
                </div>
                {!isLast && <div style={{ width: 2, height: 24, background: isDone ? '#0A5C48' : '#F3F4F6', margin: '2px 0', borderRadius: 2 }}/>}
              </div>
              <div style={{ paddingTop: 4, paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isPending ? '#D1D5DB' : '#111827' }}>{step.label}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{step.desc}</div>
                {isCurrent && step.status === 'invoiced' && visitP && (
                  <div style={{ marginTop: 8, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 13px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Payment Required</div>
                    <div style={{ fontSize: 12, color: '#B45309', marginTop: 3 }}>Amount: ₹{(visitP.amount_paise/100).toLocaleString('en-IN')} · Link sent to your WhatsApp.</div>
                  </div>
                )}
                {(isDone || isCurrent) && step.status === 'scheduled' && alloc && (
                  <div style={{ marginTop: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 13px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{alloc.profiles?.full_name || 'Technician'}</div>
                    <div style={{ color: '#64748B', marginTop: 2 }}>📅 {new Date(alloc.visit_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · {alloc.time_slot}</div>
                  </div>
                )}
                {isCurrent && step.status === 'parts_invoiced' && partsP && (
                  <div style={{ marginTop: 8, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 13px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Parts Invoice Ready</div>
                    <div style={{ fontSize: 12, color: '#B45309', marginTop: 3 }}>₹{(partsP.amount_paise/100).toLocaleString('en-IN')} · Pay only after you are satisfied.</div>
                  </div>
                )}
                {isDone && step.status === 'closed' && (
                  <div style={{ marginTop: 8, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 13px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#15803D' }}>🛡️ Warranty active — 1 year</div>
                    {fb?.overall_rating && <div style={{ color: '#16A34A', marginTop: 2 }}>Your rating: {'★'.repeat(fb.overall_rating)}{'☆'.repeat(5-fb.overall_rating)}</div>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
