"use client";

import { cn } from "@/lib/utils";

interface ReadinessBarProps {
  readiness: number; // 0-100
  answered: number;
  total: number;
  avgScore: number | null;
}

function readinessLabel(r: number) {
  if (r < 15) return { text: "מתחיל", color: "text-red-400" };
  if (r < 35) return { text: "מתחיל+", color: "text-orange-400" };
  if (r < 55) return { text: "מתקדם", color: "text-yellow-400" };
  if (r < 75) return { text: "כמעט מוכן", color: "text-lime-400" };
  if (r < 90) return { text: "מוכן טוב", color: "text-green-400" };
  return { text: "מוכן לראיון 🎯", color: "text-green-400" };
}

function barColor(r: number) {
  if (r < 35) return "bg-orange-500";
  if (r < 55) return "bg-yellow-500";
  if (r < 75) return "bg-lime-500";
  return "bg-green-500";
}

export function ReadinessBar({ readiness, answered, total, avgScore }: ReadinessBarProps) {
  const { text, color } = readinessLabel(readiness);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className="text-right space-y-0.5">
          <p className="text-xs text-muted-foreground">
            {answered} מתוך {total} שאלות · ממוצע {avgScore != null ? `${avgScore}/10` : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{readiness}%</p>
          <p className={cn("text-xs font-medium", color)}>{text}</p>
        </div>
      </div>

      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor(readiness))}
          style={{ width: `${readiness}%` }}
        />
      </div>

      {answered === 0 && (
        <p className="text-xs text-muted-foreground text-right">
          תרגל שאלות כדי לראות את רמת המוכנות שלך
        </p>
      )}
    </div>
  );
}
