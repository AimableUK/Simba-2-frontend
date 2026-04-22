import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

const adminPaths = ["/admin"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if it's an admin path (after locale prefix)
  const isAdminPath = routing.locales.some((locale) =>
    adminPaths.some((p) => pathname.startsWith(`/${locale}${p}`)),
  );

  if (isAdminPath) {
    // Auth check for admin is handled client-side via useAuth hook
    // Server-side protection can be added here with session cookie check
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
