import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicClient } from "@/lib/anthropic";
import { getAuthUser } from "@/lib/auth-user";
import { getUserContext } from "@/lib/user-context";
import { z } from "zod";

const QuestionSchema = z.array(z.object({
  question: z.string(),
  category: z.string(),
  suggested_answer: z.string(),
  why_asked: z.string(),
}));

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const supabase = createClient();
  const anthropic = createAnthropicClient(authUser.claudeApiKey);

  const [{ data: job }, userContext] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.id).single(),
    getUserContext(),
  ]);

  if (!job) return NextResponse.json({ error: "משרה לא נמצאה" }, { status: 404 });

  const contextSection = userContext || "לא הוגדר פרופיל משתמש";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: `אתה מאמן ראיונות עבודה ל-Product Managers.
תכין רשימת שאלות ממוקדות לראיון עבודה עם תשובות מוצעות מותאמות אישית.
החזר JSON בלבד, ללא markdown — מערך של שאלות.

${contextSection}

החזר JSON:
[
  {
    "question": "<שאלה שישאלו בראיון>",
    "category": "<HR | Behavioral | Product | Strategy | Technical>",
    "suggested_answer": "<תשובה מוצעת בעברית, מותאמת לרקע המועמד/ת ולמשרה — 80-120 מילה, כתובה בגוף ראשון>",
    "why_asked": "<מה הם בודקים בשאלה הזו — משפט אחד>"
  }
]

כללים:
- הכן 12-15 שאלות
- שלב שאלות HR, Behavioral, Product ו-Strategy
- שאלות Product ו-Strategy חייבות להיות ספציפיות לחברה ולמוצר של המשרה
- התשובות חייבות להיות מותאמות לרקע ולניסיון שמופיע בקורות החיים
- השתמש בדוגמאות ספציפיות מהרקע של המועמד/ת בתשובות`,
    messages: [{
      role: "user",
      content: `חברה: ${job.company_name}\nתפקיד: ${job.role_title}\n\nתיאור המשרה:\n${(job.job_description ?? "").slice(0, 3000)}`
    }],
  });

  const fullText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const match = fullText.match(/\[[\s\S]*\]/);
  const raw = match ? match[0] : fullText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let questions: z.infer<typeof QuestionSchema>;
  try {
    questions = QuestionSchema.parse(JSON.parse(raw));
  } catch (err) {
    console.error("Parse error:", err, "\nRaw:", raw.slice(0, 500));
    return NextResponse.json({ error: "שגיאה בעיבוד השאלות" }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("jobs")
    .update({ tailored_questions: questions })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const { questionIndex, feedback } = await request.json();
  const supabase = createClient();
  const anthropic = createAnthropicClient(authUser.claudeApiKey);

  const [{ data: job }, userContext] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.id).single(),
    getUserContext(),
  ]);
  if (!job) return NextResponse.json({ error: "משרה לא נמצאה" }, { status: 404 });

  const questions: z.infer<typeof QuestionSchema> = Array.isArray(job.tailored_questions)
    ? job.tailored_questions
    : [];
  const q = questions[questionIndex];
  if (!q) return NextResponse.json({ error: "שאלה לא נמצאה" }, { status: 404 });

  const cv = await supabase.from("cvs").select("extracted_text").eq("is_active", true).single();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: `אתה מאמן ראיונות עבודה ל-Product Managers.
כתוב תשובה מוצעת חדשה לשאלת ראיון, בגוף ראשון, מותאמת לרקע המועמד/ת.
${feedback ? `המועמד/ת ביקש/ה שינוי ספציפי: "${feedback}" — חשוב מאוד לקחת זאת בחשבון.` : "כתוב גישה שונה מהתשובה הקודמת."}

${userContext ? `פרופיל המועמד/ת:\n${userContext}\n` : ""}
${cv.data?.extracted_text ? `קורות חיים:\n${cv.data.extracted_text.slice(0, 2000)}\n` : ""}

כללים: גוף ראשון, שפה טבעית, 80-120 מילה, דוגמאות מהניסיון, החזר רק את התשובה.`,
    messages: [{
      role: "user",
      content: `חברה: ${job.company_name}\nתפקיד: ${job.role_title}\n\nשאלה: ${q.question}\n\nתשובה קודמת:\n${q.suggested_answer}`,
    }],
  });

  const newAnswer = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  const updated = questions.map((item, i) =>
    i === questionIndex ? { ...item, suggested_answer: newAnswer } : item
  );

  const { error } = await supabase
    .from("jobs")
    .update({ tailored_questions: updated })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suggested_answer: newAnswer });
}
