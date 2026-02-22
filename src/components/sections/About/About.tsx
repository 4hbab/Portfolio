"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { ease } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP);

const SKILLS = [
    "ColdFusion",
    "Node.js",
    "React",
    "Vue.js",
    "FastAPI",
    "Spring Boot",
    "JavaScript",
    "TypeScript",
    "Docker",
    "MariaDB",
    "Git",
    "Next.js",
];

export default function About() {
    const rootRef = useRef<HTMLElement>(null);
    const reducedMotion = useReducedMotion();
    const [revealed, setRevealed] = useState(false);

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

    // Bio paragraphs — GSAP clip-path animation
    useGSAP(
        () => {
            if (reducedMotion || !revealed) return;

            gsap.from("[data-bio]", {
                clipPath: "inset(100% 0 0 0)",
                opacity: 0,
                duration: 0.8,
                ease: ease.snap,
                stagger: 0.15,
            });
        },
        { scope: rootRef, dependencies: [reducedMotion, revealed] }
    );

    return (
        <section
            id="about"
            ref={rootRef}
            className="section relative z-10 bg-bg"
        >
            <div className="mx-auto max-w-6xl px-6">
                <SectionHeading
                    title="About Me"
                    subtitle="A bit about my background and the tools I work with."
                />

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Bio */}
                    <div className="space-y-5">
                        <div data-bio className="overflow-hidden">
                            <p className="text-text-secondary text-base md:text-lg leading-relaxed p-6 border-3 border-border bg-bg-card hard-shadow">
                                I&apos;m a backend-focused software engineer with a passion for building
                                large-scale, production-ready applications. I thrive on designing
                                scalable APIs, optimizing database queries, and shipping reliable services.
                            </p>
                        </div>
                        <div data-bio className="overflow-hidden">
                            <p className="text-text-secondary text-base md:text-lg leading-relaxed p-6 border-3 border-border bg-bg-card hard-shadow">
                                Currently at WellDev, I develop backend services for a
                                travel-management platform — working with ColdFusion, Node.js,
                                VueJS, MariaDB, and Docker while contributing to CI/CD pipelines.
                            </p>
                        </div>
                        <div data-bio className="overflow-hidden">
                            <p className="text-text-secondary text-base md:text-lg leading-relaxed p-6 border-3 border-border bg-accent/30">
                                I&apos;ve placed in multiple hackathons including 2nd at WellDev
                                Hackathon x CTF 2025 and 3rd at WellDev x Tessi RAG Hackathon.
                                I love tackling challenging problems under pressure.
                            </p>
                        </div>
                    </div>

                    {/* Skills Grid */}
                    <div>
                        <h3
                            className="font-display text-2xl font-black text-text-primary mb-6 uppercase tracking-wider transition-all duration-700 ease-out"
                            style={
                                revealed
                                    ? { opacity: 1, transform: "translateX(0)" }
                                    : { opacity: 0, transform: "translateX(-60px)" }
                            }
                        >
                            Tech Stack
                            <span className="text-accent-pink">.</span>
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {SKILLS.map((skill, i) => (
                                <span
                                    key={skill}
                                    className="px-5 py-3 border-3 border-border bg-bg-card text-text-primary text-sm font-bold uppercase tracking-wider hard-shadow hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--color-border)] hover:bg-accent hover:rotate-[-2deg] cursor-default"
                                    style={{
                                        transitionProperty: "opacity, transform, background-color, box-shadow",
                                        transitionDuration: "600ms, 600ms, 200ms, 200ms",
                                        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                                        transitionDelay: revealed ? `${400 + i * 60}ms` : "0ms",
                                        opacity: revealed ? 1 : 0,
                                        transform: revealed
                                            ? "translateY(0) scale(1) rotate(0deg)"
                                            : "translateY(20px) scale(0.5) rotate(-10deg)",
                                    }}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
