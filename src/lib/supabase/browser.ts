import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | undefined;

const CONFIG_MESSAGE =
    "This build is missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Set them as GitHub repository variables and redeploy.";

/** Local and preview builds stay renderable before a Supabase project exists. */
const DEVELOPMENT_FALLBACK = { url: "http://127.0.0.1:54321", key: "local-development-key" };

function resolveConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return { url, key, configured: Boolean(url && key) };
}

/**
 * A production build with these missing would otherwise fall back to localhost
 * and fail with unexplained connection errors. Returns the reason so the studio
 * can say it plainly; prerendering is left alone so the public site still builds
 * when Supabase is unavailable.
 */
export function getSupabaseConfigError(): string | null {
    const { configured } = resolveConfig();
    return !configured && process.env.NODE_ENV === "production" ? CONFIG_MESSAGE : null;
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
    if (!client) {
        const { url, key, configured } = resolveConfig();
        if (!configured && typeof window !== "undefined" && process.env.NODE_ENV === "production") {
            throw new Error(CONFIG_MESSAGE);
        }
        client = createClient<Database>(url ?? DEVELOPMENT_FALLBACK.url, key ?? DEVELOPMENT_FALLBACK.key, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
    }
    return client;
}
