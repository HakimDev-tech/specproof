import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function requireApiToken(request: Request): NextResponse | null {
  const configured = process.env.SPECProof_API_TOKEN;
  if (!configured || configured.length < 32) {
    return NextResponse.json(
      { error: "API authentication is not configured" },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  const expectedBuffer = Buffer.from(configured);
  const suppliedBuffer = Buffer.from(supplied);
  const valid =
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer);

  if (!valid) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer" },
      },
    );
  }

  return null;
}
