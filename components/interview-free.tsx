"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Config {
  persona: "hr" | "manager";
  mode: "free" | "qa";
  language: "he" | "en";
  jobTitle: string;
  jobDescription: string;
}

export function InterviewFree({ config }: { config: Config }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isHe = config.language === "he";

  useEffect(() => {
    async function init() {
      setLoading(true);
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: config.persona,
          mode: "free",
          language: config.language,
          jobTitle: config.jobTitle,
          jobDescription: config.jobDescription,
        }),
      });
      const data = await res.json();
      setSystemPrompt(data.systemPrompt);

      // Get opening message from interviewer
      await sendMessage([], data.systemPrompt, isHe ? "שלום, אנא התחל את הראיון" : "Hello, please start the interview");
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(currentMessages: Message[], prompt: string, userMsg: string) {
    const newMessages: Message[] = [...currentMessages, { role: "user", content: userMsg }];

    setMessages(prev => {
      const filtered = userMsg === (isHe ? "שלום, אנא התחל את הראיון" : "Hello, please start the interview")
        ? prev
        : [...prev, { role: "user" as const, content: userMsg }];
      return filtered;
    });

    const res = await fetch("/api/interview/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, systemPrompt: prompt }),
    });

    if (!res.body) return;

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: full };
        return updated;
      });
    }

    return full;
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userInput = input;
    setInput("");
    setLoading(true);
    await sendMessage(messages, systemPrompt, userInput);
    setLoading(false);
  }

  const personaName = config.persona === "hr"
    ? (isHe ? "דנה לוי — HR" : "Dana Levi — HR")
    : (isHe ? "רועי כהן — מנהל ישיר" : "Roy Cohen — Hiring Manager");

  if (done) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-bold">{isHe ? "הראיון הסתיים!" : "Interview Complete!"}</h2>
        <p className="text-muted-foreground text-sm">
          {isHe ? "תרגלת ראיון מלא. כל הכבוד!" : "You completed a full mock interview. Well done!"}
        </p>
        <Button onClick={() => window.location.reload()}>{isHe ? "ראיון חדש" : "New Interview"}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]" dir={isHe ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">{personaName}</h2>
          <p className="text-xs text-muted-foreground">{config.jobTitle || (isHe ? "ראיון כללי" : "General interview")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDone(true)}>
          {isHe ? "סיים ראיון" : "End Interview"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? (isHe ? "justify-start" : "justify-end") : (isHe ? "justify-end" : "justify-start")}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
              msg.role === "assistant"
                ? "bg-muted text-foreground"
                : "bg-primary text-primary-foreground"
            }`}>
              {msg.content || <span className="opacity-50">●●●</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isHe ? "הקלד את תשובתך..." : "Type your answer..."}
          rows={2}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="self-end h-10 w-10">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
