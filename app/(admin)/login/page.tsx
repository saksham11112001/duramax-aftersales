'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError('Incorrect email or password. Please try again.'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F2F4F8' }}>
      {/* Left brand panel */}
      <div style={{ width: 420, background: 'linear-gradient(160deg,#0A5C48 0%,#0D7A60 60%,#10936F 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', flexShrink: 0 }} className="hidden lg:flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>Duromax UPVC</span>
        </div>
        <div>
          <h1 style={{ color: 'white', fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>After-Sales<br/>Service Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5, lineHeight: 1.7 }}>Manage tickets, track visits, process payments and keep your customers informed — all from one dashboard.</p>
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Real-time ticket management', 'UPI & net banking payments', 'WhatsApp auto-notifications', '48-hour SLA monitoring'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                <div style={{ width: 18, height: 18, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>© 2026 Duromax UPVC. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'white' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }} className="lg:hidden">
            <div style={{ width: 32, height: 32, background: '#0A5C48', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Duromax UPVC</span>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F1117', marginBottom: 6, letterSpacing: '-0.4px' }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#8A8FA8', marginBottom: 32 }}>Sign in to your staff account</p>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13.5, padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5"/><path d="M8 5v3M8 10.5h.01" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A8FA8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="you@duromax.in" autoComplete="email" style={{ width: '100%', padding: '12px 16px', fontSize: 14, border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#F9FAFB', color: '#111827', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box' }} onFocus={e => { e.target.style.borderColor = '#0A5C48'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(10,92,72,0.08)'; }} onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none'; }}/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A8FA8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" autoComplete="current-password" style={{ width: '100%', padding: '12px 48px 12px 16px', fontSize: 14, border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#F9FAFB', color: '#111827', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box' }} onFocus={e => { e.target.style.borderColor = '#0A5C48'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(10,92,72,0.08)'; }} onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none'; }}/>
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  {showPw ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg> : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
            <button onClick={handleLogin} disabled={loading || !email.trim() || !password.trim()} style={{ width: '100%', padding: '13px 20px', marginTop: 8, background: loading || !email.trim() || !password.trim() ? '#D1D5DB' : '#0A5C48', color: 'white', border: 'none', borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: loading || !email.trim() || !password.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}>
              {loading ? (<><svg style={{ animation: 'spin 0.7s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Signing in…</>) : 'Sign In →'}
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 24 }}>Supervisor? Use the WhatsApp link sent to you.</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
