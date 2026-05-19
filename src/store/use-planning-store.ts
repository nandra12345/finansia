import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Goal, GoalInput } from "@/types/finance";

const nowIso = () => new Date().toISOString();

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const createGoal = (input: GoalInput): Goal => {
  const timestamp = nowIso();

  return {
    id: input.id ?? createId(),
    title: input.title.trim(),
    category: input.category,
    color: input.color,
    targetAmount: input.targetAmount,
    currentAmount: input.currentAmount,
    monthlyContribution: input.monthlyContribution,
    targetDate: input.targetDate,
    expectedAnnualReturn: input.expectedAnnualReturn,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

interface PlanningState {
  goals: Goal[];
  addGoal: (input: GoalInput) => Goal;
  updateGoal: (id: string, updates: Partial<GoalInput>) => void;
  addContribution: (id: string, amount: number) => void;
  removeGoal: (id: string) => void;
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set) => ({
      goals: [],
      addGoal: (input) => {
        const goal = createGoal(input);
        set((state) => ({ goals: [goal, ...state.goals] }));
        return goal;
      },
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id !== id) {
              return goal;
            }

            return {
              ...goal,
              ...updates,
              title: updates.title?.trim() ?? goal.title,
              updatedAt: nowIso(),
            };
          }),
        }));
      },
      addContribution: (id, amount) => {
        if (!Number.isFinite(amount) || amount <= 0) {
          return;
        }

        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id !== id) {
              return goal;
            }

            return {
              ...goal,
              currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount),
              updatedAt: nowIso(),
            };
          }),
        }));
      },
      removeGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
      },
    }),
    {
      name: "planning-storage",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          const legacyState = persistedState as { goals?: Array<Record<string, unknown>> };
          return {
            ...legacyState,
            goals: (legacyState.goals ?? []).map((goal) => ({
              id: String(goal.id ?? createId()),
              title: String(goal.title ?? "Untitled Goal"),
              category: String(goal.category ?? "Other"),
              color: String(goal.color ?? "#2563eb"),
              targetAmount: Number(goal.targetAmount ?? 0),
              currentAmount: Number(goal.currentAmount ?? 0),
              monthlyContribution: Number(goal.monthlyContribution ?? 0),
              targetDate: String(goal.targetDate ?? goal.deadline ?? nowIso().slice(0, 10)),
              expectedAnnualReturn: Number(goal.expectedAnnualReturn ?? 0),
              createdAt: String(goal.createdAt ?? nowIso()),
              updatedAt: String(goal.updatedAt ?? nowIso()),
            })),
          };
        }

        return persistedState;
      },
    }
  )
);

export type { Goal };

