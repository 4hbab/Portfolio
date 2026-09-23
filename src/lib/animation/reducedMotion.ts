"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** For non-React call sites (GSAP helpers) that just need the current value. */
export function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void) {
    const query = window.matchMedia(QUERY);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

/**
 * Subscribing through useSyncExternalStore rather than useState + useEffect.
 * The server and the hydrating client both report false so the markup matches,
 * and the real preference lands on the first commit — without the setState
 * during an effect that the project was globally disabling a lint rule for.
 */
export function useReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
