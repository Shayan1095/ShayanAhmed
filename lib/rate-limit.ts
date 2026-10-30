import "server-only";
import { headers } from "next/headers";
import { connectDb } from "@/lib/db/connect";
import { RateLimitModel } from "@/lib/db/models";

/** The caller's IP, from the proxy headers Vercel (and most hosts) set. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window rate limit stored in MongoDB (rows expire on their own).
 * Allows the request when there is no database, so a missing env var never
 * blocks the contact form; the form then fails later with a clear message.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterMin: number }> {
  if (!(await connectDb())) return { ok: true, retryAfterMin: 0 };
  const now = new Date();
  const row = await RateLimitModel.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now.getTime() + windowMs) } },
    { upsert: true, returnDocument: "after" },
  ).catch(async (err: { code?: number }) => {
    // An expired row with the same key still exists (TTL sweeps run every minute): replace it.
    if (err.code !== 11000) throw err;
    return RateLimitModel.findOneAndUpdate(
      { key },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + windowMs) } },
      { returnDocument: "after" },
    );
  });
  const count = row?.count ?? 1;
  const retryAfterMin = row ? Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 60000)) : 0;
  return { ok: count <= limit, retryAfterMin };
}

/** Clears a limit early, e.g. after a successful sign-in. */
export async function resetRateLimit(key: string) {
  if (await connectDb()) await RateLimitModel.deleteOne({ key });
}
