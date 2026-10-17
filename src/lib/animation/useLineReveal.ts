"use client";

import { gsap, SplitText, useGSAP } from "./gsap";
import { duration, ease, media } from "./presets";

/**
 * Every `[data-reveal-lines]` element inside `scope` rises out of a mask a
 * line at a time when it scrolls into view. The text is in the markup at rest;
 * only the tween hides it, so no-JS and reduced motion get it unanimated.
 */
export function useLineReveal(scope: React.RefObject<HTMLElement | null>) {
    useGSAP(
        () => {
            const mm = gsap.matchMedia();
            mm.add(media.motion, () => {
                scope.current?.querySelectorAll<HTMLElement>("[data-reveal-lines]").forEach((el) => {
                    SplitText.create(el, {
                        type: "lines",
                        mask: "lines",
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
                });
            });
        },
        { scope }
    );
}
