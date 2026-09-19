import {
    fallbackSnapshot,
    portfolioContentSchema,
    type PublicContentResponse,
} from "@/content/portfolio";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function snapshotFromRow(row: Record<string, unknown>): PublicContentResponse {
    return {
        schemaVersion: 1,
        revision: Number(row.revision),
        publishedAt: String(row.published_at),
        content: portfolioContentSchema.parse(row.content),
    };
}

export async function fetchPublishedSnapshot(
    signal?: AbortSignal
): Promise<PublicContentResponse> {
    if (!supabaseUrl || !supabaseKey) return fallbackSnapshot;

    const response = await fetch(
        `${supabaseUrl}/rest/v1/published_snapshots?select=revision,published_at,content&order=revision.desc&limit=1`,
        {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
            },
            signal,
        }
    );
    if (!response.ok) throw new Error("Published content is unavailable");

    const rows = (await response.json()) as Record<string, unknown>[];
    return rows[0] ? snapshotFromRow(rows[0]) : fallbackSnapshot;
}

export async function getBuildSnapshot(): Promise<PublicContentResponse> {
    try {
        return await fetchPublishedSnapshot();
    } catch {
        return fallbackSnapshot;
    }
}

