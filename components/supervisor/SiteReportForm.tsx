'use client'
import { useState } from 'react'
import SparePartsTable, { SparePart } from './SparePartsTable'

interface Alloc { id:string; visit_date:string; time_slot:string; notes:string|null; tickets:{ id:string; ticket_number:string; client_name:string; client_mobile:string; site_address:string; complaint_description:string } }
interface Props { allocation:Alloc; onSubmitted:()=>void }

const iS: React.CSSProperties = { width:'100%', padding:'8px 11px', fontSize:13, border:'1.5px solid var(--border)', borderRadius:7, background:'var(--bg)', color:'var(--ink)', outline:'none', transition:'all .18s', fontFamily:'inherit', boxSizing:'border-box' }
const lS: React.CSSProperties = { display:'block', fontSize:10.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }

export default function SiteReportForm({ allocation, onSubmitted }: Props) {
  const t = allocation.tickets
  const today = new Date().toISOString().split('T')[0]
  const [clientComplaint, setCC] = useState(t.complaint_description)
  const [observedIssue,   setOI] = useState('')
  const [urgency,         setU]  = useState('medium')
  const [repairTime,      setRT] = useState('')
  const [warrantyStatus,  setWS] = useState('within')
  const [remarks,         setR]  = useState('')
  const [parts,       setParts]  = useState<SparePart[]>([{article_name:'',article_number:'',quantity:1,unit_price:'',remarks:''}])
  const [supSigned,   setSS]     = useState(false)
  const [custSigned,  setCS]     = useState(false)
  const [loading,     setL]      = useState(false)
  const [error,       setE]      = useState('')

  const focus = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => { e.target.style.borderColor='var(--teal)'; e.target.style.background='#fff' }
  const blur  = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => { e.target.style.borderColor='var(--border)'; e.target.style.background='var(--bg)' }

  async function submit() {
    if (!observedIssue.trim()) { setE('Please fill in what you found on inspection.'); return }
    if (!supSigned||!custSigned) { setE('Both signatures required before submitting.'); return }
    setL(true); setE('')
    try {
      const res = await fetch('/api/supervisor/submit-report',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          ticket_id: t.id, visit_date: today,
          client_complaint: clientComplaint.trim(),
          observed_issue: observedIssue.trim(),
          urgency_level: urgency,
          est_repair_time: repairTime.trim()||null,
          warranty_status: warrantyStatus,
          remarks: remarks.trim()||null,
          supervisor_signed: true, client_signed: true,
          spare_parts: parts.filter(p=>p.article_name.trim()).map((p,i)=>({
            article_name: p.article_name.trim(),
            article_number: p.article_number.trim()||null,
            quantity: Number(p.quantity)||1,
            unit_price: p.unit_price?parseFloat(String(p.unit_price)):null,
            remarks: p.remarks.trim()||null,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||'Submission failed')
      onSubmitted()
    } catch(e:unknown) { setE(e instanceof Error?e.message:'Something went wrong.') }
    finally { setL(false) }
  }

  function Card({title,children}: {title:string;children:React.ReactNode}) {
    return (
      <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, overflow:'hidden', marginBottom:12, boxShadow:'var(--sh)' }}>
        <div style={{ padding:'11px 17px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:700, color:'var(--ink)', background:'var(--bg)' }}>{title}</div>
        <div style={{ padding:'15px 17px' }}>{children}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Ticket header */}
      <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-m))', borderRadius:13, padding:'15px 18px', color:'white', marginBottom:12 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:3 }}>{t.ticket_number}</div>
        <div className="serif" style={{ fontSize:17, marginBottom:4 }}>{t.client_name}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.65)', marginBottom:2 }}>📍 {t.site_address}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>📅 {new Date(allocation.visit_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · {allocation.time_slot}</div>
        {allocation.notes && <div style={{ marginTop:8, background:'rgba(255,255,255,.1)', borderRadius:7, padding:'7px 11px', fontSize:12, color:'rgba(255,255,255,.75)' }}>📝 {allocation.notes}</div>}
      </div>

      <Card title="📋 Visit Report">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div><label style={lS}>Client Complaint</label><textarea style={{ ...iS, resize:'none', minHeight:60 }} value={clientComplaint} onChange={e=>setCC(e.target.value)} onFocus={focus} onBlur={blur}/></div>
          <div><label style={lS}>Your Observation <span style={{ color:'var(--coral)' }}>*</span></label><textarea style={{ ...iS, resize:'none', minHeight:72 }} placeholder="Describe the actual issue you found…" value={observedIssue} onChange={e=>setOI(e.target.value)} onFocus={focus} onBlur={blur}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
            <div><label style={lS}>Urgency</label><select style={{ ...iS, cursor:'pointer' }} value={urgency} onChange={e=>setU(e.target.value)} onFocus={focus} onBlur={blur}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div><label style={lS}>Est. Repair Time</label><input style={iS} placeholder="e.g. 2–3 hours" value={repairTime} onChange={e=>setRT(e.target.value)} onFocus={focus} onBlur={blur}/></div>
          </div>
          <div><label style={lS}>Warranty Status</label><select style={{ ...iS, cursor:'pointer' }} value={warrantyStatus} onChange={e=>setWS(e.target.value)} onFocus={focus} onBlur={blur}><option value="within">Within warranty</option><option value="expired">Warranty expired</option><option value="not_duromax">Not a Duromax installation</option></select></div>
          <div><label style={lS}>Remarks (optional)</label><textarea style={{ ...iS, resize:'none', minHeight:56 }} placeholder="Any other observations…" value={remarks} onChange={e=>setR(e.target.value)} onFocus={focus} onBlur={blur}/></div>
        </div>
      </Card>

      <Card title="📦 Spare Parts Required">
        <SparePartsTable parts={parts} onChange={setParts}/>
      </Card>

      <Card title="✏️ Digital Sign-Off">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[{who:'supervisor',l:'Supervisor Sign-Off',signed:supSigned,set:setSS},{who:'customer',l:'Customer Sign-Off',signed:custSigned,set:setCS}].map(s=>(
            <button key={s.who} type="button" onClick={()=>s.set(v=>!v)} style={{ padding:'14px 10px', borderRadius:10, border:s.signed?'1.5px solid var(--teal)':'1.5px dashed var(--border)', background:s.signed?'var(--teal-l)':'var(--bg)', color:s.signed?'var(--teal)':'var(--muted)', fontSize:13, fontWeight:700, cursor:'pointer', textAlign:'center', transition:'all .18s', fontFamily:'inherit' }}>
              <div style={{ fontSize:22, marginBottom:5 }}>{s.signed?'✅':'✏️'}</div>
              <div>{s.signed?'Signed':'Tap to sign'}</div>
              <div style={{ fontSize:11, marginTop:2, fontWeight:500 }}>{s.l}</div>
            </button>
          ))}
        </div>
        <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginTop:11 }}>Both signatures required before submitting.</p>
      </Card>

      {error && <div style={{ background:'var(--coral-l)', border:'1px solid #FABDB0', color:'var(--coral)', fontSize:13, padding:'11px 15px', borderRadius:10, marginBottom:12 }}>{error}</div>}

      <button onClick={submit} disabled={loading} style={{ width:'100%', padding:'13px 20px', background:loading?'var(--border)':'var(--teal)', color:'white', border:'none', borderRadius:11, fontSize:14.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit', transition:'background .18s' }}>
        {loading?<><svg style={{ animation:'spin .7s linear infinite', width:16, height:16 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting…</>:'Submit Report →'}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
