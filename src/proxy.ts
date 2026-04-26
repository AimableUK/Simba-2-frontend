import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const SESSION_COOKIE = "better-auth.session_token";
const SECURE_SESSION_COOKIE = "__Secure-better-auth.session_token";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/orders", "/profile"];
const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

const SKIP_EXTENSIONS =
  /\.(ico|png|svg|jpg|jpeg|webp|gif|woff2?|ttf|otf|css|js|map|xml|txt)$/;
const SKIP_PREFIXES = ["/_next", "/favicon"];

function isSkippable(pathname: string): boolean {
  return (
    SKIP_PREFIXES.some((p) => pathname.startsWith(p)) ||
    SKIP_EXTENSIONS.test(pathname)
  );
}

function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get(SECURE_SESSION_COOKIE)?.value
  );
}

const intlMiddleware = createMiddleware(routing);

export default async function middleware(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isSkippable(pathname)) return NextResponse.next();

  // Skip /api/* — handled by vercel.json rewrites
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const sessionToken = getSessionToken(request);
  const isAuthed = !!sessionToken;

  const strippedPath = routing.locales.reduce(
    (path, locale) =>
      path.startsWith(`/${locale}/`)
        ? path.slice(`/${locale}`.length)
        : path === `/${locale}`
          ? "/"
          : path,
    pathname,
  );

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    strippedPath.startsWith(p),
  );
  if (isProtected && !isAuthed) {
    const loginUrl = new URL(`/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage = AUTH_ONLY_PATHS.some((p) => strippedPath.startsWith(p));
  if (isAuthPage && isAuthed) {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const destination =
      redirectTo && PROTECTED_PREFIXES.some((p) => redirectTo.startsWith(p))
        ? redirectTo
        : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const response = intlMiddleware(request);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|svg|jpg|jpeg|webp|gif|woff2?|ttf|otf)$).*)",
  ],
};
