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
npm run dev       # http://localhost:3000
npm run build     # Produces out/ for static hosting
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

## Project Structure

```
src/
├── app/              # Next.js App Router (layout, page, globals)
├── components/
│   ├── sections/     # Hero, About, Experience, Projects, Contact
│   └── ui/           # Button, Navbar, Footer, SectionHeading
├── content/          # Data files (projects.ts, experience.ts, socials.ts)
└── lib/
    ├── animation/    # GSAP presets, reduced-motion hook
    └── seo/          # Metadata
```

## Content management

The public portfolio, generated PDF, and recruiter assistant share the versioned `PortfolioContent` contract in `src/content/portfolio.ts`. The bundled content is a build-time and outage fallback. Routine changes are made at `/Portfolio/admin/`, where the owner can edit, preview, save a draft, publish, restore revisions, and import GitHub projects.

Copy `.env.example` to `.env.local` for local development. Full provisioning, recovery, exports, secret rotation, and rollback instructions are in [`docs/content-operations.md`](docs/content-operations.md).

## Deployment

Push to `v2` to trigger `.github/workflows/deploy.yml`, which runs lint, typecheck, tests, build, and deploy. Publishing content updates visitors immediately and securely requests a background rebuild so static metadata and the outage fallback stay current.

Set `basePath` in `next.config.ts` to match your repo name (default: `/Portfolio`).

## Guardrails Checklist

**Quality**
- [x] `npm ci` in CI
- [x] `lint`, `typecheck`, `build` on every push
- [x] No animation without scoped cleanup (`useGSAP` / context)

**Security**
- [x] Dependabot enabled
- [x] No secrets in repo
- [x] No unpinned third-party scripts
- [x] Gemini and GitHub credentials remain server-side
- [x] Owner writes require MFA and database authorization
- [x] External links use `rel="noopener noreferrer"`

**UX**
- [x] Reduced motion supported
- [x] Keyboard navigation works
- [x] Skip-to-content link
- [x] Mobile responsive

## License

MIT
