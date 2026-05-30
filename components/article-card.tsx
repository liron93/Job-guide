"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const RECOMMENDATION_LABELS = {
  must_read: { label: "חובה לקרוא", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  worth_reading: { label: "שווה קריאה", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  skip: { label: "אפשר לדלג", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export interface ArticleData {
  id: string;
  url: string;
  title: string;
  summary: string;
  key_points: string[];
  why_worth_reading: string[];
  pm_relevance_score: number;
  pm_relevance_reason: string;
  recommendation: "must_read" | "worth_reading" | "skip";
  estimated_read_minutes: number;
  article_published_at: string | null;
  created_at: string;
}

interface ArticleCardProps {
  article: ArticleData;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDeleted?: () => void;
}

export function ArticleCard({ article, selectMode, isSelected, onToggleSelect, onDeleted }: ArticleCardProps) {
  const [deleted, setDeleted] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  if (deleted) return null;

  async function handleDelete() {
    setDeleting(true);
    setDeleted(true);
    onDeleted?.();
    await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
    router.refresh();
  }

  const rec = RECOMMENDATION_LABELS[article.recommendation];

  return (
    <Card
      className={cn(
        "transition-all",
        selectMode && "cursor-pointer",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={selectMode ? onToggleSelect : undefined}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col items-start gap-1 shrink-0">
            {selectMode ? (
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  isSelected ? "bg-primary border-primary" : "border-border"
                )}
                onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
              >
                {isSelected && <span className="text-primary-foreground text-xs font-bold">✓</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {rec && <Badge variant="outline" className={rec.color}>{rec.label}</Badge>}
                {confirm ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                      disabled={deleting}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      {deleting ? "מוחק..." : "מחק"}
                    </button>
                    <span className="text-muted-foreground text-xs">|</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirm(false); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirm(true); }}
                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                    title="מחק מאמר"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
            {!selectMode && (
              <span className="text-xs text-muted-foreground">{article.estimated_read_minutes} דק׳ קריאה</span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-right">
            {selectMode && rec && (
              <Badge variant="outline" className={cn(rec.color, "mb-1")}>{rec.label}</Badge>
            )}
            <CardTitle className="text-base leading-snug">{article.title}</CardTitle>
            {article.article_published_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(article.article_published_at).toLocaleDateString("he-IL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {!selectMode && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                ← למאמר המקורי
              </a>
            )}
          </div>
        </div>
      </CardHeader>

      {!selectMode && (
        <CardContent className="pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{article.pm_relevance_score}/10</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-3 rounded-full ${i < article.pm_relevance_score ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">רלוונטיות ל-PM:</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed text-right">{article.pm_relevance_reason}</p>

          {article.why_worth_reading?.length > 0 && (
            <div className="border border-border/50 rounded-md p-3 space-y-1.5 bg-muted/20">
              <p className="text-xs font-medium text-right">למה כדאי לקרוא:</p>
              <ul className="space-y-1">
                {article.why_worth_reading.map((reason, i) => (
                  <li key={i} className="text-xs text-muted-foreground text-right leading-relaxed">• {reason}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground list-none flex items-center gap-1">
              <span className="group-open:hidden">▶ קרא סיכום מלא</span>
              <span className="hidden group-open:inline">▼ הסתר סיכום</span>
            </summary>
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-relaxed text-right whitespace-pre-line">{article.summary}</p>
              {article.key_points?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 text-right">נקודות מפתח:</p>
                  <ul className="space-y-1">
                    {article.key_points.map((p, i) => (
                      <li key={i} className="text-xs text-right">• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        </CardContent>
      )}
    </Card>
  );
}
