import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * First line of defence for /admin: signed-out visitors are sent to the
 * sign-in page. Every admin page and action checks the session again
 * (lib/auth/dal.ts), so this is never the only guard.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const signedIn = Boolean(req.auth?.user?.email && req.auth.user.email === process.env.ADMIN_EMAIL?.trim().toLowerCase());
  const isLogin = pathname === "/admin/login";

  if (!signedIn && !isLogin) {
    const url = new URL("/admin/login", req.nextUrl);
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (signedIn && isLogin) return NextResponse.redirect(new URL("/admin", req.nextUrl));
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
});

export const config = { matcher: ["/admin/:path*"] };
