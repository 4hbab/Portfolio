import { describe, expect, it } from "vitest";
import { normalizeTotpQrCode } from "./mfa";

describe("normalizeTotpQrCode", () => {
    it("encodes Supabase's raw SVG data URL and removes trailing control characters", () => {
        const raw = 'data:image/svg+xml;utf-8,<?xml version="1.0"?>\n<svg><rect width="3" /></svg>\n';
        const normalized = normalizeTotpQrCode(raw);

        expect(normalized).toBe(
            "data:image/svg+xml;charset=utf-8,%3C%3Fxml%20version%3D%221.0%22%3F%3E%0A%3Csvg%3E%3Crect%20width%3D%223%22%20%2F%3E%3C%2Fsvg%3E"
        );
        expect(normalized).not.toMatch(/[\n\r]/);
    });

    it("does not double-encode an already encoded SVG", () => {
        const encoded = "data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E";
        expect(normalizeTotpQrCode(encoded)).toBe(encoded);
    });
});
