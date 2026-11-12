import { NextResponse } from "next/server";
import { requireApiToken } from "@/lib/auth/api";
import { listSuites } from "@/modules/benchmark/application/suites";
import { scenarios } from "@/modules/benchmark/application/scenarios";

export async function GET(request: Request) {
  const unauthorized = requireApiToken(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    data: await listSuites(),
    scenarios: scenarios.map(({ key, title, category, targetVersion }) => ({
      key,
      title,
      category,
      targetVersion,
    })),
  });
}
