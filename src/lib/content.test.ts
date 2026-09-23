import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackContent } from "@/content/portfolio";

// The module reads its configuration once, at import time, so each case
// re-imports it after stubbing the environment.
async function loadContent() {
    vi.resetModules();
    return import("./content");
}

const respondWith = (rows: unknown) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(rows), { status: 200 })));

const publishedRow = (content: unknown) => [{
    revision: 7,
    published_at: "2026-01-01T00:00:00.000Z",
    content,
}];

describe("published content", () => {
    beforeEach(() => {
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    });
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("returns a valid published snapshot", async () => {
        const { fetchPublishedSnapshot } = await loadContent();
        respondWith(publishedRow(fallbackContent));

        const snapshot = await fetchPublishedSnapshot();
        expect(snapshot.revision).toBe(7);
        expect(snapshot.content.profile.name).toBe(fallbackContent.profile.name);
    });

    // This is what makes `npm run verify:content` a real gate: schema drift has
    // to surface as ContentSchemaError specifically, because the script treats
    // every other failure as "Supabase was unreachable" and exits successfully.
    it("reports schema drift as ContentSchemaError", async () => {
        const { fetchPublishedSnapshot, ContentSchemaError } = await loadContent();
        respondWith(publishedRow({ ...fallbackContent, profile: { ...fallbackContent.profile, name: "" } }));

        await expect(fetchPublishedSnapshot()).rejects.toBeInstanceOf(ContentSchemaError);
    });

    it("reports an unparseable URL as ContentSchemaError, not a raw TypeError", async () => {
        const { fetchPublishedSnapshot, ContentSchemaError } = await loadContent();
        respondWith(publishedRow({ ...fallbackContent, links: [{ ...fallbackContent.links[0], url: "" }] }));

        await expect(fetchPublishedSnapshot()).rejects.toBeInstanceOf(ContentSchemaError);
    });

    it("falls back to the bundled snapshot at build time instead of failing the render", async () => {
        const { getBuildSnapshot } = await loadContent();
        vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
        const error = vi.spyOn(console, "error").mockImplementation(() => { });

        const snapshot = await getBuildSnapshot();
        expect(snapshot.revision).toBe(0);
        expect(error).toHaveBeenCalled();
        error.mockRestore();
    });

    it("serves the bundled snapshot when Supabase is not configured", async () => {
        vi.unstubAllEnvs();
        const { fetchPublishedSnapshot, isContentConfigured } = await loadContent();
        expect(isContentConfigured).toBe(false);
        expect((await fetchPublishedSnapshot()).revision).toBe(0);
    });
});
