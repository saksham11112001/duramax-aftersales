import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData  = await request.formData()
    const file      = formData.get('file') as File | null
    const ticketId  = formData.get('ticket_id') as string | null
    const fileType  = formData.get('file_type') as string | null // 'site_photo' | 'signoff'

    if (!file)      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ticketId)  return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })
    if (!fileType)  return NextResponse.json({ error: 'file_type required' }, { status: 400 })

    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    const allowedAll    = [...allowedImages, 'application/pdf']
    const allowed       = fileType === 'signoff' ? allowedAll : allowedImages

    if (!allowed.includes(file.type)) {
      const msg = fileType === 'signoff'
        ? 'Only JPG, PNG, WEBP, HEIC, and PDF allowed for signoff'
        : 'Only JPG, PNG, WEBP, and HEIC images allowed for site photo'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
    }

    const admin    = createAdminClient()
    const ext      = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${fileType}-${Date.now()}.${ext}`
    const path     = `site-visits/${ticketId}/${fileName}`
    const buf      = await file.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from('ticket-photos')
      .upload(path, Buffer.from(buf), { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Site visit upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage
      .from('ticket-photos')
      .getPublicUrl(path)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (e) {
    console.error('Supervisor upload error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
