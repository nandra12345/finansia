"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import {
  buildCategoryBreakdown,
  buildMonthlyTrends,
  buildWeeklyTrends,
  calculateBudget503020,
  calculateEmergencyFundStatus,
  calculateFinancialHealthScore,
  calculateSavingsConsistencyScore,
  generateFinancialInsights,
} from "@/lib/math/finance";
import { useFinanceStore } from "@/store/use-finance-store";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCompactCurrency } from "@/hooks/use-compact-currency";
import { useTranslation } from "@/hooks/use-translation";
import { DashboardMetricsPanel } from "@/components/dashboard/dashboard-metrics-panel";

// ─── lazy chart imports ────────────────────────────────────────────────────
const OverviewChart = dynamic(
  () => import("@/components/charts/overview-chart").then((m) => m.OverviewChart),
  { ssr: false }
);
const CategoryChart = dynamic(
  () => import("@/components/charts/category-chart").then((m) => m.CategoryChart),
  { ssr: false }
);
const MonthlyTrendChart = dynamic(
  () =>
    import("@/components/charts/monthly-trend-chart").then((m) => m.MonthlyTrendChart),
  { ssr: false }
);

// ─── constants ─────────────────────────────────────────────────────────────
const NEEDS_CATEGORIES = new Set(["Food", "Bills", "Transport", "Healthcare", "Education"]);
const WANTS_CATEGORIES = new Set(["Entertainment", "Shopping", "Travel"]);

// ─── helpers ───────────────────────────────────────────────────────────────

/** Visual fill colour for a budget progress bar */
function budgetBarColor(pct: number) {
  if (pct >= 100) return "bg-rose-500";
  if (pct >= 80) return "bg-amber-400";
  return "bg-emerald-500";
}

// ─── sub-components ────────────────────────────────────────────────────────

/**
 * Stat card that auto-shrinks its value text when the string is long.
 * The full value is exposed via `title` for accessibility / hover tooltip.
 */
