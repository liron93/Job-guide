import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { jsonrepair } from "jsonrepair";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateReveal(question: { id: string; question: string; category: string; frameworks?: string[] }) {
  const frameworksHint = question.frameworks?.length
    ? `\nמסגרות רלוונטיות: ${question.frameworks.join(", ")}`
    : "";

  const systemPrompt = `אתה מראיין PM מנוסה. צור תשובת מופת לציון 10 לשאלת ריאיון PM.
CRITICAL: Return ONLY a single JSON object. No markdown, no backticks, no text before or after.
CRITICAL: No literal newlines inside string values — use \\n only.
CRITICAL: No unescaped quotes inside strings.

JSON structure (one line):
{"model_answer_full":"הקדמה:\\n• נקודה\\nניתוח:\\n• נקודה\\nסיכום:\\nמשפט.","model_answer_pointers":["נקודה 1","נקודה 2","נקודה 3","נקודה 4"],"key_terms":[{"term":"מושג","explanation":"הסבר"}]}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    system: systemPrompt,
    messages: [{ role: "user", content: `קטגוריה: ${question.category}${frameworksHint}\n\nשאלה: ${question.question}` }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const json = stripped.startsWith("{") ? stripped : (raw.match(/\{[\s\S]*\}/)?.[0] ?? stripped);
  return JSON.parse(jsonrepair(json));
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question, category, frameworks, question_type, reveal")
    .eq("question_type", "open")
    .is("reveal", null);

  if (error) { console.error(error.message); process.exit(1); }
  if (!questions?.length) { console.log("All reveals already cached."); return; }

  console.log(`Generating reveals for ${questions.length} questions (using claude-haiku)...`);

  let done = 0;
  let failed = 0;

  for (const q of questions) {
    try {
      const reveal = await generateReveal(q);
      await supabase.from("questions").update({ reveal }).eq("id", q.id);
      done++;
      process.stdout.write(`\r${done}/${questions.length} done, ${failed} failed`);
      await sleep(300); // stay within rate limits
    } catch (err) {
      failed++;
      console.error(`\nFailed ${q.id}:`, err instanceof Error ? err.message : err);
      await sleep(1000);
    }
  }

  console.log(`\nDone. ${done} generated, ${failed} failed.`);
}

run();
