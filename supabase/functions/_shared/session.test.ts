import { describe, expect, it } from "vitest";
import { sessionExpired, tokenClaims } from "./session";

const NOW = 1_800_000_000;

function bearer(claims: object) {
    const payload = btoa(JSON.stringify(claims)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `Bearer header.${payload}.signature`;
}

describe("tokenClaims", () => {
    it("reads aal and amr from a bearer token", () => {
        expect(tokenClaims(bearer({ aal: "aal2", amr: [{ method: "password", timestamp: NOW }] }))).toEqual({ aal: "aal2", amr: [{ method: "password", timestamp: NOW }] });
    });

    it("returns empty claims for a malformed token", () => {
        expect(tokenClaims("Bearer nonsense")).toEqual({});
    });
});

describe("sessionExpired", () => {
    it("allows a session inside eight hours of the password sign-in", () => {
        const amr = [{ timestamp: NOW - 7 * 3600 }, { timestamp: NOW - 60 }];
        expect(sessionExpired({ amr }, NOW)).toBe(false);
    });

    it("refuses a session older than eight hours even if MFA was recent", () => {
        const amr = [{ timestamp: NOW - 8 * 3600 - 1 }, { timestamp: NOW - 60 }];
        expect(sessionExpired({ amr }, NOW)).toBe(true);
    });

    it("refuses a token with no authentication record", () => {
        expect(sessionExpired({ aal: "aal2" }, NOW)).toBe(true);
    });
});
