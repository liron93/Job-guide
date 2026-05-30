import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { email, password, claudeApiKey } = await request.json();

  if (!email || !password || !claudeApiKey) {
    return NextResponse.json({ error: "חסרים פרטים נדרשים" }, { status: 400 });
  }

  if (!claudeApiKey.startsWith("sk-ant-")) {
    return NextResponse.json({ error: "מפתח Claude לא תקין — חייב להתחיל ב-sk-ant-" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "הסיסמא חייבת להיות לפחות 6 תווים" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Create user with email already confirmed so login works immediately
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
      return NextResponse.json({ error: "כבר קיים חשבון עם כתובת האימייל הזו" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "שגיאה ביצירת המשתמש" }, { status: 500 });
  }

  // Save Claude API key — use SSR client after signing in via admin, or use admin client directly
  const { error: profileError } = await admin
    .from("user_profile")
    .upsert(
      { user_id: userId, claude_api_key: claudeApiKey, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (profileError) {
    console.error("Profile upsert error:", profileError);
  }

  // Sign in immediately so the session cookie is set
  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    // User was created — redirect to login
    return NextResponse.json({ ok: true, needsLogin: true });
  }

  return NextResponse.json({ ok: true });
}
