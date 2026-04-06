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
    if (error) { setError('Incorrect email or password.'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  const iS: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)', outline: 'none', transition: 'all .18s', fontFamily: 'inherit', boxSizing: 'border-box' }
  const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'var(--teal)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(12,110,88,.09)' }
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg)'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex" style={{ width: 440, background: 'linear-gradient(160deg,var(--teal) 0%,var(--teal-m) 100%)', flexDirection: 'column', justifyContent: 'space-between', padding: '44px 52px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
          </div>
          <span className="serif" style={{ color: 'white', fontSize: 18, letterSpacing: '-.2px' }}>Duromax UPVC</span>
        </div>
        <div>
          <h1 className="serif" style={{ color: 'white', fontSize: 40, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-.5px' }}>After-Sales<br/>Service Portal</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13.5, lineHeight: 1.7 }}>Everything from service request to warranty — managed in one place.</p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {['Customer portal & ticket tracking','Two-stage payments via Razorpay','WhatsApp auto-notifications','SLA monitoring & breach alerts','Supervisor & installer management'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'rgba(255,255,255,.75)', fontSize: 13 }}>
                <div style={{ width: 17, height: 17, background: 'rgba(255,255,255,.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 12 }}>© 2026 Duromax UPVC. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'white' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 36 }}>
            <div style={{ width: 32, height: 32, background: 'var(--teal)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
            </div>
            <span className="serif" style={{ fontSize: 16, color: 'var(--ink)' }}>Duromax UPVC</span>
          </div>
          <h2 className="serif" style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 6, letterSpacing: '-.3px' }}>Welcome back</h2>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 32 }}>Sign in to your staff account</p>

          {error && (
            <div style={{ background: 'var(--coral-l)', border: '1px solid #FABDB0', color: 'var(--coral)', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="7" stroke="#C44B2B" strokeWidth="1.5"/><path d="M8 5v3M8 10.5h.01" stroke="#C44B2B" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 7 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="you@duromax.in" style={iS} onFocus={focus} onBlur={blur}/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 7 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" style={{ ...iS, paddingRight: 44 }} onFocus={focus} onBlur={blur}/>
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}>
                  {showPw ? <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                    : <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
            <button onClick={handleLogin} disabled={loading || !email.trim() || !password.trim()} style={{ padding: '12px 20px', background: loading || !email.trim() || !password.trim() ? '#B0CCC5' : 'var(--teal)', color: 'white', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, transition: 'background .18s' }}>
              {loading ? <><svg style={{ animation: 'spin .7s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Signing in…</> : 'Sign In →'}
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 22 }}>Supervisor / Installer? Use the WhatsApp link sent to you.</p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
