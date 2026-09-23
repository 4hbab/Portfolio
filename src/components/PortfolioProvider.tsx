"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { visibleContent, type PublicContentResponse } from "@/content/portfolio";
import { ContentSchemaError, fetchPublishedRevision, fetchPublishedSnapshot } from "@/lib/content";

interface PortfolioContextValue extends PublicContentResponse {
    /** Resolves to the revision now on screen, so callers need not read stale state. */
    refresh: (force?: boolean) => Promise<number>;
    isRefreshing: boolean;
    snapshotError: string | null;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

/** A focus event is a weak signal, so refreshes are throttled to one a minute. */
const REFRESH_INTERVAL_MS = 60_000;

export function PortfolioProvider({
    initialSnapshot,
    children,
}: {
    initialSnapshot: PublicContentResponse;
    children: React.ReactNode;
}) {
    const [snapshot, setSnapshot] = useState(initialSnapshot);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [snapshotError, setSnapshotError] = useState<string | null>(null);
    const currentRef = useRef(initialSnapshot);
    const lastAttemptRef = useRef(0);

    const refresh = useCallback(async (force = false): Promise<number> => {
        const now = Date.now();
        if (!force && now - lastAttemptRef.current < REFRESH_INTERVAL_MS) return currentRef.current.revision;
        lastAttemptRef.current = now;
        setIsRefreshing(true);
        try {
            // Pull the full payload only once the revision proves it is worth it.
            const latest = await fetchPublishedRevision();
            if (latest === null || latest <= currentRef.current.revision) return currentRef.current.revision;

            const next = await fetchPublishedSnapshot();
            if (next.revision > currentRef.current.revision) {
                currentRef.current = next;
                setSnapshot(next);
            }
            setSnapshotError(null);
        } catch (caught) {
            // The verified build-time snapshot remains the outage fallback, but a
            // snapshot the schema rejects is a defect and has to be visible.
            if (caught instanceof ContentSchemaError) {
                console.error(caught.message);
                setSnapshotError(caught.message);
            } else {
                console.error("Could not refresh published content.", caught);
            }
        } finally {
            setIsRefreshing(false);
        }
        return currentRef.current.revision;
    }, []);

    useEffect(() => {
        void refresh(true);
        const onFocus = () => void refresh();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [refresh]);

    const value = useMemo(() => ({
        ...snapshot,
        content: visibleContent(snapshot.content),
        refresh,
        isRefreshing,
        snapshotError,
    }), [snapshot, refresh, isRefreshing, snapshotError]);

    return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
    const value = useContext(PortfolioContext);
    if (!value) throw new Error("usePortfolio must be used inside PortfolioProvider");
    return value;
}
