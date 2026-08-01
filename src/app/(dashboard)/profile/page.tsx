"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Award,
  Flame,
  HeartPulse,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Trophy,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { useTranslation } from "@/hooks/use-translation";
import { useCurrency } from "@/hooks/use-currency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DashboardMetricsResponse = {
  netBalance?: number;
  totalIncome?: number;
  totalExpenses?: number;
  transactionsTracked?: number;
  journalStreak?: number;
  completedGoals?: number;
  activeGoals?: number;
  goalCompletionRate?: number;
  rewardPoints?: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Tier = {
  tierName: string;
  tierFrom: number;
  tierTo: number;
  accent: {
    text: string;
    glow: string;
    ring: string;
    bar: string;
    bg: string;
  };
};

function getTierFromStreak(streak: number): Tier {
  const safe = Math.max(0, Math.floor(streak));

  if (safe < 5) {
    return {
      tierName: "Saver Rookie",
      tierFrom: 0,
      tierTo: 4,
      accent: {
        text: "text-cyan-400",
        glow: "shadow-[0_0_18px_rgba(34,211,238,0.35)]",
        ring: "ring-cyan-400/30",
        bar: "from-cyan-400/90 to-emerald-400/60",
        bg: "bg-cyan-500/10",
      },
    };
  }

  if (safe <= 11) {
    return {
      tierName: "Budgeting Master",
      tierFrom: 5,
      tierTo: 11,
      accent: {
        text: "text-amber-400",
        glow: "shadow-[0_0_18px_rgba(251,191,36,0.35)]",
        ring: "ring-amber-400/30",
        bar: "from-amber-400/90 to-orange-500/60",
        bg: "bg-amber-500/10",
      },
    };
  }

  if (safe <= 29) {
    return {
      tierName: "Premium Financial Member",
      tierFrom: 12,
      tierTo: 29,
      accent: {
        text: "text-emerald-400",
        glow: "shadow-[0_0_18px_rgba(52,211,153,0.35)]",
        ring: "ring-emerald-400/30",
        bar: "from-emerald-400/90 to-teal-500/60",
        bg: "bg-emerald-500/10",
      },
    };
  }

  return {
    tierName: "Elite Wealth Strategist",
    tierFrom: 30,
    tierTo: 999,
    accent: {
      text: "text-violet-400",
      glow: "shadow-[0_0_18px_rgba(167,139,250,0.35)]",
      ring: "ring-violet-400/30",
      bar: "from-violet-400/90 to-purple-500/60",
      bg: "bg-violet-500/10",
    },
  };
}

function tierMilestoneProgress(streak: number) {
  const safe = Math.max(0, Math.floor(streak));
  const tier = getTierFromStreak(safe);

  const tierSpan = Math.max(1, tier.tierTo - tier.tierFrom + 1);
  const currentInTier = clamp(safe - tier.tierFrom + 1, 0, tierSpan);
  const percent = Math.round((currentInTier / tierSpan) * 100);

  return {
    label: `${safe} / ${tier.tierTo} Days`,
    percent: clamp(percent, 0, 100),
  };
}

