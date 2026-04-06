import type { Ticket } from '@/lib/types'
function Stars({ n }: { n:number|null }) {
  if (!n) return <span style={{ color:'var(--border)', fontSize:13 }}>Not rated</span>
  return <span style={{ fontSize:16 }}>{'★'.repeat(n)}<span style={{ color:'var(--border)' }}>{'★'.repeat(5-n)}</span></span>
}
export default function FeedbackPanel({ tickets }: { tickets: Ticket[] }) {
  const withFb = tickets.filter(t=>t.feedback?.submitted_at)
  if (!withFb.length) return (
    <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:13, padding:'60px 24px', textAlign:'center', boxShadow:'var(--sh)' }}>
      <div style={{ fontSize:40, marginBottom:10 }}>⭐</div>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--muted)' }}>No feedback yet</div>
    </div>
  )
  const avg = (withFb.reduce((s,t)=>s+(t.feedback?.overall_rating??0),0)/withFb.length).toFixed(1)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-m))', borderRadius:13, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'white', boxShadow:'var(--sh)' }}>
        <div><div className="serif" style={{ fontSize:32 }}>{avg} <span style={{ color:'#FCD34D', fontSize:24 }}>★</span></div><div style={{ fontSize:11.5, color:'rgba(255,255,255,.6)', marginTop:2 }}>Average Rating</div></div>
        <div style={{ textAlign:'right' }}><div className="serif" style={{ fontSize:28 }}>{withFb.length}</div><div style={{ fontSize:11.5, color:'rgba(255,255,255,.6)', marginTop:2 }}>Responses</div></div>
      </div>
      {withFb.map(t => { const fb=t.feedback!; return (
        <div key={t.id} style={{ background:'white', border:'1px solid var(--border)', borderRadius:11, padding:'13px 15px', boxShadow:'var(--sh)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div><div style={{ fontSize:13.5, fontWeight:700 }}>{t.client_name}</div><div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{t.ticket_number} · {new Date(fb.submitted_at!).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div>
            <div style={{ textAlign:'right' }}><div style={{ color:'var(--gold-m)', fontSize:16 }}>{'★'.repeat(fb.overall_rating??0)}<span style={{ color:'var(--border)' }}>{'★'.repeat(5-(fb.overall_rating??0))}</span></div><div style={{ fontSize:11, color:'var(--muted)' }}>{fb.overall_rating}/5</div></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
            {[{l:'Repair Quality',v:fb.quality_rating},{l:'Supervisor',v:fb.supervisor_rating},{l:'Timeliness',v:fb.timeliness_rating}].map(item=>(
              <div key={item.l} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', textAlign:'center' }}>
                <div style={{ fontSize:9.5, color:'var(--muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{item.l}</div>
                <Stars n={item.v??null}/>
              </div>
            ))}
          </div>
          {fb.comment && <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px', fontSize:12.5, color:'var(--ink)', fontStyle:'italic', lineHeight:1.55 }}>"{fb.comment}"</div>}
        </div>
      )})}
    </div>
  )
}
