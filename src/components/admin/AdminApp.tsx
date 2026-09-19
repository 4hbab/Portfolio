"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeTotpQrCode } from "@/lib/supabase/mfa";
import { portfolioContentSchema, type PortfolioContent } from "@/content/portfolio";

type SectionKey = "profile" | "bio" | "experience" | "education" | "skillGroups" | "achievements" | "projects" | "links" | "faqs" | "revisions";
type ListKey = Exclude<SectionKey, "profile" | "revisions">;
type DraftState = { content: PortfolioContent; version: number; baseRevision: number; updatedAt: string };
type Revision = { revision: number; published_at: string };

const SECTIONS: { key: SectionKey; label: string }[] = [
    { key: "profile", label: "Profile" }, { key: "bio", label: "Biography" },
    { key: "experience", label: "Experience" }, { key: "education", label: "Education" },
    { key: "skillGroups", label: "Skills" }, { key: "achievements", label: "Achievements" },
    { key: "projects", label: "Projects" }, { key: "links", label: "Contact links" },
    { key: "faqs", label: "Chatbot FAQs" }, { key: "revisions", label: "History" },
];
const portfolioHome = process.env.NODE_ENV === "production" ? "/Portfolio/" : "/";

const FIELD_MAP: Record<ListKey, { key: string; label: string; multiline?: boolean; list?: boolean }[]> = {
    bio: [{ key: "text", label: "Paragraph", multiline: true }, { key: "highlighted", label: "Highlighted" }],
    experience: [{ key: "role", label: "Role" }, { key: "company", label: "Company" }, { key: "period", label: "Period" }, { key: "description", label: "Description", multiline: true }, { key: "tags", label: "Technologies", list: true }],
    education: [{ key: "degree", label: "Degree" }, { key: "institution", label: "Institution" }, { key: "period", label: "Period" }, { key: "details", label: "Details", multiline: true }],
    skillGroups: [{ key: "name", label: "Group" }, { key: "skills", label: "Skills", list: true }],
    achievements: [{ key: "title", label: "Achievement" }, { key: "details", label: "Details", multiline: true }],
    projects: [{ key: "title", label: "Project" }, { key: "description", label: "Description", multiline: true }, { key: "tags", label: "Technologies", list: true }, { key: "language", label: "Primary language" }, { key: "repoUrl", label: "Repository URL" }, { key: "liveUrl", label: "Live URL" }, { key: "featured", label: "Featured" }],
    links: [{ key: "label", label: "Label" }, { key: "url", label: "URL" }, { key: "kind", label: "Kind" }],
    faqs: [{ key: "question", label: "Question" }, { key: "answer", label: "Answer", multiline: true }],
};

const EMPTY_ITEMS: Record<ListKey, Record<string, unknown>> = {
    bio: { text: "", highlighted: false },
    experience: { role: "", company: "", period: "", description: "", tags: [] },
    education: { degree: "", institution: "", period: "", details: "" },
    skillGroups: { name: "", skills: [] },
    achievements: { title: "", details: "" },
    projects: { title: "", description: "", tags: [], language: null, stars: 0, repoUrl: "https://github.com/", featured: false },
    links: { label: "", url: "https://", kind: "other" },
    faqs: { question: "", answer: "" },
};

export default function AdminApp({ fallback }: { fallback: PortfolioContent }) {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const [session, setSession] = useState<Session | null>(null);
    const [aal2, setAal2] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        const { data: { session: next } } = await supabase.auth.getSession();
        setSession(next);
        if (next) {
            const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            setAal2(data?.currentLevel === "aal2");
        } else setAal2(false);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        void checkAuth();
        const { data } = supabase.auth.onAuthStateChange(() => { setTimeout(() => void checkAuth(), 0); });
        return () => data.subscription.unsubscribe();
    }, [checkAuth, supabase]);

    if (loading) return <AdminFrame><p>Checking your session…</p></AdminFrame>;
    if (!session) return <AdminFrame><Login onComplete={checkAuth} /></AdminFrame>;
    if (!aal2) return <AdminFrame><MfaGate onComplete={checkAuth} /></AdminFrame>;
    return <Editor fallback={fallback} email={session.user.email ?? "Owner"} onSignOut={() => supabase.auth.signOut()} />;
}

