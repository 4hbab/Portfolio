"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Button from "@/components/ui/Button/Button";
import { usePortfolio } from "@/components/PortfolioProvider";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { ease } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Contact() {
    const { content } = usePortfolio();
    const rootRef = useRef<HTMLElement>(null);
    const reducedMotion = useReducedMotion();

    useGSAP(
        () => {
            if (reducedMotion) return;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: rootRef.current,
                    start: "top 70%",
                    once: true,
                },
            });

            // "LET'S" slides from left
            tl.from("[data-contact-word-1]", {
                x: -200,
                opacity: 0,
                rotation: -8,
                duration: 0.8,
                ease: ease.back,
            });

            // "TALK" slides from right
            tl.from(
                "[data-contact-word-2]",
                {
                    x: 200,
                    opacity: 0,
                    rotation: 8,
                    duration: 0.8,
                    ease: ease.back,
                },
                "-=0.5"
            );

            // Decorative dot bounces in
            tl.from(
                "[data-contact-dot]",
                {
                    scale: 0,
                    opacity: 0,
                    duration: 0.6,
                    ease: ease.elastic,
                },
                "-=0.3"
            );

            // Content card clips in
            tl.from(
                "[data-contact-card]",
                {
                    clipPath: "inset(100% 0 0 0)",
                    opacity: 0,
                    duration: 0.7,
                    ease: ease.snap,
                },
                "-=0.3"
            );

            // Social buttons spread outward
            tl.from(
                "[data-social]",
                {
                    scale: 0,
                    opacity: 0,
                    rotation: -20,
                    duration: 0.6,
                    ease: ease.elastic,
                    stagger: 0.08,
                },
                "-=0.3"
            );

            // Animated diagonal stripes
            gsap.to("[data-stripe-bg]", {
                backgroundPosition: "40px 40px",
                duration: 3,
                ease: "none",
                repeat: -1,
            });
        },
        { scope: rootRef, dependencies: [reducedMotion] }
    );

    return (
        <section id="contact" ref={rootRef} className="section section-inverted relative overflow-hidden">
            {/* Animated diagonal stripes background */}
            <div
                data-stripe-bg
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
                    backgroundSize: "28px 28px",
                }}
            />

            <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
                <div className="mb-12">
                    <h2 className="font-display font-semibold leading-[0.9] tracking-tight">
                        <span
                            data-contact-word-1
                            className="block text-3xl md:text-4xl text-text-inverse"
                        >
                            Let&apos;s
                        </span>
                        <span
                            data-contact-word-2
                            className="block text-3xl md:text-4xl text-text-inverse/50"
                        >
                            talk
                        </span>
                        <span
                            data-contact-dot
                            className="inline-block w-2 h-2 bg-accent ml-2 align-middle"
                        />
                    </h2>
                </div>

                <div
                    data-contact-card
                    className="border border-text-inverse/30 bg-text-inverse/5 p-8 md:p-12 mb-10 overflow-hidden"
                >
                    <p className="text-text-inverse/80 text-base md:text-lg leading-relaxed mb-8 font-medium">
                        I&apos;m always open to discussing new projects, creative ideas, or
                        opportunities to be part of something great. Whether it&apos;s a
                        freelance project, a full-time position, or just a tech conversation —
                        don&apos;t hesitate to reach out.
                    </p>

                    <Button
                        href={`mailto:${content.profile.email}`}
                        className="bg-accent text-accent-fg border-accent hover:bg-accent-hover hover:text-accent-fg hover:border-accent-hover"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        Say Hello
                    </Button>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-4">
                    {content.links.map((link) => (
                        <a
                            data-social
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-12 h-12 flex items-center justify-center border border-text-inverse/30 text-text-inverse hover:bg-accent hover:text-accent-fg hover:border-accent transition-all duration-200"
                            aria-label={link.label}
                        >
                            <span className="font-semibold text-sm" aria-hidden="true">{link.label.slice(0, 2).toUpperCase()}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
