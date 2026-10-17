---
name: portfolio-motion
description: Design and motion rules for this portfolio's redesign (dark charcoal + mint identity, GSAP 3.14). Load before changing any section, component, globals.css token, or animation in src/components or src/lib/animation, and before adding a dependency for UI or motion.
---

# Portfolio design and motion rules

Direction: **evolve the current identity, do not replace it.** Charcoal-blue ground, muted-mint ink, mint
accent, one sans family plus mono. Upgrade typography, layout rhythm and motion; keep the palette in
`src/app/globals.css` `@theme` as the single source of colour.

Use the `frontend-design` skill (if installed) for aesthetic judgement; where it conflicts with this file,
this file wins because the direction is already decided.

## Motion budget

- Spend boldness in three places only: the **hero load sequence**, the **experience timeline draw**, and the
  **projects filter (Flip)**. Everything else gets quiet, response-to-action motion (hover, open, confirm).
- No blanket fade-and-slide-up on every section. A section either has a purposeful reveal or none.
- No scroll hijacking (no ScrollSmoother, no Lenis). Native scroll; the ProgressThread already gives scroll
  feedback.
- No continuous looping decoration except one subtle ambient element in the hero.

## GSAP conventions

- Everything GSAP 3.14 ships is free: use `SplitText`, `Flip`, `DrawSVGPlugin`, `ScrollTrigger` from the
  installed `gsap` package. Do not add Framer Motion, Motion One, Lenis or Three.js.
- Always `useGSAP(() => …, { scope: rootRef, dependencies: [reducedMotion] })`; never raw `useEffect` for
  tweens. Register plugins once per module with `gsap.registerPlugin(...)`.
- Durations and easings come from `src/lib/animation/presets.ts`. Add a token there rather than inlining a
  number. (The file's "Neo-Brutalism" naming is legacy; rename as part of the redesign.)
- Use `SplitText` with `aria: "auto"` instead of hand-splitting strings into spans. Revert splits on cleanup.
- Use `gsap.matchMedia()` to scope heavy effects to `(min-width: 768px) and (prefers-reduced-motion: no-preference)`.
- Animate only `transform`, `opacity`, `clip-path`. Never animate layout properties (width, height, top, margin).
- Cursor-driven effects (magnetic, spotlight) write CSS custom properties or use `gsap.quickTo`; never
  create a new tween per mousemove.

## Gotchas this codebase has already hit

- Import everything from `@/lib/animation/gsap` (it imports from `gsap/all`; `gsap/Flip` breaks `tsc` on macOS
  because of a casing clash between `Flip.d.ts` and `flip.d.ts`).
- `useGSAP` with `dependencies` does **not** revert on change unless `revertOnUpdate: true`. Content arrives twice
  (build snapshot, then the live fetch), so any effect keyed on content needs it, or `from()` tweens stack and
  animate hidden to hidden.
- Anything that changes page height after load (filtering, expanding) must call `ScrollTrigger.refresh()`, or
  every trigger below it fires at stale positions.
- Flip cannot animate out an element hidden by the `hidden` attribute: Tailwind's base styles make `[hidden]`
  `display: none !important`. Hide with a data attribute and a plain CSS rule instead.
- Elements that swap per state (the nav pill) need a shared `data-flip-id` for Flip to match old to new.
- SplitText: `aria: "none"` for line splits (`aria-label` is not allowed on `<p>`); char splits on headings keep
  the default. Create splits lazily near the viewport (see `useLineReveal`), not all during hydration.
- Never animate the mobile LCP element (the hero tagline). Above-the-fold elements that are animated are held
  back by the `.js` gate in `globals.css`, and must use `fromTo` (a `from()` would record the gated hidden state
  as its end state).
- Headless Chrome on macOS never advances rAF with `--screenshot`; verify motion through the DevTools protocol
  in real time instead.
- Local builds can embed a stale content snapshot from `.next/cache/fetch-cache`, which makes the live refresh
  swap content after load and inflates TBT. Move that cache aside before measuring performance; CI builds fresh.
- The hero's signal field (`HeroField`) is the page's one ambient loop. It draws the resting grid once to an
  offscreen canvas and per frame only the lit dots, and does no work while nothing is lit. Keep it that way.

## Reduced motion and no-JS

- Content must be fully visible with JS disabled and with `prefers-reduced-motion: reduce`. Animate **from**
  a hidden state inside GSAP; never set `opacity: 0` in CSS or markup.
- With reduced motion, keep state changes (filter results, open/close) but make them instant or a ≤150ms
  opacity fade.

## Constraints from the platform

- Static export to GitHub Pages: no server, no middleware, no route handlers at runtime.
- CSP is a meta tag (`src/lib/seo/csp.ts`): `font-src 'self'`, scripts from `'self'` only. Fonts must come
  through `next/font` (self-hosted at build). No CDN scripts, no remote fonts, no external images.
- Next 16 has breaking changes: read `node_modules/next/dist/docs/` before touching routing, fonts or config.

## Performance budget

- Lighthouse mobile: Performance ≥ 90, CLS = 0, no long task > 200ms during the hero sequence.
- Hero sequence finishes within 1.6s; the name is readable (LCP) before the sequence ends.
- At most one `will-change` per animated group, removed after the animation completes.

## Verify before calling a change done

1. `npm run lint && npm run typecheck && npm test`
2. `npm run build` (also applies the CSP) and serve `out/`, then check the page with reduced motion on and off,
   at 375px and 1440px widths.
3. Tab through the page: focus is visible and never lands on an invisible element.
