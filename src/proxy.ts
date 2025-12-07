import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const cookie = req.headers.get("cookie") ?? "";
  const sid = cookie.match(/(?:^|;\s)sid=([^;]+)/)?.[1] ?? null;
  const protectedPaths = ["/dashboard", "/onboarding", "/dashboard/store", "/dashboard/products", "/dashboard/orders"];
  const needsAuth = protectedPaths.some((p) => url.pathname.startsWith(p));
  if (needsAuth && !sid) {
    return NextResponse.redirect(new URL("/connect", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};

