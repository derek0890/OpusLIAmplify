import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    // Editors are scoped to Posts only — everything else under /admin
    // (Team, Style Guide, Integrations, Branding, Super Admin) is ADMIN-only.
    const isPostsPath = pathname === "/admin" || pathname.startsWith("/admin/posts");
    const allowed = role === "ADMIN" || (role === "EDITOR" && isPostsPath);
    if (!allowed) {
      const fallback = role === "EDITOR" ? "/admin/posts" : "/feed";
      return NextResponse.redirect(new URL(fallback, req.nextUrl.origin));
    }
  }

  if (pathname.startsWith("/feed")) {
    if (!isLoggedIn) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/feed/:path*"],
};
