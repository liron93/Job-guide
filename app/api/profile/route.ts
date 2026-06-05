import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ProfileSchema = z.object({
  full_name: z.string().nullish(),
  job_title: z.string().nullish(),
  years_experience: z.number().min(0).max(40).nullish(),
  experience_areas: z.array(z.string()).nullish(),
  looking_for: z.string().nullish(),
  target_companies: z.string().nullish(),
  strengths: z.string().nullish(),
  improvement_areas: z.string().nullish(),
  additional_notes: z.string().nullish(),
  claude_api_key: z.string().nullish(),
}).passthrough();

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json(data ?? {});
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("user_profile")
    .upsert(
      { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "user_id", ignoreDuplicates: false }
    )
    .select()
    .maybeSingle();

  if (error) {
    console.error("profile upsert error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? {});
}
