import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/lib/pdf";
import { getAuthUser } from "@/lib/auth-user";

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "יש להעלות קובץ PDF בלבד" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText: string;

  try {
    extractedText = await extractTextFromPdf(buffer);
  } catch {
    return NextResponse.json({ error: "לא ניתן לחלץ טקסט מהקובץ" }, { status: 422 });
  }

  if (!extractedText.trim()) {
    return NextResponse.json({ error: "הקובץ ריק או לא ניתן לקרוא אותו" }, { status: 422 });
  }

  const supabase = createClient();

  // Deactivate all existing CVs
  await supabase.from("cvs").update({ is_active: false }).eq("user_id", authUser.id).eq("is_active", true);

  const { data, error } = await supabase
    .from("cvs")
    .insert({ user_id: authUser.id, filename: file.name, extracted_text: extractedText, is_active: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
