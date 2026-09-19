"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { visibleContent, type PublicContentResponse } from "@/content/portfolio";
import { fetchPublishedSnapshot } from "@/lib/content";

interface PortfolioContextValue extends PublicContentResponse {
    refresh: () => Promise<void>;
    isRefreshing: boolean;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({
    initialSnapshot,
    children,
}: {
    initialSnapshot: PublicContentResponse;
    children: React.ReactNode;
}) {
    const [snapshot, setSnapshot] = useState(initialSnapshot);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const next = await fetchPublishedSnapshot();
            setSnapshot((current) => next.revision > current.revision ? next : current);
        } catch {
            // The verified build-time snapshot remains the outage fallback.
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
        const onFocus = () => void refresh();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [refresh]);

    const value = useMemo(() => ({
        ...snapshot,
        content: visibleContent(snapshot.content),
        refresh,
        isRefreshing,
    }), [snapshot, refresh, isRefreshing]);

    return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
    const value = useContext(PortfolioContext);
    if (!value) throw new Error("usePortfolio must be used inside PortfolioProvider");
    return value;
}

