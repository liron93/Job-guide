import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let extractedText = "";

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx");

    if (isPdf) {
      // Import from lib path directly to avoid pdf-parse's problematic test runner
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } else if (isDocx) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json({ error: "פורמט לא נתמך — העלה PDF או DOCX" }, { status: 400 });
    }

    extractedText = extractedText.trim();
    if (extractedText.length < 50) {
      return NextResponse.json({ error: "לא הצלחנו לחלץ טקסט מהקובץ" }, { status: 422 });
    }

    await supabase.from("cvs").update({ is_active: false }).eq("user_id", user.id).eq("is_active", true);

    const { data, error } = await supabase
      .from("cvs")
      .insert({ user_id: user.id, filename: file.name, extracted_text: extractedText, is_active: true })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id, filename: data.filename, extracted_text: extractedText });
  } catch (err) {
    console.error("CV upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
