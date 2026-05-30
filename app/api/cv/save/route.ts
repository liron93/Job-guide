import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  text: z.string().min(100, "הטקסט קצר מדי — הדבק/י את קורות החיים המלאים"),
  filename: z.string().optional().default("קורות חיים"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" }, { status: 400 });
  }

  const { text, filename } = parsed.data;
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  await supabase.from("cvs").update({ is_active: false }).eq("user_id", user.id).eq("is_active", true);

  const { data, error } = await supabase
    .from("cvs")
    .insert({ user_id: user.id, filename, extracted_text: text, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
