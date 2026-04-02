'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SiteReportForm from './SiteReportForm'
import LogoutButton from '@/components/shared/LogoutButton'
import type { StaffStats } from '@/lib/types'

interface Ticket { id:string; ticket_number:string; client_name:string; client_mobile:string; site_address:string; complaint_description:string; status:string }
interface Alloc  { id:string; visit_date:string; time_slot:string; notes:string|null; ticket_id:string; tickets:Ticket }

interface Props {
  supervisorName:    string
  supervisorRole:    'supervisor'|'installer'
  initialAllocations: Alloc[]
  initialStats:      StaffStats
}

const STATUS_LABEL: Record<string, { label:string; bg:string; color:string; border:string }> = {
  new:            { label:'New',             bg:'#FFFBEB', color:'#92400E', border:'#FCD34D' },
  invoiced:       { label:'Invoice Sent',    bg:'#EEF2FF', color:'#3730A3', border:'#A5B4FC' },
  paid:           { label:'Paid',            bg:'#EFF6FF', color:'#1D4ED8', border:'#93C5FD' },
  scheduled:      { label:'Visit Scheduled', bg:'#FFF7ED', color:'#C2410C', border:'#FDC68A' },
  visited:        { label:'Report Filed',    bg:'#F0F9FF', color:'#0369A1', border:'#7DD3FC' },
  parts_invoiced: { label:'Parts Invoice',   bg:'#F5F3FF', color:'#5B21B6', border:'#C4B5FD' },
  parts_paid:     { label:'Parts Paid',      bg:'#ECFDF5', color:'#065F46', border:'#6EE7B7' },
  closed:         { label:'Closed ✓',        bg:'#F0FDF4', color:'#15803D', border:'#86EFAC' },
}

const TABS = ['overview','pending','completed']

