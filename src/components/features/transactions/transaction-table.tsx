"use client";

import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "@/components/features/transactions/transaction-dialog";
import type { Transaction, TransactionInput } from "@/types/finance";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/hooks/use-translation";

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TransactionInput>) => void;
}

export function TransactionTable({
  transactions,
  onDelete,
  onUpdate,
}: TransactionTableProps) {
  const { format, convert } = useCurrency();
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-[120px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              {t("common.noData")}
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell>
                <p className="font-medium">{transaction.description}</p>
                {transaction.notes ? (
                  <p className="line-clamp-1 text-xs text-muted-foreground">{transaction.notes}</p>
                ) : null}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{transaction.category}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div
                  className={`inline-flex items-center font-semibold ${
                    transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-4 w-4" />
                  )}
                  {format(convert(transaction.amount))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <TransactionDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Edit transaction">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                    title="Edit transaction"
                    description="Update details for this transaction."
                    submitLabel={t("common.save")}
                    initialValues={transaction}
                    onSubmit={(values) => onUpdate(transaction.id, values)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete transaction"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

