import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-user";
import { createAnthropicClient } from "@/lib/anthropic";

const RequestSchema = z.object({
  text: z.string().min(1).max(3000),
});

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!authUser.claudeApiKey) return NextResponse.json({ error: "חסר מפתח Claude API" }, { status: 400 });

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const anthropic = createAnthropicClient(authUser.claudeApiKey);

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Translate the following Hebrew PM interview answer to natural English. Keep the same structure and bullet points. Return only the translated text, nothing else.\n\n${parsed.data.text}`,
      }],
    });
    const translated = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    return NextResponse.json({ translated });
  } catch (err) {
    console.error("Translate error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }
}
