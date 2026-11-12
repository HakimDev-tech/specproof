# SPECProof evaluation methodology

**Suite:** `specproof-core-v1`  
**Scoring implementation:** `deterministic-coverage+evidence-audit-v2`  
**Status:** experimental research benchmark; not a validated scientific instrument.

## Experimental design

The suite contains 12 fixed prompts: four API-correctness tasks, four migration/breaking-change tasks, and four documentation-research tasks.

- **Baseline:** the agent receives the task prompt and its parametric knowledge only. No retrieval context is passed to the model.
- **Research:** Tavily Search + Extract runs before generation; the retrieved evidence is passed to the model.
- **Common post-hoc audit:** after Baseline generation, the evaluator retrieves the same official-source corpus used for Research evaluation. This corpus is never passed to the Baseline agent. The two conditions therefore share an evaluation-source mechanism without giving Baseline retrieval assistance.

Evaluator retrieval and claim-judging latency are excluded from agent-generation latency. Their API usage and cost must be reported separately.

## Score dimensions

| Dimension | Weight | Operational definition |
|---|---:|---|
| Factual correctness | 30% | 35% deterministic lexical diagnostic + 65% model-judged factual support against the common official evidence corpus |
| Evidence quality | 25% | Share of audited claims that are supported and explicitly traceable to a cited URL in the retrieved allowlist |
| Freshness / version signal | 15% | Source temporal proxy, adjusted for an explicit target-version match |
| Completeness | 15% | Coverage of scenario-specific required terms; a transparent lexical proxy, not semantic completeness |
| Efficiency | 10% | Generation latency and token-budget thresholds |
| Uncertainty / abstention | 5% | Abstention behavior on the one task explicitly requiring it; neutral score on other tasks |

All metrics are clamped to [0, 100]. The weighted total is the sum of dimension scores multiplied by the weights above.

## Factual correctness versus evidence quality

The evaluator records whether a claim is factually supported by the supplied excerpts, even when the answer omits a citation. It separately records whether the answer explicitly cites an allowlisted URL that supports that claim. An uncited but supported claim can contribute to factual correctness, but not evidence quality.

Evaluator source URLs are normalized and checked against the exact retrieved URL allowlist. A judge cannot earn evidence credit by inventing an arbitrary URL. URL membership is not itself proof that a source supports a claim; the model auditor must still assess excerpt-level support.

## Freshness limitations

The freshness function is a **temporal proxy**, not a formal version validator:

- Dated source age ≤ 1 year: 100 temporal points.
- ≤ 2 years: 85.
- ≤ 4 years: 65.
- Older: 40.
- Undated or unparseable date: 50 (unknown, not “fresh”).
- A target-version string match in URL/title/excerpt retains the temporal score; no match applies a 0.6 multiplier.

This does not prove that documentation is current or that content matches every semantic detail of a release. A target-version string match is a weak metadata signal, not a semantic compatibility test. Version-specific gold assertions and immutable documentation snapshots are needed for a publication-grade freshness benchmark.

## Evidence and model-judge limitations

- The answer model uses `OPENROUTER_MODEL`. The claim auditor uses `OPENROUTER_EVALUATOR_MODEL` when configured and otherwise falls back to the answer model. A distinct evaluator reduces (but does not eliminate) correlated-error and self-evaluation risks.
- Required/forbidden terms are lexical diagnostics. They can be satisfied by incorrect explanations and missed by correct paraphrases.
- Official-domain matching checks hostnames, not page authority, release scope, or claim entailment.
- Tavily publication dates may be absent or reflect page metadata rather than the underlying API version.
- Research results depend on retrieval ranking, extraction success, model snapshot, and execution date.
- A failed evaluator retrieval in Baseline is recorded as an unavailable evaluation corpus; the generated answer is preserved, but evidence/freshness cannot be treated as measured.
- A failed retrieval in Research prevents a valid research-condition task result.

## Reproducibility record

Every run should preserve suite version, task key, mode, configured model identifier, answer, generation latency, token counts, retrieved evidence URLs, source publication dates, content hashes, claim assessments, metric breakdown, and timestamps.

Compare paired tasks, not only run-level averages. Report failed/unavailable tasks and never silently drop them. For a serious result report:
1. Execute multiple independent repetitions per mode.
2. Freeze the scenario set and model identifier.
3. Record retrieval dates and all cost components.
4. Publish per-task results with aggregate confidence intervals.
5. Preserve raw exports so results can be independently inspected.

A single 12-task run per condition is exploratory and insufficient to claim statistical significance.

## Manual audit protocol

Before publishing benchmark results, review every task in both conditions:

1. Confirm that the expected answer is supported by the official documentation version named in the scenario.
2. Read the full answer and compare each material factual claim with the retrieved excerpt, not just the model judge's verdict.
3. Check that each cited URL is present in the retrieved allowlist and directly supports the adjacent claim.
4. Flag unsupported claims, stale examples, version conflation, missing caveats, and unjustified abstentions.
5. Record disagreements between the model auditor and the human reviewer; do not silently overwrite raw model scores.
6. Include failures and unavailable evaluator corpora in the report.

## Interpreting results

SPECProof currently measures a combination of deterministic diagnostics and model-assisted evaluation. Describe it as an **experimental benchmark prototype**, not as a proven objective ranking of AI agents. Stronger validation requires:

1. Human-authored gold answers and claim-level annotation for all 12 tasks.
2. A separate evaluator model or blinded human review.
3. Multiple repetitions and inter-rater agreement analysis.
4. Version-pinned source snapshots with explicit effective dates.
5. Cost accounting for generation, search, extraction, and judging separately.
6. A larger, independently reviewed scenario set.
