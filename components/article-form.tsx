"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type UrlStatus = "pending" | "processing" | "done" | { error: string };

function StatusIcon({ status }: { status: UrlStatus }) {
  if (status === "pending") return <span className="text-muted-foreground">⏳</span>;
  if (status === "processing") return <span className="animate-spin inline-block">⟳</span>;
  if (status === "done") return <span className="text-green-400">✓</span>;
  return <span className="text-red-400">✗</span>;
}

export function ArticleForm() {
  const [text, setText] = useState("");
  const [statuses, setStatuses] = useState<Record<string, UrlStatus>>({});
  const [running, setRunning] = useState(false);
  const router = useRouter();

  const isProcessing = Object.values(statuses).some((s) => s === "processing" || s === "pending");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = text
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (!urls.length) return;

    setRunning(true);
    const initial: Record<string, UrlStatus> = {};
    for (const u of urls) initial[u] = "pending";
    setStatuses(initial);

    for (const url of urls) {
      setStatuses((prev) => ({ ...prev, [url]: "processing" }));
      try {
        const res = await fetch("/api/articles/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatuses((prev) => ({ ...prev, [url]: { error: data.error ?? "שגיאה" } }));
        } else {
          setStatuses((prev) => ({ ...prev, [url]: "done" }));
        }
      } catch {
        setStatuses((prev) => ({ ...prev, [url]: { error: "שגיאת רשת" } }));
      }
    }

    setRunning(false);
    router.refresh();
  }

  function handleClear() {
    setText("");
    setStatuses({});
  }

  const statusEntries = Object.entries(statuses);
  const doneCount = statusEntries.filter(([, s]) => s === "done").length;
  const allDone = statusEntries.length > 0 && !isProcessing;

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          placeholder={"הדבק לינקים — לינק אחד בכל שורה\nhttps://...\nhttps://..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={running}
          rows={3}
          dir="ltr"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 resize-none font-mono"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={running || !text.trim()}>
            {running ? `מנתח... (${doneCount}/${statusEntries.length})` : "סכם"}
          </Button>
          {allDone && (
            <Button type="button" variant="outline" onClick={handleClear}>
              נקה
            </Button>
          )}
        </div>
      </form>

      {statusEntries.length > 0 && (
        <div className="space-y-1.5">
          {statusEntries.map(([url, status]) => (
            <div key={url} className="flex items-start gap-2 text-xs">
              <StatusIcon status={status} />
              <span className="text-muted-foreground truncate flex-1 font-mono" dir="ltr">{url}</span>
              {typeof status === "object" && (
                <span className="text-red-400 shrink-0">{status.error}</span>
              )}
            </div>
          ))}
          {allDone && doneCount > 0 && (
            <p className="text-xs text-green-400">✓ {doneCount} מאמרים נוספו — ראה ברשימה למטה</p>
          )}
        </div>
      )}
    </div>
  );
}