function AdminFrame({ children }: { children: React.ReactNode }) {
    return <main className="min-h-screen bg-bg stripe-bg px-5 py-20 text-text-primary"><div className="mx-auto max-w-lg border-3 border-border bg-bg-card p-8 hard-shadow-lg"><a href={portfolioHome} className="font-bold uppercase text-sm">← Portfolio</a><h1 className="font-display text-5xl font-black uppercase my-6">Content Studio</h1>{children}</div></main>;
}

function Login({ onComplete }: { onComplete: () => Promise<void> }) {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
    return <form onSubmit={async (event) => { event.preventDefault(); setBusy(true); setError(""); const result = await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (result.error) setError(result.error.message); else await onComplete(); }} className="space-y-4">
        <p className="text-text-secondary">Sign in with the provisioned owner account. Public registration is disabled.</p>
        <label className="admin-field">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
        <label className="admin-field">Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {error && <p className="admin-error">{error}</p>}<button className="admin-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>;
}

function MfaGate({ onComplete }: { onComplete: () => Promise<void> }) {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const initialization = useRef<Promise<void> | null>(null);
    const [factorId, setFactorId] = useState("");
    const [challengeId, setChallengeId] = useState("");
    const [qr, setQr] = useState("");
    const [secret, setSecret] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [setupAttempt, setSetupAttempt] = useState(0);

    useEffect(() => {
        if (!initialization.current) {
            initialization.current = (async () => {
                setLoading(true);
                setError("");
                try {
                    const factors = await supabase.auth.mfa.listFactors();
                    if (factors.error) throw factors.error;

                    const existing = factors.data.totp[0];
                    if (existing) {
                        const challenge = await supabase.auth.mfa.challenge({ factorId: existing.id });
                        if (challenge.error) throw challenge.error;
                        setFactorId(existing.id);
                        setChallengeId(challenge.data.id);
                        return;
                    }

                    // A failed enrollment can leave an unusable unverified factor behind.
                    for (const factor of factors.data.all.filter((item) => item.factor_type === "totp" && item.status === "unverified")) {
                        const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id });
                        if (removed.error) throw removed.error;
                    }

                    const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Portfolio admin" });
                    if (enrolled.error) throw enrolled.error;
                    setFactorId(enrolled.data.id);
                    setQr(normalizeTotpQrCode(enrolled.data.totp.qr_code));
                    setSecret(enrolled.data.totp.secret);
                } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "Authenticator setup failed.");
                } finally {
                    setLoading(false);
                }
            })();
        }
        void initialization.current;
    }, [setupAttempt, supabase]);

    const retrySetup = () => {
        initialization.current = null;
        setFactorId("");
        setChallengeId("");
        setQr("");
        setSecret("");
        setCode("");
        setSetupAttempt((attempt) => attempt + 1);
    };

    const verify = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!factorId) return setError("Authenticator setup is not ready. Refresh the page and try again.");
        setError("");
        setLoading(true);
        let currentChallenge = challengeId;
        if (!currentChallenge) {
            const challenge = await supabase.auth.mfa.challenge({ factorId });
            if (challenge.error) { setError(challenge.error.message); setLoading(false); return; }
            currentChallenge = challenge.data.id;
            setChallengeId(currentChallenge);
        }
        const verified = await supabase.auth.mfa.verify({ factorId, challengeId: currentChallenge, code: code.trim() });
        if (verified.error) { setError(verified.error.message); setLoading(false); }
        else await onComplete();
    };

    return <form onSubmit={verify} className="space-y-4">
        <h2 className="font-display text-2xl font-black uppercase">Authenticator verification</h2>
        <p className="text-text-secondary">Use your authenticator app to protect every content change.</p>
        {loading && !factorId && <p role="status">Preparing authenticator setup…</p>}
        {qr && <>
            <Image src={qr} alt="Authenticator QR code" width={224} height={224} unoptimized className="mx-auto w-56 border-3 border-border bg-white p-3" />
            <p className="text-sm text-text-secondary">Scan this QR code with your authenticator app, then enter its current six-digit code.</p>
            {secret && <details className="text-sm"><summary className="cursor-pointer font-bold">Can&apos;t scan the QR code?</summary><label className="admin-field mt-3">Manual setup key<input value={secret} readOnly onFocus={(event) => event.currentTarget.select()} autoComplete="off" /></label></details>}
        </>}
        {!qr && factorId && <p className="text-sm text-text-secondary">Open the existing Portfolio admin entry in your authenticator app and enter its current code.</p>}
        <label className="admin-field">6-digit code<input inputMode="numeric" pattern="[0-9]{6}" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" /></label>
        {error && <div className="admin-error" role="alert"><p>{error}</p>{!factorId && <button type="button" className="admin-link mt-2" onClick={retrySetup}>Retry setup</button>}</div>}
        <button className="admin-primary" disabled={loading || !factorId || code.length !== 6}>{loading ? "Please wait…" : "Verify"}</button>
    </form>;
}

