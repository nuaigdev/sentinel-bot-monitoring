import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function POST(_req: NextRequest, { params }: { params: { id: string; keyId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line
  const svc: any = createServiceRoleClient()
  const { error } = await svc
    .from('bot_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', params.keyId)
    .eq('bot_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
