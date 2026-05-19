"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/features/transactions/transaction-form";
import type { Transaction, TransactionInput } from "@/types/finance";

interface TransactionDialogProps {
  trigger: React.ReactElement;
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: Transaction;
  onSubmit: (values: TransactionInput) => void;
}

export function TransactionDialog({
  trigger,
  title,
  description,
  submitLabel,
  initialValues,
  onSubmit,
}: TransactionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <TransactionForm
          initialValues={initialValues}
          submitLabel={submitLabel}
          onCancel={() => setOpen(false)}
          onSubmit={(values) => {
            onSubmit(values);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

