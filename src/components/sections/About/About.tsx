"use client";

import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { ease } from "@/lib/animation/presets";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

const SKILLS = [
    "ColdFusion",
    "Node.js",
    "Vue.js",
    "Quasar",
    "React",
    "JavaScript",
    "TypeScript",
    "Python",
    "Docker",
    "MariaDB",
    "PostgreSQL",
    "FastAPI",
    "Tailwind CSS",
    "Git",
    "Prisma",
    "Next.js",
];

export default function About() {
    const rootRef = useRef<HTMLElement>(null);
    const reducedMotion = useReducedMotion();
    const [revealed, setRevealed] = useState(false);
    const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);

    useEffect(() => {
        if (reducedMotion) {
            setRevealed(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setRevealed(true);
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

        const skillElement = document.querySelector(
            `[data-skill-index="${index}"]`
        );
        if (!skillElement) return;

        if (isHovering) {
            gsap.to(skillElement, {
                y: -8,
                scale: 1.08,
                boxShadow: "8px 8px 0 var(--color-accent-pink), 16px 16px 0 rgba(0,0,0,0.1)",
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
                            className="absolute -left-6 top-0 h-1 bg-gradient-to-r from-accent-pink via-accent-pink to-transparent"
                            style={{ width: "0%" }}
                        />

                        {/* Bio Card 1 */}
                        <div data-bio className="overflow-hidden perspective">
                            <div className="group relative p-6 border-3 border-border bg-bg-card hard-shadow hover:border-accent-pink transition-colors duration-300">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-accent-pink/0 via-transparent to-accent/0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 blur-sm" />
                                <p className="text-text-secondary text-base md:text-lg leading-relaxed font-medium">
                                    I&apos;m a backend-focused software engineer and AI/ML enthusiast
                                    with a CS degree from the Islamic University of Technology. I thrive
                                    on designing scalable APIs, optimizing databases, and shipping
                                    reliable services for complex, production-grade systems.
                                </p>
                            </div>
                        </div>

                        {/* Bio Card 2 */}
                        <div data-bio className="overflow-hidden perspective">
                            <div className="group relative p-6 border-3 border-border bg-bg-card hard-shadow hover:border-accent-pink transition-colors duration-300">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-accent-pink/0 via-transparent to-accent/0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 blur-sm" />
                                <p className="text-text-secondary text-base md:text-lg leading-relaxed font-medium">
                                    Currently a Junior Software Engineer at WellDev, I build and
                                    maintain features within a 20-year-old legacy multi-tenant codebase
                                    for the InnoTix project — working with ColdFusion, Vue.js, Quasar,
                                    Node.js, MariaDB, and Docker across a globally distributed team.
                                </p>
                            </div>
                        </div>

                        {/* Bio Card 3 */}
                        <div data-bio className="overflow-hidden perspective">
                            <div className="group relative p-6 border-3 border-border bg-accent/30 hard-shadow hover:border-accent-pink hover:bg-accent/40 transition-all duration-300">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-accent-pink/20 via-transparent to-accent/10 opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10 blur-sm" />
                                <p className="text-text-secondary text-base md:text-lg leading-relaxed font-medium">
                                    I&apos;ve placed 1st Runners Up at the WellDev Hackathon &amp; CTF
                                    (plus 1st in the CTF competition), and I&apos;m actively
                                    pursuing DevOps and containerization skills through a #100DaysOfDevOps
                                    challenge.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="relative">
                        <h3
                            data-tech-heading
                            className="font-display text-2xl md:text-3xl font-black text-text-primary mb-8 uppercase tracking-wider"
                        >
                            Tech Stack
                            <span className="text-accent-pink animate-pulse ml-1">.</span>
                        </h3>

                        {/* Skills Grid */}
                        <div className="grid grid-cols-2 gap-4 md:gap-5">
                            {SKILLS.map((skill, i) => (
                                <div
                                    key={skill}
                                    data-skill
                                    data-skill-index={i}
                                    onMouseEnter={() => handleSkillHover(i, true)}
                                    onMouseLeave={() => handleSkillHover(i, false)}
                                    className="relative group cursor-pointer perspective"
                                >
                                    {/* Glow effect on hover */}
                                    <div className="absolute -inset-1 bg-gradient-to-br from-accent-pink/40 to-accent/20 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />

                                    {/* Main badge */}
                                    <div
                                        className={`
                                            px-4 py-3 border-3 border-border bg-bg-card text-text-primary text-xs md:text-sm font-black uppercase tracking-widest
                                            hard-shadow transition-all duration-300 relative overflow-hidden
                                            ${
                                                hoveredSkill === i
                                                    ? "border-accent-pink bg-accent"
                                                    : "border-border bg-bg-card"
                                            }
                                        `}
                                    >
                                        {/* Animated shine effect on hover */}
                                        <div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{
                                                transform: hoveredSkill === i ? "translateX(100%)" : "translateX(-100%)",
                                                transitionProperty: "transform",
                                                transitionDuration: "0.6s",
                                            }}
                                        />

                                        {/* Text with stagger effect */}
                                        <span className="relative block">{skill}</span>

                                        {/* Corner accent */}
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-accent-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Decorative element */}
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 border-2 border-border/20 rounded opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                    </div>
                </div>
            </div>
        </section>
    );
}