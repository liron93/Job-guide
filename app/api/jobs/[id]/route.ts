import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PatchSchema = z.object({
  status: z.enum(["considering", "applied", "interview", "offer", "rejected", "withdrawn"]).optional(),
  notes: z.string().optional(),
  applied_at: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "applied" && !parsed.data.applied_at) {
    updates.applied_at = new Date().toISOString();
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { data, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/jobs/${params.id}`);
  revalidatePath("/jobs");
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", params.id)
    .or(`user_id.eq.${user.id},user_id.is.null`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/jobs");
  return NextResponse.json({ ok: true });
}
