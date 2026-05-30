import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatusSelect } from "@/components/job-status-select";
import { JobActions } from "@/components/job-actions";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: job } = await supabase.from("jobs").select("*").eq("id", params.id).single();

  if (!job) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <JobStatusSelect jobId={job.id} current={job.status} />
          <Link href="/jobs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← כל המשרות
          </Link>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">{job.role_title}</h1>
          <p className="text-muted-foreground">{job.company_name}</p>
        </div>
      </div>

      {/* Fit Analysis */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-3 rounded-full ${i < (job.fit_score ?? 0) ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{job.fit_score}/10</span>
              {job.should_apply ? (
                <span className="text-sm text-green-400 font-medium">✓ כדאי להגיש</span>
              ) : (
                <span className="text-sm text-red-400 font-medium">✗ לא ממליץ להגיש</span>
              )}
            </div>
            <CardTitle className="text-base">ניתוח התאמה</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <p className="text-sm leading-relaxed text-right">{job.fit_summary}</p>

          <div className="grid grid-cols-2 gap-4">
            {job.fit_pros?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-green-400 text-right">יתרונות</p>
                <ul className="space-y-1">
                  {job.fit_pros.map((p: string, i: number) => (
                    <li key={i} className="text-xs text-right text-muted-foreground leading-relaxed">✓ {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {job.fit_cons?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-red-400 text-right">פערים</p>
                <ul className="space-y-1">
                  {job.fit_cons.map((c: string, i: number) => (
                    <li key={i} className="text-xs text-right text-muted-foreground leading-relaxed">✗ {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Company & Product */}
      {(job.company_summary || job.product_summary) && (
        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base text-right">על החברה והמוצר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {job.company_summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground text-right mb-1">החברה</p>
                <p className="text-sm leading-relaxed text-right">{job.company_summary}</p>
              </div>
            )}
            {job.product_summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground text-right mb-1">המוצר</p>
                <p className="text-sm leading-relaxed text-right">{job.product_summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interview Prep + Documents */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <JobActions
            jobId={job.id}
            status={job.status}
            companyName={job.company_name}
            roleName={job.role_title}
            tailoredQuestions={job.tailored_questions}
            tailoredCv={job.tailored_cv}
            coverLetter={job.cover_letter}
            candidateQuestions={job.candidate_questions}
            myQuestions={job.my_questions}
          />
        </CardContent>
      </Card>

      {/* Job description (collapsed) */}
      <details className="group">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground list-none flex items-center gap-1">
          <span className="group-open:hidden">▶ תיאור המשרה המקורי</span>
          <span className="hidden group-open:inline">▼ הסתר</span>
        </summary>
        <div className="mt-3 bg-muted/20 border border-border rounded-md p-4">
          <pre className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">{job.job_description}</pre>
        </div>
      </details>
    </div>
  );
}
