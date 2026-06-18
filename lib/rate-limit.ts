// eslint-disable-next-line
type SvcClient = any

const WINDOW_SECS = 60
const MAX_REQUESTS = 60

export async function checkRateLimit(
  svc: SvcClient,
  key: string
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date()

  const { data: existing } = await svc
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', key)
    .single()

  if (!existing) {
    await svc.from('rate_limits').insert({ key, count: 1, window_start: now.toISOString() })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  const windowAge = (now.getTime() - new Date(existing.window_start).getTime()) / 1000
  if (windowAge > WINDOW_SECS) {
    await svc.from('rate_limits').update({ count: 1, window_start: now.toISOString() }).eq('key', key)
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  if (existing.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  await svc.from('rate_limits').update({ count: existing.count + 1 }).eq('key', key)
  return { allowed: true, remaining: MAX_REQUESTS - existing.count - 1 }
}
