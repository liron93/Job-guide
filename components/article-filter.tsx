"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "", label: "הכל" },
  { value: "must_read", label: "חובה לקרוא" },
  { value: "worth_reading", label: "שווה קריאה" },
  { value: "skip", label: "אפשר לדלג" },
];

export function ArticleFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("rec") ?? "";

  function select(value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set("rec", value);
    else p.delete("rec");
    router.push(`/articles${p.toString() ? `?${p.toString()}` : ""}`);
    router.refresh();
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => select(opt.value)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            current === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
