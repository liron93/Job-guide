import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = createClient();

  const { data: answers } = await supabase
    .from("answers")
    .select("id, overall_score, created_at, questions(question, category, difficulty)")
    .order("created_at", { ascending: false });

  const all = answers ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">היסטוריה</h1>
        <p className="text-muted-foreground text-sm mt-1">כל התשובות שלך</p>
      </div>

      {all.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            עוד אין תשובות שמורות
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {all.map((item) => {
            const q = item.questions as unknown as { question: string; category: string; difficulty: string } | null;
            return (
              <Link key={item.id} href={`/history/${item.id}`}>
                <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                  <CardContent className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{q?.question ?? "—"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{q?.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    </div>
                    {item.overall_score != null && <ScoreBadge score={item.overall_score} />}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
