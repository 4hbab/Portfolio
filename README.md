# Portfolio

A high-performance, accessible portfolio site built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **GSAP** — statically exported for **GitHub Pages**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Animation | GSAP + `@gsap/react` (useGSAP) |
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

## Customization

Edit your content in `src/content/`:
- **projects.ts** — Add/remove projects
- **experience.ts** — Update work history
- **socials.ts** — Change social links

## Deployment

Push to `main` to trigger `.github/workflows/deploy.yml` which runs lint → typecheck → build → deploy.

Set `basePath` in `next.config.ts` to match your repo name (default: `/Portfolio`).

## Guardrails Checklist

**Quality**
- [x] `npm ci` in CI
- [x] `lint`, `typecheck`, `build` on every push
- [x] No animation without scoped cleanup (`useGSAP` / context)

**Security**
- [ ] Dependabot enabled
- [x] No secrets in repo
- [x] No unpinned third-party scripts
- [x] External links use `rel="noopener noreferrer"`

**UX**
- [x] Reduced motion supported
- [x] Keyboard navigation works
- [x] Skip-to-content link
- [x] Mobile responsive

## License

MIT
