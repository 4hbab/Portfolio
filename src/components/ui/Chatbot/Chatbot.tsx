"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamChat, type ChatMessage } from "@/lib/chatbot";
import {
    personalKnowledge,
    serialiseKnowledge,
} from "@/content/chatbot-knowledge";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const KNOWLEDGE_CONTEXT = serialiseKnowledge(personalKnowledge);

const SUGGESTED_QUESTIONS = [
    "What does Sakif do?",
    "What's his tech stack?",
    "Tell me about his experience",
    "How can I contact him?",
];

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 350);
        }
    }, [isOpen]);

    // ──────────────────────────────────────────
    // Chat logic
    // ──────────────────────────────────────────

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isLoading) return;

            setError(null);
            const userMessage: ChatMessage = { role: "user", content: text.trim() };
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            setInput("");
            setIsLoading(true);

            // Add placeholder for assistant response
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: "",
            };
            setMessages([...updatedMessages, assistantMessage]);

            try {
                await streamChat(
                    updatedMessages,
                    KNOWLEDGE_CONTEXT,
                    (chunk: string) => {
                        assistantMessage.content += chunk;
                        setMessages((prev) => {
                            const next = [...prev];
                            next[next.length - 1] = { ...assistantMessage };
                            return next;
                        });
                    }
                );
            } catch (err) {
                const errorMsg =
                    err instanceof Error ? err.message : "Something went wrong.";
                setError(errorMsg);
                // Remove the empty assistant message on error
                setMessages(updatedMessages);
            } finally {
                setIsLoading(false);
            }
        },
        [messages, isLoading]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleSuggestionClick = (question: string) => {
        sendMessage(question);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    // ──────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────

    return (
        <>
            {/* ── FAB (Floating Action Button) ── */}
            <button
                id="chatbot-fab"
                onClick={() => setIsOpen((prev) => !prev)}
                className="chatbot-fab"
                aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
                aria-expanded={isOpen}
            >
                <span
                    className="chatbot-fab-icon"
                    style={{
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                >
                    {isOpen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="6" y1="6" x2="18" y2="18" />
                            <line x1="6" y1="18" x2="18" y2="6" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                            <circle cx="8" cy="10" r="1.2" />
                            <circle cx="12" cy="10" r="1.2" />
                            <circle cx="16" cy="10" r="1.2" />
                        </svg>
                    )}
                </span>
            </button>

            {/* ── Chat Panel ── */}
            {isOpen && (
                <div
                    className="chatbot-panel chatbot-panel--open"
                    role="dialog"
                    aria-label="Chat with Sakif's AI assistant"
                >
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">
                                <span>SA</span>
                            </div>
                            <div>
                                <h3 className="chatbot-header-title">
                                    Ask Me Anything
                                </h3>
                                <p className="chatbot-header-subtitle">
                                    AI-powered • About Sakif
                                </p>
                            </div>
                        </div>
                        <div className="chatbot-header-dot" />
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.length === 0 && (
                            <div className="chatbot-welcome">
                                <p className="chatbot-welcome-text">
                                    Hey! 👋 I know everything about Sakif. Ask me
                                    anything about his experience, skills, or
                                    projects!
                                </p>
                                <div className="chatbot-suggestions">
                                    {SUGGESTED_QUESTIONS.map((q) => (
                                        <button
                                            key={q}
                                            onClick={() =>
                                                handleSuggestionClick(q)
                                            }
                                            className="chatbot-suggestion-btn"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`chatbot-message chatbot-message--${msg.role}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="chatbot-message-avatar">
                                        SA
                                    </div>
                                )}
                                <div
                                    className={`chatbot-message-bubble chatbot-message-bubble--${msg.role}`}
                                >
                                    {msg.content || (
                                        <span className="chatbot-typing">
                                            <span />
                                            <span />
                                            <span />
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {error && (
                            <div className="chatbot-error">
                                <span>⚠</span> {error}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="chatbot-input-area">
                        <input
                            ref={inputRef}
                            id="chatbot-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                isLoading ? "Thinking..." : "Type a message..."
                            }
                            disabled={isLoading}
                            className="chatbot-input"
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="chatbot-send-btn"
                            aria-label="Send message"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
