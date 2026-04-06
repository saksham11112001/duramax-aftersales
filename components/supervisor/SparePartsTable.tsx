'use client'
export interface SparePart { article_name:string; article_number:string; quantity:number; unit_price:string|number; remarks:string }
const empty = (): SparePart => ({article_name:'',article_number:'',quantity:1,unit_price:'',remarks:''})
const cS: React.CSSProperties = { width:'100%', fontSize:12, padding:'6px 9px', border:'1px solid var(--border)', borderRadius:7, background:'var(--bg)', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .18s' }
export default function SparePartsTable({ parts, onChange }: { parts:SparePart[]; onChange:(p:SparePart[])=>void }) {
  const upd = (i:number, k:keyof SparePart, v:string|number) => onChange(parts.map((p,idx)=>idx===i?{...p,[k]:v}:p))
  const focus = (e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor = 'var(--teal)'
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor = 'var(--border)'
  return (
    <div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'1.5px solid var(--border)' }}>
              {['#','Article Name','Art. No.','Qty','Unit ₹','Remarks',''].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'0 8px 7px 0', fontSize:9.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parts.map((p,i)=>(
              <tr key={i} style={{ borderBottom:'1px dashed var(--border)' }}>
                <td style={{ padding:'5px 8px 5px 0', color:'var(--muted)', fontWeight:700 }}>{i+1}</td>
                <td style={{ padding:'5px 8px 5px 0', minWidth:110 }}><input style={cS} placeholder="Weather Strip" value={p.article_name} onChange={e=>upd(i,'article_name',e.target.value)} onFocus={focus} onBlur={blur}/></td>
                <td style={{ padding:'5px 8px 5px 0', width:80 }}><input style={cS} placeholder="WS-75" value={p.article_number} onChange={e=>upd(i,'article_number',e.target.value)} onFocus={focus} onBlur={blur}/></td>
                <td style={{ padding:'5px 8px 5px 0', width:55 }}><input style={cS} type="number" min={1} placeholder="1" value={p.quantity} onChange={e=>upd(i,'quantity',Number(e.target.value))} onFocus={focus} onBlur={blur}/></td>
                <td style={{ padding:'5px 8px 5px 0', width:75 }}><input style={cS} type="number" min={0} placeholder="400" value={p.unit_price} onChange={e=>upd(i,'unit_price',e.target.value)} onFocus={focus} onBlur={blur}/></td>
                <td style={{ padding:'5px 8px 5px 0', minWidth:80 }}><input style={cS} placeholder="Optional" value={p.remarks} onChange={e=>upd(i,'remarks',e.target.value)} onFocus={focus} onBlur={blur}/></td>
                <td style={{ padding:'5px 0' }}><button onClick={()=>onChange(parts.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', color:'var(--border)', cursor:'pointer', fontSize:18, lineHeight:1, fontWeight:300, padding:'0 4px' }}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={()=>onChange([...parts,empty()])} style={{ marginTop:9, background:'none', border:'none', color:'var(--teal)', fontSize:12.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:0, fontFamily:'inherit' }}>+ Add Part</button>
    </div>
  )
}
