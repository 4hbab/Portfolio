import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "./chatbot";

async function loadChatbot() {
    vi.resetModules();
    return import("./chatbot");
}

/** Serves an SSE body in caller-chosen chunks, so split frames are exercised. */
function streamResponse(chunks: string[], status = 200) {
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            const encoder = new TextEncoder();
            for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
            controller.close();
        },
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));
}

const ask: ChatMessage[] = [{ role: "user", content: "What does Sakif do?" }];

describe("streamChat", () => {
    beforeEach(() => {
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    });
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("assembles deltas that arrive split across network chunks", async () => {
        const { streamChat } = await loadChatbot();
        // The second frame is deliberately cut mid-line.
        streamResponse([
            'data: {"type":"delta","text":"Backend "}\n',
            'data: {"type":"delta","te',
            'xt":"engineer."}\n',
            'data: {"type":"done","revision":12,"sources":[{"id":"experience","label":"Experience","href":"#experience"}],"stale":false}\n',
        ]);

        const seen: string[] = [];
        const result = await streamChat(ask, 12, (chunk) => seen.push(chunk));

        expect(result.text).toBe("Backend engineer.");
        expect(seen).toEqual(["Backend ", "engineer."]);
        expect(result.revision).toBe(12);
        expect(result.sources).toHaveLength(1);
        expect(result.stale).toBe(false);
    });

    it("surfaces a mid-stream error instead of returning a truncated answer", async () => {
        const { streamChat } = await loadChatbot();
        streamResponse([
            'data: {"type":"delta","text":"Partial"}\n',
            'data: {"type":"error","message":"The assistant stopped before finishing. Please try again."}\n',
        ]);

        await expect(streamChat(ask, 1, () => { })).rejects.toThrow(/stopped before finishing/);
    });

    it("ignores malformed frames rather than failing the whole answer", async () => {
        const { streamChat } = await loadChatbot();
        streamResponse([
            'data: {"type":"delta","text":"Kept"}\n',
            "data: not-json\n",
            ": a comment line\n",
            'data: {"type":"done","revision":3,"sources":[],"stale":true}\n',
        ]);

        const result = await streamChat(ask, 2, () => { });
        expect(result.text).toBe("Kept");
        expect(result.stale).toBe(true);
    });

    it("reports the rate limit and the unpublished cases distinctly", async () => {
        const { streamChat } = await loadChatbot();

        streamResponse([], 429);
        await expect(streamChat(ask, 1, () => { })).rejects.toThrow(/usage limit/);

        streamResponse([], 503);
        await expect(streamChat(ask, 1, () => { })).rejects.toThrow(/first published portfolio revision/);
    });

    it("reports a connection failure with a usable fallback message", async () => {
        const { streamChat } = await loadChatbot();
        vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));

        await expect(streamChat(ask, 1, () => { })).rejects.toThrow(/could not connect/);
    });
});
