'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Ticket, Profile, TicketStatus } from '@/lib/types'
import StatusBadge from '@/components/shared/StatusBadge'
import SLABar from '@/components/shared/SLABar'
import TicketDetail from '@/components/admin/TicketDetail'
import InvoiceModal from '@/components/admin/InvoiceModal'
import AssignModal from '@/components/admin/AssignModal'
import FeedbackPanel from '@/components/admin/FeedbackPanel'
import LogoutButton from '@/components/shared/LogoutButton'
import SLASettingsModal from '@/components/admin/SLASettingsModal'

interface Props { initialTickets: Ticket[]; supervisors: Profile[]; userFullName: string }

const PIPELINE_STAGES = [
  { key:'new',            label:'Invoice Pending',   color:'var(--gold)' },
  { key:'invoiced',       label:'Invoice Sent',      color:'#6366F1' },
  { key:'paid',           label:'Assign Supervisor', color:'var(--teal)' },
  { key:'scheduled',      label:'Visit Scheduled',   color:'var(--coral)' },
  { key:'visited',        label:'Quote Pending',     color:'var(--blue)' },
  { key:'parts_invoiced', label:'Repair Invoice',    color:'var(--purple)' },
  { key:'parts_paid',     label:'Assign Installer',  color:'var(--teal-m)' },
  { key:'closed',         label:'Closed',            color:'#15803D' },
]

const CHIPS = [
  { k:'all',            l:'All' },
  { k:'new',            l:'Invoice Pending' },
  { k:'invoiced',       l:'Invoice Sent' },
  { k:'paid',           l:'Assign Staff' },
  { k:'scheduled',      l:'Staff Assigned' },
  { k:'visited',        l:'Quote Pending' },
  { k:'parts_invoiced', l:'Repair Invoice' },
  { k:'parts_paid',     l:'Assign Installer' },
  { k:'closed',         l:'Closed' },
  { k:'feedback',       l:'⭐ Feedback' },
  { k:'analytics',      l:'📊 Analytics' },
]

