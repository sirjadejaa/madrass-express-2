import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isKitchenRoute = req.nextUrl.pathname.startsWith("/kitchen") || req.nextUrl.pathname.startsWith("/api/kds");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    if (isAdminRoute) {
      if (token.role !== "ADMIN" && token.role !== "MANAGER") {
        return NextResponse.redirect(new URL("/kitchen", req.url)); // Or appropriate redirect
      }
    }

    if (isKitchenRoute) {
      if (token.role !== "ADMIN" && token.role !== "MANAGER" && token.role !== "KITCHEN") {
        if (req.nextUrl.pathname.startsWith("/api/kds")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", req.url)); 
      }
    }
  },
  {
    callbacks: {
      async authorized() {
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/kitchen/:path*", "/api/kds/:path*", "/login"],
};
