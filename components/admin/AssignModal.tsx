'use client'
import { useState } from 'react'
import type { Ticket, Profile } from '@/lib/types'

interface Props { ticket:Ticket; supervisors:Profile[]; assignType:'supervisor'|'installer'; onConfirm:(s:string,d:string,sl:string,n:string)=>void; onClose:()=>void; loading:boolean }
const SLOTS = ['9:00–11:00 AM','11:00 AM–1:00 PM','1:00 PM–3:00 PM','3:00 PM–5:00 PM','5:00 PM–7:00 PM']
const iS: React.CSSProperties = { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid var(--border)', borderRadius:7, background:'var(--bg)', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
const lS: React.CSSProperties = { display:'block', fontSize:10.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }

export default function AssignModal({ ticket, supervisors, onConfirm, onClose, loading }: Props) {
  const today = new Date().toISOString().split('T')[0]
  // Show ALL active field staff — admin can assign any supervisor or installer to any ticket
  const field = supervisors
  const [selId, setSelId] = useState(field[0]?.id ?? '')
  const [date,  setDate]  = useState(today)
  const [slot,  setSlot]  = useState(SLOTS[0])
  const [notes, setNotes] = useState('')

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,15,12,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:16, backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:440, boxShadow:'var(--sh-lg)', overflow:'hidden', animation:'sU .26s ease' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'linear-gradient(135deg,var(--teal),var(--teal-m))', padding:'18px 22px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.55)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Assign Field Staff</div>
          <div className="serif" style={{ fontSize:17, color:'white' }}>{ticket.client_name}</div>
          <div style={{ fontSize:11.5, color:'rgba(255,255,255,.6)', marginTop:2 }}>{ticket.ticket_number} · {ticket.site_address}</div>
        </div>

        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <label style={lS}>Select Staff Member</label>
            {field.length === 0 ? (
              <div style={{ background:'var(--coral-l)', border:'1px solid #FABDB0', color:'var(--coral)', fontSize:13, padding:'11px 13px', borderRadius:8 }}>
                No active staff found. <a href="/dashboard/staff" style={{ color:'var(--coral)', fontWeight:700 }}>Add staff →</a>
              </div>
            ) : (
              <select style={{ ...iS, cursor:'pointer' }} value={selId} onChange={e=>setSelId(e.target.value)} onFocus={e=>{e.target.style.borderColor='var(--teal)';e.target.style.background='#fff'}} onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.background='var(--bg)'}}>
                {field.map(s=><option key={s.id} value={s.id}>{s.role==='installer'?'🛠️':'🔧'} {s.full_name}{s.mobile?` · ${s.mobile}`:''} [{s.role}]</option>)}
              </select>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
            <div><label style={lS}>Visit Date</label><input type="date" style={iS} value={date} min={today} onChange={e=>setDate(e.target.value)} onFocus={e=>e.target.style.borderColor='var(--teal)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/></div>
            <div><label style={lS}>Time Slot</label><select style={{ ...iS, cursor:'pointer' }} value={slot} onChange={e=>setSlot(e.target.value)}>{SLOTS.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>

          <div><label style={lS}>Notes (optional)</label><textarea style={{ ...iS, resize:'none', minHeight:60 }} placeholder="Access instructions, landmark, approved parts list…" value={notes} onChange={e=>setNotes(e.target.value)}/></div>

          <div style={{ background:'#EEF4FF', border:'1px solid #B5D4F4', borderRadius:9, padding:'10px 13px', display:'flex', gap:9 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🔔</span>
            <div style={{ fontSize:12, color:'#0C447C', lineHeight:1.5 }}>
              <strong style={{ display:'block', marginBottom:1 }}>Auto-reminder will be sent instantly</strong>
              Staff member receives WhatsApp with site details, client complaint, visit time &amp; location as soon as you assign.
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:9, padding:'0 22px 20px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', border:'1.5px solid var(--border)', borderRadius:9, fontSize:13, fontWeight:600, color:'var(--ink)', background:'white', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={()=>onConfirm(selId,date,slot,notes)} disabled={loading||!selId||!date||field.length===0} style={{ flex:2, padding:'10px', background:loading||!selId||!date||field.length===0?'var(--border)':'var(--teal)', color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'inherit' }}>
            {loading?<><svg style={{ animation:'spin .7s linear infinite', width:14, height:14 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Assigning…</>:'Assign & Notify →'}
          </button>
        </div>
      </div>
      <style>{`@keyframes sU{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
