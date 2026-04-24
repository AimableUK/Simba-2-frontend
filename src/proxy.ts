import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const SESSION_COOKIE = "better-auth.session_token";
const SECURE_SESSION_COOKIE = "__Secure-better-auth.session_token";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Routes that require authentication (after locale prefix)
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/orders", "/profile"];

// Routes inaccessible when already authenticated
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

// Proxy /api/* → backend
async function handleApiProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  const strippedApiPath = pathname.replace(/^\/api/, "");
  const target = `${BACKEND_URL}${strippedApiPath}${search}`;

  const headers = new Headers(request.headers);
  headers.set("x-forwarded-host", request.headers.get("host") || "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  headers.set("x-real-ip", request.headers.get("x-forwarded-for") || "unknown");
  headers.delete("x-middleware-subrequest");

  try {
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : undefined;

    const backendRes = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    // Forward redirects (e.g. OAuth)
    if (backendRes.status >= 300 && backendRes.status < 400) {
      const location = backendRes.headers.get("location");
      if (location) return NextResponse.redirect(location);
    }

    const responseHeaders = new Headers(backendRes.headers);
    responseHeaders.delete("x-frame-options");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[proxy] Backend unreachable:", target, err);
    return NextResponse.json(
      { success: false, message: "Backend service unavailable" },
      { status: 503 },
    );
  }
}

const intlMiddleware = createMiddleware(routing);

export default async function middleware(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets
  if (isSkippable(pathname)) return NextResponse.next();

  // 2. Proxy ALL /api/* to backend (fixes cross-domain cookie issue)
  if (pathname.startsWith("/api/")) {
    return handleApiProxy(request);
  }

  const sessionToken = getSessionToken(request);
  const isAuthed = !!sessionToken;

  // Strip locale prefix to match paths
  const strippedPath = routing.locales.reduce(
    (path, locale) =>
      path.startsWith(`/${locale}/`)
        ? path.slice(`/${locale}`.length)
        : path === `/${locale}`
          ? "/"
          : path,
    pathname,
  );

  // 3. Protect dashboard/admin routes
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    strippedPath.startsWith(p),
  );
  if (isProtected && !isAuthed) {
    const loginUrl = new URL(`/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Redirect authenticated users away from auth pages
  const isAuthPage = AUTH_ONLY_PATHS.some((p) => strippedPath.startsWith(p));
  if (isAuthPage && isAuthed) {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const destination =
      redirectTo && PROTECTED_PREFIXES.some((p) => redirectTo.startsWith(p))
        ? redirectTo
        : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 5. Run intl middleware for page routes
  const response = intlMiddleware(request);

  // 6. Security headers
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
