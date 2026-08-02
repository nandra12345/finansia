import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { planningRepo } from "@/lib/db/sheets/planning";
import type { Goal } from "@/types/finance";

const GOAL_CATEGORIES = [
  "House",
  "Business",
  "Vacation",
  "Emergency Fund",
  "Gadget",
  "Vehicle",
  "Education",
  "Retirement",
  "Other",
] as const;

function sanitize(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, maxLen);
}

const GoalCreateSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().min(1).max(200),
    category: z.enum(GOAL_CATEGORIES).default("Other"),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default("#10b981"),
    targetAmount: z.number().finite().min(0).max(1_000_000_000_000),
    currentAmount: z.number().finite().min(0).max(1_000_000_000_000).default(0),
    monthlyContribution: z.number().finite().min(0).max(1_000_000_000_000).default(0),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expectedAnnualReturn: z.number().finite().min(0).max(100).default(0),
  })
  .strict();

const GoalUpdateSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200).optional(),
    category: z.enum(GOAL_CATEGORIES).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
    targetAmount: z.number().finite().min(0).max(1_000_000_000_000).optional(),
    currentAmount: z.number().finite().min(0).max(1_000_000_000_000).optional(),
    monthlyContribution: z.number().finite().min(0).max(1_000_000_000_000).optional(),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    expectedAnnualReturn: z.number().finite().min(0).max(100).optional(),
  })
  .strict();

async function getAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, error: "Unauthorized", status: 401 as const };
  }
  return { userId, error: null, status: null };
}

export async function GET() {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status ?? 401 });
  }

  try {
    const goals = await planningRepo.findAll(authResult.userId!);
    return NextResponse.json(goals);
  } catch (err) {
    console.error("GET /api/planning error:", err);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status ?? 401 });
  }

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = GoalCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const goal: Goal = {
      id: parsed.data.id ?? crypto.randomUUID(),
      userId: authResult.userId!,
      title: sanitize(parsed.data.title),
      category: parsed.data.category,
      color: parsed.data.color,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount,
      monthlyContribution: parsed.data.monthlyContribution,
      targetDate: parsed.data.targetDate,
      expectedAnnualReturn: parsed.data.expectedAnnualReturn,
      createdAt: now,
      updatedAt: now,
    };

    await planningRepo.create(goal);
    revalidateTag("dashboard-metrics");
    return NextResponse.json(goal, { status: 201 });
  } catch (err) {
    console.error("POST /api/planning error:", err);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status ?? 401 });
  }

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = GoalUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { id, ...updates } = parsed.data;
    const sanitizedUpdates: Partial<Goal> = {
      ...(typeof updates.title === "string" ? { title: sanitize(updates.title) } : {}),
      ...(updates.category ? { category: updates.category } : {}),
      ...(updates.color ? { color: updates.color } : {}),
      ...(typeof updates.targetAmount === "number" ? { targetAmount: updates.targetAmount } : {}),
      ...(typeof updates.currentAmount === "number" ? { currentAmount: updates.currentAmount } : {}),
      ...(typeof updates.monthlyContribution === "number" ? { monthlyContribution: updates.monthlyContribution } : {}),
      ...(updates.targetDate ? { targetDate: updates.targetDate } : {}),
      ...(typeof updates.expectedAnnualReturn === "number" ? { expectedAnnualReturn: updates.expectedAnnualReturn } : {}),
      updatedAt: new Date().toISOString(),
    };

    const updated = await planningRepo.update(id, authResult.userId!, sanitizedUpdates);

    if (!updated) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    revalidateTag("dashboard-metrics");
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/planning error:", err);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status ?? 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Goal ID is required and must be a valid UUID" }, { status: 400 });
    }

    const deleted = await planningRepo.delete(id, authResult.userId!);

    if (!deleted) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    revalidateTag("dashboard-metrics");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/planning error:", err);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
