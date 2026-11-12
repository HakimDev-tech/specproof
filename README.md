# SPECProof

**Evidence-based benchmarking for AI developer research agents.**

SPECProof compares a developer agent answering from model knowledge (Baseline) with the same agent answering after documentation retrieval (Research). Both conditions use the same 12-task suite and are evaluated against a common official-source audit corpus.

> **Research status:** experimental benchmark prototype. A successful build or a completed run does not establish scientific validity. Publish measured results only after inspecting the persisted task-level evidence and reporting failures and limitations.

## What is measured

| Dimension | Weight |
| --- | ---: |
| Factual correctness | 30% |
| Evidence quality | 25% |
| Freshness / version signal | 15% |
| Completeness | 15% |
| Efficiency | 10% |
| Uncertainty / abstention | 5% |
| **Total** | **100%** |

The fixed suite contains 12 scenarios: four API-correctness tasks, four migration/breaking-change tasks, and four documentation-research tasks.

## Experimental conditions

- **Baseline:** the agent receives only the task prompt and its model knowledge. It receives no Tavily search results or extracted documentation.
- **Research:** Tavily Search + Extract runs before answer generation; retrieved evidence is supplied to the agent.
- **Common evaluation:** after answer generation, Baseline retrieves the same official-source corpus used to audit Research. This post-hoc corpus is not shown to the Baseline agent. The evaluator separately assesses factual support and whether the answer itself cited an allowlisted URL.
- **Failure semantics:** failed task attempts remain visible and are not silently dropped. If Baseline post-hoc retrieval fails, the answer is preserved but evidence/freshness are not treated as measured. A Research task whose pre-generation retrieval fails cannot produce a valid Research result.

## Architecture

- Next.js App Router / React / TypeScript
- Route Handlers with Zod request validation and bearer-token authentication
- OpenRouter for answer generation and model-assisted claim auditing
- Tavily Search + Extract for documentation retrieval
- Neon PostgreSQL for runs, attempts, claims, and evidence
- Drizzle ORM / postgres.js
- Vitest + GitHub Actions
- Vercel Preview and Production deployments

The application is a modular monolith. The agent runtime, retrieval adapter, benchmark domain/scoring, persistence, and UI are separated by module boundaries; this prototype does not require distributed services.

## Configuration

Requirements: Node.js 22 LTS and npm.

1. Install dependencies: `npm install`. The repository currently does not include a lockfile, so CI uses npm's dependency resolution rather than a reproducible lockfile install.
2. Configure the environment variables listed in [`.env.example`](.env.example).
3. Set `DATABASE_URL` to the intended Neon branch. Use a dedicated non-production branch for preview experiments.
4. Set `OPENROUTER_BASE_URL` (normally `https://openrouter.ai/api/v1`), `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `TAVILY_API_KEY`, and a random `SPECPROOF_API_TOKEN` of at least 32 characters.
5. Optionally set `OPENROUTER_EVALUATOR_MODEL` to a different model from the answer model. This reduces, but does not eliminate, correlated evaluator error.
6. Apply the schema with `npm run db:migrate`.
7. Run `npm run typecheck && npm test && npm run build`.

Never commit `.env.local`, publish tokens, or paste API keys into source files, issues, or chat. Do not use a production database URL for development or preview experiments unless production writes are intentional.

## Running experiments

### Browser runner

Open `/benchmark` on the intended deployment.

1. Verify which Neon branch is configured for that deployment before running any task. Vercel Preview and Production environment variables are configured independently; do not assume that Preview points to a non-production database.
2. Obtain the API token from the trusted secret manager / Vercel project settings. Enter it directly into the password field in the browser. The runner keeps it in tab memory only and sends it over HTTPS as a Bearer token.
3. Select Baseline, Research, or both.
4. Execute the selected workload. One complete paired experiment performs 24 task executions (12 per condition).
5. Inspect every task status, score dimension, failure, evidence URL, and claim assessment. Export the persisted run data as JSON for independent review.

The runner writes to the database configured by `DATABASE_URL` for the deployment being used. Confirm the branch before pressing Run.

### API

All run and benchmark endpoints require `Authorization: Bearer <SPECPROOF_API_TOKEN>`.

Create a run:

```bash
curl -X POST "$BASE_URL/api/runs" \
  -H "Authorization: Bearer $SPECPROOF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"baseline"}'
```

Execute each of the 12 task keys independently using the returned run ID:

```text
api-01 api-02 api-03 api-04
mig-01 mig-02 mig-03 mig-04
doc-01 doc-02 doc-03 doc-04
```

Use `mode: "research"` to enable Tavily Search + Extract before generation. Baseline does not receive retrieval context; its official-source corpus is fetched only after generation for post-hoc evaluation.

## Interpreting results

Do not compare only run-level averages. Inspect paired per-task scores, all six dimension scores, failed/unavailable tasks, source publication dates, content hashes, and claim-level evidence. The console exports persisted run summaries as JSON.

A single 12-task run per condition is exploratory. Do not claim statistical significance or a universal agent ranking from this sample. Stronger claims require repeated runs, human-annotated gold answers, blinded independent review, inter-rater agreement, and version-pinned source snapshots.

## Research limitations

- The suite contains 12 hand-authored scenarios and is not a representative sample of all developer work.
- Required/forbidden-term checks are lexical diagnostics; correct paraphrases may be missed and incorrect answers may contain required terms.
- Claim auditing is model-assisted, not ground truth. A separate evaluator model is recommended but not mandatory.
- Source-domain allowlisting does not prove that a page is authoritative for every claim.
- Freshness is a temporal proxy, not semantic version verification.
- Tavily ranking, extraction, publication metadata, model snapshots, and network availability can affect results.
- Evaluator retrieval and judging costs must be reported separately from answer-generation efficiency.
- The benchmark is an experimental prototype, not a validated scientific instrument.

## CI

GitHub Actions runs TypeScript checks, unit tests, and a production build on Node.js 22 for pushes and pull requests to `main`. CI does not run paid OpenRouter/Tavily experiments and does not write to Neon.
