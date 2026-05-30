import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import { cn } from "@/lib/utils";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "קל",
  medium: "בינוני",
  hard: "קשה",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  hard:   "bg-red-500/15 text-red-400 border-red-500/30",
};

const CATEGORY_ACCENT: Record<string, string> = {
  "Terminology":    "border-r-violet-500/60",
  "Prioritization": "border-r-amber-500/60",
  "Estimation":     "border-r-blue-500/60",
  "Metrics":        "border-r-emerald-500/60",
  "Product Sense":  "border-r-pink-500/60",
  "Leadership":     "border-r-orange-500/60",
  "Strategy":       "border-r-cyan-500/60",
  "Execution":      "border-r-indigo-500/60",
  "Behavioral":     "border-r-purple-500/60",
  "Technical":      "border-r-slate-400/60",
  "Design":         "border-r-rose-500/60",
  "Growth":         "border-r-green-500/60",
  "AI & Data":      "border-r-fuchsia-500/60",
  "Case Study":     "border-r-teal-500/60",
};

interface QuestionCardProps {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  questionType?: string;
  bestScore?: number | null;
}

export function QuestionCard({ id, question, category, difficulty, questionType, bestScore }: QuestionCardProps) {
  const accentBorder = CATEGORY_ACCENT[category] ?? "border-r-primary/40";

  return (
    <Link href={`/practice/${id}`}>
      <Card
        className={cn(
          "hover:ring-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer",
          "border-r-2",
          accentBorder
        )}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">{category}</Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", DIFFICULTY_COLORS[difficulty])}
            >
              {DIFFICULTY_LABELS[difficulty]}
            </Badge>
            {questionType === "multiple_choice" && (
              <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/30">
                ✦ אמריקאית
              </Badge>
            )}
            {bestScore != null && <ScoreBadge score={bestScore} />}
          </div>
        </CardHeader>
        <CardContent className="pb-4 px-4">
          <p className="text-sm leading-relaxed">{question}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
