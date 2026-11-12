# SPECProof

Evidence-based benchmarking for AI developer research agents.

## Local setup

Requirements: Node.js 22 LTS and npm.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL`, `BIFROST_BASE_URL`, `BIFROST_API_KEY`, `BIFROST_MODEL`, `TAVILY_API_KEY`, and a random `SPECProof_API_TOKEN` of at least 32 characters.
4. Apply the schema: `npm run db:migrate`
5. Run checks: `npm run typecheck && npm test && npm run build`
6. Start locally: `npm run dev`

Never commit `.env.local` or paste API keys into source files, issues, or chat.

## API authentication

All benchmark and run endpoints require `Authorization: Bearer <SPECProof_API_TOKEN>`. The health endpoint is a public liveness check and does not expose integration status. Configure the same token in trusted clients only. Rotate it if exposed.

## Run a benchmark

Create a run:

```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Authorization: Bearer $SPECProof_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"baseline"}'
```

Execute each task independently using the returned run ID and each of the 12 task keys. Use `mode: "research"` to enable Tavily retrieval and claim-to-evidence auditing.

## Evaluation integrity

The score combines deterministic keyword/forbidden-term checks, source-domain and citation checks, and model-assisted claim-to-evidence assessment. Model-assisted assessments are not ground truth: the evaluator must use only the supplied evidence, and source URLs returned by the judge are checked against the retrieved URL allowlist. Unsupported or invented URLs do not count as support. If claim auditing is unavailable, evidence scoring is reduced and the run records the audit status.

Freshness is not inferred from retrieval time. Sources without a verifiable publication or version date are not represented as fresh; the current evaluator uses a neutral placeholder pending version-pinned source snapshots.

## CI

GitHub Actions runs TypeScript checks, unit tests, and a production build on Node.js 22 for pushes and pull requests to `main`.
