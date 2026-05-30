"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Week {
  week: number;
  title: string;
  focus: string;
  categories: string[];
  daily_goal: string;
  tip: string;
}

interface Plan {
  summary: string;
  weeks: Week[];
  priority_categories: string[];
  key_focus: string;
}

export function StudyPlan({ hasProfile }: { hasProfile: boolean }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("study_plan");
      if (saved) setPlan(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guide/study-plan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "שגיאה"); return; }
      setPlan(data);
      try { localStorage.setItem("study_plan", JSON.stringify(data)); } catch { /* ignore */ }
    } catch { setError("שגיאת רשת"); }
    finally { setLoading(false); }
  }

  if (!hasProfile) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">מלא/י פרטים אישיים כדי לקבל תכנית לימוד מותאמת</p>
          <Button variant="outline" render={<Link href="/profile" />}>מלא פרופיל</Button>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 text-center space-y-3">
          <p className="text-sm font-medium">תכנית לימוד מותאמת אישית</p>
          <p className="text-xs text-muted-foreground">Claude ינתח את הפרופיל שלך ואת הנתונים ויבנה תכנית 3 שבועות</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={generate} disabled={loading}>
            {loading ? "בונה תכנית... כ-15 שניות" : "צור תכנית לימוד"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <button
              onClick={() => { setPlan(null); try { localStorage.removeItem("study_plan"); } catch { /* ignore */ } }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              עדכן תכנית
            </button>
            <div className="text-right space-y-1">
              <p className="text-sm font-semibold">מוקד עיקרי: {plan.key_focus}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{plan.summary}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {plan.priority_categories.map((cat) => (
              <Link
                key={cat}
                href={`/questions?category=${encodeURIComponent(cat)}`}
                className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors border border-primary/20"
              >
                {cat}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {plan.weeks.map((week) => (
          <Card key={week.week}>
            <CardHeader className="pb-2 pt-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">שבוע {week.week}</p>
                <CardTitle className="text-sm">{week.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-2">
              <p className="text-xs text-muted-foreground text-right">{week.focus}</p>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {week.categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/questions?category=${encodeURIComponent(cat)}`}
                    className="text-xs px-2 py-0.5 rounded-full bg-accent text-foreground hover:bg-accent/70 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
              <p className="text-xs text-right"><span className="text-muted-foreground">יעד יומי: </span>{week.daily_goal}</p>
              <div className="border-t border-border/50 pt-2 mt-2">
                <p className="text-xs text-muted-foreground text-right italic">{week.tip}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
