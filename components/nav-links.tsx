"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Newspaper,
  Briefcase,
  Clock,
  FileText,
  User,
  Library,
  Settings,
  Video,
} from "lucide-react";

const NAV = [
  { href: "/", label: "דשבורד", icon: LayoutDashboard, exact: true },
  { href: "/guide", label: "מדריך", icon: BookOpen },
  { href: "/interview", label: "ראיון מדומה", icon: Video },
  { href: "/questions", label: "שאלות", icon: MessageSquare },
  { href: "/concepts", label: "מושגים", icon: Library },
  { href: "/articles", label: "מאמרים", icon: Newspaper },
  { href: "/jobs", label: "משרות", icon: Briefcase },
  { href: "/history", label: "היסטוריה", icon: Clock },
  { href: "/cv", label: "קורות חיים", icon: FileText },
  { href: "/profile", label: "פרופיל", icon: User },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
