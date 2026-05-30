"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-7 w-7 rounded-lg" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200",
        "hover:bg-foreground/8 text-muted-foreground hover:text-foreground"
      )}
      title={isDark ? "עבור למצב בהיר" : "עבור למצב כהה"}
    >
      <Sun
        className={cn(
          "h-4 w-4 absolute transition-all duration-300",
          isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        )}
      />
      <Moon
        className={cn(
          "h-4 w-4 absolute transition-all duration-300",
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
        )}
      />
    </button>
  );
}
