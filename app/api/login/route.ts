import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "נא להזין אימייל וסיסמא" }, { status: 400 });
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: "אימייל או סיסמא שגויים" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
