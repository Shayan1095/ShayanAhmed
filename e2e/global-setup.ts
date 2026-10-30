import { dropTestDb } from "./db";

export default async function globalSetup() {
  await dropTestDb();
}
