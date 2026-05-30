import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

function scoreColor(score: number) {
  if (score <= 3) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (score <= 5) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (score <= 7) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-green-500/20 text-green-400 border-green-500/30";
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-semibold tabular-nums", scoreColor(score), className)}
    >
      {score}/10
    </Badge>
  );
}
