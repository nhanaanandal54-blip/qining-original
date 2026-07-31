const API_ORIGIN = "https://qining-original.vercel.app";

export async function onRequest({ request }) {
  const sourceUrl = new URL(request.url);
  const upstreamUrl = new URL(
    sourceUrl.pathname.replace(/^\/backend/, "/api") + sourceUrl.search,
    API_ORIGIN
  );
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(upstreamUrl, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("x-qining-api-proxy", "edgeone");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
