import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonrepair } from "jsonrepair";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-user";
import { createAnthropicClient } from "@/lib/anthropic";
import { getRubric } from "@/lib/rubrics";
import { getUserContext } from "@/lib/user-context";

const RequestSchema = z.object({
  questionId: z.string(),
  answerText: z.string().min(10),
  durationSeconds: z.number().optional(),
});

const EvaluationSchema = z.object({
  overall_score: z.union([z.number(), z.string()]).transform((v) => Math.round(Math.min(10, Math.max(1, Number(v))))),
  summary: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missing_from_answer: z.array(z.string()).default([]),
  cv_observations: z.array(z.object({
    cv_quote: z.string(),
    observation: z.string(),
  })).default([]),
  criterion_scores: z.record(z.string(), z.object({
    score: z.union([z.number(), z.string()]).transform((v) => Number(v)),
    comment: z.string().default(""),
  })).default({}),
  key_terms: z.array(z.object({
    term: z.string(),
    explanation: z.string(),
  })).default([]),
  model_answer_pointers: z.array(z.string()).default([]),
  model_answer_full: z.string().default(""),
  next_practice: z.string().default(""),
});

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API — הגדר בהגדרות" }, { status: 400 });

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { questionId, answerText, durationSeconds } = parsed.data;
  const supabase = createClient();
  const anthropic = createAnthropicClient(authUser.claudeApiKey);

  // Load question + CV in parallel
  const [{ data: question, error: qErr }, { data: cv }] = await Promise.all([
    supabase.from("questions").select("*").eq("id", questionId).single(),
    supabase.from("cvs").select("*").eq("is_active", true).single(),
  ]);

  if (qErr || !question) {
    return NextResponse.json({ error: "שאלה לא נמצאה" }, { status: 404 });
  }

  // Save answer before calling Claude
  const { data: savedAnswer, error: saveErr } = await supabase
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

  if (saveErr || !savedAnswer) {
    console.error("Save error:", saveErr);
    return NextResponse.json({ error: "שגיאה בשמירת התשובה" }, { status: 500 });
  }
  const answerId = savedAnswer.id;

  const rubric = getRubric(question.category);
  const userContext = await getUserContext();

  const systemPrompt = buildSystemPrompt(rubric, userContext);
  const userPrompt = buildUserPrompt(question, answerText, cv?.extracted_text ?? null);

  let rawResponse: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
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

  // Extract JSON block from raw response (strip markdown fences, leading text)
  const extractJson = (raw: string): string => {
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    if (stripped.startsWith("{")) return stripped;
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? match[0] : stripped;
  };

  let evaluation: z.infer<typeof EvaluationSchema>;
  try {
    const repaired = jsonrepair(extractJson(rawResponse));
    evaluation = EvaluationSchema.parse(JSON.parse(repaired));
  } catch (err) {
    console.error("Failed to parse evaluation:", err, "\nRaw:", rawResponse.slice(0, 800));
    return NextResponse.json({ error: "תשובה לא תקינה מ-Claude" }, { status: 502 });
  }

  // Anti-hallucination: filter cv_observations
  evaluation.cv_observations = cv?.extracted_text
    ? evaluation.cv_observations.filter((obs) => cv.extracted_text.includes(obs.cv_quote))
    : [];

  // Update saved answer with evaluation
  const { error: updateErr } = await supabase
    .from("answers")
    .update({ evaluation, overall_score: evaluation.overall_score })
    .eq("id", answerId);

  if (updateErr) {
    console.error("Failed to persist evaluation to DB:", updateErr);
    // Still return evaluation so user sees feedback in this session
    return NextResponse.json({ answerId, evaluation, persistError: true });
  }

  return NextResponse.json({ answerId, evaluation });
}

function buildSystemPrompt(rubric: ReturnType<typeof getRubric>, userContext: string): string {
  const rubricText = rubric
    ? rubric.criteria.map((c) => `- ${c.name}: ${c.description}`).join("\n")
    : "קריטריונים כלליים של PM.";

  const profileNote = userContext
    ? `=== פרופיל ===\n${userContext.slice(0, 600)}\nהתייחס/י לרקע בסיכום ובתשובת המופת — דוגמאות מהניסיון של המועמד/ת.`
    : "";

  return `אתה מראיין PM מנוסה. הערך את התשובה והחזר אובייקט JSON אחד בלבד — שורה אחת, ללא markdown, ללא טקסט נוסף.
חוק קריטי: אסור בהחלט שורות חדשות אמיתיות בתוך ערכי string. במקום זאת השתמש ב-\\n בלבד.
${profileNote}
קריטריונים: ${rubricText}

מבנה JSON (החזר בשורה אחת):
{"overall_score":7,"summary":"2-3 משפטים ברצף","strengths":["חוזק1","חוזק2","חוזק3"],"weaknesses":["חולשה1","חולשה2"],"missing_from_answer":["חסר1","חסר2"],"cv_observations":[],"criterion_scores":{"קריטריון":{"score":7,"comment":"משפט"}},"key_terms":[{"term":"מושג","explanation":"הסבר"}],"model_answer_pointers":["נקודה1","נקודה2","נקודה3"],"model_answer_full":"שאלות הבהרה:\\n• שאלה\\nניתוח:\\n• נקודה\\nהמלצה:\\n• המלצה\\nסיכום:\\nמשפט סיום. (100-130 מילה)","next_practice":"המלצה לתרגול הבא"}`;
}

function buildUserPrompt(
  question: { question: string; category: string; frameworks?: string[] },
  answerText: string,
  cvText: string | null
): string {
  const cvSection = cvText
    ? `\n\nCV:\n${cvText.slice(0, 1500)}`
    : "";

  const frameworksHint = question.frameworks?.length
    ? `\n\nמסגרות רלוונטיות: ${question.frameworks.join(", ")}`
    : "";

  return `קטגוריה: ${question.category}${frameworksHint}

שאלה: ${question.question}

תשובת המועמד/ת:
${answerText}${cvSection}`;
}
