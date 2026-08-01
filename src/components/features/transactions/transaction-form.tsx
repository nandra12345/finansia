"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState, type ChangeEvent } from "react";
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

/**
 * Format a numeric value into localized string with thousands separators.
 * - If the value is 0 or falsy, return an empty string so the input appears empty.
 */
function formatCurrency(value: number | string): string {
  const n = typeof value === "number" ? value : Number(String(value).replace(/\D/g, ""));
  if (!n || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

/**
 * Parse an input string into a numeric amount by stripping all non-digits.
 * Returns 0 if parsing yields no digits.
 */
function parseCurrency(value: string): number {
  if (!value) return 0;
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  // Use Number on the digit string; allows large numbers up to JS safe integer range.
  const n = Number(digits);
  return Number.isNaN(n) ? 0 : n;
}

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

  const initialAmountText = useMemo(
    () => (initialValues?.amount ? formatCurrency(initialValues.amount) : ""),
    [initialValues?.amount]
  );

  const [amountText, setAmountText] = useState(initialAmountText);

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

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Immediately strip any non-digit characters (keeps only 0-9)
    const raw = event.target.value;
    const clean = raw.replace(/\D/g, "");

    // If empty, keep the input visually empty and set amount to 0
    if (clean === "") {
      setAmountText("");
      setValue("amount", 0, { shouldValidate: true });
      return;
    }

    // Parse as integer and format with localized thousands separators
    const numeric = Number(clean);
    const formatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(numeric);

    // Update controlled state and the RHF value (numeric)
    setAmountText(formatted);
    setValue("amount", numeric, { shouldValidate: true });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => {
        onSubmit({
          description: values.description,
          amount: values.amount,
          category: values.category,
          type: values.type,
          // Send YYYY-MM-DD format — the API regex expects this format, not a full ISO string
          date: values.date.toLocaleDateString('en-CA'), // en-CA gives YYYY-MM-DD format
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
          <div className="relative">
            <span className="pointer-events-none absolute left-0 top-0 flex h-full items-center rounded-l-md border border-r-0 border-input bg-muted/40 px-3 text-sm text-muted-foreground">
              Rp
            </span>
            <Input
              id="amount"
              type="text"
              className="pl-12"
              placeholder="0"
              value={amountText}
              onChange={handleAmountChange}
              aria-describedby="amount-help"
            />
          </div>
          <p id="amount-help" className="text-xs text-muted-foreground">
            Enter the amount without currency symbols; formatting is added automatically.
          </p>
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

