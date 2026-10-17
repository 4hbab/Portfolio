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
