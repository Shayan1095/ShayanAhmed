import mongoose from "mongoose";
import { E2E } from "../playwright.config";

/**
 * Drops the isolated test database (never the real one). If MongoDB isn't
 * running, it warns instead of failing, so database-free tests (public pages,
 * accessibility, sign-in guards) can still run; admin tests will then fail
 * with a clear "database can't be reached" screen.
 */
export async function dropTestDb() {
  if (!/-e2e$|-test$/.test(new URL(E2E.mongoUri).pathname)) throw new Error("Refusing to drop a non-test database.");
  try {
    const conn = await mongoose.createConnection(E2E.mongoUri, { serverSelectionTimeoutMS: 4000 }).asPromise();
    await conn.dropDatabase();
    await conn.close();
  } catch (err) {
    console.warn(`[e2e] MongoDB not reachable at ${E2E.mongoUri}; admin tests need it. (${(err as Error).message})`);
  }
}
