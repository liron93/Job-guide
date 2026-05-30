import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-user";

const Schema = z.object({
  questionId: z.string(),
  selectedAnswer: z.string(),
  score: z.number().min(0).max(10),
});

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { questionId, selectedAnswer, score } = parsed.data;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("answers")
    .insert({
      user_id: authUser.id,
      question_id: questionId,
      answer_text: selectedAnswer,
      overall_score: score,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ answerId: data.id });
}
