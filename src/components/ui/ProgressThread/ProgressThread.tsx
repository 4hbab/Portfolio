"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/animation/reducedMotion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const SECTIONS = [
    { id: "about", label: "About" },
    { id: "experience", label: "Experience" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
];

/* Thread geometry, in SVG user units (1:1 with CSS px). The wave is kept to a
   few pixels so the line reads as strung by hand rather than as decoration. */
const WIDTH = 24;
const CX = WIDTH / 2;
const AMPLITUDE = 3;
const WAVELENGTH = 240;
const STEP = 6;

/* A section counts as reached when its top crosses 40% of the viewport — the
   same line the navbar uses to decide which link is active, so the two never
   disagree about where you are. */
const READ_LINE = 0.4;

const GRADIENT_ID = "progress-thread-gradient";

interface Mark {
    index: number;
    at: number;
}

function waveX(y: number) {
    return CX + AMPLITUDE * Math.sin((y / WAVELENGTH) * Math.PI * 2);
}

function wavePath(height: number) {
    const points: string[] = [];
    for (let y = 0; y < height; y += STEP) {
        points.push(`${waveX(y).toFixed(2)},${y}`);
    }
    points.push(`${waveX(height).toFixed(2)},${height}`);
    return `M${points.join(" L")}`;
}

/**
 * A fixed thread down the left gutter that draws itself as the page scrolls.
 * ScrollTrigger scrubs a single progress value with a little inertia, and every
 * frame derives the drawn length, the bead's position on the curve, and which
 * section it has reached from that one number — so the line, the bead and the
 * labels can never drift out of step with each other.
 *
 * Purely an indicator: aria-hidden and pointer-events: none.
 */
