import { describe, expect, it } from "vitest";
import {
  deterministicChecks,
  evaluateClaimEvidence,
  scoreAttempt,
} from "./scoring";

describe("benchmark scoring", () => {
  it("weights all dimensions to 100", () => {
    expect(
      scoreAttempt({
        correctness: 100,
        evidence: 100,
        freshness: 100,
        completeness: 100,
        efficiency: 100,
        uncertainty: 100,
      }).total,
    ).toBe(100);
  });

  it("penalizes forbidden claims", () => {
    expect(
      deterministicChecks("API definitely exists", ["API"], ["definitely exists"]).score,
    ).toBe(75);
  });

  it("clamps metric values", () => {
    expect(
      scoreAttempt({
        correctness: 120,
        evidence: -2,
        freshness: 50,
        completeness: 50,
        efficiency: 50,
        uncertainty: 50,
      }).correctness,
    ).toBe(100);
  });

  it("rejects model-invented source URLs", () => {
    const result = evaluateClaimEvidence(
      [{
        claim: "The API accepts an options object",
        supported: true,
        sourceUrls: ["https://fake.example/docs"],
        rationale: "Claimed by evaluator",
      }],
      ["https://official.example/docs"],
    );
    expect(result.score).toBe(0);
    expect(result.claims[0]?.supported).toBe(false);
  });

  it("accepts a supported claim only with a supplied source", () => {
    const result = evaluateClaimEvidence(
      [{
        claim: "The API accepts an options object",
        supported: true,
        sourceUrls: ["https://official.example/docs#api"],
        rationale: "The excerpt explicitly documents the option",
      }],
      ["https://official.example/docs"],
    );
    expect(result.score).toBe(100);
  });
});
