import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicClient } from "@/lib/anthropic";
import { getAuthUser } from "@/lib/auth-user";
import { getUserContext } from "@/lib/user-context";
import { z } from "zod";

const CandidateQuestionSchema = z.array(z.object({
  question: z.string(),
  why_impressive: z.string(),
  framing: z.string(),
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

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: `אתה מאמן ראיונות עבודה ל-Product Managers.
צור רשימת שאלות חכמות שהמועמד יכול לשאול את המראיין.
החזר JSON בלבד, ללא markdown — מערך של שאלות.

${userContext ? `פרופיל המועמד:\n${userContext}\n\n` : ""}
החזר JSON:
[
  {
    "question": "<שאלה חכמה לשאול את המראיין>",
    "why_impressive": "<למה השאלה הזו מרשימה — מה היא מראה עליך>",
    "framing": "<איך לנסח ולהקדים את השאלה כדי להשיג ציון 10 — משפט הפתיחה>"
  }
]

כללים:
- הכן 10-12 שאלות
- השאלות חייבות להיות ספציפיות לחברה, למוצר ולתפקיד — לא גנריות
- כסה נושאים: אסטרטגיית מוצר, אתגרים טכניים, תרבות צוות, מדדי הצלחה, roadmap, תחרות
- שאלות שמראות שחקרת לעומק ושיש לך חשיבת PM אמיתית
- framing — הקדמה קצרה שמראה ידע לפני השאלה (למשל: "ראיתי ש-X... ורציתי לשאול...")`,
    messages: [{
      role: "user",
      content: `חברה: ${job.company_name}\nתפקיד: ${job.role_title}\n\nתיאור המשרה:\n${(job.job_description ?? "").slice(0, 3000)}\n\n${job.company_summary ? `מידע על החברה: ${job.company_summary}` : ""}\n${job.product_summary ? `מידע על המוצר: ${job.product_summary}` : ""}`,
    }],
  });

  const fullText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const match = fullText.match(/\[[\s\S]*\]/);
  const raw = match ? match[0] : fullText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let questions: z.infer<typeof CandidateQuestionSchema>;
  try {
    questions = CandidateQuestionSchema.parse(JSON.parse(raw));
  } catch (err) {
    console.error("Parse error:", err, "\nRaw:", raw.slice(0, 500));
    return NextResponse.json({ error: "שגיאה בעיבוד השאלות" }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("jobs")
    .update({ candidate_questions: questions })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
