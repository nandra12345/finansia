import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { notesRepo } from "@/lib/db/sheets/notes";
import type { DiaryNote } from "@/types/finance";

const MAX_STRING_LENGTH = 4000;

function sanitize(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, MAX_STRING_LENGTH);
}

const NoteCreateSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().min(1).max(500),
    content: z.string().max(MAX_STRING_LENGTH).default(""),
    tags: z.array(z.string().max(100)).max(20).default([]),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .default(() => new Date().toISOString().split("T")[0]),
    relatedGoalIds: z.array(z.string().uuid()).max(50).default([]),
    relatedTransactionIds: z.array(z.string().uuid()).max(50).default([]),
  })
  .strict();

const NoteUpdateSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(500).optional(),
    content: z.string().max(MAX_STRING_LENGTH).optional(),
    tags: z.array(z.string().max(100)).max(20).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    relatedGoalIds: z.array(z.string().uuid()).max(50).optional(),
    relatedTransactionIds: z.array(z.string().uuid()).max(50).optional(),
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
    const notes = await notesRepo.findAll(authResult.userId!);
    return NextResponse.json(notes);
  } catch (err) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
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

    const parsed = NoteCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const note: DiaryNote = {
      id: parsed.data.id ?? crypto.randomUUID(),
      userId: authResult.userId!,
      title: sanitize(parsed.data.title),
      content: sanitize(parsed.data.content),
      tags: parsed.data.tags.map((t) => sanitize(t)).filter(Boolean),
      date: parsed.data.date,
      relatedGoalIds: parsed.data.relatedGoalIds,
      relatedTransactionIds: parsed.data.relatedTransactionIds,
      createdAt: now,
      updatedAt: now,
    };

    await notesRepo.create(note);
    revalidateTag("dashboard-metrics", "max");
    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes error:", err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
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

    const parsed = NoteUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { id, ...updates } = parsed.data;
    const sanitizedUpdates: Partial<DiaryNote> = {
      ...(typeof updates.title === "string" ? { title: sanitize(updates.title) } : {}),
      ...(typeof updates.content === "string" ? { content: sanitize(updates.content) } : {}),
      ...(updates.tags ? { tags: updates.tags.map((t) => sanitize(t)).filter(Boolean) } : {}),
      ...(updates.date ? { date: updates.date } : {}),
      ...(updates.relatedGoalIds ? { relatedGoalIds: updates.relatedGoalIds } : {}),
      ...(updates.relatedTransactionIds ? { relatedTransactionIds: updates.relatedTransactionIds } : {}),
      updatedAt: new Date().toISOString(),
    };

    const updated = await notesRepo.update(id, authResult.userId!, sanitizedUpdates);

    if (!updated) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    revalidateTag("dashboard-metrics", "max");
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/notes error:", err);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
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
      return NextResponse.json({ error: "Note ID is required and must be a valid UUID" }, { status: 400 });
    }

    const deleted = await notesRepo.delete(id, authResult.userId!);

    if (!deleted) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    revalidateTag("dashboard-metrics", "max");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/notes error:", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