function Editor({ fallback, email, onSignOut }: { fallback: PortfolioContent; email: string; onSignOut: () => Promise<unknown> }) {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const [draft, setDraft] = useState<DraftState | null>(null); const [section, setSection] = useState<SectionKey>("profile"); const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [revisions, setRevisions] = useState<Revision[]>([]); const [preview, setPreview] = useState<"website" | "pdf" | null>(null); const [pdfUrl, setPdfUrl] = useState(""); const [rebuildRevision, setRebuildRevision] = useState<number | null>(null); const [rebuildStatus, setRebuildStatus] = useState<"idle" | "queued" | "failed">("idle");

    const load = useCallback(async () => {
        setBusy(true); setError("");
        let result = await supabase.from("content_drafts").select("content,version,base_revision,updated_at").eq("id", 1).maybeSingle();
        if (!result.data && !result.error) { const initialized = await supabase.rpc("initialize_portfolio_draft", { initial_content: fallback }); if (initialized.error) { setError(initialized.error.message); setBusy(false); return; } result = await supabase.from("content_drafts").select("content,version,base_revision,updated_at").eq("id", 1).single(); }
        if (result.error || !result.data) setError(result.error?.message ?? "Draft was not found"); else { const row = result.data; setDraft({ content: portfolioContentSchema.parse(row.content), version: row.version, baseRevision: row.base_revision, updatedAt: row.updated_at }); setDirty(false); }
        const history = await supabase.from("content_revisions").select("revision,published_at").order("revision", { ascending: false }).limit(30); if (history.data) setRevisions(history.data);
        setBusy(false);
    }, [fallback, supabase]);
    useEffect(() => { void load(); }, [load]);
    useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
    useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

    const setContent = (content: PortfolioContent) => { setDraft((current) => current ? { ...current, content } : current); setDirty(true); setMessage(""); };
    const save = async (): Promise<boolean> => {
        if (!draft) return false;
        const validated = portfolioContentSchema.safeParse(draft.content);
        if (!validated.success) { setError(validated.error.issues[0]?.message ?? "Invalid content"); return false; }
        setBusy(true); setError("");
        const result = await supabase.rpc("save_portfolio_draft", { next_content: validated.data, expected_version: draft.version });
        setBusy(false);
        if (result.error) { setError(result.error.message); return false; }
        setDraft({ content: portfolioContentSchema.parse(result.data.content), version: result.data.version, baseRevision: result.data.base_revision, updatedAt: result.data.updated_at });
        setDirty(false); setMessage("Draft saved."); return true;
    };
    const triggerRebuild = async (revision: number) => {
        setRebuildStatus("idle");
        const result = await supabase.functions.invoke("trigger-rebuild", { body: { revision } });
        setRebuildStatus(result.error ? "failed" : "queued");
        if (result.error) setError("Content is live, but the static rebuild could not be queued. Retry it below.");
    };
    const publish = async () => {
        if (!draft) return;
        if (dirty && !(await save())) return;
        setBusy(true); setError("");
        const current = await supabase.from("content_drafts").select("version,base_revision").eq("id", 1).single();
        if (current.error) { setError(current.error.message); setBusy(false); return; }
        const result = await supabase.rpc("publish_portfolio", { expected_draft_version: current.data.version, expected_base_revision: current.data.base_revision });
        if (result.error) setError(result.error.message);
        else { const revision = result.data.revision; setRebuildRevision(revision); setMessage(`Revision ${revision} is live.`); await triggerRebuild(revision); await load(); }
        setBusy(false);
    };
    const previewPdf = async () => { if (!draft) return; setBusy(true); const { createResumeBlob } = await import("@/components/resume/generateResume"); const blob = await createResumeBlob(draft.content); if (pdfUrl) URL.revokeObjectURL(pdfUrl); setPdfUrl(URL.createObjectURL(blob)); setPreview("pdf"); setBusy(false); };
    const importGitHub = async () => { if (!draft) return; setBusy(true); setError(""); const result = await supabase.functions.invoke("import-github-projects", { body: { content: draft.content, expectedVersion: draft.version } }); if (result.error) setError(result.error.message); else { setDraft({ content: portfolioContentSchema.parse(result.data.content), version: result.data.version, baseRevision: result.data.base_revision, updatedAt: result.data.updated_at }); setMessage("GitHub projects imported into the draft for review."); setDirty(false); } setBusy(false); };

    if (!draft) return <AdminFrame>{error ? <p className="admin-error">{error}</p> : <p>Loading editor…</p>}</AdminFrame>;
    return <main className="min-h-screen bg-surface text-text-primary">
        <header className="sticky top-0 z-50 border-b-3 border-border bg-bg px-5 py-3"><div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3"><div><a href={portfolioHome} className="font-bold text-xs uppercase">← Portfolio</a><h1 className="font-display text-3xl font-black uppercase">Content Studio</h1></div><div className="flex flex-wrap items-center gap-2"><span className="text-xs text-text-muted">{email}</span><button className="admin-secondary" onClick={() => setPreview("website")}>Preview</button><button className="admin-secondary" onClick={() => void previewPdf()}>PDF</button><button className="admin-secondary" onClick={() => void save()} disabled={busy || !dirty}>Save draft</button><button className="admin-primary" onClick={() => void publish()} disabled={busy}>Publish</button><button className="admin-link" onClick={() => void onSignOut()}>Sign out</button></div></div></header>
        <div className="mx-auto max-w-7xl grid lg:grid-cols-[230px_1fr] gap-6 px-5 py-8"><aside><nav className="grid grid-cols-2 lg:grid-cols-1 gap-2">{SECTIONS.map((item) => <button key={item.key} onClick={() => setSection(item.key)} className={`admin-nav ${section === item.key ? "admin-nav-active" : ""}`}>{item.label}</button>)}</nav></aside><section className="min-w-0 border-3 border-border bg-bg-card p-5 md:p-8 hard-shadow">
            <div className="flex items-center justify-between gap-4 mb-6"><div><h2 className="font-display text-4xl font-black uppercase">{SECTIONS.find((item) => item.key === section)?.label}</h2><p className="text-sm text-text-muted">Draft v{draft.version} · published revision {draft.baseRevision}{dirty ? " · Unsaved changes" : ""}</p></div>{section === "projects" && <button className="admin-secondary" onClick={() => void importGitHub()}>Import GitHub</button>}</div>
            {message && <p className="admin-success">{message}{rebuildStatus === "queued" ? " Static rebuild queued." : ""}</p>}{error && <p className="admin-error">{error}{rebuildStatus === "failed" && rebuildRevision && <button className="admin-link ml-3" onClick={() => void triggerRebuild(rebuildRevision)}>Retry rebuild</button>}</p>}
            {section === "profile" && <ProfileEditor value={draft.content} onChange={setContent} />}
            {section !== "profile" && section !== "revisions" && <ListEditor section={section} content={draft.content} onChange={setContent} />}
            {section === "revisions" && <RevisionHistory revisions={revisions} onRestore={async (revision) => { setBusy(true); const result = await supabase.rpc("restore_portfolio_revision", { target_revision: revision, expected_version: draft.version }); if (result.error) setError(result.error.message); else { setDraft({ content: portfolioContentSchema.parse(result.data.content), version: result.data.version, baseRevision: result.data.base_revision, updatedAt: result.data.updated_at }); setMessage(`Revision ${revision} restored as a draft.`); setDirty(false); } setBusy(false); }} />}
        </section></div>
        {preview && <div className="admin-modal" role="dialog" aria-modal="true"><div className="admin-modal-card"><button className="admin-modal-close" onClick={() => setPreview(null)}>Close</button>{preview === "pdf" && pdfUrl ? <iframe src={pdfUrl} title="Draft resume preview" className="w-full h-[75vh]" /> : <WebsitePreview content={draft.content} />}</div></div>}
    </main>;
}

