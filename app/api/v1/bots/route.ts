import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { generateBotKey } from '@/lib/bot-key'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line
  const svc: any = createServiceRoleClient()
  const { data, error } = await svc.from('bots').select('*').order('bot_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bots: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const required = ['client_name', 'bot_name', 'bot_type', 'owner_email', 'schedule_type']
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  if (!['cloud', 'desktop'].includes(body.bot_type as string)) {
    return NextResponse.json({ error: 'bot_type must be cloud or desktop' }, { status: 400 })
  }

  if (!['cron', 'fixed_times', 'manual'].includes(body.schedule_type as string)) {
    return NextResponse.json({ error: 'Invalid schedule_type' }, { status: 400 })
  }

  // eslint-disable-next-line
  const svc: any = createServiceRoleClient()

  const { data: bot, error: botError } = await svc
    .from('bots')
    .insert({
      client_name: body.client_name as string,
      bot_name: body.bot_name as string,
      bot_type: body.bot_type as 'cloud' | 'desktop',
      owner_email: body.owner_email as string,
      description: (body.description as string) ?? null,
      tags: (body.tags as string[]) ?? [],
      schedule_type: body.schedule_type as 'cron' | 'fixed_times' | 'manual',
      schedule_cron: (body.schedule_cron as string) ?? null,
      schedule_fixed_times: (body.schedule_fixed_times as string) ?? null,
      time_allocated_secs: (body.time_allocated_secs as number) ?? 3600,
      missed_grace_secs: (body.missed_grace_secs as number) ?? 300,
      allow_concurrent_runs: (body.allow_concurrent_runs as boolean) ?? false,
      is_active: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (botError || !bot) {
    return NextResponse.json({ error: botError?.message ?? 'Failed to create bot' }, { status: 500 })
  }

  const { rawKey, keyHash, keyPrefix } = generateBotKey()

  await svc.from('bot_keys').insert({
    bot_id: bot.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    label: 'Initial key',
  })

  return NextResponse.json({ bot_id: bot.id, raw_key: rawKey }, { status: 201 })
}
