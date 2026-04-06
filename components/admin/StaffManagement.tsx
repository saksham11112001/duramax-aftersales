'use client'
import { useState } from 'react'
import type { Profile, StaffStats } from '@/lib/types'
import LogoutButton from '@/components/shared/LogoutButton'

interface Props { initialStaff: Profile[]; adminName: string }

const ROLE_META = {
  supervisor: { label:'Supervisor', color:'var(--teal)',  bg:'var(--teal-l)', bdr:'#9FD8C4', icon:'🔧', desc:'Inspect & report' },
  installer:  { label:'Installer',  color:'var(--blue)',  bg:'var(--blue-l)', bdr:'#90B8E8', icon:'🛠️', desc:'Carry out repairs' },
}

export default function StaffManagement({ initialStaff, adminName }: Props) {
  const [staff,    setStaff]    = useState<Profile[]>(initialStaff)
  const [tab,      setTab]      = useState<'all'|'supervisor'|'installer'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editS,    setEditS]    = useState<Profile|null>(null)
  const [selS,     setSelS]     = useState<Profile|null>(null)
  const [selStats, setSelStats] = useState<StaffStats|null>(null)
  const [statLoad, setStatLoad] = useState(false)
  const [toast,    setToast]    = useState('')
  const [creds,    setCreds]    = useState<{name:string;email:string;tempPw:string;loginUrl:string}|null>(null)

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''),3500) }

  async function loadStats(s: Profile) {
    setSelS(s); setSelStats(null); setStatLoad(true)
    const res = await fetch(`/api/admin/staff/${s.id}/stats`)
    const data = await res.json()
    setSelStats(data.stats ?? null); setStatLoad(false)
  }

  async function toggleActive(id:string, cur:boolean) {
    const res = await fetch(`/api/admin/staff/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_active:!cur})})
    if (res.ok) { setStaff(prev=>prev.map(s=>s.id===id?{...s,is_active:!cur}:s)); showToast(cur?'⏸ Deactivated':'✅ Activated') }
    else showToast('❌ Failed to update')
  }

  const filtered = tab==='all'?staff:staff.filter(s=>s.role===tab)
  const counts = { all:staff.length, supervisor:staff.filter(s=>s.role==='supervisor').length, installer:staff.filter(s=>s.role==='installer').length }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'var(--teal)', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', boxShadow:'0 2px 10px rgba(0,0,0,.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <a href="/dashboard/admin" style={{ color:'rgba(255,255,255,.65)', fontSize:13, textDecoration:'none', fontWeight:600 }}>← Dashboard</a>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,.2)' }}/>
          <div className="serif" style={{ color:'white', fontSize:16 }}>Staff Management</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:'rgba(255,255,255,.5)', fontSize:12 }}>{adminName}</span>
          <LogoutButton/>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16, maxWidth:1080, margin:'0 auto', padding:'22px 20px 48px' }}>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h1 className="serif" style={{ fontSize:22, color:'var(--ink)' }}>Field Team</h1>
              <p style={{ fontSize:12.5, color:'var(--muted)', marginTop:2 }}>Manage supervisors and installers</p>
            </div>
            <button onClick={()=>{setEditS(null);setShowForm(true)}} style={{ background:'var(--teal)', color:'white', border:'none', borderRadius:9, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
              <span style={{ fontSize:16 }}>+</span> Add Staff
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            {[{k:'all',l:'Total',icon:'👥',acc:'var(--ink)'},{k:'supervisor',l:'Supervisors',icon:'🔧',acc:'var(--teal)'},{k:'installer',l:'Installers',icon:'🛠️',acc:'var(--blue)'}].map(s=>(
              <div key={s.k} onClick={()=>setTab(s.k as 'all'|'supervisor'|'installer')} style={{ background:tab===s.k?s.acc:'white', border:`1px solid ${tab===s.k?s.acc:'var(--border)'}`, borderRadius:11, padding:'13px 15px', cursor:'pointer', boxShadow:'var(--sh)', transition:'all .16s' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
                <div className="serif" style={{ fontSize:26, color:tab===s.k?'white':s.acc }}>{counts[s.k as keyof typeof counts]}</div>
                <div style={{ fontSize:11.5, color:tab===s.k?'rgba(255,255,255,.7)':'var(--muted)', marginTop:1 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Creds card */}
          {creds && (
            <div style={{ background:'var(--teal-l)', border:'1px solid #9FD8C4', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:'var(--teal)' }}>✅ {creds.name} onboarded — share these details</div>
                <button onClick={()=>setCreds(null)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:18 }}>×</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[{l:'Email',v:creds.email},{l:'Temp Password',v:creds.tempPw},{l:'Login URL',v:creds.loginUrl},{l:'Daily Login',v:'Mobile OTP at /supervisor/verify'}].map(item=>(
                  <div key={item.l} style={{ background:'white', borderRadius:8, padding:'9px 12px', border:'1px solid #B7E4D0' }}>
                    <div style={{ fontSize:9.5, fontWeight:700, color:'#6EE7B7', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{item.l}</div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'var(--teal)', wordBreak:'break-all' }}>{item.v}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11.5, color:'var(--teal)', marginTop:9 }}>ℹ️ For day-to-day login they use mobile OTP at /supervisor/verify. No password needed for OTP login.</p>
            </div>
          )}

          {/* Staff table */}
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, overflow:'hidden', boxShadow:'var(--sh)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1.2fr 1fr 1fr 100px', padding:'9px 16px', background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['Name & Role','Mobile','Login','Status','Actions'].map(h=>(
                <div key={h} style={{ fontSize:9.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding:'52px 24px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>👥</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--muted)' }}>No staff yet</div>
                <div style={{ fontSize:12.5, color:'var(--border)', marginTop:4 }}>Click "Add Staff" to get started</div>
              </div>
            ) : filtered.map((s,i)=>{
              const m = ROLE_META[s.role as keyof typeof ROLE_META]??ROLE_META.supervisor
              return (
                <div key={s.id} onClick={()=>loadStats(s)} style={{ display:'grid', gridTemplateColumns:'1.8fr 1.2fr 1fr 1fr 100px', padding:'12px 16px', borderBottom:i<filtered.length-1?'1px solid var(--bg)':'none', alignItems:'center', background:selS?.id===s.id?'var(--teal-l)':s.is_active?'white':'var(--bg)', opacity:s.is_active?1:.65, cursor:'pointer', transition:'background .15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:m.bg, border:`1px solid ${m.bdr}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{m.icon}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{s.full_name}</div>
                      <span style={{ background:m.bg, color:m.color, border:`1px solid ${m.bdr}`, fontSize:9.5, fontWeight:700, padding:'1px 7px', borderRadius:20 }}>{m.label}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12.5, color:'var(--muted)' }}>{s.mobile||'—'}</div>
                  <div style={{ fontSize:11.5, color:'var(--muted)' }}>📱 Mobile OTP</div>
                  <div>
                    <span style={{ background:s.is_active?'#DCFCE7':'var(--bg)', color:s.is_active?'#15803D':'var(--muted)', fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:20, border:`1px solid ${s.is_active?'#86EFAC':'var(--border)'}` }}>{s.is_active?'● Active':'○ Inactive'}</span>
                  </div>
                  <div style={{ display:'flex', gap:5 }} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>{setEditS(s);setShowForm(true)}} style={{ padding:'4px 9px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, fontWeight:600, color:'var(--ink)', cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                    <button onClick={()=>toggleActive(s.id,s.is_active)} style={{ padding:'4px 9px', background:s.is_active?'var(--coral-l)':'var(--teal-l)', border:`1px solid ${s.is_active?'#F0B4A0':'#9FD8C4'}`, borderRadius:6, fontSize:11, fontWeight:600, color:s.is_active?'var(--coral)':'var(--teal)', cursor:'pointer', fontFamily:'inherit' }}>
                      {s.is_active?'Off':'On'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginTop:9 }}>Click any row to see performance stats →</p>
        </div>

        {/* Stats panel */}
        {!selS ? (
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, padding:'52px 24px', textAlign:'center', boxShadow:'var(--sh)' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📊</div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--muted)' }}>Select a staff member</div>
            <div style={{ fontSize:12.5, color:'var(--border)', marginTop:4 }}>to view their performance stats</div>
          </div>
        ) : (
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, overflow:'hidden', boxShadow:'var(--sh)', position:'sticky', top:24 }}>
            <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-m))', padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:40, height:40, background:'rgba(255,255,255,.14)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{ROLE_META[selS.role as keyof typeof ROLE_META]?.icon}</div>
                <div>
                  <div className="serif" style={{ color:'white', fontSize:16 }}>{selS.full_name}</div>
                  <div style={{ color:'rgba(255,255,255,.55)', fontSize:11.5, marginTop:2 }}>{ROLE_META[selS.role as keyof typeof ROLE_META]?.label} · {selS.mobile||'No mobile'}</div>
                </div>
              </div>
            </div>
            <div style={{ padding:'16px 18px' }}>
              {statLoad ? (
                <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)' }}><div style={{ fontSize:20, marginBottom:8 }}>⏳</div><div style={{ fontSize:13 }}>Loading stats…</div></div>
              ) : !selStats ? (
                <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)', fontSize:13 }}>No stats available</div>
              ) : (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:13 }}>
                    {[{n:selStats.total_assigned,l:'Assigned',icon:'📋',acc:'var(--ink)'},{n:selStats.total_closed,l:'Completed',icon:'✅',acc:'var(--teal)'},{n:selStats.in_progress,l:'In Progress',icon:'⚡',acc:'var(--blue)'},{n:selStats.this_month,l:'This Month',icon:'📅',acc:'var(--purple)'}].map((s,i)=>(
                      <div key={i} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 13px' }}>
                        <div style={{ fontSize:16 }}>{s.icon}</div>
                        <div className="serif" style={{ fontSize:24, color:s.acc, marginTop:3 }}>{s.n}</div>
                        <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:1 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'var(--gold-l)', border:'1px solid #F0D090', borderRadius:10, padding:'11px 13px', marginBottom:9 }}>
                    <div style={{ fontSize:10.5, fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:3 }}>Customer Rating</div>
                    <div className="serif" style={{ fontSize:28, color:'var(--gold)' }}>{selStats.avg_rating?`${selStats.avg_rating}★`:'—'}</div>
                  </div>
                  <div style={{ background:'#F0FAF6', border:'1px solid #86EFAC', borderRadius:10, padding:'11px 13px', marginBottom:9 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                      <div style={{ fontSize:10.5, fontWeight:700, color:'#065F46', textTransform:'uppercase', letterSpacing:'.07em' }}>On-Time Rate</div>
                      <div className="serif" style={{ fontSize:20, color:'#15803D' }}>{selStats.on_time_pct}%</div>
                    </div>
                    <div style={{ height:5, background:'#D1FAE5', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:selStats.on_time_pct+'%', background:'#10B981', borderRadius:10, transition:'width .5s' }}/>
                    </div>
                  </div>
                  <div style={{ background:'var(--blue-l)', border:'1px solid #90B8E8', borderRadius:10, padding:'11px 13px' }}>
                    <div style={{ fontSize:10.5, fontWeight:700, color:'var(--blue)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:3 }}>Revenue Generated</div>
                    <div className="serif" style={{ fontSize:24, color:'var(--blue)' }}>₹{Math.round((selStats.total_revenue||0)/100).toLocaleString('en-IN')}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <StaffFormModal existingStaff={editS} onClose={()=>{setShowForm(false);setEditS(null)}} onSaved={(s,cr)=>{
          if (editS) { setStaff(prev=>prev.map(x=>x.id===s.id?s:x)); showToast('✅ Updated') }
          else { setStaff(prev=>[s,...prev]); if (cr) setCreds(cr); showToast('✅ Staff onboarded!') }
          setShowForm(false); setEditS(null)
        }}/>
      )}

      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'var(--ink)', color:'white', fontSize:13, fontWeight:600, padding:'10px 18px', borderRadius:9, boxShadow:'var(--sh-lg)', zIndex:999 }}>{toast}</div>}
    </div>
  )
}

