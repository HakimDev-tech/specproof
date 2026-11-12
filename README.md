# SPECProof
Evidence-based benchmarking for AI developer agents.

Version-aware evaluation of developer research agents across API correctness, migrations, documentation evidence, freshness, completeness, efficiency and abstention.

Stack: Next.js 15, React 19, TypeScript, Tailwind 4, Neon PostgreSQL, Drizzle, Bifrost OpenAI-compatible API, Tavily.

Setup: pnpm install; copy .env.example to .env.local; set credentials; pnpm db:migrate; pnpm dev.

The initial 12-task suite is deliberately narrow and inspectable, not a universal benchmark. Deterministic checks take precedence over LLM judgments. Never expose provider credentials client-side.


## Evaluator limitations (v0.1)
The current evaluator is a deterministic prototype: keyword coverage and explicit forbidden-term checks are not full claim-level semantic verification. Official-source presence is checked against expected domains and answer citation strings. Retrieved pages are timestamped at retrieval; when source publication dates are unavailable, freshness receives a neutral score rather than being called current. Scores from this evaluator must be presented as preliminary and accompanied by the task-level evidence. A robust release still needs version-pinned ground truth, claim extraction, claim-to-source entailment checks, evaluator calibration, and adversarial test coverage.
