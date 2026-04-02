'use client'
import { useState } from 'react'
import SparePartsTable, { SparePart } from './SparePartsTable'

interface Alloc { id:string; visit_date:string; time_slot:string; notes:string|null; tickets:{ id:string; ticket_number:string; client_name:string; client_mobile:string; site_address:string; complaint_description:string } }
interface Props { allocation:Alloc; onSubmitted:()=>void }

const inputS: React.CSSProperties = { width:'100%', padding:'11px 14px', fontSize:13.5, border:'1.5px solid #E5E7EB', borderRadius:10, background:'#F9FAFB', color:'#111827', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'all 0.15s' }
const labelS: React.CSSProperties = { display:'block', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }

export default function SiteReportForm({ allocation, onSubmitted }: Props) {
  const t     = allocation.tickets
  const today = new Date().toISOString().split('T')[0]
  const [clientComplaint,  setCC]    = useState(t.complaint_description)
  const [observedIssue,    setOI]    = useState('')
  const [urgency,          setU]     = useState('medium')
  const [repairTime,       setRT]    = useState('')
  const [warrantyStatus,   setWS]    = useState('within')
  const [remarks,          setR]     = useState('')
  const [parts,            setParts] = useState<SparePart[]>([{article_name:'',article_number:'',quantity:1,unit_price:'',remarks:''}])
  const [supSigned,        setSS]    = useState(false)
  const [custSigned,       setCS]    = useState(false)
  const [loading,          setL]     = useState(false)
  const [error,            setE]     = useState('')

  const focus = (e:React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => { e.target.style.borderColor='#0A5C48'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(10,92,72,0.08)' }
  const blur  = (e:React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; e.target.style.boxShadow='none' }

  async function submit() {
    if (!observedIssue.trim()) { setE('Please fill in what you found on inspection.'); return }
    if (!supSigned||!custSigned) { setE('Both signatures required before submitting.'); return }
    setL(true); setE('')
    try {
      const res = await fetch('/api/supervisor/submit-report',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ticket_id:t.id, visit_date:today, client_complaint:clientComplaint.trim(), observed_issue:observedIssue.trim(), urgency_level:urgency, est_repair_time:repairTime.trim()||null, warranty_status:warrantyStatus, remarks:remarks.trim()||null, supervisor_signed:true, client_signed:true, spare_parts:parts.filter(p=>p.article_name.trim()).map((p,i)=>({ article_name:p.article_name.trim(), article_number:p.article_number.trim()||null, quantity:Number(p.quantity)||1, unit_price:p.unit_price?parseFloat(String(p.unit_price)):null, remarks:p.remarks.trim()||null })) }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||'Submission failed')
      onSubmitted()
    } catch(e:unknown) { setE(e instanceof Error?e.message:'Something went wrong.') }
    finally { setL(false) }
  }

  const Card = ({ children, title }: { children:React.ReactNode; title:string }) => (
    <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:14, overflow:'hidden', marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ padding:'12px 18px', borderBottom:'1px solid #F3F4F6', fontSize:13, fontWeight:700, color:'#111827', background:'#FAFAFA' }}>{title}</div>
      <div style={{ padding:'16px 18px' }}>{children}</div>
    </div>
  )

  return (
    <div>
      {/* Ticket header */}
      <div style={{ background:'linear-gradient(135deg,#0A5C48,#0D7A60)', borderRadius:14, padding:'16px 18px', color:'white', marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>{t.ticket_number}</div>
        <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{t.client_name}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>📍 {t.site_address}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>📅 {new Date(allocation.visit_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · {allocation.time_slot}</div>
        {allocation.notes && <div style={{ marginTop:8, background:'rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'rgba(255,255,255,0.8)' }}>📝 {allocation.notes}</div>}
      </div>

      <Card title="Visit Report">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={labelS}>What customer described</label><textarea style={{ ...inputS, resize:'none', minHeight:64 }} value={clientComplaint} onChange={e=>setCC(e.target.value)} onFocus={focus} onBlur={blur}/></div>
          <div><label style={labelS}>What you found on inspection <span style={{ color:'#EF4444' }}>*</span></label><textarea style={{ ...inputS, resize:'none', minHeight:80 }} placeholder="Describe the actual issue observed…" value={observedIssue} onChange={e=>setOI(e.target.value)} onFocus={focus} onBlur={blur}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={labelS}>Urgency</label><select style={{ ...inputS, cursor:'pointer' }} value={urgency} onChange={e=>setU(e.target.value)} onFocus={focus} onBlur={blur}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div><label style={labelS}>Est. Repair Time</label><input style={inputS} placeholder="e.g. 2–3 hours" value={repairTime} onChange={e=>setRT(e.target.value)} onFocus={focus} onBlur={blur}/></div>
          </div>
          <div><label style={labelS}>Warranty Status</label><select style={{ ...inputS, cursor:'pointer' }} value={warrantyStatus} onChange={e=>setWS(e.target.value)} onFocus={focus} onBlur={blur}><option value="within">Within warranty</option><option value="expired">Warranty expired</option><option value="not_duromax">Not a Duromax install</option></select></div>
          <div><label style={labelS}>Remarks</label><textarea style={{ ...inputS, resize:'none', minHeight:60 }} placeholder="Any additional observations…" value={remarks} onChange={e=>setR(e.target.value)} onFocus={focus} onBlur={blur}/></div>
        </div>
      </Card>

      <Card title="Spare Parts Required">
        <SparePartsTable parts={parts} onChange={setParts}/>
      </Card>

      <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:14, overflow:'hidden', marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'12px 18px', borderBottom:'1px solid #F3F4F6', fontSize:13, fontWeight:700, color:'#111827', background:'#FAFAFA' }}>Digital Sign-Off</div>
        <div style={{ padding:'16px 18px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{who:'supervisor',label:'Supervisor Sign-Off',signed:supSigned,set:setSS},{who:'customer',label:'Customer Sign-Off',signed:custSigned,set:setCS}].map(s=>(
              <button key={s.who} type="button" onClick={()=>s.set(v=>!v)} style={{ padding:'16px 12px', borderRadius:12, border:s.signed?'2px solid #0A5C48':'2px dashed #E5E7EB', background:s.signed?'#ECFDF5':'#F9FAFB', color:s.signed?'#065F46':'#9CA3AF', fontSize:13, fontWeight:700, cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{s.signed?'✅':'✏️'}</div>
                <div>{s.signed?'Signed':'Tap to sign'}</div>
                <div style={{ fontSize:11, marginTop:2, fontWeight:500 }}>{s.label}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', marginTop:12 }}>Both parties must sign before submitting.</p>
        </div>
      </div>

      {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:13, padding:'12px 16px', borderRadius:12, marginBottom:12 }}>{error}</div>}

      <button onClick={submit} disabled={loading} style={{ width:'100%', padding:'14px 20px', background:loading?'#9CA3AF':'#0A5C48', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        {loading?<><svg style={{ animation:'spin 0.7s linear infinite', width:16, height:16 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting…</>:'Submit Report →'}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
