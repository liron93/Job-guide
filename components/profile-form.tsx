"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EXPERIENCE_AREAS = [
  "B2B SaaS", "B2C", "Mobile", "Fintech", "E-commerce",
  "AI/ML", "Platform", "Growth", "Enterprise", "Marketplace",
  "Healthcare", "EdTech", "Infra / DevTools",
];

interface Profile {
  full_name?: string;
  job_title?: string;
  years_experience?: number;
  experience_areas?: string[];
  looking_for?: string;
  target_companies?: string;
  strengths?: string;
  improvement_areas?: string;
  additional_notes?: string;
}

export function ProfileForm({ initial, setup = false }: { initial: Profile; setup?: boolean }) {
  const [form, setForm] = useState<Profile>(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function set(field: keyof Profile, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function toggleArea(area: string) {
    const current = form.experience_areas ?? [];
    set("experience_areas", current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "שגיאה"); return; }
      setSaved(true);
      if (setup) { router.push("/cv?setup=1"); return; }
    } catch { setError("שגיאת רשת"); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">שם</label>
          <Input
            value={form.full_name ?? ""}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="שם מלא"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">תפקיד נוכחי</label>
          <Input
            value={form.job_title ?? ""}
            onChange={(e) => set("job_title", e.target.value)}
            placeholder="לדוגמה: Product Manager @ Startup"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">שנות ניסיון</label>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 10].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => set("years_experience", y)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                form.years_experience === y
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {y === 10 ? "10+" : y === 0 ? "מתחיל" : `${y}`}
            </button>
          ))}
        </div>
      </div>

      {/* Experience areas */}
      <div className="space-y-2">
        <label className="text-sm font-medium">תחומי ניסיון</label>
        <div className="flex gap-2 flex-wrap">
          {EXPERIENCE_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                (form.experience_areas ?? []).includes(area)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* What they're looking for */}
      <div className="space-y-2">
        <label className="text-sm font-medium">מה אני מחפש/ת בתפקיד הבא</label>
        <Textarea
          value={form.looking_for ?? ""}
          onChange={(e) => set("looking_for", e.target.value)}
          placeholder="לדוגמה: תפקיד Senior PM בחברה שמתמקדת ב-B2B SaaS, בגדול עם team שמוכר לפי תוצאות ולא לפי תהליכים. רוצה יותר ownership על אסטרטגיה..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">סוג חברות / שלב שמעניין אותי</label>
        <Input
          value={form.target_companies ?? ""}
          onChange={(e) => set("target_companies", e.target.value)}
          placeholder="לדוגמה: Series B-C, פינטק, או חברות גדולות כמו Wix / Monday"
        />
      </div>

      {/* Strengths and growth */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">חוזקות שלי</label>
          <Textarea
            value={form.strengths ?? ""}
            onChange={(e) => set("strengths", e.target.value)}
            placeholder="לדוגמה: data-driven, תקשורת עם stakeholders, הגדרת roadmap..."
            rows={3}
            className="resize-none text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">תחומים לשיפור</label>
          <Textarea
            value={form.improvement_areas ?? ""}
            onChange={(e) => set("improvement_areas", e.target.value)}
            placeholder="לדוגמה: ניהול PM juniors, technical depth, negotiation..."
            rows={3}
            className="resize-none text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">הערות נוספות (רקע, מטרות, הקשר)</label>
        <Textarea
          value={form.additional_notes ?? ""}
          onChange={(e) => set("additional_notes", e.target.value)}
          placeholder="כל מידע נוסף שיעזור ל-Claude לתת תשובות מותאמות אישית..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "שומר..." : setup ? "המשך להעלאת קורות חיים ←" : "שמור פרטים"}
        </Button>
        {saved && !setup && <p className="text-sm text-green-400">✓ נשמר</p>}
      </div>
    </form>
  );
}
