import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobsList } from "@/components/jobs-list";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, company_name, role_title, fit_score, should_apply, status, applied_at, created_at")
    .or(`user_id.eq.${user?.id},user_id.is.null`)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">משרות</h1>
          <p className="text-muted-foreground text-sm mt-1">מעקב אחר משרות, ניתוח התאמה והכנה לראיון</p>
        </div>
        <Button render={<Link href="/jobs/new" />}>+ הוסף משרה</Button>
      </div>

      {(jobs ?? []).length === 0 && !searchParams.status && !searchParams.apply ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground text-sm">עוד לא הוספת משרות</p>
            <Button render={<Link href="/jobs/new" />}>הוסף משרה ראשונה</Button>
          </CardContent>
        </Card>
      ) : (
        <JobsList jobs={jobs ?? []} />
      )}
    </div>
  );
}
