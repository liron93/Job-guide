import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-user";
import { createAnthropicClient } from "@/lib/anthropic";
import { getUserContext } from "@/lib/user-context";

const Schema = z.object({
  persona: z.enum(["hr", "manager"]),
  mode: z.enum(["free", "qa"]),
  language: z.enum(["he", "en"]),
  jobTitle: z.string().optional(),
  jobDescription: z.string().optional(),
});

function buildSystemPrompt(
  persona: "hr" | "manager",
  language: "he" | "en",
  jobTitle: string,
  userContext: string
): string {
  const isHe = language === "he";

  if (persona === "hr") {
    return isHe
      ? `אתה דנה לוי, מגייסת בכירה. אתה מראיינת מועמד לתפקיד: ${jobTitle || "תפקיד לא מוגדר"}.
נהל ראיון HR אמיתי ומקצועי. שאל שאלות על: מוטיבציה, רקע מקצועי, חוזקות וחולשות, ציפיות שכר, תרבות עבודה מועדפת, מה מחפשים בתפקיד הבא.
${userContext ? `מידע על המועמד:\n${userContext}` : ""}
כללים: שאל שאלה אחת בכל פעם. חכה לתשובה לפני שממשיך. היה אנושי ומקצועי. אל תשבח יתר על המידה. אם תשובה קצרה — בקש להרחיב.
התחל: הצג את עצמך ובקש מהמועמד להציג את עצמו בקצרה.`
      : `You are Dana Levi, Senior HR Recruiter. You're interviewing a candidate for: ${jobTitle || "unspecified role"}.
Conduct a real, professional HR interview. Ask about: motivation, professional background, strengths/weaknesses, salary expectations, work culture preferences, what they're looking for.
${userContext ? `Candidate info:\n${userContext}` : ""}
Rules: Ask one question at a time. Wait for the answer before continuing. Be human and professional. Don't over-praise. If an answer is brief — ask to elaborate.
Start: Introduce yourself and ask the candidate to briefly introduce themselves.`;
  }

  return isHe
    ? `אתה רועי כהן, מנהל מוצר בכיר ומנהל ישיר לתפקיד: ${jobTitle || "תפקיד לא מוגדר"}.
אתה מראיין מועמד לתפקיד הזה. הראיון צריך לבדוק: ניסיון רלוונטי, חשיבה מוצרית, יכולות אנליטיות, איך המועמד מתמודד עם אתגרים בתפקיד הספציפי, תהליך קבלת החלטות.
${userContext ? `מידע על המועמד:\n${userContext}` : ""}
כללים: התמקד בתפקיד הספציפי. שאל שאלות מצביות (tell me about a time...). לחץ על פרטים וחפור עמוק. שאל שאלה אחת בכל פעם.
התחל: ספר על התפקיד בקצרה ובקש מהמועמד לספר מה הוביל אותו להגיש מועמדות.`
    : `You are Roy Cohen, Senior Product Manager and direct manager for the role: ${jobTitle || "unspecified role"}.
You're interviewing a candidate. Focus on: relevant experience, product thinking, analytical skills, how they handle challenges specific to this role, decision-making process.
${userContext ? `Candidate info:\n${userContext}` : ""}
Rules: Focus on the specific role. Ask situational questions (tell me about a time...). Press for details and dig deep. Ask one question at a time.
Start: Briefly describe the role and ask the candidate what led them to apply.`;
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { persona, mode, language, jobTitle = "", jobDescription = "" } = parsed.data;
  const userContext = await getUserContext() ?? "";
  const anthropic = createAnthropicClient(authUser.claudeApiKey);
  const systemPrompt = buildSystemPrompt(persona, language, jobTitle, userContext);

  if (mode === "qa") {
    const isHe = language === "he";
    const prompt = isHe
      ? `צור רשימה של 8 שאלות ראיון לפרסונה ${persona === "hr" ? "HR מגייסת" : "מנהל ישיר"} לתפקיד: ${jobTitle || "PM כללי"}.
${jobDescription ? `תיאור תפקיד:\n${jobDescription}\n` : ""}
החזר JSON בלבד בפורמט: { "questions": ["שאלה 1", "שאלה 2", ...] }
שאלות מגוונות, ממוקדות, מאתגרות. לא כלליות מדי.`
      : `Generate 8 interview questions for a ${persona === "hr" ? "HR recruiter" : "direct manager"} interviewing for: ${jobTitle || "PM role"}.
${jobDescription ? `Job description:\n${jobDescription}\n` : ""}
Return JSON only: { "questions": ["question 1", "question 2", ...] }
Questions should be varied, focused, and challenging.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });

    const { questions } = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ questions, systemPrompt });
  }

  // Free mode — return systemPrompt and let the client start the conversation
  return NextResponse.json({ systemPrompt });
}
