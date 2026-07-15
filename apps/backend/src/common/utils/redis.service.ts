// src/utils/redis.util.ts
import { Redis, RedisOptions } from "ioredis";

let _client: Redis | null = null;

const defaultOpts: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  db: Number(process.env.REDIS_DB || 0),
  keyPrefix: process.env.REDIS_KEY_PREFIX || "nest:",
  maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES ?? 3),
};

/**
 * Lazily create (or return) a singleton Redis client.
 */
export function getRedis(options?: RedisOptions): Redis {
  if (!_client) {
    _client = new Redis({ ...defaultOpts, ...options });
  }
  return _client;
}

/**
 * Close and reset the singleton client (use on app shutdown).
 */
export async function closeRedis(): Promise<void> {
  if (_client) {
    try {
      await _client.quit();
    } finally {
      _client = null;
    }
  }
}

/** Basic helpers */
export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number,
) {
  const client = getRedis();
  return ttlSeconds
    ? client.set(key, value, "EX", ttlSeconds)
    : client.set(key, value);
}

export async function redisGet(key: string) {
  return getRedis().get(key);
}

export async function redisDel(key: string) {
  return getRedis().del(key);
}

/** Optional JSON helpers */
export async function redisSetJSON<T>(
  key: string,
  value: T,
  ttlSeconds?: number,
) {
  return redisSet(key, JSON.stringify(value), ttlSeconds);
}

export async function redisGetJSON<T = unknown>(
  key: string,
): Promise<T | null> {
  const raw = await redisGet(key);
  return raw ? (JSON.parse(raw) as T) : null;
}
