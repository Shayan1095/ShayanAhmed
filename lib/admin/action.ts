import "server-only";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/dal";
import { requireDb } from "@/lib/db/connect";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/**
 * Wraps every admin mutation: checks the session, connects to the database,
 * and turns validation or database errors into a message the UI can show.
 */
export async function adminAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await assertAdmin();
    await requireDb();
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const i = err.issues[0];
      return { ok: false, error: `${i?.path.join(".") || "Input"}: ${i?.message ?? "invalid"}` };
    }
    if ((err as { code?: number }).code === 11000) return { ok: false, error: "That value is already in use." };
    console.error("[admin]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}