function calculateHealthScore(metrics: DashboardMetricsResponse): number {
  const income = metrics.totalIncome ?? 0;
  const expenses = metrics.totalExpenses ?? 0;
  const streak = metrics.journalStreak ?? 0;
  const points = metrics.rewardPoints ?? 0;
  const goalRate = metrics.goalCompletionRate ?? 0;

  let score = 0;

  // Income-expense ratio (40 points max)
  if (income > 0) {
    const savingsRate = Math.max(0, (income - expenses) / income);
    score += clamp(Math.round(savingsRate * 40), 0, 40);
  }

  // Journal streak (20 points max)
  score += clamp(Math.round((Math.min(streak, 30) / 30) * 20), 0, 20);

  // Goal completion (25 points max)
  score += clamp(Math.round((goalRate / 100) * 25), 0, 25);

  // Reward points signal (15 points max)
  score += clamp(Math.round((Math.min(points, 2000) / 2000) * 15), 0, 15);

  return clamp(score, 0, 100);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-xs font-semibold text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

function SkeletonCard({ title }: { title: string }) {
  return (
    <Card className="border-border/70 bg-card/60 shadow-sm shadow-border/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

type AchievementBadge = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  unlocked: boolean;
  color: string;
};

function AchievementCard({ badge }: { badge: AchievementBadge }) {
  const Icon = badge.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-all",
        badge.unlocked
          ? "border-border/70 bg-card/60"
          : "border-border/40 bg-muted/20 opacity-60"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          badge.unlocked ? badge.color : "bg-muted"
        )}
      >
        {badge.unlocked ? (
          <Icon className="h-4 w-4 text-white" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold">{badge.title}</p>
          {badge.unlocked && (
            <Badge variant="secondary" className="text-[10px] text-emerald-600">
              Unlocked
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {badge.description}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { user, isLoaded, isSignedIn } = useUser();
  const mounted = useMounted();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetch
  // ---------------------------------------------------------------------------

  const loadMetrics = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setMetricsLoading(true);
    setMetricsError(null);

    try {
      const res = await fetch("/api/dashboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load dashboard metrics.");
      }

      const data = (await res.json()) as DashboardMetricsResponse;
      setMetrics(data ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load metrics";
      setMetricsError(msg);
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (mounted) {
      loadMetrics();
    }
  }, [mounted, loadMetrics]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const streak = useMemo(
    () => Math.max(0, Math.floor(metrics?.journalStreak ?? 0)),
    [metrics]
  );
  const tier = useMemo(() => getTierFromStreak(streak), [streak]);
  const milestone = useMemo(() => tierMilestoneProgress(streak), [streak]);

  const healthScore = useMemo(() => {
    if (!metrics) return 0;
    return calculateHealthScore(metrics);
  }, [metrics]);

  const healthLabel = useMemo(() => {
    if (healthScore >= 85) return "Excellent";
    if (healthScore >= 65) return "Great";
    if (healthScore >= 45) return "Good";
    return "Needs Attention";
  }, [healthScore]);

  const healthColor = useMemo(() => {
    if (healthScore >= 80) return "text-emerald-500";
    if (healthScore >= 55) return "text-amber-500";
    return "text-rose-500";
  }, [healthScore]);

  const achievementBadges = useMemo((): AchievementBadge[] => {
    const transactionsTracked = metrics?.transactionsTracked ?? 0;
    const completedGoals = metrics?.completedGoals ?? 0;
    const goalRate = metrics?.goalCompletionRate ?? 0;

    return [
      {
        id: "first-transaction",
        icon: Trophy,
        title: "First Step",
        description: "Record your first financial transaction.",
        unlocked: transactionsTracked >= 1,
        color: "bg-amber-500",
      },
      {
        id: "streak-7",
        icon: Flame,
        title: "Week Warrior",
        description: "Maintain a 7-day journal streak.",
        unlocked: streak >= 7,
        color: "bg-orange-500",
      },
      {
        id: "first-goal",
        icon: Shield,
        title: "Goal Setter",
        description: "Complete your first financial goal.",
        unlocked: completedGoals >= 1,
        color: "bg-emerald-500",
      },
      {
        id: "streak-30",
        icon: Flame,
        title: "Monthly Master",
        description: "Maintain a 30-day consecutive streak.",
        unlocked: streak >= 30,
        color: "bg-rose-500",
      },
      {
        id: "champion-saver",
        icon: Award,
        title: "Champion Saver",
        description: "Reach 75% overall goal completion rate.",
        unlocked: goalRate >= 75,
        color: "bg-violet-500",
      },
      {
        id: "elite-tier",
        icon: Trophy,
        title: "Elite Strategist",
        description: "Achieve 30+ day streak and maintain Elite tier.",
        unlocked: streak >= 30 && tier.tierName === "Elite Wealth Strategist",
        color: "bg-indigo-500",
      },
    ];
  }, [metrics, streak, tier]);

  const unlockedCount = achievementBadges.filter((b) => b.unlocked).length;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (file: File | null) => {
    if (!file || !user) return;

    // Validate file type client-side
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      toast.error("Please select a valid image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB.");
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      await user.setProfileImage({ file });
      toast.success("Profile photo updated!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile image.";
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Skeleton render (mount guard)
  // ---------------------------------------------------------------------------

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto p-6">
        <div className="md:col-span-1">
          <div className="h-64 rounded-3xl border border-border/70 bg-card/60 animate-pulse" />
        </div>
        <div className="md:col-span-2 space-y-6">
          <SkeletonCard title="Journal Streak" />
          <SkeletonCard title="Financial Tier" />
          <SkeletonCard title="Financial Health" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto p-6">
      {/* ===== LEFT: Identity Card ===== */}
      <section className="space-y-4 md:col-span-1">
        <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-card/60 shadow-sm shadow-border/10">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
          <CardContent className="relative p-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  aria-hidden
                />

                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className={cn(
                    "group relative flex h-20 w-20 items-center justify-center rounded-full ring-1 ring-border/80 transition",
                    "bg-muted/30",
                    uploading
                      ? "cursor-not-allowed opacity-90"
                      : "hover:ring-emerald-400/50 hover:shadow-[0_0_26px_rgba(16,185,129,0.35)]"
                  )}
                  aria-label="Ubah Foto Profil"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-emerald-400/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  {user?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt={user.fullName ?? "Profile"}
                      className="relative h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600/20">
                      <span className="text-2xl font-bold text-emerald-200/90">
                        {(user?.fullName ?? "").slice(0, 1).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {uploading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Mengunggah
                        </span>
                      ) : (
                        "Ubah Foto"
                      )}
                    </div>
                  </div>
                </button>
              </div>

              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {t("profile.label.signedIn") ?? "Akun Aktif"}
                </p>
                <h2 className="truncate text-xl font-semibold tracking-tight">
                  {user?.fullName ?? "—"}
                </h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress ?? "—"}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill
                    className={cn("border-emerald-400/20 text-emerald-200", tier.accent.text)}
                  >
                    {tier.tierName}
                  </StatusPill>
                  <StatusPill className="border-border/70">
                    {streak} Day Streak
                  </StatusPill>
                </div>
              </div>
            </div>

            {/* Upload status */}
            <div className="mt-5 rounded-2xl border border-border/70 bg-background/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("profile.section.uploadTitle") ?? "Gallery"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {uploadError ?? (t("profile.section.uploadDesc") ?? "Klik foto untuk mengganti gambar profil.")}
                  </p>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs font-semibold",
                    uploadError ? "text-rose-400" : "text-emerald-200/90"
                  )}
                >
                  <Upload className="h-4 w-4 text-emerald-300" />
                  <span>{uploading ? "Uploading…" : uploadError ? "Error" : "Ready"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary Card */}
        <Card className="border-border/70 bg-card/60 shadow-sm shadow-border/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metricsLoading ? (
              <>
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-5 w-3/5 animate-pulse rounded bg-muted" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Net Balance</span>
                  <span className={cn("font-semibold", (metrics?.netBalance ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {format(metrics?.netBalance ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-semibold">{metrics?.transactionsTracked ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Goals</span>
                  <span className="font-semibold">{metrics?.activeGoals ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reward Points</span>
                  <span className="font-semibold text-violet-500">{metrics?.rewardPoints ?? 0}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ===== RIGHT: Gamification + Financial Habits ===== */}
      <section className="space-y-4 md:col-span-2">
        {/* Refresh button */}
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMetrics}
            disabled={metricsLoading}
            className="text-xs text-muted-foreground"
          >
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", metricsLoading && "animate-spin")} />
            {metricsLoading ? "Loading…" : "Refresh"}
          </Button>
        </div>

        {metricsLoading ? (
          <>
            <SkeletonCard title={t("profile.cards.journal") ?? "Journal Streak"} />
            <SkeletonCard title={t("profile.cards.tier") ?? "Financial Tier"} />
            <SkeletonCard title={t("profile.cards.health") ?? "Financial Health"} />
          </>
        ) : (
          <>
            {/* CARD 1: Journal Streak */}
            <Card className="border-border/70 bg-card/60 shadow-sm shadow-border/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">
                  {t("profile.cards.journal") ?? "Journal Streak"}
                </CardTitle>
                <div className="rounded-xl bg-orange-500/10 p-2 ring-1 ring-orange-400/20">
                  <Flame className="h-5 w-5 text-orange-400" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {t("profile.streak.title") ?? "Your current streak"}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-4xl font-semibold tracking-tight",
                        "bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-300 bg-clip-text text-transparent",
                        "drop-shadow-[0_0_22px_rgba(249,115,22,0.25)]"
                      )}
                    >
                      {streak}
                      <span className="ml-2 text-sm font-medium text-muted-foreground">Days</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-muted-foreground">{tier.tierName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("profile.streak.hint") ?? "Keep your journal habit alive."}
                    </p>
                  </div>
                </div>

                {metricsError ? (
                  <p className="text-xs text-destructive">{metricsError}</p>
                ) : (
                  <div className="rounded-xl border border-border/70 bg-background/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {t("profile.streak.progress") ?? "Momentum"}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className={cn("font-semibold", tier.accent.text, tier.accent.glow)}>
                        {tier.tierName}
                      </span>
                      <span className="text-muted-foreground">{milestone.label}</span>
                    </div>
                    <Progress value={milestone.percent} className="mt-3 h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CARD 2: Financial Tier & Milestone Progress */}
            <Card className="border-border/70 bg-card/60 shadow-sm shadow-border/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">
                  {t("profile.cards.tier") ?? "Financial Tier"}
                </CardTitle>
                <div className={cn("rounded-xl p-2 ring-1", tier.accent.bg, tier.accent.ring)}>
                  <div className={cn("h-2.5 w-2.5 rounded-full", tier.accent.text.replace("text-", "bg-"))} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {t("profile.tier.current") ?? "Current tier"}
                    </p>
                    <p className={cn("mt-2 text-2xl font-semibold tracking-tight", tier.accent.text, tier.accent.glow)}>
                      {tier.tierName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{milestone.percent}%</p>
                    <p className="text-xs text-muted-foreground">{milestone.label}</p>
                  </div>
                </div>

                {/* Progress bar with markers */}
                <div className="space-y-3 rounded-2xl border border-border/70 bg-background/30 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Milestone Progress</span>
                    <span className="font-semibold text-foreground/80">{milestone.label}</span>
                  </div>

                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700", "bg-gradient-to-r", tier.accent.bar)}
                      style={{ width: `${milestone.percent}%` }}
                    />
                    <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
                    {milestone.percent > 5 && (
                      <div
                        className="absolute inset-y-0"
                        style={{ left: `calc(${milestone.percent}% - 8px)` }}
                      >
                        <div
                          className={cn(
                            "h-5 w-5 -translate-y-[1px] rounded-full bg-background/90",
                            "ring-2",
                            tier.accent.ring
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* Tier labels */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
                    {["Rookie", "Master", "Premium", "Elite"].map((label) => (
                      <span key={label} className="text-center">{label}</span>
                    ))}
                  </div>
                </div>

                {/* Next tier hint */}
                {tier.tierName !== "Elite Wealth Strategist" && (
                  <p className="text-xs text-muted-foreground">
                    🎯 Keep your streak going to unlock the next tier!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* CARD 3: Financial Health Score */}
            <Card className="border-border/70 bg-card/60 shadow-sm shadow-border/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">
                  {t("profile.cards.health") ?? "Financial Health"}
                </CardTitle>
                <div className="rounded-xl bg-rose-500/10 p-2 ring-1 ring-rose-400/20">
                  <HeartPulse className="h-5 w-5 text-rose-400" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {t("profile.health.title") ?? "Health score"}
                    </p>
                    <p className={cn("mt-2 text-4xl font-semibold tracking-tight", healthColor)}>
                      {healthScore}
                      <span className="ml-2 text-sm font-medium text-muted-foreground">/100</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={cn("text-sm font-semibold", healthColor)}>{healthLabel}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("profile.health.hint") ?? "Signals derived from your spending rhythm."}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Rating</span>
                    <span className={cn("text-xs font-semibold", healthColor)}>
                      {healthScore >= 80 ? "Strong" : healthScore >= 55 ? "Steady" : "Rebuild"}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        healthScore >= 80
                          ? "bg-emerald-500"
                          : healthScore >= 55
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      )}
                      style={{ width: `${clamp(healthScore, 0, 100)}%` }}
                    />
                  </div>

                  {/* Score breakdown */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-border/70 bg-card/40 p-3">
                      <p className="font-semibold">{streak} Days</p>
                      <p className="text-muted-foreground">Streak momentum</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-card/40 p-3">
                      <p className={cn("font-semibold", tier.accent.text)}>{tier.tierName}</p>
                      <p className="text-muted-foreground">Tier commitment</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-card/40 p-3">
                      <p className="font-semibold">{(metrics?.goalCompletionRate ?? 0).toFixed(0)}%</p>
                      <p className="text-muted-foreground">Goal completion</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-card/40 p-3">
                      <p className="font-semibold text-violet-500">{metrics?.rewardPoints ?? 0}</p>
                      <p className="text-muted-foreground">Reward points</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 4: Achievements */}
            <Card className="border-border/70 bg-card/60 shadow-sm shadow-border/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">
                  {t("profile.achievements.title") ?? "Achievements"}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {unlockedCount}/{achievementBadges.length} Unlocked
                </Badge>
              </CardHeader>

              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("profile.achievements.description") ??
                    "Track progress milestones and collect badges for consistent financial wins."}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {achievementBadges.map((badge) => (
                    <AchievementCard key={badge.id} badge={badge} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
