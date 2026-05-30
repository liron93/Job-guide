"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackRegenerate } from "@/components/feedback-regenerate";

interface MyQuestion {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

export function MyQuestionsTab({
  jobId,
  initialQuestions,
}: {
  jobId: string;
  initialQuestions: MyQuestion[];
}) {
  const [questions, setQuestions] = useState<MyQuestion[]>(initialQuestions);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/my-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "שגיאה"); return; }
      const newEntry: MyQuestion = await res.json();
      setQuestions((prev) => [newEntry, ...prev]);
      setOpenId(newEntry.id);
      setInput("");
    } catch {
      setError("שגיאת רשת — נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate(entry: MyQuestion, feedback: string) {
    setRegeneratingId(entry.id);
    try {
      const res = await fetch(`/api/jobs/${jobId}/my-question`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: entry.id, question: entry.question, feedback }),
      });
      if (!res.ok) return;
      const { answer } = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === entry.id ? { ...q, answer } : q))
      );
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleDelete(entryId: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== entryId));
    await fetch(`/api/jobs/${jobId}/my-question`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId }),
    });
  }

  return (
    <div className="space-y-5">
      {/* Input */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground text-right">
          רשום שאלה שנשאלת בראיון ולא ידעת לענות עליה — המערכת תכתוב לך תשובה מושלמת
        </p>
        <Textarea
          placeholder='לדוגמא: "אם הייתי שואל את המנהל שלך מה הוא חושב עליך, מה הוא היה אומר?"'
          className="min-h-24 text-right resize-none"
          dir="rtl"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        {error && <p className="text-sm text-red-400 text-right">{error}</p>}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading || input.trim().length < 5}
          >
            {loading ? "מכין תשובה..." : "קבל תשובה מושלמת"}
          </Button>
        </div>
      </div>

      {/* Saved Q&As */}
      {questions.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground text-right">{questions.length} שאלות שמורות</p>
          {questions.map((q) => {
            const isOpen = openId === q.id;
            const date = new Date(q.created_at).toLocaleDateString("he-IL", {
              day: "numeric", month: "numeric",
            });
            return (
              <Card key={q.id} className="overflow-hidden">
                <button
                  className="w-full flex items-start justify-between gap-3 px-4 py-3 text-right hover:bg-foreground/[0.02] transition-colors"
                  onClick={() => setOpenId(isOpen ? null : q.id)}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{date}</span>
                    <span className="text-xs text-muted-foreground">{isOpen ? "▼" : "▶"}</span>
                  </div>
                  <span className="text-sm flex-1 text-right leading-snug">{q.question}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                      <p className="text-xs font-medium text-primary text-right">תשובה מושלמת (ציון 10)</p>
                      <p className="text-sm leading-relaxed text-right whitespace-pre-wrap">
                        {regeneratingId === q.id ? (
                          <span className="text-muted-foreground animate-pulse">מייצר תשובה חדשה...</span>
                        ) : q.answer}
                      </p>
                    </div>
                    <FeedbackRegenerate
                      loading={regeneratingId === q.id}
                      onRegenerate={(feedback) => handleRegenerate(q, feedback)}
                    />
                    <div className="flex justify-start">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        מחק שאלה
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
