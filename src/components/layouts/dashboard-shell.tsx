"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle } from "@/types/news";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Bell,
  BookText,
  Calculator,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Receipt,
  Settings,
  Target,
  User,
  UserCircle2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { useMounted } from "@/hooks/use-mounted";
import { useTranslation } from "@/hooks/use-translation";
import { useFinanceStore } from "@/store/use-finance-store";
import { usePlanningStore } from "@/store/use-planning-store";
import { useDiaryStore } from "@/store/use-diary-store";
import { useSettingsStore } from "@/store/use-settings-store";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { icon: LayoutDashboard, label: "common.overview", href: "/overview" },
  { icon: Receipt, label: "common.transactions", href: "/transactions" },
  { icon: Target, label: "common.planning", href: "/planning" },
  { icon: BookText, label: "common.diary", href: "/diary" },
  { icon: Newspaper, label: "common.news", href: "/news" },
  { icon: Calculator, label: "common.calculator", href: "/calculator" },
  { icon: UserCircle2, label: "common.profile", href: "/profile" },
  { icon: Settings, label: "common.settings", href: "/settings" },
];

function getInitials(name?: string | null) {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toTitleCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function DashboardSidebar({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      {/* BRANDING LOGO DIUBAH LEBIH BESAR */}
      <div className="flex h-20 items-center border-b border-border px-4 py-2">
        <Link href="/overview" className="flex w-full items-center" onClick={onNavigate}>
          <img 
            src="/logo.png" 
            alt="Finansia Logo" 
            className="h-14 w-auto max-w-full object-contain object-left transition-transform hover:scale-105" 
          />
        </Link>
      </div>

      {/* NAVIGASI UTAMA SIDEBAR */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "mr-2 h-4 w-4",
                  isActive ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                )}
              />
              {t(item.label)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NotificationsMenu() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/news?category=global&search=finance", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Unable to load market headlines");
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        setArticles(Array.isArray(data.articles) ? data.articles.slice(0, 3) : []);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to load notifications");
        setArticles([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("common.notifications")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">Loading market highlights…</div>
          ) : error ? (
            <div className="px-4 py-3 text-xs text-destructive">{error}</div>
          ) : articles.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">No recent headlines available.</div>
          ) : (
            articles.map((article) => (
              <DropdownMenuItem
                key={article.id}
                className="block py-2"
                onClick={() => window.open(article.url, "_blank", "noopener,noreferrer")}
              >
                <p className="text-xs font-semibold text-foreground">{article.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{article.description || article.summary}</p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const mounted = useMounted();
  const { t } = useTranslation();

  if (!mounted) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("profile.navigate")}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
          {getInitials(user?.fullName)}
        </span>
        <span className="hidden max-w-[8rem] truncate text-xs sm:block">
          {user?.firstName ?? t("common.account")}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{user?.fullName || t("common.account")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex cursor-pointer items-center"
          onClick={() => router.push("/profile")}
        >
          <User className="mr-2 h-4 w-4" />
          {t("common.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex cursor-pointer items-center text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 dark:focus:bg-rose-500/20"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mounted = useMounted();
  const { t } = useTranslation();

  const fetchTransactions = useFinanceStore((s) => s.fetchTransactions);
  const fetchGoals = usePlanningStore((s) => s.fetchGoals);
  const fetchNotes = useDiaryStore((s) => s.fetchNotes);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    if (mounted) {
      fetchTransactions();
      fetchGoals();
      fetchNotes();
      fetchSettings();
    }
  }, [mounted, fetchTransactions, fetchGoals, fetchNotes, fetchSettings]);

  const breadcrumbSegments = useMemo(() => {
    return pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => {
      const labelKey = `common.${segment.replace(/-/g, "")}`;
        return {
          label: segment === "overview" || segment === "transactions" || segment === "planning" || segment === "diary" || segment === "calculator" || segment === "settings"
            ? t(labelKey)
            : toTitleCase(segment.replace(/-/g, " ")),
        };
      });
  }, [pathname, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/80 bg-background lg:block">
        <DashboardSidebar pathname={pathname} />
      </aside>

      {isMobileMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background lg:hidden">
            <div className="flex h-16 items-center justify-end border-b border-border px-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DashboardSidebar pathname={pathname} onNavigate={() => setIsMobileMenuOpen(false)} />
          </aside>
        </>
      ) : null}

      <main className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                {breadcrumbSegments.map((segment, index) => (
                  <span key={`${segment.label}-${index}`} className="flex min-w-0 items-center gap-1">
                    {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : null}
                    <span className={cn("truncate", index === breadcrumbSegments.length - 1 && "text-foreground")}>
                      {segment.label === "news" ? "Financial News" : segment.label}
                    </span>
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {mounted && (
                <>
                  <NotificationsMenu />
                  <ModeToggle />
                  <ProfileMenu />
                </>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}