"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { media } from "./presets";

interface MagneticOptions {
    /** Max displacement in px (default: 30) */
    strength?: number;
    /** Radius around each element that activates the pull, in px (default: 200) */
    radius?: number;
}

type Mover = { x: gsap.QuickToFunc; y: gsap.QuickToFunc };

/**
 * Makes every `[data-magnetic]` element inside `scopeRef` lean toward the
 * pointer when it is near. One quickTo per element and axis is created lazily
 * and reused, so a mousemove retargets a running tween instead of starting a
 * new one. Elements can be added later (SplitText output) and are picked up.
 */
export function useMagneticCursor<T extends HTMLElement>(
    scopeRef: React.RefObject<T | null>,
    { strength = 30, radius = 200 }: MagneticOptions = {}
) {
    useEffect(() => {
        const query = window.matchMedia(media.full);
        if (!query.matches) return;

        const movers = new WeakMap<HTMLElement, Mover>();
        const moverFor = (el: HTMLElement) => {
            let mover = movers.get(el);
            if (!mover) {
                mover = {
                    x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }),
                    y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }),
                };
                movers.set(el, mover);
            }
            return mover;
        };

        let frame = 0;
        const onMove = (event: PointerEvent) => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const scope = scopeRef.current;
                if (!scope) return;
                scope.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
                    const rect = el.getBoundingClientRect();
                    const dx = event.clientX - (rect.left + rect.width / 2);
                    const dy = event.clientY - (rect.top + rect.height / 2);
                    const dist = Math.hypot(dx, dy);
                    // Quadratic falloff: 1 at the centre, 0 at the radius edge.
                    const pull = dist < radius ? (1 - dist / radius) ** 2 * (strength / radius) * 2 : 0;
                    const mover = moverFor(el);
                    mover.x(dx * pull);
                    mover.y(dy * pull);
                });
            });
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        return () => {
            window.removeEventListener("pointermove", onMove);
            cancelAnimationFrame(frame);
        };
    }, [scopeRef, strength, radius]);
}
