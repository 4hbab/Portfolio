export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}
export interface ChatSource {
    id: string;
    label: string;
    href: string;
}

export interface ChatResult {
    text: string;
    revision: number;
    sources: ChatSource[];
    stale: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function streamChat(
    messages: ChatMessage[],
    displayedRevision: number,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
    jobDescription?: string
): Promise<ChatResult> {
    if (!supabaseUrl || !supabaseKey) throw new Error("The recruiter assistant is temporarily unavailable.");

    let response: Response;
    try {
        response = await fetch(`${supabaseUrl}/functions/v1/recruiter-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
            body: JSON.stringify({ messages, displayedRevision, jobDescription }),
            signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") throw error;
        throw new Error("The recruiter assistant could not connect. Please use the links below.");
    }
    if (!response.ok) {
        if (response.status === 429) throw new Error("The assistant has reached its usage limit. Please use the links below.");
        if (response.status === 503) throw new Error("The assistant is waiting for the first published portfolio revision. Please use the links below.");
        throw new Error("The recruiter assistant could not respond. Please use the links below.");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("The assistant returned an unreadable response.");
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let revision = displayedRevision;
    let sources: ChatSource[] = [];
    let stale = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
                const event = JSON.parse(line.slice(6)) as { type: "delta" | "done"; text?: string; revision?: number; sources?: ChatSource[]; stale?: boolean };
                if (event.type === "delta" && event.text) { text += event.text; onChunk(event.text); }
                if (event.type === "done") { revision = event.revision ?? revision; sources = event.sources ?? []; stale = Boolean(event.stale); }
            } catch { /* Ignore malformed upstream events. */ }
        }
    }
    return { text, revision, sources, stale };
}
