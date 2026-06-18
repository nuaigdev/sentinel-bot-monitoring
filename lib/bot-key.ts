import { createHash, randomBytes } from 'crypto'

const KEY_PREFIX_FORMAT = 'pa_live_'

export function generateBotKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const randomHex = randomBytes(16).toString('hex') // 32 hex chars
  const rawKey = `${KEY_PREFIX_FORMAT}${randomHex}`
  const keyHash = hashKey(rawKey)
  const keyPrefix = rawKey.substring(0, 15) // "pa_live_" + first 7 chars of hex
  return { rawKey, keyHash, keyPrefix }
}

export function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

export function isValidKeyFormat(key: string): boolean {
  return /^pa_live_[a-f0-9]{32}$/.test(key)
}
