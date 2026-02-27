"use client";

import { ease } from "@/lib/animation/presets";
import { useReducedMotion } from "@/lib/animation/reducedMotion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

const NAV_LINKS = [
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const navRef = useRef<HTMLElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Intersection observer for active section highlight
    useEffect(() => {
        const sections = NAV_LINKS.map((l) =>
            document.querySelector(l.href)
        ).filter(Boolean) as Element[];

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(`#${entry.target.id}`);
                    }
                });
            },
            { rootMargin: "-40% 0px -55% 0px" }
        );

        sections.forEach((s) => observer.observe(s));
        return () => observer.disconnect();
    }, []);

    // Animate mobile menu links on open
    useGSAP(
        () => {
            if (!mobileOpen || reducedMotion || !mobileMenuRef.current) return;

            const links = mobileMenuRef.current.querySelectorAll("[data-mobile-link]");
            gsap.fromTo(
                links,
                { x: -60, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 0.4,
                    ease: ease.back,
                    stagger: 0.08,
                }
            );
        },
        { dependencies: [mobileOpen, reducedMotion] }
    );

    const handleNavClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
            e.preventDefault();
            const el = document.querySelector(href);
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                setMobileOpen(false);
            }
        },
        []
    );

    return (
        <nav
            ref={navRef}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-bg border-b-3 border-border py-3"
                    : "bg-transparent py-5"
                }`}
        >
            <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
                {/* Logo */}
                <a
                    href="#"
                    className="font-display text-2xl font-black tracking-tight text-text-primary hover:text-accent-pink transition-colors group"
                    onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                >
                    <span className="inline-block group-hover:-rotate-6 transition-transform duration-200">SA</span>
                    <span className="text-accent">.</span>
                </a>

                {/* Desktop Nav */}
                <ul className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className={`relative block px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-200 border-2 ${activeSection === link.href
                                        ? "bg-text-primary text-bg border-border"
                                        : "text-text-secondary border-transparent hover:bg-text-primary hover:text-bg hover:border-border"
                                    }`}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                    <li className="ml-2">
                        <a
                            href="https://drive.google.com/file/d/1GsrBek0_zv7JAkJEyjKHaur-dAF0s0HJ/view?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-bold uppercase tracking-wider px-5 py-2 bg-accent text-text-primary border-3 border-border hard-shadow hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_var(--color-border)] transition-all duration-200"
                        >
                            Resume
                        </a>
                    </li>
                </ul>

                {/* Mobile Hamburger */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 border-3 border-border bg-bg"
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileOpen}
                >
                    <span
                        className={`block w-5 h-[3px] bg-text-primary transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[9px]" : ""
                            }`}
                    />
                    <span
                        className={`block w-5 h-[3px] bg-text-primary transition-all duration-300 ${mobileOpen ? "opacity-0 scale-0" : ""
                            }`}
                    />
                    <span
                        className={`block w-5 h-[3px] bg-text-primary transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[9px]" : ""
                            }`}
                    />
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                ref={mobileMenuRef}
                className={`md:hidden overflow-hidden transition-all duration-300 border-t-3 border-border bg-bg ${mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-t-0"
                    }`}
            >
                <ul className="px-6 pb-6 pt-4 flex flex-col gap-2">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <a
                                data-mobile-link
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className={`block text-lg font-bold uppercase tracking-wider px-4 py-3 border-3 transition-all duration-200 ${activeSection === link.href
                                        ? "bg-text-primary text-bg border-border"
                                        : "text-text-primary border-transparent hover:border-border hover:bg-accent"
                                    }`}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                    <li>
                        <a
                            data-mobile-link
                            href="/resume.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-lg font-bold uppercase tracking-wider px-4 py-3 bg-accent text-text-primary border-3 border-border hard-shadow"
                        >
                            Resume
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
