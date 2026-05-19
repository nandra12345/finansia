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
  addTransaction: (input: TransactionInput) => Transaction;
  updateTransaction: (id: string, updates: Partial<TransactionInput>) => void;
  removeTransaction: (id: string) => void;
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
      addTransaction: (input) => {
        const transaction = createTransaction(input);
        set((state) => ({ transactions: [transaction, ...state.transactions] }));
        return transaction;
      },
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((transaction) => {
            if (transaction.id !== id) {
              return transaction;
            }

            const shouldUpdateNotes = Object.prototype.hasOwnProperty.call(
              updates,
              "notes"
            );

            return {
              ...transaction,
              ...updates,
              description: updates.description?.trim() ?? transaction.description,
              notes: shouldUpdateNotes
                ? updates.notes?.trim() || undefined
                : transaction.notes,
              updatedAt: nowIso(),
            };
          }),
        }));
      },
      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }));
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

