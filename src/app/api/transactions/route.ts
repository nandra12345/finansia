import { z } from "zod";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { transactionsRepo } from "@/lib/db/sheets/transactions";
import type { Transaction, TransactionType } from "@/types/finance";

const MAX_STRING_LENGTH = 2000;

function sanitizeForSheetsCell(value: unknown): string {
  if (typeof value !== "string") return "";

  // Strip control characters (including newlines) to reduce spreadsheet parsing quirks.
  const sanitized = value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, MAX_STRING_LENGTH);

  if (sanitized.length === 0) return "";

  // Formula injection prevention for Sheets (classic prefix-based vectors)
  // For Google Sheets with USER_ENTERED, prefixing with a single apostrophe forces literal text.
  if (/^[=+\-@]/.test(sanitized)) return `'${sanitized}`;

  return sanitized;
}

function toIsoDateYYYYMMDD(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid date");
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error("Invalid date");
  const [_, y, mo, d] = m;
  const date = new Date(`${y}-${mo}-${d}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return value;
}

const TransactionTypeSchema = z.enum(["income", "expense"]);

const AmountSchema = z
  .number()

  .finite()
  .min(-1_000_000_000)
  .max(1_000_000_000);

const TransactionCreateSchema = z
  .object({
    id: z.string().uuid().optional(),
    date: z.string().regex(/^(\d{4})-(\d{2})-(\d{2})$/).optional(),
    description: z.string().max(MAX_STRING_LENGTH).optional().default(""),
    amount: AmountSchema.optional().default(0),
    category: z.string().max(100).optional().default("General"),
    type: TransactionTypeSchema.optional().default("expense"),
    notes: z.string().max(4000).optional().default(""),
  })
  .strict();

const TransactionUpdateSchema = z
  .object({
    id: z.string().uuid(),
    date: z.string().regex(/^(\d{4})-(\d{2})-(\d{2})$/).optional(),
    description: z.string().max(MAX_STRING_LENGTH).optional(),
    amount: AmountSchema.optional(),
    category: z.string().max(100).optional(),
    type: TransactionTypeSchema.optional(),
    notes: z.string().max(4000).optional(),
  })
  .strict();

async function getAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, error: "Unauthorized", status: 401 };
  }
  return { userId, error: null, status: null };
}


function coerceAmount(input: unknown): unknown {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.length === 0) return undefined;
    return Number(trimmed);
  }
  return input;
}

export async function GET() {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.userId) return NextResponse.json([]);

  try {
    const transactions = await transactionsRepo.findAll(authResult.userId);
    return NextResponse.json(transactions || []);
  } catch (err) {
    console.error("GET /api/transactions error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  if (!authResult.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const raw = await request.json();

    const normalized = {
      ...raw,
      amount: coerceAmount(raw?.amount),
      date: raw?.date,
    };

    const parsed = TransactionCreateSchema.parse(normalized);

    const today = new Date().toISOString().split("T")[0];
    const date = parsed.date ? toIsoDateYYYYMMDD(parsed.date) : today;

    const transaction: Transaction = {
      id: parsed.id || crypto.randomUUID(),
      userId: authResult.userId,
      date,
      description: sanitizeForSheetsCell(parsed.description) as string,
      amount: parsed.amount,
      category: sanitizeForSheetsCell(parsed.category) as string,
      type: parsed.type as TransactionType,
      notes: sanitizeForSheetsCell(parsed.notes) as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await transactionsRepo.create(transaction);
    revalidateTag("dashboard-metrics", "max");

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error("POST /api/transactions fatal error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: err.issues },
        { status: 400 }
      );
    }

    // Credentials / konfigurasi hilang (Google Sheets env vars tidak diset)
    if (err instanceof Error && err.message.includes("credentials")) {
      console.error("Missing Google Sheets credentials — cek environment variables di Vercel.");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  if (!authResult.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const raw = await request.json();

    const normalized = {
      ...raw,
      amount: coerceAmount(raw?.amount),
    };

    const parsed = TransactionUpdateSchema.parse(normalized);
    const { id, ...updates } = parsed;

    const toUpdate: Partial<Transaction> = {
      ...(updates.date ? { date: toIsoDateYYYYMMDD(updates.date) } : null),
      ...(typeof updates.description === "string" ? { description: sanitizeForSheetsCell(updates.description) } : null),
      ...(typeof updates.amount === "number" ? { amount: updates.amount } : null),
      ...(typeof updates.category === "string" ? { category: sanitizeForSheetsCell(updates.category) } : null),
      ...(updates.type ? { type: updates.type as TransactionType } : null),
      ...(typeof updates.notes === "string" ? { notes: sanitizeForSheetsCell(updates.notes) } : null),
      updatedAt: new Date().toISOString(),
    };

    const updated = await transactionsRepo.update(id, authResult.userId, toUpdate);

    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    revalidateTag("dashboard-metrics", "max");
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/transactions error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  if (!authResult.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Transaction ID is required and must be a valid UUID" }, { status: 400 });
    }

    const deleted = await transactionsRepo.delete(id, authResult.userId);

    if (!deleted) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    revalidateTag("dashboard-metrics", "max");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/transactions error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

