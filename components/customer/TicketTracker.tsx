'use client'
import { useState, useEffect } from 'react'
import TicketTimeline from './TicketTimeline'
import type { Ticket } from '@/lib/types'

const iS: React.CSSProperties = { width:'100%', padding:'8px 11px', fontSize:13, border:'1.5px solid var(--border)', borderRadius:7, background:'var(--bg)', color:'var(--ink)', outline:'none', transition:'all .18s', fontFamily:'inherit', boxSizing:'border-box' }
const lS: React.CSSProperties = { display:'block', fontSize:10.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }

export default function TicketTracker({ prefillTicket = '' }: { prefillTicket?: string }) {
  const [num,     setNum]     = useState(prefillTicket)
  const [mobile,  setMobile]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [ticket,  setTicket]  = useState<Ticket|null>(null)
  useEffect(() => { if (prefillTicket) setNum(prefillTicket) }, [prefillTicket])

  const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='var(--teal)'; e.target.style.background='#fff' }
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='var(--border)'; e.target.style.background='var(--bg)' }

  async function search() {
    const n = num.trim().toUpperCase(); const m = mobile.trim()
    if (!n) { setError('Please enter your ticket number.'); return }
    if (!m || m.replace(/\D/g,'').length < 10) { setError('Please enter your 10-digit mobile number.'); return }
    setLoading(true); setError(''); setTicket(null)
    try {
      const res = await fetch(`/api/tickets/track?ticket=${encodeURIComponent(n)}&mobile=${encodeURIComponent(m)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(res.status===403?'Mobile number does not match this ticket.':res.status===404?'Ticket not found. Please check the number.':data.error||'Something went wrong.')
      setTicket(data.ticket)
    } catch(e:unknown) { setError(e instanceof Error?e.message:'Failed to find ticket.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:'white', borderRadius:13, border:'1px solid var(--border)', boxShadow:'var(--sh)', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)' }}>
          <div className="serif" style={{ fontSize:17 }}>🔍 Track Your Request</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>Enter your ticket number and mobile to see live status.</div>
        </div>
        <div style={{ padding:'18px 20px 22px', display:'flex', flexDirection:'column', gap:12 }}>
          {error && <div style={{ background:'var(--coral-l)', border:'1px solid #FABDB0', color:'var(--coral)', fontSize:13, padding:'9px 13px', borderRadius:8 }}>{error}</div>}
          <div><label style={lS}>Ticket Number</label><input style={iS} placeholder="DM-2026-0001" value={num} onChange={e=>setNum(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&search()} onFocus={focus} onBlur={blur}/></div>
          <div><label style={lS}>Mobile Number</label><input style={iS} placeholder="+91 98765 43210" type="tel" value={mobile} onChange={e=>setMobile(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} onFocus={focus} onBlur={blur}/></div>
          <button onClick={search} disabled={loading} style={{ padding:'11px 20px', background:loading?'#B0CCC5':'var(--teal)', color:'white', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
            {loading?<><svg style={{ animation:'spin .7s linear infinite', width:15, height:15 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Searching…</>:'🔍 Track Ticket'}
          </button>
        </div>
      </div>
      {ticket && <TicketTimeline ticket={ticket}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
