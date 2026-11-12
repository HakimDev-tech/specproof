# SPECProof evaluation methodology

**Suite:** `specproof-core-v1`  
**Scoring implementation:** `deterministic-coverage+evidence-audit-v2`  
**Status:** experimental research benchmark; not a validated scientific instrument.

## Experimental design

The suite contains 12 fixed prompts: four API-correctness tasks, four migration/breaking-change tasks, and four documentation-research tasks. Each task is executed in two conditions:

- **Baseline:** the model receives the task prompt and its parametric knowledge only.
- **Research:** the model receives the same prompt plus Tavily Search/Extract evidence.

The baseline evaluator retrieves a reference corpus **after the model has generated its answer**. This corpus is not passed to the baseline agent. It is used only for the post-hoc factual/evidence audit, so both conditions can be evaluated against the same source-selection mechanism. Evaluator retrieval cost is not included in the agent-generation latency metric and must be reported separately in cost analysis.

## Score dimensions

| Dimension | Weight | Operational definition |
|---|---:|---|
| Factual correctness | 30% | 35% lexical coverage diagnostic + 65% model-judged factual support against the common official evidence corpus |
| Evidence quality | 25% | Share of audited claims that are supported **and** explicitly traceable to a cited URL in the retrieved allowlist |
| Freshness / version signal | 15% | Source temporal proxy, adjusted for an explicit target-version match |
| Completeness | 15% | Coverage of scenario-specific required terms; a transparent lexical proxy, not semantic completeness |
| Efficiency | 10% | Generation latency and token budget thresholds |
| Uncertainty / abstention | 5% | Abstention behavior on the dedicated task explicitly requiring it; neutral score on other tasks |

All metrics are clamped to [0, 100]. The weighted total is the sum of dimension scores multiplied by the weights above.

### Factual correctness versus evidence quality

These dimensions are intentionally distinct. The evaluator records whether a claim is factually supported by the supplied excerpts, even when the answer omits a citation. It separately records whether the answer explicitly cites an allowlisted URL that supports that claim. An uncited but supported claim can contribute to factual correctness, but not evidence quality.

The evaluator's source URLs are normalized and checked against the exact retrieved URL allowlist. A judge cannot earn evidence credit by inventing an arbitrary URL. URL membership is not itself proof that a source supports a claim; the model auditor still assesses excerpt-level support.

### Freshness limitations

The freshness function is a **temporal proxy**, not a formal version validator:

- Dated source age ≤ 1 year: 100 temporal points.
- ≤ 2 years: 85.
- ≤ 4 years: 65.
- Older: 40.
- Undated or unparseable date: 50 (unknown, not “fresh”).
- A target-version string match in the URL/title/excerpt retains the temporal score; no match applies a 0.6 multiplier.

This does not prove that a documentation page is current or that the content matches every semantic detail of a release. The target-version string match is a weak metadata signal, not a semantic compatibility test. Version-specific gold assertions and immutable documentation snapshots are still needed for a publication-grade freshness benchmark.

## Evidence and model-judge limitations

- The answer model uses `OPENROUTER_MODEL`. The claim auditor uses `OPENROUTER_EVALUATOR_MODEL` when configured, and otherwise falls back to the answer model. Configure a distinct evaluator model to reduce (but not eliminate) correlated-error and self-evaluation risks. Scores remain model-assisted judgments, not independent ground truth.
- Required/forbidden terms are lexical diagnostics. They can be satisfied by incorrect explanations and missed by correct paraphrases.
- Official-domain matching checks hostnames, not page authority, release scope, or claim entailment.
- Tavily publication dates may be absent or reflect page metadata rather than the underlying API version.
- Research results depend on retrieval ranking, extraction success, model snapshot and the date of execution.
- A failed evaluator retrieval in Baseline is recorded as an unavailable evaluation corpus; the generated answer is preserved, but evidence/freshness cannot be treated as measured.
- A failed retrieval in Research prevents a valid research-condition task result.

## Reproducibility record

Every run should preserve the suite version, task key, mode, configured model identifier, answer, generation latency, token counts, retrieved evidence URLs, source publication dates, content hashes, claim assessments, metric breakdown and timestamps. Compare paired tasks, not only run-level averages. Report failed/unavailable tasks and never silently drop them.

For a serious result report, execute multiple independent repetitions per mode, freeze the scenario set and model identifier, record retrieval dates, and publish per-task results with aggregate confidence intervals. A single 12-task run is exploratory and insufficient to claim statistical significance.

## Interpreting results

SPECProof currently measures a combination of deterministic diagnostics and model-assisted evaluation. It should be described as an **experimental benchmark prototype**, not as a proven objective ranking of AI agents. Stronger validation requires:

1. Human-authored gold answers and claim-level annotation for all 12 tasks.
2. A separate evaluator model or blinded human review.
3. Multiple repetitions and inter-rater agreement analysis.
4. Version-pinned source snapshots with explicit effective dates.
5. Cost accounting for generation, search, extraction and judging separately.
6. A larger, independently reviewed scenario set.
