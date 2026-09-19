"use client";

import { useState } from "react";
import { usePortfolio } from "@/components/PortfolioProvider";

export default function ResumeDownloadButton({ mobile = false }: { mobile?: boolean }) {
    const { content, revision } = usePortfolio();
    const [busy, setBusy] = useState(false);

    const download = async () => {
        setBusy(true);
        try {
            const { createResumeBlob } = await import("./generateResume");
            const blob = await createResumeBlob(content);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${content.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-resume-r${revision}.pdf`;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            id={mobile ? undefined : "resume"}
            type="button"
            data-mobile-link={mobile || undefined}
            onClick={() => void download()}
            disabled={busy}
            className={mobile
                ? "inline-block text-left text-lg font-bold uppercase tracking-wider px-4 py-3 bg-accent text-text-primary border-3 border-border hard-shadow disabled:opacity-60"
                : "block text-sm font-bold uppercase tracking-wider px-5 py-2 bg-accent text-text-primary border-3 border-border hard-shadow hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_var(--color-border)] transition-all duration-200 disabled:opacity-60"}
        >
            {busy ? "Preparing…" : "Resume"}
        </button>
    );
}
