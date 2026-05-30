import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicClient } from "@/lib/anthropic";
import { getAuthUser } from "@/lib/auth-user";
import { getUserContext } from "@/lib/user-context";

export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const supabase = createClient();
  const anthropic = createAnthropicClient(authUser.claudeApiKey);
  const [userContext, { data: answers }] = await Promise.all([
    getUserContext(),
    supabase.from("answers").select("question_id, overall_score, questions(category)"),
  ]);

  if (!userContext) {
    return NextResponse.json({ error: "מלא/י פרטים אישיים תחילה" }, { status: 422 });
  }

  // Compute weak categories
  const byCategory: Record<string, number[]> = {};
  for (const a of answers ?? []) {
    const cat = (a.questions as unknown as { category: string } | null)?.category;
    if (cat && a.overall_score) {
      byCategory[cat] = [...(byCategory[cat] ?? []), a.overall_score];
    }
  }
  const categoryStats = Object.entries(byCategory)
    .map(([cat, scores]) => ({
      cat,
      avg: scores.reduce((s, n) => s + n, 0) / scores.length,
      count: scores.length,
    }))
    .sort((a, b) => a.avg - b.avg);

  const statsText = categoryStats.length
    ? `ביצועים לפי קטגוריה:\n${categoryStats.map((s) => `- ${s.cat}: ממוצע ${s.avg.toFixed(1)} (${s.count} תשובות)`).join("\n")}`
    : "עדיין לא תרגל/ה שאלות";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: `אתה מאמן ראיונות PM מנוסה. בנה תכנית לימוד מותאמת אישית.
החזר JSON בלבד:
{
  "summary": "<פסקה אחת — סיכום מה חשוב לך להתמקד בו ולמה>",
  "weeks": [
    {
      "week": 1,
      "title": "<כותרת השבוע>",
      "focus": "<מה מתרגלים>",
      "categories": ["<קטגוריה1>", "<קטגוריה2>"],
      "daily_goal": "<כמה שאלות ביום>",
      "tip": "<טיפ ספציפי לשבוע הזה>"
    }
  ],
  "priority_categories": ["<הכי חשוב>", "<שני>", "<שלישי>"],
  "key_focus": "<משפט אחד — מה הדבר הכי חשוב שצריך לשפר>"
}

תכנן 3 שבועות. בסס על הפרופיל והנתונים.`,
    messages: [{
      role: "user",
      content: `${userContext}\n\n${statsText}\n\nקטגוריות שאלות זמינות: Product Sense, Strategy, Metrics, Prioritization, Behavioral, Execution, Leadership, Estimation, Case Study, HR & Personal, Technical, Growth, Design, AI & Data, Interview Meta`
    }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "שגיאה בעיבוד" }, { status: 502 });
  }
}
