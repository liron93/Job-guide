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

  let query = admin.from("questions").select("*");

  if (category) query = query.eq("category", category);
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data: questions, error } = await query.order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (answered !== null) {
    const { data: answerRows } = await supabase
      .from("answers")
      .select("question_id, overall_score")
      .order("overall_score", { ascending: false });

    const bestScoreByQuestion = new Map<string, number>();
    for (const row of answerRows ?? []) {
      if (!bestScoreByQuestion.has(row.question_id) || (row.overall_score ?? 0) > (bestScoreByQuestion.get(row.question_id) ?? 0)) {
        bestScoreByQuestion.set(row.question_id, row.overall_score);
      }
    }

    const filtered = (questions ?? []).filter((q) => {
      const hasAnswer = bestScoreByQuestion.has(q.id);
      return answered === "true" ? hasAnswer : !hasAnswer;
    });

    return NextResponse.json(
      filtered.map((q) => ({ ...q, best_score: bestScoreByQuestion.get(q.id) ?? null }))
    );
  }

  // Always join best scores
  const { data: answerRows } = await supabase
    .from("answers")
    .select("question_id, overall_score");

  const bestScoreByQuestion = new Map<string, number>();
  for (const row of answerRows ?? []) {
    if (!bestScoreByQuestion.has(row.question_id) || (row.overall_score ?? 0) > (bestScoreByQuestion.get(row.question_id) ?? 0)) {
      bestScoreByQuestion.set(row.question_id, row.overall_score);
    }
  }

  return NextResponse.json(
    (questions ?? []).map((q) => ({ ...q, best_score: bestScoreByQuestion.get(q.id) ?? null }))
  );
}
