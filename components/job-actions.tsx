"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { MyQuestionsTab } from "@/components/my-questions-tab";
import { FeedbackRegenerate } from "@/components/feedback-regenerate";

const PdfPreviewButton = dynamic(
  () => import("@/components/pdf-preview-button").then((m) => m.PdfPreviewButton),
  { ssr: false, loading: () => <span className="text-xs text-muted-foreground">טוען...</span> }
);

interface TailoredQuestion {
  question: string;
  category: string;
  suggested_answer: string;
  why_asked: string;
}

interface CandidateQuestion {
  question: string;
  why_impressive: string;
  framing: string;
}

interface MyQuestion {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

interface JobActionsProps {
  jobId: string;
  status: string;
  companyName?: string;
  roleName?: string;
  tailoredQuestions: TailoredQuestion[] | null;
  tailoredCv: string | null;
  coverLetter: string | null;
  candidateQuestions: CandidateQuestion[] | null;
  myQuestions: MyQuestion[] | null;
}

const APPLIED_STATUSES = ["applied", "interview", "offer"];

function JobQuestion({
  q, index, regeneratingIndex, onRegenerate,
}: {
  q: TailoredQuestion;
  index: number;
  regeneratingIndex: number | null;
  onRegenerate: (i: number, feedback: string) => void;
}) {
  const [lang, setLang] = useState<"he" | "en">("he");
  const [enAnswer, setEnAnswer] = useState<string | null>(null);
  const [loadingEn, setLoadingEn] = useState(false);

  async function switchToEn() {
    setLang("en");
    if (enAnswer) return;
    setLoadingEn(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q.suggested_answer }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnAnswer(data.translated);
      }
    } finally {
      setLoadingEn(false);
    }
  }

  const displayAnswer = lang === "en" ? (enAnswer ?? q.suggested_answer) : q.suggested_answer;

  return (
    <details className="border border-border rounded-lg group">
      <summary className="px-4 py-3 cursor-pointer list-none flex items-start gap-3 hover:bg-accent/30 transition-colors rounded-lg">
        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{q.category}</span>
        <span className="text-sm flex-1 text-right">{q.question}</span>
      </summary>
      <div className="px-4 pb-4 space-y-3 border-t border-border mt-0 pt-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">מה בודקים: </span>{q.why_asked}
        </p>
        <div className="bg-muted/30 rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setLang("he")}
                className={`text-xs px-2 py-0.5 transition-colors ${lang === "he" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                עב
              </button>
              <button
                onClick={switchToEn}
                disabled={loadingEn}
                className={`text-xs px-2 py-0.5 transition-colors ${lang === "en" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"} disabled:opacity-50`}
              >
                {loadingEn ? "..." : "EN"}
              </button>
            </div>
            <p className="text-xs font-medium text-muted-foreground">תשובה מוצעת</p>
          </div>
          <p className={`text-sm leading-relaxed whitespace-pre-line ${lang === "en" ? "text-left" : "text-right"}`}>
            {regeneratingIndex === index ? (
              <span className="text-muted-foreground animate-pulse">מייצר תשובה חדשה...</span>
            ) : (loadingEn && lang === "en") ? (
              <span className="text-muted-foreground animate-pulse">מתרגם לאנגלית...</span>
            ) : displayAnswer}
          </p>
        </div>
        <FeedbackRegenerate
          loading={regeneratingIndex === index}
          onRegenerate={(feedback) => Promise.resolve(onRegenerate(index, feedback))}
        />
      </div>
    </details>
  );
}

export function JobActions({ jobId, status, companyName, roleName, tailoredQuestions, tailoredCv, coverLetter, candidateQuestions, myQuestions }: JobActionsProps) {
  const [prepLoading, setPrepLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [localQuestions, setLocalQuestions] = useState(tailoredQuestions ?? []);
  useEffect(() => { setLocalQuestions(tailoredQuestions ?? []); }, [tailoredQuestions]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"prep" | "cv" | "cover" | "ask">("prep");
  const router = useRouter();

  async function generatePrep() {
    setPrepLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/prep`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "שגיאה"); return; }
      router.refresh();
    } catch { setError("שגיאת רשת"); }
    finally { setPrepLoading(false); }
  }

  async function generateDocs() {
    setDocsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/documents`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "שגיאה"); return; }
      router.refresh();
    } catch { setError("שגיאת רשת"); }
    finally { setDocsLoading(false); }
  }

  async function regeneratePrepAnswer(index: number, feedback: string) {
    setRegeneratingIndex(index);
    try {
      const res = await fetch(`/api/jobs/${jobId}/prep`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: index, feedback }),
      });
      if (!res.ok) return;
      const { suggested_answer } = await res.json();
      setLocalQuestions((prev) =>
        prev.map((q, i) => (i === index ? { ...q, suggested_answer } : q))
      );
    } finally {
      setRegeneratingIndex(null);
    }
  }

  const questions: TailoredQuestion[] = localQuestions;

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-border pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("prep")}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${activeTab === "prep" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          הכנה לראיון
        </button>
        <button
          onClick={() => setActiveTab("ask")}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${activeTab === "ask" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          שאלות שנשאלתי
        </button>
        {APPLIED_STATUSES.includes(status) && (
          <>
            <button
              onClick={() => setActiveTab("cv")}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${activeTab === "cv" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              קורות חיים מותאמים
            </button>
            <button
              onClick={() => setActiveTab("cover")}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${activeTab === "cover" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              מכתב מוטיבציה
            </button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Interview Prep Tab */}
      {activeTab === "prep" && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">שאלות ותשובות מותאמות לתפקיד ולחברה</p>
              <Button onClick={generatePrep} disabled={prepLoading}>
                {prepLoading ? "מכין שאלות... כ-20 שניות" : "הכן שאלות לראיון"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={generatePrep} disabled={prepLoading}>
                  {prepLoading ? "מחדש..." : "חדש שאלות"}
                </Button>
                <span className="text-xs text-muted-foreground">{questions.length} שאלות</span>
              </div>
              {questions.map((q, i) => (
                <JobQuestion
                  key={i}
                  q={q}
                  index={i}
                  regeneratingIndex={regeneratingIndex}
                  onRegenerate={regeneratePrepAnswer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Questions Tab */}
      {activeTab === "ask" && (
        <MyQuestionsTab
          jobId={jobId}
          initialQuestions={myQuestions ?? []}
        />
      )}

      {/* Tailored CV Tab */}
      {activeTab === "cv" && (
        <div className="space-y-4">
          {!tailoredCv ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">קורות חיים מותאמים למשרה ולחברה</p>
              <Button onClick={generateDocs} disabled={docsLoading}>
                {docsLoading ? "מכין מסמכים... כ-20 שניות" : "הכן קורות חיים ומכתב מוטיבציה"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={generateDocs} disabled={docsLoading}>
                  {docsLoading ? "מחדש..." : "חדש מסמכים"}
                </Button>
                <PdfPreviewButton
                  type="cv"
                  text={tailoredCv}
                  companyName={companyName}
                  roleName={roleName}
                />
              </div>
              <div className="bg-muted/20 border border-border rounded-md p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono">{tailoredCv}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cover Letter Tab */}
      {activeTab === "cover" && (
        <div className="space-y-4">
          {!coverLetter ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">מכתב מוטיבציה מותאם לחברה ולתפקיד</p>
              <Button onClick={generateDocs} disabled={docsLoading}>
                {docsLoading ? "מכין מסמכים... כ-20 שניות" : "הכן קורות חיים ומכתב מוטיבציה"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={generateDocs} disabled={docsLoading}>
                  {docsLoading ? "מחדש..." : "חדש מסמכים"}
                </Button>
                <PdfPreviewButton
                  type="cover"
                  text={coverLetter}
                  companyName={companyName}
                  roleName={roleName}
                />
              </div>
              <div className="bg-muted/20 border border-border rounded-md p-4 max-h-64 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-line">{coverLetter}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
