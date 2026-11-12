import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scenarios } from "../src/modules/benchmark/application/scenarios";

loadEnvConfig(process.cwd());

const baseUrl = (process.env.SPECPROOF_BASE_URL ?? "https://specproof-nine.vercel.app").replace(/\/+$/, "");
const token = process.env.SPECPROOF_API_TOKEN;

if (!token) {
  throw new Error("SPECPROOF_API_TOKEN is required. Set it in .env.local; never commit it.");
}
if (scenarios.length !== 12) {
  throw new Error(`Expected exactly 12 benchmark scenarios, found ${scenarios.length}.`);
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(70_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed (HTTP ${response.status}): ${JSON.stringify(body)}`);
  }
  return body as T;
}

type CreatedRun = {
  data: { id: string; status: string; total_tasks: number };
};
type RunDetails = { data: Record<string, unknown> & { attempts: Array<Record<string, unknown>> } };

async function executeMode(mode: "baseline" | "research") {
  console.log(`\\n=== ${mode.toUpperCase()} · ${scenarios.length} scenarios ===`);
  const created = await api<CreatedRun>("/api/runs", {
    method: "POST",
    body: JSON.stringify({
      mode,
      name: mode === "baseline" ? "OpenRouter Baseline — 12 scenarios" : "OpenRouter + Tavily Research — 12 scenarios",
    }),
  });
  const runId = created.data.id;
  console.log(`Run created: ${runId}`);

  const outcomes: Array<{ taskKey: string; status: "completed" | "failed"; error?: string }> = [];
  for (const [index, scenario] of scenarios.entries()) {
    try {
      const result = await api<{ data: { progress?: { completed: number; failed: number }; score?: { total: number } } }>(
        `/api/runs/${runId}/tasks/${encodeURIComponent(scenario.key)}`,
        { method: "POST", body: "{}" },
      );
      outcomes.push({ taskKey: scenario.key, status: "completed" });
      console.log(
        `[${index + 1}/${scenarios.length}] ${scenario.key}: completed · score ${result.data.score?.total ?? "n/a"} · ${result.data.progress?.completed ?? "?"}/${scenarios.length}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outcomes.push({ taskKey: scenario.key, status: "failed", error: message });
      console.error(`[${index + 1}/${scenarios.length}] ${scenario.key}: FAILED · ${message}`);
    }
  }

  const details = await api<RunDetails>(`/api/runs/${runId}`);
  const completed = outcomes.filter((item) => item.status === "completed").length;
  const failed = outcomes.length - completed;
  const output = {
    mode,
    runId,
    baseUrl,
    model: details.data.model,
    status: details.data.status,
    completed,
    failed,
    outcomes,
    run: details.data,
    exportedAt: new Date().toISOString(),
  };

  await mkdir(join(process.cwd(), "benchmark-results"), { recursive: true });
  const file = join(process.cwd(), "benchmark-results", `${mode}-${runId}.json`);
  await writeFile(file, JSON.stringify(output, null, 2), "utf8");
  console.log(`Saved: ${file}`);
  console.log(`${mode}: ${completed}/${scenarios.length} completed, ${failed} failed, aggregate ${details.data.aggregate_score ?? "not available"}`);
  return output;
}

async function main() {
  console.log(`SPECProof benchmark target: ${baseUrl}`);
  const baseline = await executeMode("baseline");
  const research = await executeMode("research");
  console.log("\\n=== FINAL SUMMARY ===");
  console.log(JSON.stringify({
    baseline: { runId: baseline.runId, status: baseline.status, completed: baseline.completed, failed: baseline.failed },
    research: { runId: research.runId, status: research.status, completed: research.completed, failed: research.failed },
  }, null, 2));
  if (baseline.failed || research.failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
