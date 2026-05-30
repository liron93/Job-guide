import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-user";
import { createAnthropicClient } from "@/lib/anthropic";
import { getUserContext } from "@/lib/user-context";

const RequestSchema = z.object({
  job_description: z.string().optional().default(""),
  job_url: z.string().url().optional(),
}).refine((d) => d.job_description.length >= 50 || !!d.job_url, {
  message: "יש לספק תיאור משרה או לינק",
});

const AnalysisSchema = z.object({
  company_name: z.string(),
  role_title: z.string(),
  fit_score: z.number().min(1).max(10),
  fit_summary: z.string(),
  fit_pros: z.array(z.string()),
  fit_cons: z.array(z.string()),
  should_apply: z.boolean(),
  company_summary: z.string(),
  product_summary: z.string(),
});

async function fetchJobText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 8000);
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API — הגדר בהגדרות" }, { status: 400 });

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { job_description, job_url } = parsed.data;

  let jobText = job_description;
  if (job_url && jobText.length < 200) {
    try {
      jobText = await fetchJobText(job_url);
    } catch {
      if (!jobText) return NextResponse.json({ error: "לא ניתן להוריד את המשרה מהלינק — הדבק/י את התיאור ידנית" }, { status: 422 });
    }
  }

  if (jobText.length < 50) {
    return NextResponse.json({ error: "לא נמצא תוכן מספיק — הדבק/י את תיאור המשרה ידנית" }, { status: 422 });
  }

  const supabase = createClient();
  const userContext = await getUserContext();
  const contextSection = userContext ? `${userContext}\n\n` : "לא הוגדר פרופיל משתמש.\n\n";

  const anthropic = createAnthropicClient(authUser.claudeApiKey);
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: `אתה מייעץ לאנשי חיפוש עבודה.
תנתח התאמה בין משרה למועמד ותחזיר JSON בלבד, ללא markdown.

${contextSection}החזר JSON בפורמט:
{
  "company_name": "<שם החברה>",
  "role_title": "<כותרת התפקיד>",
  "fit_score": <1-10>,
  "fit_summary": "<פסקה אחת בעברית — האם המועמד/ת מתאים/ה ומדוע>",
  "fit_pros": ["<יתרון ספציפי 1>", "<יתרון 2>", "<יתרון 3>"],
  "fit_cons": ["<חיסרון או פער 1>", "<חיסרון 2>"],
  "should_apply": <true|false>,
  "company_summary": "<מה החברה עושה, גודלה, שוק יעד — 2-3 משפטים>",
  "product_summary": "<מה המוצר הספציפי הרלוונטי לתפקיד — 2-3 משפטים>"
}

קריטריונים:
- should_apply = true אם fit_score >= 6
- fit_pros: יתרונות ספציפיים מהרקע של המועמד/ת שרלוונטיים לדרישות המשרה
- fit_cons: פערים אמיתיים, לא "אין ניסיון ב-X" אם לא נדרש
- אם אין קורות חיים, בסס ניתוח על דרישות המשרה בלבד`,
    messages: [{ role: "user", content: `תיאור המשרה:\n${jobText}` }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let analysis: z.infer<typeof AnalysisSchema>;
  try {
    analysis = AnalysisSchema.parse(JSON.parse(raw));
  } catch (err) {
    console.error("Parse error:", err, raw);
    return NextResponse.json({ error: "שגיאה בניתוח המשרה" }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({ user_id: authUser.id, job_description: jobText, job_url: job_url ?? null, ...analysis })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
