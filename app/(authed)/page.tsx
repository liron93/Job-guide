import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsSummary } from "@/components/stats-summary";
import { ScoreBadge } from "@/components/score-badge";
import { ReadinessBar } from "@/components/readiness-bar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

async function getDashboardData() {
  const supabase = createClient();

  const [{ data: answers }, { data: cv }, { count: totalQuestions }] = await Promise.all([
    supabase
      .from("answers")
      .select("overall_score, created_at, question_id, questions(question, category)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("cvs").select("filename, uploaded_at").eq("is_active", true).single(),
    supabase.from("questions").select("*", { count: "exact", head: true }),
  ]);

  const all = answers ?? [];

  // best score per unique question
  const bestPerQuestion = new Map<string, number>();
  for (const a of all) {
    const prev = bestPerQuestion.get(a.question_id) ?? 0;
    if ((a.overall_score ?? 0) > prev) bestPerQuestion.set(a.question_id, a.overall_score ?? 0);
  }

  const uniqueQuestions = bestPerQuestion.size;
  const avgScore = uniqueQuestions
    ? Math.round((Array.from(bestPerQuestion.values()).reduce((s, n) => s + n, 0) / uniqueQuestions) * 10) / 10
    : null;

  // streak: count consecutive days up to today
  const days = new Set(all.map((a) => new Date(a.created_at).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  // weakest category — based on best score per question
  const byCategory: Record<string, number[]> = {};
  Array.from(bestPerQuestion.entries()).forEach(([qid, score]) => {
    const a = all.find((x) => x.question_id === qid);
    const cat = (a?.questions as unknown as { category: string } | null)?.category;
    if (cat) byCategory[cat] = [...(byCategory[cat] ?? []), score];
  });
  const weakest = Object.entries(byCategory)
    .map(([cat, scores]) => ({ cat, avg: scores.reduce((s, n) => s + n, 0) / scores.length }))
    .sort((a, b) => a.avg - b.avg)[0];

  // readiness: 60% coverage + 40% quality
  const total = totalQuestions ?? 0;
  const coverage = total > 0 ? uniqueQuestions / total : 0;
  const quality = avgScore != null ? avgScore / 10 : 0;
  const readiness = Math.round((coverage * 0.6 + quality * 0.4) * 100);

  return { all, uniqueQuestions, avgScore, streak, weakest, cv, readiness, totalQuestions: total };
}

export default async function DashboardPage() {
  const { all, uniqueQuestions, avgScore, streak, weakest, cv, readiness, totalQuestions } = await getDashboardData();

  const stats = [
    { label: "שאלות שתרגלתי", value: uniqueQuestions },
    { label: "ממוצע ציון", value: avgScore ?? "—", sub: avgScore ? "מתוך 10" : "אין עדיין" },
    { label: "רצף ימים", value: streak > 0 ? `${streak} 🔥` : "—", sub: streak > 0 ? "ימים רצופים" : "התחילי היום" },
    {
      label: "קטגוריה חלשה",
      value: weakest?.cat ?? "—",
      sub: weakest ? `ממוצע ${weakest.avg.toFixed(1)}` : "אין עדיין",
    },
  ];

  const recent = all.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">שלום 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">מוכנה להתאמן היום?</p>
        </div>
        <Button render={<Link href="/questions" />}>תרגול עכשיו</Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5">
          <p className="text-sm font-semibold text-right mb-3">מוכנות לראיון</p>
          <ReadinessBar
            readiness={readiness}
            answered={uniqueQuestions}
            total={totalQuestions}
            avgScore={avgScore}
          />
        </CardContent>
      </Card>

      <StatsSummary stats={stats} />

      <div>
        <h2 className="text-lg font-semibold mb-4">תשובות אחרונות</h2>
        {recent.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              עוד אין תשובות — לחצי על &quot;תרגול עכשיו&quot; להתחיל
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recent.map((item) => {
              const q = item.questions as unknown as { question: string; category: string } | null;
              return (
                <Card key={item.question_id} className="hover:bg-accent/30 transition-colors">
                  <CardContent className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{q?.question ?? item.question_id}</p>
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
              );
            })}
          </div>
        )}
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">קורות חיים</CardTitle>
        </CardHeader>
        <CardContent>
          {cv ? (
            <p className="text-sm">
              קובץ פעיל: <span className="font-medium">{cv.filename}</span>
              <span className="text-muted-foreground text-xs mr-2">
                ({new Date(cv.uploaded_at).toLocaleDateString("he-IL")})
              </span>
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">לא הועלו קורות חיים עדיין.</p>
              <Button variant="outline" size="sm" className="mt-3" render={<Link href="/cv" />}>
                העלה קורות חיים
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
