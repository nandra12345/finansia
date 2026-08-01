import "server-only";
import { planningRepo } from "./planning";
import { transactionsRepo } from "./transactions";
import type { DashboardMetrics } from "@/types/dashboard";
import type { Transaction, Goal } from "@/types/finance";

function calculateJournalStreak(entries: string[]) {
  const uniqueDays = Array.from(new Set(entries.map((createdAt) => createdAt.slice(0, 10)))).sort(
    (left, right) => new Date(right).getTime() - new Date(left).getTime()
  );

  if (uniqueDays.length === 0) return 0;

  let streak = 1;
  let priorDate = new Date(uniqueDays[0]);

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const current = new Date(uniqueDays[index]);
    const diffDays = Math.round((priorDate.getTime() - current.getTime()) / 86400000);
    if (diffDays === 1) {
      streak += 1;
      priorDate = current;
      continue;
    }
    break;
  }

  return streak;
}

function calculateGoalCompletion(goals: Goal[]) {
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalProgress = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  if (totalTarget === 0) return 0;
  return Math.min(100, (totalProgress / totalTarget) * 100);
}

function calculateRewardPoints(transactions: Transaction[], clearedGoals: number, streak: number) {
  return 500 + clearedGoals * 120 + streak * 20 + Math.min(transactions.length, 200) * 5;
}

export async function fetchDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  try {
    const transactions = await transactionsRepo.findAll(userId);
    const goals = await planningRepo.findAll(userId);

    const totalIncome = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const netBalance = totalIncome - totalExpenses;
    const transactionsTracked = transactions.length;
    const journalStreak = calculateJournalStreak(transactions.map((transaction) => transaction.createdAt));
    const completedGoals = goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length;
    const activeGoals = goals.length;
    const goalCompletionRate = calculateGoalCompletion(goals);
    const rewardPoints = calculateRewardPoints(transactions, completedGoals, journalStreak);

    return {
      netBalance,
      totalIncome,
      totalExpenses,
      transactionsTracked,
      journalStreak,
      completedGoals,
      activeGoals,
      goalCompletionRate,
      rewardPoints,
    };
  } catch (err) {
    console.error("fetchDashboardMetrics error:", err);
    return {
      netBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      transactionsTracked: 0,
      journalStreak: 0,
      completedGoals: 0,
      activeGoals: 0,
      goalCompletionRate: 0,
      rewardPoints: 0,
    };
  }
}

