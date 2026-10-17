"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import { bucketFor, cursorLens, FIELD, rippleBand, type Ripple } from "@/lib/animation/signalField";
import { media } from "@/lib/animation/presets";

export interface HeroFieldHandle {
    /** Sends a pulse out from the centre of `element`. */
    pulseFrom: (element: Element) => void;
}

const MAX_RIPPLES = 6;

/**
 * The hero's one ambient element: a canvas dot grid that signal pulses ripple
 * through. Pulses fire on their own every few seconds, from the name as it
 * lands, and wherever the visitor clicks or taps; the pointer brightens the
 * dots around it. With reduced motion it is a still grid. It only runs while
 * the hero is on screen and the tab is visible, and starts once the browser is
 * idle so it never competes with hydration.
 */
export default function HeroField({ host, ref }: { host: React.RefObject<HTMLElement | null>; ref?: React.Ref<HeroFieldHandle> }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ripples = useRef<Ripple[]>([]);
    const clock = useRef(() => performance.now() / 1000);

    useImperativeHandle(ref, () => ({
        pulseFrom: (element) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const box = canvas.getBoundingClientRect();
            const target = element.getBoundingClientRect();
            addRipple(ripples.current, {
                x: target.left + target.width * 0.3 - box.left,
                y: target.top + target.height / 2 - box.top,
                born: clock.current(),
            });
        },
    }), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const root = host.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !root || !ctx) return;

        const accent = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#6FD3B4";
        const fills = Array.from({ length: FIELD.buckets }, (_, i) => withAlpha(accent, FIELD.baseAlpha + (i / (FIELD.buckets - 1)) * (0.95 - FIELD.baseAlpha)));
        const motion = window.matchMedia(media.motion);

        let width = 0;
        let height = 0;
        let dots = new Float32Array(0);
        // The resting grid never changes between resizes, so it is drawn once
        // here and copied in each frame; only lit dots are drawn per frame.
        const base = document.createElement("canvas");
        const baseCtx = base.getContext("2d");
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const pitch = width < 640 ? FIELD.spacingCompact : FIELD.spacing;
            const cols = Math.ceil(width / pitch) + 1;
            const rows = Math.ceil(height / pitch) + 1;
            // Centred so the grid's margins match on both sides.
            const ox = (width - (cols - 1) * pitch) / 2;
            const oy = (height - (rows - 1) * pitch) / 2;
            dots = new Float32Array(cols * rows * 2);
            const rest = new Path2D();
            for (let r = 0, i = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++, i += 2) {
                    dots[i] = ox + c * pitch;
                    dots[i + 1] = oy + r * pitch;
                    rest.rect(dots[i] - FIELD.dot, dots[i + 1] - FIELD.dot, FIELD.dot * 2, FIELD.dot * 2);
                }
            }
            base.width = canvas.width;
            base.height = canvas.height;
            if (baseCtx) {
                baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                baseCtx.fillStyle = fills[0];
                baseCtx.fill(rest);
            }
            lit = true;
        };

        let cursor: { x: number; y: number } | null = null;
        let lastPulse = clock.current();
        // Whether the canvas currently shows anything beyond the resting grid;
        // while it does not and nothing is live, frames skip drawing entirely.
        let lit = true;

        const draw = (now: number) => {
            const live = ripples.current.filter((ripple) => now - ripple.born < FIELD.life);
            ripples.current = live;
            if (!live.length && !cursor && !lit) return;

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(base, 0, 0, width, height);
            lit = live.length > 0 || cursor !== null;
            if (!lit) return;
            const paths = fills.map(() => new Path2D());

            for (let i = 0; i < dots.length; i += 2) {
                let x = dots[i];
                let y = dots[i + 1];
                let glow = 0;

                for (const ripple of live) {
                    const dx = x - ripple.x;
                    const dy = y - ripple.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    const band = rippleBand(dist, now - ripple.born);
                    if (band === 0) continue;
                    glow += band;
                    x += (dx / dist) * band * FIELD.push;
                    y += (dy / dist) * band * FIELD.push;
                }

                if (cursor) {
                    const dx = x - cursor.x;
                    const dy = y - cursor.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    const lens = cursorLens(dist);
                    if (lens > 0) {
                        glow += lens * FIELD.cursorLift;
                        x += (dx / dist) * lens * FIELD.cursorPush;
                        y += (dy / dist) * lens * FIELD.cursorPush;
                    }
                }

                // Unlit dots are already on the base layer.
                const bucket = bucketFor(glow);
                if (bucket === 0) continue;
                const size = FIELD.dot * (1 + Math.min(glow, 1) * FIELD.dotGrowth);
                paths[bucket].rect(x - size, y - size, size * 2, size * 2);
            }

            for (let i = 1; i < paths.length; i++) {
                ctx.fillStyle = fills[i];
                ctx.fill(paths[i]);
            }
        };

        let frame = 0;
        let visible = true;
        const tick = () => {
            const now = clock.current();
            if (!cursor && now - lastPulse > FIELD.autoEvery) {
                lastPulse = now;
                addRipple(ripples.current, { x: width * (0.35 + Math.random() * 0.6), y: height * (0.15 + Math.random() * 0.7), born: now });
            }
            draw(now);
            frame = requestAnimationFrame(tick);
        };
        const start = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            if (motion.matches && visible && document.visibilityState === "visible") frame = requestAnimationFrame(tick);
            else draw(clock.current());
        };

        const local = (event: PointerEvent) => {
            const box = canvas.getBoundingClientRect();
            return { x: event.clientX - box.left, y: event.clientY - box.top };
        };
        const onMove = (event: PointerEvent) => {
            if (event.pointerType === "mouse") cursor = local(event);
        };
        const onLeave = () => {
            cursor = null;
        };
        const onDown = (event: PointerEvent) => {
            if (!motion.matches) return;
            lastPulse = clock.current();
            addRipple(ripples.current, { ...local(event), born: lastPulse });
        };

        const resizer = new ResizeObserver(() => {
            resize();
            if (!frame) draw(clock.current());
        });
        const watcher = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            start();
        });

        // Starts after load, once the browser is idle: the grid is decoration
        // and must not add to hydration's long tasks. Until then the canvas is
        // simply empty.
        const begin = () => {
            resize();
            resizer.observe(canvas);
            watcher.observe(canvas);
            root.addEventListener("pointermove", onMove);
            root.addEventListener("pointerleave", onLeave);
            root.addEventListener("pointerdown", onDown);
            document.addEventListener("visibilitychange", start);
            motion.addEventListener("change", start);
            canvas.dataset.ready = "";
            start();
        };
        // Safari has no requestIdleCallback; the DOM types claim it always exists.
        const onIdle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
        let idle = 0;
        const schedule = () => {
            idle = onIdle ? onIdle(begin, { timeout: 2000 }) : window.setTimeout(begin, 300);
        };
        if (document.readyState === "complete") schedule();
        else window.addEventListener("load", schedule, { once: true });

        return () => {
            window.removeEventListener("load", schedule);
            if (onIdle) window.cancelIdleCallback(idle);
            else window.clearTimeout(idle);
            cancelAnimationFrame(frame);
            resizer.disconnect();
            watcher.disconnect();
            root.removeEventListener("pointermove", onMove);
            root.removeEventListener("pointerleave", onLeave);
            root.removeEventListener("pointerdown", onDown);
            document.removeEventListener("visibilitychange", start);
            motion.removeEventListener("change", start);
        };
    }, [host]);

    return <canvas ref={canvasRef} aria-hidden className="hero-field pointer-events-none absolute inset-0 size-full" />;
}

function addRipple(list: Ripple[], ripple: Ripple) {
    list.push(ripple);
    if (list.length > MAX_RIPPLES) list.shift();
}

/** "#6FD3B4" → "rgb(111 211 180 / a)". The accent token is a 6-digit hex. */
function withAlpha(hex: string, alpha: number) {
    const value = parseInt(hex.replace("#", ""), 16);
    return `rgb(${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255} / ${alpha.toFixed(3)})`;
}
