"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed right-0 left-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-background/95 nav-blur px-4 md:hidden">
        <ThemeToggle />
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/25">
            <span className="text-[10px] font-black leading-none text-white tracking-tight">PM</span>
          </div>
          <span className="font-bold text-sm">המדריך למועמד</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-40 flex h-full w-56 flex-col",
          "border-l border-border/50 bg-background/95 nav-blur",
          "transition-transform duration-200",
          "translate-x-full md:translate-x-0",
          open && "translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-border/50 px-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/25">
              <span className="text-[11px] font-black leading-none text-white tracking-tight">PM</span>
            </div>
            <span className="font-bold">המדריך למועמד</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 scrollbar-hide">
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>

        {/* Bottom: theme + logout */}
        <div className="shrink-0 border-t border-border/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">מצב תצוגה</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>יציאה</span>
          </button>
        </div>
      </aside>
    </>
  );
}
