'use client'
import { useState } from 'react'
import type { Ticket } from '@/lib/types'

interface Props { ticket:Ticket; type:'visit_fee'|'spare_parts'; onConfirm:(o:boolean,a?:number)=>void; onClose:()=>void; loading:boolean }

export default function InvoiceModal({ ticket, type, onConfirm, onClose, loading }: Props) {
  const [outstation, setOutstation] = useState(ticket.is_outstation)
  const [customAmt,  setCustomAmt]  = useState('')
  const visitAmt = outstation ? 450000 : 300000
  const partsAmt = customAmt ? Math.round(parseFloat(customAmt)*100) : 0

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:16 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid #F3F4F6', background:'linear-gradient(135deg,#FFFBEB,#FEF9C3)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'0.07em' }}>{type==='visit_fee'?'Site Visit Invoice':'Parts & Labour Invoice'}</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#111827', marginTop:3 }}>{ticket.client_name}</div>
          <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{ticket.ticket_number} · {ticket.site_address}</div>
        </div>
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          {type==='visit_fee' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:12, padding:'12px 16px' }}>
                <div><div style={{ fontSize:13.5, fontWeight:600, color:'#111827' }}>Outstation site?</div><div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Adds boarding & lodging (+₹1,500)</div></div>
                <div onClick={() => setOutstation(v=>!v)} style={{ width:44, height:24, borderRadius:12, background:outstation?'#0A5C48':'#E5E7EB', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left:outstation?23:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                </div>
              </div>
              <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:12, padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#92400E', marginBottom:6 }}><span>Site Visit Fee</span><span>₹3,000</span></div>
                {outstation && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#92400E', marginBottom:6 }}><span>Boarding & Lodging</span><span>₹1,500</span></div>}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:800, color:'#78350F', borderTop:'1px dashed #FCD34D', paddingTop:8, marginTop:4 }}><span>Total</span><span>₹{(visitAmt/100).toLocaleString('en-IN')}</span></div>
              </div>
            </>
          )}
          {type==='spare_parts' && (
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Total Amount (₹)</label>
              <input type="number" placeholder="e.g. 2600" value={customAmt} onChange={e=>setCustomAmt(e.target.value)} style={{ width:'100%', padding:'12px 14px', fontSize:14, border:'1.5px solid #E5E7EB', borderRadius:10, background:'#F9FAFB', outline:'none', boxSizing:'border-box' }}/>
              {partsAmt>0 && <div style={{ marginTop:10, background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:800, color:'#78350F' }}><span>Invoice Total</span><span>₹{(partsAmt/100).toLocaleString('en-IN')}</span></div>}
            </div>
          )}
          <div style={{ background:'#ECFDF5', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'#065F46' }}>
            💬 WhatsApp payment link will be sent to <strong>{ticket.client_mobile}</strong>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, padding:'0 22px 20px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 16px', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:13, fontWeight:600, color:'#374151', background:'white', cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>onConfirm(outstation, type==='spare_parts'?partsAmt:undefined)} disabled={loading||(type==='spare_parts'&&!customAmt)} style={{ flex:2, padding:'11px 16px', background:loading||(type==='spare_parts'&&!customAmt)?'#E5E7EB':'#B45309', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading?<><svg style={{ animation:'spin 0.7s linear infinite', width:14, height:14 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Sending…</>:'🧾 Send Invoice'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
