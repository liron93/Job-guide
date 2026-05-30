"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FeedbackRegenerateProps {
  onRegenerate: (feedback: string) => Promise<void>;
  loading?: boolean;
}

export function FeedbackRegenerate({ onRegenerate, loading = false }: FeedbackRegenerateProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleSubmit() {
    await onRegenerate(feedback.trim());
    setOpen(false);
    setFeedback("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        לא מתאים לי? שנה תשובה
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-right">מה לא מתאים? (אופציונלי)</p>
      <textarea
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-right outline-none focus:ring-1 focus:ring-primary/50 min-h-16"
        dir="rtl"
        placeholder='למשל: "אין לי ניסיון ב-X, תכתוב לפי הניסיון שלי ב-Y"'
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={loading}
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => { setOpen(false); setFeedback(""); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          disabled={loading}
        >
          ביטול
        </button>
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          {loading ? "מייצר..." : "שנה תשובה"}
        </Button>
      </div>
    </div>
  );
}
