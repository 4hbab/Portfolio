"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { usePortfolio } from "@/components/PortfolioProvider";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { ease, duration } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Experience() {
    const { content } = usePortfolio();
    const rootRef = useRef<HTMLElement>(null);
    const lineRef = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();

    useGSAP(
        () => {
            if (reducedMotion) return;

            // Timeline line draws down as user scrolls
            if (lineRef.current) {
                gsap.fromTo(
                    lineRef.current,
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        ease: "none",
                        scrollTrigger: {
                            trigger: rootRef.current,
                            start: "top 60%",
                            end: "bottom 80%",
                            scrub: 1,
                        },
                    }
                );
            }

            // Cards slide in from alternating sides with rotation
            const cards = gsap.utils.toArray<HTMLElement>("[data-exp-card]");
            cards.forEach((card, i) => {
                const fromLeft = i % 2 === 0;
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 80%",
                        once: true,
                    },
                    x: fromLeft ? -100 : 100,
                    opacity: 0,
                    rotation: fromLeft ? -4 : 4,
                    duration: duration.base,
                    ease: ease.backGentle,
                });
            });

            // Timeline dots pulse in
            gsap.from("[data-exp-dot]", {
                scrollTrigger: {
                    trigger: rootRef.current,
                    start: "top 70%",
                    once: true,
                },
                scale: 0,
                opacity: 0,
                duration: 0.6,
                ease: ease.elastic,
                stagger: 0.2,
            });
        },
        { scope: rootRef, dependencies: [reducedMotion] }
    );

    return (
        <section id="experience" ref={rootRef} className="section bg-surface">
            <div className="mx-auto max-w-4xl px-6">
                <SectionHeading
                    title="Experience"
                    subtitle="Where I've worked and what I've built."
                    accent="var(--color-surface)"
                />

                <div className="relative">
                    {/* Timeline line — draws on scroll */}
                    <div
                        ref={lineRef}
                        className="absolute left-0 md:left-10 top-0 bottom-0 w-px bg-border origin-top"
                    />

                    <div className="space-y-10">
                        {content.experience.map((exp) => (
                            <div key={exp.id} data-exp-card className="relative pl-10 md:pl-24">
                                {/* Timeline dot — square brutalist */}
                                <div
                                    data-exp-dot
                                    className="absolute left-0 md:left-10 top-5 w-2 h-2 -translate-x-[3.5px] rounded-full bg-accent"
                                />

                                <div className="border border-border bg-bg-card p-6 md:p-8 hard-shadow-lg transition-all duration-200">
                                                                        <span className="inline-block font-mono text-xs text-text-muted mb-4">
                                        {exp.period}
                                    </span>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                        <h3 className="font-display text-lg md:text-xl font-semibold text-text-primary tracking-tight">
                                            {exp.role}
                                        </h3>
                                    </div>
                                    <p className="text-text-secondary text-sm mb-4">
                                        {exp.company}
                                    </p>
                                    <p className="text-text-secondary text-base leading-relaxed mb-4">
                                        {exp.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {exp.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2.5 py-1 rounded-md bg-surface text-text-secondary font-mono text-xs"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
