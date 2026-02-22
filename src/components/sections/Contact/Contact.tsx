"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Button from "@/components/ui/Button/Button";
import { socials } from "@/content/socials";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { ease, duration } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Contact() {
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
                {/* Giant heading */}
                <div className="mb-12">
                    <h2 className="font-display font-black leading-[0.9] tracking-tighter">
                        <span
                            data-contact-word-1
                            className="block text-6xl md:text-8xl lg:text-9xl text-text-inverse"
                        >
                            LET&apos;S
                        </span>
                        <span
                            data-contact-word-2
                            className="block text-7xl md:text-9xl lg:text-[10rem] text-stroke-white"
                        >
                            TALK
                        </span>
                        <span
                            data-contact-dot
                            className="inline-block w-5 h-5 md:w-8 md:h-8 bg-accent-pink ml-2 align-middle"
                        />
                    </h2>
                </div>

                <div
                    data-contact-card
                    className="border-3 border-text-inverse/30 bg-text-inverse/5 p-8 md:p-12 mb-10 overflow-hidden"
                >
                    <p className="text-text-inverse/80 text-base md:text-lg leading-relaxed mb-8 font-medium">
                        I&apos;m always open to discussing new projects, creative ideas, or
                        opportunities to be part of something great. Whether it&apos;s a
                        freelance project, a full-time position, or just a tech conversation —
                        don&apos;t hesitate to reach out.
                    </p>

                    <Button
                        href="mailto:hello@example.com"
                        className="bg-accent-pink text-text-inverse border-text-inverse/30 hover:bg-accent hover:text-text-primary"
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
                    {socials.map((s) => (
                        <a
                            data-social
                            key={s.platform}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-12 h-12 flex items-center justify-center border-3 border-text-inverse/30 text-text-inverse hover:bg-accent hover:text-text-primary hover:border-accent transition-all duration-200 hover:-translate-y-1 hover:rotate-[-6deg]"
                            aria-label={s.platform}
                        >
                            <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d={s.icon} />
                            </svg>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
