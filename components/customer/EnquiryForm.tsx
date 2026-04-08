'use client'
import { useState, useRef } from 'react'

const BRANDS = ['Duromax UPVC','Fenesta','LG Hausys','Rehau','Schuco','Encraft','Kommerling','Veka','Wintech','Aluplast','Aparna Venster','AIS Windows','Deceuninck','Other / Unknown']
const ISSUES = ['Door not closing / opening properly','Window seal damaged / leaking','Handle or lock broken','Hinge misaligned or damaged','Roller issue','Glass crack','Frame gap / draughts','Noise / vibration issue','Other']

const iS: React.CSSProperties = { width:'100%', padding:'8px 11px', fontSize:13, border:'1.5px solid var(--border)', borderRadius:7, background:'var(--bg)', color:'var(--ink)', outline:'none', transition:'all .18s', fontFamily:'inherit', boxSizing:'border-box' }
const lS: React.CSSProperties = { display:'block', fontSize:10.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }
const focus = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => { e.target.style.borderColor='var(--teal)'; e.target.style.background='#fff' }
const blur  = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => { e.target.style.borderColor='var(--border)'; e.target.style.background='var(--bg)' }

export default function EnquiryForm({ onSuccess }: { onSuccess: (tn: string) => void }) {
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [photoFile,    setPhotoFile]    = useState<File|null>(null)
  const [photoPreview, setPhotoPreview] = useState<string|null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    client_name: '', client_mobile: '', site_address: '',
    brand: '', city: 'Within Delhi NCR', issue_type: '',
    complaint_description: '', duromax_install: 'yes',
    preferred_slot: 'morning',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB.'); return }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setError('')
  }

  async function submit() {
    if (!form.client_name.trim())                                    { setError('Please enter your full name.'); return }
    if (!form.client_mobile.replace(/\D/g,'').match(/^\d{10}$/))   { setError('Please enter a valid 10-digit mobile number.'); return }
    if (!form.site_address.trim())                                   { setError('Please enter your site address.'); return }
    if (!form.brand)                                                 { setError('Please select the brand of your doors/windows.'); return }
    if (!form.issue_type)                                            { setError('Please select the type of problem.'); return }
    if (!form.complaint_description.trim())                          { setError('Please describe the issue.'); return }

    setLoading(true); setError('')
    try {
      // Step 1: Create ticket
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name:           form.client_name.trim(),
          client_mobile:         form.client_mobile.trim(),
          site_address:          form.site_address.trim(),
          complaint_description: form.issue_type + ': ' + form.complaint_description.trim(),
          brand_installed:       form.brand,
          duromax_installation:  form.duromax_install === 'yes' ? true : form.duromax_install === 'no' ? false : null,
          preferred_slot:        form.preferred_slot,
          is_outstation:         form.city.includes('Outstation'),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')

      // Step 2: Upload photo if selected
      if (photoFile && data.ticket_id) {
        setUploadingPhoto(true)
        const fd = new FormData()
        fd.append('file', photoFile)
        fd.append('ticket_id', data.ticket_id)
        await fetch('/api/tickets/upload-photo', { method: 'POST', body: fd })
        setUploadingPhoto(false)
      }

      onSuccess(data.ticket_number)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
      setUploadingPhoto(false)
    }
  }

  return (
    <div style={{ background:'white', borderRadius:13, border:'1px solid var(--border)', boxShadow:'var(--sh)', overflow:'hidden' }}>
      <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)' }}>
        <div className="serif" style={{ fontSize:17 }}>📋 Fill Enquiry Form</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>Our team responds within a few hours.</div>
      </div>
      <div style={{ padding:'18px 20px 22px', display:'flex', flexDirection:'column', gap:13 }}>
        {error && <div style={{ background:'var(--coral-l)', border:'1px solid #FABDB0', color:'var(--coral)', fontSize:13, padding:'9px 13px', borderRadius:8 }}>{error}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
          <div><label style={lS}>Full Name *</label><input style={iS} placeholder="Priya Sharma" value={form.client_name} onChange={e=>set('client_name',e.target.value)} onFocus={focus} onBlur={blur}/></div>
          <div><label style={lS}>Mobile Number *</label><input style={iS} placeholder="+91 98765 43210" type="tel" value={form.client_mobile} onChange={e=>set('client_mobile',e.target.value)} onFocus={focus} onBlur={blur}/></div>
        </div>

        <div><label style={lS}>Site Address *</label><input style={iS} placeholder="Flat 4B, Sector 56, Gurugram" value={form.site_address} onChange={e=>set('site_address',e.target.value)} onFocus={focus} onBlur={blur}/></div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
          <div>
            <label style={lS}>Brand of Doors / Windows *</label>
            <select style={{ ...iS, cursor:'pointer' }} value={form.brand} onChange={e=>set('brand',e.target.value)} onFocus={focus} onBlur={blur}>
              <option value="">— Select Brand —</option>
              {BRANDS.map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Site Location</label>
            <select style={{ ...iS, cursor:'pointer' }} value={form.city} onChange={e=>set('city',e.target.value)} onFocus={focus} onBlur={blur}>
              <option>Within Delhi NCR</option>
              <option>Outstation (boarding &amp; lodging extra)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={lS}>Type of Problem *</label>
          <select style={{ ...iS, cursor:'pointer' }} value={form.issue_type} onChange={e=>set('issue_type',e.target.value)} onFocus={focus} onBlur={blur}>
            <option value="">— Select Issue Type —</option>
            {ISSUES.map(i=><option key={i}>{i}</option>)}
          </select>
        </div>

        <div><label style={lS}>Description *</label>
          <textarea style={{ ...iS, resize:'vertical', minHeight:68 }} placeholder="Describe the issue in detail…" value={form.complaint_description} onChange={e=>set('complaint_description',e.target.value)} onFocus={focus} onBlur={blur}/>
        </div>

        <div>
          <label style={lS}>Was installation done by Duromax?</label>
          <div style={{ display:'flex', gap:8 }}>
            {[{v:'yes',l:'Yes'},{v:'no',l:'No'},{v:'dk',l:'Not Sure'}].map(opt=>(
              <button key={opt.v} type="button" onClick={()=>set('duromax_install',opt.v)} style={{ flex:1, padding:'7px 10px', fontSize:12.5, fontWeight:600, borderRadius:7, border:form.duromax_install===opt.v?'1.5px solid var(--teal)':'1.5px solid var(--border)', background:form.duromax_install===opt.v?'var(--teal-l)':'var(--bg)', color:form.duromax_install===opt.v?'var(--teal)':'var(--muted)', cursor:'pointer', transition:'all .16s', fontFamily:'inherit' }}>{opt.l}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={lS}>Preferred Visit Time</label>
          <div style={{ display:'flex', gap:8 }}>
            {[{v:'morning',l:'Morning',s:'9–12'},{v:'afternoon',l:'Afternoon',s:'12–4'},{v:'evening',l:'Evening',s:'4–7'}].map(opt=>(
              <button key={opt.v} type="button" onClick={()=>set('preferred_slot',opt.v)} style={{ flex:1, padding:'8px 6px', fontSize:12, fontWeight:600, borderRadius:7, border:form.preferred_slot===opt.v?'1.5px solid var(--teal)':'1.5px solid var(--border)', background:form.preferred_slot===opt.v?'var(--teal-l)':'var(--bg)', color:form.preferred_slot===opt.v?'var(--teal)':'var(--muted)', cursor:'pointer', transition:'all .16s', textAlign:'center', fontFamily:'inherit' }}>
                <div>{opt.l}</div><div style={{ fontSize:11, opacity:.7 }}>{opt.s}</div>
              </button>
            ))}
          </div>
        </div>

        {/* REAL photo upload */}
        <div>
          <label style={lS}>Attach Photo (optional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display:'none' }}
            onChange={handlePhotoSelect}
          />
          {photoPreview ? (
            <div style={{ position:'relative', borderRadius:9, overflow:'hidden', border:'1.5px solid var(--teal)' }}>
              <img src={photoPreview} alt="Preview" style={{ width:'100%', maxHeight:180, objectFit:'cover', display:'block' }}/>
              <button onClick={()=>{ setPhotoFile(null); setPhotoPreview(null); if(fileRef.current) fileRef.current.value='' }} style={{ position:'absolute', top:7, right:7, background:'rgba(0,0,0,.55)', color:'white', border:'none', borderRadius:'50%', width:26, height:26, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>×</button>
              <div style={{ position:'absolute', bottom:7, left:7, background:'rgba(10,110,88,.85)', color:'white', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>✓ Photo selected</div>
            </div>
          ) : (
            <div onClick={()=>fileRef.current?.click()} style={{ border:'1.5px dashed var(--border)', borderRadius:7, padding:'14px', textAlign:'center', fontSize:12.5, color:'var(--muted)', cursor:'pointer', background:'var(--bg)', transition:'all .18s' }} onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='var(--teal)';(e.currentTarget as HTMLDivElement).style.color='var(--teal)'}} onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='var(--border)';(e.currentTarget as HTMLDivElement).style.color='var(--muted)'}}>
              📷 Tap to attach a photo of the issue <span style={{ fontSize:11, display:'block', marginTop:3, opacity:.65 }}>JPG, PNG or HEIC · Max 5MB</span>
            </div>
          )}
        </div>

        <button onClick={submit} disabled={loading} style={{ padding:'11px 20px', background:loading?'var(--border)':'var(--teal)', color:'white', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, fontFamily:'inherit', transition:'background .18s' }}>
          {loading ? (
            <><svg style={{ animation:'spin .7s linear infinite', width:15, height:15 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            {uploadingPhoto ? 'Uploading photo…' : 'Submitting…'}</>
          ) : 'Submit Enquiry →'}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