function StatCard({
  label,
  displayValue,
  fullValue,
  icon,
  trend,
  sub,
}: {
  label: string;
  displayValue: string;
  fullValue: string;
  icon: React.ReactNode;
  trend: number;
  sub?: string;
}) {
  const isPositive = trend >= 0;

  // Adaptive font: shrink if the display string is long
  const valueLen = displayValue.length;
  const valueClass =
    valueLen <= 10
      ? "text-2xl"
      : valueLen <= 13
      ? "text-xl"
      : valueLen <= 16
      ? "text-lg"
      : "text-base";

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        {/* header row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground leading-tight">{label}</p>
          <div className="shrink-0 rounded-lg bg-muted p-2">{icon}</div>
        </div>

        {/* value row */}
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p
            className={cn("font-semibold tracking-tight transition-all", valueClass)}
            title={fullValue !== displayValue ? fullValue : undefined}
          >
            {displayValue}
            {displayValue !== fullValue && (
              <span className="ml-1 text-xs font-normal text-muted-foreground align-super">
                ≈
              </span>
            )}
          </p>

          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 text-xs font-medium",
              isPositive ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {isPositive ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {isPositive ? "+" : ""}
            {trend.toFixed(1)}%
          </Badge>
        </div>

        {/* optional sub-label */}
        {sub && (
          <p className="mt-2 text-[11px] text-muted-foreground leading-tight">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Budget 50/30/20 row item with overflow indicator */
function BudgetRow({
  label,
  spent,
  budget,
  displaySpent,
  displayBudget,
  colorClass,
  t,
}: {
  label: string;
  spent: number;
  budget: number;
  displaySpent: string;
  displayBudget: string;
  colorClass: string;
  t: (key: string, args?: any) => string;
}) {
  const pct = budget === 0 ? 0 : Math.round((spent / budget) * 100);
  const over = pct > 100;
  const clampedPct = Math.min(pct, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className={cn("font-semibold tabular-nums", over ? "text-rose-500" : "text-muted-foreground")}>
          {displaySpent}
          <span className="font-normal text-muted-foreground"> / {displayBudget}</span>
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all", budgetBarColor(pct))}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{pct}% {t("dashboard.used")}</span>
        {over && (
          <span className="flex items-center gap-0.5 text-rose-500 font-semibold">
            <AlertTriangle className="h-3 w-3" /> {t("dashboard.overBudget")}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const transactions = useFinanceStore((state) => state.transactions);
  const { compact, convert, format } = useCompactCurrency();
  const { t } = useTranslation();

  /** Maps a 0-100 score to a readable label + colour */
  const healthLabel = (score: number) => {
    if (score >= 80) return { label: t("dashboard.excellent"), color: "text-emerald-500", ring: "ring-emerald-400/30" };
    if (score >= 65) return { label: t("dashboard.good"), color: "text-teal-500", ring: "ring-teal-400/30" };
    if (score >= 45) return { label: t("dashboard.fair"), color: "text-amber-500", ring: "ring-amber-400/30" };
    return { label: t("dashboard.needsWork"), color: "text-rose-500", ring: "ring-rose-400/30" };
  };

  // ── derived metrics ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const converted = transactions.map((tx) => ({ ...tx, amount: convert(tx.amount) }));

    const monthlyTrends = buildMonthlyTrends(converted, 6);
    const weeklyTrends = buildWeeklyTrends(converted, 8);
    const categoryBreakdown = buildCategoryBreakdown(converted, 5);

    const income = converted
      .filter((tx) => tx.type === "income")
      .reduce((s, tx) => s + tx.amount, 0);
    const expenses = converted
      .filter((tx) => tx.type === "expense")
      .reduce((s, tx) => s + tx.amount, 0);
    const balance = income - expenses;
    const savings = Math.max(balance, 0);

    const totalRecentExpense = monthlyTrends.reduce((sum, m) => sum + m.expense, 0);
    const activeMonthsWithExpense = monthlyTrends.filter((m) => m.expense > 0).length || 1;
    const avgMonthlyExpense = totalRecentExpense > 0 
      ? totalRecentExpense / activeMonthsWithExpense 
      : (expenses > 0 ? expenses / 12 : 0); // fallback to all-time avg roughly if recent is 0
      
    const emergencyFund = calculateEmergencyFundStatus(avgMonthlyExpense, savings);
    const healthScore = calculateFinancialHealthScore(
      income, expenses, savings, 0, emergencyFund.monthsCovered
    );
    const savingsConsistency = calculateSavingsConsistencyScore(
      monthlyTrends.map((m) => Math.max(0, m.net))
    );
    const insights = generateFinancialInsights(weeklyTrends, monthlyTrends, categoryBreakdown, healthScore);

    // 50/30/20 budget (current month only)
    const now = new Date();
    const currentMonthExpenses = converted.filter((tx) => {
      const d = new Date(tx.date);
      return (
        tx.type === "expense" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
    const needsSpent = currentMonthExpenses
      .filter((tx) => NEEDS_CATEGORIES.has(tx.category))
      .reduce((s, tx) => s + tx.amount, 0);
    const wantsSpent = currentMonthExpenses
      .filter((tx) => WANTS_CATEGORIES.has(tx.category))
      .reduce((s, tx) => s + tx.amount, 0);
    const savingsSpent = currentMonthExpenses
      .filter((tx) => !NEEDS_CATEGORIES.has(tx.category) && !WANTS_CATEGORIES.has(tx.category))
      .reduce((s, tx) => s + tx.amount, 0);
    const budget = calculateBudget503020(income);

    return {
      income,
      expenses,
      balance,
      healthScore,
      savingsConsistency,
      emergencyFund,
      weeklyTrends,
      monthlyTrends,
      categoryBreakdown,
      insights,
      budget,
      budgetSpent: { needs: needsSpent, wants: wantsSpent, savings: savingsSpent },
      converted,
    };
  }, [transactions, convert]);

  // ── trend deltas ─────────────────────────────────────────────────────────
  const { incomeTrend, expenseTrend } = useMemo(() => {
    const last = metrics.monthlyTrends.length - 1;
    const curr = metrics.monthlyTrends[last];
    const prev = metrics.monthlyTrends[last - 1];
    const calcTrend = (c = 0, p = 0) =>
      p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100;
    return {
      incomeTrend: calcTrend(curr?.income, prev?.income),
      expenseTrend: calcTrend(curr?.expense, prev?.expense),
    };
  }, [metrics.monthlyTrends]);

  const recentTransactions = useMemo(
    () =>
      [...metrics.converted]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [metrics.converted]
  );

  const health = healthLabel(metrics.healthScore);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Top KPI strip (from API) ── */}
      <DashboardMetricsPanel />

      {/* ── Page header ── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
          <p className="mt-1 text-muted-foreground text-sm">{t("dashboard.description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/transactions" className={buttonVariants({ variant: "outline" })}>
            <Zap className="mr-2 h-4 w-4" />
            {t("dashboard.addTransaction")}
          </Link>
          <Link href="/planning" className={buttonVariants()}>
            <Target className="mr-2 h-4 w-4" />
            {t("dashboard.updateGoals")}
          </Link>
        </div>
      </section>

      {/* ── 4 Stat cards ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("dashboard.summary")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Balance */}
          {(() => {
            const c = compact(metrics.balance);
            return (
              <StatCard
                label={t("dashboard.totalBalance")}
                displayValue={c.compact}
                fullValue={c.full}
                icon={<Wallet className="h-4 w-4 text-blue-500" />}
                trend={incomeTrend - expenseTrend}
                sub={t("dashboard.balanceSub")}
              />
            );
          })()}

          {/* Income */}
          {(() => {
            const c = compact(metrics.income);
            return (
              <StatCard
                label={t("dashboard.totalIncome")}
                displayValue={c.compact}
                fullValue={c.full}
                icon={<ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                trend={incomeTrend}
                sub={t("dashboard.incomeSub")}
              />
            );
          })()}

          {/* Expenses */}
          {(() => {
            const c = compact(metrics.expenses);
            return (
              <StatCard
                label={t("dashboard.totalExpenses")}
                displayValue={c.compact}
                fullValue={c.full}
                icon={<ArrowDownRight className="h-4 w-4 text-rose-500" />}
                trend={expenseTrend}
                sub={t("dashboard.expenseSub")}
              />
            );
          })()}

          {/* Health score */}
          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground leading-tight">
                  {t("dashboard.healthScore")}
                </p>
                <div className="shrink-0 rounded-lg bg-muted p-2">
                  <Activity className="h-4 w-4 text-violet-500" />
                </div>
              </div>
              <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight">
                  {metrics.healthScore}
                  <span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
                <Badge
                  variant="secondary"
                  className={cn("text-xs font-semibold", health.color)}
                >
                  {health.label}
                </Badge>
              </div>
              <Progress value={metrics.healthScore} className="mt-3 h-1.5" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("dashboard.savingsConsistency")}: {metrics.savingsConsistency}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Charts row ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("dashboard.trendsAndCategories")}
        </h2>
        <div className="grid gap-4 xl:grid-cols-7">
          <Card className="xl:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.weeklyCashflow")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.weeklyChartDesc")}
              </p>
            </CardHeader>
            <CardContent>
              <OverviewChart data={metrics.weeklyTrends} />
            </CardContent>
          </Card>

          <Card className="xl:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.expenseCategories")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.categoryChartDesc")}
              </p>
            </CardHeader>
            <CardContent>
              {metrics.categoryBreakdown.length > 0 ? (
                <CategoryChart data={metrics.categoryBreakdown} />
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <PiggyBank className="h-8 w-8 opacity-40" />
                  <span>{t("dashboard.noExpenseData")}</span>
                  <span className="text-xs">{t("dashboard.addFirstTransaction")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Monthly trends + Budget 50/30/20 ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("dashboard.monthlyAnalysis")}
        </h2>
        <div className="grid gap-4 xl:grid-cols-7">
          <Card className="xl:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.monthlyTrends")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.monthlyChartDesc")}
              </p>
            </CardHeader>
            <CardContent>
              <MonthlyTrendChart data={metrics.monthlyTrends} />
            </CardContent>
          </Card>

          {/* 50/30/20 Budget Tracker */}
          <Card className="xl:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.budgetTracker")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.budgetDesc")}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <BudgetRow
                label={`${t("dashboard.needs")} (50%)`}
                spent={metrics.budgetSpent.needs}
                budget={metrics.budget.needs}
                displaySpent={compact(metrics.budgetSpent.needs).compact}
                displayBudget={compact(metrics.budget.needs).compact}
                colorClass=""
                t={t}
              />
              <BudgetRow
                label={`${t("dashboard.wants")} (30%)`}
                spent={metrics.budgetSpent.wants}
                budget={metrics.budget.wants}
                displaySpent={compact(metrics.budgetSpent.wants).compact}
                displayBudget={compact(metrics.budget.wants).compact}
                colorClass=""
                t={t}
              />
              <BudgetRow
                label={`${t("dashboard.savings")} (20%)`}
                spent={metrics.budgetSpent.savings}
                budget={metrics.budget.savings}
                displaySpent={compact(metrics.budgetSpent.savings).compact}
                displayBudget={compact(metrics.budget.savings).compact}
                colorClass=""
                t={t}
              />

              {/* Emergency fund pill */}
              <div className="mt-2 flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold">{t("dashboard.emergencyFund")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("dashboard.emergencyFundDesc")}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    metrics.emergencyFund.monthsCovered >= 3
                      ? "text-emerald-500"
                      : metrics.emergencyFund.monthsCovered >= 1
                      ? "text-amber-500"
                      : "text-rose-500"
                  )}
                >
                  {metrics.emergencyFund.monthsCovered > 99 
                    ? "99+" 
                    : metrics.emergencyFund.monthsCovered.toFixed(1)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {t("dashboard.months")}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Insights + Recent ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("dashboard.activityAndRecommendations")}
        </h2>
        <div className="grid gap-4 xl:grid-cols-7">
          {/* Recent transactions */}
          <Card className="xl:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.recentActivity")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.recentActivityDesc")}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                  <BookOpen className="h-8 w-8 opacity-40" />
                  <span>{t("common.noData")}</span>
                  <span className="text-xs">{t("dashboard.startLogging")}</span>
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const c = compact(tx.amount);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      {/* left */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.category} · {new Date(tx.date).toLocaleDateString(t("common.dashboard") === "Dasbor" ? "id-ID" : "en-US", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      {/* right */}
                      <div className="ml-4 shrink-0 text-right">
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                          )}
                          title={c.full}
                        >
                          {tx.type === "income" ? "+" : "−"}
                          {c.compact}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tx.type === "income" ? t("dashboard.incomeLabel") : t("dashboard.expenseLabel")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Smart insights */}
          <Card className="xl:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.smartInsights")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.smartInsightsDesc")}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* health score pill */}
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3",
                  metrics.healthScore >= 65
                    ? "border-emerald-400/20 bg-emerald-500/5"
                    : metrics.healthScore >= 45
                    ? "border-amber-400/20 bg-amber-500/5"
                    : "border-rose-400/20 bg-rose-500/5"
                )}
              >
                {metrics.healthScore >= 65 ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                )}
                <div>
                  <p className="text-xs font-semibold">{t("dashboard.financialHealth")}: {health.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Skor {metrics.healthScore}/100 · {health.label === t("dashboard.excellent")
                      ? t("dashboard.keepPositivePattern")
                      : t("dashboard.improveSavingsRatio")}
                  </p>
                </div>
              </div>

              {/* insight list */}
              {metrics.insights.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">
                  {t("dashboard.noAnomalies")}
                </p>
              ) : (
                metrics.insights.map((insight) => {
                  const titleKey = `dashboard.insights.${insight.translationKey}`;
                  const descKey = `dashboard.insights.${insight.translationKey}Desc`;
                  
                  // Simple replacement for format strings like {amount} or {percent}
                  let desc = t(descKey);
                  if (insight.params) {
                    Object.entries(insight.params).forEach(([key, value]) => {
                      // Formatting value if it is amount vs percent
                      const formattedValue = key === 'amount' && typeof value === 'number' 
                        ? format(value) 
                        : String(value);
                      desc = desc.replace(`{${key}}`, formattedValue);
                    });
                  }
                  
                  return (
                    <div key={insight.id} className="rounded-xl border border-border/60 bg-card/50 p-3">
                      <p className="text-xs font-semibold">{t(titleKey)}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                        {desc}
                      </p>
                    </div>
                  );
                })
              )}

              {/* quick actions */}
              <div className="mt-2 border-t border-border/60 pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("dashboard.quickActions")}
                </p>
                <Link
                  href="/transactions"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full justify-start text-xs"
                  )}
                >
                  <Zap className="mr-2 h-3.5 w-3.5" />
                  {t("dashboard.addTransaction")}
                </Link>
                <Link
                  href="/planning"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full justify-start text-xs"
                  )}
                >
                  <Target className="mr-2 h-3.5 w-3.5" />
                  {t("dashboard.updateGoals")}
                </Link>
                <Link
                  href="/calculator"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full justify-start text-xs"
                  )}
                >
                  <PiggyBank className="mr-2 h-3.5 w-3.5" />
                  {t("common.calculator")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
