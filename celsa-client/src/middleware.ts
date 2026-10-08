import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/auth";

const ADMIN_ONLY = ["/admin/reports", "/admin/users"];
const ADMIN_AND_STAFF_PREFIXES = ["/admin", "/staff"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("celsa_token")?.value;
  const user = decodeToken(token);

  const isProtected = ADMIN_AND_STAFF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) return NextResponse.next();

  // If user is not authenticated: show unauthorized error instead of generic login
  if (!user) {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    unauthorizedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Customers can NEVER access /admin or /staff — redirect to unauthorized 403 error page
  if (user.role === "customer") {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    unauthorizedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Staff can access /staff freely, but can never access /admin
  if (user.role === "staff" && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    unauthorizedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Admin-only sub-sections (Reports, Users/Staff account management) for staff
  if (user.role === "staff" && ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/staff/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/staff", "/staff/:path*"],
};
