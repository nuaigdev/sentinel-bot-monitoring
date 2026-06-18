import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { hashKey } from './bot-key'
import { checkRateLimit } from './rate-limit'

export interface AuthedBot {
  bot_id: string
  key_id: string
}

export async function authenticateBotKey(
  request: NextRequest
// eslint-disable-next-line
): Promise<{ bot: AuthedBot; svc: any } | NextResponse> {
  const rawKey = request.headers.get('x-bot-key')

  if (!rawKey) {
    return NextResponse.json({ error: 'Missing x-bot-key header' }, { status: 401 })
  }

  // eslint-disable-next-line
  const svc: any = createServiceRoleClient()
  const keyHash = hashKey(rawKey)

  const { allowed } = await checkRateLimit(svc, `key:${rawKey.slice(0, 20)}`)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded (60 req/min)' }, { status: 429 })
  }

  const { data: keyRow } = await svc
    .from('bot_keys')
    .select('id, bot_id, revoked_at')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single()

  if (!keyRow) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
  }

  const { data: bot } = await svc
    .from('bots')
    .select('id, is_active')
    .eq('id', keyRow.bot_id)
    .single()

  if (!bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 401 })
  }

  if (!bot.is_active) {
    return NextResponse.json({ error: 'Bot is disabled' }, { status: 403 })
  }

  await Promise.all([
    svc.from('bot_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id),
    svc.from('bots').update({ last_event_at: new Date().toISOString() }).eq('id', bot.id),
  ])

  return { bot: { bot_id: bot.id, key_id: keyRow.id }, svc }
}
