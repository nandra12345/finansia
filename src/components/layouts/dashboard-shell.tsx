"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Bell,
  BookText,
  Calculator,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Receipt,
  Settings,
  Target,
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
import { useTranslation, type TranslationPath } from "@/hooks/use-translation";

interface SidebarItem {
  icon: React.ElementType;
  label: TranslationPath;
  href: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { icon: LayoutDashboard, label: "common.overview", href: "/overview" },
  { icon: Receipt, label: "common.transactions", href: "/transactions" },
  { icon: Target, label: "common.planning", href: "/planning" },
  { icon: BookText, label: "common.diary", href: "/diary" },
  { icon: Calculator, label: "common.calculator", href: "/calculator" },
  { icon: Settings, label: "common.settings", href: "/settings" },
];

const NOTIFICATIONS = [
  {
    id: "budget-warning",
    title: "Budget watch",
    body: "Food expenses are trending above weekly average.",
  },
  {
    id: "goal-milestone",
    title: "Goal milestone",
    body: "You are close to your next planning milestone.",
  },
] as const;

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
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/overview" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">Finansia</p>
            <p className="text-xs text-muted-foreground">Finance OS</p>
          </div>
        </Link>
      </div>

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
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "mr-2 h-4 w-4",
                  isActive ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground"
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label="Open notifications" />}
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("common.notifications")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {NOTIFICATIONS.map((notification) => (
          <DropdownMenuItem key={notification.id} className="block py-2">
            <p className="text-xs font-semibold text-foreground">{notification.title}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const mounted = useMounted();
  const { t } = useTranslation();

  if (!mounted) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="h-9 gap-2 px-2" aria-label="Open profile menu" />}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {getInitials(user?.fullName)}
        </span>
        <span className="hidden max-w-24 truncate text-xs sm:block">{user?.firstName ?? t("common.account")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p className="text-xs font-semibold text-foreground">{user?.fullName ?? "Signed in"}</p>
          <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress ?? ""}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/settings" className="w-full">
            {t("common.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await signOut({ redirectUrl: "/" });
          }}
        >
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

  const breadcrumbSegments = useMemo(() => {
    return pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => {
        const labelKey = `common.${segment.replace(/-/g, "")}` as TranslationPath;
        // Fallback to title case if key doesn't exist in common (though it should for our main routes)
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
                    <span className={cn("truncate", index === breadcrumbSegments.length - 1 && "text-foreground")}>{segment.label}</span>
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

