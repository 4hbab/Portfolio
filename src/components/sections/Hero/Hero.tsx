"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Button from "@/components/ui/Button/Button";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { ease } from "@/lib/animation/presets";

gsap.registerPlugin(useGSAP);

const NAME_CHARS = "Sakif Ahbab".split("").map((char, i) => ({
    char: char === " " ? "\u00A0" : char,
    key: `${char}-${i}`,
}));

export default function Hero() {
    const rootRef = useRef<HTMLElement>(null);
    const reducedMotion = useReducedMotion();

    useGSAP(
        () => {
            if (reducedMotion) return;

            const tl = gsap.timeline({ delay: 0.3 });

            // Badge pops in
            tl.from("[data-badge]", {
                opacity: 0,
                scale: 0.5,
                rotation: -12,
                duration: 0.6,
                ease: ease.elastic,
            });

            // Name characters reveal with clip-path
            tl.fromTo(
                "[data-char]",
                {
                    clipPath: "inset(0 100% 0 0)",
                    opacity: 0,
                },
                {
                    clipPath: "inset(0 0% 0 0)",
                    opacity: 1,
                    duration: 0.5,
                    ease: ease.snap,
                    stagger: 0.04,
                },
                "-=0.2"
            );

            // Subtitle words animate in
            tl.from("[data-subtitle] [data-word]", {
                y: 60,
                opacity: 0,
                rotation: 4,
                duration: 0.6,
                ease: ease.back,
                stagger: 0.06,
            }, "-=0.3");

            // Buttons expand in
            tl.from("[data-cta]", {
                scaleX: 0,
                opacity: 0,
                duration: 0.5,
                ease: ease.back,
                stagger: 0.12,
            }, "-=0.3");

            // Decorative elements rotate continuously
            gsap.to("[data-deco-spin]", {
                rotation: 360,
                duration: 12,
                ease: "none",
                repeat: -1,
            });

            // Decorative shapes float
            gsap.to("[data-deco-float-1]", {
                y: -25,
                x: 15,
                rotation: 10,
                duration: 4,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
            });
            gsap.to("[data-deco-float-2]", {
                y: 20,
                x: -20,
                rotation: -8,
                duration: 5,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
            });


        },
        { scope: rootRef, dependencies: [reducedMotion] }
    );

    // Split subtitle into words for animation
    const subtitleWords = "Backend focused engineer & AI/ML enthusiast building large scale production ready applications.".split(" ");

    return (
        <section
            ref={rootRef}
            className="relative z-0 min-h-screen flex items-center justify-center overflow-hidden bg-bg stripe-bg pt-24"
        >
            {/* Decorative geometric shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large bordered circle */}
                <div
                    data-deco-float-1
                    className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full border-4 border-border opacity-10"
                />
                {/* Spinning star */}
                <div
                    data-deco-spin
                    className="absolute top-[15%] right-[10%] font-display text-8xl font-black text-accent opacity-20 select-none"
                >
                    ✦
                </div>
                {/* Floating square */}
                <div
                    data-deco-float-2
                    className="absolute bottom-[20%] left-[5%] w-24 h-24 border-4 border-border opacity-10 rotate-12"
                />
                {/* Arrow decoration */}
                <div
                    data-deco-float-1
                    className="absolute top-[60%] right-[8%] font-display text-7xl font-black text-accent-pink opacity-15 select-none"
                >
                    →
                </div>
                {/* Large rotated rectangle */}
                <div className="absolute -bottom-10 -left-10 w-60 h-40 border-4 border-border opacity-5 rotate-[-8deg]" />
            </div>

            <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                {/* Available badge */}
                <div data-badge className="mb-8 inline-block">
                    <span className="inline-flex items-center gap-3 px-5 py-2.5 border-3 border-border bg-bg hard-shadow font-bold text-xs uppercase tracking-[0.2em] text-text-primary">
                        <span className="w-3 h-3 bg-accent-green border-2 border-border bounce-soft" />
                        Available for work
                    </span>
                </div>

                {/* Giant name — rendered as JSX spans to avoid hydration mismatch */}
                <div className="mb-4">
                    <p className="font-display text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-text-secondary mb-3">
                        Hi, I&apos;m
                    </p>
                    <h1 className="font-display text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-black leading-[0.85] tracking-tighter text-text-primary">
                        {NAME_CHARS.map(({ char, key }) => (
                            <span
                                key={key}
                                data-char
                                className="inline-block"
                                style={{ willChange: "transform, opacity, clip-path" }}
                            >
                                {char}
                            </span>
                        ))}
                    </h1>
                </div>

                {/* Subtitle with word-level animation */}
                <p
                    data-subtitle
                    className="text-text-secondary text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed font-medium overflow-hidden"
                >
                    {subtitleWords.map((word, i) => (
                        <span
                            key={i}
                            data-word
                            className="inline-block mr-[0.3em]"
                        >
                            {word}
                        </span>
                    ))}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div data-cta className="origin-left">
                        <Button
                            href="#projects"
                            onClick={(e) => {
                                e.preventDefault();
                                document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            View My Work
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </Button>
                    </div>
                    <div data-cta className="origin-left">
                        <Button
                            variant="outline"
                            href="#contact"
                            onClick={(e) => {
                                e.preventDefault();
                                document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Get In Touch
                        </Button>
                    </div>
                </div>

            </div>
        </section>
    );
}
