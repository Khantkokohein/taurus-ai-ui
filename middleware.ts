import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const allowedPaths =
    pathname === "/login-gate" ||
    pathname === "/ai-call" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/sounds/") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ico)$/.test(pathname);

  if (allowedPaths) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login-gate", request.url));
}

export const config = {
  matcher: ["/:path*"],
};