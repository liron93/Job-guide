"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: "שגיאה — נסו שוב" } : m
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
          "hover:scale-105 hover:shadow-violet-500/30 hover:shadow-xl",
          open && "rotate-0"
        )}
        title="עוזר PM"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-22 left-6 z-50 flex flex-col",
            "w-80 h-[480px] rounded-2xl border border-border/60",
            "bg-background/95 shadow-2xl shadow-black/20",
            "backdrop-blur-xl overflow-hidden",
            "animate-in slide-in-from-bottom-4 fade-in duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 shrink-0">
            <span className="text-xs text-muted-foreground">Shift+Enter לשורה חדשה</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-semibold">עוזר PM</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.length === 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm text-muted-foreground text-right leading-relaxed">
                  שלום! אני כאן לעזור עם כל שאלה על PM וראיונות עבודה.
                </p>
                <div className="space-y-1.5">
                  {[
                    "איך עונים על שאלת Product Sense?",
                    "מה זה RICE ומתי משתמשים?",
                    "תנו לי תשובה לשאלה על weaknesses",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="block w-full text-right text-xs text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-lg px-3 py-2 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-start" : "justify-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted/60 text-foreground rounded-bl-sm text-right"
                  )}
                >
                  {m.content || (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border/50 p-3 flex gap-2 items-end">
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className={cn(
                "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                "bg-primary text-primary-foreground",
                "disabled:opacity-40 hover:opacity-90"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="שאלו אותי הכל..."
              dir="rtl"
              rows={1}
              disabled={streaming}
              className={cn(
                "flex-1 resize-none rounded-xl border border-border bg-muted/30 px-3 py-2",
                "text-sm text-right outline-none placeholder:text-muted-foreground",
                "focus:ring-1 focus:ring-primary/40 max-h-28 overflow-y-auto",
                "disabled:opacity-50"
              )}
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
          </div>
        </div>
      )}
    </>
  );
}
