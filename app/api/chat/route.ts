import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { createAnthropicClient } from "@/lib/anthropic";
import { getUserContext } from "@/lib/user-context";
import { z } from "zod";

const RequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
});

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { messages } = parsed.data;
  const userContext = await getUserContext();

  const systemPrompt = `אתה עוזר אישי חכם לאימון ראיונות Product Manager.
אתה חלק מהאפליקציה "PM Ready" — פלטפורמה לתרגול ראיונות PM עם AI.

${userContext ? `פרופיל המשתמש:\n${userContext}\n` : ""}

תפקידך:
- לענות על שאלות בנושא PM, ראיונות עבודה, frameworks, אסטרטגיית מוצר
- לעזור לנסח תשובות לשאלות ראיון קשות
- להסביר מושגים (RICE, ICE, OKRs, Product Sense וכו׳)
- לתת טיפים ספציפיים בהתאם לרקע של המשתמש
- לעזור עם כל שאלה הקשורה לקריירת PM

כללי תגובה:
- עברית שוטפת, מושגים מקצועיים באנגלית
- תגובות קצרות וממוקדות — לא יותר מ-150 מילה אלא אם ביקשו להרחיב
- אל תתחיל ב"כמובן" או "בוודאי"
- אם שואלים שאלת ראיון — כתוב תשובה לדוגמא בגוף ראשון, מותאמת לפרופיל`;

  const anthropic = createAnthropicClient(authUser.claudeApiKey);
  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
