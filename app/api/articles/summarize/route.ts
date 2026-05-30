import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonrepair } from "jsonrepair";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-user";
import { createAnthropicClient } from "@/lib/anthropic";

const RequestSchema = z.object({
  url: z.string().url(),
});

const SummarySchema = z.object({
  title: z.string(),
  article_published_at: z.string().nullable().optional().default(null),
  summary: z.string(),
  why_worth_reading: z.array(z.string()).optional().default([]),
  key_points: z.array(z.string()),
  pm_relevance_score: z.number().min(1).max(10),
  pm_relevance_reason: z.string(),
  recommendation: z.enum(["must_read", "worth_reading", "skip"]),
  estimated_read_minutes: z.number(),
});

async function fetchArticleText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();

  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned.slice(0, 10000);
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API — הגדר בהגדרות" }, { status: 400 });

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "URL לא תקין" }, { status: 400 });
  }

  const { url } = parsed.data;

  let articleText: string;
  try {
    articleText = await fetchArticleText(url);
  } catch (err) {
    console.error("Fetch error:", err);
    return NextResponse.json({ error: "לא ניתן להוריד את המאמר. ייתכן שהאתר חוסם גישה אוטומטית." }, { status: 422 });
  }

  if (articleText.length < 200) {
    return NextResponse.json({ error: "לא נמצא תוכן מספיק במאמר" }, { status: 422 });
  }

  const anthropic = createAnthropicClient(authUser.claudeApiKey);

  let rawResponse: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: `אתה עוזר לאנשי Product Management להעריך תוכן מקצועי ולנהל את הידע שלהם.
תנתח מאמר לעומק ותחזיר JSON בלבד, ללא markdown, ללא הסברים לפני או אחרי.

החזר JSON בפורמט הזה בדיוק:
{
  "title": "<כותרת המאמר המקורית>",
  "article_published_at": "<תאריך פרסום המאמר בפורמט YYYY-MM-DD — אם לא ניתן לזהות, החזר null>",
  "summary": "<סיכום של 3-4 פסקאות בעברית: מה הטענה המרכזית של המאמר, אילו ארגומנטים הוא מציג, דוגמאות ספציפיות שהוא מביא, ומה המסקנה. כתוב כאילו אתה מספר לעמית לעבודה מה קראת — בשפה זורמת, לא bullet points>",
  "why_worth_reading": ["<סיבה ספציפית ומעשית 1 — מה PM ייקח מזה לעבודה>", "<סיבה 2>", "<סיבה 3>"],
  "key_points": ["<תובנה מעשית 1>", "<תובנה 2>", "<תובנה 3>", "<תובנה 4>", "<תובנה 5>"],
  "pm_relevance_score": <1-10>,
  "pm_relevance_reason": "<הסבר ממוקד: איזה מיומנות PM זה משפר, באיזה מצבים יומיומיים ישמש, מה ה-PM יוכל לעשות אחרת אחרי שיקרא>",
  "recommendation": "<must_read | worth_reading | skip>",
  "estimated_read_minutes": <מספר שלם>
}

קריטריונים לדירוג — היה מחמיר ואמיתי:
- must_read (8-10 ציון): תובנות שמשנות איך PM עובד — frameworks חדשים ואפקטיביים, מחקר מגובה נתונים, לקחים מניסיון אמיתי שניתן לאמץ מחר. חייב להיות actionable לגמרי ורלוונטי לניהול מוצר יומיומי. לא כל מאמר טוב הוא must_read.
- worth_reading (5-7): מחזק ידע קיים, רלוונטי למצבים ספציפיים, מעניין אבל לא דחוף, או כולל תובנה אחת טובה בתוך הרבה ידוע.
- skip (1-4): שיווקי מדי, כללי ושטחי, אין תובנות שPM לא יודע כבר, לא רלוונטי לניהול מוצר, או תוכן שאפשר לסכם במשפט אחד.

why_worth_reading — כתוב רק על מה שPM ייקח לעבודה בפועל. הימנע מ"מעניין לדעת" — תהיה ספציפי. דוגמאות לסיבות טובות: "יעזור לך לנהל שיחות prioritization עם stakeholders" / "מסביר איך להגדיר north star metric שמוביל להחלטות נכונות" / "כלים לזהות מתי feature request הוא באמת צורך אמיתי".
אם recommendation הוא skip, החזר why_worth_reading כמערך ריק [].`,
      messages: [{ role: "user", content: `URL: ${url}\n\nתוכן המאמר:\n${articleText}` }],
    });
    rawResponse = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Anthropic error:", msg);
    return NextResponse.json({ error: `שגיאה ב-Claude: ${msg.slice(0, 120)}` }, { status: 502 });
  }

  const extractJson = (raw: string): string => {
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    if (stripped.startsWith("{")) return stripped;
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? match[0] : stripped;
  };

  let summaryData: z.infer<typeof SummarySchema>;
  try {
    const repaired = jsonrepair(extractJson(rawResponse));
    summaryData = SummarySchema.parse(JSON.parse(repaired));
  } catch (err) {
    console.error("Parse error:", err, rawResponse.slice(0, 400));
    return NextResponse.json({ error: "שגיאה בעיבוד התשובה" }, { status: 502 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("article_summaries")
    .insert({ user_id: authUser.id, url, ...summaryData })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
