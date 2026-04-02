'use client'
import { useState, useEffect } from 'react'
import TicketTimeline from './TicketTimeline'
import type { Ticket } from '@/lib/types'

const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s', fontFamily: 'inherit' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }

export default function TicketTracker({ prefillTicket = '' }: { prefillTicket?: string }) {
  const [ticketNum, setTicketNum] = useState(prefillTicket)
  const [mobile,    setMobile]    = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [ticket,    setTicket]    = useState<Ticket | null>(null)
  useEffect(() => { if (prefillTicket) setTicketNum(prefillTicket) }, [prefillTicket])

  const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#0A5C48'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(10,92,72,0.08)' }
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none' }

  async function search() {
    const num = ticketNum.trim().toUpperCase()
    const mob = mobile.trim()
    if (!num) { setError('Please enter your ticket number.'); return }
    if (!mob || mob.replace(/\D/g,'').length < 10) { setError('Please enter your 10-digit mobile number.'); return }
    setLoading(true); setError(''); setTicket(null)
    try {
      const res = await fetch(`/api/tickets/track?ticket=${encodeURIComponent(num)}&mobile=${encodeURIComponent(mob)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(res.status === 403 ? 'Mobile number does not match this ticket.' : res.status === 404 ? 'Ticket not found. Please check the number.' : data.error || 'Something went wrong.')
      setTicket(data.ticket)
    } catch(e: unknown) { setError(e instanceof Error ? e.message : 'Failed to find ticket.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Track Your Request</div>
          <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 3 }}>Enter your ticket number and mobile to see live status.</div>
        </div>
        <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, padding: '10px 14px', borderRadius: 10 }}>{error}</div>}
          <div><label style={labelStyle}>Ticket Number</label><input style={inputStyle} placeholder="DM-2026-0001" value={ticketNum} onChange={e => setTicketNum(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && search()} onFocus={focus} onBlur={blur}/></div>
          <div><label style={labelStyle}>Mobile Number</label><input style={inputStyle} placeholder="98765 43210" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} onFocus={focus} onBlur={blur}/></div>
          <button onClick={search} disabled={loading} style={{ width: '100%', padding: '12px 20px', background: loading ? '#9CA3AF' : '#0A5C48', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><svg style={{ animation:'spin 0.7s linear infinite', width:15, height:15 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Searching…</> : '🔍 Track Ticket'}
          </button>
        </div>
      </div>
      {ticket && <TicketTimeline ticket={ticket}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
