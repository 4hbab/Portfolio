/* ── Motion tokens ──
   Calm and precise rather than bouncy: things arrive fast and settle, nothing
   overshoots. Three bold moments (hero, experience timeline, project filter)
   use `reveal`; everything a visitor triggers uses `micro` or `fast`. */

export const duration = {
    micro: 0.18,
    fast: 0.35,
    base: 0.7,
    slow: 1.1,
} as const;

export const ease = {
    /** Default for entrances. */
    out: "power3.out",
    /** Long tail for masked text and line reveals. */
    reveal: "expo.out",
    /** Moving something already on screen to a new place. */
    move: "power2.inOut",
    /** Ambient loops only. */
    drift: "sine.inOut",
} as const;

/* For gsap.matchMedia(). Heavy effects only run under `full`; small screens
   and reduced motion get the content without them. */
export const media = {
    full: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    motion: "(prefers-reduced-motion: no-preference)",
    /** Layout breakpoint (Tailwind md), for effects whose direction depends on layout. */
    wide: "(min-width: 768px)",
    reduced: "(prefers-reduced-motion: reduce)",
} as const;
