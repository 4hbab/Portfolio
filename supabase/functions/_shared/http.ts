import { siteOrigin } from "./config.ts";

/**
 * Localhost stays allowed against the deployed functions so the site can be
 * developed against the real project. It is not the access control: the owner
 * functions require a verified aal2 owner JWT, and the public chat function is
 * rate limited, so an origin a browser reports is only ever a convenience.
 */
function isLocalDevelopmentOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === siteOrigin() || isLocalDevelopmentOrigin(origin);
}

export function corsHeaders(request?: Request) {
  const requestOrigin = request?.headers.get("origin");
  const allowOrigin = requestOrigin && isAllowedOrigin(request) ? requestOrigin : siteOrigin();
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function json(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json" } });
}

/**
 * The preflight, method, and origin checks every function needs, written once.
 * Each function was repeating them, which is exactly the kind of guard that
 * rots differently in three places.
 */
export function servePost(handler: (request: Request) => Promise<Response>) {
  Deno.serve(async (request) => {
    if (!isAllowedOrigin(request)) return json({ error: "Forbidden" }, 403, request);
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, request);
    return await handler(request);
  });
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
