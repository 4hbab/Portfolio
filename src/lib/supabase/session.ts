/**
 * How long a studio session may live. The site has no server to enforce this,
 * and Supabase's time-boxed and inactivity-timeout sessions are Pro-only, so:
 *
 * - the idle limit is enforced here, in the browser;
 * - the absolute limit is enforced here for the UX and again by the database
 *   (`public.is_owner_with_mfa`) and the edge functions (`_shared/session.ts`),
 *   which is what actually stops a stolen refresh token. Keep all three equal.
 */
export const SESSION_POLICY = {
    idleMs: 30 * 60 * 1000,
    absoluteMs: 8 * 60 * 60 * 1000,
    warnMs: 2 * 60 * 1000,
} as const;

export type SessionPolicy = { idleMs: number; absoluteMs: number; warnMs: number };
export type ExpiryReason = "idle" | "absolute";
export type SessionState =
    | { kind: "active" }
    | { kind: "warning"; reason: ExpiryReason; remainingMs: number }
    | { kind: "expired"; reason: ExpiryReason };

/** SQLSTATE the database raises when the absolute limit has passed. */
export const SESSION_EXPIRED_CODE = "28000";

export const LAST_ACTIVITY_KEY = "portfolio-admin:last-activity";

/**
 * When this session was first authenticated, in epoch ms. Supabase records each
 * authentication step in the token's `amr` claim and carries it unchanged across
 * refreshes, so the earliest entry is the password sign-in however many times
 * the token has been renewed since.
 */
export function authenticatedAt(accessToken: string): number | null {
    try {
        const encoded = accessToken.split(".")[1];
        if (!encoded) return null;
        const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
        const claims = JSON.parse(atob(base64)) as { amr?: { timestamp?: unknown }[] };
        const stamps = (claims.amr ?? []).map((entry) => entry.timestamp).filter((stamp): stamp is number => typeof stamp === "number");
        return stamps.length ? Math.min(...stamps) * 1000 : null;
    } catch {
        return null;
    }
}

/**
 * Activity recorded before this sign-in belongs to a previous session, so the
 * idle clock starts no earlier than the sign-in itself.
 */
export function evaluateSession(
    { now, lastActivity, signedInAt: start }: { now: number; lastActivity: number | null; signedInAt: number | null },
    policy: SessionPolicy = SESSION_POLICY,
): SessionState {
    const idleFrom = Math.max(lastActivity ?? now, start ?? 0);
    const deadlines: { reason: ExpiryReason; at: number }[] = [{ reason: "idle", at: idleFrom + policy.idleMs }];
    if (start !== null) deadlines.push({ reason: "absolute", at: start + policy.absoluteMs });
    const next = deadlines.reduce((soonest, deadline) => (deadline.at < soonest.at ? deadline : soonest));

    const remainingMs = next.at - now;
    if (remainingMs <= 0) return { kind: "expired", reason: next.reason };
    if (remainingMs <= policy.warnMs) return { kind: "warning", reason: next.reason, remainingMs };
    return { kind: "active" };
}
