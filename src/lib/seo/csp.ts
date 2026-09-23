/**
 * GitHub Pages serves static files and cannot set response headers, so the
 * policy ships as a <meta http-equiv>. That costs two things, both deliberate:
 *
 * - `frame-ancestors` and `report-uri` are ignored in meta form, so clickjacking
 *   protection is not available here at all.
 * - Next's static export inlines one RSC payload script, and both Tailwind and
 *   GSAP write inline style attributes, so script-src and style-src need
 *   'unsafe-inline'. Without a server there is no nonce to use instead.
 *
 * What remains is still worth having: script and connect origins are pinned, so
 * injected markup cannot load a foreign script or exfiltrate to an arbitrary
 * host, and object-src/base-uri close two common injection paths outright.
 */
export function contentSecurityPolicy(): string {
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;

    return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        // data: for the authenticator QR code, blob: for the generated resume.
        "img-src 'self' data: blob:",
        "font-src 'self'",
        // Supabase REST and Edge Functions share the project origin. Gemini is
        // called from the edge function, never from the browser.
        ["connect-src 'self'", supabase].filter(Boolean).join(" "),
        // The studio previews the generated PDF in a blob: iframe.
        "frame-src 'self' blob:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join("; ");
}