export default function ProgressThread() {
    const rootRef = useRef<HTMLDivElement>(null);
    const fillRef = useRef<SVGPathElement>(null);
    const headRef = useRef<SVGGElement>(null);
    const gradientRef = useRef<SVGLinearGradientElement>(null);
    const reducedMotion = useReducedMotion();

    const [height, setHeight] = useState(0);
    const [marks, setMarks] = useState<Mark[]>([]);
    const [active, setActive] = useState(-1);

    // The thread's own height sets the SVG's coordinate space.
    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => {
            setHeight(Math.round(entry.contentRect.height));
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // Where each section sits along the scroll range. Tied to ScrollTrigger's
    // refresh, which already fires on resize, load and late layout shift.
    // Only committed when a value moves: a new array every refresh would
    // rebuild the trigger below, and rebuilding it schedules another refresh.
    useEffect(() => {
        const measure = () => {
            const total = ScrollTrigger.maxScroll(window);
            const next =
                total <= 0
                    ? []
                    : SECTIONS.flatMap((section, index) => {
                          const el = document.getElementById(section.id);
                          if (!el) return [];
                          const top =
                              el.getBoundingClientRect().top +
                              window.scrollY -
                              window.innerHeight * READ_LINE;
                          return [{ index, at: Math.min(1, Math.max(0, top / total)) }];
                      });
            setMarks((prev) =>
                prev.length === next.length &&
                prev.every((m, i) => m.index === next[i].index && Math.abs(m.at - next[i].at) < 0.001)
                    ? prev
                    : next
            );
        };

        measure();
        ScrollTrigger.addEventListener("refresh", measure);
        return () => ScrollTrigger.removeEventListener("refresh", measure);
    }, []);

    useGSAP(
        () => {
            const fill = fillRef.current;
            const head = headRef.current;
            const gradient = gradientRef.current;
            const root = rootRef.current;
            if (!height || !fill || !head || !gradient || !root) return;

            const length = fill.getTotalLength();
            fill.style.strokeDasharray = `${length}`;

            const nodeY = marks.map((m) => m.at * height);
            const rings = marks.map((m) =>
                root.querySelector<SVGCircleElement>(`[data-thread-ring="${m.index}"]`)
            );

            // Pulses are for sections you scroll *into*. While the scrub is still
            // catching up to a restored scroll position on load, every node it
            // sweeps past would otherwise fire at once.
            let armed = false;
            gsap.delayedCall(1, () => {
                armed = true;
            });

            let reached = -1;
            const proxy = { p: 0 };

            const render = () => {
                const drawn = length * proxy.p;
                fill.style.strokeDashoffset = `${length - drawn}`;

                const point = fill.getPointAtLength(drawn);
                head.setAttribute("transform", `translate(${point.x} ${point.y})`);
                gradient.setAttribute("y2", `${Math.max(point.y, 1)}`);

                // Compared against the bead's actual y, not the progress value,
                // so a node lights exactly as the bead touches it.
                let next = -1;
                nodeY.forEach((y, i) => {
                    if (point.y >= y - 0.5) next = i;
                });
                if (next === reached) return;

                const ring = next >= 0 ? rings[next] : null;
                if (armed && next > reached && ring && !reducedMotion) {
                    gsap.fromTo(
                        ring,
                        { scale: 1, opacity: 0.8 },
                        {
                            scale: 3,
                            opacity: 0,
                            duration: 0.8,
                            ease: "power2.out",
                            transformOrigin: "50% 50%",
                        }
                    );
                }
                reached = next;
                setActive(next >= 0 ? marks[next].index : -1);
            };

            gsap.fromTo(
                proxy,
                { p: 0 },
                {
                    p: 1,
                    ease: "none",
                    onUpdate: render,
                    scrollTrigger: {
                        start: 0,
                        end: "max",
                        // A short trail behind the scrollbar is what makes it feel
                        // like a physical thread; with reduced motion it tracks 1:1.
                        scrub: reducedMotion ? true : 0.8,
                    },
                }
            );
            render();
        },
        { scope: rootRef, dependencies: [height, marks, reducedMotion] }
    );

    const d = height ? wavePath(height) : "";

    return (
        <div ref={rootRef} aria-hidden className="thread">
            {height > 0 && (
                <>
                    <svg
                        className="thread-svg"
                        width={WIDTH}
                        height={height}
                        viewBox={`0 0 ${WIDTH} ${height}`}
                    >
                        <defs>
                            {/* Faint at the top, full strength at the bead: the
                                drawn line reads as a trail behind it. */}
                            <linearGradient
                                ref={gradientRef}
                                id={GRADIENT_ID}
                                gradientUnits="userSpaceOnUse"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2={height}
                            >
                                <stop offset="0" style={{ stopColor: "var(--color-accent)", stopOpacity: 0.15 }} />
                                <stop offset="1" style={{ stopColor: "var(--color-accent)", stopOpacity: 1 }} />
                            </linearGradient>
                        </defs>

                        <path d={d} className="thread-track" />
                        <path ref={fillRef} d={d} className="thread-fill" stroke={`url(#${GRADIENT_ID})`} />

                        {marks.map((m) => {
                            const y = m.at * height;
                            const state =
                                m.index === active ? " is-active" : m.index < active ? " is-passed" : "";
                            return (
                                <g key={m.index} transform={`translate(${waveX(y)} ${y})`}>
                                    <circle data-thread-ring={m.index} r={4} className="thread-ring" />
                                    <circle r={3.5} className={`thread-node${state}`} />
                                </g>
                            );
                        })}

                        <g ref={headRef} className="thread-head">
                            <circle r={7} className="thread-halo" />
                            <circle r={2.75} className="thread-bead" />
                        </g>
                    </svg>

                    {marks.map((m) => {
                        const state =
                            m.index === active ? " is-active" : m.index < active ? " is-passed" : "";
                        return (
                            <span
                                key={m.index}
                                className={`thread-label${state}`}
                                style={{ top: `${m.at * height}px` }}
                            >
                                <span className="thread-label-num">
                                    {String(m.index + 1).padStart(2, "0")}
                                </span>
                                {SECTIONS[m.index].label}
                            </span>
                        );
                    })}
                </>
            )}
        </div>
    );
}
