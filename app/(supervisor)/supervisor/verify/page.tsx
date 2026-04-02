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

  const inputS: React.CSSProperties = { width:'100%', padding:'13px 16px', fontSize:16, border:'1.5px solid #E5E7EB', borderRadius:12, background:'#F9FAFB', color:'#111827', outline:'none', boxSizing:'border-box', fontFamily:'inherit', letterSpacing:'0.1em', textAlign:'center', transition:'all 0.15s' }

  async function sendOtp() {
    if (mobile.replace(/\D/g,'').length < 10) { setError('Please enter a valid 10-digit mobile number.'); return }
    setLoading(true); setError('')
    const res  = await fetch('/api/supervisor/send-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mobile})})
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error||'Failed to send OTP'); return }
    setStep('otp')
  }

  async function verifyOtp() {
    if (otp.length < 6) { setError('Please enter the 6-digit OTP.'); return }
    setLoading(true); setError('')
    const res  = await fetch('/api/supervisor/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mobile,otp})})
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error||'Incorrect OTP'); return }
    setName(data.name); setStep('success')
    setTimeout(()=>router.push('/supervisor/dashboard'),1500)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F2F4F8', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:20, width:'100%', maxWidth:380, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ background:'linear-gradient(135deg,#0A5C48,#0D7A60)', padding:'28px 24px', textAlign:'center' }}>
          <div style={{ width:56, height:56, background:'rgba(255,255,255,0.15)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:24 }}>🔧</div>
          <div style={{ color:'white', fontWeight:800, fontSize:18 }}>Supervisor Login</div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginTop:4 }}>Duromax Field App</div>
        </div>

        <div style={{ padding:'28px 24px' }}>
          {step === 'mobile' && (
            <div>
              <p style={{ fontSize:14, color:'#6B7280', textAlign:'center', marginBottom:24 }}>Enter your registered mobile to receive a one-time password.</p>
              {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:14 }}>{error}</div>}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Mobile Number</label>
                <div style={{ display:'flex' }}>
                  <span style={{ padding:'13px 14px', background:'#F3F4F6', border:'1.5px solid #E5E7EB', borderRight:'none', borderRadius:'12px 0 0 12px', fontSize:14, color:'#6B7280', fontWeight:600, whiteSpace:'nowrap' }}>+91</span>
                  <input type="tel" value={mobile} onChange={e=>setMobile(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendOtp()} placeholder="98765 43210" maxLength={10} style={{ flex:1, padding:'13px 16px', fontSize:14, border:'1.5px solid #E5E7EB', borderLeft:'none', borderRadius:'0 12px 12px 0', background:'#F9FAFB', color:'#111827', outline:'none', fontFamily:'inherit' }} onFocus={e=>{e.target.style.borderColor='#0A5C48';e.target.style.background='#fff'}} onBlur={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.background='#F9FAFB'}}/>
                </div>
              </div>
              <button onClick={sendOtp} disabled={loading} style={{ width:'100%', padding:'13px 20px', background:loading?'#9CA3AF':'#0A5C48', color:'white', border:'none', borderRadius:12, fontSize:14.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading?<><svg style={{ animation:'spin 0.7s linear infinite', width:16, height:16 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Sending OTP…</>:'Send OTP →'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div>
              <div style={{ textAlign:'center', marginBottom:24 }}>
                <div style={{ fontSize:14, color:'#6B7280' }}>OTP sent to</div>
                <div style={{ fontSize:16, fontWeight:800, color:'#111827', marginTop:2 }}>+91 {mobile}</div>
                <button onClick={()=>setStep('mobile')} style={{ background:'none', border:'none', color:'#0A5C48', fontSize:12, fontWeight:600, cursor:'pointer', marginTop:6 }}>Change number</button>
              </div>
              {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:14 }}>{error}</div>}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8, textAlign:'center' }}>Enter 6-digit OTP</label>
                <input type="number" value={otp} onChange={e=>setOtp(e.target.value.slice(0,6))} onKeyDown={e=>e.key==='Enter'&&verifyOtp()} placeholder="● ● ● ● ● ●" style={inputS} maxLength={6} onFocus={e=>{e.target.style.borderColor='#0A5C48';e.target.style.boxShadow='0 0 0 3px rgba(10,92,72,0.1)'}} onBlur={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.boxShadow='none'}}/>
              </div>
              <button onClick={verifyOtp} disabled={loading||otp.length<6} style={{ width:'100%', padding:'13px 20px', background:loading||otp.length<6?'#9CA3AF':'#0A5C48', color:'white', border:'none', borderRadius:12, fontSize:14.5, fontWeight:700, cursor:loading||otp.length<6?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading?<><svg style={{ animation:'spin 0.7s linear infinite', width:16, height:16 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Verifying…</>:'Verify OTP →'}
              </button>
              <button onClick={sendOtp} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:'#9CA3AF', fontSize:13, cursor:'pointer', padding:'8px 0' }}>Resend OTP</button>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign:'center', padding:'12px 0 20px' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#111827' }}>Welcome, {name}!</div>
              <div style={{ fontSize:13, color:'#9CA3AF', marginTop:6 }}>Redirecting to your visits…</div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
