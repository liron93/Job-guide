"use client";

import { useState, useMemo } from "react";
import concepts from "@/data/concepts.json";

const CATEGORIES = Array.from(new Set(concepts.map((c) => c.category))).sort();

const CATEGORY_COLORS: Record<string, string> = {
  "Metrics":        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Prioritization": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Strategy":       "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "Research":       "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "Execution":      "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "Experimentation":"bg-pink-500/15 text-pink-400 border-pink-500/30",
  "Design":         "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "Growth":         "bg-green-500/15 text-green-400 border-green-500/30",
  "Business Model": "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export default function ConceptsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return concepts.filter((c) => {
      const matchSearch = !q || c.term.toLowerCase().includes(q) || c.explanation.toLowerCase().includes(q);
      const matchCat = !activeCategory || c.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">מושגים</h1>
        <p className="text-muted-foreground text-sm mt-1">{concepts.length} מושגים שחשוב להכיר לריאיון PM</p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="חפש מושג..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        dir="rtl"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            !activeCategory
              ? "bg-primary/20 text-primary border-primary/30"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          הכל ({concepts.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = concepts.filter((c) => c.category === cat).length;
          const colorClass = CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground border-border";
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeCategory === cat ? colorClass : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Concepts grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">לא נמצאו מושגים</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((concept) => {
            const colorClass = CATEGORY_COLORS[concept.category] ?? "bg-muted/30 text-muted-foreground border-border";
            return (
              <div
                key={concept.term}
                className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-border/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${colorClass}`}>
                    {concept.category}
                  </span>
                  <p className="text-sm font-semibold text-right">{concept.term}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed text-right">
                  {concept.explanation}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
