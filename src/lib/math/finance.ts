import { endOfMonth, endOfWeek, format, isWithinInterval, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";

import type { Transaction } from "@/types/finance";

export interface BudgetStats {
  needs: number;
  wants: number;
  savings: number;
}

export interface EmergencyFundStatus {
  monthsCovered: number;
  status: "critical" | "low" | "good" | "excellent";
}

export interface WeeklyTrend {
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface MonthlyTrend {
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  percentage: number;
}

export interface SpendingComparison {
  current: number;
  previous: number;
  changeAmount: number;
  changePercent: number;
  direction: "up" | "down" | "flat";
}

export interface CashflowAnalysis {
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  burnRate: number;
  runwayMonths: number;
}

export interface FinancialInsight {
  id: string;
  type: "success" | "warning" | "info";
  translationKey: string;
  params?: Record<string, string | number>;
}

export const calculateBudget503020 = (totalIncome: number): BudgetStats => {
  return {
    needs: totalIncome * 0.5,
    wants: totalIncome * 0.3,
    savings: totalIncome * 0.2,
  };
};

export const calculateSavingsRatio = (income: number, savings: number): number => {
  if (income <= 0) {
    return 0;
  }

  return (savings / income) * 100;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export const calculateSavingsConsistencyScore = (monthlySavings: number[]): number => {
  if (monthlySavings.length === 0) {
    return 0;
  }

  const cleaned = monthlySavings.map((value) => Math.max(0, value));
  const average = cleaned.reduce((total, value) => total + value, 0) / cleaned.length;

  if (average === 0) {
    return 0;
  }

  const variance =
    cleaned.reduce((total, value) => total + (value - average) ** 2, 0) / cleaned.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / average;

  const stabilityScore = clamp(100 - coefficientOfVariation * 100, 0, 100);
  const positiveMonths = cleaned.filter((value) => value > 0).length;
  const positiveScore = (positiveMonths / cleaned.length) * 100;

  let streak = 0;
  let maxStreak = 0;
  for (const value of cleaned) {
    if (value > 0) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }

  const streakScore = (maxStreak / cleaned.length) * 100;

  return Math.round(stabilityScore * 0.5 + positiveScore * 0.35 + streakScore * 0.15);
};

export const calculateEmergencyFundStatus = (
  monthlyExpenses: number,
  currentSavings: number
): EmergencyFundStatus => {
  if (monthlyExpenses <= 0) {
    return { 
      monthsCovered: currentSavings > 0 ? 999 : 0, 
      status: currentSavings > 0 ? "excellent" : "critical" 
    };
  }

  const monthsCovered = currentSavings / monthlyExpenses;

  if (monthsCovered >= 6) {
    return { monthsCovered, status: "excellent" };
  }

  if (monthsCovered >= 3) {
    return { monthsCovered, status: "good" };
  }

  if (monthsCovered >= 1) {
    return { monthsCovered, status: "low" };
  }

  return { monthsCovered, status: "critical" };
};

export const calculateFinancialHealthScore = (
  income: number,
  expenses: number,
  savings: number,
  debtPayments: number,
  emergencyFundMonths = 0
): number => {
  const savingsRate = calculateSavingsRatio(income, savings);
  const debtToIncome = income > 0 ? (debtPayments / income) * 100 : 100;
  const expenseToIncome = income > 0 ? (expenses / income) * 100 : 100;

  const savingsScore = clamp((savingsRate / 25) * 35, 0, 35);
  const debtScore =
    debtToIncome <= 10
      ? 25
      : clamp(25 - ((debtToIncome - 10) / 40) * 25, 0, 25);
  const expenseScore =
    expenseToIncome <= 60
      ? 20
      : clamp(20 - ((expenseToIncome - 60) / 40) * 20, 0, 20);
  const emergencyScore = clamp((emergencyFundMonths / 6) * 20, 0, 20);

  return Math.round(savingsScore + debtScore + expenseScore + emergencyScore);
};

export const buildWeeklyTrends = (transactions: Transaction[], weeks = 8): WeeklyTrend[] => {
  const now = new Date();

  return Array.from({ length: weeks }, (_, index) => {
    const weekDate = subWeeks(now, weeks - 1 - index);
    const start = startOfWeek(weekDate, { weekStartsOn: 1 });
    const end = endOfWeek(weekDate, { weekStartsOn: 1 });

    const weekTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return isWithinInterval(date, { start, end });
    });

    const income = weekTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const expense = weekTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      label: format(start, "MMM d"),
      income,
      expense,
      net: income - expense,
    };
  });
};

