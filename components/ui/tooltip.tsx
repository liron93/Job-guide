"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function InfoTooltip({ children, className }: { children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!visible) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [visible]);

  return (
    <span
      ref={ref}
      className={cn("relative inline-flex items-center", className)}
    >
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="flex items-center focus:outline-none"
        aria-label="מידע נוסף"
      >
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
      </button>
      {visible && (
        <div
          className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-border bg-popover text-popover-foreground text-sm shadow-lg p-3 z-50"
          dir="rtl"
        >
          {children}
          <div className="absolute top-full left-3 border-4 border-transparent border-t-border" style={{ marginTop: "-1px" }} />
          <div className="absolute top-full left-3 border-4 border-transparent border-t-popover" />
        </div>
      )}
    </span>
  );
}
