'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }
  return (
    <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.85)', fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
      <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M5 2H2.5A1.5 1.5 0 001 3.5v6A1.5 1.5 0 002.5 11H5M8.5 9l3-2.5L8.5 4M4 6.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Sign out
    </button>
  )
}
