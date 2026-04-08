'use client'
import { useState, useEffect } from 'react'

interface SLASetting {
  id: string
  stage_key: string
  stage_label: string
  hours: number
}

interface Props { onClose: () => void }

export default function SLASettingsModal({ onClose }: Props) {
  const [settings, setSettings] = useState<SLASetting[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')

  useEffect(() => {
    fetch('/api/admin/sla-settings')
      .then(r => r.json())
      .then(d => { setSettings(d.settings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function updateHours(key: string, val: string) {
    setSettings(prev => prev.map(s => s.stage_key === key ? { ...s, hours: parseInt(val) || 1 } : s))
  }

  async function save() {
    setSaving(true)
    const res = await fetch('/api/admin/sla-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
    setSaving(false)
    if (res.ok) {
      setToast('✓ SLA settings saved')
      setTimeout(() => { setToast(''); onClose() }, 1200)
    }
  }

  const defaultHours: Record<string, number> = {
    enquiry_to_invoice: 4, invoice_to_payment: 48, payment_to_supervisor: 48,
    supervisor_to_visit: 72, visit_to_quote: 6, quote_to_payment: 48,
    payment_to_installer: 24, installer_to_complete: 120, complete_to_close: 4,
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,15,12,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:16, backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:520, boxShadow:'0 8px 32px rgba(0,0,0,.13)', overflow:'hidden', animation:'sU .26s ease', maxHeight:'90vh', display:'flex', flexDirection:'column' }} onClick={e=>e.stopPropagation()}>

        <div style={{ background:'linear-gradient(135deg,var(--teal),var(--teal-m))', padding:'18px 22px', flexShrink:0 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.55)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Admin Settings</div>
          <div className="serif" style={{ fontSize:18, color:'white' }}>⏱ SLA Settings</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginTop:3 }}>Set how many hours each stage is allowed before it is flagged as overdue.</div>
        </div>

        <div style={{ padding:'16px 22px', overflowY:'auto', flex:1 }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)' }}>Loading settings…</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 80px', gap:0, padding:'7px 10px', background:'var(--bg)', borderRadius:'8px 8px 0 0', borderBottom:'2px solid var(--border)' }}>
                {['Stage', 'Hours', 'Unit', 'Status'].map(h => (
                  <div key={h} style={{ fontSize:9.5, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                ))}
              </div>
              {settings.map((s, i) => {
                const isDefault = s.hours === defaultHours[s.stage_key]
                const isModified = !isDefault
                return (
                  <div key={s.stage_key} style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 80px', gap:0, padding:'9px 10px', background:i%2===0?'white':'var(--bg)', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                    <div style={{ fontSize:12.5, fontWeight:600, color:'var(--ink)', paddingRight:8 }}>{s.stage_label}</div>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={s.hours}
                      onChange={e => updateHours(s.stage_key, e.target.value)}
                      style={{ width:70, padding:'5px 8px', fontSize:13, border:'1.5px solid var(--border)', borderRadius:7, background:'var(--bg)', outline:'none', fontFamily:'inherit', textAlign:'center', transition:'border-color .18s' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.background = '#fff' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg)' }}
                    />
                    <div style={{ fontSize:11.5, color:'var(--muted)', paddingLeft:6 }}>hours</div>
                    <div>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:isModified?'var(--gold-l)':'var(--bg)', color:isModified?'var(--gold)':'var(--muted)', border:`1px solid ${isModified?'#F0D090':'var(--border)'}` }}>
                        {isModified ? 'Modified' : 'Default'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ background:'var(--teal-l)', border:'1px solid #9FD8C4', borderRadius:9, padding:'10px 13px', marginTop:13, fontSize:12, color:'var(--teal)', lineHeight:1.6 }}>
            <strong style={{ display:'block', marginBottom:2 }}>How this works:</strong>
            When a ticket stays in a stage longer than the hours you set, it shows a red "🔴 Overdue" badge in the pipeline board. Admin also receives an email alert. Changes apply to all new tickets from today.
          </div>
        </div>

        <div style={{ display:'flex', gap:9, padding:'14px 22px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', border:'1.5px solid var(--border)', borderRadius:9, fontSize:13, fontWeight:600, color:'var(--ink)', background:'white', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={save} disabled={saving || loading} style={{ flex:2, padding:'10px', background:saving||loading?'var(--border)':'var(--teal)', color:'white', border:'none', borderRadius:9, fontSize:13.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'inherit' }}>
            {saving ? '⏳ Saving…' : toast || 'Save SLA Settings →'}
          </button>
        </div>
      </div>
      <style>{`@keyframes sU{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}
