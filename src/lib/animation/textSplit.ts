"use client";

import { useRef, useEffect } from "react";

/**
 * Splits a text node into individually-wrapped <span> elements
 * for character-level or word-level GSAP stagger animations.
 *
 * @param mode  - "chars" | "words"
 * @returns ref to attach to the text container, and a getter for the split spans
 */
export function useTextSplit(mode: "chars" | "words" = "chars") {
    const containerRef = useRef<HTMLElement>(null);
    const spansRef = useRef<HTMLSpanElement[]>([]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const text = el.textContent || "";
        el.innerHTML = "";

        const units = mode === "chars" ? text.split("") : text.split(/\s+/);
        const spans: HTMLSpanElement[] = [];

        units.forEach((unit, i) => {
            const span = document.createElement("span");
            span.style.display = "inline-block";
            span.style.willChange = "transform, opacity";
            span.textContent = unit;
            // Preserve whitespace between words
            if (mode === "words" && i < units.length - 1) {
                span.style.marginRight = "0.3em";
            }
            // Preserve actual spaces for char mode
            if (mode === "chars" && unit === " ") {
                span.style.width = "0.3em";
            }
            el.appendChild(span);
            spans.push(span);
        });

        spansRef.current = spans;
    }, [mode]);

    return { containerRef, getSpans: () => spansRef.current };
}
