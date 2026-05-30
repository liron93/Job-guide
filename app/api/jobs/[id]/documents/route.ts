import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicClient } from "@/lib/anthropic";
import { getAuthUser } from "@/lib/auth-user";
import { getUserContext } from "@/lib/user-context";
import { z } from "zod";

const DocsSchema = z.object({
  tailored_cv: z.string(),
  cover_letter: z.string(),
});

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
  if (!userContext) return NextResponse.json({ error: "יש למלא פרטים אישיים תחילה" }, { status: 422 });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    system: `You are an expert resume editor for Product Managers.
Return JSON only — no markdown, no text before or after the JSON.

CRITICAL RULES:
1. ALL output must be 100% in English — translate every Hebrew word, keep zero Hebrew characters
2. The CV must be EXACTLY 1 page — do not add any content, do not expand bullet points
3. Keep the EXACT same structure, sections, and number of bullet points as the original CV
4. Only change: translate Hebrew→English, swap in job-relevant keywords where natural

Candidate's original CV:
${userContext}

Return JSON in exactly this format:
{
  "tailored_cv": "...",
  "cover_letter": "..."
}

CV instructions (tailored_cv):
- Translate the original CV to English word-for-word, preserving every section and bullet
- Do NOT add new bullet points, do NOT expand existing ones, do NOT add sections
- Only substitute keywords from the job description where they fit naturally
- Keep the same line count and density as the original

Cover letter instructions (cover_letter):
- English only, 3 short paragraphs, first person
- Paragraph 1: Who I am and why this role
- Paragraph 2: One concrete relevant achievement from my experience
- Paragraph 3: Why this company specifically + closing line`,
    messages: [{
      role: "user",
      content: `Company: ${job.company_name}\nRole: ${job.role_title}\n\nJob description:\n${(job.job_description ?? "").slice(0, 3000)}`,
    }],
  });

  const fullText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const match = fullText.match(/\{[\s\S]*\}/);
  const raw = match ? match[0] : fullText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let docs: z.infer<typeof DocsSchema>;
  try {
    docs = DocsSchema.parse(JSON.parse(raw));
  } catch (err) {
    console.error("Parse error:", err, "\nRaw:", raw.slice(0, 500));
    return NextResponse.json({ error: "שגיאה בעיבוד המסמכים" }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("jobs")
    .update(docs)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
