"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamChat, type ChatMessage, type ChatSource } from "@/lib/chatbot";
import { usePortfolio } from "@/components/PortfolioProvider";

const DEFAULT_QUESTIONS = ["What does Sakif do?", "Which projects show backend experience?", "Summarize his recent experience", "How can I contact him?"];

export default function Chatbot() {
    const { content, revision, refresh } = usePortfolio();
    const suggestions = content.faqs.slice(0, 4).map((faq) => faq.question);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sources, setSources] = useState<ChatSource[]>([]);
    const controllerRef = useRef<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const lastQuestionRef = useRef("");

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);
    useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 200); }, [isOpen]);

    const sendMessage = useCallback(async (rawText: string, retryAfterRefresh = true, revisionOverride?: number) => {
        const text = rawText.trim();
        if (!text || isLoading || text.length > 4000) return;
        lastQuestionRef.current = text;
        setError(null);
        setSources([]);
        const history = [...messages, { role: "user" as const, content: text }].slice(-10);
        setMessages([...history, { role: "assistant", content: "" }]);
        setInput("");
        setIsLoading(true);
        const controller = new AbortController();
        controllerRef.current = controller;
        let answer = "";
        try {
            const result = await streamChat(history, revisionOverride ?? revision, (chunk) => {
                answer += chunk;
                setMessages([...history, { role: "assistant", content: answer }]);
            }, controller.signal);
            setSources(result.sources);
            if (result.stale && retryAfterRefresh) {
                const fresh = await refresh(true);
                setIsLoading(false);
                await sendMessage(text, false, fresh);
                return;
            }
        } catch (caught) {
            if ((caught as Error).name === "AbortError") { if (!answer) setMessages(history); }
            else { setMessages(history); setError(caught instanceof Error ? caught.message : "The assistant is unavailable."); }
        } finally {
            controllerRef.current = null;
            setIsLoading(false);
        }
    }, [isLoading, messages, refresh, revision]);

    const reset = () => { controllerRef.current?.abort(); setMessages([]); setSources([]); setError(null); setInput(""); };

    return <>
        <button id="chatbot-fab" onClick={() => setIsOpen((open) => !open)} className="chatbot-fab" aria-label={isOpen ? "Close recruiter assistant" : "Open recruiter assistant"} aria-expanded={isOpen}>
            <span className="chatbot-fab-icon">{isOpen ? "×" : "AI"}</span>
        </button>
        {isOpen && <div className="chatbot-panel chatbot-panel--open" role="dialog" aria-label="Sakif's recruiter assistant">
            <div className="chatbot-header">
                <div className="chatbot-header-info"><div className="chatbot-avatar">SA</div><div><h3 className="chatbot-header-title">Recruiter Assistant</h3><p className="chatbot-header-subtitle">Grounded in the published portfolio</p></div></div>
                <button type="button" onClick={reset} className="chatbot-reset-btn" aria-label="Reset conversation">Reset</button>
            </div>
            <div className="chatbot-messages" aria-live="polite">
                {messages.length === 0 && <div className="chatbot-welcome"><p className="chatbot-welcome-text">Ask about Sakif&apos;s experience and projects, or paste a job description for an evidence-based comparison.</p><div className="chatbot-suggestions">{(suggestions.length ? suggestions : DEFAULT_QUESTIONS).map((question) => <button key={question} onClick={() => void sendMessage(question)} className="chatbot-suggestion-btn">{question}</button>)}</div></div>}
                {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chatbot-message chatbot-message--${message.role}`}>{message.role === "assistant" && <div className="chatbot-message-avatar">SA</div>}<div className={`chatbot-message-bubble chatbot-message-bubble--${message.role}`}>{message.content || <span className="chatbot-typing"><span /><span /><span /></span>}</div></div>)}
                {sources.length > 0 && <div className="chatbot-sources">{sources.map((source) => <a key={source.id} href={source.href} className="chatbot-source-link">{source.label}</a>)}</div>}
                {error && <div className="chatbot-error"><span>⚠</span> {error}<div className="chatbot-fallback-links"><a href="#experience">Experience</a><a href="#projects">Projects</a><a href="#contact">Contact</a></div>{lastQuestionRef.current && <button onClick={() => void sendMessage(lastQuestionRef.current)} className="chatbot-retry-btn">Retry</button>}</div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void sendMessage(input); }} className="chatbot-input-area">
                <textarea ref={inputRef} id="chatbot-input" value={input} maxLength={4000} rows={2} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(input); } }} placeholder="Ask a question or paste a job description…" disabled={isLoading} className="chatbot-input" />
                {isLoading ? <button type="button" onClick={() => controllerRef.current?.abort()} className="chatbot-send-btn" aria-label="Stop response">■</button> : <button type="submit" disabled={!input.trim()} className="chatbot-send-btn" aria-label="Send message">➤</button>}
            </form>
            <p className="chatbot-privacy">Messages are sent to Google Gemini. Don&apos;t include confidential information.</p>
        </div>}
    </>;
}
