const API_ORIGIN = "https://qining-original.vercel.app";

export function middleware({ request, rewrite }) {
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(sourceUrl.pathname + sourceUrl.search, API_ORIGIN);

  return rewrite(targetUrl.toString());
}

export const config = {
  matcher: "/api/:path*",
};
