import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const adminPaths = ["/admin"];
const protectedPaths = ["/dashboard", "/profile", "/orders"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPath = routing.locales.some((locale) =>
    adminPaths.some((p) => pathname.startsWith(`/${locale}${p}`)),
  );

  const isProtectedPath = routing.locales.some((locale) =>
    protectedPaths.some((p) => pathname.startsWith(`/${locale}${p}`)),
  );

  // Check session cookie for protected routes
  if (isAdminPath || isProtectedPath) {
    const session = req.cookies.get("better-auth.session_token")
      ?? req.cookies.get("__Secure-better-auth.session_token");

    if (!session) {
      const loginUrl = new URL("/en/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};