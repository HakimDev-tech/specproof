import { describe, expect, it } from "vitest";
import { scenarios } from "./scenarios";

describe("SPECProof core benchmark suite", () => {
  it("contains twelve unique, fully specified scenarios", () => {
    expect(scenarios).toHaveLength(12);
    expect(new Set(scenarios.map((item) => item.key)).size).toBe(12);
    for (const scenario of scenarios) {
      expect(scenario.prompt.trim().length).toBeGreaterThan(30);
      expect(scenario.targetVersion.trim()).not.toBe("");
      expect(scenario.expected.requiredTerms.length).toBeGreaterThan(0);
      expect(scenario.rubric.correctness).toBeTruthy();
      expect(scenario.rubric.evidence).toBeTruthy();
      expect(scenario.rubric.freshness).toBeTruthy();
      expect(scenario.rubric.completeness).toBeTruthy();
    }
  });

  it("keeps the intended 4/4/4 domain balance", () => {
    const counts = scenarios.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      api_correctness: 4,
      breaking_changes: 4,
      documentation_research: 4,
    });
  });

  it("contains explicit abstention cases", () => {
    expect(scenarios.filter((item) => item.expected.mustAbstain)).toHaveLength(2);
  });
});
