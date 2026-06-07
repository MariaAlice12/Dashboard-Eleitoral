import { redis } from './redis'

export async function withCache<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get<T>(key)
    if (cached !== null) return cached
    const data = await fn()
    await redis.setex(key, ttl, data as unknown as string)
    return data
  } catch {
    return fn()
  }
}
