"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateSession, LAST_ACTIVITY_KEY, type ExpiryReason, type SessionState } from "./session";

/* Activity is written to localStorage so every open studio tab shares one idle
   clock: working in one tab keeps the others signed in. Writes are throttled
   because pointer and key events arrive far faster than the clock needs. */
const WRITE_THROTTLE_MS = 15_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

function readActivity(): number | null {
    try {
        const stored = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
        return Number.isFinite(stored) && stored > 0 ? stored : null;
    } catch {
        return null;
    }
}

function writeActivity(at: number) {
    try {
        window.localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
    } catch {
        // Storage blocked: the idle clock then runs from sign-in, which errs on
        // the side of signing out sooner.
    }
}

/**
 * Ticks once a second and calls `onExpire` once when the idle or absolute
 * limit passes. Returning to a tab is deliberately not activity: coming back
 * after an hour away should find the session over, not renewed.
 */
export function useSessionTimeout(signedInAt: number | null, onExpire: (reason: ExpiryReason) => void) {
    const [state, setState] = useState<SessionState>({ kind: "active" });
    const onExpireRef = useRef(onExpire);
    const lastWrite = useRef(0);
    const expired = useRef(false);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    const stayActive = useCallback(() => {
        const now = Date.now();
        lastWrite.current = now;
        writeActivity(now);
    }, []);

    useEffect(() => {
        if (readActivity() === null) stayActive();

        const onActivity = () => {
            if (Date.now() - lastWrite.current >= WRITE_THROTTLE_MS) stayActive();
        };
        for (const name of ACTIVITY_EVENTS) window.addEventListener(name, onActivity, { passive: true });

        const tick = () => {
            const next = evaluateSession({ now: Date.now(), lastActivity: readActivity(), signedInAt });
            setState((current) => (sameState(current, next) ? current : next));
            if (next.kind === "expired" && !expired.current) {
                expired.current = true;
                onExpireRef.current(next.reason);
            }
        };
        tick();
        const interval = window.setInterval(tick, 1000);

        return () => {
            window.clearInterval(interval);
            for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity);
        };
    }, [signedInAt, stayActive]);

    return { state, stayActive };
}

/** Compared to the second, so the countdown re-renders once a second and no more. */
function sameState(a: SessionState, b: SessionState) {
    if (a.kind !== b.kind) return false;
    if (a.kind === "warning" && b.kind === "warning") {
        return a.reason === b.reason && Math.ceil(a.remainingMs / 1000) === Math.ceil(b.remainingMs / 1000);
    }
    return a.kind === "active" || (a.kind === "expired" && b.kind === "expired" && a.reason === b.reason);
}
