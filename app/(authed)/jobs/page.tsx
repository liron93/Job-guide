import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/job-status";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, company_name, role_title, fit_score, should_apply, status, applied_at, created_at, user_id")
    .or(`user_id.eq.${user?.id},user_id.is.null`)
    .order("created_at", { ascending: false });

  const newTodayCount = 0; // will be re-enabled after source column migration

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">משרות</h1>
          <p className="text-muted-foreground text-sm mt-1">מעקב אחר משרות, ניתוח התאמה והכנה לראיון</p>
        </div>
        <Button render={<Link href="/jobs/new" />}>+ הוסף משרה</Button>
      </div>

      {(newTodayCount ?? 0) > 0 && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm flex items-center gap-2">
          <span className="text-blue-400">✦</span>
          <span>
            נמצאו <strong>{newTodayCount}</strong> משרות חדשות היום מ-LinkedIn
          </span>
        </div>
      )}

      {(jobs ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground text-sm">עוד לא הוספת משרות</p>
            <Button render={<Link href="/jobs/new" />}>הוסף משרה ראשונה</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(jobs ?? []).map((job) => {
            const statusStyle = STATUS_LABELS[job.status] ?? STATUS_LABELS.considering;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                <Card className="hover:bg-accent/30 transition-colors">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={statusStyle.color}>
                          {statusStyle.label}
                        </Badge>
                        {job.fit_score && (
                          <span className="text-xs text-muted-foreground">{job.fit_score}/10</span>
                        )}
                        {job.should_apply === true && (
                          <span className="text-xs text-green-400">✓ כדאי להגיש</span>
                        )}
                        {job.should_apply === false && (
                          <span className="text-xs text-red-400">✗ לא ממליץ</span>
                        )}
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <p className="text-sm font-medium truncate">{job.role_title}</p>
                        <p className="text-xs text-muted-foreground">{job.company_name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
