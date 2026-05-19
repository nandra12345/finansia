"use client";

import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionDialog } from "@/components/features/transactions/transaction-dialog";
import type { Transaction, TransactionInput } from "@/types/finance";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/hooks/use-translation";

interface TransactionCardsProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TransactionInput>) => void;
}

export function TransactionCards({ transactions, onDelete, onUpdate }: TransactionCardsProps) {
  const { format, convert } = useCurrency();
  const { t } = useTranslation();

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {t("common.noData")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
              </div>
              <Badge variant="secondary">{transaction.category}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <p
                className={`inline-flex items-center text-sm font-semibold ${
                  transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {transaction.type === "income" ? (
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                ) : (
                  <ArrowDownRight className="mr-1 h-4 w-4" />
                )}
                {format(convert(transaction.amount))}
              </p>

              <div className="flex gap-1">
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
                  onClick={() => onDelete(transaction.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {transaction.notes ? (
              <p className="text-xs text-muted-foreground">{transaction.notes}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