function ProfileEditor({ value, onChange }: { value: PortfolioContent; onChange: (value: PortfolioContent) => void }) {
    return <div className="admin-grid">{Object.entries(value.profile).map(([key, current]) => <label key={key} className="admin-field"><span>{key.replace(/([A-Z])/g, " $1")}</span><input type={key === "email" ? "email" : "text"} value={current} onChange={(e) => onChange({ ...value, profile: { ...value.profile, [key]: e.target.value } })} /></label>)}</div>;
}

function ListEditor({ section, content, onChange }: { section: ListKey; content: PortfolioContent; onChange: (value: PortfolioContent) => void }) {
    const items = content[section] as unknown as Record<string, unknown>[];
    const updateItems = (next: Record<string, unknown>[]) => onChange({ ...content, [section]: next.map((item, order) => ({ ...item, order })) } as PortfolioContent);
    return <div className="space-y-5">{items.map((item, index) => <article key={String(item.id)} className="admin-item"><div className="flex flex-wrap items-center justify-between gap-2 mb-4"><strong>Item {index + 1}</strong><div className="flex gap-2"><button className="admin-icon" disabled={index === 0} onClick={() => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; updateItems(next); }}>↑</button><button className="admin-icon" disabled={index === items.length - 1} onClick={() => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; updateItems(next); }}>↓</button><button className="admin-link text-red-700" onClick={() => updateItems(items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div></div><div className="admin-grid">{FIELD_MAP[section].map((field) => { const current = item[field.key]; if (typeof current === "boolean") return <label key={field.key} className="admin-check"><input type="checkbox" checked={current} onChange={(e) => updateItems(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, [field.key]: e.target.checked } : entry))} />{field.label}</label>; const stringValue = field.list ? (current as string[]).join(", ") : String(current ?? ""); const controlProps = { value: stringValue, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItems(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, [field.key]: field.list ? e.target.value.split(",").map((value) => value.trim()).filter(Boolean) : e.target.value } : entry)) }; return <label key={field.key} className={`admin-field ${field.multiline ? "md:col-span-2" : ""}`}>{field.label}{field.multiline ? <textarea rows={4} {...controlProps} /> : <input {...controlProps} />}</label>; })}<label className="admin-check"><input type="checkbox" checked={Boolean(item.visible)} onChange={(e) => updateItems(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, visible: e.target.checked } : entry))} />Visible</label><label className="admin-check"><input type="checkbox" checked={Boolean(item.includeInResume)} onChange={(e) => updateItems(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, includeInResume: e.target.checked } : entry))} />Include in PDF</label></div></article>)}<button className="admin-secondary" onClick={() => updateItems([...items, { ...EMPTY_ITEMS[section], id: `${section}-${crypto.randomUUID()}`, visible: true, includeInResume: section !== "bio" && section !== "faqs", order: items.length }])}>+ Add item</button></div>;
}

