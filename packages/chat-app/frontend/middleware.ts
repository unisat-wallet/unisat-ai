/**
 * Authentication Middleware
 * Requires ?auth=<token> parameter to access the site
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth token - can be configured via environment variable
const AUTH_TOKEN = process.env.AUTH_TOKEN || "YOUR_SECRET_TOKEN";
const AUTH_COOKIE_NAME = "unisat_auth";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip auth for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files like .png, .ico, etc.
  ) {
    return NextResponse.next();
  }

  // Check if auth token is in URL
  const authParam = searchParams.get("auth");

  // Check if auth cookie exists
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  // If valid auth param provided, set cookie and redirect to clean URL
  if (authParam === AUTH_TOKEN) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("auth");

    const response = NextResponse.redirect(url);
    // Set cookie for 7 days
    response.cookies.set(AUTH_COOKIE_NAME, AUTH_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  }

  // If valid cookie exists, allow access
  if (authCookie?.value === AUTH_TOKEN) {
    return NextResponse.next();
  }

  // No valid auth - return 401 Unauthorized
  return new NextResponse(
    JSON.stringify({
      error: "Unauthorized",
      message: "Access denied. Please provide valid auth token.",
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
