import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

/**
 * Auth.js with one admin account (DESIGN.md §11). There is no sign-up: the
 * email and bcrypt hash live in env vars (set them with `npm run admin:password`).
 * Sessions are signed JWT cookies that last 7 days.
 */

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

/** The hash is stored base64-encoded so "$" signs survive .env parsing. */
function adminHash(): string | null {
  const raw = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!raw) return null;
  return raw.startsWith("$2") ? raw : Buffer.from(raw, "base64").toString("utf8");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentials.safeParse(raw);
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const hash = adminHash();
        if (!parsed.success || !email || !hash) return null;
        // Always run the hash check, so a wrong email takes as long as a wrong password.
        const passwordOk = await bcrypt.compare(parsed.data.password, hash);
        if (!passwordOk || parsed.data.email !== email) return null;
        return { id: "admin", email, name: "Shayan" };
      },
    }),
  ],
  callbacks: {
    // Only the configured admin email is ever accepted, even if the env var changes later.
    authorized: ({ auth: session }) =>
      Boolean(session?.user?.email && session.user.email === process.env.ADMIN_EMAIL?.trim().toLowerCase()),
  },
});
