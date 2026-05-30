import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("answers")
    .select("*, questions(id, question, category, difficulty)")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "תשובה לא נמצאה" }, { status: 404 });
  }

  return NextResponse.json(data);
}
