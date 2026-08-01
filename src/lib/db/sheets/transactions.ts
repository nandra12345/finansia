import "server-only";
import { BaseRepository } from "./base";
import type { Transaction } from "@/types/finance";

export class TransactionsRepository extends BaseRepository<Transaction> {
  protected sheetName = "Transactions";
  protected headers = [
    "id",
    "userId",
    "date",
    "description",
    "amount",
    "category",
    "type",
    "notes",
    "createdAt",
    "updatedAt",
  ];

  protected mapRowToEntity(row: string[]): Transaction | null {
    // Diubah menjadi >= 1 agar tidak crash jika membaca baris yang pendek/kosong di Sheets
    if (!row || row.length < 1) return null;

    const [id, userId, date, description, amount, category, type, notes, createdAt, updatedAt] = row;

    // PERBAIKAN: amount !== 0 mematikan jebakan angka 0 dianggap falsy
    if (!id || !userId || !date || !description || (amount === undefined || amount === "") || !category || !type) {
      return null;
    }

    return {
      id,
      userId,
      date,
      description,
      amount: Number(amount) || 0,
      category,
      type: type as "income" | "expense",
      notes: notes || "",
      createdAt: createdAt || date,
      updatedAt: updatedAt || date,
    };
  }

  protected mapEntityToRow(entity: Transaction): (string | number | boolean)[] {
    return [
      entity.id,
      entity.userId,
      entity.date,
      entity.description,
      entity.amount,
      entity.category,
      entity.type,
      entity.notes || "",
      entity.createdAt || entity.date,
      entity.updatedAt || entity.date,
    ];
  }
}

export const transactionsRepo = new TransactionsRepository();