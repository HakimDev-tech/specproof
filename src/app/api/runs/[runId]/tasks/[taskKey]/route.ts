import { NextResponse } from "next/server";
import { requireApiToken } from "@/lib/auth/api";
import { sql } from "@/lib/db/client";
import {
  executeAgent,
  verifyClaims,
} from "@/modules/agent-runtime/bifrost";
import { scenarios } from "@/modules/benchmark/application/scenarios";
import {
  deterministicChecks,
  evaluateClaimEvidence,
  scoreAttempt,
} from "@/modules/benchmark/domain/scoring";
import { retrieveEvidence } from "@/modules/retrieval/tavily";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string; taskKey: string }> },
) {
  const unauthorized = requireApiToken(request);
  if (unauthorized) return unauthorized;
  if (!sql) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }

  const { runId, taskKey } = await params;
  const scenario = scenarios.find((item) => item.key === taskKey);
  if (!scenario) return NextResponse.json({ error: "Unknown task" }, { status: 404 });

  const [run] = await sql`
    SELECT r.id, r.total_tasks, a.mode
    FROM benchmark_runs r
    JOIN agent_configs a ON a.id = r.agent_config_id
    WHERE r.id = ${runId}
    LIMIT 1
  `;
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const [task] = await sql`
    SELECT id FROM benchmark_tasks
    WHERE suite_id = (SELECT suite_id FROM benchmark_runs WHERE id = ${runId})
      AND task_key = ${taskKey}
    LIMIT 1
  `;
  if (!task) {
    return NextResponse.json(
      { error: "Task not found in this run's benchmark suite" },
      { status: 404 },
    );
  }

  const mode = run.mode === "research" ? "research" : "baseline";
  const [attempt] = await sql`
    INSERT INTO task_attempts(run_id, task_id, status)
    VALUES (${runId}, ${task.id}, 'running')
    ON CONFLICT(run_id, task_id)
    DO UPDATE SET status = 'running', error = NULL, started_at = now(), completed_at = NULL
    RETURNING id
  `;

  try {
    await sql`DELETE FROM evidence_items WHERE attempt_id = ${attempt.id}`;
    const evidence = mode === "research" ? await retrieveEvidence(scenario.prompt) : [];
    const result = await executeAgent({ prompt: scenario.prompt, mode, evidence });
    const checks = deterministicChecks(
      result.answer,
      scenario.expected.requiredTerms,
      scenario.expected.forbiddenTerms ?? [],
    );

    let claimVerification:
      | ReturnType<typeof evaluateClaimEvidence>
      | null = null;
    let claimVerificationStatus: "completed" | "unavailable" | "not_applicable" =
      mode === "research" ? "unavailable" : "not_applicable";

    if (mode === "research" && evidence.length > 0) {
      try {
        const audit = await verifyClaims({
          question: scenario.prompt,
          answer: result.answer,
          evidence,
        });
        claimVerification = evaluateClaimEvidence(
          audit.claims,
          evidence.map((item) => item.url),
        );
        claimVerificationStatus = "completed";
      } catch {
        claimVerificationStatus = "unavailable";
      }
    }

    const isOfficial = (url: string) =>
      scenario.expected.officialDomains.some((domain) => {
        try {
          const hostname = new URL(url).hostname;
          return hostname === domain || hostname.endsWith(`.${domain}`);
        } catch {
          return false;
        }
      });

    const officialEvidence = evidence.filter((item) => isOfficial(item.url));
    const citedOfficial = officialEvidence.filter((item) =>
      result.answer.includes(item.url),
    );
    const citationScore = scenario.expected.officialDomains.length
      ? officialEvidence.length
        ? (citedOfficial.length / officialEvidence.length) * 100
        : 0
      : scenario.expected.mustAbstain
        ? 100
        : 0;

    const evidenceScore =
      mode === "baseline"
        ? 0
        : claimVerificationStatus === "completed" && claimVerification
          ? claimVerification.score * 0.7 + citationScore * 0.3
          : citationScore * 0.3;

    const abstained =
      /cannot verify|insufficient evidence|cannot determine|unable to verify|not enough evidence/i.test(
        result.answer,
      );

    const metrics = scoreAttempt({
      correctness: checks.score,
      evidence: evidenceScore,
      freshness: officialEvidence.length > 0 ? 50 : 0,
      completeness: checks.score,
      efficiency:
        result.latencyMs < 15_000 &&
        (result.inputTokens ?? 0) + (result.outputTokens ?? 0) < 5_000
          ? 100
          : 50,
      uncertainty: scenario.expected.mustAbstain ? (abstained ? 100 : 0) : 50,
    });

    const persistedClaims = claimVerification?.claims ?? [];
    await sql`
      UPDATE task_attempts
      SET status = 'completed',
          answer = ${result.answer},
          claims = ${sql.json(persistedClaims)},
          metrics = ${sql.json({
            ...metrics,
            claimVerificationStatus,
            totalClaims: claimVerification?.totalClaims ?? 0,
            supportedClaims: claimVerification?.supportedClaims ?? 0,
            unsupportedClaims: claimVerification?.unsupportedClaims ?? 0,
            missingTerms: checks.missing.length,
            matchedTerms: checks.matched,
            forbiddenClaims: checks.violations.length,
          })},
          score = ${metrics.total},
          latency_ms = ${result.latencyMs},
          input_tokens = ${result.inputTokens ?? null},
          output_tokens = ${result.outputTokens ?? null},
          completed_at = now()
      WHERE id = ${attempt.id}
    `;

    for (const item of evidence) {
      await sql`
        INSERT INTO evidence_items(attempt_id, url, title, snippet, is_official)
        VALUES (${attempt.id}, ${item.url}, ${item.title}, ${item.snippet}, ${isOfficial(item.url)})
      `;
    }

    const [progress] = await sql`
      SELECT
        count(*) FILTER (WHERE status = 'completed')::int AS completed,
        count(*) FILTER (WHERE status = 'failed')::int AS failed,
        count(*)::int AS attempted
      FROM task_attempts
      WHERE run_id = ${runId}
    `;

    const allAttempted = progress.attempted >= run.total_tasks;
    const finalStatus = allAttempted
      ? progress.failed > 0
        ? "partially_completed"
        : "completed"
      : "running";

    await sql`
      UPDATE benchmark_runs
      SET status = ${finalStatus},
          started_at = COALESCE(started_at, now()),
          completed_tasks = ${progress.completed},
          completed_at = CASE WHEN ${allAttempted} THEN now() ELSE NULL END,
          aggregate_score = CASE
            WHEN ${allAttempted} AND ${progress.failed} = 0
              THEN (SELECT avg(score) FROM task_attempts WHERE run_id = ${runId} AND status = 'completed')
            ELSE NULL
          END
      WHERE id = ${runId}
    `;

    return NextResponse.json({
      data: {
        attemptId: attempt.id,
        taskKey,
        answer: result.answer,
        checks,
        claimVerification,
        claimVerificationStatus,
        score: metrics,
        evidenceCount: evidence.length,
        progress: {
          completed: progress.completed,
          failed: progress.failed,
          attempted: progress.attempted,
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown execution error";
    await sql`
      UPDATE task_attempts
      SET status = 'failed', error = ${message}, completed_at = now()
      WHERE id = ${attempt.id}
    `;
    return NextResponse.json(
      { error: message, attemptId: attempt.id },
      { status: 502 },
    );
  }
}
