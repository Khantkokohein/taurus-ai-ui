import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEMO_COOKIE = "taurus_demo_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    pathname.includes(".");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/login-gate")
  ) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get(DEMO_COOKIE)?.value === "1";



 
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};