# SPECProof

Evidence-based benchmarking for AI developer research agents.

## Local setup

Requirements: Node.js 22 LTS and npm.

1. Install dependencies: `npm install`.
2. For local development, link the Vercel project and pull its development-only environment: `npx vercel link --project specproof`, then `npx vercel env pull .env.local --environment=development`. This uses a separate Neon development branch. Add your OpenRouter and Tavily credentials to the local `.env.local` file; production/preview Secret values are intentionally not retrievable by `vercel env pull`. Alternatively, copy `.env.example` to `.env.local` and fill all values manually.
3. Set `DATABASE_URL`, `OPENROUTER_BASE_URL` (normally `https://openrouter.ai/api/v1`), `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `TAVILY_API_KEY`, and a random `SPECPROOF_API_TOKEN` of at least 32 characters. `OPENROUTER_EVALUATOR_MODEL` is optional and should identify a different model for claim auditing. `OPENROUTER_SITE_URL` is optional and used as OpenRouter attribution metadata.
4. Apply the schema: `npm run db:migrate`.
5. Run checks: `npm run typecheck && npm test && npm run build`.
6. Start locally: `npm run dev`.

Never commit `.env.local` or paste API keys into source files, issues, or chat.

## API authentication

All benchmark and run endpoints require `Authorization: Bearer <SPECPROOF_API_TOKEN>`. The health endpoint is a public liveness check and does not expose integration status. Configure the same token in trusted clients only. Rotate it if exposed.

## Run a benchmark

Create a run:

```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Authorization: Bearer $SPECPROOF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"baseline"}'
```

Execute each task independently using the returned run ID and each of the 12 task keys. Use `mode: "research"` to enable Tavily Search + Extract and claim-to-evidence auditing. Baseline deliberately skips Tavily retrieval and claim auditing.

## Evaluation integrity

The score combines deterministic keyword/forbidden-term checks, source-domain and citation checks, and model-assisted claim-to-evidence assessment. Model-assisted assessments are not ground truth: the evaluator must use only the supplied evidence, and source URLs returned by the judge are checked against the retrieved URL allowlist. Unsupported or invented URLs do not count as support. If claim auditing is unavailable, evidence scoring is reduced and the run records the audit status.

Freshness is not inferred from retrieval time. Sources without a verifiable publication or version date are not represented as fresh; the current evaluator uses a neutral placeholder pending version-pinned source snapshots.

## CI

GitHub Actions runs TypeScript checks, unit tests, and a production build on Node.js 22 for pushes and pull requests to `main`.
\n\n## Result interpretation\n\nDo not compare only run-level averages. Inspect paired per-task scores, dimension breakdowns, failed tasks, source dates and claim-level evidence. The benchmark console exports persisted run summaries as JSON. A single 12-task run is exploratory; publication-grade claims require multiple repetitions, human-annotated gold answers, an independent evaluator and version-pinned source snapshots.\n