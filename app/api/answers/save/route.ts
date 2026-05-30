import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-user";

const RequestSchema = z.object({
  questionId: z.string(),
  answerText: z.string().min(10),
  durationSeconds: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const { questionId, answerText, durationSeconds } = parsed.data;
  const supabase = createClient();

  const { data: cv } = await supabase
    .from("cvs")
    .select("id")
    .eq("is_active", true)
    .single();

  const { data, error } = await supabase
    .from("answers")
    .insert({
      user_id: authUser.id,
      question_id: questionId,
      cv_id: cv?.id ?? null,
      answer_text: answerText,
      evaluation: null,
      overall_score: null,
      duration_seconds: durationSeconds ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "שגיאה בשמירת התשובה" }, { status: 500 });
  }

  return NextResponse.json({ answerId: data.id });
}
