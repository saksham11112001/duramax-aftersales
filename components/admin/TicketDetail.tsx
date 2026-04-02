import type { Ticket } from '@/lib/types'
import StatusBadge from '@/components/shared/StatusBadge'
import SLABar from '@/components/shared/SLABar'

const R = ({ l, v }: { l: string; v: string|null|undefined }) => (
  <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #F9FAFB', fontSize:13 }}>
    <span style={{ color:'#9CA3AF' }}>{l}</span>
    <span style={{ color:'#111827', fontWeight:600, textAlign:'right', maxWidth:'58%' }}>{v || '—'}</span>
  </div>
)

const ActionBtn = ({ label, onClick, color='#0A5C48', disabled=false }: { label:string; onClick:()=>void; color?:string; disabled?:boolean }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:'9px 16px', background:disabled?'#E5E7EB':color, color:disabled?'#9CA3AF':'white', border:'none', borderRadius:10, fontSize:12.5, fontWeight:700, cursor:disabled?'not-allowed':'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
    {label}
  </button>
)

const SecBtn = ({ label, onClick }: { label:string; onClick:()=>void }) => (
  <button onClick={onClick} style={{ padding:'9px 16px', background:'transparent', color:'#374151', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:12.5, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
    {label}
  </button>
)

interface Props {
  ticket: Ticket
  onRaiseInvoice: (type:'visit_fee'|'spare_parts') => void
  onAssign: () => void
  onMarkVisited: () => void
  onClose: () => void
  onReminder: () => void
  actionLoading: boolean
}

function TLItem({ icon, title, done, date }: { icon:string; title:string; done:boolean; date?:string }) {
  return (
    <div style={{ display:'flex', gap:10, paddingBottom:10, position:'relative' }}>
      <div style={{ width:20, height:20, borderRadius:'50%', border:`1.5px solid ${done?'#0A5C48':'#E5E7EB'}`, background:done?'#0A5C48':'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:done?'white':'#D1D5DB', fontWeight:800, flexShrink:0 }}>{done?'✓':'○'}</div>
      <div style={{ paddingTop:1 }}>
        <div style={{ fontSize:12, fontWeight:700, color:done?'#111827':'#D1D5DB' }}>{title}</div>
        {done && date && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1 }}>{new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>}
        {!done && <div style={{ fontSize:11, color:'#E5E7EB' }}>Pending</div>}
      </div>
    </div>
  )
}

export default function TicketDetail({ ticket, onRaiseInvoice, onAssign, onMarkVisited, onClose, onReminder, actionLoading }: Props) {
  const s      = ticket.status
  const alloc  = ticket.supervisor_allocations?.[0]
  const visit  = ticket.site_visits?.[0]
  const visitP = ticket.payments?.find(p=>p.payment_type==='visit_fee')
  const partsP = ticket.payments?.find(p=>p.payment_type==='spare_parts')
  const fb     = ticket.feedback

  const amtStr = (paise:number) => '₹'+(paise/100).toLocaleString('en-IN')

  return (
    <div>
      {/* Header */}
      <div style={{ padding:'18px 20px', borderBottom:'1px solid #F3F4F6', background:'linear-gradient(135deg,#F8FFFE,#F0FDF9)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:3 }}>{ticket.ticket_number}</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#111827', letterSpacing:'-0.3px' }}>{ticket.client_name}</div>
            <div style={{ fontSize:12.5, color:'#6B7280', marginTop:4 }}>{ticket.complaint_description.substring(0,80)}{ticket.complaint_description.length>80?'…':''}</div>
          </div>
          <StatusBadge status={ticket.status}/>
        </div>
      </div>

      <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* ACTION ZONE */}
        {s==='new' && (
          <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Action Required</div>
            <p style={{ fontSize:13, color:'#92400E', marginBottom:12 }}>Review and raise the site visit invoice (₹3,000) to proceed.</p>
            <div style={{ display:'flex', gap:8 }}><ActionBtn label="🧾 Raise Invoice" onClick={()=>onRaiseInvoice('visit_fee')} color="#B45309" disabled={actionLoading}/><SecBtn label="Send Reminder" onClick={onReminder}/></div>
          </div>
        )}
        {s==='invoiced' && (
          <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#3730A3', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Awaiting Customer Payment</div>
            <p style={{ fontSize:13, color:'#4338CA', marginBottom:12 }}>Invoice of {amtStr(visitP?.amount_paise??300000)} sent. Waiting for customer to pay.</p>
            <ActionBtn label="📲 Resend Invoice via WhatsApp" onClick={onReminder} color="#4F46E5"/>
          </div>
        )}
        {s==='paid' && (
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#1E40AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Payment Confirmed — Assign Supervisor</div>
            <p style={{ fontSize:13, color:'#1D4ED8', marginBottom:12 }}>Visit fee received. Assign a supervisor within 48 hours to meet SLA.</p>
            <ActionBtn label="👤 Assign Supervisor →" onClick={onAssign} disabled={actionLoading}/>
          </div>
        )}
        {s==='scheduled' && alloc && (
          <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#C2410C', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Supervisor Assigned</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:38, height:38, background:'#F97316', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:15, flexShrink:0 }}>{(alloc.profiles?.full_name?.[0]??'S').toUpperCase()}</div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:700 }}>{alloc.profiles?.full_name}</div>
                <div style={{ fontSize:12, color:'#6B7280' }}>📅 {new Date(alloc.visit_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · {alloc.time_slot}</div>
              </div>
            </div>
            <SLABar allocatedAt={alloc.allocated_at} deadline={alloc.sla_deadline} label="Visit SLA"/>
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <SecBtn label="Reassign" onClick={onAssign}/>
              <ActionBtn label="✓ Mark Visited" onClick={onMarkVisited} disabled={actionLoading}/>
            </div>
          </div>
        )}
        {s==='visited' && (
          <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#0369A1', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Visit Complete — Raise Parts Invoice</div>
            {visit && <p style={{ fontSize:13, color:'#0369A1', marginBottom:12 }}>Finding: "{visit.observed_issue}"</p>}
            <ActionBtn label="🧾 Raise Parts Invoice" onClick={()=>onRaiseInvoice('spare_parts')} color="#0369A1" disabled={actionLoading}/>
          </div>
        )}
        {s==='parts_invoiced' && (
          <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#5B21B6', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Parts Invoice Sent</div>
            <p style={{ fontSize:13, color:'#6D28D9', marginBottom:12 }}>{amtStr(partsP?.amount_paise??0)} sent. Waiting for customer payment after repair satisfaction.</p>
            <ActionBtn label="📲 Resend Parts Invoice" onClick={onReminder} color="#6D28D9"/>
          </div>
        )}
        {s==='parts_paid' && (
          <div style={{ background:'#ECFDF5', border:'1px solid #86EFAC', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#065F46', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Final Payment Received</div>
            <p style={{ fontSize:13, color:'#047857', marginBottom:12 }}>{amtStr(partsP?.amount_paise??0)} received. Close the ticket to activate warranty.</p>
            <ActionBtn label="✅ Close Ticket & Activate Warranty" onClick={onClose} disabled={actionLoading}/>
          </div>
        )}
        {s==='closed' && (
          <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}><div style={{ width:20, height:20, background:'#16A34A', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:10 }}>✓</div><div style={{ fontSize:13, fontWeight:700, color:'#15803D' }}>Service Complete</div></div>
            {fb?.overall_rating && <div style={{ fontSize:13, color:'#16A34A' }}>Customer rated: {'★'.repeat(fb.overall_rating)}{'☆'.repeat(5-fb.overall_rating)} {fb.overall_rating}/5</div>}
            {fb?.comment && <div style={{ fontSize:12, color:'#4ADE80', fontStyle:'italic', marginTop:6 }}>"{fb.comment}"</div>}
          </div>
        )}

        {/* Payments */}
        {(visitP || partsP) && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Payments</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[visitP,partsP].filter(Boolean).map((p,i) => p && (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F9FAFB', border:'1px solid #F3F4F6', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
                  <span style={{ color:'#6B7280' }}>{p.payment_type==='visit_fee'?'Site Visit Fee':'Parts + Labour'}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontWeight:700 }}>{amtStr(p.amount_paise)}</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:p.status==='paid'?'#DCFCE7':'#FEF9C3', color:p.status==='paid'?'#15803D':'#854D0E' }}>{p.status==='paid'?'✓ Paid':'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Request Details</div>
          <R l="Mobile"         v={ticket.client_mobile}/>
          <R l="Address"        v={ticket.site_address}/>
          <R l="Duromax Install" v={ticket.duromax_installation===null?'—':ticket.duromax_installation?'Yes':'No'}/>
          <R l="Brand"          v={ticket.brand_installed}/>
          <R l="Region"         v={ticket.is_outstation?'Outstation':'Delhi NCR'}/>
          <R l="Submitted"      v={new Date(ticket.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}/>
        </div>

        {/* Timeline */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Activity</div>
          <TLItem icon="📋" title="Request received"       done={true}                       date={ticket.created_at}/>
          <TLItem icon="🧾" title="Invoice raised"         done={!!visitP}                    date={visitP?.created_at}/>
          <TLItem icon="💳" title="Visit fee paid"         done={visitP?.status==='paid'}     date={visitP?.paid_at??undefined}/>
          <TLItem icon="👤" title="Supervisor assigned"    done={!!alloc}                     date={alloc?.allocated_at}/>
          <TLItem icon="🔧" title="Site visit complete"    done={!!visit}                     date={visit?.submitted_at}/>
          <TLItem icon="📦" title="Parts invoice raised"   done={!!partsP}                    date={partsP?.created_at}/>
          <TLItem icon="💳" title="Parts payment received" done={partsP?.status==='paid'}     date={partsP?.paid_at??undefined}/>
          <TLItem icon="✅" title="Ticket closed"          done={s==='closed'}                date={ticket.updated_at}/>
        </div>
      </div>
    </div>
  )
}
