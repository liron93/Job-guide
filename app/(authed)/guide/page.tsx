import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GUIDE_SECTIONS, GENERAL_TIPS } from "@/data/guide";
import { StudyPlan } from "@/components/study-plan";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const supabase = createClient();
  const { data: profile } = await supabase.from("user_profile").select("full_name, job_title").maybeSingle();
  const hasProfile = !!(profile?.job_title || profile?.full_name);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold">מדריך הכנה לראיון PM</h1>
        <p className="text-muted-foreground text-sm mt-1">
          frameworks, מבנה תשובות, וטיפים לכל קטגוריה — לפני שמתחילים לתרגל
        </p>
      </div>

      {/* Personalized Study Plan */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">תכנית לימוד מותאמת אישית</h2>
        <StudyPlan hasProfile={hasProfile} />
      </section>

      {/* General Tips */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">עקרונות מרכזיים</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {GENERAL_TIPS.map((tip) => (
            <Card key={tip.title}>
              <CardContent className="py-3 px-4">
                <p className="text-sm font-medium text-right mb-1">{tip.title}</p>
                <p className="text-xs text-muted-foreground text-right leading-relaxed">{tip.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Per-category guide */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">מדריך לפי קטגוריה</h2>
        <div className="space-y-3">
          {GUIDE_SECTIONS.map((section) => (
            <details key={section.category} className="group">
              <summary className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent/30 transition-colors list-none">
                <a
                  href={`/questions?category=${encodeURIComponent(section.category)}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  תרגל ←
                </a>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{section.category}</span>
                  <span>{section.emoji}</span>
                </div>
              </summary>

              <div className="border border-t-0 border-border rounded-b-lg px-4 pb-4 pt-3 space-y-4">
                {/* What they test */}
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-1">מה בודקים</p>
                  <p className="text-sm leading-relaxed">{section.what_they_test}</p>
                </div>

                {/* Structure */}
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-2">מבנה תשובה מומלץ</p>
                  <ol className="space-y-1">
                    {section.structure.map((step, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">{i + 1}. </span>{step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Frameworks */}
                {section.frameworks.length > 0 && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Frameworks שימושיים</p>
                    <div className="space-y-2">
                      {section.frameworks.map((fw) => (
                        <div key={fw.name} className="bg-muted/30 rounded-md px-3 py-2">
                          <p className="text-xs font-medium">{fw.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{fw.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Tips */}
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-400 mb-1">✓ טיפים</p>
                    <ul className="space-y-1">
                      {section.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground leading-relaxed">{tip}</li>
                      ))}
                    </ul>
                  </div>
                  {/* Avoid */}
                  <div className="text-right">
                    <p className="text-xs font-medium text-red-400 mb-1">✗ להימנע</p>
                    <ul className="space-y-1">
                      {section.avoid.map((a, i) => (
                        <li key={i} className="text-xs text-muted-foreground leading-relaxed">{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
