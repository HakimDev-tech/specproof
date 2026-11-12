import { describe, expect, it } from "vitest";
import {
  deterministicChecks,
  evaluateClaimEvidence,
  scoreAttempt,
  scoreSourceFreshness,
} from "./scoring";

describe("benchmark scoring", () => {
  it("weights all dimensions to 100", () => {
    expect(scoreAttempt({
      correctness: 100, evidence: 100, freshness: 100,
      completeness: 100, efficiency: 100, uncertainty: 100,
    }).total).toBe(100);
  });

  it("clamps non-finite and out-of-range metrics", () => {
    const result = scoreAttempt({
      correctness: 120, evidence: -2, freshness: Number.NaN,
      completeness: 50, efficiency: 50, uncertainty: 50,
    });
    expect(result.correctness).toBe(100);
    expect(result.evidence).toBe(0);
    expect(result.freshness).toBe(0);
  });

  it("treats lexical checks as coverage diagnostics and penalizes forbidden terms", () => {
    const result = deterministicChecks("API definitely exists", ["API", "returning"], ["definitely exists"]);
    expect(result.matched).toEqual(["API"]);
    expect(result.missing).toEqual(["returning"]);
    expect(result.violations).toEqual(["definitely exists"]);
    expect(result.score).toBe(25);
  });

  it("rejects model-invented source URLs", () => {
    const result = evaluateClaimEvidence([{
      claim: "The API accepts an options object", supported: true,
      sourceUrls: ["https://fake.example/docs"], rationale: "Claimed by evaluator",
    }], ["https://official.example/docs"]);
    expect(result.score).toBe(0);
    expect(result.claims[0]?.supported).toBe(false);
  });

  it("normalizes fragments and query strings before allowlist matching", () => {
    const result = evaluateClaimEvidence([{
      claim: "The API accepts an options object", supported: true,
      sourceUrls: ["https://official.example/docs#api?x=1"], rationale: "Direct excerpt support",
    }], ["https://official.example/docs"]);
    expect(result.score).toBe(100);
  });

  it("does not call undated documentation fresh", () => {
    const result = scoreSourceFreshness([{
      url: "https://react.dev/reference/react/forwardRef",
      title: "React 19 reference",
      snippet: "React 19 ref behavior",
    }], "React 19", new Date("2026-11-12T00:00:00Z"));
    expect(result.score).toBe(50);
    expect(result.datedSources).toBe(0);
    expect(result.versionMatches).toBe(1);
  });

  it("rewards dated, version-matched sources and penalizes stale or mismatched sources", () => {
    const now = new Date("2026-11-12T00:00:00Z");
    const fresh = scoreSourceFreshness([{
      url: "https://nextjs.org/docs/15/app/api-reference/functions/cookies",
      title: "Next.js 15 cookies",
      snippet: "Next.js 15 async API",
      publishedAt: "2026-08-01T00:00:00Z",
    }], "Next.js 15", now);
    const stale = scoreSourceFreshness([{
      url: "https://nextjs.org/docs/14/app/api-reference/functions/cookies",
      title: "Next.js 14 cookies",
      snippet: "Next.js 14 sync API",
      publishedAt: "2021-01-01T00:00:00Z",
    }], "Next.js 15", now);
    expect(fresh.score).toBe(100);
    expect(stale.score).toBe(24);
  });
});
