import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSweep } from '@/lib/sweep'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await runSweep(supabase)
  return NextResponse.json({ ok: true, ...result })
}
