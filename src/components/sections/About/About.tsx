"use client";

import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { usePortfolio } from "@/components/PortfolioProvider";

/* A quiet section on purpose: the motion budget is spent on the hero, the
   experience timeline and the project filter. Here the copy does the work. */
export default function About() {
    const { content } = usePortfolio();

    return (
        <section id="about" className="section relative z-10 bg-bg">
            <div className="mx-auto max-w-6xl px-6">
                <SectionHeading
                    title="About me"
                    subtitle="A bit about my background and the tools I work with."
                />

                <div className="grid gap-14 md:grid-cols-[1.15fr_1fr] md:gap-20">
                    <div className="space-y-6">
                        {content.bio.map((entry) => (
                            <p
                                key={entry.id}
                                className={
                                    entry.highlighted
                                        ? "border-l-2 border-accent pl-5 text-lg md:text-xl leading-relaxed text-text-primary"
                                        : "text-base md:text-lg leading-relaxed text-text-secondary"
                                }
                            >
                                {entry.text}
                            </p>
                        ))}
                    </div>

                    <div className="space-y-9">
                        {content.skillGroups.map((group) => (
                            <div key={group.id}>
                                <h3 className="mb-3 text-sm font-medium text-text-muted">{group.name}</h3>
                                <ul className="flex flex-wrap gap-2">
                                    {group.skills.map((skill) => (
                                        <li
                                            key={skill}
                                            className="rounded-full border border-border bg-bg-card px-3.5 py-1.5 text-sm text-text-secondary transition-colors duration-200 hover:border-accent/60 hover:text-text-primary"
                                        >
                                            {skill}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
