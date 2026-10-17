"use client";

import { useRef } from "react";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { usePortfolio } from "@/components/PortfolioProvider";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/animation/gsap";
import { duration, ease, media } from "@/lib/animation/presets";

/* Where the line sits and where the scrub reads it: an entry counts as reached
   when its top crosses this fraction of the viewport, the same line the fill's
   leading edge is at, so a dot lights exactly as the line arrives. */
const READ_LINE = "top 65%";

/**
 * One of the page's three bold moments. A straight rail runs down the centre
 * (down the left on phones) with entries alternating either side of it. The
 * rail is drawn with DrawSVG, scrubbed to scroll; as it reaches an entry the
 * dot lights, a connector draws out to the card, and the card slides in from
 * its own side. At rest (no JS, reduced motion) everything is drawn and lit.
 */
export default function Experience() {
    const { content } = usePortfolio();
    const rootRef = useRef<HTMLElement>(null);
    const railRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();
            mm.add({ motion: media.motion, wide: media.wide }, (context) => {
                const { motion, wide } = context.conditions as { motion: boolean; wide: boolean };
                if (!motion) return;
                gsap.fromTo(
                    "[data-rail-fill]",
                    { drawSVG: "0%" },
                    {
                        drawSVG: "100%",
                        ease: "none",
                        scrollTrigger: { trigger: railRef.current, start: READ_LINE, end: "bottom 65%", scrub: 0.6 },
                    }
                );

                gsap.utils.toArray<HTMLElement>("[data-exp-entry]").forEach((entry) => {
                    entry.classList.remove("is-reached");
                    ScrollTrigger.create({
                        trigger: entry,
                        start: READ_LINE,
                        toggleClass: { targets: entry, className: "is-reached" },
                    });
                    // Each card arrives from its own side of the rail; on a phone
                    // everything is on one side, so it rises instead.
                    const fromLeft = entry.dataset.side === "left";
                    gsap.from(entry.querySelectorAll("[data-exp-body], .exp-period"), {
                        autoAlpha: 0,
                        x: wide ? (fromLeft ? -48 : 48) : 0,
                        y: wide ? 0 : 24,
                        duration: duration.base,
                        ease: ease.out,
                        stagger: 0.08,
                        scrollTrigger: { trigger: entry, start: "top 85%", once: true },
                    });
                });

                // matchMedia reverts tweens on teardown but not class changes.
                return () => {
                    rootRef.current?.querySelectorAll("[data-exp-entry]").forEach((entry) => entry.classList.add("is-reached"));
                };
            });
        },
        // Content arrives twice (build snapshot, then the live fetch). Without
        // revertOnUpdate the second run's from() tweens read the first run's
        // hidden state as their end state and animate hidden to hidden.
        { scope: rootRef, dependencies: [content.experience], revertOnUpdate: true }
    );

    return (
        <section id="experience" ref={rootRef} className="section bg-surface">
            <div className="mx-auto max-w-6xl px-6">
                <SectionHeading title="Experience" subtitle="Where I've worked and what I've built." />

                <div className="relative">
                    <div ref={railRef} aria-hidden className="exp-rail">
                        {/* Stretched to the rail's height with a non-scaling stroke,
                            so the line is in the markup with no measuring and
                            DrawSVG still works in screen pixels. */}
                        <svg width="2" height="100%" viewBox="0 0 2 100" preserveAspectRatio="none" className="block overflow-visible">
                            <line x1="1" y1="0" x2="1" y2="100" vectorEffect="non-scaling-stroke" className="exp-rail-track" />
                            <line data-rail-fill x1="1" y1="0" x2="1" y2="100" vectorEffect="non-scaling-stroke" className="exp-rail-fill" />
                        </svg>
                    </div>

                    <ol className="space-y-10 md:space-y-12">
                        {content.experience.map((exp, index) => (
                            <li key={exp.id} data-exp-entry data-side={index % 2 === 0 ? "left" : "right"} className="exp-entry is-reached">
                                <span aria-hidden className="exp-dot" />
                                <span aria-hidden className="exp-connector" />
                                <p className="exp-period text-sm text-text-muted tabular-nums">{exp.period}</p>
                                <div data-exp-body className="exp-card panel">
                                    <h3 className="text-h3 font-semibold text-text-primary">{exp.role}</h3>
                                    <p className="mt-1 text-text-secondary">{exp.company}</p>
                                    <p className="mt-4 leading-relaxed text-text-secondary">{exp.description}</p>
                                    <ul className="mt-5 flex flex-wrap gap-2">
                                        {exp.tags.map((tag) => (
                                            <li key={tag} className="rounded-full bg-surface px-3 py-1 text-xs text-text-secondary">
                                                {tag}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
