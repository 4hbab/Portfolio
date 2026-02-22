"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { ease } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface SectionHeadingProps {
    title: string;
    subtitle?: string;
    align?: "left" | "center";
    accent?: string;
}

export default function SectionHeading({
    title,
    subtitle,
    align = "center",
    accent,
}: SectionHeadingProps) {
    const ref = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();

    useGSAP(
        () => {
            if (reducedMotion) return;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ref.current,
                    start: "top 85%",
                    once: true,
                },
            });

            // Label slides in with rotation
            tl.from("[data-heading-label]", {
                opacity: 0,
                x: -40,
                rotation: -8,
                duration: 0.6,
                ease: ease.back,
            });

            // Title clips in
            tl.from(
                "[data-heading-title]",
                {
                    clipPath: "inset(0 100% 0 0)",
                    duration: 0.8,
                    ease: ease.snap,
                },
                "-=0.3"
            );

            // Underline draws
            tl.from(
                "[data-heading-line]",
                {
                    scaleX: 0,
                    duration: 0.6,
                    ease: ease.snap,
                },
                "-=0.4"
            );

            // Subtitle fades
            if (subtitle) {
                tl.from(
                    "[data-heading-sub]",
                    {
                        opacity: 0,
                        y: 20,
                        duration: 0.5,
                        ease: ease.out,
                    },
                    "-=0.2"
                );
            }
        },
        { scope: ref, dependencies: [reducedMotion, subtitle] }
    );

    return (
        <div
            ref={ref}
            className={`mb-16 md:mb-20 ${align === "center" ? "text-center" : "text-left"} relative`}
        >
            {/* Rotated accent label */}
            <span
                data-heading-label
                className="inline-block font-display text-xs font-bold uppercase tracking-[0.3em] px-4 py-2 border-3 border-border mb-6"
                style={{
                    transform: "rotate(-2deg)",
                    background: accent || "var(--color-accent)",
                }}
            >
                {title}
            </span>

            {/* Giant title */}
            <h2
                data-heading-title
                className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-text-primary leading-[0.95] tracking-tight"
            >
                {title}
            </h2>

            {/* Thick underline */}
            <div
                data-heading-line
                className={`h-1.5 bg-border mt-4 origin-left ${align === "center" ? "mx-auto w-32" : "w-24"}`}
            />

            {subtitle && (
                <p
                    data-heading-sub
                    className={`text-text-secondary text-base md:text-lg mt-6 font-medium max-w-2xl ${align === "center" ? "mx-auto" : ""}`}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
}
