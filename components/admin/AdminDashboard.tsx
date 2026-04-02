'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Ticket, Profile, TicketStatus } from '@/lib/types'
import StatusBadge from '@/components/shared/StatusBadge'
import TicketDetail from '@/components/admin/TicketDetail'
import InvoiceModal from '@/components/admin/InvoiceModal'
import AssignModal from '@/components/admin/AssignModal'
import FeedbackPanel from '@/components/admin/FeedbackPanel'
import LogoutButton from '@/components/shared/LogoutButton'

interface Props { initialTickets: Ticket[]; supervisors: Profile[]; userFullName: string }

const FILTERS = [
  { key:'all',            label:'All',             icon:'◉' },
  { key:'new',            label:'Raise Invoice',   icon:'🆕' },
  { key:'invoiced',       label:'Awaiting Pay',    icon:'⏳' },
  { key:'paid',           label:'Assign Staff',    icon:'💳' },
  { key:'scheduled',      label:'Scheduled',       icon:'📅' },
  { key:'visited',        label:'Visit Done',      icon:'✅' },
  { key:'parts_invoiced', label:'Parts Invoice',   icon:'📦' },
  { key:'parts_paid',     label:'Ready to Close',  icon:'💰' },
  { key:'closed',         label:'Closed',          icon:'🔒' },
  { key:'feedback',       label:'Feedback',        icon:'⭐' },
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
  const supabase = createClient()

  useEffect(() => {
    const ch = supabase.channel('admin-rt')
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

  const sel = tickets.find(t=>t.id===selId) ?? null

  const stats = {
    open:    tickets.filter(t=>t.status!=='closed').length,
    revenue: tickets.reduce((s,t)=>s+(t.payments?.filter(p=>p.status==='paid').reduce((a,p)=>a+p.amount_paise,0)??0),0),
    sla:     tickets.filter(t=>t.status==='paid'&&Date.now()-new Date(t.updated_at).getTime()>48*3600*1000).length,
    rating:  (() => { const r=tickets.filter(t=>t.feedback?.overall_rating); return r.length?(r.reduce((s,t)=>s+(t.feedback?.overall_rating??0),0)/r.length).toFixed(1):null })(),
    fb:      tickets.filter(t=>t.feedback?.submitted_at).length,
  }

  const getCount = (k:string) => k==='all'?tickets.length:k==='feedback'?stats.fb:tickets.filter(t=>t.status===k).length
  const visible  = filter==='all'?tickets:filter==='feedback'?tickets.filter(t=>!!t.feedback?.submitted_at):tickets.filter(t=>t.status===filter)

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
    const ok = await callApi('/api/admin/mark-visited',{ticket_id:sel.id})
    if (ok) { await refetch(sel.id); showToast('✅ Marked as visited') }
  }

  async function handleClose() {
    if (!sel) return
    const ok = await callApi('/api/admin/close-ticket',{ticket_id:sel.id})
    if (ok) { await refetch(sel.id); showToast('✅ Ticket closed, warranty issued') }
  }

  async function handleReminder() {
    if (!sel) return
    const ok = await callApi('/api/admin/send-reminder',{ticket_id:sel.id})
    if (ok) showToast('📲 Reminder sent')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#F2F4F8' }}>

      {/* TOP BAR */}
      <div style={{ background:'linear-gradient(135deg,#0A5C48,#0D7A60)', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0, boxShadow:'0 2px 8px rgba(10,92,72,0.2)', zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:'rgba(255,255,255,0.15)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
          </div>
          <div>
            <div style={{ color:'white', fontWeight:700, fontSize:13, lineHeight:1.2 }}>Duromax Portal</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Admin</div>
          </div>
        </div>
        {/* NAV LINKS */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <a href="/dashboard/admin" style={{ color:'rgba(255,255,255,0.85)', fontSize:12.5, fontWeight:600, padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.12)', textDecoration:'none', border:'1px solid rgba(255,255,255,0.15)', transition:'all 0.15s' }}>📋 Tickets</a>
          <a href="/dashboard/staff" style={{ color:'rgba(255,255,255,0.85)', fontSize:12.5, fontWeight:600, padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.08)', textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)', transition:'all 0.15s' }}>👥 Staff</a>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{userFullName}</span>
          <LogoutButton/>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, padding:'14px 18px 10px', flexShrink:0 }}>
        {[
          { n:stats.open,                                          l:'Open Tickets',     accent:'#0A5C48', bg:'#ECFDF5' },
          { n:'₹'+Math.round(stats.revenue/100).toLocaleString('en-IN'), l:'Revenue',   accent:'#1D4ED8', bg:'#EFF6FF' },
          { n:stats.sla>0?`${stats.sla} ⚠️`:stats.sla,            l:'SLA Breaches',    accent:stats.sla>0?'#DC2626':'#15803D', bg:stats.sla>0?'#FEF2F2':'#F0FDF4' },
          { n:stats.rating?`${stats.rating}★`:'—',                l:`Avg Rating · ${stats.fb} reviews`, accent:'#B45309', bg:'#FFFBEB' },
        ].map((s,i)=>(
          <div key={i} style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', borderLeft:`4px solid ${s.accent}` }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.accent }}>{s.n}</div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* MAIN 3-COL */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'200px 260px 1fr', gap:10, padding:'0 18px 14px', minHeight:0, overflow:'hidden' }}>

        {/* Filters */}
        <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding:'12px 14px 8px', fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em' }}>Filters</div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {FILTERS.map(f=>{
              const cnt=getCount(f.key); const isAct=filter===f.key
              return (
                <button key={f.key} onClick={()=>setFilter(f.key)} style={{ width:'100%', textAlign:'left', padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', border:'none', background:isAct?'#ECFDF5':'transparent', color:isAct?'#065F46':'#374151', fontSize:12.5, fontWeight:isAct?700:500, cursor:'pointer', borderLeft:isAct?'3px solid #0A5C48':'3px solid transparent', transition:'all 0.15s' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:7 }}><span>{f.icon}</span>{f.label}</span>
                  <span style={{ background:isAct?'#0A5C48':'#F3F4F6', color:isAct?'white':'#9CA3AF', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:20 }}>{cnt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Ticket list */}
        <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding:'12px 14px 8px', fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:'1px solid #F3F4F6', flexShrink:0 }}>
            {visible.length} ticket{visible.length!==1?'s':''}
          </div>
          {filter==='feedback' ? (
            <div style={{ flex:1, overflowY:'auto', padding:10 }}><FeedbackPanel tickets={tickets}/></div>
          ) : visible.length===0 ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
              <div style={{ fontSize:13, color:'#9CA3AF', fontWeight:600 }}>No tickets</div>
            </div>
          ) : (
            <div style={{ flex:1, overflowY:'auto', padding:8 }}>
              {visible.map(t=>(
                <button key={t.id} onClick={()=>setSelId(t.id)} style={{ width:'100%', textAlign:'left', background:selId===t.id?'#F0FDF9':'white', border:selId===t.id?'1.5px solid #0A5C48':'1.5px solid #F3F4F6', borderRadius:11, padding:'11px 13px', marginBottom:5, cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'#9CA3AF' }}>{t.ticket_number}</span>
                    <StatusBadge status={t.status}/>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:2 }}>{t.client_name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.complaint_description}</div>
                  <div style={{ fontSize:10, color:'#D1D5DB', marginTop:5 }}>{new Date(t.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          {sel ? (
            <div style={{ flex:1, overflowY:'auto' }}>
              <TicketDetail ticket={sel} onRaiseInvoice={type=>setInvoiceModal({open:true,type})} onAssign={()=>setAssignModal(true)} onMarkVisited={handleMarkVisited} onClose={handleClose} onReminder={handleReminder} actionLoading={modalLoading}/>
            </div>
          ) : (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#D1D5DB' }}>
              <div style={{ fontSize:44, marginBottom:10 }}>📋</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#9CA3AF' }}>Select a ticket</div>
              <div style={{ fontSize:12, color:'#D1D5DB', marginTop:3 }}>Click any ticket to view details and take action</div>
            </div>
          )}
        </div>
      </div>

      {/* Modals — rendered at root level, above everything */}
      {invoiceModal.open && sel && (
        <InvoiceModal ticket={sel} type={invoiceModal.type} onConfirm={handleInvoice} onClose={()=>setInvoiceModal({open:false,type:'visit_fee'})} loading={modalLoading}/>
      )}
      {assignModal && sel && (
        <AssignModal ticket={sel} supervisors={supervisors} onConfirm={handleAssign} onClose={()=>setAssignModal(false)} loading={modalLoading}/>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:toastOk?'#0A5C48':'#DC2626', color:'white', fontSize:13, fontWeight:600, padding:'12px 20px', borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,0.2)', zIndex:1000 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
