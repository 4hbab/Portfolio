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

6. Deploy `recruiter-chat`, `trigger-rebuild`, and `import-github-projects`. Open `/Portfolio/admin/`, sign in, enroll an authenticator, review the migrated bundled content, and publish it. The first publish is required before the chatbot can answer because the function uses the published snapshot as its only source of portfolio facts.

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
