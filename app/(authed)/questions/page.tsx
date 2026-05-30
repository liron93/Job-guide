import { QuestionCard } from "@/components/question-card";
import { CategoryFilter } from "@/components/category-filter";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getQuestions(category?: string, difficulty?: string) {
  const supabase = createClient();

  let query = supabase.from("questions").select("id, question, category, difficulty, question_type");
  if (category) query = query.eq("category", category);
  if (difficulty) query = query.eq("difficulty", difficulty);

  const [{ data: questions }, { data: answerRows }] = await Promise.all([
    query.order("created_at", { ascending: true }),
    supabase
      .from("answers")
      .select("question_id, overall_score")
      .not("overall_score", "is", null)
      .order("overall_score", { ascending: false }),
  ]);

  const bestScore = new Map<string, number>();
  for (const row of answerRows ?? []) {
    if (!bestScore.has(row.question_id)) {
      bestScore.set(row.question_id, row.overall_score);
    }
  }

  return (questions ?? []).map((q) => ({ ...q, bestScore: bestScore.get(q.id) ?? null }));
}

async function getProfileFocus() {
  const supabase = createClient();
  const { data: profile } = await supabase.from("user_profile").select("*").single();
  if (!profile) return null;

  const hints: string[] = [];

  if (profile.looking_for) hints.push(`מחפש/ת: ${profile.looking_for}`);
  if (profile.improvement_areas) hints.push(`לשיפור: ${profile.improvement_areas}`);
  if (profile.job_title) hints.push(`רקע: ${profile.job_title}`);

  const focusCategories: string[] = [];

  const text = [profile.looking_for, profile.improvement_areas, profile.additional_notes].join(" ").toLowerCase();
  if (text.includes("strategy") || text.includes("אסטרטג")) focusCategories.push("Strategy");
  if (text.includes("leadership") || text.includes("ניהול") || text.includes("מנהל")) focusCategories.push("Leadership");
  if (text.includes("metric") || text.includes("data") || text.includes("נתון")) focusCategories.push("Metrics");
  if (text.includes("priorit") || text.includes("עדיפו")) focusCategories.push("Prioritization");
  if (text.includes("behav") || text.includes("התנהגות") || text.includes("קונפליקט")) focusCategories.push("Behavioral");
  if (text.includes("hr") || text.includes("personal") || text.includes("אישי")) focusCategories.push("HR & Personal");
  if (text.includes("product sense") || text.includes("עיצוב") || text.includes("design")) focusCategories.push("Product Sense");

  return {
    name: profile.full_name,
    hints: hints.slice(0, 2),
    focusCategories: focusCategories.slice(0, 3),
    hasProfile: hints.length > 0,
  };
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { category?: string; difficulty?: string };
}) {
  const { category, difficulty } = searchParams;
  const [questions, focus] = await Promise.all([
    getQuestions(category, difficulty),
    getProfileFocus(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">שאלות</h1>
        <p className="text-muted-foreground text-sm mt-1">בחרו שאלה לתרגול</p>
      </div>

      {/* Profile focus banner */}
      {focus?.hasProfile && !category && !difficulty && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {focus.focusCategories.length > 0 ? (
                  focus.focusCategories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/questions?category=${encodeURIComponent(cat)}`}
                      className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors border border-primary/20"
                    >
                      {cat}
                    </Link>
                  ))
                ) : (
                  <Link
                    href="/profile"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    עדכן פרופיל ←
                  </Link>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {focus.name ? `שלום ${focus.name} —` : ""} מוקד מומלץ עבורך
                </p>
                {focus.hints.map((h, i) => (
                  <p key={i} className="text-xs text-muted-foreground mt-0.5">{h}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!focus?.hasProfile && !category && (
        <Card className="border-dashed border-muted">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <Link href="/profile" className="text-xs text-primary hover:underline">
              מלא/י פרטים אישיים ←
            </Link>
            <p className="text-xs text-muted-foreground text-right">
              מלא/י פרופיל כדי לקבל המלצות שאלות ומשוב מותאם אישית
            </p>
          </CardContent>
        </Card>
      )}

      <Suspense>
        <CategoryFilter />
      </Suspense>

      {questions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            {category ? `אין שאלות בקטגוריה "${category}"` : "אין שאלות עדיין — צריך לטעון את questions.json"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              question={q.question}
              category={q.category}
              difficulty={q.difficulty as "easy" | "medium" | "hard"}
              questionType={q.question_type}
              bestScore={q.bestScore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
