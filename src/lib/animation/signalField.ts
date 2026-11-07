/* ── Signal field ──
   The hero background: a dot grid that signal pulses ripple through, like
   events fanning out across a network. Pure maths lives here so it can be
   tested; HeroField draws it. Distances are CSS px, times are seconds. */

export const FIELD = {
    /** Grid pitch. Phones get a coarser grid: fewer dots, same look. */
    spacing: 26,
    spacingCompact: 32,
    /** Dot half-size at rest, and how much a lit dot grows. */
    dot: 0.9,
    dotGrowth: 1.1,
    /** Resting brightness of every dot. */
    baseAlpha: 0.14,
    /** A pulse ring travels outward at `speed` with a soft band `width` wide. */
    speed: 380,
    width: 46,
    life: 2.8,
    /** How far a passing ring nudges a dot outward. */
    push: 5,
    /** Pointer lens: dots inside `radius` brighten and lean away. */
    cursorRadius: 150,
    cursorLift: 0.55,
    cursorPush: 7,
    /** Seconds between pulses when nobody is interacting. */
    autoEvery: 3.4,
    /** Brightness steps; dots are batched per step so a frame is a few fills. */
    buckets: 10,
} as const;

export type Ripple = { x: number; y: number; born: number };

/**
 * How strongly a ring of the given age lights a dot at `distance` from its
 * origin: a Gaussian band around the ring's current radius, fading over the
 * pulse's life. 0 before birth and after death.
 */
export function rippleBand(distance: number, age: number, f: Pick<typeof FIELD, "speed" | "width" | "life"> = FIELD): number {
    if (age < 0 || age >= f.life) return 0;
    const offset = (distance - age * f.speed) / f.width;
    if (Math.abs(offset) > 3) return 0;
    const fade = (1 - age / f.life) ** 1.5;
    return Math.exp(-offset * offset) * fade;
}

/** Quadratic falloff: 1 under the pointer, 0 at the lens edge and beyond. */
export function cursorLens(distance: number, radius: number = FIELD.cursorRadius): number {
    if (distance >= radius) return 0;
    const t = 1 - distance / radius;
    return t * t;
}

/** Maps a brightness (0…∞) to a batch index, clamped to the last bucket. */
export function bucketFor(intensity: number, buckets: number = FIELD.buckets): number {
    return Math.max(0, Math.min(buckets - 1, Math.floor(intensity * buckets)));
}
