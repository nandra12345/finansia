import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Transaction, TransactionInput, TransactionType } from "@/types/finance";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const nowIso = () => new Date().toISOString();

const createTransaction = (input: TransactionInput): Transaction => {
  const timestamp = nowIso();

  return {
    id: input.id ?? createId(),
    userId: "", // PERBAIKAN: Menambahkan properti wajib 'userId' agar sesuai dengan tipe data Transaction
    description: input.description.trim(),
    amount: input.amount,
    category: input.category,
    date: input.date,
    type: input.type,
    notes: input.notes?.trim() || undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

interface FinanceState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<TransactionInput>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  replaceTransactions: (transactions: Transaction[]) => void;
  clearTransactions: () => void;
  getTotalBalance: () => number;
  getMonthlyStats: (month: number, year: number) => { income: number; expense: number };
  getTransactionsByType: (type: TransactionType) => Transaction[];
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,

      fetchTransactions: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/transactions");
          if (!response.ok) throw new Error("Failed to fetch transactions");
          const data = await response.json();
          set({ transactions: data, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      addTransaction: async (input) => {
        const transaction = createTransaction(input);
        // Optimistic update
        set((state) => ({ transactions: [transaction, ...state.transactions] }));

        try {
          // Kirim hanya fields yang diizinkan server schema (strict mode)
          const payload = {
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.category,
            type: transaction.type,
            notes: transaction.notes || "",
          };
          const response = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error("Failed to save transaction");
          const saved = await response.json();
          // Update dengan data nyata dari server
          set((state) => ({
            transactions: state.transactions.map((t) => (t.id === transaction.id ? saved : t)),
          }));
          return saved;
        } catch (error) {
          // Rollback on error
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== transaction.id),
            error: (error as Error).message,
          }));
          throw error;
        }
      },

      updateTransaction: async (id, updates) => {
        const previousTransactions = get().transactions;
        const now = nowIso();

        // Optimistic update
        set((state) => ({
          transactions: state.transactions.map((t) => {
            if (t.id !== id) return t;
            return { ...t, ...updates, updatedAt: now };
          }),
        }));

        try {
          const response = await fetch("/api/transactions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...updates }),
          });
          if (!response.ok) throw new Error("Failed to update transaction");
        } catch (error) {
          // Rollback
          set({ transactions: previousTransactions, error: (error as Error).message });
          throw error;
        }
      },

      removeTransaction: async (id) => {
        const previousTransactions = get().transactions;

        // Optimistic update
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));

        try {
          const response = await fetch(`/api/transactions?id=${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete transaction");
        } catch (error) {
          // Rollback
          set({ transactions: previousTransactions, error: (error as Error).message });
          throw error;
        }
      },
      replaceTransactions: (transactions) => {
        set({ transactions });
      },
      clearTransactions: () => {
        set({ transactions: [] });
      },
      getTotalBalance: () => {
        return get().transactions.reduce((total, transaction) => {
          return transaction.type === "income"
            ? total + transaction.amount
            : total - transaction.amount;
        }, 0);
      },
      getMonthlyStats: (month, year) => {
        return get().transactions.reduce(
          (stats, transaction) => {
            const date = new Date(transaction.date);
            if (date.getMonth() !== month || date.getFullYear() !== year) {
              return stats;
            }

            if (transaction.type === "income") {
              stats.income += transaction.amount;
            } else {
              stats.expense += transaction.amount;
            }

            return stats;
          },
          { income: 0, expense: 0 }
        );
      },
      getTransactionsByType: (type) => {
        return get().transactions.filter((transaction) => transaction.type === type);
      },
    }),
    {
      name: "finance-storage",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          const legacyState = persistedState as { transactions?: Array<Record<string, unknown>> };
          return {
            ...legacyState,
            transactions: (legacyState.transactions ?? []).map((transaction) => ({
              id: String(transaction.id ?? createId()),
              userId: String(transaction.userId ?? ""), // PERBAIKAN: Menambahkan placeholder migrasi untuk data local storage lama
              description: String(transaction.description ?? "Untitled"),
              amount: Number(transaction.amount ?? 0),
              category: String(transaction.category ?? "Other"),
              date: String(transaction.date ?? nowIso()),
              type:
                transaction.type === "income" || transaction.type === "expense"
                  ? transaction.type
                  : "expense",
              notes:
                typeof transaction.notes === "string" && transaction.notes.trim().length > 0
                  ? transaction.notes
                  : undefined,
              createdAt: String(transaction.createdAt ?? transaction.date ?? nowIso()),
              updatedAt: String(transaction.updatedAt ?? nowIso()),
            })),
          };
        }

        return persistedState as FinanceState;
      },
    }
  )
);

export type { Transaction };