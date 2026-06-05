import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnthropicClient } from "@/lib/anthropic";

const ScannedJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional().default(""),
  url: z.string().url(),
  description: z.string(),
});

const RequestSchema = z.object({
  jobs: z.array(ScannedJobSchema).max(20),
});

const AnalysisSchema = z.object({
  fit_score: z.number().min(1).max(10),
  fit_summary: z.string(),
  fit_pros: z.array(z.string()),
  fit_cons: z.array(z.string()),
  should_apply: z.boolean(),
  company_summary: z.string(),
  product_summary: z.string(),
});

function buildUserContext(profile: Record<string, unknown> | null, cvText: string | null): string {
  if (!profile && !cvText) return "";
  const parts: string[] = [];
  if (profile) {
    if (profile.full_name) parts.push(`שם: ${profile.full_name}`);
    if (profile.job_title) parts.push(`תפקיד נוכחי: ${profile.job_title}`);
    if (profile.years_experience != null) parts.push(`שנות ניסיון: ${profile.years_experience}`);
    if (Array.isArray(profile.experience_areas) && profile.experience_areas.length)
      parts.push(`תחומי ניסיון: ${profile.experience_areas.join(", ")}`);
    if (profile.looking_for) parts.push(`מה מחפש/ת: ${profile.looking_for}`);
    if (profile.target_companies) parts.push(`חברות יעד: ${profile.target_companies}`);
    if (profile.strengths) parts.push(`חוזקות: ${profile.strengths}`);
    if (profile.improvement_areas) parts.push(`תחומים לשיפור: ${profile.improvement_areas}`);
  }
  if (cvText) parts.push(`\nקורות חיים:\n---\n${cvText.slice(0, 3000)}\n---`);
  return parts.length ? `פרופיל המשתמש/ת:\n${parts.join("\n")}` : "";
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look up the designated scan user
  const userEmail = process.env.CRON_USER_EMAIL;
  if (!userEmail) return NextResponse.json({ error: "CRON_USER_EMAIL not set" }, { status: 500 });

  const { data: authUser } = await admin.auth.admin.listUsers();
  const user = authUser?.users.find((u) => u.email === userEmail);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [{ data: profile }, { data: cv }] = await Promise.all([
    admin.from("user_profile").select("*").eq("user_id", user.id).maybeSingle(),
    admin.from("cvs").select("extracted_text").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
  ]);

  const claudeApiKey = (profile as Record<string, unknown> | null)?.claude_api_key as string | undefined;
  if (!claudeApiKey) {
    return NextResponse.json({ error: "No Claude API key for user" }, { status: 400 });
  }

  const anthropic = createAnthropicClient(claudeApiKey);
  const userContext = buildUserContext(profile as Record<string, unknown> | null, cv?.extracted_text ?? null);
  const contextSection = userContext ? `${userContext}\n\n` : "";

  const { jobs: scannedJobs } = parsed.data;
  let savedCount = 0;
  const errors: string[] = [];

  for (const job of scannedJobs) {
    try {
      // Skip if already saved (same URL)
      const { data: existing } = await admin
        .from("jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("job_url", job.url)
        .maybeSingle();
      if (existing) continue;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: `אתה מייעץ לאנשי חיפוש עבודה. תנתח התאמה בין משרה למועמד ותחזיר JSON בלבד, ללא markdown.

${contextSection}החזר JSON בפורמט:
{
  "fit_score": <1-10>,
  "fit_summary": "<פסקה קצרה בעברית — האם המועמד/ת מתאים/ה ומדוע>",
  "fit_pros": ["<יתרון 1>", "<יתרון 2>", "<יתרון 3>"],
  "fit_cons": ["<חיסרון 1>", "<חיסרון 2>"],
  "should_apply": <true|false>,
  "company_summary": "<מה החברה עושה — 2 משפטים>",
  "product_summary": "<מה המוצר הספציפי — 2 משפטים>"
}
should_apply = true אם fit_score >= 6`,
        messages: [{
          role: "user",
          content: `חברה: ${job.company}\nתפקיד: ${job.title}\nמיקום: ${job.location}\n\nתיאור:\n${job.description.slice(0, 4000)}`,
        }],
      });

      const raw = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("")
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      const analysis = AnalysisSchema.parse(JSON.parse(raw));

      await admin.from("jobs").insert({
        user_id: user.id,
        company_name: job.company,
        role_title: job.title,
        job_url: job.url,
        job_description: job.description,
        source: "auto_scan",
        ...analysis,
      });

      savedCount++;
    } catch (err) {
      errors.push(`${job.company} / ${job.title}: ${err}`);
    }
  }

  // Log the scan
  await admin.from("scan_logs").insert({
    user_id: user.id,
    jobs_found: scannedJobs.length,
    jobs_saved: savedCount,
    status: "success",
  });

  return NextResponse.json({ found: scannedJobs.length, saved: savedCount, errors });
}
