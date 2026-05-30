"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteArticleButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          {loading ? "מוחק..." : "מחק"}
        </button>
        <span className="text-muted-foreground text-xs">|</span>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ביטול
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
      title="מחק מאמר"
    >
      ✕
    </button>
  );
}
