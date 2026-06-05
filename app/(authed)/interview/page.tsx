"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InterviewFree } from "@/components/interview-free";
import { InterviewQA } from "@/components/interview-qa";
import { Briefcase } from "lucide-react";

type Persona = "hr" | "manager";
type Mode = "free" | "qa";
type Language = "he" | "en";

interface Job {
  id: string;
  company_name: string;
  role_title: string;
  job_description: string;
  status: string;
}

interface InterviewConfig {
  persona: Persona;
  mode: Mode;
  language: Language;
  jobTitle: string;
  jobDescription: string;
}

export default function InterviewPage() {
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("manual");
  const [form, setForm] = useState({
    persona: "hr" as Persona,
    mode: "free" as Mode,
    language: "he" as Language,
    jobTitle: "",
    jobDescription: "",
  });

  useEffect(() => {
    fetch("/api/jobs")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(() => {});
  }, []);

  function handleJobSelect(jobId: string) {
    setSelectedJobId(jobId);
    if (jobId === "manual") {
      setForm(f => ({ ...f, jobTitle: "", jobDescription: "" }));
    } else {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setForm(f => ({
          ...f,
          jobTitle: `${job.role_title} — ${job.company_name}`,
          jobDescription: job.job_description,
        }));
      }
    }
  }

  function handleStart() {
    setConfig(form);
  }

  if (config) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => setConfig(null)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          ← חזרה להגדרות
        </button>
        {config.mode === "free" ? (
          <InterviewFree config={config} />
        ) : (
          <InterviewQA config={config} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">ראיון מדומה</h1>
        <p className="text-muted-foreground text-sm mt-1">תרגל ראיון אמיתי עם מראיין AI</p>
      </div>

      <div className="space-y-6">
        {/* Job selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">משרה</label>
          {jobs.length > 0 && (
            <div className="space-y-2 mb-3">
              {jobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => handleJobSelect(job.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
                    selectedJobId === job.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Briefcase className={`h-4 w-4 shrink-0 ${selectedJobId === job.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${selectedJobId === job.id ? "text-primary" : ""}`}>
                      {job.role_title}
                    </div>
                    <div className="text-xs text-muted-foreground">{job.company_name}</div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => handleJobSelect("manual")}
                className={`w-full p-3 rounded-xl border text-right text-sm transition-all ${
                  selectedJobId === "manual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                }`}
              >
                + הזנה ידנית
              </button>
            </div>
          )}

          {/* Manual entry — shown when no jobs or manual selected */}
          {(jobs.length === 0 || selectedJobId === "manual") && (
            <input
              type="text"
              value={form.jobTitle}
              onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
              placeholder="לדוגמה: Senior Product Manager, Fintech"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>

        {/* Persona */}
        <div className="space-y-2">
          <label className="text-sm font-medium">סוג מראיין</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "hr", label: "HR מגייסת", desc: "מוטיבציה, רקע, culture fit" },
              { value: "manager", label: "מנהל ישיר", desc: "ניסיון, חשיבה מוצרית, תפקיד ספציפי" },
            ] as const).map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setForm(f => ({ ...f, persona: value }))}
                className={`p-4 rounded-xl border text-right transition-all ${
                  form.persona === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium">מצב ראיון</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "free", label: "ראיון חופשי", desc: "שיחה זורמת עם המראיין" },
              { value: "qa", label: "מאגר שאלות", desc: "שאלות מוכנות + פידבק לכל תשובה" },
            ] as const).map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setForm(f => ({ ...f, mode: value }))}
                className={`p-4 rounded-xl border text-right transition-all ${
                  form.mode === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <label className="text-sm font-medium">שפת הראיון</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "he", label: "עברית" },
              { value: "en", label: "English" },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setForm(f => ({ ...f, language: value }))}
                className={`p-3 rounded-xl border text-center text-sm font-medium transition-all ${
                  form.language === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleStart}
          disabled={form.persona === "manager" && !form.jobTitle.trim()}
        >
          התחל ראיון →
        </Button>
      </div>
    </div>
  );
}
