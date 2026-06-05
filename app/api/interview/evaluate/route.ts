import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-user";
import { createAnthropicClient } from "@/lib/anthropic";

const Schema = z.object({
  question: z.string(),
  answer: z.string(),
  persona: z.enum(["hr", "manager"]),
  language: z.enum(["he", "en"]),
  jobTitle: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { question, answer, persona, language, jobTitle = "" } = parsed.data;
  const anthropic = createAnthropicClient(authUser.claudeApiKey);
  const isHe = language === "he";

  const prompt = isHe
    ? `אתה מעריך תשובה לשאלת ראיון.
פרסונת המראיין: ${persona === "hr" ? "HR מגייסת" : `מנהל ישיר לתפקיד ${jobTitle}`}
שאלה: ${question}
תשובת המועמד: ${answer}

החזר JSON בלבד:
{
  "score": <1-10>,
  "strengths": ["חוזקה 1", "חוזקה 2"],
  "improvements": ["שיפור 1", "שיפור 2"],
  "better_answer": "דוגמת תשובה טובה יותר בקצרה"
}`
    : `You are evaluating an interview answer.
Interviewer persona: ${persona === "hr" ? "HR Recruiter" : `Direct Manager for ${jobTitle}`}
Question: ${question}
Candidate's answer: ${answer}

Return JSON only:
{
  "score": <1-10>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "better_answer": "brief example of a better answer"
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "Failed to evaluate" }, { status: 500 });

  return NextResponse.json(JSON.parse(jsonMatch[0]));
}
