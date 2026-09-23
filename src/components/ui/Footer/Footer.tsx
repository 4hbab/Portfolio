"use client";

import { usePortfolio } from "@/components/PortfolioProvider";

export default function Footer() {
    const { content } = usePortfolio();
    const marqueeText = ` ${content.profile.name.toUpperCase()} • ${content.profile.title.toUpperCase()} • AI/ML ENTHUSIAST • BUILDER • `;
    const repeated = marqueeText.repeat(6);

    return (
        <footer className="border-t border-border bg-bg">
            {/* Marquee band */}
            <div className="marquee-wrap bg-surface border-b border-border py-2.5 overflow-hidden">
                <div className="marquee-content">
                    <span className="font-mono text-xs uppercase tracking-[0.06em] text-text-muted whitespace-nowrap">
                        {repeated}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.06em] text-text-muted whitespace-nowrap">
                        {repeated}
                    </span>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-text-secondary text-sm">
                    &copy; {new Date().getFullYear()} {content.profile.name}. Built with Next.js &amp; GSAP.
                </p>
                <div className="flex items-center gap-3">
                    {content.links.map((link) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 flex items-center justify-center border border-border bg-bg text-text-primary hover:bg-text-primary hover:text-bg transition-all duration-200 hard-shadow"
                            aria-label={link.label}
                        >
                            <span className="font-semibold text-xs" aria-hidden="true">{link.label.slice(0, 2).toUpperCase()}</span>
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
