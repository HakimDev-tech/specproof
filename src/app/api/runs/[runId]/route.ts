import { NextResponse } from "next/server";
import { requireApiToken } from "@/lib/auth/api";
import { sql } from "@/lib/db/client";
import { z } from "zod";

const paramsSchema = z.object({ runId: z.string().uuid() });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const unauthorized = requireApiToken(request);
  if (unauthorized) return unauthorized;
  if (!sql) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid run ID" }, { status: 400 });
  }

  const [run] = await sql`
    SELECT
      r.id, r.status, r.total_tasks, r.completed_tasks, r.aggregate_score,
      r.created_at, r.started_at, r.completed_at,
      a.name AS agent_name, a.mode, a.model,
      s.name AS suite_name, s.version AS suite_version
    FROM benchmark_runs r
    JOIN agent_configs a ON a.id = r.agent_config_id
    JOIN benchmark_suites s ON s.id = r.suite_id
    WHERE r.id = ${parsed.data.runId}
    LIMIT 1
  `;

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const attempts = await sql`
    SELECT
      t.task_key, t.title, t.category, ta.status, ta.score, ta.metrics,
      ta.claims, ta.answer, ta.error, ta.latency_ms, ta.input_tokens,
      ta.output_tokens, ta.completed_at,
      COALESCE((
        SELECT json_agg(json_build_object(
          'url', e.url,
          'title', e.title,
          'snippet', e.snippet,
          'isOfficial', e.is_official,
          'retrievedAt', e.retrieved_at,
          'publishedAt', e.published_at
        ) ORDER BY e.retrieved_at DESC)
        FROM evidence_items e
        WHERE e.attempt_id = ta.id
      ), '[]'::json) AS evidence
    FROM task_attempts ta
    JOIN benchmark_tasks t ON t.id = ta.task_id
    WHERE ta.run_id = ${parsed.data.runId}
    ORDER BY t.task_key
  `;

  return NextResponse.json({ data: { ...run, attempts } });
}
