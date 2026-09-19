"use client";

import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { usePortfolio } from "@/components/PortfolioProvider";
import ProjectsClient from "./ProjectsClient";

export default function Projects() {
    const { content } = usePortfolio();
    const allTags = Array.from(new Set(content.projects.flatMap((project) => project.tags))).sort();

    return (
        <section id="projects" className="section bg-bg stripe-bg">
            <div className="mx-auto max-w-6xl px-6">
                <SectionHeading
                    title="Projects"
                    subtitle="A selection of things I've built."
                    accent="var(--color-accent-blue)"
                />

                <ProjectsClient projects={content.projects} allTags={allTags} />
            </div>
        </section>
    );
}
