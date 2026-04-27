import Redis from 'ioredis';
import dotenv from "dotenv";

dotenv.config();
const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;

export type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: "EX", seconds?: number): Promise<"OK">;
  del(key: string): Promise<number>;
};

class InMemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: "EX", seconds?: number): Promise<"OK"> {
    const expiresAt = mode === "EX" && typeof seconds === "number" ? Date.now() + seconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

function createRedisClient(url: string): RedisLike {
  const client = new Redis(url, url.startsWith("rediss://") ? { tls: {} } : {});
  return {
    get: async (key: string) => client.get(key),
    set: async (key: string, value: string, mode?: "EX", seconds?: number) => {
      if (mode === "EX" && typeof seconds === "number") {
        return client.set(key, value, "EX", seconds);
      }
      return client.set(key, value);
    },
    del: async (key: string) => client.del(key),
  };
}

export const redis: RedisLike = redisUrl ? createRedisClient(redisUrl) : new InMemoryRedis();