import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { generateBotKey } from '@/lib/bot-key'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line
  const svc: any = createServiceRoleClient()
  const { data } = await svc
    .from('bot_keys')
    .select('id, key_prefix, label, created_at, revoked_at, last_used_at')
    .eq('bot_id', params.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: data ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { label?: string } = {}
  try { body = await request.json() } catch {}

  const { rawKey, keyHash, keyPrefix } = generateBotKey()
  // eslint-disable-next-line
  const svc: any = createServiceRoleClient()

  const { error } = await svc.from('bot_keys').insert({
    bot_id: params.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    label: body.label ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ raw_key: rawKey, key_prefix: keyPrefix }, { status: 201 })
}
