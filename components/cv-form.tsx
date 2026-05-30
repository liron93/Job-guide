"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface ExistingCv {
  filename: string;
  uploaded_at: string;
  extracted_text: string;
}

export function CvForm({ existing, setup = false }: { existing: ExistingCv | null; setup?: boolean }) {
  const [text, setText] = useState(existing?.extracted_text ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileUpload(file: File) {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cv/upload", { method: "POST", body: fd });
      let data: { error?: string; extracted_text?: string; filename?: string } = {};
      try { data = await res.json(); } catch { /* non-json response */ }
      if (!res.ok) { setError(data.error ?? `שגיאת שרת ${res.status}`); return; }
      setText(data.extracted_text ?? "");
      setSaved(true);
      if (setup) { router.push("/questions"); return; }
      router.refresh();
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  async function handlePasteSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/cv/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, filename: "קורות חיים" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "שגיאה"); return; }
      setSaved(true);
      if (setup) { router.push("/questions"); return; }
      router.refresh();
    } catch { setError("שגיאת רשת"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      {existing && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              עודכן: {new Date(existing.uploaded_at).toLocaleDateString("he-IL")}
            </span>
            <span className="text-sm text-green-400">✓ קורות חיים פעילים: {existing.filename}</span>
          </CardContent>
        </Card>
      )}

      {/* Mode toggle */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setMode("upload")}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${mode === "upload" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          העלאת קובץ
        </button>
        <button
          onClick={() => setMode("paste")}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${mode === "paste" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          העתק / הדבק
        </button>
      </div>

      {mode === "upload" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">PDF או DOCX — הטקסט יחולץ אוטומטית</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
            className={`border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/20 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <p className="text-sm text-muted-foreground">מחלץ טקסט מהקובץ...</p>
            ) : (
              <>
                <p className="text-sm font-medium">גררו קובץ לכאן או לחצו לבחירה</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX</p>
              </>
            )}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {saved && <p className="text-sm text-green-400">✓ קורות החיים נשמרו בהצלחה</p>}
        </div>
      )}

      {mode === "paste" && (
        <form onSubmit={handlePasteSave} className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setSaved(false); }}
            placeholder="הדבק/י כאן את טקסט קורות החיים המלאים..."
            rows={18}
            disabled={loading}
            className="resize-none text-sm font-mono"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground text-left">{text.length} תווים</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading || text.trim().length < 100}>
              {loading ? "שומר..." : setup ? "המשך לשאלות ←" : existing ? "עדכן קורות חיים" : "שמור קורות חיים"}
            </Button>
            {saved && !setup && <p className="text-sm text-green-400">✓ נשמר בהצלחה</p>}
          </div>
        </form>
      )}
    </div>
  );
}
