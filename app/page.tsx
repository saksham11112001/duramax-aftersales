'use client'
import { useState } from 'react'
import EnquiryForm from '@/components/customer/EnquiryForm'
import TicketTracker from '@/components/customer/TicketTracker'

export default function CustomerPortal() {
  const [tab, setTab] = useState<'new'|'track'>('new')
  const [prefill, setPrefill] = useState('')
  function onSuccess(tn: string) { setPrefill(tn); setTab('track') }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--teal)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,.14)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
          </div>
          <div>
            <div className="serif" style={{ color: 'white', fontSize: 16, lineHeight: 1.2 }}>Duromax UPVC</div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>Service Portal</div>
          </div>
        </div>
        <a href="/login" style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Staff Login →</a>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, var(--teal) 0%, var(--teal-m) 100%)', padding: '32px 24px 52px', textAlign: 'center' }}>
        <h1 className="serif" style={{ color: 'white', fontSize: 28, marginBottom: 8, letterSpacing: '-.3px' }}>How can we help you?</h1>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13.5, maxWidth: 360, margin: '0 auto' }}>Submit a new service request or track an existing one. No account needed.</p>
      </div>

      {/* Tab card floated over hero */}
      <div style={{ maxWidth: 540, margin: '-22px auto 0', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 5, display: 'flex', gap: 4, boxShadow: '0 4px 24px rgba(0,0,0,.1)', border: '1px solid rgba(0,0,0,.06)' }}>
          {[{ k:'new', l:'📋 New Request' },{ k:'track', l:'🔍 Track Request' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as 'new'|'track')} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', background: tab === t.k ? 'var(--teal)' : 'transparent', color: tab === t.k ? 'white' : 'var(--muted)', fontFamily: 'inherit' }}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 48px' }}>
        {tab === 'new' ? <EnquiryForm onSuccess={onSuccess}/> : <TicketTracker prefillTicket={prefill}/>}
      </div>
    </div>
  )
}
