"use client";

import { useRef } from "react";
import Button from "@/components/ui/Button/Button";
import { gsap, SplitText, useGSAP } from "@/lib/animation/gsap";
import { useMagneticCursor } from "@/lib/animation/useMagneticCursor";
import { duration, ease, media } from "@/lib/animation/presets";
import { usePortfolio } from "@/components/PortfolioProvider";

/**
 * The page's one orchestrated load moment: the name rises out of a mask a
 * letter at a time, the details fade up beneath it, and a soft mint glow
 * settles behind the cursor. The animated parts are held back by a CSS gate
 * only when JS is running and motion is allowed (see `.js [data-hero-name]` in
 * globals.css), so without JS or with reduced motion the hero is simply there.
 */
export default function Hero() {
    const { content } = usePortfolio();
    const rootRef = useRef<HTMLElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    useMagneticCursor(rootRef, { strength: 18, radius: 160 });

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(media.motion, () => {
                const tl = gsap.timeline({ delay: 0.15 });

                // autoSplit re-splits if the display font swaps in after the
                // first split; returning the tween lets SplitText resume it.
                SplitText.create("[data-hero-name]", {
                    type: "chars",
                    charsClass: "hero-char",
                    mask: "chars",
                    autoSplit: true,
                    onSplit(self) {
                        self.chars.forEach((char) => char.setAttribute("data-magnetic", ""));
                        const reveal = tl.from(self.chars, {
                            yPercent: 110,
                            duration: duration.slow,
                            ease: ease.reveal,
                            stagger: 0.035,
                        }, 0);
                        // The chars are now masked out of sight, so the CSS
                        // gate holding the heading back can be lifted.
                        gsap.set(self.elements, { visibility: "visible" });
                        return reveal;
                    },
                });

                // fromTo, not from: the CSS gate means these start hidden, and
                // from() would record "hidden" as the state to animate back to.
                tl.fromTo("[data-hero-fade]", { autoAlpha: 0, y: 12 }, {
                    autoAlpha: 1,
                    y: 0,
                    duration: duration.base,
                    ease: ease.out,
                    stagger: 0.08,
                }, 0.55);

                tl.from(glowRef.current, { autoAlpha: 0, scale: 0.8, duration: 1.6, ease: ease.out }, 0);
            });

            // The glow follows the pointer on desktop; with nothing to follow
            // it drifts. This is the page's only ambient loop.
            mm.add(media.full, () => {
                const glow = glowRef.current;
                const root = rootRef.current;
                if (!glow || !root) return;

                const drift = gsap.to(glow, {
                    xPercent: 8,
                    yPercent: -6,
                    duration: 6,
                    ease: ease.drift,
                    repeat: -1,
                    yoyo: true,
                });

                const toX = gsap.quickTo(glow, "x", { duration: 1.2, ease: ease.out });
                const toY = gsap.quickTo(glow, "y", { duration: 1.2, ease: ease.out });
                const onMove = (event: PointerEvent) => {
                    const rect = root.getBoundingClientRect();
                    toX(event.clientX - rect.left - rect.width / 2);
                    toY(event.clientY - rect.top - rect.height / 2);
                };
                root.addEventListener("pointermove", onMove);

                return () => {
                    drift.kill();
                    root.removeEventListener("pointermove", onMove);
                };
            });
        },
        { scope: rootRef }
    );

    const scrollTo = (id: string) => (event: React.MouseEvent) => {
        event.preventDefault();
        document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section
            ref={rootRef}
            className="relative z-0 min-h-svh flex items-center overflow-hidden bg-bg pt-28 pb-20"
        >
            <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                <div ref={glowRef} className="hero-glow" />
            </div>
            <div aria-hidden className="hero-grain pointer-events-none absolute inset-0" />

            <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
                <p data-hero-fade className="mb-10">
                    <span className="inline-flex items-center gap-2.5 rounded-full border border-border bg-bg-card/70 px-3.5 py-1.5 text-sm text-text-secondary backdrop-blur-sm">
                        <span className="relative flex size-2">
                            <span className="absolute inset-0 rounded-full bg-success opacity-60 motion-safe:animate-ping" />
                            <span className="relative size-2 rounded-full bg-success" />
                        </span>
                        {content.profile.availability}
                    </span>
                </p>

                {/* Keyed on the name so a content refresh remounts the heading
                    instead of React reconciling text that SplitText replaced. */}
                <h1
                    key={content.profile.name}
                    data-hero-name
                    className="type-narrow text-display text-text-primary"
                >
                    {content.profile.name}
                </h1>

                {/* Not animated: on phones this is the LCP element, and hiding it
                    until JS runs cost seconds of LCP on a throttled device. */}
                <p
                    className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-text-secondary"
                >
                    {content.profile.tagline}
                </p>

                <div className="mt-12 flex flex-col sm:flex-row gap-3">
                    <div data-hero-fade>
                        <Button href="#projects" onClick={scrollTo("#projects")}>
                            View my work
                        </Button>
                    </div>
                    <div data-hero-fade>
                        <Button variant="outline" href="#contact" onClick={scrollTo("#contact")}>
                            Get in touch
                        </Button>
                    </div>
                </div>

                <p data-hero-fade className="mt-16 text-sm text-text-muted">
                    {content.profile.title}
                    {content.profile.location && <>, based in {content.profile.location}</>}
                </p>
            </div>
        </section>
    );
}
