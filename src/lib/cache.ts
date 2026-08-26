// Fast in-memory TTL cache for server-side MongoDB lookups
type CacheEntry<T> = { data: T; expiresAt: number };
const memoryCache = new Map<string, CacheEntry<any>>();

export async function getCachedOrFetch<T>(
  key: string,
  ttlMs: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  const data = await fetchFn();
  memoryCache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

export function invalidateCache(keyPrefixes?: string | string[]) {
  if (!keyPrefixes) {
    memoryCache.clear();
    return;
  }
  const prefixes = Array.isArray(keyPrefixes) ? keyPrefixes : [keyPrefixes];
  for (const key of Array.from(memoryCache.keys())) {
    if (prefixes.some((p) => key.startsWith(p))) {
      memoryCache.delete(key);
    }
  }
}

