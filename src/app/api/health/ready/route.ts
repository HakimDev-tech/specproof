import { NextResponse } from "next/server";
import { requireApiToken } from "@/lib/auth/api";
import { sql } from "@/lib/db/client";

export async function GET(request: Request) {
  const unauthorized = requireApiToken(request);
  if (unauthorized) return unauthorized;

  if (!sql) {
    return NextResponse.json(
      { status: "not_ready", database: "not_configured" },
      { status: 503 },
    );
  }

  try {
    await sql`SELECT 1`;
    return NextResponse.json({
      status: "ready",
      database: "connected",
      bifrost: process.env.BIFROST_BASE_URL && process.env.BIFROST_API_KEY && process.env.BIFROST_MODEL
        ? "configured"
        : "missing_configuration",
      tavily: process.env.TAVILY_API_KEY ? "configured" : "missing_configuration",
    });
  } catch {
    return NextResponse.json(
      { status: "not_ready", database: "unreachable" },
      { status: 503 },
    );
  }
}