export default function SupervisorDashboard({ supervisorName, supervisorRole, initialAllocations, initialStats }: Props) {
  const [allocations, setAllocations] = useState<Alloc[]>(initialAllocations)
  const [stats,       setStats]       = useState<StaffStats>(initialStats)
  const [selected,    setSelected]    = useState<Alloc|null>(null)
  const [tab,         setTab]         = useState('overview')
  const [toast,       setToast]       = useState('')

  const supabase = createClient()

  // ── Realtime subscription ─────────────────────────────────
  // When admin changes a ticket (e.g. payment confirmed → next step),
  // this fires and updates the supervisor's view instantly
  useEffect(() => {
    const channel = supabase
      .channel('supervisor-rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, payload => {
        setAllocations(prev => prev.map(a =>
          a.ticket_id === payload.new.id
            ? { ...a, tickets: { ...a.tickets, status: payload.new.status } }
            : a
        ))
        // Recalculate stats
        setAllocations(current => {
          const closed     = current.filter(a => a.tickets?.status === 'closed').length
          const inProgress = current.filter(a => a.tickets && a.tickets.status !== 'closed').length
          setStats(s => ({ ...s, total_closed: closed, in_progress: inProgress }))
          return current
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const pending   = allocations.filter(a => a.tickets?.status !== 'closed' && a.tickets?.status !== 'visited')
  const completed = allocations.filter(a => a.tickets?.status === 'closed')
  const role      = supervisorRole === 'installer' ? '🛠️ Installer' : '🔧 Supervisor'

  if (selected) return (
    <div style={{ minHeight:'100vh', background:'#F2F4F8' }}>
      <div style={{ background:'linear-gradient(135deg,#0A5C48,#0D7A60)', height:58, display:'flex', alignItems:'center', padding:'0 20px', gap:12, boxShadow:'0 2px 8px rgba(10,92,72,0.2)' }}>
        <button onClick={()=>setSelected(null)} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'white', fontSize:13, fontWeight:600, padding:'6px 14px', borderRadius:8, cursor:'pointer' }}>← Back</button>
        <div style={{ color:'white', fontWeight:700, fontSize:14 }}>Site Visit Report</div>
      </div>
      <div style={{ maxWidth:580, margin:'0 auto', padding:'20px 16px 40px' }}>
        <SiteReportForm
          allocation={selected}
          onSubmitted={() => {
            setAllocations(prev => prev.map(a => a.id===selected.id ? { ...a, tickets:{...a.tickets,status:'visited'} } : a))
            setStats(s => ({ ...s, total_closed: s.total_closed, in_progress: Math.max(0, s.in_progress - 1) }))
            setSelected(null)
            showToast('✅ Report submitted! Admin has been notified.')
          }}
        />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F2F4F8' }}>
      {/* Top bar */}
      <div style={{ background:'linear-gradient(135deg,#0A5C48,#0D7A60)', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', boxShadow:'0 2px 8px rgba(10,92,72,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:'rgba(255,255,255,0.15)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{supervisorRole==='installer'?'🛠️':'🔧'}</div>
          <div>
            <div style={{ color:'white', fontWeight:700, fontSize:14, lineHeight:1.2 }}>{supervisorName}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10 }}>{role}</div>
          </div>
        </div>
        <LogoutButton/>
      </div>

      {/* Tabs */}
      <div style={{ background:'white', borderBottom:'1px solid #E5E7EB', display:'flex', padding:'0 20px' }}>
        {[{ k:'overview', l:'Overview' },{ k:'pending', l:`Pending (${pending.length})` },{ k:'completed', l:`Completed (${completed.length})` }].map(t => (
          <button key={t.k} onClick={()=>setTab(t.k)} style={{ padding:'14px 16px', background:'none', border:'none', borderBottom: tab===t.k?'2px solid #0A5C48':'2px solid transparent', color: tab===t.k?'#0A5C48':'#9CA3AF', fontWeight: tab===t.k?700:500, fontSize:13.5, cursor:'pointer', marginBottom:-1, transition:'all 0.15s' }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'20px 16px 48px' }}>

        {/* OVERVIEW TAB */}
        {tab==='overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { n: stats.total_assigned, l:'Total Assigned', icon:'📋', color:'#374151', bg:'white' },
                { n: stats.total_closed,   l:'Completed',      icon:'✅', color:'#065F46', bg:'#F0FDF4' },
                { n: stats.in_progress,    l:'In Progress',    icon:'⚡', color:'#1D4ED8', bg:'#EFF6FF' },
                { n: stats.this_month,     l:'This Month',     icon:'📅', color:'#6D28D9', bg:'#F5F3FF' },
              ].map((s,i) => (
                <div key={i} style={{ background:s.bg, border:'1px solid #E5E7EB', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:30, fontWeight:800, color:s.color }}>{s.n}</div>
                  <div style={{ fontSize:12, color:'#9CA3AF', marginTop:3 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Rating card */}
            <div style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border:'1px solid #FCD34D', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Your Customer Rating</div>
                  <div style={{ fontSize:36, fontWeight:800, color:'#B45309' }}>{stats.avg_rating ? `${stats.avg_rating}★` : '—'}</div>
                  <div style={{ fontSize:12, color:'#92400E', marginTop:3 }}>Based on customer feedback</div>
                </div>
                {stats.avg_rating && (
                  <div style={{ fontSize:28, color:'#FBBF24' }}>
                    {'★'.repeat(Math.round(stats.avg_rating))}<span style={{ color:'#FDE68A' }}>{'★'.repeat(5-Math.round(stats.avg_rating))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent tickets */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Recent Tickets</div>
              {allocations.slice(0,3).map(a => <TicketCard key={a.id} alloc={a} onTap={()=>{if(a.tickets.status!=='closed'&&a.tickets.status!=='visited')setSelected(a)}}/>)}
              {allocations.length===0 && (
                <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:14, padding:'40px 24px', textAlign:'center' }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#9CA3AF' }}>No visits assigned yet</div>
                </div>
              )}
              {allocations.length > 3 && <button onClick={()=>setTab('pending')} style={{ width:'100%', marginTop:8, background:'none', border:'1px solid #E5E7EB', borderRadius:10, padding:'10px', fontSize:13, color:'#9CA3AF', cursor:'pointer', fontFamily:'inherit' }}>View all {allocations.length} tickets →</button>}
            </div>
          </div>
        )}

        {/* PENDING TAB */}
        {tab==='pending' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pending.length===0 ? (
              <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:14, padding:'56px 24px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#9CA3AF' }}>All caught up!</div>
              </div>
            ) : pending.map(a => (
              <TicketCard key={a.id} alloc={a} onTap={()=>setSelected(a)} showAction/>
            ))}
          </div>
        )}

        {/* COMPLETED TAB */}
        {tab==='completed' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {completed.length===0 ? (
              <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:14, padding:'56px 24px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#9CA3AF' }}>No completed tickets yet</div>
              </div>
            ) : completed.map(a => (
              <TicketCard key={a.id} alloc={a} onTap={()=>{}} done/>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:16, right:16, background:'#0A5C48', color:'white', fontSize:14, fontWeight:600, padding:'14px 20px', borderRadius:14, boxShadow:'0 8px 30px rgba(0,0,0,0.2)', textAlign:'center', zIndex:99 }}>{toast}</div>
      )}
    </div>
  )
}

function TicketCard({ alloc, onTap, done=false, showAction=false }: { alloc:Alloc; onTap:()=>void; done?:boolean; showAction?:boolean }) {
  const t   = alloc.tickets
  const st  = STATUS_LABEL[t?.status] ?? { label: t?.status, bg:'#F3F4F6', color:'#374151', border:'#E5E7EB' }
  return (
    <div onClick={onTap} style={{ background:'white', border:`1.5px solid ${done?'#86EFAC':'#E5E7EB'}`, borderRadius:14, padding:'15px 18px', cursor: done?'default':'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', transition:'all 0.15s' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:7 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.05em' }}>{t?.ticket_number}</div>
        <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}`, fontSize:10.5, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>{st.label}</span>
      </div>
      <div style={{ fontSize:14.5, fontWeight:700, color:'#111827', marginBottom:3 }}>{t?.client_name}</div>
      <div style={{ fontSize:12.5, color:'#6B7280', marginBottom:7 }}>📍 {t?.site_address}</div>
      <div style={{ display:'flex', gap:12, fontSize:12, color:'#9CA3AF' }}>
        <span>📅 {new Date(alloc.visit_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
        <span>⏰ {alloc.time_slot}</span>
      </div>
      {showAction && (
        <div style={{ marginTop:10, background:'#ECFDF5', border:'1px solid #86EFAC', borderRadius:9, padding:'8px 12px', fontSize:12.5, fontWeight:700, color:'#065F46', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>Tap to file visit report</span>
          <span>→</span>
        </div>
      )}
    </div>
  )
}
