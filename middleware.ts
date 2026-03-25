import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAllowedPath =
    pathname === "/login-gate" ||
    pathname === "/call-ai" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/sounds") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ico)$/);

  if (isAllowedPath) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login-gate", request.url));
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};