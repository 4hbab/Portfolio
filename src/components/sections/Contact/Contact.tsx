"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button/Button";
import { usePortfolio } from "@/components/PortfolioProvider";
import { useLineReveal } from "@/lib/animation/useLineReveal";
import { useMagneticCursor } from "@/lib/animation/useMagneticCursor";

const COPIED_RESET_MS = 2000;

export default function Contact() {
    const { content } = usePortfolio();
    const rootRef = useRef<HTMLElement>(null);
    const [copied, setCopied] = useState(false);
    useLineReveal(rootRef);
    useMagneticCursor(rootRef, { strength: 10, radius: 120 });

    useEffect(() => {
        if (!copied) return;
        const reset = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
        return () => window.clearTimeout(reset);
    }, [copied]);

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(content.profile.email);
            setCopied(true);
        } catch {
            // Clipboard blocked: the mailto button beside it still works.
        }
    };

    return (
        <section id="contact" ref={rootRef} className="section relative overflow-hidden bg-bg-dark">
            <div aria-hidden className="contact-glow pointer-events-none absolute inset-x-0 bottom-0 h-2/3" />

            <div className="relative mx-auto max-w-6xl px-6">
                <h2 data-reveal-lines className="type-narrow max-w-4xl text-[clamp(2.75rem,1.2rem+5vw,5.5rem)] leading-[0.95] tracking-[-0.03em] text-text-primary">
                    Let&apos;s build something together
                </h2>

                <p data-reveal-lines className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
                    I&apos;m open to full-time roles, freelance projects and good technical conversations.
                    The fastest way to reach me is email.
                </p>

                <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div data-magnetic>
                        <Button href={`mailto:${content.profile.email}`}>Email me</Button>
                    </div>
                    <div data-magnetic>
                        <Button variant="outline" type="button" onClick={() => void copyEmail()}>
                            <span key={String(copied)} className="copy-label inline-flex items-center gap-2">
                                {copied ? (
                                    <>
                                        <svg aria-hidden className="size-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied
                                    </>
                                ) : (
                                    "Copy address"
                                )}
                            </span>
                        </Button>
                    </div>
                    <span className="sr-only" aria-live="polite">{copied ? "Email address copied" : ""}</span>
                </div>

                <ul className="mt-16 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-8">
                    {content.links.map((link) => (
                        <li key={link.id}>
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-secondary underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
