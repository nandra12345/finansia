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
    userId: "", // PERBAIKAN: Menambahkan properti wajib 'userId' agar sesuai dengan tipe data Goal
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
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (input: GoalInput) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<GoalInput>) => Promise<void>;
  addContribution: (id: string, amount: number) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      goals: [],
      isLoading: false,
      error: null,

      fetchGoals: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/planning");
          if (!response.ok) throw new Error("Failed to fetch goals");
          const data = await response.json();
          set({ goals: data, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      addGoal: async (input) => {
        const goal = createGoal(input);
        set((state) => ({ goals: [goal, ...state.goals] }));

        try {
          const payload = {
            id: goal.id,
            title: goal.title,
            category: goal.category,
            color: goal.color,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            monthlyContribution: goal.monthlyContribution,
            targetDate: goal.targetDate,
            expectedAnnualReturn: goal.expectedAnnualReturn,
          };
          const response = await fetch("/api/planning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error("Failed to save goal");
          const saved = await response.json();
          set((state) => ({
            goals: state.goals.map((g) => (g.id === goal.id ? saved : g)),
          }));
          return saved;
        } catch (error) {
          set((state) => ({
            goals: state.goals.filter((g) => g.id !== goal.id),
            error: (error as Error).message,
          }));
          throw error;
        }
      },

      updateGoal: async (id, updates) => {
        const previousGoals = get().goals;
        const now = nowIso();

        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id !== id) return goal;
            return {
              ...goal,
              ...updates,
              title: updates.title?.trim() ?? goal.title,
              updatedAt: now,
            };
          }),
        }));

        try {
          const response = await fetch("/api/planning", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...updates }),
          });
          if (!response.ok) throw new Error("Failed to update goal");
        } catch (error) {
          set({ goals: previousGoals, error: (error as Error).message });
          throw error;
        }
      },

      addContribution: async (id, amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return;

        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;

        const newAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
        await get().updateGoal(id, { currentAmount: newAmount });
      },

      removeGoal: async (id) => {
        const previousGoals = get().goals;

        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));

        try {
          const response = await fetch(`/api/planning?id=${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete goal");
        } catch (error) {
          set({ goals: previousGoals, error: (error as Error).message });
          throw error;
        }
      },
    }),
    {
      name: "planning-storage",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          const legacyState = persistedState as { goals?: Array<Record<string, unknown>> };
          const currentNow = nowIso();
          return {
            ...legacyState,
            goals: (legacyState.goals ?? []).map((goal) => ({
              id: String(goal.id ?? createId()),
              userId: String(goal.userId ?? ""), // PERBAIKAN: Menambahkan fallback properti migrasi local storage
              title: String(goal.title ?? "Untitled Goal"),
              category: String(goal.category ?? "Other"),
              color: String(goal.color ?? "#2563eb"),
              targetAmount: Number(goal.targetAmount ?? 0),
              currentAmount: Number(goal.currentAmount ?? 0),
              monthlyContribution: Number(goal.monthlyContribution ?? 0),
              targetDate: String(goal.targetDate ?? goal.deadline ?? currentNow.slice(0, 10)),
              expectedAnnualReturn: Number(goal.expectedAnnualReturn ?? 0),
              createdAt: String(goal.createdAt ?? currentNow),
              updatedAt: String(goal.updatedAt ?? currentNow),
            })),
          };
        }

        return persistedState as PlanningState;
      },
    }
  )
);