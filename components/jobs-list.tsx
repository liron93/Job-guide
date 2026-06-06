"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { STATUS_LABELS } from "@/lib/job-status";

interface Job {
  id: string;
  company_name: string;
  role_title: string;
  fit_score: number | null;
  should_apply: boolean | null;
  status: string;
  applied_at: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "הכל" },
  { value: "considering", label: "שוקל" },
  { value: "applied", label: "הגשתי" },
  { value: "interview", label: "ראיון" },
  { value: "offer", label: "הצעה" },
  { value: "rejected", label: "נדחה" },
];

const APPLY_OPTIONS = [
  { value: "all", label: "הכל" },
  { value: "yes", label: "✓ כדאי" },
  { value: "no", label: "✗ לא כדאי" },
];

export function JobsList({ jobs: initialJobs }: { jobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [statusFilter, setStatusFilter] = useState("all");
  const [applyFilter, setApplyFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = jobs.filter(job => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false;
    if (applyFilter === "yes" && job.should_apply !== true) return false;
    if (applyFilter === "no" && job.should_apply !== false) return false;
    return true;
  });

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("למחוק את המשרה?")) return;
    setDeleting(id);
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (res.ok) setJobs(prev => prev.filter(j => j.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {APPLY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setApplyFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                applyFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">אין משרות עם הפילטר הזה</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => {
            const statusStyle = STATUS_LABELS[job.status] ?? STATUS_LABELS.considering;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                <Card className="hover:bg-accent/30 transition-colors">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDelete(job.id, e)}
                          disabled={deleting === job.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <Badge variant="outline" className={statusStyle.color}>
                          {statusStyle.label}
                        </Badge>
                        {job.fit_score && (
                          <span className="text-xs text-muted-foreground">{job.fit_score}/10</span>
                        )}
                        {job.should_apply === true && (
                          <span className="text-xs text-green-400">✓ כדאי</span>
                        )}
                        {job.should_apply === false && (
                          <span className="text-xs text-red-400">✗ לא כדאי</span>
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
