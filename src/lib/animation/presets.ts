/* ── Motion Design Tokens — Neo-Brutalism ── */

export const duration = {
    fast: 0.35,
    base: 0.7,
    slow: 1.2,
    dramatic: 1.6,
} as const;

export const ease = {
    out: "power3.out",
    inOut: "power2.inOut",
    elastic: "elastic.out(1, 0.5)",
    back: "back.out(2)",
    backGentle: "back.out(1.4)",
    bounce: "bounce.out",
    snap: "power4.out",
} as const;

/* ── Reveal Presets ── */

export interface AnimationVars {
    from: Record<string, unknown>;
    to: Record<string, unknown>;
}

export const presets = {
    fadeUp: {
        from: { opacity: 0, y: 60 },
        to: { opacity: 1, y: 0, duration: duration.base, ease: ease.snap },
    },
    fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1, duration: duration.base, ease: ease.out },
    },
    fadeRight: {
        from: { opacity: 0, x: -60 },
        to: { opacity: 1, x: 0, duration: duration.base, ease: ease.snap },
    },
    fadeLeft: {
        from: { opacity: 0, x: 60 },
        to: { opacity: 1, x: 0, duration: duration.base, ease: ease.snap },
    },
    scaleIn: {
        from: { opacity: 0, scale: 0.85 },
        to: { opacity: 1, scale: 1, duration: duration.base, ease: ease.back },
    },
    clipRevealUp: {
        from: { clipPath: "inset(100% 0 0 0)" },
        to: {
            clipPath: "inset(0% 0 0 0)",
            duration: duration.base,
            ease: ease.snap,
        },
    },
    clipRevealLeft: {
        from: { clipPath: "inset(0 100% 0 0)" },
        to: {
            clipPath: "inset(0 0% 0 0)",
            duration: duration.base,
            ease: ease.snap,
        },
    },
    elasticPop: {
        from: { opacity: 0, scale: 0.5, rotation: -8 },
        to: {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: duration.slow,
            ease: ease.elastic,
        },
    },
    rotateIn: {
        from: { opacity: 0, rotation: -12, y: 40 },
        to: {
            opacity: 1,
            rotation: 0,
            y: 0,
            duration: duration.base,
            ease: ease.backGentle,
        },
    },
    slideHard: {
        from: { opacity: 0, x: -120 },
        to: {
            opacity: 1,
            x: 0,
            duration: duration.base,
            ease: ease.back,
        },
    },
    stagger: {
        amount: 0.25,
    },
    staggerFast: {
        amount: 0.12,
    },
    staggerSlow: {
        amount: 0.4,
    },
} as const;
