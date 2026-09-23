/**
 * Pure helpers for the GitHub import. Kept free of Deno globals so the test
 * suite can import them directly, the same arrangement content.ts uses.
 */

/**
 * `homepage` is free text on GitHub — bare domains, http:// and empty strings
 * are all common. The portfolio schema only accepts absolute https URLs, so
 * anything else has to be dropped rather than written into the draft: an
 * invalid liveUrl produced a draft the studio could not parse, which presented
 * as the editor failing to load with no explanation.
 */
export function safeLiveUrl(homepage: unknown): string | undefined {
  if (typeof homepage !== "string") return undefined;
  const trimmed = homepage.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed).protocol === "https:" ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export const titleFromRepoName = (name: string) =>
  name.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
