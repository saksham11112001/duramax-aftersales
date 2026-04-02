'use client'
import { useState } from 'react'
import type { Ticket, Profile } from '@/lib/types'

interface Props { ticket:Ticket; supervisors:Profile[]; onConfirm:(s:string,d:string,sl:string,n:string)=>void; onClose:()=>void; loading:boolean }
const SLOTS = ['9:00 AM – 11:00 AM','11:00 AM – 1:00 PM','1:00 PM – 3:00 PM','3:00 PM – 5:00 PM','5:00 PM – 7:00 PM']
const inputS: React.CSSProperties = { width:'100%', padding:'11px 14px', fontSize:13.5, border:'1.5px solid #E5E7EB', borderRadius:10, background:'#F9FAFB', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
const labelS: React.CSSProperties = { display:'block', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }

export default function AssignModal({ ticket, supervisors, onConfirm, onClose, loading }: Props) {
  const today   = new Date().toISOString().split('T')[0]
  const field   = supervisors.filter(s => s.role === 'supervisor' || s.role === 'installer')
  const [supId, setSupId] = useState(field[0]?.id ?? '')
  const [date,  setDate]  = useState(today)
  const [slot,  setSlot]  = useState(SLOTS[0])
  const [notes, setNotes] = useState('')
  const sel = field.find(s => s.id === supId)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:16 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'linear-gradient(135deg,#0A5C48,#0D7A60)', padding:'20px 24px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Assign Field Staff</div>
          <div style={{ fontSize:16, fontWeight:800, color:'white' }}>{ticket.client_name}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{ticket.ticket_number} · {ticket.site_address}</div>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={labelS}>Select Staff Member</label>
            {field.length === 0 ? (
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:13, padding:'12px 14px', borderRadius:10 }}>
                No field staff found. <a href="/dashboard/staff" style={{ color:'#DC2626', fontWeight:700 }}>Add staff →</a>
              </div>
            ) : (
              <>
                <select style={{ ...inputS, cursor:'pointer' }} value={supId} onChange={e=>setSupId(e.target.value)}>
                  {field.map(s=>(
                    <option key={s.id} value={s.id}>
                      {s.role==='installer'?'🛠️':'🔧'} {s.full_name}{s.mobile?` · ${s.mobile}`:''}
                    </option>
                  ))}
                </select>
                {sel && (
                  <div style={{ marginTop:6, background:'#F9FAFB', border:'1px solid #F3F4F6', borderRadius:9, padding:'8px 12px', fontSize:12, color:'#6B7280' }}>
                    📱 They will receive visit details via WhatsApp and log in with mobile OTP
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={labelS}>Visit Date</label><input type="date" style={inputS} value={date} min={today} onChange={e=>setDate(e.target.value)}/></div>
            <div><label style={labelS}>Time Slot</label><select style={{ ...inputS, cursor:'pointer' }} value={slot} onChange={e=>setSlot(e.target.value)}>{SLOTS.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label style={labelS}>Notes (optional)</label><textarea style={{ ...inputS, resize:'none', minHeight:60 }} placeholder="Access code, landmark, special instructions…" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
          <div style={{ background:'#ECFDF5', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'#065F46' }}>💬 Visit details + login link sent to their WhatsApp automatically.</div>
        </div>
        <div style={{ display:'flex', gap:10, padding:'0 24px 22px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:13, fontWeight:600, color:'#374151', background:'white', cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>onConfirm(supId,date,slot,notes)} disabled={loading||!supId||!date||field.length===0} style={{ flex:2, padding:'11px', background:loading||!supId||!date||field.length===0?'#E5E7EB':'#0A5C48', color:'white', border:'none', borderRadius:12, fontSize:13.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading?<><svg style={{ animation:'spin 0.7s linear infinite', width:14, height:14 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Assigning…</>:'Assign & Notify →'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
