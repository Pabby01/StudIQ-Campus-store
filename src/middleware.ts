import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const url = new URL(req.url);
  const sid = req.headers.get("cookie")?.match(/(?:^|;\s)sid=([^;]+)/)?.[1] ?? null;
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

