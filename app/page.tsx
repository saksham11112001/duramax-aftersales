'use client'
import { useState } from 'react'
import EnquiryForm from '@/components/customer/EnquiryForm'
import TicketTracker from '@/components/customer/TicketTracker'

export default function CustomerPortal() {
  const [tab, setTab] = useState<'new'|'track'>('new')
  const [prefillTicket, setPrefillTicket] = useState('')

  function handleSuccess(tn: string) {
    setPrefillTicket(tn)
    setTab('track')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F4F8' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0A5C48 0%,#0D7A60 100%)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Duromax UPVC</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 500 }}>After-Sales Service</div>
          </div>
        </div>
        <a href="/login" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Staff Login →</a>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0A5C48 0%,#0D7A60 100%)', padding: '32px 24px 48px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.3px' }}>How can we help you?</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13.5, maxWidth: 360, margin: '0 auto' }}>Submit a new service request or track an existing one. No account needed.</p>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 520, margin: '-20px auto 0', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 6, display: 'flex', gap: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.06)' }}>
          {[{ k: 'new', icon: '📋', l: 'New Request' }, { k: 'track', icon: '🔍', l: 'Track Request' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as 'new'|'track')} style={{ flex: 1, padding: '10px 16px', borderRadius: 11, border: 'none', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: tab === t.k ? '#0A5C48' : 'transparent', color: tab === t.k ? 'white' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>{t.icon}</span>{t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 40px' }}>
        {tab === 'new' ? <EnquiryForm onSuccess={handleSuccess}/> : <TicketTracker prefillTicket={prefillTicket}/>}
      </div>
    </div>
  )
}
