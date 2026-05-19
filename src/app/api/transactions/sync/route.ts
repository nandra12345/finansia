import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { pullTransactionsFromSheets, pushTransactionsToSheets } from "@/lib/db/transactions-repository";

const transactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  type: z.enum(["income", "expense"]),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const payloadSchema = z.object({
  transactions: z.array(transactionSchema),
});

async function ensureAuth() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function GET() {
  const unauthorizedResponse = await ensureAuth();
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const transactions = await pullTransactionsFromSheets();
    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to pull transactions from Google Sheets.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureAuth();
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await pushTransactionsToSheets(parsed.data.transactions);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to push transactions to Google Sheets.",
      },
      { status: 500 }
    );
  }
}

