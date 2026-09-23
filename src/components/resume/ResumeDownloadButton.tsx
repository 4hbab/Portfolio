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
                ? "inline-block text-left text-base font-medium px-4 py-3 bg-accent text-accent-fg border border-accent hard-shadow disabled:opacity-60"
                : "block text-sm font-medium px-5 py-2 bg-accent text-accent-fg border border-accent hard-shadow transition-all duration-200 disabled:opacity-60"}
        >
            {busy ? "Preparing…" : "Resume"}
        </button>
    );
}
