import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public assets, static files, and api webhooks/jobs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/jobs") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // 2. Read staff session cookie or Supabase auth token
  // to check the working 
  const staffSession = request.cookies.get("carebridge_staff_session")?.value;
  const sbAuthToken = request.cookies.get("sb-access-token")?.value;
  const isAuthenticated = Boolean(staffSession || sbAuthToken);


  // 3. Login page handling
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 4. Protect App routes
  const protectedPrefixes = [
    "/dashboard",
    "/patients",
    "/visits",
    "/appointments",
    "/billing",
    "/messages",
    "/campaigns",
    "/enquiries",
    "/reports",
    "/settings",
  ];

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute) {
    // If not authenticated and mock mode is not on default, redirect to login
    if (!isAuthenticated && process.env.NEXT_PUBLIC_SUPABASE_URL !== "YOUR_PROJECT_URL") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
