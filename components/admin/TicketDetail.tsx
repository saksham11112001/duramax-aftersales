import type { Ticket } from '@/lib/types'
import StatusBadge from '@/components/shared/StatusBadge'
import SLABar from '@/components/shared/SLABar'

const R = ({l,v}: {l:string; v:string|null|undefined}) => (
  <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--bg)', fontSize:12.5 }}>
    <span style={{ color:'var(--muted)' }}>{l}</span>
    <span style={{ fontWeight:600, color:'var(--ink)', textAlign:'right', maxWidth:'58%' }}>{v||'—'}</span>
  </div>
)

const Btn = ({label,onClick,bg='var(--teal)',disabled=false}: {label:string;onClick:()=>void;bg?:string;disabled?:boolean}) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:'8px 14px', background:disabled?'var(--border)':bg, color:'white', border:'none', borderRadius:7, fontSize:12.5, fontWeight:700, cursor:disabled?'not-allowed':'pointer', fontFamily:'inherit' }}>{label}</button>
)
const SecBtn = ({label,onClick}: {label:string;onClick:()=>void}) => (
  <button onClick={onClick} style={{ padding:'8px 14px', background:'transparent', color:'var(--ink)', border:'1.5px solid var(--border)', borderRadius:7, fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{label}</button>
)

interface Props {
  ticket: Ticket
  onRaiseInvoice: (type:'visit_fee'|'spare_parts') => void
  onAssign: (type?:'supervisor'|'installer') => void
  onMarkVisited: () => void
  onClose: () => void
  onReminder: () => void
  actionLoading: boolean
}

export default function TicketDetail({ ticket, onRaiseInvoice, onAssign, onMarkVisited, onClose, onReminder, actionLoading }: Props) {
  const s      = ticket.status
  const alloc  = ticket.supervisor_allocations?.[0]
  const visit  = ticket.site_visits?.[0]
  const visitP = ticket.payments?.find(p=>p.payment_type==='visit_fee')
  const partsP = ticket.payments?.find(p=>p.payment_type==='spare_parts')
  const fb     = ticket.feedback
  const amt    = (p:number) => '₹'+(p/100).toLocaleString('en-IN')

  const notifBox = (icon:string, text:string, bg:string, bdr:string, c:string) => (
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:9, padding:'10px 13px', display:'flex', gap:9, marginTop:10 }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
      <div style={{ fontSize:12, color:c, lineHeight:1.5 }}>{text}</div>
    </div>
  )

  // PDF download button
  function InvoiceDownloadBtn({ payment, label }: { payment: typeof visitP; label: string }) {
    if (!payment) return null
    const pdfUrl = (payment as typeof payment & { invoice_pdf_url?: string }).invoice_pdf_url
    const invNum = (payment as typeof payment & { invoice_number?: string }).invoice_number
    return (
      <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:9, padding:'10px 13px', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)' }}>{label}</div>
          {invNum && <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:1 }}>{invNum} · {amt(payment.amount_paise)}</div>}
        </div>
        {pdfUrl ? (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ padding:'6px 12px', background:'var(--teal)', color:'white', border:'none', borderRadius:7, fontSize:12, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
            📄 Download PDF
          </a>
        ) : (
          <span style={{ fontSize:11, color:'var(--muted)' }}>Generating…</span>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg,var(--bg),#EFF8F3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:3 }}>{ticket.ticket_number}</div>
            <div className="serif" style={{ fontSize:18, color:'var(--ink)' }}>{ticket.client_name}</div>
            <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:4 }}>{ticket.complaint_description.substring(0,80)}{ticket.complaint_description.length>80?'…':''}</div>
          </div>
          <StatusBadge status={ticket.status}/>
        </div>

        {/* Customer photo if attached */}
        {(ticket as typeof ticket & { photo_url?: string }).photo_url && (
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Customer Photo</div>
            <a href={(ticket as typeof ticket & { photo_url?: string }).photo_url} target="_blank" rel="noopener noreferrer">
              <img src={(ticket as typeof ticket & { photo_url?: string }).photo_url} alt="Customer photo" style={{ width:'100%', maxHeight:140, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)', cursor:'zoom-in' }}/>
            </a>
          </div>
        )}
      </div>

      <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:13 }}>

        {/* Invoice download buttons */}
        {visitP && <InvoiceDownloadBtn payment={visitP} label="Site Visit Invoice"/>}
        {partsP && <InvoiceDownloadBtn payment={partsP} label="Repair Invoice"/>}

        {/* ACTION ZONE */}
        {s==='new' && (
          <div style={{ background:'var(--gold-l)', border:'1px solid #F0D090', borderRadius:11, padding:'13px 15px' }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Action Required</div>
            <p style={{ fontSize:12.5, color:'var(--gold)', marginBottom:11 }}>Review the request and raise the site visit invoice (₹3,000). A GST-compliant PDF will be generated and stored automatically.</p>
            <div style={{ display:'flex', gap:7 }}>
              <Btn label="🧾 Raise Invoice" onClick={()=>onRaiseInvoice('visit_fee')} bg="var(--gold-m)" disabled={actionLoading}/>
              <SecBtn label="Send Reminder" onClick={onReminder}/>
            </div>
          </div>
        )}
        {s==='invoiced' && (
          <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:11, padding:'13px 15px' }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:'#4338CA', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Awaiting Payment</div>
            <p style={{ fontSize:12.5, color:'#4338CA', marginBottom:11 }}>Invoice of {amt(visitP?.amount_paise??300000)} sent. Waiting for customer to pay.</p>
            <Btn label="📲 Resend Invoice via WhatsApp" onClick={onReminder} bg="#4F46E5"/>
          </div>
        )}
        {s==='paid' && (
          <div style={{ background:'var(--teal-l)', border:'1px solid #9FD8C4', borderRadius:11, padding:'13px 15px' }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Payment Confirmed — Assign Supervisor</div>
            <p style={{ fontSize:12.5, color:'var(--teal)', marginBottom:8 }}>Visit fee received. Assign a supervisor to inspect the site within 48 hours.</p>
            {notifBox('🔔','As soon as you assign, supervisor receives an automatic WhatsApp with site details, complaint and visit schedule.','#EEF4FF','#B5D4F4','#0C447C')}
            <div style={{ marginTop:11 }}><Btn label="🔧 Assign Supervisor →" onClick={()=>onAssign('supervisor')} disabled={actionLoading}/></div>
          </div>
        )}
        {s==='scheduled' && alloc && (
          <div style={{ background:'var(--coral-l)', border:'1px solid #F0B4A0', borderRadius:11, padding:'13px 15px' }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:'var(--coral)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Supervisor Assigned</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:38, height:38, background:'var(--coral)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Georgia,serif', fontSize:17, flexShrink:0 }}>{(alloc.profiles?.full_name?.[0]??'S').toUpperCase()}</div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:700 }}>{alloc.profiles?.full_name}</div>
                <div style={{ fontSize:11.5, color:'var(--muted)' }}>📅 {new Date(alloc.visit_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · {alloc.time_slot}</div>
              </div>
            </div>
            <SLABar allocatedAt={alloc.allocated_at} deadline={alloc.sla_deadline} label="Visit SLA"/>
            <div style={{ display:'flex', gap:7, marginTop:10 }}>
              <SecBtn label="Reassign" onClick={()=>onAssign('supervisor')}/>
              <Btn label="✓ Mark Visited" onClick={onMarkVisited} disabled={actionLoading}/>
            </div>
          </div>
        )}
        {s==='visited' && (
          <div style={{ background:'var(--blue-l)', border:'1px solid #90B8E8', borderRadius:11, padding:'13px 15px' }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:'var(--blue)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Visit Complete — Raise Repair Invoice</div>
            {visit && <p style={{ fontSize:12.5, color:'var(--blue)', marginBottom:11 }}>Finding: "{visit.observed_issue}". A GST invoice with spare parts breakdown will be generated automatically.</p>}
            <Btn label="🧾 Raise Repair Invoice" onClick={()=>onRaiseInvoice('spare_parts')} bg="var(--blue)" disabled={actionLoading}/>
          </div>
        )}
        {s==='parts_invoiced' && (
          <div style={{ background:'var(--purple-l)', border:'1px solid #C4B5FD', borderRadius:11, padding:'13px 15px' }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:'var(--purple)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Repair Invoice Sent</div>
            <p style={{ fontSize:12.5, color:'var(--purple)', marginBottom:11 }}>{amt(partsP?.amount_paise??0)} sent. Customer pays only after approving the quote.</p>
            <Btn label="📲 Resend Repair Invoice" onClick={onReminder} bg="var(--purple)"/>
          </div>
        )}
        {s==='parts_paid' && (
          <div style={{ background:'var(--teal-l)', border:'1px solid #9FD8C4', borderRadius:11, padding:'13px 15px' }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Repair Approved — Assign Installer</div>
            <p style={{ fontSize:12.5, color:'var(--teal)', marginBottom:8 }}>{amt(partsP?.amount_paise??0)} received. Assign an installer with the approved parts list.</p>
            {notifBox('🔔','Installer receives automatic WhatsApp with client address, approved parts list & visit schedule.','#EEF4FF','#B5D4F4','#0C447C')}
            <div style={{ marginTop:11 }}><Btn label="🛠️ Assign Installer →" onClick={()=>onAssign('installer')} disabled={actionLoading}/></div>
          </div>
        )}
        {s==='closed' && (
          <div style={{ background:'#F0FAF6', border:'1px solid #86EFAC', borderRadius:11, padding:'13px 15px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
              <div style={{ width:20, height:20, background:'#16A34A', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:9 }}>✓</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#15803D' }}>Service Complete — Warranty Active</div>
            </div>
            {fb?.overall_rating && <div style={{ fontSize:13, color:'#16A34A' }}>Rating: {'★'.repeat(fb.overall_rating)}{'☆'.repeat(5-fb.overall_rating)} {fb.overall_rating}/5</div>}
            {fb?.comment && <div style={{ fontSize:12, color:'#4ADE80', fontStyle:'italic', marginTop:6 }}>"{fb.comment}"</div>}
          </div>
        )}

        {/* Payments summary */}
        {(visitP||partsP) && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:7 }}>Payments</div>
            {[visitP,partsP].filter(Boolean).map((p,i) => p && (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px', fontSize:12.5, marginBottom:5 }}>
                <span style={{ color:'var(--muted)' }}>{p.payment_type==='visit_fee'?'Site Visit Fee':'Spare Parts + Labour'}</span>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ fontWeight:700 }}>{amt(p.amount_paise)}</span>
                  <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:20, background:p.status==='paid'?'#DCFCE7':'var(--gold-l)', color:p.status==='paid'?'#15803D':'var(--gold)' }}>{p.status==='paid'?'✓ Paid':'Pending'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Request Details</div>
          <R l="Mobile"          v={ticket.client_mobile}/>
          <R l="Address"         v={ticket.site_address}/>
          <R l="Brand"           v={ticket.brand_installed}/>
          <R l="Duromax Install" v={ticket.duromax_installation===null?'—':ticket.duromax_installation?'Yes':'No'}/>
          <R l="Region"          v={ticket.is_outstation?'Outstation':'Delhi NCR'}/>
          <R l="Preferred Slot"  v={ticket.preferred_slot}/>
          <R l="Submitted"       v={new Date(ticket.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}/>
        </div>
      </div>
    </div>
  )
}
