# Portfolio

A high-performance, accessible portfolio site built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **GSAP** — statically exported for **GitHub Pages**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Animation | GSAP + `@gsap/react` (useGSAP) |
| Content/Auth/API | Supabase Postgres, Auth, Edge Functions |
| Resume | `@react-pdf/renderer` |
| Deploy | GitHub Actions → GitHub Pages |

## Getting Started

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # Produces out/, then applies the CSP to every page
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest
npm run verify:content # Fails if the published snapshot no longer fits the schema
npm run resume:pdf -- resume.pdf
```

Database policy tests run against a local Supabase (requires Docker):

```bash
supabase db start && supabase test db
```

## Project Structure

```
src/
├── app/              # App Router (layout, page, globals, /admin)
├── components/
│   ├── admin/        # Content studio (auth, MFA gate, editor)
│   ├── resume/       # React-PDF document and generation
│   ├── sections/     # Hero, About, Experience, Projects, Contact
│   └── ui/           # Button, Navbar, Footer, SectionHeading, Chatbot
├── content/          # portfolio.ts — the versioned content schema and fallback
└── lib/
    ├── animation/    # GSAP tokens, reduced-motion hook, magnetic cursor
    ├── seo/          # Metadata and the content security policy
    ├── supabase/     # Browser client, MFA helpers, generated types
    ├── content.ts    # Published-snapshot reads and the schema-drift error
    └── site.ts       # Deployment identity (base path, origin, repository)

supabase/
├── functions/        # recruiter-chat, trigger-rebuild, import-github-projects
├── migrations/       # Schema, RLS policies, and the SECURITY DEFINER writes
└── tests/            # pgTAP policy tests (the authorization boundary)
```

`src/lib/site.ts` and `supabase/functions/_shared/config.ts` hold the same
deployment identity for the two runtimes. The Supabase bundler only ships what
lives under `supabase/functions/`, so the functions read it from their own
environment instead of importing it.

## Content management

The public portfolio, generated PDF, and recruiter assistant share the versioned `PortfolioContent` contract in `src/content/portfolio.ts`. The bundled content is a build-time and outage fallback. Routine changes are made at `/Portfolio/admin/`, where the owner can edit, preview, save a draft, publish, restore revisions, and import GitHub projects.

Copy `.env.example` to `.env.local` for local development. Full provisioning, recovery, exports, secret rotation, and rollback instructions are in [`docs/content-operations.md`](docs/content-operations.md).

## Deployment

Push to `v2` to trigger `.github/workflows/deploy.yml`. It runs the database
policy tests in parallel with lint, typecheck, unit tests, published-content
verification, and the build; both must pass before deploy. Publishing content
updates visitors immediately and requests a background rebuild so static
metadata and the outage fallback stay current.

Renaming the repository means changing `GITHUB_REPO` in `src/lib/site.ts` and
setting `GITHUB_REPO` as a function secret — nothing else hardcodes it.

## Guardrails Checklist

**Quality**
- [x] `npm ci` in CI
- [x] `lint`, `typecheck`, `build` on every push
- [x] No animation without scoped cleanup (`useGSAP` / context)

**Security**
- [x] Dependabot enabled
- [x] No secrets in repo
- [x] No third-party scripts; all assets are same-origin (fonts are self-hosted)
- [x] Content security policy applied to every page at build time
- [x] Gemini and GitHub credentials remain server-side
- [x] Owner writes require MFA and database authorization
- [x] RLS and MFA policies are tested in CI, not only by hand
- [x] Only `recruiter-chat` holds a service-role key; owner functions act as the caller
- [x] Content is schema-validated on read, on write, and in the database
- [x] External links use `rel="noopener noreferrer"`
- [ ] `frame-ancestors` — unavailable: GitHub Pages cannot set response headers,
      and a `<meta>` CSP ignores that directive. Clickjacking is unmitigated.
- [ ] `script-src` uses `'unsafe-inline'` — a static export has no nonce to use
      instead, so injected inline script is not blocked by the policy.

**UX**
- [x] Reduced motion supported
- [x] Keyboard navigation works
- [x] Skip-to-content link
- [x] Mobile responsive

## License

MIT
