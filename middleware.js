import { NextResponse } from "next/server";

export function middleware(request) {
  const sourceUrl = new URL(request.url);
  if (!sourceUrl.hostname.endsWith(".edgeone.dev")) {
    return NextResponse.next();
  }

  const targetUrl = new URL(
    sourceUrl.pathname.replace(/^\/api/, "/backend") + sourceUrl.search,
    sourceUrl
  );

  return NextResponse.rewrite(targetUrl);
}

export const config = {
  matcher: "/api/:path*",
};
