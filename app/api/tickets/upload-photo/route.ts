import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file     = formData.get('file') as File | null
    const ticketId = formData.get('ticket_id') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP, and HEIC images are allowed' }, { status: 400 })
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
    }

    const supabase  = createAdminClient()
    const ext       = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName  = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path      = `photos/${fileName}`
    const arrayBuf  = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('ticket-photos')
      .upload(path, Buffer.from(arrayBuf), {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ticket-photos')
      .getPublicUrl(path)

    // If ticket_id provided, update the ticket
    if (ticketId) {
      await supabase.from('tickets').update({ photo_url: publicUrl }).eq('id', ticketId)
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (e) {
    console.error('Photo upload error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
