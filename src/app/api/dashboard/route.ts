import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchDashboardMetrics } from "@/lib/db/sheets/dashboard";

async function getAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }
  return { userId };
}

export async function GET() {
  const authResult = await getAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const metrics = await fetchDashboardMetrics(authResult.userId ?? "");
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Unable to load dashboard metrics." },
      { status: 500 }
    );
  }
}
