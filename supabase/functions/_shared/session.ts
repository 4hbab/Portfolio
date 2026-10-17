/** Keep equal to SESSION_POLICY.absoluteMs and the database's is_owner_with_mfa. */
export const SESSION_LIMIT_SECONDS = 8 * 60 * 60;

type Claims = { aal?: string; amr?: { timestamp?: unknown }[] };

/**
 * Reads claims from an access token that `auth.getUser()` has already verified;
 * this does not check the signature itself. A token too malformed to decode is
 * an authentication failure, not a server fault, so it yields empty claims.
 */
export function tokenClaims(authorization: string): Claims {
  try {
    const encodedPayload = authorization.replace(/^Bearer\s+/i, "").split(".")[1];
    if (!encodedPayload) return {};
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Claims;
  } catch {
    return {};
  }
}

/** True once eight hours have passed since the first authentication step, or when there is none. */
export function sessionExpired(claims: Claims, nowSeconds = Date.now() / 1000): boolean {
  const stamps = (claims.amr ?? []).map((entry) => entry.timestamp).filter((stamp): stamp is number => typeof stamp === "number");
  if (stamps.length === 0) return true;
  return Math.min(...stamps) < nowSeconds - SESSION_LIMIT_SECONDS;
}
