"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string; email?: string };

/** 8 attempts per 15 minutes per IP, then a cool-down. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const key = `login:${await clientIp()}`;
  // Returned with errors so the form keeps the email after it resets.
  const email = String(formData.get("email") ?? "").slice(0, 200);
  const limit = await rateLimit(key, 8, 15 * 60 * 1000);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${limit.retryAfterMin} min.`, email };

  const next = String(formData.get("next") ?? "");
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "That email and password don't match.", email };
    throw err;
  }
  await resetRateLimit(key);
  // Only same-site admin paths are allowed as a destination.
  redirect(next.startsWith("/admin/") ? next : "/admin");
}
