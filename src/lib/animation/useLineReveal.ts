"use client";

import { gsap, ScrollTrigger, SplitText, useGSAP } from "./gsap";
import { duration, ease, media } from "./presets";

/**
 * Every `[data-reveal-lines]` element inside `scope` rises out of a mask a
 * line at a time when it scrolls into view. The text is in the markup at rest;
 * only the tween hides it, so no-JS and reduced motion get it unanimated.
 *
 * Splitting measures layout, so it is kept out of hydration: each element is
 * only split once it is within 200px of the viewport. That is still
 * off-screen, so the hide-then-reveal is never seen, but headings further down
 * the page no longer all split at load.
 */
export function useLineReveal(scope: React.RefObject<HTMLElement | null>) {
    useGSAP(
        () => {
            const mm = gsap.matchMedia();
            mm.add(media.motion, (context) => {
                scope.current?.querySelectorAll<HTMLElement>("[data-reveal-lines]").forEach((el) => {
                    ScrollTrigger.create({
                        trigger: el,
                        start: "top bottom+=200",
                        once: true,
                        // context.add runs the function inside the matchMedia
                        // context, so a split made long after this callback
                        // returned is still reverted with it.
                        onEnter: () => context.add(() => {
                            SplitText.create(el, {
                                type: "lines",
                                mask: "lines",
                                // Line splits keep words whole, so assistive tech
                                // reads the text as is. "auto" would put aria-label
                                // on <p>, where it is not allowed.
                                aria: "none",
                                autoSplit: true,
                                onSplit: (self) =>
                                    gsap.from(self.lines, {
                                        yPercent: 105,
                                        duration: duration.base,
                                        ease: ease.reveal,
                                        stagger: 0.08,
                                        scrollTrigger: { trigger: el, start: "top 88%", once: true },
                                    }),
                            });
                        }),
                    });
                });
            });
        },
        { scope }
    );
}
