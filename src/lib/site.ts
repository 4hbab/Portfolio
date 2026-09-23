/**
 * The deployment's identity, in one place. `basePath`, the public origin, and
 * the GitHub repository were previously repeated across next.config.ts, the
 * admin studio, and two edge functions, so renaming the repository silently
 * broke whichever copy was missed.
 *
 * Edge functions cannot import this file — the Supabase bundler only ships what
 * lives under supabase/functions — so they read the same values from their own
 * environment. `docs/content-operations.md` records the pairing.
 */
export const GITHUB_OWNER = "4hbab";
export const GITHUB_REPO = "Portfolio";
export const DEPLOY_BRANCH = "v2";

/** GitHub Pages serves the project site from /<repo>/. */
export const BASE_PATH = `/${GITHUB_REPO}`;
export const SITE_ORIGIN = `https://${GITHUB_OWNER}.github.io`;
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}/`;

/**
 * Only the production build is served under the base path; `next dev` serves
 * from the root. Anything linking outside the router (the studio's "← Portfolio"
 * link) has to account for that itself.
 */
export const publicPath = (path = "/") =>
    `${process.env.NODE_ENV === "production" ? BASE_PATH : ""}${path}`;
