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
