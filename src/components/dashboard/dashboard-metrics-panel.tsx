"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCompactCurrency } from "@/hooks/use-compact-currency";
import { useTranslation } from "@/hooks/use-translation";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import type { DashboardMetrics } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export function DashboardMetricsPanel() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the new compact currency hook
  const { compact } = useCompactCurrency();
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();

        if (!active) return;

        if (!response.ok || payload?.error) {
          setError(payload?.error || t("dashboard.fetchError"));
          return;
        }

        setMetrics(payload as DashboardMetrics);
      })
      .catch((fetchError) => {
        console.error("Dashboard metrics fetch failed:", fetchError);
        if (!active) return;
        setError(t("dashboard.fetchError"));
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [t]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {t("dashboard.noData")}
      </div>
    );
  }

  // Format net balance compactly
  const netBalance = compact(metrics.netBalance);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">{t("dashboard.netBalance")}</p>
                <p 
                  className={cn("mt-3 font-semibold truncate transition-all", netBalance.fontClass)}
                  title={netBalance.full}
                >
                  {netBalance.compact}
                  {netBalance.isAbbreviated && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground align-super">
                      ≈
                    </span>
                  )}
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.transactionsTracked")}</p>
                <p className="mt-3 text-3xl font-semibold">{metrics.transactionsTracked}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.journalStreak")}</p>
                <p className="mt-3 text-3xl font-semibold">{metrics.journalStreak}</p>
              </div>
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.goalCompletion")}</p>
                <p className="mt-3 text-3xl font-semibold">{metrics.goalCompletionRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <Progress value={metrics.goalCompletionRate} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("dashboard.completedGoals")}</p>
          <p className="mt-3 text-3xl font-semibold">{metrics.completedGoals}</p>
        </Card>
        <Card className="border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("dashboard.activeGoals")}</p>
          <p className="mt-3 text-3xl font-semibold">{metrics.activeGoals}</p>
        </Card>
        <Card className="border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("dashboard.rewardPoints")}</p>
          <p className="mt-3 text-3xl font-semibold">{metrics.rewardPoints}</p>
        </Card>
      </div>
    </div>
  );
}
