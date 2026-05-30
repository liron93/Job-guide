"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { STATUS_LABELS, STATUS_ORDER } from "@/lib/job-status";

export function JobStatusSelect({ jobId, current }: { jobId: string; current: string }) {
  const [status, setStatus] = useState(current);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(newStatus: string) {
    setLoading(true);
    setStatus(newStatus);
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  const current_style = STATUS_LABELS[status];

  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={(e) => update(e.target.value)}
        disabled={loading}
        className={`appearance-none text-xs font-medium px-3 py-1 rounded-full border cursor-pointer ${current_style?.color ?? ""} bg-transparent focus:outline-none`}
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s} className="bg-background text-foreground">
            {STATUS_LABELS[s]?.label}
          </option>
        ))}
      </select>
    </div>
  );
}
