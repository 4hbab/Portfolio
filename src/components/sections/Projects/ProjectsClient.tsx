"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { PortfolioProject } from "@/content/portfolio";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { duration, ease } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface ProjectsClientProps {
    projects: PortfolioProject[];
    allTags: string[];
}

export default function ProjectsClient({
    projects,
    allTags,
}: ProjectsClientProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();
    const [activeFilter, setActiveFilter] = useState("All");

    const filteredProjects =
        activeFilter === "All"
            ? projects
            : projects.filter((p) => p.tags.includes(activeFilter));

    // Runs after React has committed the new card set. Animating from inside
    // the click handler tweened the cards that were about to be replaced, so
    // the cards that actually appeared were the ones that never animated.
    const hasFiltered = useRef(false);
    useGSAP(
        () => {
            if (reducedMotion || !hasFiltered.current) return;

            gsap.fromTo(
                "[data-card]",
                { opacity: 0, y: 30, scale: 0.9, rotation: -3 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotation: 0,
                    duration: duration.fast,
                    ease: ease.back,
                    stagger: 0.08,
                }
            );
        },
        { scope: gridRef, dependencies: [activeFilter, reducedMotion] }
    );

    const handleFilter = (tag: string) => {
        hasFiltered.current = true;
        setActiveFilter(tag);
    };

    // Scroll-triggered initial reveal
    useGSAP(
        () => {
            if (reducedMotion) return;

            const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
            if (!cards.length) return;

            gsap.set(cards, { opacity: 0, y: 40, scale: 0.85, rotation: -5 });

            ScrollTrigger.batch(cards, {
                start: "top 90%",
                once: true,
                onEnter: (batch) => {
                    gsap.to(batch, {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        duration: duration.base,
                        ease: ease.backGentle,
                        stagger: 0.1,
                    });
                },
            });

        },
        { scope: rootRef, dependencies: [reducedMotion] }
    );

    // Web fonts and late layout shift can leave ScrollTrigger measuring against
    // stale positions, stranding cards at opacity 0. Re-measuring fires the
    // batch for whatever is genuinely in view. The previous fallback instead
    // forced *every* card visible after 1.5s, which cancelled the scroll reveal
    // for anything below the fold, and left its timer running after unmount.
    useEffect(() => {
        if (reducedMotion) return;
        const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);
        return () => window.clearTimeout(refresh);
    }, [reducedMotion]);

    return (
        <div ref={rootRef}>
            {/* Filter Chips */}
            <div
                className="flex flex-wrap justify-center gap-2 mb-12"
                role="group"
                aria-label="Filter projects by technology"
            >
                {["All", ...allTags].map((tag) => (
                    <button
                        key={tag}
                        onClick={() => handleFilter(tag)}
                        className={`px-4 py-2 text-xs font-medium border transition-all duration-200 ${activeFilter === tag
                                ? "bg-text-primary text-bg border-border hard-shadow"
                                : "bg-bg-card text-text-secondary border-border hover:bg-surface hover:text-text-primary"
                            }`}
                        aria-pressed={activeFilter === tag}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* Project Cards Grid */}
            <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <p className="text-center text-text-muted py-12 text-sm">
                    No projects match this filter.
                </p>
            )}
        </div>
    );
}

/* ── Project Card ── */

interface ProjectCardProps {
    project: PortfolioProject;
}

function ProjectCard({ project }: ProjectCardProps) {
    return (
        <div
            data-card
            className="group border border-border bg-bg-card overflow-hidden hard-shadow-lg transition-all duration-200"
        >
            {/* Card Header — solid accent color */}
            <div className="h-44 relative overflow-hidden bg-surface border-b border-border">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)",
                }} />

                {project.featured && (
                    <span className="absolute top-3 right-3 px-3 py-1.5 bg-accent text-accent-fg font-mono text-xs rounded-md">
                        Featured
                    </span>
                )}
                <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="font-display text-lg font-semibold text-text-primary tracking-tight">
                        {project.title}
                    </h3>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    {project.description}
                </p>

                {/* Star count (only if > 0) */}
                {project.stars > 0 && (
                    <div className="flex items-center gap-1.5 text-text-muted font-mono text-xs mb-4">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
                        </svg>
                        {project.stars}
                    </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-2.5 py-1 rounded-md bg-surface text-text-secondary font-mono text-xs"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-4 pt-3 border-t border-border">
                    {project.liveUrl && (
                        <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-text-primary text-sm font-medium hover:text-accent transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Live
                        </a>
                    )}
                    {project.repoUrl && (
                        <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-text-primary text-sm font-medium hover:text-accent transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Code
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
