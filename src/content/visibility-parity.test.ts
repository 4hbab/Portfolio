import { describe, expect, it } from "vitest";
import { fallbackContent, visibleContent } from "./portfolio";
import { visiblePublishedContent } from "../../supabase/functions/_shared/content";

// The chat function runs on Deno and cannot import from src/, so the filter is
// duplicated there. This test keeps the copy honest: anything the website hides
// must also be hidden from the assistant.
describe("published content visibility", () => {
    it("hides exactly what the website hides", () => {
        const source = {
            ...fallbackContent,
            experience: fallbackContent.experience.map((item, index) => ({ ...item, visible: index !== 0 })),
            projects: fallbackContent.projects.map((item, index) => ({ ...item, visible: index % 2 === 0 })),
            bio: fallbackContent.bio.map((item) => ({ ...item, visible: false })),
        };
        expect(visiblePublishedContent(source)).toEqual(visibleContent(source));
    });

    it("keeps hidden records out of the payload sent to the model", () => {
        const source = { ...fallbackContent, projects: fallbackContent.projects.map((item) => ({ ...item, visible: false })) };
        expect(visiblePublishedContent(source).projects).toHaveLength(0);
        expect(JSON.stringify(visiblePublishedContent(source))).not.toContain(fallbackContent.projects[0].title);
    });
});
