"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "./reducedMotion";

interface MagneticOptions {
    /** Max displacement in px (default: 30) */
    strength?: number;
    /** Radius around each element that activates the pull, in px (default: 200) */
    radius?: number;
    /** GSAP ease for the pull movement (default: "power3.out") */
    ease?: string;
    /** Duration of the pull tween (default: 0.4) */
    duration?: number;
    /** Duration of the return-to-origin tween (default: 0.6) */
    returnDuration?: number;
}

/**
 * Makes every `[data-magnetic]` element inside `scopeRef`
 * gravitate toward the mouse cursor when it's nearby.
 */
export function useMagneticCursor<T extends HTMLElement>(
    scopeRef: React.RefObject<T | null>,
    opts: MagneticOptions = {}
) {
    const {
        strength = 30,
        radius = 200,
        ease = "power3.out",
        duration = 0.4,
        returnDuration = 0.6,
    } = opts;

    const rafId = useRef<number>(0);
    const mouse = useRef({ x: 0, y: 0 });

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };

            // Cancel any pending frame to avoid stacking
            cancelAnimationFrame(rafId.current);

            rafId.current = requestAnimationFrame(() => {
                const scope = scopeRef.current;
                if (!scope) return;

                const els = scope.querySelectorAll<HTMLElement>("[data-magnetic]");

                els.forEach((el) => {
                    const rect = el.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;

                    const dx = mouse.current.x - cx;
                    const dy = mouse.current.y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < radius) {
                        // Normalised pull (1 at centre, 0 at edge of radius)
                        const pull = 1 - dist / radius;
                        // Ease the pull for a more natural feel
                        const easedPull = pull * pull;

                        gsap.to(el, {
                            x: dx * easedPull * (strength / radius) * 2,
                            y: dy * easedPull * (strength / radius) * 2,
                            duration,
                            ease,
                            overwrite: "auto",
                        });
                    } else {
                        // Return to origin smoothly
                        gsap.to(el, {
                            x: 0,
                            y: 0,
                            duration: returnDuration,
                            ease,
                            overwrite: "auto",
                        });
                    }
                });
            });
        },
        [scopeRef, strength, radius, ease, duration, returnDuration]
    );

    useEffect(() => {
        if (prefersReducedMotion()) return;

        window.addEventListener("mousemove", handleMouseMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(rafId.current);
        };
    }, [handleMouseMove]);
}
