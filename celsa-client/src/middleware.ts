import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/auth";

const ADMIN_ONLY = ["/admin/reports", "/admin/users"];
const ADMIN_AND_STAFF_PREFIXES = ["/admin", "/staff"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("celsa_token")?.value;
  const user = decodeToken(token);

  // 1. Check Admin / Staff portal routes
  const isProtectedAdminOrStaff = ADMIN_AND_STAFF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtectedAdminOrStaff) {
    // Unauthenticated visitors trying to enter admin/staff
    if (!user) {
      const unauthorizedUrl = new URL("/unauthorized", req.url);
      unauthorizedUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Customers can NEVER access /admin or /staff
    if (user.role === "customer") {
      const unauthorizedUrl = new URL("/unauthorized", req.url);
      unauthorizedUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Staff cannot access /admin
    if (user.role === "staff" && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
      const unauthorizedUrl = new URL("/unauthorized", req.url);
      unauthorizedUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Admin-only sub-sections for staff
    if (user.role === "staff" && ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/staff/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // 2. Allow auth endpoints & unauthorized page
  if (
    pathname === "/unauthorized" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth")
  ) {
    return NextResponse.next();
  }

  // 3. Customer portal routes: strictly disallow Admin & Staff
  if (user) {
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (user.role === "staff") {
      return NextResponse.redirect(new URL("/staff/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/...)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, icons, robots.txt, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|robots.txt).*)",
  ],
};
