import "server-only";
import mongoose from "mongoose";

/**
 * One shared MongoDB connection per server process (and across dev reloads).
 * Returns null when MONGODB_URI is not set, so the public site can fall back
 * to the starter content in lib/content/data.
 */
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as typeof globalThis & { __mongoose?: Cache };
const cache: Cache = (g.__mongoose ??= { conn: null, promise: null });

export function hasDatabase(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDb(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 5000 });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

/** Like connectDb, but for admin code paths where a database is required. */
export async function requireDb(): Promise<typeof mongoose> {
  const conn = await connectDb();
  if (!conn) throw new Error("MONGODB_URI is not set. Add it to .env.local (see ADMIN.md).");
  return conn;
}
