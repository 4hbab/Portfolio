/**
 * Deployment identity for the functions. Mirrors src/lib/site.ts, which the
 * Supabase bundler cannot reach: it only ships what lives under
 * supabase/functions/. The defaults keep a fresh deploy working; overriding
 * them is what makes the repository renameable without a code change.
 */
const DEFAULTS = {
  owner: "4hbab",
  repo: "Portfolio",
  branch: "v2",
  siteOrigin: "https://4hbab.github.io",
} as const;

export const githubOwner = () => Deno.env.get("GITHUB_OWNER") ?? DEFAULTS.owner;
export const githubRepo = () => Deno.env.get("GITHUB_REPO") ?? DEFAULTS.repo;
export const deployBranch = () => Deno.env.get("DEPLOY_BRANCH") ?? DEFAULTS.branch;

export function siteOrigin() {
  const value = Deno.env.get("PUBLIC_SITE_ORIGIN") ?? DEFAULTS.siteOrigin;
  try {
    return new URL(value).origin;
  } catch {
    return DEFAULTS.siteOrigin;
  }
}

/** Reads a secret that the function cannot work without, naming it when absent. */
export function requireSecret(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`MISSING_SECRET:${name}`);
  return value;
}
