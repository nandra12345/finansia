"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Target,
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
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/hooks/use-translation";

const OverviewChart = dynamic(
  () => import("@/components/charts/overview-chart").then((module) => module.OverviewChart),
  {
    ssr: false,
  }
);

const CategoryChart = dynamic(
  () => import("@/components/charts/category-chart").then((module) => module.CategoryChart),
  {
    ssr: false,
  }
);

const MonthlyTrendChart = dynamic(
  () =>
    import("@/components/charts/monthly-trend-chart").then(
      (module) => module.MonthlyTrendChart
    ),
  {
    ssr: false,
  }
);

const NEEDS_CATEGORIES = new Set(["Food", "Bills", "Transport", "Healthcare", "Education"]);
const WANTS_CATEGORIES = new Set(["Entertainment", "Shopping", "Travel"]);

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: number;
}) {
  const isPositive = trend >= 0;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="rounded-md bg-muted p-2">{icon}</div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <Badge
            variant="secondary"
            className={cn(
              "font-medium",
              isPositive ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {isPositive ? "+" : ""}
            {trend.toFixed(1)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const transactions = useFinanceStore((state) => state.transactions);
  const { format, convert } = useCurrency();
  const { t } = useTranslation();

  const metrics = useMemo(() => {
    // Convert all transaction amounts to the selected currency for calculation
    // Assuming original transactions are in IDR (DEFAULT_CURRENCY)
    const convertedTransactions = transactions.map(tx => ({
      ...tx,
      amount: convert(tx.amount)
    }));

    const monthlyTrends = buildMonthlyTrends(convertedTransactions, 6);
    const weeklyTrends = buildWeeklyTrends(convertedTransactions, 8);
    const categoryBreakdown = buildCategoryBreakdown(convertedTransactions, 5);

    const income = convertedTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expenses = convertedTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const balance = income - expenses;
    const savings = Math.max(balance, 0);

    const monthlyExpense = monthlyTrends[monthlyTrends.length - 1]?.expense ?? expenses;
    const emergencyFund = calculateEmergencyFundStatus(monthlyExpense || 1, savings);
    const healthScore = calculateFinancialHealthScore(
      income,
      expenses,
      savings,
      0,
      emergencyFund.monthsCovered
    );

    const savingsConsistencyScore = calculateSavingsConsistencyScore(
      monthlyTrends.map((trend) => Math.max(0, trend.net))
    );

    const insights = generateFinancialInsights(
      weeklyTrends,
      monthlyTrends,
      categoryBreakdown,
      healthScore
    );

    const currentMonthExpenses = convertedTransactions.filter((transaction) => {
      const date = new Date(transaction.date);
      const now = new Date();
      return (
        transaction.type === "expense" &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const needsSpent = currentMonthExpenses
      .filter((transaction) => NEEDS_CATEGORIES.has(transaction.category))
      .reduce((total, transaction) => total + transaction.amount, 0);
    const wantsSpent = currentMonthExpenses
      .filter((transaction) => WANTS_CATEGORIES.has(transaction.category))
      .reduce((total, transaction) => total + transaction.amount, 0);
    const savingsSpent = currentMonthExpenses
      .filter((transaction) => !NEEDS_CATEGORIES.has(transaction.category) && !WANTS_CATEGORIES.has(transaction.category))
      .reduce((total, transaction) => total + transaction.amount, 0);

    const budget = calculateBudget503020(income);

    return {
      income,
      expenses,
      balance,
      healthScore,
      savingsConsistencyScore,
      emergencyFund,
      weeklyTrends,
      monthlyTrends,
      categoryBreakdown,
      insights,
      budgetUsage: {
        needs: budget.needs === 0 ? 0 : (needsSpent / budget.needs) * 100,
        wants: budget.wants === 0 ? 0 : (wantsSpent / budget.wants) * 100,
        savings: budget.savings === 0 ? 0 : (savingsSpent / budget.savings) * 100,
      },
      convertedTransactions,
    };
  }, [transactions, convert]);

  const recentTransactions = useMemo(() => {
    return [...metrics.convertedTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [metrics.convertedTransactions]);

  const expenseTrend = useMemo(() => {
    const current = metrics.monthlyTrends[metrics.monthlyTrends.length - 1]?.expense ?? 0;
    const previous = metrics.monthlyTrends[metrics.monthlyTrends.length - 2]?.expense ?? 0;
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }, [metrics.monthlyTrends]);

  const incomeTrend = useMemo(() => {
    const current = metrics.monthlyTrends[metrics.monthlyTrends.length - 1]?.income ?? 0;
    const previous = metrics.monthlyTrends[metrics.monthlyTrends.length - 2]?.income ?? 0;
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }, [metrics.monthlyTrends]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">
            {t("dashboard.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/transactions" className={buttonVariants({ variant: "outline" })}>
            {t("dashboard.addTransaction")}
          </Link>
          <Link href="/planning" className={buttonVariants()}>
            {t("dashboard.updateGoals")}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.totalBalance")}
          value={format(metrics.balance)}
          icon={<Wallet className="h-4 w-4 text-blue-600" />}
          trend={incomeTrend - expenseTrend}
        />
        <StatCard
          label={t("dashboard.totalIncome")}
          value={format(metrics.income)}
          icon={<ArrowUpRight className="h-4 w-4 text-emerald-600" />}
          trend={incomeTrend}
        />
        <StatCard
          label={t("dashboard.totalExpenses")}
          value={format(metrics.expenses)}
          icon={<ArrowDownRight className="h-4 w-4 text-rose-600" />}
          trend={expenseTrend}
        />
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("dashboard.healthScore")}</p>
              <div className="rounded-md bg-muted p-2">
                <Activity className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold tracking-tight">{metrics.healthScore}/100</p>
              <Badge variant="secondary" className="text-blue-700">
                {t("dashboard.consistency")} {metrics.savingsConsistencyScore}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>{t("dashboard.weeklyCashflow")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewChart data={metrics.weeklyTrends} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>{t("dashboard.expenseCategories")}</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.categoryBreakdown.length > 0 ? (
              <CategoryChart data={metrics.categoryBreakdown} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                {t("common.noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>{t("dashboard.monthlyTrends")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={metrics.monthlyTrends} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>{t("dashboard.smartInsights")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.noAnomalies")}</p>
            ) : (
              metrics.insights.map((insight) => (
                <div key={insight.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.message}</p>
                </div>
              ))
            )}

            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 text-sm font-semibold">{t("dashboard.budgetTracker")}</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>{t("dashboard.needs")} usage: {Math.round(metrics.budgetUsage.needs)}%</p>
                <p>{t("dashboard.wants")} usage: {Math.round(metrics.budgetUsage.wants)}%</p>
                <p>{t("dashboard.savings")} usage: {Math.round(metrics.budgetUsage.savings)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.category}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {format(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/transactions"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              <Zap className="mr-2 h-4 w-4" /> {t("dashboard.addTransaction")}
            </Link>
            <Link
              href="/planning"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              <Target className="mr-2 h-4 w-4" /> {t("dashboard.updateGoals")}
            </Link>
            <Link
              href="/calculator"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              <PiggyBank className="mr-2 h-4 w-4" /> {t("common.calculator")}
            </Link>
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {t("dashboard.emergencyFund")}: {metrics.emergencyFund.monthsCovered.toFixed(1)} {t("dashboard.months")}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

