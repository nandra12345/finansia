"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionInput, TransactionType } from "@/types/finance";
import { TRANSACTION_CATEGORIES } from "@/types/finance";

const transactionFormSchema = z.object({
  description: z.string().min(2, "Description must be at least 2 characters.").max(80),
  amount: z.number().positive("Amount must be greater than 0."),
  category: z.string().min(1, "Category is required."),
  type: z.enum(["income", "expense"]),
  date: z.date({ error: "Date is required." }),
  notes: z.string().max(280, "Notes can be up to 280 characters.").optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  initialValues?: Transaction;
  submitLabel: string;
  onSubmit: (values: TransactionInput) => void;
  onCancel?: () => void;
}

export function TransactionForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const defaultDate = useMemo(
    () => (initialValues ? new Date(initialValues.date) : new Date()),
    [initialValues]
  );

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: initialValues?.description ?? "",
      amount: initialValues?.amount ?? 0,
      category: initialValues?.category ?? "Food",
      type: (initialValues?.type as TransactionType | undefined) ?? "expense",
      date: defaultDate,
      notes: initialValues?.notes ?? "",
    },
  });

  const {
    register,
    setValue,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = form;

  const selectedDate = useWatch({ control: form.control, name: "date" });
  const selectedType = useWatch({ control: form.control, name: "type" });
  const selectedCategory = useWatch({ control: form.control, name: "category" });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => {
        onSubmit({
          description: values.description,
          amount: values.amount,
          category: values.category,
          type: values.type,
          date: values.date.toISOString(),
          notes: values.notes?.trim() || undefined,
        });
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="e.g. Monthly salary" {...register("description")} />
        {errors.description ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount ? <p className="text-xs text-destructive">{errors.amount.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              setValue("type", value as TransactionType, { shouldValidate: true });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              setValue("category", value, { shouldValidate: true });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                />
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setValue("date", date, { shouldValidate: true });
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          {errors.date ? <p className="text-xs text-destructive">{errors.date.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          placeholder="Add context for this transaction"
          {...register("notes")}
        />
        {errors.notes ? <p className="text-xs text-destructive">{errors.notes.message}</p> : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

