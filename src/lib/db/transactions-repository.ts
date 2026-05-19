import "server-only";

import { getRows, replaceRows } from "@/lib/db/google-sheets";
import type { Transaction } from "@/types/finance";

const TRANSACTION_HEADERS = [
  "id",
  "date",
  "description",
  "amount",
  "category",
  "type",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

const DEFAULT_RANGE = process.env.GOOGLE_SHEETS_TRANSACTIONS_RANGE ?? "Transactions!A:I";

function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_ID is not configured.");
  }

  return spreadsheetId;
}

function toRow(transaction: Transaction): (string | number)[] {
  return [
    transaction.id,
    transaction.date,
    transaction.description,
    transaction.amount,
    transaction.category,
    transaction.type,
    transaction.notes ?? "",
    transaction.createdAt,
    transaction.updatedAt,
  ];
}

function toTransaction(row: string[]): Transaction | null {
  if (row.length < 6) {
    return null;
  }

  const [id, date, description, amount, category, type, notes, createdAt, updatedAt] = row;

  if (!id || !date || !description || !amount || !category || !type) {
    return null;
  }

  if (type !== "income" && type !== "expense") {
    return null;
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return null;
  }

  return {
    id,
    date,
    description,
    amount: numericAmount,
    category,
    type,
    notes: notes || undefined,
    createdAt: createdAt || date,
    updatedAt: updatedAt || date,
  };
}

export async function pushTransactionsToSheets(transactions: Transaction[]) {
  const spreadsheetId = getSpreadsheetId();
  const rows = [
    [...TRANSACTION_HEADERS],
    ...transactions.map((transaction) => toRow(transaction)),
  ];

  await replaceRows(spreadsheetId, DEFAULT_RANGE, rows);
}

export async function pullTransactionsFromSheets(): Promise<Transaction[]> {
  const spreadsheetId = getSpreadsheetId();
  const rows = await getRows(spreadsheetId, DEFAULT_RANGE);

  if (rows.length === 0) {
    return [];
  }

  const dataRows = rows[0][0] === "id" ? rows.slice(1) : rows;

  return dataRows
    .map((row) => toTransaction(row.map((cell) => String(cell))))
    .filter((transaction): transaction is Transaction => Boolean(transaction));
}

