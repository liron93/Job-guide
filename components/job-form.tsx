"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function JobForm() {
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsPaste, setNeedsPaste] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() && !url.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: description, job_url: url || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "שגיאה";
        const isBlockedUrl = msg.includes("לא ניתן") || msg.includes("לא נמצא תוכן");
        setError(isBlockedUrl ? "האתר חוסם גישה אוטומטית — הדבק/י את תיאור המשרה בשדה למטה" : msg);
        if (isBlockedUrl) {
          setNeedsPaste(true);
          setTimeout(() => textareaRef.current?.focus(), 50);
        }
        return;
      }
      router.push(`/jobs/${data.id}`);
    } catch {
      setError("שגיאת רשת — נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">לינק למשרה (אופציונלי)</label>
        <Input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          תיאור המשרה
          {!url.trim() && <span className="text-red-400"> *</span>}
          {url.trim() && <span className="text-muted-foreground font-normal text-xs mr-2">— אופציונלי אם נתת לינק</span>}
        </label>
        <Textarea
          ref={textareaRef}
          placeholder="הדבק/י את תיאור המשרה המלא כאן..."
          value={description}
          onChange={(e) => { setDescription(e.target.value); setNeedsPaste(false); }}
          disabled={loading}
          rows={10}
          className={`resize-none text-sm transition-colors ${needsPaste ? "border-yellow-500/60 ring-1 ring-yellow-500/40" : ""}`}
          dir="ltr"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading || (!url.trim() && description.trim().length < 50)}>
          {loading ? "מנתח משרה... כ-15 שניות" : "נתח התאמה"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
}
