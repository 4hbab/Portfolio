"use client";

import { useRef, useState } from "react";
import type { PortfolioProject } from "@/content/portfolio";
import { Flip, gsap, ScrollTrigger, useGSAP } from "@/lib/animation/gsap";
import { duration, ease, media } from "@/lib/animation/presets";

interface ProjectsClientProps {
    projects: PortfolioProject[];
    allTags: string[];
}

/**
 * One of the page's three bold moments: filtering re-flows the grid with Flip,
 * so kept cards glide to their new cells while others fade out and in. Every
 * card stays mounted, because Flip can only animate an element out if it is
 * still in the DOM when the new layout is measured. Filtered-out cards are hidden
 * by a plain `display: none` rule, not the `hidden` attribute: Tailwind's base
 * styles make `[hidden]` !important, which Flip's inline display cannot override
 * while it animates the card out.
 */
export default function ProjectsClient({ projects, allTags }: ProjectsClientProps) {
    const gridRef = useRef<HTMLUListElement>(null);
    const flipState = useRef<Flip.FlipState | null>(null);
    const hasFiltered = useRef(false);
    const [activeFilter, setActiveFilter] = useState("All");

    const matches = (project: PortfolioProject) => activeFilter === "All" || project.tags.includes(activeFilter);
    const visibleCount = projects.filter(matches).length;

    const handleFilter = (tag: string) => {
        if (tag === activeFilter) return;
        hasFiltered.current = true;
        // Measured before React commits, so Flip knows where everything was.
        const cards = gridRef.current?.querySelectorAll("[data-card]");
        if (cards && window.matchMedia(media.motion).matches) flipState.current = Flip.getState(cards);
        setActiveFilter(tag);
    };

    useGSAP(
        () => {
            if (!hasFiltered.current) return;
            const state = flipState.current;
            flipState.current = null;
            // Filtering changes the page height, so every trigger below the grid
            // (section reveals, the progress thread) has to re-measure.
            if (!state) {
                ScrollTrigger.refresh();
                return;
            }
            Flip.from(state, {
                duration: duration.base,
                ease: ease.move,
                absolute: true,
                nested: true,
                onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: duration.fast, ease: ease.out, delay: 0.15 }),
                // Once hidden, the inline fade is cleared: a later filter that
                // skips Flip (reduced motion) must not find the card still invisible.
                onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.94, duration: duration.fast, ease: ease.out, onComplete: () => void gsap.set(els, { clearProps: "opacity,visibility,transform" }) }),
                onComplete: () => ScrollTrigger.refresh(),
            });
        },
        { scope: gridRef, dependencies: [activeFilter] }
    );

    return (
        <div>
            <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter projects by technology">
                {["All", ...allTags].map((tag) => (
                    <button
                        key={tag}
                        onClick={() => handleFilter(tag)}
                        aria-pressed={activeFilter === tag}
                        className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-200 ${
                            activeFilter === tag
                                ? "border-accent bg-accent-subtle text-text-primary"
                                : "border-border text-text-secondary hover:border-border-strong hover:text-text-primary"
                        }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            <p className="sr-only" aria-live="polite">
                {visibleCount} {visibleCount === 1 ? "project" : "projects"} shown
            </p>

            <ul ref={gridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <li key={project.id} data-card data-filtered-out={matches(project) ? undefined : ""} className="project-slot">
                        <ProjectCard project={project} />
                    </li>
                ))}
            </ul>

            {visibleCount === 0 && <p className="py-12 text-center text-sm text-text-muted">No projects match this filter.</p>}
        </div>
    );
}

/* The spotlight follows the pointer through two custom properties; no tween
   and no React state, so moving over a card costs a style write per event. */
function trackSpotlight(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

function ProjectCard({ project }: { project: PortfolioProject }) {
    return (
        <article onPointerMove={trackSpotlight} className="project-card panel flex w-full flex-col p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
                <h3 className="text-h3 font-semibold text-text-primary">{project.title}</h3>
                {project.featured && (
                    <span className="shrink-0 rounded-full bg-accent-subtle px-2.5 py-1 text-xs font-medium text-accent">Featured</span>
                )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{project.description}</p>

            <ul className="mt-5 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-surface px-2.5 py-1 text-xs text-text-secondary">
                        {tag}
                    </li>
                ))}
            </ul>

            <div className="mt-auto flex items-center gap-5 pt-6 text-sm">
                {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-text-primary hover:text-accent transition-colors">
                        Live site<span className="sr-only"> for {project.title}</span>
                    </a>
                )}
                {project.repoUrl && (
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-text-primary hover:text-accent transition-colors">
                        Source<span className="sr-only"> for {project.title}</span>
                    </a>
                )}
                {project.stars > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-text-muted tabular-nums" aria-label={`${project.stars} GitHub stars`}>
                        <svg aria-hidden className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
                        </svg>
                        {project.stars}
                    </span>
                )}
            </div>
        </article>
    );
}
