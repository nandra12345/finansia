import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { settingsRepo } from "@/lib/db/sheets/settings";

// Strict allow-list of fields that may be persisted — prevents arbitrary field injection
const SettingsUpsertSchema = z
  .object({
    language: z.enum(["en", "id"]).optional(),
    currency: z.enum(["USD", "EUR", "GBP", "IDR"]).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
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
    const settings = await settingsRepo.getByUserId(authResult.userId!);
    return NextResponse.json(settings);
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
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

    const parsed = SettingsUpsertSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    // Only update if at least one valid field was provided
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No valid settings fields provided" }, { status: 400 });
    }

    const settings = await settingsRepo.upsert(authResult.userId!, parsed.data);
    return NextResponse.json(settings);
  } catch (err) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
