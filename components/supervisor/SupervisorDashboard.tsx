'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SiteReportForm from './SiteReportForm'
import LogoutButton from '@/components/shared/LogoutButton'
import type { StaffStats } from '@/lib/types'

interface Ticket { id:string; ticket_number:string; client_name:string; client_mobile:string; site_address:string; complaint_description:string; status:string }
interface Alloc  { id:string; visit_date:string; time_slot:string; notes:string|null; ticket_id:string; tickets:Ticket }

interface Props {
  supervisorName:     string
  supervisorRole:     'supervisor'|'installer'
  initialAllocations: Alloc[]
  initialStats:       StaffStats
}

export default function SupervisorDashboard({ supervisorName, supervisorRole, initialAllocations, initialStats }: Props) {
  const [allocations, setAllocations] = useState<Alloc[]>(initialAllocations)
  const [stats,       setStats]       = useState<StaffStats>(initialStats)
  const [selected,    setSelected]    = useState<Alloc|null>(null)
  const [tab,         setTab]         = useState('overview')
  const [toast,       setToast]       = useState('')
  const supabase = createClient()

  useEffect(() => {
    const ch = supabase.channel('sup-rt-v5')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'tickets'}, payload => {
        setAllocations(prev => prev.map(a =>
          a.ticket_id === payload.new.id ? { ...a, tickets:{ ...a.tickets, status:payload.new.status } } : a
        ))
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const pending   = allocations.filter(a => !['closed','visited'].includes(a.tickets?.status))
  const completed = allocations.filter(a => a.tickets?.status === 'closed')
  const isInstaller = supervisorRole === 'installer'

  if (selected) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'var(--teal)', height:60, display:'flex', alignItems:'center', padding:'0 20px', gap:12, boxShadow:'0 2px 10px rgba(0,0,0,.15)' }}>
        <button onClick={()=>setSelected(null)} style={{ background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', color:'white', fontSize:13, fontWeight:600, padding:'6px 14px', borderRadius:7, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
        <div className="serif" style={{ color:'white', fontSize:16 }}>Site Visit Report</div>
      </div>
      <div style={{ maxWidth:580, margin:'0 auto', padding:'20px 16px 40px' }}>
        <SiteReportForm allocation={selected} onSubmitted={()=>{
          setAllocations(prev => prev.map(a => a.id===selected.id?{...a,tickets:{...a.tickets,status:'visited'}}:a))
          setStats(s => ({...s, in_progress: Math.max(0,s.in_progress-1)}))
          setSelected(null)
          showToast('✅ Report submitted! Admin has been notified.')
        }}/>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ background:'var(--teal)', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', boxShadow:'0 2px 10px rgba(0,0,0,.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'rgba(255,255,255,.14)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{isInstaller?'🛠️':'🔧'}</div>
          <div>
            <div className="serif" style={{ color:'white', fontSize:16, lineHeight:1.2 }}>{supervisorName}</div>
            <div style={{ color:'rgba(255,255,255,.5)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{isInstaller?'Installer':'Supervisor'}</div>
          </div>
        </div>
        <LogoutButton/>
      </div>

      {/* Tabs */}
      <div style={{ background:'white', borderBottom:'1px solid var(--border)', display:'flex', padding:'0 20px' }}>
        {[{k:'overview',l:'Overview'},{k:'pending',l:`Pending (${pending.length})`},{k:'completed',l:`Completed (${completed.length})`}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{ padding:'13px 16px', background:'none', border:'none', borderBottom:`2px solid ${tab===t.k?'var(--teal)':'transparent'}`, color:tab===t.k?'var(--teal)':'var(--muted)', fontWeight:tab===t.k?700:500, fontSize:13.5, cursor:'pointer', fontFamily:'inherit', transition:'all .16s', marginBottom:-1 }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'20px 16px 48px' }}>

        {tab === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                {n:stats.total_assigned, l:'Total Assigned', icon:'📋', acc:'var(--ink)'},
                {n:stats.total_closed,   l:'Completed',      icon:'✅', acc:'var(--teal)'},
                {n:stats.in_progress,    l:'In Progress',    icon:'⚡', acc:'var(--blue)'},
                {n:stats.this_month,     l:'This Month',     icon:'📅', acc:'var(--purple)'},
              ].map((s,i)=>(
                <div key={i} style={{ background:'white', border:'1px solid var(--border)', borderRadius:11, padding:'14px 16px', boxShadow:'var(--sh)' }}>
                  <div style={{ fontSize:20, marginBottom:5 }}>{s.icon}</div>
                  <div className="serif" style={{ fontSize:28, color:s.acc }}>{s.n}</div>
                  <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Rating card */}
            <div style={{ background:'linear-gradient(135deg,var(--gold-l),#FAE8B4)', border:'1px solid #F0D090', borderRadius:11, padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Customer Rating</div>
                  <div className="serif" style={{ fontSize:36, color:'var(--gold)' }}>{stats.avg_rating ? `${stats.avg_rating}★` : '—'}</div>
                  <div style={{ fontSize:12, color:'var(--gold)', marginTop:3, opacity:.75 }}>From customer feedback</div>
                </div>
                {stats.avg_rating && <div style={{ fontSize:28, color:'var(--gold-m)' }}>{'★'.repeat(Math.round(stats.avg_rating))}<span style={{ color:'#F0D090' }}>{'★'.repeat(5-Math.round(stats.avg_rating))}</span></div>}
              </div>
            </div>

            {/* Recent tickets */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>Recent Visits</div>
              {allocations.slice(0,3).map(a=><VisitCard key={a.id} alloc={a} onTap={()=>!['closed','visited'].includes(a.tickets?.status)&&setSelected(a)}/>)}
              {allocations.length===0 && <EmptyState icon="📋" msg="No visits assigned yet" sub="Admin will assign visits here."/>}
              {allocations.length > 3 && <button onClick={()=>setTab('pending')} style={{ width:'100%', marginTop:8, background:'none', border:'1px solid var(--border)', borderRadius:9, padding:'10px', fontSize:13, color:'var(--muted)', cursor:'pointer', fontFamily:'inherit' }}>View all {allocations.length} tickets →</button>}
            </div>
          </div>
        )}

        {tab === 'pending' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pending.length===0 ? <EmptyState icon="✅" msg="All caught up!" sub="No pending visits right now."/> : pending.map(a=><VisitCard key={a.id} alloc={a} onTap={()=>setSelected(a)} showCta/>)}
          </div>
        )}

        {tab === 'completed' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {completed.length===0 ? <EmptyState icon="📋" msg="No completed tickets yet"/> : completed.map(a=><VisitCard key={a.id} alloc={a} onTap={()=>{}} done/>)}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:16, right:16, background:'var(--ink)', color:'white', fontSize:14, fontWeight:600, padding:'13px 20px', borderRadius:12, boxShadow:'var(--sh-lg)', textAlign:'center', zIndex:99 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function EmptyState({icon,msg,sub=''}: {icon:string;msg:string;sub?:string}) {
  return (
    <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, padding:'52px 24px', textAlign:'center', boxShadow:'var(--sh)' }}>
      <div style={{ fontSize:40, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--muted)' }}>{msg}</div>
      {sub && <div style={{ fontSize:12.5, color:'var(--border)', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

const STATUS_CFG: Record<string,{label:string;bg:string;color:string;bdr:string}> = {
  new:            {label:'Invoice Pending',  bg:'var(--gold-l)',   color:'var(--gold)',   bdr:'#F0D090'},
  invoiced:       {label:'Invoice Sent',     bg:'#EEF2FF',         color:'#3730A3',       bdr:'#A5B4FC'},
  paid:           {label:'Paid',             bg:'var(--teal-l)',   color:'var(--teal)',   bdr:'#9FD8C4'},
  scheduled:      {label:'Visit Scheduled',  bg:'var(--coral-l)',  color:'var(--coral)',  bdr:'#F0B4A0'},
  visited:        {label:'Report Filed',     bg:'var(--blue-l)',   color:'var(--blue)',   bdr:'#90B8E8'},
  parts_invoiced: {label:'Invoice Sent',     bg:'#F0EFFE',         color:'var(--purple)', bdr:'#C4B5FD'},
  parts_paid:     {label:'Repair Scheduled', bg:'var(--teal-l)',   color:'var(--teal)',   bdr:'#9FD8C4'},
  closed:         {label:'Closed ✓',         bg:'#F0FAF6',         color:'#15803D',       bdr:'#86EFAC'},
}

function VisitCard({alloc,onTap,done=false,showCta=false}: {alloc:Alloc;onTap:()=>void;done?:boolean;showCta?:boolean}) {
  const t  = alloc.tickets
  const st = STATUS_CFG[t?.status] ?? {label:t?.status,bg:'var(--bg)',color:'var(--muted)',bdr:'var(--border)'}
  return (
    <div onClick={onTap} style={{ background:'white', border:`1.5px solid ${done?'#86EFAC':'var(--border)'}`, borderRadius:13, padding:'14px 16px', cursor:done?'default':'pointer', boxShadow:'var(--sh)', transition:'all .16s' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:7 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', letterSpacing:'.06em' }}>{t?.ticket_number}</div>
        <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.bdr}`, fontSize:10.5, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>{st.label}</span>
      </div>
      <div className="serif" style={{ fontSize:15, color:'var(--ink)', marginBottom:3 }}>{t?.client_name}</div>
      <div style={{ fontSize:12.5, color:'var(--muted)', marginBottom:7 }}>📍 {t?.site_address}</div>
      <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--muted)' }}>
        <span>📅 {new Date(alloc.visit_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
        <span>⏰ {alloc.time_slot}</span>
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginTop:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t?.complaint_description}</div>
      {showCta && (
        <div style={{ marginTop:10, background:'var(--teal-l)', border:'1px solid #9FD8C4', borderRadius:8, padding:'8px 12px', fontSize:12.5, fontWeight:700, color:'var(--teal)', display:'flex', justifyContent:'space-between' }}>
          <span>Tap to file visit report</span><span>→</span>
        </div>
      )}
    </div>
  )
}
