"use client";

import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { ease } from "@/lib/animation/presets";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePortfolio } from "@/components/PortfolioProvider";

gsap.registerPlugin(useGSAP);

export default function About() {
    const { content } = usePortfolio();
    // Categories render as their own rows, but hover and the staggered reveal
    // still address one flat sequence, so each badge keeps its global index.
    const skillCategories = useMemo(() => {
        let index = 0;
        return content.skillGroups.map((group) => ({
            id: group.id,
            name: group.name,
            skills: group.skills.map((skill) => ({ skill, index: index++ })),
        }));
    }, [content.skillGroups]);
    const rootRef = useRef<HTMLElement>(null);
    const reducedMotion = useReducedMotion();
    const [intersected, setIntersected] = useState(false);
    const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);
    // Derived rather than set from inside the effect: with reduced motion there
    // is nothing to wait for, so there is no state transition to schedule.
    const revealed = reducedMotion || intersected;

    useEffect(() => {
        if (reducedMotion) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIntersected(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (rootRef.current) observer.observe(rootRef.current);
        return () => observer.disconnect();
    }, [reducedMotion]);

    // Orchestrated reveal: bio cards with clip-path + rotation
    useGSAP(
        () => {
            if (reducedMotion || !revealed) return;

            gsap.from("[data-bio]", {
                clipPath: "inset(0% 0 100% 0)",
                opacity: 0,
                rotationX: -15,
                y: 40,
                duration: 0.9,
                ease: ease.snap,
                stagger: {
                    amount: 0.3,
                    from: "start",
                },
            });
        },
        { scope: rootRef, dependencies: [reducedMotion, revealed] }
    );

    // Accent line animation
    useGSAP(
        () => {
            if (reducedMotion || !revealed) return;

            gsap.from("[data-accent-line]", {
                width: "0%",
                opacity: 0,
                duration: 0.8,
                delay: 0.2,
                ease: "power2.out",
            });
        },
        { scope: rootRef, dependencies: [reducedMotion, revealed] }
    );

    // Skill badges: staggered pop with rotation and scale
    useGSAP(
        () => {
            if (reducedMotion || !revealed) return;

            gsap.from("[data-skill]", {
                opacity: 0,
                scale: 0.4,
                rotation: -12,
                y: 30,
                duration: 0.7,
                ease: "elastic.out(1, 0.6)",
                stagger: {
                    amount: 0.4,
                    from: "start",
                    grid: [4, 4],
                },
            });

            gsap.from("[data-skill-group]", {
                opacity: 0,
                x: -24,
                duration: 0.6,
                ease: "power2.out",
                stagger: 0.08,
            });
        },
        { scope: rootRef, dependencies: [reducedMotion, revealed] }
    );

    // Tech stack heading with split entrance
    useGSAP(
        () => {
            if (reducedMotion || !revealed) return;

            gsap.from("[data-tech-heading]", {
                opacity: 0,
                y: -30,
                duration: 0.8,
                delay: 0.1,
                ease: "power3.out",
            });
        },
        { scope: rootRef, dependencies: [reducedMotion, revealed] }
    );

    const handleSkillHover = (index: number, isHovering: boolean) => {
        if (reducedMotion) return;
        setHoveredSkill(isHovering ? index : null);

        // Scoped to this section: a document-wide lookup would animate any
        // matching element another section happened to render.
        const skillElement = rootRef.current?.querySelector(
            `[data-skill-index="${index}"]`
        );
        if (!skillElement) return;

        if (isHovering) {
            gsap.to(skillElement, {
                y: -8,
                scale: 1.08,
                boxShadow: "8px 8px 0 var(--color-accent), 16px 16px 0 rgba(0,0,0,0.1)",
                rotation: 2,
                duration: 0.3,
                ease: "power2.out",
            });
        } else {
            gsap.to(skillElement, {
                y: 0,
                scale: 1,
                boxShadow: "4px 4px 0 var(--color-border)",
                rotation: 0,
                duration: 0.3,
                ease: "power2.out",
            });
        }
    };

    return (
        <section
            id="about"
            ref={rootRef}
            className="section relative z-10 bg-bg overflow-hidden"
        >
            {/* Animated background grid overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(90deg, var(--color-border) 1px, transparent 1px),
                            linear-gradient(180deg, var(--color-border) 1px, transparent 1px)
                        `,
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>

            <div className="mx-auto max-w-6xl px-6 relative">
                <SectionHeading
                    title="About Me"
                    subtitle="A bit about my background and the tools I work with."
                />

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Bio Section */}
                    <div className="space-y-5 relative">
                        {/* Decorative accent line */}
                        <div
                            data-accent-line
                            className="absolute -left-6 top-0 h-1 bg-gradient-to-r from-accent via-accent to-transparent"
                            style={{ width: "0%" }}
                        />
                        {content.bio.map((entry) => (
                            <div key={entry.id} data-bio className="overflow-hidden perspective">
                                <div className={`group relative p-6 border border-border hard-shadow hover:border-accent transition-colors duration-300 ${entry.highlighted ? "bg-accent-subtle" : "bg-bg-card"}`}>
                                    <p className="text-text-secondary text-base md:text-lg leading-relaxed font-medium">
                                        {entry.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Skills Section */}
                    <div className="relative">
                        <h3
                            data-tech-heading
                            className="font-display text-lg font-semibold text-text-primary mb-8 tracking-tight"
                        >
                            Tech Stack
                            <span className="text-accent animate-pulse ml-1">.</span>
                        </h3>

                        {/* Skills by category */}
                        <div className="space-y-8">
                            {skillCategories.map((group) => (
                                <div key={group.id}>
                                    <h4
                                        data-skill-group
                                        className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-text-muted mb-3"
                                    >
                                        {group.name}
                                        <span aria-hidden className="h-0.5 flex-1 bg-border/40" />
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {group.skills.map(({ skill, index }) => (
                                            <div
                                                key={skill}
                                                data-skill
                                                data-skill-index={index}
                                                onMouseEnter={() => handleSkillHover(index, true)}
                                                onMouseLeave={() => handleSkillHover(index, false)}
                                                className="relative group cursor-pointer perspective"
                                            >
                                                {/* Glow effect on hover */}
                                                <div className="absolute -inset-1 bg-gradient-to-br from-accent/40 to-accent/20 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />

                                                {/* Main badge */}
                                                <div
                                                    className={`
                                                        px-3 py-2 rounded-md border border-border bg-bg-card text-text-secondary font-mono text-xs
                                                        hard-shadow transition-all duration-300 relative overflow-hidden
                                                        ${
                                                            hoveredSkill === index
                                                                ? "border-accent bg-accent-subtle text-text-primary"
                                                                : "border-border bg-bg-card"
                                                        }
                                                    `}
                                                >
                                                    {/* Animated shine effect on hover */}
                                                    <div
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                        style={{
                                                            transform: hoveredSkill === index ? "translateX(100%)" : "translateX(-100%)",
                                                            transitionProperty: "transform",
                                                            transitionDuration: "0.6s",
                                                        }}
                                                    />

                                                    {/* Text with stagger effect */}
                                                    <span className="relative block">{skill}</span>

                                                    {/* Corner accent */}
                                                    <div className="absolute top-0 right-0 w-2 h-2 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Decorative element */}
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 border border-border/20 rounded opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                    </div>
                </div>
            </div>
        </section>
    );
}
