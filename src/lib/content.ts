import {
    fallbackSnapshot,
    portfolioContentSchema,
    type PublicContentResponse,
} from "@/content/portfolio";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isContentConfigured = Boolean(supabaseUrl && supabaseKey);

/** A build must fail or fall back, never hang, on an unresponsive Supabase. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * The stored snapshot no longer satisfies the schema this build expects. It is
 * distinct from a network failure because the two need opposite responses: an
 * outage should fall back quietly, schema drift should be shouted about.
 */
export class ContentSchemaError extends Error {
    constructor(readonly revision: number, message: string) {
        super(message);
        this.name = "ContentSchemaError";
    }
}

/**
 * PostgREST directly rather than supabase-js: the public site needs exactly two
 * reads, and the client library would add its weight to every visitor's bundle
 * for nothing. The studio, which needs auth and RPC, does use the client.
 */
async function selectPublishedRow<T>(columns: string, signal?: AbortSignal): Promise<T | undefined> {
    if (!supabaseUrl || !supabaseKey) throw new Error("Published content is not configured");

    const timeout = new AbortController();
    const expire = setTimeout(() => timeout.abort(new Error("Published content request timed out")), REQUEST_TIMEOUT_MS);
    const forward = () => timeout.abort(signal?.reason);
    signal?.addEventListener("abort", forward, { once: true });

    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/published_snapshots?select=${columns}&order=revision.desc&limit=1`,
            { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, signal: timeout.signal }
        );
        if (!response.ok) throw new Error("Published content is unavailable");
        return ((await response.json()) as T[])[0];
    } finally {
        clearTimeout(expire);
        signal?.removeEventListener("abort", forward);
    }
}

function snapshotFromRow(row: Record<string, unknown>): PublicContentResponse {
    const revision = Number(row.revision);

    // Validation has to be total. The build gate below distinguishes schema
    // drift from an outage by exception type, so a validator that throws
    // something else would let bad content through as if Supabase were down.
    let parsed: ReturnType<typeof portfolioContentSchema.safeParse>;
    try {
        parsed = portfolioContentSchema.safeParse(row.content);
    } catch (caught) {
        throw new ContentSchemaError(
            revision,
            `Published revision ${revision} could not be validated: ${caught instanceof Error ? caught.message : String(caught)}. The built-in snapshot is being served instead.`
        );
    }

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new ContentSchemaError(
            revision,
            `Published revision ${revision} does not satisfy the portfolio schema at "${issue?.path.join(".") || "root"}": ${issue?.message ?? "invalid"}. The built-in snapshot is being served instead.`
        );
    }

    return {
        schemaVersion: 1,
        revision,
        publishedAt: String(row.published_at),
        content: parsed.data,
    };
}

/** Reads the revision number alone, so an unchanged snapshot costs one small row. */
export async function fetchPublishedRevision(signal?: AbortSignal): Promise<number | null> {
    if (!isContentConfigured) return null;
    const row = await selectPublishedRow<{ revision: number }>("revision", signal);
    return row ? Number(row.revision) : null;
}

export async function fetchPublishedSnapshot(signal?: AbortSignal): Promise<PublicContentResponse> {
    if (!isContentConfigured) return fallbackSnapshot;
    const row = await selectPublishedRow<Record<string, unknown>>("revision,published_at,content", signal);
    return row ? snapshotFromRow(row) : fallbackSnapshot;
}

export async function getBuildSnapshot(): Promise<PublicContentResponse> {
    try {
        return await fetchPublishedSnapshot();
    } catch (caught) {
        // Falling back keeps the site whole during an outage, but it must never
        // be mistaken for success. `npm run verify:content` turns the schema case
        // into a failed build rather than a silently stale page.
        console.error(
            caught instanceof ContentSchemaError
                ? caught.message
                : "Could not load published content at build time; serving the built-in snapshot.",
            caught
        );
        return fallbackSnapshot;
    }
}
