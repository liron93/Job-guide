"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article-card";
import type { ArticleData } from "@/components/article-card";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "oldest" | "relevance";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "חדש לישן" },
  { key: "oldest", label: "ישן לחדש" },
  { key: "relevance", label: "רלוונטיות" },
];

function sortArticles(articles: ArticleData[], sort: SortKey): ArticleData[] {
  const copy = [...articles];
  if (sort === "newest") {
    return copy.sort((a, b) => {
      if (!a.article_published_at && !b.article_published_at) return 0;
      if (!a.article_published_at) return -1;
      if (!b.article_published_at) return 1;
      return b.article_published_at.localeCompare(a.article_published_at);
    });
  }
  if (sort === "oldest") {
    return copy.sort((a, b) => {
      if (!a.article_published_at && !b.article_published_at) return 0;
      if (!a.article_published_at) return 1;
      if (!b.article_published_at) return -1;
      return a.article_published_at.localeCompare(b.article_published_at);
    });
  }
  // relevance
  return copy.sort((a, b) => b.pm_relevance_score - a.pm_relevance_score);
}

export function ArticlesList({ articles }: { articles: ArticleData[] }) {
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const router = useRouter();

  const visible = useMemo(
    () => sortArticles(articles.filter((a) => !deletedIds.has(a.id)), sort),
    [articles, deletedIds, sort]
  );
  const allSelected = visible.length > 0 && selected.size === visible.length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(visible.map((a) => a.id)));
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    setBulkDeleting(true);
    setDeletedIds((prev) => new Set(Array.from(prev).concat(ids)));
    setSelected(new Set());
    setSelectMode(false);
    await Promise.all(ids.map((id) => fetch(`/api/articles/${id}`, { method: "DELETE" })));
    setBulkDeleting(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {/* Sort pills */}
        {!selectMode && (
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-colors",
                  sort === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Select mode controls */}
        {selectMode ? (
          <>
            <button
              onClick={toggleAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {allSelected ? "בטל הכל" : "בחר הכל"}
            </button>
            <Button variant="outline" size="sm" onClick={exitSelectMode}>
              ביטול
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
            בחר למחיקה
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {visible.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            selectMode={selectMode}
            isSelected={selected.has(article.id)}
            onToggleSelect={() => toggleSelect(article.id)}
            onDeleted={() => setDeletedIds((prev) => new Set(Array.from(prev).concat(article.id)))}
          />
        ))}
      </div>

      {selectMode && selected.size > 0 && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-background/95 backdrop-blur px-4 py-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{selected.size} נבחרו</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? "מוחק..." : `מחק ${selected.size} מאמרים`}
          </Button>
        </div>
      )}
    </div>
  );
}
