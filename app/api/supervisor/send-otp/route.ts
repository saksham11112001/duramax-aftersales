import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { mobile } = await request.json()
  if (!mobile) return NextResponse.json({ error: 'Mobile number required' }, { status: 400 })

  const phone = '+91' + mobile.replace(/\D/g, '').slice(-10)
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({ phone })

  if (error) {
    console.error('OTP send error:', error)
    return NextResponse.json({ error: 'Failed to send OTP. Check the number and try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, phone })
}
