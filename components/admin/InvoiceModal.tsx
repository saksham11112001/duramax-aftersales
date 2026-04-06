'use client'
import { useState } from 'react'
import type { Ticket } from '@/lib/types'

interface Props { ticket:Ticket; type:'visit_fee'|'spare_parts'; onConfirm:(o:boolean,a?:number)=>void; onClose:()=>void; loading:boolean }

export default function InvoiceModal({ ticket, type, onConfirm, onClose, loading }: Props) {
  const [outstation, setOutstation] = useState(ticket.is_outstation)
  const [customAmt,  setCustomAmt]  = useState('')
  const visitAmt = outstation ? 450000 : 300000
  const partsAmt = customAmt ? Math.round(parseFloat(customAmt) * 100) : 0

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,15,12,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:16, backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:420, boxShadow:'var(--sh-lg)', overflow:'hidden', animation:'sU .26s ease' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'linear-gradient(135deg,var(--teal),var(--teal-m))', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.55)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{type==='visit_fee'?'Site Visit Invoice':'Repair Invoice'}</div>
            <div className="serif" style={{ fontSize:18, color:'white' }}>{ticket.client_name}</div>
            <div style={{ fontSize:11.5, color:'rgba(255,255,255,.6)', marginTop:2 }}>{ticket.ticket_number} · {ticket.site_address}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.06em' }}>Amount Due</div>
            <div className="serif" style={{ fontSize:24, color:'white' }}>₹{((type==='visit_fee'?visitAmt:partsAmt)/100).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:13 }}>
          {type==='visit_fee' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:9, padding:'11px 14px' }}>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:600, color:'var(--ink)' }}>Outstation site?</div>
                  <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:2 }}>Adds boarding & lodging charges (+₹1,500)</div>
                </div>
                <div onClick={()=>setOutstation(v=>!v)} style={{ width:44, height:24, borderRadius:12, background:outstation?'var(--teal)':'var(--border)', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left:outstation?23:3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
                </div>
              </div>
              <div style={{ background:'var(--gold-l)', border:'1px solid #F0D090', borderRadius:9, padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color:'var(--gold)', marginBottom:5 }}><span>Site Visit Charges</span><span>₹2,542</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color:'var(--gold)', marginBottom:5 }}><span>GST (18%)</span><span>₹458</span></div>
                {outstation && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color:'var(--gold)', marginBottom:5 }}><span>Boarding & Lodging</span><span>₹1,500</span></div>}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700, color:'var(--gold)', borderTop:'1px dashed #F0D090', paddingTop:7, marginTop:3 }}>
                  <span>Total Amount Due</span><span>₹{(visitAmt/100).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </>
          )}
          {type==='spare_parts' && (
            <div>
              <label style={{ display:'block', fontSize:10.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>Total Amount (₹) *</label>
              <input type="number" placeholder="e.g. 2600" value={customAmt} onChange={e=>setCustomAmt(e.target.value)} style={{ width:'100%', padding:'10px 13px', fontSize:14, border:'1.5px solid var(--border)', borderRadius:8, background:'var(--bg)', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} onFocus={e=>{e.target.style.borderColor='var(--teal)';e.target.style.background='#fff'}} onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.background='var(--bg)'}}/>
              {partsAmt > 0 && (
                <div style={{ marginTop:9, background:'var(--gold-l)', border:'1px solid #F0D090', borderRadius:8, padding:'10px 13px', display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700, color:'var(--gold)' }}>
                  <span>Invoice Total</span><span>₹{(partsAmt/100).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          )}
          <div style={{ background:'#E7F7EF', border:'1px solid #A8DFC0', borderRadius:9, padding:'10px 13px', display:'flex', gap:8, fontSize:12.5, color:'#1A4A2A' }}>
            <span style={{ fontSize:16, flexShrink:0 }}>💬</span>
            Payment link sent to <strong>{ticket.client_mobile}</strong> via WhatsApp automatically.
          </div>
        </div>

        <div style={{ display:'flex', gap:9, padding:'0 22px 20px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', border:'1.5px solid var(--border)', borderRadius:9, fontSize:13, fontWeight:600, color:'var(--ink)', background:'white', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={()=>onConfirm(outstation, type==='spare_parts'?partsAmt:undefined)} disabled={loading||(type==='spare_parts'&&!customAmt)} style={{ flex:2, padding:'10px', background:loading||(type==='spare_parts'&&!customAmt)?'var(--border)':'var(--gold-m)', color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'inherit' }}>
            {loading?<><svg style={{ animation:'spin .7s linear infinite', width:14, height:14 }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Sending…</>:'🧾 Raise & Send via WhatsApp →'}
          </button>
        </div>
      </div>
      <style>{`@keyframes sU{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
