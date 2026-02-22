"use client";

import { useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { projects, allTags, type Project } from "@/content/projects";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { duration, ease } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Projects() {
    const rootRef = useRef<HTMLElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();
    const [activeFilter, setActiveFilter] = useState("All");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredProjects =
        activeFilter === "All"
            ? projects
            : projects.filter((p) => p.tags.includes(activeFilter));

    const handleFilter = useCallback(
        (tag: string) => {
            setActiveFilter(tag);
            setExpandedId(null);

            // Animate cards on filter change
            if (!reducedMotion && gridRef.current) {
                const cards = gridRef.current.querySelectorAll("[data-card]");
                gsap.fromTo(
                    cards,
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
            }
        },
        [reducedMotion]
    );

    const toggleExpand = useCallback((id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    }, []);

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

            // Fallback
            setTimeout(() => {
                gsap.to(cards, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotation: 0,
                    duration: duration.fast,
                    ease: ease.out,
                    overwrite: "auto",
                });
            }, 1500);
        },
        { scope: rootRef, dependencies: [reducedMotion] }
    );

    return (
        <section id="projects" ref={rootRef} className="section bg-bg stripe-bg">
            <div className="mx-auto max-w-6xl px-6">
                <SectionHeading
                    title="Projects"
                    subtitle="A selection of things I've built."
                    accent="var(--color-accent-blue)"
                />

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
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-3 transition-all duration-200 ${activeFilter === tag
                                    ? "bg-text-primary text-bg border-border hard-shadow"
                                    : "bg-bg-card text-text-secondary border-border hover:bg-accent hover:text-text-primary hover:-translate-y-0.5"
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
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isExpanded={expandedId === project.id}
                            onToggle={() => toggleExpand(project.id)}
                        />
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <p className="text-center text-text-muted py-12 font-bold uppercase tracking-wider">
                        No projects match this filter.
                    </p>
                )}
            </div>
        </section>
    );
}

/* ── Project Card ── */

interface ProjectCardProps {
    project: Project;
    isExpanded: boolean;
    onToggle: () => void;
}

function ProjectCard({ project, isExpanded, onToggle }: ProjectCardProps) {
    return (
        <div
            data-card
            className={`group border-3 border-border bg-bg-card overflow-hidden hard-shadow-lg transition-all duration-200 hover:-translate-y-2 hover:-translate-x-1 hover:shadow-[10px_10px_0_var(--color-border)] ${isExpanded ? "sm:col-span-2 lg:col-span-3" : ""
                }`}
        >
            {/* Card Header — solid accent color */}
            <div className="h-44 relative overflow-hidden bg-accent-blue/15 border-b-3 border-border">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)",
                }} />

                {project.featured && (
                    <span className="absolute top-3 right-3 px-3 py-1.5 bg-accent text-text-primary text-xs font-black uppercase tracking-widest border-3 border-border rotate-[-3deg] hard-shadow">
                        Featured
                    </span>
                )}
                <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="font-display text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight">
                        {project.title}
                    </h3>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    {project.description}
                </p>

                {/* Expandable Case Study */}
                {project.longDescription && (
                    <>
                        <button
                            onClick={onToggle}
                            className="text-text-primary text-sm font-bold uppercase tracking-wider hover:text-accent-pink transition-colors mb-4 flex items-center gap-2 border-b-2 border-border pb-1"
                            aria-expanded={isExpanded}
                        >
                            {isExpanded ? "Show less" : "Read case study"}
                            <svg
                                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-40 opacity-100 mb-4" : "max-h-0 opacity-0"
                                }`}
                        >
                            <p className="text-text-secondary text-sm leading-relaxed border-l-4 border-accent-pink pl-4">
                                {project.longDescription}
                            </p>
                        </div>
                    </>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-2.5 py-1 border-2 border-border bg-surface text-text-primary text-xs font-bold uppercase tracking-wider"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-4 pt-3 border-t-3 border-border">
                    {project.liveUrl && (
                        <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-text-primary text-sm font-bold uppercase tracking-wider hover:text-accent-pink transition-colors"
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
                            className="flex items-center gap-1.5 text-text-primary text-sm font-bold uppercase tracking-wider hover:text-accent-pink transition-colors"
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
