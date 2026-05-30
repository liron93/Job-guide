import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonrepair } from "jsonrepair";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth-user";
import { createAnthropicClient } from "@/lib/anthropic";
import { getRubric } from "@/lib/rubrics";

const RequestSchema = z.object({
  questionId: z.string(),
  lang: z.enum(["he", "en"]).default("he"),
});

const RevealSchema = z.object({
  model_answer_full: z.string().default(""),
  model_answer_pointers: z.array(z.string()).default([]),
  key_terms: z.array(z.object({
    term: z.string(),
    explanation: z.string(),
  })).default([]),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API — הגדר בהגדרות" }, { status: 400 });

  const { questionId, lang } = parsed.data;
  const admin = createAdminClient();

  const { data: question, error: qErr } = await admin
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (qErr || !question) {
    return NextResponse.json({ error: "שאלה לא נמצאה" }, { status: 404 });
  }

  // Return cached reveal immediately if available
  const cached = lang === "en" ? question.reveal_en : question.reveal;
  if (cached) {
    try {
      return NextResponse.json(RevealSchema.parse(cached));
    } catch { /* fall through to regenerate */ }
  }

  const rubric = getRubric(question.category);
  const rubricText = rubric
    ? rubric.criteria.map((c) => `- ${c.name}: ${c.description}`).join("\n")
    : "קריטריונים כלליים של PM.";

  const frameworksHint = question.frameworks?.length
    ? `\nמסגרות רלוונטיות: ${question.frameworks.join(", ")}`
    : "";

  const isEn = lang === "en";
  const systemPrompt = isEn
    ? `You are an experienced PM interviewer. Generate a perfect 10/10 model answer for a PM interview question.
Return ONLY a single JSON object — one line, no markdown, no extra text.
CRITICAL: No literal newlines inside string values — use \\n only.
Criteria: ${rubricText}

JSON structure:
{"model_answer_full":"Clarifying questions:\\n• question\\nAnalysis:\\n• point\\nRecommendation:\\n• point\\nSummary:\\nClosing sentence. (100-130 words)","model_answer_pointers":["Key point 1","Key point 2","Key point 3","Key point 4"],"key_terms":[{"term":"concept","explanation":"short explanation"}]}`
    : `אתה מראיין PM מנוסה. צור תשובת מופת לציון 10 לשאלת ריאיון PM.
החזר אובייקט JSON אחד בלבד — שורה אחת, ללא markdown, ללא טקסט נוסף.
חוק קריטי: אסור שורות חדשות אמיתיות בתוך ערכי string. השתמש ב-\\n בלבד.
קריטריונים: ${rubricText}

מבנה JSON:
{"model_answer_full":"שאלות הבהרה:\\n• שאלה\\nניתוח:\\n• נקודה\\nהמלצה:\\n• המלצה\\nסיכום:\\nמשפט. (100-130 מילה)","model_answer_pointers":["נקודה מרכזית 1","נקודה מרכזית 2","נקודה מרכזית 3","נקודה מרכזית 4"],"key_terms":[{"term":"מושג","explanation":"הסבר קצר"}]}`;

  const userPrompt = `קטגוריה: ${question.category}${frameworksHint}

שאלה: ${question.question}`;

  const anthropic = createAnthropicClient(authUser.claudeApiKey);

  let rawResponse: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    rawResponse = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
  } catch (err) {
    console.error("Anthropic error:", err);
    return NextResponse.json({ error: "שגיאה בקריאה ל-Claude" }, { status: 502 });
  }

  const extractJson = (raw: string): string => {
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    if (stripped.startsWith("{")) return stripped;
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? match[0] : stripped;
  };

  try {
    const repaired = jsonrepair(extractJson(rawResponse));
    const reveal = RevealSchema.parse(JSON.parse(repaired));
    // Cache in DB via admin client (shared table, fire and forget)
    const field = lang === "en" ? "reveal_en" : "reveal";
    admin.from("questions").update({ [field]: reveal }).eq("id", questionId);
    return NextResponse.json(reveal);
  } catch (err) {
    console.error("Failed to parse reveal:", err, "\nRaw:", rawResponse.slice(0, 400));
    return NextResponse.json({ error: "שגיאה בעיבוד התשובה" }, { status: 502 });
  }
}
