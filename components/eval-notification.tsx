"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckCircle2, X } from "lucide-react";

interface EvalDoneEvent {
  questionId: string;
  answerId?: string;
  score: number;
  ts?: number;
}

const STORAGE_KEY = "pendingEval";

export function EvalNotification() {
  const [notification, setNotification] = useState<EvalDoneEvent | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Restore pending notification from localStorage (survived navigation / remount)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: EvalDoneEvent = JSON.parse(stored);
        if (parsed.ts && Date.now() - parsed.ts < 5 * 60 * 1000) {
          setNotification(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}

    function handler(e: Event) {
      const detail = (e as CustomEvent<EvalDoneEvent>).detail;
      const payload = { ...detail, ts: Date.now() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
      setNotification(payload);
    }
    window.addEventListener("evalDone", handler);
    return () => window.removeEventListener("evalDone", handler);
  }, []);

  function dismiss() {
    setNotification(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  if (!notification) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 left-6 z-50 flex items-center gap-3",
        "rounded-xl border border-green-500/30 bg-background/95 shadow-xl shadow-black/20",
        "px-4 py-3 backdrop-blur-xl cursor-pointer",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        "hover:border-green-500/50 transition-colors max-w-64"
      )}
      onClick={() => {
        const url = notification.answerId
          ? `/practice/${notification.questionId}?eval=${notification.answerId}`
          : `/practice/${notification.questionId}`;
        router.push(url);
        dismiss();
      }}
    >
      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
      <div className="flex-1 text-right">
        <p className="text-xs font-semibold text-green-400">ההערכה מוכנה!</p>
        <p className="text-xs text-muted-foreground">ציון {notification.score}/10 — לחצו לצפייה</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
