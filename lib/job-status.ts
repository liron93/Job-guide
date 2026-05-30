export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  considering: { label: "בשיקול", color: "bg-muted text-muted-foreground border-muted" },
  applied: { label: "הגשתי", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  interview: { label: "ראיון", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  offer: { label: "קיבלתי הצעה", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { label: "נדחיתי", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  withdrawn: { label: "ביטלתי", color: "bg-muted text-muted-foreground border-muted" },
};

export const STATUS_ORDER = ["considering", "applied", "interview", "offer", "rejected", "withdrawn"];
