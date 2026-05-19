"use client";

import { Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { TransactionCards } from "@/components/features/transactions/transaction-cards";
import { TransactionDialog } from "@/components/features/transactions/transaction-dialog";
import { TransactionTable } from "@/components/features/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/store/use-finance-store";
import type { TransactionInput, TransactionType } from "@/types/finance";
import { TRANSACTION_CATEGORIES } from "@/types/finance";

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const PAGE_SIZE = 8;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TransactionsPage() {
  const transactions = useFinanceStore((state) => state.transactions);
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const updateTransaction = useFinanceStore((state) => state.updateTransaction);
  const removeTransaction = useFinanceStore((state) => state.removeTransaction);
  const replaceTransactions = useFinanceStore((state) => state.replaceTransactions);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      const keyword = search.trim().toLowerCase();
      const matchesSearch =
        keyword.length === 0 ||
        transaction.description.toLowerCase().includes(keyword) ||
        transaction.category.toLowerCase().includes(keyword) ||
        (transaction.notes?.toLowerCase().includes(keyword) ?? false);

      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });

    return filtered.sort((left, right) => {
      if (sortKey === "date-desc") {
        return new Date(right.date).getTime() - new Date(left.date).getTime();
      }
      if (sortKey === "date-asc") {
        return new Date(left.date).getTime() - new Date(right.date).getTime();
      }
      if (sortKey === "amount-desc") {
        return right.amount - left.amount;
      }

      return left.amount - right.amount;
    });
  }, [transactions, search, typeFilter, categoryFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const pagedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, page]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (stats, transaction) => {
        if (transaction.type === "income") {
          stats.income += transaction.amount;
        } else {
          stats.expense += transaction.amount;
        }
        return stats;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  const handleDelete = (id: string) => {
    removeTransaction(id);
    toast.success("Transaction deleted.");
  };

  const handleAdd = (input: TransactionInput) => {
    addTransaction(input);
    toast.success("Transaction added.");
  };

  const handleUpdate = (id: string, updates: Partial<TransactionInput>) => {
    updateTransaction(id, updates);
    toast.success("Transaction updated.");
  };

  const handleSyncPush = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/transactions/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to sync transactions.");
      }

      toast.success("Transactions synced to Google Sheets.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPull = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/transactions/sync", {
        method: "GET",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to load transactions.");
      }

      const payload = (await response.json()) as { transactions: typeof transactions };
      replaceTransactions(payload.transactions);
      toast.success("Transactions imported from Google Sheets.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Add, edit, and organize your full income and expense history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSyncPull} disabled={isSyncing}>
            Pull Sheets
          </Button>
          <Button variant="outline" onClick={handleSyncPush} disabled={isSyncing}>
            Push Sheets
          </Button>
          <TransactionDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add transaction
              </Button>
            }
            title="Add transaction"
            description="Create a new income or expense entry."
            submitLabel="Save transaction"
            onSubmit={handleAdd}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(summary.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Expense</p>
            <p className="text-2xl font-semibold text-rose-600">{formatCurrency(summary.expense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Net</p>
            <p
              className={`text-2xl font-semibold ${
                summary.income - summary.expense >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatCurrency(summary.income - summary.expense)}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search description, category, or notes"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(value) => {
            if (!value) {
              return;
            }
            setTypeFilter(value as "all" | TransactionType);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              if (!value) {
                return;
              }
              setCategoryFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {TRANSACTION_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortKey}
            onValueChange={(value) => {
              if (!value) {
                return;
              }
              setSortKey(value as SortKey);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest</SelectItem>
              <SelectItem value="date-asc">Oldest</SelectItem>
              <SelectItem value="amount-desc">Highest</SelectItem>
              <SelectItem value="amount-asc">Lowest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="hidden rounded-xl border bg-card md:block">
        <TransactionTable
          transactions={pagedTransactions}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      </section>

      <section className="md:hidden">
        <TransactionCards
          transactions={pagedTransactions}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      </section>

      <section className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}

