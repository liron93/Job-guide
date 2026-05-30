"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "@/components/score-badge";

interface PreviousAnswer {
  id: string;
  overall_score: number;
  answer_text: string;
  evaluation: Evaluation;
  created_at: string;
}

interface RevealData {
  model_answer_full: string;
  model_answer_pointers: string[];
  key_terms: { term: string; explanation: string }[];
}

function RevealPanel({ questionId }: { questionId: string }) {
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [revealHe, setRevealHe] = useState<RevealData | null>(null);
  const [revealEn, setRevealEn] = useState<RevealData | null>(null);
  const [lang, setLang] = useState<"he" | "en">("he");
  const [loadingEn, setLoadingEn] = useState(false);
  const [open, setOpen] = useState(false);

  const reveal = lang === "en" ? revealEn : revealHe;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/questions/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, lang: "he" }),
    })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => { if (!cancelled) { setRevealHe(data); setState("done"); setOpen(true); } })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [questionId]);

  async function switchToEn() {
    setLang("en");
    if (revealEn) return;
    setLoadingEn(true);
    try {
      const res = await fetch("/api/questions/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, lang: "en" }),
      });
      if (res.ok) setRevealEn(await res.json());
    } finally {
      setLoadingEn(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3">
        <p className="text-sm font-medium text-blue-400 text-right animate-pulse">★ טוען תשובת מופת...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <p className="text-xs text-red-400 text-right">שגיאה בטעינת תשובת מופת</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {open ? "▼ הסתר" : "▶ הצג"}
          </button>
          <div className="flex border border-border rounded-md overflow-hidden ml-2">
            <button
              onClick={() => setLang("he")}
              className={`text-xs px-2 py-0.5 transition-colors ${lang === "he" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              עב
            </button>
            <button
              onClick={switchToEn}
              disabled={loadingEn}
              className={`text-xs px-2 py-0.5 transition-colors ${lang === "en" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"} disabled:opacity-50`}
            >
              {loadingEn ? "..." : "EN"}
            </button>
          </div>
        </div>
        <span className="text-sm font-medium text-blue-400">★ תשובת מופת (ציון 10)</span>
      </div>
      {open && reveal && (
        <div className="px-4 pb-4 space-y-4 border-t border-blue-500/20 pt-3">
          {reveal.model_answer_pointers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">נקודות מפתח</p>
              <ul className="space-y-1">
                {reveal.model_answer_pointers.map((p, i) => (
                  <li key={i} className="text-sm text-right before:content-['•'] before:ml-2">{p}</li>
                ))}
              </ul>
            </div>
          )}
          {reveal.model_answer_full && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">תשובה מלאה</p>
              <ModelAnswer text={reveal.model_answer_full} />
            </div>
          )}
          {reveal.key_terms.length > 0 && (
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">מושגים שחייבים להופיע בתשובה</p>
              <div className="space-y-2">
                {reveal.key_terms.map((kt, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 text-right">{kt.explanation}</p>
                    <span className="text-xs font-mono font-semibold text-blue-400 shrink-0 bg-blue-500/10 px-2 py-0.5 rounded">
                      {kt.term}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModelAnswer({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <div className="space-y-3 text-right">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <p key={i} className="text-xs font-semibold text-blue-400 uppercase tracking-wide mt-4 first:mt-0">
              {line.replace("## ", "")}
            </p>
          );
        }
        if (line.startsWith("• ")) {
          return (
            <p key={i} className="text-sm leading-relaxed text-right pr-3 border-r-2 border-border">
              {line.replace("• ", "")}
            </p>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {line}
          </p>
        );
      })}
    </div>
  );
}

interface Evaluation {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_from_answer: string[];
  key_terms?: { term: string; explanation: string }[];
  cv_observations: { cv_quote: string; observation: string }[];
  criterion_scores: Record<string, { score: number; comment: string }>;
  model_answer_pointers: string[];
  model_answer_full?: string;
  next_practice: string;
}

export function PracticeForm({
  questionId,
  previousAnswers = [],
  nextQuestionId,
  initialAnswer,
}: {
  questionId: string;
  previousAnswers?: PreviousAnswer[];
  nextQuestionId?: string | null;
  initialAnswer?: PreviousAnswer | null;
}) {
  const [answer, setAnswer] = useState(initialAnswer?.answer_text ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(
    initialAnswer?.evaluation ?? null
  );
  const router = useRouter();

  async function handleSubmit() {
    if (!answer.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/answers/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answerText: answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בהערכה — נסו שוב");
        return;
      }
      setEvaluation(data.evaluation);
    } catch {
      setError("שגיאת רשת — נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setAnswer("");
    setEvaluation(null);
    setError("");
  }

  if (evaluation) {
    return (
      <div className="space-y-6">
        <EvaluationDisplay evaluation={evaluation} answer={answer} onReset={handleReset} nextQuestionId={nextQuestionId} />
        <AnswerHistory answers={previousAnswers} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RevealPanel questionId={questionId} />
      <div className="space-y-3">
        <Textarea
          placeholder="כתבו את תשובתכם כאן..."
          className="min-h-48 text-right resize-none"
          dir="rtl"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={loading}
        />
        {error && <p className="text-sm text-red-400 text-right">{error}</p>}
        {loading && (
          <p className="text-xs text-muted-foreground text-right animate-pulse">
            מעריך... (~15 שניות)
          </p>
        )}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading || answer.trim().length < 10}>
            {loading ? "מעריך..." : "שלח לקבלת משוב →"}
          </Button>
        </div>
      </div>
      <AnswerHistory answers={previousAnswers} />
    </div>
  );
}

function EvaluationDisplay({
  evaluation,
  answer,
  onReset,
  hideActions = false,
  nextQuestionId,
}: {
  evaluation: Evaluation;
  answer: string;
  onReset: () => void;
  hideActions?: boolean;
  nextQuestionId?: string | null;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Score */}
      <Card>
        <CardContent className="pt-6 pb-6 flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold">{evaluation.overall_score}<span className="text-xl text-muted-foreground">/10</span></p>
            <p className="text-sm text-muted-foreground mt-1">ציון כולל</p>
          </div>
          <ScoreBadge score={evaluation.overall_score} className="text-lg px-4 py-2 h-auto" />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm leading-relaxed text-right">{evaluation.summary}</p>
        </CardContent>
      </Card>

      {/* Strengths */}
      {evaluation.strengths.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm text-green-400">✓ חוזקות</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-1">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm text-right before:content-['•'] before:ml-2">{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weaknesses */}
      {evaluation.weaknesses.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm text-red-400">✗ חולשות</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-1">
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-right before:content-['•'] before:ml-2">{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Missing */}
      {evaluation.missing_from_answer.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm text-yellow-400">⚠ חסר בתשובה</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-1">
              {evaluation.missing_from_answer.map((m, i) => (
                <li key={i} className="text-sm text-right before:content-['•'] before:ml-2">{m}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Model answer pointers */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm text-blue-400 flex items-center justify-between">
            <span>★ תשובת מופת (ציון 10)</span>
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAnswer ? "▼ הסתר" : "▶ הצג"}
            </button>
          </CardTitle>
        </CardHeader>
        {showAnswer && (
          <CardContent className="pb-4 space-y-5">
            {evaluation.model_answer_full ? (
              <ModelAnswer text={evaluation.model_answer_full} />
            ) : (
              <p className="text-sm text-muted-foreground text-right">
                לחצו על &quot;נסו שוב&quot; כדי לקבל תשובת מופת מלאה
              </p>
            )}

            {evaluation.key_terms && evaluation.key_terms.length > 0 && (
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                  מושגים חשובים לשאלה זו
                </p>
                <div className="space-y-2">
                  {evaluation.key_terms.map((kt, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <p className="text-xs text-muted-foreground leading-relaxed flex-1 text-right">{kt.explanation}</p>
                      <span className="text-xs font-mono font-semibold text-blue-400 shrink-0 bg-blue-500/10 px-2 py-0.5 rounded">
                        {kt.term}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Criterion scores (collapsible) */}
      {Object.keys(evaluation.criterion_scores).length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <button
                onClick={() => setShowCriteria(!showCriteria)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCriteria ? "▼ הסתר" : "▶ הצג"} ניקוד לפי קריטריונים
              </button>
              <span>ניקוד מפורט</span>
            </CardTitle>
          </CardHeader>
          {showCriteria && (
            <CardContent className="pb-4 space-y-3">
              {Object.entries(evaluation.criterion_scores).map(([name, data]) => (
                <div key={name} className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground text-right flex-1">{data.comment}</p>
                  <div className="text-left shrink-0">
                    <ScoreBadge score={data.score} />
                    <p className="text-xs text-muted-foreground mt-1 text-center">{name}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Next practice suggestion */}
      {evaluation.next_practice && (
        <p className="text-xs text-muted-foreground text-right border-t border-border pt-3">
          💡 {evaluation.next_practice}
        </p>
      )}

      {/* Actions */}
      {!hideActions && (
        <div className="flex gap-3 pt-2">
          <Button onClick={onReset} variant="outline" className="flex-1">
            נסו שוב
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push(nextQuestionId ? `/practice/${nextQuestionId}` : "/questions")}
          >
            {nextQuestionId ? "שאלה הבאה →" : "חזרה לשאלות"}
          </Button>
        </div>
      )}
    </div>
  );
}

function AnswerHistory({ answers }: { answers: PreviousAnswer[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (answers.length === 0) return null;

  const evaluated = answers.filter((a) => a.evaluation);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-t border-border pt-5">
        <span className="text-sm font-semibold">ניסיונות קודמים</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{evaluated.length}</span>
      </div>
      {evaluated.map((a, i) => {
        const isOpen = openId === a.id;
        const date = new Date(a.created_at).toLocaleDateString("he-IL", {
          day: "numeric", month: "numeric", year: "numeric",
        });
        return (
          <Card key={a.id} className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right hover:bg-foreground/[0.02] transition-colors"
              onClick={() => setOpenId(isOpen ? null : a.id)}
            >
              <span className="text-xs text-muted-foreground">{isOpen ? "▼" : "▶"}</span>
              <span className="text-xs text-muted-foreground flex-1 text-right">
                ניסיון {evaluated.length - i} · {date}
              </span>
              <ScoreBadge score={a.overall_score} />
            </button>
            {isOpen && (
              <div className="border-t border-border px-4 pt-4">
                <EvaluationDisplay
                  evaluation={a.evaluation}
                  answer={a.answer_text}
                  onReset={() => {}}
                  hideActions
                />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