export default function AdminDashboard({ initialTickets, supervisors, userFullName }: Props) {
  const [tickets,      setTickets]      = useState<Ticket[]>(initialTickets)
  const [selId,        setSelId]        = useState<string|null>(null)
  const [filter,       setFilter]       = useState('all')
  const [toast,        setToast]        = useState('')
  const [toastOk,      setToastOk]      = useState(true)
  const [modalLoading, setModalLoading] = useState(false)
  const [invoiceModal, setInvoiceModal] = useState<{open:boolean;type:'visit_fee'|'spare_parts'}>({open:false,type:'visit_fee'})
  const [assignModal,  setAssignModal]  = useState(false)
  const [assignType,   setAssignType]   = useState<'supervisor'|'installer'>('supervisor')
  const [showSLAModal, setShowSLAModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const ch = supabase.channel('admin-rt-v5')
      .on('postgres_changes',{event:'*',schema:'public',table:'tickets'}, async payload => {
        if (payload.eventType==='DELETE') { setTickets(p=>p.filter(t=>t.id!==payload.old.id)); return }
        const {data} = await supabase.from('tickets')
          .select('*, supervisor_allocations(*, profiles(full_name,mobile,role)), site_visits(*), payments(*), feedback(*)')
          .eq('id',payload.new.id).single()
        if (!data) return
        setTickets(prev => { const e=prev.find(t=>t.id===data.id); return e?prev.map(t=>t.id===data.id?data:t):[data,...prev] })
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const showToast = (msg:string, ok=true) => { setToast(msg); setToastOk(ok); setTimeout(()=>setToast(''),3500) }

  const refetch = useCallback(async (id:string) => {
    const {data} = await supabase.from('tickets')
      .select('*, supervisor_allocations(*, profiles(full_name,mobile,role)), site_visits(*), payments(*), feedback(*)')
      .eq('id',id).single()
    if (data) setTickets(prev=>prev.map(t=>t.id===id?data:t))
  },[supabase])

  const sel = tickets.find(t=>t.id===selId)??null

  const stats = {
    open:    tickets.filter(t=>t.status!=='closed').length,
    revenue: tickets.reduce((s,t)=>s+(t.payments?.filter(p=>p.status==='paid').reduce((a,p)=>a+p.amount_paise,0)??0),0),
    sla:     tickets.filter(t=>t.status==='paid'&&Date.now()-new Date(t.updated_at).getTime()>48*3600*1000).length,
    rating:  (() => { const r=tickets.filter(t=>t.feedback?.overall_rating); return r.length?(r.reduce((s,t)=>s+(t.feedback?.overall_rating??0),0)/r.length).toFixed(1):null })(),
    fb:      tickets.filter(t=>t.feedback?.submitted_at).length,
  }

  const visible = filter==='all'?tickets:filter==='feedback'?tickets.filter(t=>!!t.feedback?.submitted_at):filter==='analytics'?[]:tickets.filter(t=>t.status===filter)

  async function callApi(path:string, body:object) {
    const res = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    if (!res.ok) { const d=await res.json().catch(()=>({})); showToast('❌ '+(d.error||'Error'),false); return false }
    return true
  }

  async function handleInvoice(outstation:boolean, amountPaise?:number) {
    if (!sel) return; setModalLoading(true)
    const ok = await callApi('/api/admin/invoices',{ticket_id:sel.id,payment_type:invoiceModal.type,is_outstation:outstation,amount_paise:amountPaise})
    if (ok) { await refetch(sel.id); setInvoiceModal({open:false,type:'visit_fee'}); showToast('✅ Invoice sent via WhatsApp') }
    setModalLoading(false)
  }

  async function handleAssign(supId:string, date:string, slot:string, notes:string) {
    if (!sel) return; setModalLoading(true)
    const ok = await callApi('/api/admin/allocate-supervisor',{ticket_id:sel.id,supervisor_id:supId,visit_date:date,time_slot:slot,notes})
    if (ok) { await refetch(sel.id); setAssignModal(false); showToast('✅ Staff assigned, customer notified') }
    setModalLoading(false)
  }

  async function handleMarkVisited() {
    if (!sel) return
    if (await callApi('/api/admin/mark-visited',{ticket_id:sel.id})) { await refetch(sel.id); showToast('✅ Marked as visited') }
  }

  async function handleClose() {
    if (!sel) return
    if (await callApi('/api/admin/close-ticket',{ticket_id:sel.id})) { await refetch(sel.id); showToast('✅ Ticket closed, warranty issued') }
  }

  async function handleReminder() {
    if (!sel) return
    if (await callApi('/api/admin/send-reminder',{ticket_id:sel.id})) showToast('📲 Reminder sent')
  }

  async function handleSendFeedback() {
    if (!sel) return
    if (await callApi('/api/admin/send-feedback',{ticket_id:sel.id})) { await refetch(sel.id); showToast('📩 Feedback form sent to customer') }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* TOP BAR */}
      <div style={{ background:'var(--teal)', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0, boxShadow:'0 2px 10px rgba(0,0,0,.15)', zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:34, height:34, background:'rgba(255,255,255,.14)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
          </div>
          <div className="serif" style={{ color:'white', fontSize:17 }}>Duromax Portal</div>
          <div style={{ background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.18)', color:'rgba(255,255,255,.7)', fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, letterSpacing:'.07em', textTransform:'uppercase' }}>Admin</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <a href="/dashboard/admin" style={{ color:'rgba(255,255,255,.85)', fontSize:12.5, fontWeight:600, padding:'6px 13px', borderRadius:7, background:'rgba(255,255,255,.14)', textDecoration:'none', border:'1px solid rgba(255,255,255,.18)' }}>📋 Tickets</a>
          <a href="/dashboard/staff" style={{ color:'rgba(255,255,255,.7)', fontSize:12.5, fontWeight:600, padding:'6px 13px', borderRadius:7, background:'rgba(255,255,255,.08)', textDecoration:'none', border:'1px solid rgba(255,255,255,.12)' }}>👥 Staff</a>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:'rgba(255,255,255,.5)', fontSize:12 }}>{userFullName}</span>
          <LogoutButton/>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:11, padding:'16px 20px 12px' }}>
          {[
            { n:tickets.filter(t=>t.status!=='closed').length, l:'Open Tickets', d:'Active cases', acc:'var(--teal)' },
            { n:'₹'+Math.round(stats.revenue/100).toLocaleString('en-IN'), l:'Revenue Collected', d:'All time', acc:'var(--blue)' },
            { n:stats.sla>0?`${stats.sla} ⚠️`:0, l:'SLA Breaches', d:'Needs attention', acc:stats.sla>0?'var(--coral)':'#15803D' },
            { n:stats.rating?`${stats.rating}★`:'—', l:'Avg Customer Rating', d:`${stats.fb} reviews`, acc:'var(--gold)' },
          ].map((s,i)=>(
            <div key={i} style={{ background:'white', border:'1px solid var(--border)', borderRadius:11, padding:'14px 16px', boxShadow:'var(--sh)', borderLeft:`4px solid ${s.acc}` }}>
              <div className="serif" style={{ fontSize:26, color:s.acc }}>{s.n}</div>
              <div style={{ fontSize:11.5, color:'var(--ink)', fontWeight:600, marginTop:2 }}>{s.l}</div>
              <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:2 }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* PIPELINE BOARD */}
        <div style={{ padding:'0 20px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Pipeline — Tickets by Stage</div>
          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:6 }}>
            {PIPELINE_STAGES.map(stage => {
              const cnt = tickets.filter(t=>t.status===stage.key).length
              return (
                <div key={stage.key} onClick={()=>setFilter(stage.key)} style={{ flex:'0 0 130px', background:'white', border:`1px solid ${filter===stage.key?stage.color:'var(--border)'}`, borderRadius:11, overflow:'hidden', cursor:'pointer', boxShadow:'var(--sh)', transition:'all .16s' }}>
                  <div style={{ padding:'10px 12px 8px', borderBottom:'1px solid var(--border)', borderTop:`3px solid ${stage.color}` }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', color:stage.color, marginBottom:2 }}>{stage.label}</div>
                    <div className="serif" style={{ fontSize:26, lineHeight:1, color:stage.color }}>{cnt}</div>
                  </div>
                  <div style={{ padding:'6px 10px', maxHeight:120, overflowY:'auto' }}>
                    {tickets.filter(t=>t.status===stage.key).slice(0,3).map(t => {
                      const sla = t.supervisor_allocations?.[0]
                      const hrsOld = (Date.now()-new Date(t.updated_at).getTime())/(1000*60*60)
                      const slaState = hrsOld < 24 ? 'ok' : hrsOld < 48 ? 'warn' : 'breach'
                      return (
                        <div key={t.id} onClick={e=>{e.stopPropagation();setSelId(t.id);setFilter('all')}} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:7, padding:'7px 9px', marginBottom:5, cursor:'pointer', fontSize:11 }}>
                          <div style={{ fontWeight:600, marginBottom:2 }}>{t.client_name}</div>
                          <div style={{ color:'var(--muted)', fontSize:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.complaint_description}</div>
                          <div style={{ marginTop:4 }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:2, padding:'1px 7px', borderRadius:10, fontSize:9.5, fontWeight:700, background:slaState==='ok'?'var(--teal-l)':slaState==='warn'?'var(--gold-l)':'#FEE2E2', color:slaState==='ok'?'var(--teal)':slaState==='warn'?'var(--gold)':'var(--coral)' }}>
                              {slaState==='ok'?'✓ On track':slaState==='warn'?'⚠ Due soon':'🔴 Overdue'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {cnt === 0 && <div style={{ padding:'8px 0', fontSize:10.5, color:'var(--muted)', textAlign:'center' }}>—</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CHIP FILTERS + LIST + DETAIL */}
        <div style={{ padding:'0 20px 24px', display:'grid', gridTemplateColumns:'1fr 280px 1fr', gap:14, minHeight:500 }}>

          {/* Left: chips + list */}
          <div style={{ gridColumn:'1/3' }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12, alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', gap:8 }}>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', flex:1 }}>
                  {CHIPS.map(c => (
                    <button key={c.k} onClick={()=>setFilter(c.k)} style={{ background:filter===c.k?'var(--teal-l)':'white', border:`1px solid ${filter===c.k?'var(--teal)':'var(--border)'}`, borderRadius:7, padding:'5px 11px', fontSize:11.5, fontWeight:600, cursor:'pointer', color:filter===c.k?'var(--teal)':'var(--ink)', fontFamily:'inherit', transition:'all .16s' }}>
                      {c.l} {c.k!=='feedback'?`(${c.k==='all'?tickets.length:tickets.filter(t=>t.status===c.k).length})`:''}{c.k==='feedback'?`(${stats.fb})`:''}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setShowSLAModal(true)} style={{ background:'white', border:'1px solid var(--border)', borderRadius:7, padding:'6px 13px', fontSize:12, fontWeight:600, cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', gap:5, fontFamily:'inherit', flexShrink:0, whiteSpace:'nowrap' }}>
                  ⏱ Edit SLAs
                </button>
              </div>
            </div>

            {filter === 'analytics' ? (
              <AnalyticsPanel tickets={tickets}/>
            ) : filter === 'feedback' ? (
              <FeedbackPanel tickets={tickets}/>
            ) : visible.length === 0 ? (
              <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, padding:'60px 24px', textAlign:'center', boxShadow:'var(--sh)' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--muted)' }}>No tickets in this view</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {visible.map(t => (
                  <button key={t.id} onClick={()=>setSelId(t.id)} style={{ textAlign:'left', background:selId===t.id?'var(--teal-l)':'white', border:`1.5px solid ${selId===t.id?'var(--teal)':'var(--border)'}`, borderRadius:10, padding:'11px 13px', cursor:'pointer', boxShadow:'var(--sh)', transition:'all .16s', fontFamily:'inherit' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                      <span style={{ fontSize:9.5, fontWeight:700, color:'var(--muted)', letterSpacing:'.06em' }}>{t.ticket_number}</span>
                      <StatusBadge status={t.status}/>
                    </div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'var(--ink)', marginBottom:2 }}>{t.client_name}</div>
                    <div style={{ fontSize:11.5, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.complaint_description}</div>
                    <div style={{ fontSize:10.5, color:'var(--border)', marginTop:6 }}>{new Date(t.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: detail */}
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, overflow:'hidden', boxShadow:'var(--sh)', maxHeight:'80vh', overflowY:'auto' }}>
            {sel ? (
              <TicketDetail ticket={sel} onRaiseInvoice={type=>setInvoiceModal({open:true,type})} onAssign={()=>{ setAssignType('supervisor'); setAssignModal(true) }} onMarkVisited={handleMarkVisited} onClose={handleClose} onReminder={handleReminder} onSendFeedback={handleSendFeedback} actionLoading={modalLoading}/>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', color:'var(--muted)' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
                <div style={{ fontSize:14, fontWeight:600 }}>Select a ticket</div>
                <div style={{ fontSize:12, color:'var(--border)', marginTop:4 }}>Click any ticket to view details and take action</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {invoiceModal.open && sel && <InvoiceModal ticket={sel} type={invoiceModal.type} onConfirm={handleInvoice} onClose={()=>setInvoiceModal({open:false,type:'visit_fee'})} loading={modalLoading}/>}
      {assignModal && sel && <AssignModal ticket={sel} supervisors={supervisors} assignType={assignType} onConfirm={handleAssign} onClose={()=>setAssignModal(false)} loading={modalLoading}/>}
      {showSLAModal && <SLASettingsModal onClose={()=>setShowSLAModal(false)}/>}

      {toast && (
        <div style={{ position:'fixed', bottom:22, right:22, background:toastOk?'var(--ink)':'var(--coral)', color:'white', fontSize:13, fontWeight:600, padding:'10px 18px', borderRadius:9, boxShadow:'var(--sh-lg)', zIndex:999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ── Analytics Panel ────────────────────────────────────────────
function AnalyticsPanel({ tickets }: { tickets: Ticket[] }) {
  const STATUS_ORDER: TicketStatus[] = ['new','invoiced','paid','scheduled','visited','parts_invoiced','parts_paid','closed']
  const STATUS_LABELS: Record<TicketStatus, string> = {
    new:'Invoice Pending', invoiced:'Invoice Sent', paid:'Assign Staff',
    scheduled:'Scheduled', visited:'Quote Pending', parts_invoiced:'Repair Invoice',
    parts_paid:'Assign Installer', closed:'Closed',
  }
  const STATUS_COLORS: Record<TicketStatus, string> = {
    new:'var(--gold)', invoiced:'#6366F1', paid:'var(--teal)', scheduled:'var(--coral)',
    visited:'var(--blue)', parts_invoiced:'var(--purple)', parts_paid:'var(--teal-m)', closed:'#15803D',
  }

  // Tickets by stage
  const stageCounts = STATUS_ORDER.map(s => ({ s, label:STATUS_LABELS[s], color:STATUS_COLORS[s], count:tickets.filter(t=>t.status===s).length }))
  const maxCount = Math.max(...stageCounts.map(x=>x.count), 1)

  // Revenue split: visit fees vs repair invoices (paid only)
  const visitRevPaise  = tickets.reduce((sum,t)=>sum+(t.payments?.filter(p=>p.payment_type==='visit_fee'&&p.status==='paid').reduce((a,p)=>a+p.amount_paise,0)??0),0)
  const repairRevPaise = tickets.reduce((sum,t)=>sum+(t.payments?.filter(p=>p.payment_type==='spare_parts'&&p.status==='paid').reduce((a,p)=>a+p.amount_paise,0)??0),0)
  const totalRevPaise  = visitRevPaise + repairRevPaise
  const fmt = (p:number) => '₹'+(p/100).toLocaleString('en-IN')

  // Rating distribution (1–5 stars)
  const ratedTickets = tickets.filter(t=>t.feedback?.overall_rating)
  const ratingCounts = [5,4,3,2,1].map(star => ({ star, count:ratedTickets.filter(t=>t.feedback?.overall_rating===star).length }))
  const maxRating = Math.max(...ratingCounts.map(x=>x.count), 1)

  // Monthly ticket volume — last 6 months
  const now = new Date()
  const months = Array.from({length:6}, (_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1)
    return { label:d.toLocaleDateString('en-IN',{month:'short',year:'2-digit'}), year:d.getFullYear(), month:d.getMonth() }
  })
  const monthCounts = months.map(m => ({
    ...m,
    count: tickets.filter(t => { const d=new Date(t.created_at); return d.getFullYear()===m.year && d.getMonth()===m.month }).length,
  }))
  const maxMonth = Math.max(...monthCounts.map(x=>x.count), 1)

  const ChartCard = ({title, children}: {title:string; children:React.ReactNode}) => (
    <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, padding:'18px 20px', boxShadow:'var(--sh)' }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:16 }}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Row 1: Stage distribution + Monthly volume */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        <ChartCard title="Tickets by Stage">
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {stageCounts.map(({ s, label, color, count }) => (
              <div key={s}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:3 }}>
                  <span style={{ color:'var(--ink)', fontWeight:500 }}>{label}</span>
                  <span style={{ fontWeight:700, color }}>{count}</span>
                </div>
                <div style={{ background:'var(--bg)', borderRadius:4, height:7, overflow:'hidden' }}>
                  <div style={{ width:`${(count/maxCount)*100}%`, height:'100%', background:color, borderRadius:4, transition:'width .4s ease', minWidth: count>0?6:0 }}/>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Monthly Ticket Volume (Last 6 Months)">
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:120 }}>
            {monthCounts.map((m,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%', gap:3 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--teal)' }}>{m.count||''}</span>
                <div style={{ width:'100%', background:m.count>0?'var(--teal)':'var(--border)', borderRadius:'4px 4px 0 0', height:`${Math.max((m.count/maxMonth)*100,4)}%`, transition:'height .4s ease' }}/>
                <span style={{ fontSize:9.5, color:'var(--muted)', textAlign:'center', whiteSpace:'nowrap' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Revenue split + Rating distribution */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        <ChartCard title="Revenue Collected">
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[{l:'Site Visit Fees', v:visitRevPaise, c:'var(--teal)'},{l:'Repair Invoices', v:repairRevPaise, c:'var(--blue)'}].map(item=>(
                <div key={item.l} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:9, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{item.l}</div>
                  <div className="serif" style={{ fontSize:20, color:item.c }}>{fmt(item.v)}</div>
                </div>
              ))}
            </div>
            {totalRevPaise > 0 && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:4 }}>
                  <span>Visit Fees</span><span>Repair</span>
                </div>
                <div style={{ display:'flex', height:10, borderRadius:6, overflow:'hidden', gap:1 }}>
                  <div style={{ width:`${(visitRevPaise/totalRevPaise)*100}%`, background:'var(--teal)', borderRadius:'6px 0 0 6px' }}/>
                  <div style={{ flex:1, background:'var(--blue)', borderRadius:'0 6px 6px 0' }}/>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)', marginTop:8 }}>Total: {fmt(totalRevPaise)}</div>
              </div>
            )}
            {totalRevPaise === 0 && <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center', padding:'12px 0' }}>No payments collected yet</div>}
          </div>
        </ChartCard>

        <ChartCard title="Customer Rating Distribution">
          {ratedTickets.length === 0 ? (
            <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center', padding:'24px 0' }}>No ratings yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>
                Avg: <strong style={{ color:'var(--gold)', fontSize:13 }}>{(ratedTickets.reduce((s,t)=>s+(t.feedback?.overall_rating??0),0)/ratedTickets.length).toFixed(1)} ★</strong> &nbsp;·&nbsp; {ratedTickets.length} review{ratedTickets.length!==1?'s':''}
              </div>
              {ratingCounts.map(({ star, count }) => (
                <div key={star} style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <span style={{ fontSize:12, color:'var(--gold-m)', flexShrink:0, width:16, textAlign:'right' }}>{star}★</span>
                  <div style={{ flex:1, background:'var(--bg)', borderRadius:4, height:10, overflow:'hidden' }}>
                    <div style={{ width:`${(count/maxRating)*100}%`, height:'100%', background:'var(--gold-m)', borderRadius:4, transition:'width .4s ease', minWidth:count>0?6:0 }}/>
                  </div>
                  <span style={{ fontSize:11, color:'var(--muted)', flexShrink:0, width:16 }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Open vs Closed summary */}
      <ChartCard title="Ticket Overview">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:11 }}>
          {[
            { l:'Total Tickets', v:tickets.length, c:'var(--ink)' },
            { l:'Open', v:tickets.filter(t=>t.status!=='closed').length, c:'var(--coral)' },
            { l:'Closed', v:tickets.filter(t=>t.status==='closed').length, c:'#15803D' },
            { l:'Feedback Received', v:tickets.filter(t=>t.feedback?.submitted_at).length, c:'var(--gold)' },
          ].map(item => (
            <div key={item.l} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:9, padding:'12px 14px', textAlign:'center' }}>
              <div className="serif" style={{ fontSize:28, color:item.c }}>{item.v}</div>
              <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:4, fontWeight:600 }}>{item.l}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
