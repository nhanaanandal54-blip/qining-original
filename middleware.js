import { NextResponse } from "next/server";

const API_ORIGIN = "https://qining-original.vercel.app";

export function middleware(request) {
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(sourceUrl.pathname + sourceUrl.search, API_ORIGIN);

  return NextResponse.rewrite(targetUrl);
}

export const config = {
  matcher: "/api/:path*",
};
