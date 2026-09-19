import { describe, expect, it } from "vitest";
import { fallbackContent } from "@/content/portfolio";
import { createResumeBlob } from "./generateResume";

describe("resume PDF", () => {
    it("renders a non-empty selectable PDF document", async () => {
        const blob = await createResumeBlob(fallbackContent);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const signature = new TextDecoder().decode(bytes.slice(0, 4));
        expect(signature).toBe("%PDF");
        expect(bytes.length).toBeGreaterThan(5_000);
        expect(new TextDecoder("latin1").decode(bytes)).toContain("/Type /Page");
    }, 15_000);
});
