import { describe, expect, it } from "vitest";
import { fallbackContent, portfolioContentSchema, visibleContent } from "./portfolio";

describe("portfolio content contract", () => {
    it("accepts the bundled fallback", () => {
        expect(portfolioContentSchema.parse(fallbackContent).profile.name).toBe("Sakif Ahbab");
    });

    it("filters hidden records without mutating the source", () => {
        const source = { ...fallbackContent, experience: fallbackContent.experience.map((item, index) => ({ ...item, visible: index !== 0 })) };
        expect(visibleContent(source).experience).toHaveLength(source.experience.length - 1);
        expect(source.experience).toHaveLength(fallbackContent.experience.length);
    });

    it("rejects unsafe link protocols", () => {
        const unsafe = { ...fallbackContent, links: [{ ...fallbackContent.links[0], url: "javascript:alert(1)" }] };
        expect(portfolioContentSchema.safeParse(unsafe).success).toBe(false);
    });
});
