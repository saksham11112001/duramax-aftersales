'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'mobile'|'otp'|'success'

export default function SupervisorVerifyPage() {
  const router = useRouter()
  const [step,    setStep]    = useState<Step>('mobile')
  const [mobile,  setMobile]  = useState('')
  const [otp,     setOtp]     = useState('')
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const iS: React.CSSProperties = { width:'100%', padding:'11px 14px', fontSize:15, border:'1.5px solid var(--border)', borderRadius:8, background:'var(--bg)', color:'var(--ink)', outline:'none', transition:'all .18s', fontFamily:'inherit', boxSizing:'border-box', textAlign:'center', letterSpacing:'.08em' }

  async function sendOtp() {
    if (mobile.replace(/\D/g,'').length < 10) { setError('Please enter a valid 10-digit mobile number.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/supervisor/send-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mobile})})
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error||'Failed to send OTP'); return }
    setStep('otp')
  }

  async function verifyOtp() {
    if (otp.length < 6) { setError('Please enter the 6-digit OTP.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/supervisor/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mobile,otp})})
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error||'Incorrect OTP'); return }
    setName(data.name); setStep('success')
    setTimeout(()=>router.push('/supervisor/dashboard'),1500)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:18, width:'100%', maxWidth:380, overflow:'hidden', boxShadow:'var(--sh-lg)' }}>
        <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-m))', padding:'28px 24px', textAlign:'center' }}>
          <div style={{ width:56, height:56, background:'rgba(255,255,255,.14)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:24 }}>🔧</div>
          <div className="serif" style={{ color:'white', fontSize:20 }}>Field Team Login</div>
          <div style={{ color:'rgba(255,255,255,.55)', fontSize:12.5, marginTop:4 }}>Duromax Service Portal</div>
        </div>

        <div style={{ padding:'26px 24px' }}>
          {step === 'mobile' && (
            <>
              <p style={{ fontSize:13.5, color:'var(--muted)', textAlign:'center', marginBottom:22 }}>Enter your registered mobile to receive a one-time password.</p>
              {error && <div style={{ background:'var(--coral-l)', border:'1px solid #FABDB0', color:'var(--coral)', fontSize:13, padding:'9px 13px', borderRadius:8, marginBottom:13 }}>{error}</div>}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:10.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>Mobile Number</label>
                <div style={{ display:'flex' }}>
                  <span style={{ padding:'11px 13px', background:'var(--bg)', border:'1.5px solid var(--border)', borderRight:'none', borderRadius:'8px 0 0 8px', fontSize:13.5, color:'var(--muted)', fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}>+91</span>
                  <input type="tel" value={mobile} onChange={e=>setMobile(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendOtp()} placeholder="98765 43210" maxLength={10} style={{ ...iS, borderRadius:'0 8px 8px 0', textAlign:'left', letterSpacing:'normal' }} onFocus={e=>{e.target.style.borderColor='var(--teal)';e.target.style.background='#fff'}} onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.background='var(--bg)'}}/>
                </div>
              </div>
              <button onClick={sendOtp} disabled={loading} style={{ width:'100%', padding:'12px 20px', background:loading?'var(--border)':'var(--teal)', color:'white', border:'none', borderRadius:9, fontSize:14.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit', transition:'background .18s' }}>
                {loading?<><svg style={{ animation:'spin .7s linear infinite', width:16, height:16 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Sending OTP…</>:'Send OTP →'}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div style={{ textAlign:'center', marginBottom:22 }}>
                <div style={{ fontSize:13.5, color:'var(--muted)' }}>OTP sent to</div>
                <div className="serif" style={{ fontSize:18, color:'var(--ink)', marginTop:2 }}>+91 {mobile}</div>
                <button onClick={()=>setStep('mobile')} style={{ background:'none', border:'none', color:'var(--teal)', fontSize:12, fontWeight:600, cursor:'pointer', marginTop:6, fontFamily:'inherit' }}>Change number</button>
              </div>
              {error && <div style={{ background:'var(--coral-l)', border:'1px solid #FABDB0', color:'var(--coral)', fontSize:13, padding:'9px 13px', borderRadius:8, marginBottom:13 }}>{error}</div>}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:10.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7, textAlign:'center' }}>Enter 6-digit OTP</label>
                <input type="number" value={otp} onChange={e=>setOtp(e.target.value.slice(0,6))} onKeyDown={e=>e.key==='Enter'&&verifyOtp()} placeholder="● ● ● ● ● ●" style={{ ...iS }} maxLength={6} onFocus={e=>{e.target.style.borderColor='var(--teal)';e.target.style.background='#fff';e.target.style.boxShadow='0 0 0 3px rgba(12,110,88,.09)'}} onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.background='var(--bg)';e.target.style.boxShadow='none'}}/>
              </div>
              <button onClick={verifyOtp} disabled={loading||otp.length<6} style={{ width:'100%', padding:'12px 20px', background:loading||otp.length<6?'var(--border)':'var(--teal)', color:'white', border:'none', borderRadius:9, fontSize:14.5, fontWeight:700, cursor:loading||otp.length<6?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
                {loading?<><svg style={{ animation:'spin .7s linear infinite', width:16, height:16 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Verifying…</>:'Verify OTP →'}
              </button>
              <button onClick={sendOtp} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer', padding:'8px 0', fontFamily:'inherit' }}>Resend OTP</button>
            </>
          )}

          {step === 'success' && (
            <div style={{ textAlign:'center', padding:'12px 0 20px' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
              <div className="serif" style={{ fontSize:20, color:'var(--ink)' }}>Welcome, {name}!</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>Redirecting to your visits…</div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