interface ModalProps { existingStaff:Profile|null; onClose:()=>void; onSaved:(s:Profile, creds?:{name:string;email:string;tempPw:string;loginUrl:string})=>void }
function StaffFormModal({ existingStaff, onClose, onSaved }: ModalProps) {
  const isEdit = !!existingStaff
  const [fullName, setFullName] = useState(existingStaff?.full_name??'')
  const [email,    setEmail]    = useState('')
  const [mobile,   setMobile]   = useState(existingStaff?.mobile??'')
  const [role,     setRole]     = useState<'supervisor'|'installer'>((existingStaff?.role as 'supervisor'|'installer')?? 'supervisor')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const iS: React.CSSProperties = { width:'100%', padding:'9px 12px', fontSize:13.5, border:'1.5px solid var(--border)', borderRadius:8, background:'var(--bg)', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'all .18s' }
  const lS: React.CSSProperties = { display:'block', fontSize:10.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }
  const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='var(--teal)'; e.target.style.background='#fff' }
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='var(--border)'; e.target.style.background='var(--bg)' }

  async function handleSubmit() {
    if (!fullName.trim()) { setError('Please enter full name.'); return }
    if (!isEdit && !email.trim()) { setError('Please enter email.'); return }
    if (!mobile.trim()||mobile.replace(/\D/g,'').length<10) { setError('Please enter a valid 10-digit mobile number.'); return }
    setLoading(true); setError('')
    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/staff/${existingStaff!.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:fullName,mobile})})
        if (!res.ok) { const d=await res.json(); throw new Error(d.error||'Update failed') }
        onSaved({...existingStaff!,full_name:fullName,mobile})
      } else {
        const res = await fetch('/api/admin/staff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:fullName,email,mobile,role})})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error||'Failed to create')
        const newS: Profile = {id:data.staff_id,full_name:fullName,mobile,role,is_active:true,created_at:new Date().toISOString()}
        onSaved(newS, {name:fullName,email,tempPw:data.temp_password,loginUrl:data.login_url})
      }
    } catch(e:unknown) { setError(e instanceof Error?e.message:'Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,15,12,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:16, backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:440, boxShadow:'var(--sh-lg)', overflow:'hidden', animation:'sU .26s ease' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-m))', padding:'18px 22px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.55)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{isEdit?'Edit Staff Member':'Onboard New Staff'}</div>
          <div className="serif" style={{ fontSize:18, color:'white' }}>{isEdit?existingStaff!.full_name:'Add to Field Team'}</div>
        </div>
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:13 }}>
          {error && <div style={{ background:'var(--coral-l)', border:'1px solid #FABDB0', color:'var(--coral)', fontSize:13, padding:'9px 13px', borderRadius:8 }}>{error}</div>}
          {!isEdit && (
            <div>
              <label style={lS}>Role</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
                {(['supervisor','installer'] as const).map(r=>{
                  const m=ROLE_META[r]
                  return (
                    <button key={r} type="button" onClick={()=>setRole(r)} style={{ padding:'13px 10px', borderRadius:10, border:role===r?`1.5px solid ${m.color}`:'1.5px solid var(--border)', background:role===r?m.bg:'var(--bg)', cursor:'pointer', textAlign:'center', transition:'all .16s', fontFamily:'inherit' }}>
                      <div style={{ fontSize:22, marginBottom:5 }}>{m.icon}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:role===r?m.color:'var(--ink)' }}>{m.label}</div>
                      <div style={{ fontSize:11, color:role===r?m.color:'var(--muted)', marginTop:2 }}>{m.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div><label style={lS}>Full Name</label><input style={iS} placeholder="Sandeep Rawat" value={fullName} onChange={e=>setFullName(e.target.value)} onFocus={focus} onBlur={blur}/></div>
          {!isEdit && <div><label style={lS}>Email Address</label><input type="email" style={iS} placeholder="sandeep@duromax.in" value={email} onChange={e=>setEmail(e.target.value)} onFocus={focus} onBlur={blur}/><p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Used to create their login account (one-time setup).</p></div>}
          <div>
            <label style={lS}>Mobile Number *</label>
            <div style={{ display:'flex' }}>
              <span style={{ padding:'9px 12px', background:'var(--bg)', border:'1.5px solid var(--border)', borderRight:'none', borderRadius:'8px 0 0 8px', fontSize:13, color:'var(--muted)', fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}>+91</span>
              <input type="tel" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="98765 43210" maxLength={10} style={{ ...iS, borderRadius:'0 8px 8px 0' }} onFocus={e=>{e.target.style.borderColor='var(--teal)';e.target.style.background='#fff'}} onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.background='var(--bg)'}}/>
            </div>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Used for OTP login — must receive SMS.</p>
          </div>
          {!isEdit && (
            <div style={{ background:'var(--teal-l)', border:'1px solid #9FD8C4', borderRadius:9, padding:'11px 13px', fontSize:12, color:'var(--teal)', display:'flex', flexDirection:'column', gap:3 }}>
              <strong style={{ marginBottom:3 }}>What happens when you click Add:</strong>
              <span>✓ Supabase account created automatically</span>
              <span>✓ Temporary password generated (shown once)</span>
              <span>✓ They log in daily via mobile OTP</span>
              <span>✓ They only see tickets assigned to them</span>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:9, padding:'0 22px 20px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', border:'1.5px solid var(--border)', borderRadius:9, fontSize:13, fontWeight:600, color:'var(--ink)', background:'white', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex:2, padding:'10px', background:loading?'var(--border)':'var(--teal)', color:'white', border:'none', borderRadius:9, fontSize:13.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'inherit' }}>
            {loading?<><svg style={{ animation:'spin .7s linear infinite', width:14, height:14 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>{isEdit?'Saving…':'Adding…'}</>:(isEdit?'Save Changes':`Add ${ROLE_META[role]?.label} →`)}
          </button>
        </div>
      </div>
      <style>{`@keyframes sU{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
