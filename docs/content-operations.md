# Content operations

## Initial setup

1. Create a Supabase project and link it with `supabase link --project-ref <ref>`.
2. Apply migrations with `supabase db push` and run policy tests with `supabase test db`.
3. Disable new-user registration in **Authentication → Providers → Email**. Create the single owner in **Authentication → Users**, then insert that user UUID into `public.owner_accounts`.
4. Set the two public values from `.env.example` locally and as GitHub repository variables. They identify the Supabase project; they are intentionally safe for browser use because database access is controlled by grants and RLS.
5. Configure the function secrets:

   ```sh
   supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-2.5-flash
   supabase secrets set GITHUB_DISPATCH_TOKEN=... RATE_LIMIT_SALT=...
   supabase secrets set PUBLIC_SITE_ORIGIN=https://4hbab.github.io
   ```

   Optional, and only needed if the repository is renamed or moved. They default
   to the current values, and mirror `src/lib/site.ts` for the Deno runtime:

   ```sh
   supabase secrets set GITHUB_OWNER=4hbab GITHUB_REPO=Portfolio DEPLOY_BRANCH=v2
   ```

   Rate limits for the public assistant are tunable without a deploy:
   `CHAT_PER_MINUTE` (5), `CHAT_PER_DAY` (30), `CHAT_GLOBAL_DAY` (100).

6. Deploy `recruiter-chat`, `trigger-rebuild`, and `import-github-projects`. Open `/Portfolio/admin/`, sign in, enroll an authenticator, review the migrated bundled content, and publish it. The first publish is required before the chatbot can answer because the function uses the published snapshot as its only source of portfolio facts.

Only `recruiter-chat` uses `SUPABASE_SERVICE_ROLE_KEY`, for the rate-limit and
metrics writes that must bypass RLS. `trigger-rebuild` and
`import-github-projects` act as the signed-in owner: the "Owner can identify
their account" policy already scopes the ownership check to the caller's own
row, so neither needs a key that bypasses RLS at all.

`GEMINI_API_KEY` does not belong in the Next.js root `.env`. Next.js does not execute the chatbot function, and an unprefixed variable is unavailable to browser code. For hosted functions, use `supabase secrets set`; for local function development, put server secrets in the ignored `supabase/functions/.env` and run `supabase functions serve --env-file supabase/functions/.env`. The root `.env.local` should contain only the two `NEXT_PUBLIC_SUPABASE_*` values used by the portfolio browser client.

The GitHub token should be fine-grained, restricted to `4hbab/Portfolio`, with Actions write access only. The admin interface never receives it. Configure password recovery redirects to `/Portfolio/admin/`; keep recovery access to the owner email account and Supabase dashboard protected with MFA.

## Export and restore

Export the current live snapshot before large edits:

```sh
supabase db dump --data-only --table public.published_snapshots --table public.content_revisions --file portfolio-content.sql
```

Restore content by selecting **History** in the editor and restoring a revision as a draft, previewing it, and publishing it. For disaster recovery, restore the SQL export into a fresh linked project and update the two public GitHub variables.

## Secret rotation

- Replace the old Gemini key in Google AI Studio, update `GEMINI_API_KEY`, smoke-test the assistant, then revoke the previous key.
- Create a replacement fine-grained GitHub token, update `GITHUB_DISPATCH_TOKEN`, trigger a rebuild, then revoke the previous token.
- Rotate Supabase keys from the project dashboard only during a maintenance window, then update function secrets, GitHub variables, and local environment files.
- Never use a `NEXT_PUBLIC_` name for Gemini, GitHub, service-role, or rate-limit secrets.

## Rollback and outages

Restoring and publishing a prior revision updates visitors immediately. A rebuild then refreshes the GitHub Pages fallback. If a deployment is bad, re-run a previously successful Pages workflow or revert the code commit on `v2`; the last published content remains in Supabase.

When Supabase is paused or unavailable, the portfolio renders its last verified build-time snapshot. Editing and AI chat remain unavailable until Supabase returns. The chatbot then presents direct links to experience, projects, and contact instead of losing the rest of the portfolio.

## Security boundaries

Three layers gate an owner write, and each is independently sufficient to refuse:

1. `verify_jwt = true` in `supabase/config.toml` rejects an unauthenticated call
   at the edge, before any function code runs.
2. `requireOwnerMfa` verifies the token with Supabase Auth, requires `aal2`, and
   confirms the caller is in `owner_accounts`.
3. Every write is a `SECURITY DEFINER` function that re-checks
   `public.is_owner_with_mfa()` and validates the content. The database refuses
   a write even if both layers above were bypassed.

`recruiter-chat` is deliberately public (`verify_jwt = false`): it answers
visitors. The origin header is a convenience, not a control — a non-browser
client can omit it. What actually bounds the cost of abuse is the quota in
`consume_chat_quota`, including the global daily cap. Lower `CHAT_GLOBAL_DAY` to
tighten the worst case; raise it if legitimate traffic hits the ceiling.

`supabase test db` covers layer 3. It runs in CI on every push, and pgTAP is
created inside the test transaction so it never reaches the live database.

## Content validation

The same content is checked in three places, deliberately:

- `portfolioContentSchema` (Zod) in the studio, before a draft is sent.
- `public.validate_portfolio_content` in the database, which is the only one an
  attacker cannot skip.
- `npm run verify:content` in CI, which fails the build when the *published*
  snapshot no longer satisfies the schema the code expects.

The third only works because parsing is total. A schema whose checks can throw
makes drift look like an outage, and the gate then passes. `src/lib/content.ts`
converts any validation throw into `ContentSchemaError` for that reason, and
`src/content/portfolio.test.ts` covers it.

## Content security policy

`scripts/apply-csp.ts` writes the policy from `src/lib/seo/csp.ts` into every
page as the first element of `<head>`, after `next build`. It is a build step
rather than a rendered tag because a `<meta>` policy only governs what the
parser reaches after it, and Next controls the order of its own head output —
rendered from the layout, the tag landed after the script tags it was meant to
constrain.

Two limits are inherent to serving from GitHub Pages: `frame-ancestors` and
`report-uri` are ignored in `<meta>` form, and the inlined RSC payload forces
`script-src 'unsafe-inline'`. Moving to a host that can set response headers
would close both.

Adding a browser-side call to a new origin means adding it to `connect-src`,
or it will be blocked in production while working in development.
