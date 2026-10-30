import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Data access layer for the admin. Pages call requireAdmin() (redirects when
 * signed out); server actions call assertAdmin() (throws), so no admin data
 * or mutation is reachable without a valid session, whatever the proxy does.
 */

async function adminEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return email && email === process.env.ADMIN_EMAIL?.trim().toLowerCase() ? email : null;
}

export async function requireAdmin(): Promise<{ email: string }> {
  const email = await adminEmail();
  if (!email) redirect("/admin/login");
  return { email };
}

export async function assertAdmin(): Promise<void> {
  if (!(await adminEmail())) throw new Error("Not signed in.");
}
