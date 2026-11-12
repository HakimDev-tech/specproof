import { NextResponse } from "next/server";
import { requireApiToken } from "@/lib/auth/api";
import { sql } from "@/lib/db/client";
import { scenarios } from "@/modules/benchmark/application/scenarios";
import { z } from "zod";

const requestSchema = z.object({
  mode: z.enum(["baseline", "research"]),
  name: z.string().trim().min(2).max(150).optional(),
});

export async function POST(request: Request) {
  const unauthorized = requireApiToken(request);
  if (unauthorized) return unauthorized;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (!sql) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }

  const [suite] = await sql`
    INSERT INTO benchmark_suites(slug, name, description, version, category)
    VALUES (
      'specproof-core',
      'Developer Agent Reliability',
      'Version-aware developer research benchmark',
      '1.0.0',
      'Developer research agents'
    )
    ON CONFLICT(slug, version) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;

  for (const scenario of scenarios) {
    await sql`
      INSERT INTO benchmark_tasks(
        suite_id, task_key, title, category, prompt, target_version, expected, rubric
      )
      VALUES (
        ${suite.id}, ${scenario.key}, ${scenario.title}, ${scenario.category},
        ${scenario.prompt}, ${scenario.targetVersion},
        ${sql.json(scenario.expected)}, ${sql.json(scenario.rubric)}
      )
      ON CONFLICT(suite_id, task_key) DO NOTHING
    `;
  }

  const [agent] = await sql`
    INSERT INTO agent_configs(name, mode, model, settings)
    VALUES (
      ${parsed.data.name ?? (parsed.data.mode === "research" ? "OpenRouter + Tavily Research Agent" : "OpenRouter Baseline Agent")},
      ${parsed.data.mode},
      ${process.env.OPENROUTER_MODEL ?? "unconfigured"},
      ${sql.json({
        provider: "openrouter",
        retrieval: parsed.data.mode === "research" ? "tavily-search-extract" : "none",
        evaluatorModel: process.env.OPENROUTER_EVALUATOR_MODEL ?? process.env.OPENROUTER_MODEL ?? "unconfigured",
      })}
    )
    RETURNING id
  `;

  const [run] = await sql`
    INSERT INTO benchmark_runs(suite_id, agent_config_id, status, total_tasks)
    VALUES (${suite.id}, ${agent.id}, 'queued', ${scenarios.length})
    RETURNING id, status, total_tasks, created_at
  `;

  return NextResponse.json({ data: run }, { status: 201 });
}
