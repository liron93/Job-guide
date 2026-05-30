import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicClient } from "@/lib/anthropic";
import { getAuthUser } from "@/lib/auth-user";
import { getUserContext } from "@/lib/user-context";
import { z } from "zod";

const RequestSchema = z.object({
  question: z.string().min(5),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "שאלה לא תקינה" }, { status: 400 });

  const { question } = parsed.data;
  const supabase = createClient();
  const anthropic = createAnthropicClient(authUser.claudeApiKey);

  const [{ data: job }, userContext] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.id).single(),
    getUserContext(),
  ]);

  if (!job) return NextResponse.json({ error: "משרה לא נמצאה" }, { status: 404 });

  const cv = await supabase.from("cvs").select("extracted_text").eq("is_active", true).single();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: `אתה מאמן ראיונות עבודה מומחה ל-Product Managers.
תפקידך לכתוב תשובה מושלמת (ציון 10) לשאלת ראיון, בגוף ראשון, כאילו המועמד/ת עצמו/ה עונה.

${userContext ? `פרופיל המועמד/ת:\n${userContext}\n` : ""}
${cv.data?.extracted_text ? `קורות חיים:\n${cv.data.extracted_text.slice(0, 2000)}\n` : ""}

כללים לתשובה מושלמת:
- כתוב בגוף ראשון, שפה טבעית ואנושית כמו בשיחה אמיתית
- שלב דוגמאות ספציפיות מהניסיון של המועמד/ת
- אורך: 80-130 מילה — לא ארוך מדי, לא קצר מדי
- סיים במשפט שמראה ערך ואמביציה
- אל תתחיל ב"בוודאי" או "כמובן" — תתחיל ישירות
- החזר רק את התשובה עצמה, ללא הסברים או מבוא`,
    messages: [{
      role: "user",
      content: `חברה: ${job.company_name}\nתפקיד: ${job.role_title}\n\nשאלת הראיון:\n${question}`,
    }],
  });

  const answer = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  const newEntry = {
    id: crypto.randomUUID(),
    question,
    answer,
    created_at: new Date().toISOString(),
  };

  const existing: typeof newEntry[] = Array.isArray(job.my_questions) ? job.my_questions : [];
  const updated = [newEntry, ...existing];

  const { error } = await supabase
    .from("jobs")
    .update({ my_questions: updated })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(newEntry);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const { entryId, question, feedback } = await request.json();
  const supabase = createClient();
  const anthropic = createAnthropicClient(authUser.claudeApiKey);

  const [{ data: job }, userContext] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.id).single(),
    getUserContext(),
  ]);
  if (!job) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const cv = await supabase.from("cvs").select("extracted_text").eq("is_active", true).single();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: `אתה מאמן ראיונות עבודה מומחה ל-Product Managers.
תפקידך לכתוב תשובה מושלמת (ציון 10) לשאלת ראיון, בגוף ראשון, כאילו המועמד/ת עצמו/ה עונה.
חשוב: כתוב תשובה שונה מהתשובה הקודמת — זווית אחרת, דוגמאות אחרות, גישה טיפה שונה.
${feedback ? `המועמד ביקש שינוי ספציפי: "${feedback}" — חשוב מאוד לקחת זאת בחשבון בתשובה החדשה.` : ""}

${userContext ? `פרופיל המועמד/ת:\n${userContext}\n` : ""}
${cv.data?.extracted_text ? `קורות חיים:\n${cv.data.extracted_text.slice(0, 2000)}\n` : ""}

כללים לתשובה מושלמת:
- כתוב בגוף ראשון, שפה טבעית ואנושית כמו בשיחה אמיתית
- שלב דוגמאות ספציפיות מהניסיון של המועמד/ת
- אורך: 80-130 מילה
- סיים במשפט שמראה ערך ואמביציה
- אל תתחיל ב"בוודאי" או "כמובן"
- החזר רק את התשובה עצמה`,
    messages: [{
      role: "user",
      content: `חברה: ${job.company_name}\nתפקיד: ${job.role_title}\n\nשאלת הראיון:\n${question}`,
    }],
  });

  const answer = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  const existing: { id: string; question: string; answer: string; created_at: string }[] =
    Array.isArray(job.my_questions) ? job.my_questions : [];
  const updated = existing.map((q) => (q.id === entryId ? { ...q, answer } : q));

  const { error } = await supabase.from("jobs").update({ my_questions: updated }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ answer });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { entryId } = await request.json();
  const supabase = createClient();

  const { data: job } = await supabase.from("jobs").select("my_questions").eq("id", params.id).single();
  if (!job) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const updated = (Array.isArray(job.my_questions) ? job.my_questions : []).filter(
    (q: { id: string }) => q.id !== entryId
  );

  const { error } = await supabase.from("jobs").update({ my_questions: updated }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
