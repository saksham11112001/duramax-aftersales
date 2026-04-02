'use client'
import { useState } from 'react'
import type { Profile, StaffStats } from '@/lib/types'
import LogoutButton from '@/components/shared/LogoutButton'

interface Props { initialStaff: Profile[]; adminName: string }

const ROLE_META = {
  supervisor: { label: 'Supervisor', color: '#065F46', bg: '#ECFDF5', border: '#86EFAC', icon: '🔧' },
  installer:  { label: 'Installer',  color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD', icon: '🛠️' },
}

export default function StaffManagement({ initialStaff, adminName }: Props) {
  const [staff,       setStaff]       = useState<Profile[]>(initialStaff)
  const [tab,         setTab]         = useState<'all'|'supervisor'|'installer'>('all')
  const [showForm,    setShowForm]    = useState(false)
  const [editStaff,   setEditStaff]   = useState<Profile|null>(null)
  const [selStaff,    setSelStaff]    = useState<Profile|null>(null)
  const [selStats,    setSelStats]    = useState<StaffStats|null>(null)
  const [statsLoad,   setStatsLoad]   = useState(false)
  const [toast,       setToast]       = useState('')
  const [toastOk,     setToastOk]     = useState(true)
  const [creds,       setCreds]       = useState<{name:string;email:string;tempPw:string;loginUrl:string}|null>(null)

  const showToast = (msg: string, ok = true) => { setToast(msg); setToastOk(ok); setTimeout(() => setToast(''), 4000) }

  async function loadStats(s: Profile) {
    setSelStaff(s); setSelStats(null); setStatsLoad(true)
    const res = await fetch(`/api/admin/staff/${s.id}/stats`)
    const data = await res.json()
    setSelStats(data.stats ?? null)
    setStatsLoad(false)
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (res.ok) {
      setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
      if (selStaff?.id === id) setSelStaff(prev => prev ? { ...prev, is_active: !current } : null)
      showToast(current ? '⏸ Staff deactivated' : '✅ Staff activated')
    } else showToast('❌ Failed to update', false)
  }

  const filtered = tab === 'all' ? staff : staff.filter(s => s.role === tab)
  const counts   = { all: staff.length, supervisor: staff.filter(s=>s.role==='supervisor').length, installer: staff.filter(s=>s.role==='installer').length }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F4F8' }}>
      {/* Top bar */}
      <div style={{ background: 'linear-gradient(135deg,#0A5C48,#0D7A60)', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 2px 8px rgba(10,92,72,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="/dashboard/admin" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← Dashboard</a>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }}/>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Staff Management</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{adminName}</span>
          <LogoutButton/>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, maxWidth: 1100, margin: '0 auto', padding: '24px 20px 48px' }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>Field Team</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Manage supervisors and installers</p>
            </div>
            <button onClick={() => { setEditStaff(null); setShowForm(true) }} style={{ background: '#0A5C48', color: 'white', border: 'none', borderRadius: 11, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 17 }}>+</span> Add Staff
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { k: 'all',        label: 'Total Staff',  icon: '👥', color: '#374151' },
              { k: 'supervisor', label: 'Supervisors',  icon: '🔧', color: '#065F46' },
              { k: 'installer',  label: 'Installers',   icon: '🛠️', color: '#1D4ED8' },
            ].map(s => (
              <div key={s.k} onClick={() => setTab(s.k as 'all'|'supervisor'|'installer')} style={{ background: tab === s.k ? s.color : 'white', border: tab === s.k ? `2px solid ${s.color}` : '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: tab === s.k ? 'white' : s.color }}>{counts[s.k as keyof typeof counts]}</div>
                <div style={{ fontSize: 11.5, color: tab === s.k ? 'rgba(255,255,255,0.7)' : '#9CA3AF', marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Credentials card */}
          {creds && (
            <div style={{ background: '#ECFDF5', border: '1px solid #86EFAC', borderRadius: 13, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#065F46' }}>✅ {creds.name} onboarded — share these login details</div>
                <button onClick={() => setCreds(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ l: 'Email', v: creds.email }, { l: 'Temp Password', v: creds.tempPw }, { l: 'Login URL', v: creds.loginUrl }, { l: 'Login Method', v: 'Mobile OTP (daily)' }].map(item => (
                  <div key={item.l} style={{ background: 'white', borderRadius: 8, padding: '9px 12px', border: '1px solid #D1FAE5' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{item.l}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#065F46', wordBreak: 'break-all' }}>{item.v}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: '#059669', marginTop: 8 }}>ℹ️ For day-to-day login they use mobile OTP at <strong>/supervisor/verify</strong>. Share the URL and their mobile number — no password needed for OTP login.</p>
            </div>
          )}

          {/* Staff list */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1fr 1fr 110px', padding: '10px 18px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              {['Name & Role', 'Mobile', 'Login Method', 'Status', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>👥</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF' }}>No staff yet</div>
                <div style={{ fontSize: 12.5, color: '#D1D5DB', marginTop: 4 }}>Click "Add Staff" to onboard your first team member</div>
              </div>
            ) : filtered.map((s, i) => {
              const meta = ROLE_META[s.role as keyof typeof ROLE_META] ?? ROLE_META.supervisor
              const isSel = selStaff?.id === s.id
              return (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1fr 1fr 110px', padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #F9FAFB' : 'none', alignItems: 'center', background: isSel ? '#F0FDF9' : s.is_active ? 'white' : '#FAFAFA', opacity: s.is_active ? 1 : 0.6, cursor: 'pointer', transition: 'background 0.15s' }} onClick={() => loadStats(s)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{s.full_name}</div>
                      <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{meta.label}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#6B7280' }}>{s.mobile || '—'}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>📱 Mobile OTP</div>
                  <div>
                    <span style={{ background: s.is_active ? '#DCFCE7' : '#F3F4F6', color: s.is_active ? '#15803D' : '#9CA3AF', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: `1px solid ${s.is_active ? '#86EFAC' : '#E5E7EB'}` }}>
                      {s.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditStaff(s); setShowForm(true) }} style={{ padding: '5px 10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => toggleActive(s.id, s.is_active)} style={{ padding: '5px 10px', background: s.is_active ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${s.is_active ? '#FECACA' : '#86EFAC'}`, borderRadius: 7, fontSize: 11, fontWeight: 600, color: s.is_active ? '#DC2626' : '#16A34A', cursor: 'pointer' }}>
                      {s.is_active ? 'Off' : 'On'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10, textAlign: 'center' }}>Click any row to view performance stats →</p>
        </div>

        {/* Stats panel */}
        <div>
          {!selStaff ? (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF' }}>Select a staff member</div>
              <div style={{ fontSize: 12.5, color: '#D1D5DB', marginTop: 4 }}>to view their performance stats</div>
            </div>
          ) : (
            <StaffStatsPanel staff={selStaff} stats={selStats} loading={statsLoad}/>
          )}
        </div>
      </div>

      {showForm && (
        <StaffFormModal
          existingStaff={editStaff}
          onClose={() => { setShowForm(false); setEditStaff(null) }}
          onSaved={(s, cr) => {
            if (editStaff) {
              setStaff(prev => prev.map(x => x.id === s.id ? s : x))
              showToast('✅ Updated')
            } else {
              setStaff(prev => [s, ...prev])
              if (cr) setCreds(cr)
              showToast('✅ Staff member onboarded!')
            }
            setShowForm(false); setEditStaff(null)
          }}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toastOk ? '#0A5C48' : '#DC2626', color: 'white', fontSize: 13.5, fontWeight: 600, padding: '12px 20px', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', zIndex: 999 }}>{toast}</div>
      )}
    </div>
  )
}

// ─── Stats Panel ─────────────────────────────────────────────
function StaffStatsPanel({ staff, stats, loading }: { staff: Profile; stats: StaffStats|null; loading: boolean }) {
  const meta = ROLE_META[staff.role as keyof typeof ROLE_META] ?? ROLE_META.supervisor
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0A5C48,#0D7A60)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{meta.icon}</div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>{staff.full_name}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>{meta.label} · {staff.mobile || 'No mobile'}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 13 }}>Loading stats…</div>
          </div>
        ) : !stats ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 13 }}>No stats available</div>
          </div>
        ) : (
          <>
            {/* Big numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { n: stats.total_assigned, l: 'Total Assigned',  icon: '📋', color: '#374151' },
                { n: stats.total_closed,   l: 'Completed',       icon: '✅', color: '#065F46' },
                { n: stats.in_progress,    l: 'In Progress',     icon: '⚡', color: '#1D4ED8' },
                { n: stats.this_month,     l: 'This Month',      icon: '📅', color: '#6D28D9' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 11, padding: '13px 14px' }}>
                  <div style={{ fontSize: 18 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Performance metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Rating */}
              <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Customer Rating</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#B45309' }}>
                      {stats.avg_rating ? `${stats.avg_rating}★` : '—'}
                    </div>
                  </div>
                  {stats.avg_rating && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, color: '#FBBF24' }}>
                        {'★'.repeat(Math.round(stats.avg_rating))}
                        <span style={{ color: '#FDE68A' }}>{'★'.repeat(5 - Math.round(stats.avg_rating))}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#92400E', marginTop: 2 }}>out of 5</div>
                    </div>
                  )}
                </div>
              </div>

              {/* On-time % */}
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.06em' }}>On-Time Completion</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#15803D' }}>{stats.on_time_pct}%</div>
                </div>
                <div style={{ height: 7, background: '#D1FAE5', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: stats.on_time_pct + '%', background: '#10B981', borderRadius: 10, transition: 'width 0.5s' }}/>
                </div>
              </div>

              {/* Revenue */}
              <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Revenue Generated</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1D4ED8' }}>
                  ₹{Math.round((stats.total_revenue || 0) / 100).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11.5, color: '#3B82F6', marginTop: 2 }}>across all completed tickets</div>
              </div>
            </div>
          </>
        )}

        {/* Status indicator */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>Account Status</span>
          <span style={{ background: staff.is_active ? '#DCFCE7' : '#F3F4F6', color: staff.is_active ? '#15803D' : '#9CA3AF', fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 20, border: `1px solid ${staff.is_active ? '#86EFAC' : '#E5E7EB'}` }}>
            {staff.is_active ? '● Active' : '○ Inactive'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────
interface ModalProps {
  existingStaff: Profile|null
  onClose: () => void
  onSaved: (s: Profile, creds?: {name:string;email:string;tempPw:string;loginUrl:string}) => void
}

function StaffFormModal({ existingStaff, onClose, onSaved }: ModalProps) {
  const isEdit = !!existingStaff
  const [fullName, setFullName] = useState(existingStaff?.full_name ?? '')
  const [email,    setEmail]    = useState('')
  const [mobile,   setMobile]   = useState(existingStaff?.mobile ?? '')
  const [role,     setRole]     = useState<'supervisor'|'installer'>((existingStaff?.role as 'supervisor'|'installer') ?? 'supervisor')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const inputS: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.15s' }
  const labelS: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }
  const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#0A5C48'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(10,92,72,0.08)' }
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none' }

  async function handleSubmit() {
    if (!fullName.trim()) { setError('Please enter full name.'); return }
    if (!isEdit && !email.trim()) { setError('Please enter email address.'); return }
    if (!mobile.trim() || mobile.replace(/\D/g,'').length < 10) { setError('Please enter a valid 10-digit mobile number.'); return }

    setLoading(true); setError('')
    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/staff/${existingStaff!.id}`,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ full_name: fullName, mobile }) })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Update failed') }
        onSaved({ ...existingStaff!, full_name: fullName, mobile }, undefined)
      } else {
        const res = await fetch('/api/admin/staff',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ full_name: fullName, email, mobile, role }) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create')
        const newStaff: Profile = { id: data.staff_id, full_name: fullName, mobile, role, is_active: true, created_at: new Date().toISOString() }
        onSaved(newStaff, { name: fullName, email, tempPw: data.temp_password, loginUrl: data.login_url })
      }
    } catch(e: unknown) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  const meta = ROLE_META[role]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:16 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'linear-gradient(135deg,#0A5C48,#0D7A60)', padding:'20px 24px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{isEdit?'Edit Staff Member':'Onboard New Staff'}</div>
          <div style={{ fontSize:17, fontWeight:800, color:'white' }}>{isEdit ? existingStaff!.full_name : 'Add to Field Team'}</div>
        </div>

        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:10 }}>{error}</div>}

          {!isEdit && (
            <div>
              <label style={labelS}>Role</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {(['supervisor','installer'] as const).map(r => {
                  const m = ROLE_META[r]
                  return (
                    <button key={r} type="button" onClick={()=>setRole(r)} style={{ padding:'14px 12px', borderRadius:12, border: role===r?`2px solid ${m.color}`:'1.5px solid #E5E7EB', background: role===r?m.bg:'#F9FAFB', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                      <div style={{ fontSize:24, marginBottom:5 }}>{m.icon}</div>
                      <div style={{ fontSize:13, fontWeight:700, color: role===r?m.color:'#374151' }}>{m.label}</div>
                      <div style={{ fontSize:11, color: role===r?m.color:'#9CA3AF', marginTop:3 }}>{r==='supervisor'?'Diagnose & report':'Install & repair'}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div><label style={labelS}>Full Name</label><input style={inputS} placeholder="e.g. Sandeep Rawat" value={fullName} onChange={e=>setFullName(e.target.value)} onFocus={focus} onBlur={blur}/></div>

          {!isEdit && (
            <div>
              <label style={labelS}>Email Address</label>
              <input type="email" style={inputS} placeholder="sandeep@duromax.in" value={email} onChange={e=>setEmail(e.target.value)} onFocus={focus} onBlur={blur}/>
              <p style={{ fontSize:11, color:'#9CA3AF', marginTop:5 }}>Used to create their Supabase account (one-time setup).</p>
            </div>
          )}

          <div>
            <label style={labelS}>Mobile Number <span style={{ color:'#EF4444' }}>*</span></label>
            <div style={{ display:'flex' }}>
              <span style={{ padding:'11px 13px', background:'#F3F4F6', border:'1.5px solid #E5E7EB', borderRight:'none', borderRadius:'10px 0 0 10px', fontSize:13, color:'#6B7280', fontWeight:600 }}>+91</span>
              <input type="tel" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="98765 43210" maxLength={10} style={{ ...inputS, borderRadius:'0 10px 10px 0' }} onFocus={e=>{e.target.style.borderColor='#0A5C48';e.target.style.background='#fff'}} onBlur={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.background='#F9FAFB'}}/>
            </div>
            <p style={{ fontSize:11, color:'#9CA3AF', marginTop:5 }}>Used for OTP login every session — must receive SMS.</p>
          </div>

          {!isEdit && (
            <div style={{ background:'#ECFDF5', border:'1px solid #86EFAC', borderRadius:10, padding:'11px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#065F46', marginBottom:5 }}>What happens when you click Add:</div>
              <div style={{ display:'flex', flexDirection:'column', gap:3, fontSize:12, color:'#047857' }}>
                <span>✓ Supabase account created automatically</span>
                <span>✓ Temporary password generated (shown once)</span>
                <span>✓ They log in daily via mobile OTP at /supervisor/verify</span>
                <span>✓ They can only see tickets assigned to them</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:10, padding:'0 24px 22px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:13, fontWeight:600, color:'#374151', background:'white', cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex:2, padding:'11px', background:loading?'#9CA3AF':'#0A5C48', color:'white', border:'none', borderRadius:12, fontSize:13.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading?<><svg style={{ animation:'spin 0.7s linear infinite', width:15, height:15 }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>{isEdit?'Saving…':'Adding…'}</>:(isEdit?'Save Changes':`Add ${meta.label} →`)}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
