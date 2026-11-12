import type { ScoreBreakdown } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function scoreAttempt(
  input: Omit<ScoreBreakdown, "total">,
): ScoreBreakdown {
  const weights = {
    correctness: 0.3,
    evidence: 0.25,
    freshness: 0.15,
    completeness: 0.15,
    efficiency: 0.1,
    uncertainty: 0.05,
  } as const;

  const values = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, clamp(value)]),
  ) as Omit<ScoreBreakdown, "total">;

  const total = Object.entries(weights).reduce(
    (sum, [key, weight]) =>
      sum + values[key as keyof typeof values] * weight,
    0,
  );

  return { ...values, total: Number(total.toFixed(2)) };
}

export function deterministicChecks(
  answer: string,
  required: string[],
  forbidden: string[] = [],
) {
  const normalized = answer.toLowerCase();
  const matched = required.filter((term) =>
    normalized.includes(term.toLowerCase()),
  );
  const violations = forbidden.filter((term) =>
    normalized.includes(term.toLowerCase()),
  );

  return {
    matched,
    missing: required.filter((term) => !matched.includes(term)),
    violations,
    score: required.length
      ? Math.max(0, (100 * matched.length) / required.length - violations.length * 25)
      : 50,
  };
}

export interface ClaimAssessment {
  claim: string;
  supported: boolean;
  sourceUrls: string[];
  rationale: string;
}

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function evaluateClaimEvidence(
  claims: ClaimAssessment[],
  knownEvidenceUrls: string[],
) {
  const known = new Set(
    knownEvidenceUrls.map(normalizeUrl).filter((value): value is string => value !== null),
  );

  const assessed = claims.map((claim) => {
    const validSources = claim.sourceUrls
      .map(normalizeUrl)
      .filter((value): value is string => value !== null && known.has(value));
    const supported = claim.supported && validSources.length > 0;
    return { ...claim, supported, verifiedSourceUrls: validSources };
  });

  const supportedCount = assessed.filter((claim) => claim.supported).length;
  return {
    claims: assessed,
    totalClaims: assessed.length,
    supportedClaims: supportedCount,
    unsupportedClaims: assessed.length - supportedCount,
    score: assessed.length ? (supportedCount / assessed.length) * 100 : 0,
  };
}
