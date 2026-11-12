# SPECProof
Evidence-based benchmarking for AI developer agents.

Version-aware evaluation of developer research agents across API correctness, migrations, documentation evidence, freshness, completeness, efficiency and abstention.

Stack: Next.js 15, React 19, TypeScript, Tailwind 4, Neon PostgreSQL, Drizzle, Bifrost OpenAI-compatible API, Tavily.

Setup: pnpm install; copy .env.example to .env.local; set credentials; pnpm db:migrate; pnpm dev.

The initial 12-task suite is deliberately narrow and inspectable, not a universal benchmark. Deterministic checks take precedence over LLM judgments. Never expose provider credentials client-side.
