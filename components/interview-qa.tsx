"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Config {
  persona: "hr" | "manager";
  mode: "free" | "qa";
  language: "he" | "en";
  jobTitle: string;
  jobDescription: string;
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  better_answer: string;
}

interface QAItem {
  question: string;
  answer: string;
  feedback: Feedback | null;
  loading: boolean;
}

export function InterviewQA({ config }: { config: Config }) {
  const [items, setItems] = useState<QAItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [finished, setFinished] = useState(false);
  const isHe = config.language === "he";

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: config.persona,
          mode: "qa",
          language: config.language,
          jobTitle: config.jobTitle,
          jobDescription: config.jobDescription,
        }),
      });
      const data = await res.json();
      setItems(data.questions.map((q: string) => ({
        question: q,
        answer: "",
        feedback: null,
        loading: false,
      })));
      setLoadingQuestions(false);
    }
    init();
  }, [config]);

  async function handleEvaluate(idx: number) {
    const item = items[idx];
    if (!item.answer.trim()) return;

    setItems(prev => prev.map((it, i) => i === idx ? { ...it, loading: true } : it));

    const res = await fetch("/api/interview/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: item.question,
        answer: item.answer,
        persona: config.persona,
        language: config.language,
        jobTitle: config.jobTitle,
      }),
    });
    const feedback = await res.json();

    setItems(prev => prev.map((it, i) => i === idx ? { ...it, feedback, loading: false } : it));
  }

  const avgScore = items.filter(it => it.feedback).length > 0
    ? Math.round(items.reduce((s, it) => s + (it.feedback?.score ?? 0), 0) / items.filter(it => it.feedback).length)
    : null;

  if (loadingQuestions) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        {isHe ? "מכין שאלות..." : "Preparing questions..."}
      </div>
    );
  }

  if (finished) {
    const answered = items.filter(it => it.feedback);
    return (
      <div className="space-y-6" dir={isHe ? "rtl" : "ltr"}>
        <div className="text-center py-8 space-y-2">
          <div className="text-5xl font-black text-primary">{avgScore}/10</div>
          <p className="text-muted-foreground text-sm">{isHe ? "ציון ממוצע" : "Average score"}</p>
          <p className="text-sm">{isHe ? `ענית על ${answered.length} מתוך ${items.length} שאלות` : `Answered ${answered.length} of ${items.length} questions`}</p>
        </div>
        <div className="space-y-4">
          {items.map((item, i) => item.feedback && (
            <div key={i} className="border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{item.question}</p>
                <span className={`text-sm font-bold ${item.feedback.score >= 7 ? "text-green-500" : item.feedback.score >= 5 ? "text-yellow-500" : "text-red-500"}`}>
                  {item.feedback.score}/10
                </span>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={() => window.location.reload()}>
          {isHe ? "ראיון חדש" : "New Interview"}
        </Button>
      </div>
    );
  }

  const item = items[current];

  return (
    <div className="space-y-6" dir={isHe ? "rtl" : "ltr"}>
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{isHe ? `שאלה ${current + 1} מתוך ${items.length}` : `Question ${current + 1} of ${items.length}`}</span>
        <div className="flex gap-1">
          {items.map((it, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full ${
              i === current ? "bg-primary" : it.feedback ? "bg-primary/40" : "bg-border"
            }`} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="rounded-2xl bg-muted p-5">
        <p className="text-sm font-medium leading-relaxed">{item.question}</p>
      </div>

      {/* Answer */}
      {!item.feedback ? (
        <div className="space-y-3">
          <textarea
            value={item.answer}
            onChange={e => setItems(prev => prev.map((it, i) => i === current ? { ...it, answer: e.target.value } : it))}
            placeholder={isHe ? "כתוב את תשובתך כאן..." : "Write your answer here..."}
            rows={5}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <Button
            onClick={() => handleEvaluate(current)}
            disabled={!item.answer.trim() || item.loading}
            className="w-full"
          >
            {item.loading ? (isHe ? "מעריך..." : "Evaluating...") : (isHe ? "קבל פידבק" : "Get Feedback")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Score */}
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-black ${item.feedback.score >= 7 ? "text-green-500" : item.feedback.score >= 5 ? "text-yellow-500" : "text-red-500"}`}>
              {item.feedback.score}/10
            </span>
            <div className="h-2 flex-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.feedback.score >= 7 ? "bg-green-500" : item.feedback.score >= 5 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${item.feedback.score * 10}%` }}
              />
            </div>
          </div>

          {/* Strengths */}
          {item.feedback.strengths.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-green-500">{isHe ? "✓ חוזקות" : "✓ Strengths"}</p>
              {item.feedback.strengths.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground">• {s}</p>
              ))}
            </div>
          )}

          {/* Improvements */}
          {item.feedback.improvements.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-yellow-500">{isHe ? "↑ לשיפור" : "↑ To improve"}</p>
              {item.feedback.improvements.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground">• {s}</p>
              ))}
            </div>
          )}

          {/* Better answer */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-xs font-medium">{isHe ? "תשובה טובה יותר:" : "Better answer:"}</p>
            <p className="text-sm text-muted-foreground">{item.feedback.better_answer}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline" size="sm"
          onClick={() => setCurrent(c => c - 1)}
          disabled={current === 0}
        >
          <ChevronRight className="h-4 w-4" />
          {isHe ? "הקודם" : "Previous"}
        </Button>

        {current < items.length - 1 ? (
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrent(c => c + 1)}
          >
            {isHe ? "הבאה" : "Next"}
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => setFinished(true)}>
            {isHe ? "סיום וסיכום" : "Finish & Summary"}
          </Button>
        )}
      </div>
    </div>
  );
}
