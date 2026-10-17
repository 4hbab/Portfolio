"use client";

import { usePortfolio } from "@/components/PortfolioProvider";

export default function Footer() {
    const { content } = usePortfolio();

    return (
        <footer className="border-t border-border bg-bg">
            <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-text-muted text-sm">
                    &copy; {new Date().getFullYear()} {content.profile.name}. Built with Next.js and GSAP.
                </p>
                <ul className="flex items-center gap-5">
                    {content.links.map((link) => (
                        <li key={link.id}>
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-text-secondary hover:text-accent transition-colors duration-200"
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </footer>
    );
}
