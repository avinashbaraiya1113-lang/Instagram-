import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const TTL = 60 * 60 * 24 * 30;
const parse = (v) => (typeof v === "string" ? JSON.parse(v) : v);

// Atomic claim: returns true only the first time this comment ID is seen.
export async function claimComment(rec) {
  const ok = await redis.set(`c:${rec.id}`, JSON.stringify(rec), { nx: true, ex: TTL });
  if (ok !== "OK") return false;
  await redis.lpush("recent", rec.id);
  await redis.ltrim("recent", 0, 199);
  return true;
}

export async function updateComment(id, patch) {
  const cur = await redis.get(`c:${id}`);
  const next = { ...(cur ? parse(cur) : { id }), ...patch };
  await redis.set(`c:${id}`, JSON.stringify(next), { ex: TTL });
}

export async function listRecent(n = 50) {
  const ids = await redis.lrange("recent", 0, n - 1);
  if (!ids.length) return [];
  const vals = await redis.mget(...ids.map((i) => `c:${i}`));
  return vals.filter(Boolean).map(parse);
}
