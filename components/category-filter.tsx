"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  "הכל":           "border-white/10 text-foreground bg-white/5 hover:bg-white/10",
  "Terminology":   "border-violet-500/30 text-violet-400 bg-violet-500/10 hover:bg-violet-500/20",
  "Prioritization":"border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20",
  "Estimation":    "border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20",
  "Metrics":       "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20",
  "Product Sense": "border-pink-500/30 text-pink-400 bg-pink-500/10 hover:bg-pink-500/20",
  "Leadership":    "border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20",
  "Strategy":      "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20",
  "Execution":     "border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20",
  "Behavioral":    "border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20",
  "Technical":     "border-slate-400/30 text-slate-400 bg-slate-400/10 hover:bg-slate-400/20",
  "Design":        "border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20",
  "Growth":        "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20",
  "AI & Data":     "border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20",
  "Case Study":    "border-teal-500/30 text-teal-400 bg-teal-500/10 hover:bg-teal-500/20",
};

const ACTIVE_SUFFIX = "ring-1 ring-current font-semibold opacity-100";
const INACTIVE_SUFFIX = "opacity-60 hover:opacity-100";

const CATEGORIES = Object.keys(CATEGORY_STYLES);

const DIFFICULTIES = [
  { value: "הכל", label: "כל הרמות" },
  { value: "easy", label: "קל" },
  { value: "medium", label: "בינוני" },
  { value: "hard", label: "קשה" },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  easy:   "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20",
  medium: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20",
  hard:   "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20",
  "הכל":  "border-white/10 text-foreground bg-white/5 hover:bg-white/10",
};

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "הכל";
  const activeDifficulty = searchParams.get("difficulty") ?? "הכל";

  function update(key: "category" | "difficulty", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "הכל") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/questions?${qs}` : "/questions");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const base = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES["הכל"];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => update("category", cat)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all duration-150",
                base,
                isActive ? ACTIVE_SUFFIX : INACTIVE_SUFFIX
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {DIFFICULTIES.map(({ value, label }) => {
          const base = DIFFICULTY_STYLES[value];
          const isActive = activeDifficulty === value;
          return (
            <button
              key={value}
              onClick={() => update("difficulty", value)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all duration-150",
                base,
                isActive ? ACTIVE_SUFFIX : INACTIVE_SUFFIX
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
