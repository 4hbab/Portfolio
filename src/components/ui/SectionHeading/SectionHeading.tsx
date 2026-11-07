"use client";

import { useRef } from "react";
import { useLineReveal } from "@/lib/animation/useLineReveal";

interface SectionHeadingProps {
    title: string;
    subtitle?: string;
}

export default function SectionHeading({ title, subtitle }: SectionHeadingProps) {
    const ref = useRef<HTMLDivElement>(null);
    useLineReveal(ref);

    return (
        <div ref={ref} className="mb-14 md:mb-20 max-w-3xl">
            <h2 key={title} data-reveal-lines className="text-h2 font-semibold text-text-primary">
                {title}
            </h2>
            {subtitle && (
                <p key={subtitle} data-reveal-lines className="mt-5 text-lg text-text-secondary">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
