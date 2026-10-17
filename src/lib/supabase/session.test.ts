import { describe, expect, it } from "vitest";
import { authenticatedAt, evaluateSession } from "./session";

const policy = { idleMs: 30 * 60_000, absoluteMs: 8 * 3_600_000, warnMs: 2 * 60_000 };
const SIGN_IN = Date.UTC(2026, 9, 17, 9, 0, 0);

function token(claims: object) {
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `${encode({ alg: "HS256" })}.${encode(claims)}.signature`;
}

describe("authenticatedAt", () => {
    it("returns the earliest authentication step, so TOTP after the password does not reset it", () => {
        const amr = [{ method: "totp", timestamp: SIGN_IN / 1000 + 40 }, { method: "password", timestamp: SIGN_IN / 1000 }];
        expect(authenticatedAt(token({ aal: "aal2", amr }))).toBe(SIGN_IN);
    });

    it("returns null for a token without amr or a malformed token", () => {
        expect(authenticatedAt(token({ aal: "aal2" }))).toBeNull();
        expect(authenticatedAt("not-a-jwt")).toBeNull();
    });
});

describe("evaluateSession", () => {
    const minutes = (count: number) => count * 60_000;

    it("stays active while the owner is working", () => {
        expect(evaluateSession({ now: SIGN_IN + minutes(20), lastActivity: SIGN_IN + minutes(10), signedInAt: SIGN_IN }, policy)).toEqual({ kind: "active" });
    });

    it("warns two minutes before the idle limit and expires at it", () => {
        expect(evaluateSession({ now: SIGN_IN + minutes(29), lastActivity: SIGN_IN, signedInAt: SIGN_IN }, policy)).toEqual({ kind: "warning", reason: "idle", remainingMs: minutes(1) });
        expect(evaluateSession({ now: SIGN_IN + minutes(30), lastActivity: SIGN_IN, signedInAt: SIGN_IN }, policy)).toEqual({ kind: "expired", reason: "idle" });
    });

    it("ignores activity from before this sign-in", () => {
        const staleActivity = SIGN_IN - minutes(120);
        expect(evaluateSession({ now: SIGN_IN + minutes(5), lastActivity: staleActivity, signedInAt: SIGN_IN }, policy)).toEqual({ kind: "active" });
    });

    it("ends the session at eight hours even with constant activity", () => {
        const now = SIGN_IN + minutes(8 * 60);
        expect(evaluateSession({ now, lastActivity: now - 1_000, signedInAt: SIGN_IN }, policy)).toEqual({ kind: "expired", reason: "absolute" });
    });

    it("warns about the absolute limit when it comes before the idle one", () => {
        const now = SIGN_IN + minutes(8 * 60 - 1);
        expect(evaluateSession({ now, lastActivity: now, signedInAt: SIGN_IN }, policy)).toEqual({ kind: "warning", reason: "absolute", remainingMs: minutes(1) });
    });
});
