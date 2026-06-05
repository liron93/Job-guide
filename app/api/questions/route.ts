import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const answered = searchParams.get("answered");

  const supabase = createClient();
  const admin = createAdminClient();

  // Fetch questions + best scores in parallel
  let query = admin.from("questions").select("*");
  if (category) query = query.eq("category", category);
  if (difficulty) query = query.eq("difficulty", difficulty);

  const [{ data: questions, error }, { data: answerRows }] = await Promise.all([
    query.order("created_at", { ascending: true }),
    supabase.from("answers").select("question_id, overall_score").order("overall_score", { ascending: false }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bestScoreByQuestion = new Map<string, number>();
  for (const row of answerRows ?? []) {
    const existing = bestScoreByQuestion.get(row.question_id) ?? 0;
    if ((row.overall_score ?? 0) > existing) {
      bestScoreByQuestion.set(row.question_id, row.overall_score);
    }
  }

  const withScores = (questions ?? []).map(q => ({
    ...q,
    best_score: bestScoreByQuestion.get(q.id) ?? null,
  }));

  if (answered !== null) {
    return NextResponse.json(
      withScores.filter(q => answered === "true" ? q.best_score !== null : q.best_score === null)
    );
  }

  return NextResponse.json(withScores);
}