function RevisionHistory({ revisions, onRestore }: { revisions: Revision[]; onRestore: (revision: number) => Promise<void> }) {
    return <div className="space-y-3">{revisions.length === 0 ? <p>No published revisions yet.</p> : revisions.map((item) => <div key={item.revision} className="flex items-center justify-between border-2 border-border p-4"><div><strong>Revision {item.revision}</strong><p className="text-xs text-text-muted">{new Date(item.published_at).toLocaleString()}</p></div><button className="admin-secondary" onClick={() => void onRestore(item.revision)}>Restore as draft</button></div>)}</div>;
}

function WebsitePreview({ content }: { content: PortfolioContent }) {
    return <div className="bg-bg p-6 max-h-[75vh] overflow-auto"><p className="uppercase font-bold text-sm">{content.profile.availability}</p><h2 className="font-display text-7xl font-black uppercase my-4">{content.profile.name}</h2><p className="text-xl text-text-secondary">{content.profile.tagline}</p><h3 className="font-display text-3xl font-black uppercase mt-10 mb-3">About</h3>{content.bio.filter((item) => item.visible).map((item) => <p key={item.id} className="border-2 border-border bg-bg-card p-4 mb-3">{item.text}</p>)}<h3 className="font-display text-3xl font-black uppercase mt-10 mb-3">Experience</h3>{content.experience.filter((item) => item.visible).map((item) => <div key={item.id} className="border-2 border-border p-4 mb-3"><strong>{item.role} · {item.company}</strong><p>{item.period}</p><p>{item.description}</p></div>)}</div>;
}