export const buildMonthlyTrends = (transactions: Transaction[], months = 6): MonthlyTrend[] => {
  const now = new Date();

  return Array.from({ length: months }, (_, index) => {
    const monthDate = subMonths(now, months - 1 - index);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    const monthTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return isWithinInterval(date, { start, end });
    });

    const income = monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const expense = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      label: format(start, "MMM"),
      income,
      expense,
      net: income - expense,
    };
  });
};

export const buildCategoryBreakdown = (
  transactions: Transaction[],
  limit = 6
): CategoryBreakdown[] => {
  const categoryTotals = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount;
      return totals;
    }, {});

  const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    return [];
  }

  return Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      percentage: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

export const calculateSpendingComparison = (
  current: number,
  previous: number
): SpendingComparison => {
  const changeAmount = current - previous;
  const changePercent = previous === 0 ? 100 : (changeAmount / previous) * 100;

  return {
    current,
    previous,
    changeAmount,
    changePercent,
    direction: changeAmount > 0 ? "up" : changeAmount < 0 ? "down" : "flat",
  };
};

export const calculateCashflowAnalysis = (
  income: number,
  expenses: number,
  liquidSavings = 0
): CashflowAnalysis => {
  const net = income - expenses;
  const savingsRate = calculateSavingsRatio(income, Math.max(0, net));
  const burnRate = expenses > income ? expenses - income : 0;
  const runwayMonths = burnRate > 0 ? liquidSavings / burnRate : Number.POSITIVE_INFINITY;

  return {
    income,
    expenses,
    net,
    savingsRate,
    burnRate,
    runwayMonths,
  };
};

export const generateFinancialInsights = (
  weeklyTrends: WeeklyTrend[],
  monthlyTrends: MonthlyTrend[],
  categoryBreakdown: CategoryBreakdown[],
  healthScore: number
): FinancialInsight[] => {
  const insights: FinancialInsight[] = [];
  const recentWeek = weeklyTrends[weeklyTrends.length - 1];
  const previousWeek = weeklyTrends[weeklyTrends.length - 2];

  if (recentWeek && previousWeek) {
    const weeklyComparison = calculateSpendingComparison(recentWeek.expense, previousWeek.expense);
    if (weeklyComparison.direction === "up" && weeklyComparison.changePercent > 15) {
      insights.push({
        id: "weekly-spend-warning",
        type: "warning",
        translationKey: "weeklySpendUp",
        params: { percent: Math.round(weeklyComparison.changePercent) },
      });
    }
  }

  const currentMonth = monthlyTrends[monthlyTrends.length - 1];
  if (currentMonth && currentMonth.net > 0) {
    insights.push({
      id: "positive-cashflow",
      type: "success",
      translationKey: "positiveCashflow",
      params: { amount: Math.round(currentMonth.net) },
    });
  }

  const topCategory = categoryBreakdown[0];
  if (topCategory && topCategory.percentage > 35) {
    insights.push({
      id: "category-concentration",
      type: "warning",
      translationKey: "categoryConcentration",
      params: { category: topCategory.name, percent: Math.round(topCategory.percentage) },
    });
  }

  if (healthScore >= 80) {
    insights.push({
      id: "health-strong",
      type: "success",
      translationKey: "healthStrong",
    });
  } else if (healthScore < 50) {
    insights.push({
      id: "health-improve",
      type: "info",
      translationKey: "healthImprove",
    });
  }

  return insights.slice(0, 4);
};

