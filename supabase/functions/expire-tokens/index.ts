import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('token_expires_at', new Date().toISOString())
    .select('id')

  return new Response(JSON.stringify({ expired: data?.length ?? 0, error }))
})
