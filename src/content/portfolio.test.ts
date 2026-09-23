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

    // Regression: the URL rule used to be `.url()` followed by a refinement that
    // called `new URL(value)`. Zod runs every check even after one fails, so a
    // value that is not a URL at all threw a TypeError straight out of
    // safeParse. That turned "invalid content" into an exception, which the
    // build-time gate mistook for an unreachable Supabase and let through.
    it.each([
        ["an empty string", ""],
        ["a bare domain", "www.example.com"],
        ["a GitHub homepage without a scheme", "example.dev/project"],
        ["plain text", "coming soon"],
        ["http", "http://example.com"],
    ])("rejects %s without throwing", (_label, url) => {
        const candidate = { ...fallbackContent, links: [{ ...fallbackContent.links[0], url }] };
        let result: ReturnType<typeof portfolioContentSchema.safeParse> | undefined;
        expect(() => { result = portfolioContentSchema.safeParse(candidate); }).not.toThrow();
        expect(result?.success).toBe(false);
    });

    it("keeps an optional project liveUrl total", () => {
        const candidate = { ...fallbackContent, projects: [{ ...fallbackContent.projects[0], liveUrl: "www.example.com" }] };
        expect(() => portfolioContentSchema.safeParse(candidate)).not.toThrow();
        expect(portfolioContentSchema.safeParse(candidate).success).toBe(false);
    });
});
