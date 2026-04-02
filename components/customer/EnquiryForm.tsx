'use client'
import { useState } from 'react'

const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s', fontFamily: 'inherit' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }

interface Props { onSuccess: (tn: string) => void }

export default function EnquiryForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ client_name:'', client_mobile:'', site_address:'', city:'Delhi NCR', complaint_type:'Door not closing properly', complaint_description:'', brand_installed:'', duromax_installation: null as boolean|null, preferred_slot:'morning' })
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const focus = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => { e.target.style.borderColor = '#0A5C48'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(10,92,72,0.08)' }
  const blur  = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none' }

  async function submit() {
    if (!form.client_name.trim()) { setError('Please enter your name.'); return }
    if (!form.client_mobile.trim() || form.client_mobile.replace(/\D/g,'').length < 10) { setError('Please enter a valid 10-digit mobile number.'); return }
    if (!form.site_address.trim()) { setError('Please enter your site address.'); return }
    if (!form.complaint_description.trim()) { setError('Please describe the problem.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/tickets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ client_name: form.client_name.trim(), client_mobile: form.client_mobile.trim(), site_address: form.site_address.trim(), complaint_description: form.complaint_type + ': ' + form.complaint_description.trim(), brand_installed: form.brand_installed.trim() || null, duromax_installation: form.duromax_installation, preferred_slot: form.preferred_slot, is_outstation: form.city.includes('Outside') }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      onSuccess(data.ticket_number)
    } catch(e: unknown) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Raise a Service Request</div>
        <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 3 }}>Our team responds within a few hours.</div>
      </div>
      <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, padding: '10px 14px', borderRadius: 10 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Full Name</label><input style={inputStyle} placeholder="Priya Sharma" value={form.client_name} onChange={e => set('client_name', e.target.value)} onFocus={focus} onBlur={blur}/></div>
          <div><label style={labelStyle}>Mobile</label><input style={inputStyle} placeholder="98765 43210" type="tel" value={form.client_mobile} onChange={e => set('client_mobile', e.target.value)} onFocus={focus} onBlur={blur}/></div>
        </div>
        <div><label style={labelStyle}>Site Address</label><input style={inputStyle} placeholder="Flat 4B, Sector 56, Gurugram" value={form.site_address} onChange={e => set('site_address', e.target.value)} onFocus={focus} onBlur={blur}/></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>City / Region</label><select style={{ ...inputStyle, cursor: 'pointer' }} value={form.city} onChange={e => set('city', e.target.value)} onFocus={focus} onBlur={blur}><option>Delhi NCR</option><option>Outside Delhi NCR (boarding charges apply)</option></select></div>
          <div><label style={labelStyle}>Problem Type</label><select style={{ ...inputStyle, cursor: 'pointer' }} value={form.complaint_type} onChange={e => set('complaint_type', e.target.value)} onFocus={focus} onBlur={blur}><option>Door not closing properly</option><option>Window seal damaged</option><option>Handle / lock broken</option><option>Hinge misaligned</option><option>Glass crack / leakage</option><option>Roller issue</option><option>Other</option></select></div>
        </div>
        <div><label style={labelStyle}>Describe the Problem</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Provide as much detail as possible…" value={form.complaint_description} onChange={e => set('complaint_description', e.target.value)} onFocus={focus} onBlur={blur}/></div>
        <div><label style={labelStyle}>Brand (optional)</label><input style={inputStyle} placeholder="e.g. VEKA, Fenesta" value={form.brand_installed} onChange={e => set('brand_installed', e.target.value)} onFocus={focus} onBlur={blur}/></div>
        <div>
          <label style={labelStyle}>Installed by Duromax?</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{v: true, l:'Yes, by Duromax'},{v: false, l:'No / Not sure'}].map(opt => (
              <button key={String(opt.v)} type="button" onClick={() => set('duromax_installation', opt.v)} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: form.duromax_installation === opt.v ? '2px solid #0A5C48' : '1.5px solid #E5E7EB', background: form.duromax_installation === opt.v ? '#ECFDF5' : '#F9FAFB', color: form.duromax_installation === opt.v ? '#065F46' : '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>{opt.l}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Preferred Visit Time</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{v:'morning',l:'Morning',s:'9–12'},{v:'afternoon',l:'Afternoon',s:'12–4'},{v:'evening',l:'Evening',s:'4–7'}].map(opt => (
              <button key={opt.v} type="button" onClick={() => set('preferred_slot', opt.v)} style={{ flex: 1, padding: '9px 8px', fontSize: 12.5, fontWeight: 600, borderRadius: 10, border: form.preferred_slot === opt.v ? '2px solid #0A5C48' : '1.5px solid #E5E7EB', background: form.preferred_slot === opt.v ? '#ECFDF5' : '#F9FAFB', color: form.preferred_slot === opt.v ? '#065F46' : '#6B7280', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
                <div>{opt.l}</div><div style={{ fontSize: 11, opacity: 0.7 }}>{opt.s}</div>
              </button>
            ))}
          </div>
        </div>
        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '13px 20px', background: loading ? '#9CA3AF' : '#0A5C48', color: 'white', border: 'none', borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          {loading ? <><svg style={{ animation:'spin 0.7s linear infinite', width:16, height:16 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting…</> : 'Submit Service Request →'}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
