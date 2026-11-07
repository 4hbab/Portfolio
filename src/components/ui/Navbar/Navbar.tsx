"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ResumeDownloadButton from "@/components/resume/ResumeDownloadButton";
import { Flip, gsap, ScrollTrigger, useGSAP } from "@/lib/animation/gsap";
import { duration, ease, media } from "@/lib/animation/presets";

const NAV_LINKS = [
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
];

/* Below this the bar never hides: there is nothing to make room for yet. */
const HIDE_AFTER_PX = 400;

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const navRef = useRef<HTMLElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const pillState = useRef<Flip.FlipState | null>(null);
    const keepVisible = useRef(false);

    // Read by the scroll handler, which outlives renders.
    useEffect(() => {
        keepVisible.current = mobileOpen;
    }, [mobileOpen]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Active section, read at the same 40% line the progress thread uses. The
    // pill's position is captured before the state change so Flip can slide it;
    // each link renders its own pill, and the shared data-flip-id is how Flip
    // knows the new one is the old one moved.
    useEffect(() => {
        const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(Boolean) as Element[];
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries.find((e) => e.isIntersecting);
                if (!entry) return;
                const pill = navRef.current?.querySelector("[data-nav-pill]");
                if (pill && window.matchMedia(media.motion).matches) pillState.current = Flip.getState(pill);
                setActiveSection(`#${entry.target.id}`);
            },
            { rootMargin: "-40% 0px -55% 0px" }
        );
        sections.forEach((s) => observer.observe(s));
        return () => observer.disconnect();
    }, []);

    useGSAP(
        () => {
            const state = pillState.current;
            pillState.current = null;
            const pill = navRef.current?.querySelector("[data-nav-pill]");
            if (!state || !pill) return;
            Flip.from(state, { targets: pill, duration: duration.fast, ease: ease.move });
        },
        { scope: navRef, dependencies: [activeSection] }
    );

    // Hide on the way down, return on the way up. Never with reduced motion,
    // while the mobile menu is open, or while focus is inside the bar.
    useGSAP(
        () => {
            const mm = gsap.matchMedia();
            mm.add(media.motion, () => {
                const nav = navRef.current;
                if (!nav) return;
                const show = gsap.quickTo(nav, "yPercent", { duration: duration.fast, ease: ease.out });
                ScrollTrigger.create({
                    start: 0,
                    end: "max",
                    onUpdate: (self) => {
                        const hide = self.direction === 1 && self.scroll() > HIDE_AFTER_PX && !keepVisible.current && !nav.contains(document.activeElement);
                        show(hide ? -100 : 0);
                    },
                });
                const onFocus = () => show(0);
                nav.addEventListener("focusin", onFocus);
                return () => nav.removeEventListener("focusin", onFocus);
            });
        },
        { scope: navRef }
    );

    useGSAP(
        () => {
            if (!mobileOpen || !mobileMenuRef.current) return;
            const mm = gsap.matchMedia();
            mm.add(media.motion, () => {
                gsap.from(mobileMenuRef.current!.querySelectorAll("[data-mobile-link]"), {
                    autoAlpha: 0,
                    y: -8,
                    duration: duration.fast,
                    ease: ease.out,
                    stagger: 0.05,
                });
            });
        },
        { dependencies: [mobileOpen], revertOnUpdate: true }
    );

    const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
        setMobileOpen(false);
    }, []);

    return (
        <nav
            ref={navRef}
            className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,padding] duration-300 ${
                scrolled || mobileOpen ? "border-b border-border bg-bg/85 py-3 backdrop-blur-md" : "border-b border-transparent bg-transparent py-5"
            }`}
        >
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
                <a
                    href="#"
                    className="font-display text-2xl font-semibold tracking-tight text-text-primary transition-colors hover:text-accent"
                    onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                >
                    SA<span className="text-accent">.</span>
                </a>

                <ul className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((link) => {
                        const active = activeSection === link.href;
                        return (
                            <li key={link.href} className="relative">
                                {active && <span data-nav-pill data-flip-id="nav-pill" aria-hidden className="absolute inset-0 rounded-full bg-bg-card ring-1 ring-border-strong" />}
                                <a
                                    href={link.href}
                                    onClick={(e) => handleNavClick(e, link.href)}
                                    aria-current={active ? "location" : undefined}
                                    className={`relative block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                        active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                                    }`}
                                >
                                    {link.label}
                                </a>
                            </li>
                        );
                    })}
                    <li className="ml-3">
                        <ResumeDownloadButton />
                    </li>
                </ul>

                <button
                    onClick={() => setMobileOpen((open) => !open)}
                    className="relative flex size-10 flex-col items-center justify-center gap-1.5 rounded-full border border-border md:hidden"
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-menu"
                >
                    <span className={`block h-0.5 w-4 bg-text-primary transition-transform duration-300 ${mobileOpen ? "translate-y-1 rotate-45" : ""}`} />
                    <span className={`block h-0.5 w-4 bg-text-primary transition-transform duration-300 ${mobileOpen ? "-translate-y-1 -rotate-45" : ""}`} />
                </button>
            </div>

            <div
                id="mobile-menu"
                ref={mobileMenuRef}
                hidden={!mobileOpen}
                className="border-t border-border md:hidden"
            >
                <ul className="flex flex-col gap-1 px-6 pb-6 pt-4">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <a
                                data-mobile-link
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                aria-current={activeSection === link.href ? "location" : undefined}
                                className={`block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                                    activeSection === link.href ? "bg-bg-card text-text-primary" : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
                                }`}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                    <li className="mt-2">
                        <ResumeDownloadButton mobile />
                    </li>
                </ul>
            </div>
        </nav>
    );
}
