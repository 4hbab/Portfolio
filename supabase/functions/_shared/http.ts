const defaultSiteOrigin = "https://4hbab.github.io";

function configuredSiteOrigin() {
  const value = Deno.env.get("PUBLIC_SITE_ORIGIN") ?? defaultSiteOrigin;
  try {
    return new URL(value).origin;
  } catch {
    return defaultSiteOrigin;
  }
}

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
  return !origin || origin === configuredSiteOrigin() || isLocalDevelopmentOrigin(origin);
}

export function corsHeaders(request?: Request) {
  const requestOrigin = request?.headers.get("origin");
  const allowOrigin = requestOrigin && isAllowedOrigin(request) ? requestOrigin : configuredSiteOrigin();
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

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
