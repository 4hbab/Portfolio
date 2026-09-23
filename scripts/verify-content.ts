import { ContentSchemaError, fetchPublishedSnapshot, isContentConfigured } from "../src/lib/content";

// Guards against the failure the runtime cannot signal: a published snapshot the
// schema rejects makes every page silently serve the built-in fallback instead.
// Schema drift fails the build; an unreachable Supabase does not.
if (!isContentConfigured) {
    console.log("Supabase is not configured for this build; skipping published content verification.");
    process.exit(0);
}

try {
    const snapshot = await fetchPublishedSnapshot();
    if (snapshot.revision === 0) {
        console.log("No revision has been published yet; the built-in snapshot will be used.");
    } else {
        console.log(`Published revision ${snapshot.revision} satisfies the portfolio schema.`);
    }
} catch (error) {
    if (error instanceof ContentSchemaError) {
        console.error(`\n${error.message}\n`);
        console.error("Restore a valid revision from the History tab, or migrate the stored content to the current schema.");
        process.exit(1);
    }
    console.warn("Could not reach Supabase to verify published content; continuing with the built-in snapshot.", error);
    process.exit(0);
}
