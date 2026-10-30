import { dropTestDb } from "./db";

export default async function globalTeardown() {
  await dropTestDb();
}
