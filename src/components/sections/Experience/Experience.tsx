"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { experiences } from "@/content/experience";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { ease, duration } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Experience() {
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
                    accent="var(--color-accent-pink)"
                />

                <div className="relative">
                    {/* Timeline line — draws on scroll */}
                    <div
                        ref={lineRef}
                        className="absolute left-0 md:left-10 top-0 bottom-0 w-1 bg-border origin-top"
                    />

                    <div className="space-y-10">
                        {experiences.map((exp, i) => (
                            <div key={exp.id} data-exp-card className="relative pl-10 md:pl-24">
                                {/* Timeline dot — square brutalist */}
                                <div
                                    data-exp-dot
                                    className="absolute left-0 md:left-10 top-4 w-5 h-5 -translate-x-[10px] border-3 border-border bg-accent rotate-45"
                                />

                                <div className="border-3 border-border bg-bg-card p-6 md:p-8 hard-shadow-lg hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_var(--color-border)] transition-all duration-200">
                                    {/* Period as a rotated badge */}
                                    <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 border-2 border-border bg-accent mb-4 rotate-[-1deg]">
                                        {exp.period}
                                    </span>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                        <h3 className="font-display text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight">
                                            {exp.role}
                                        </h3>
                                    </div>
                                    <p className="text-accent-pink font-bold text-sm uppercase tracking-wider mb-4">
                                        {exp.company}
                                    </p>
                                    <p className="text-text-secondary text-base leading-relaxed mb-4">
                                        {exp.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {exp.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 border-2 border-border bg-bg text-text-primary text-xs font-bold uppercase tracking-wider"
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
