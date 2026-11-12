import type { ScoreBreakdown } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export const SCORE_WEIGHTS = {
  correctness: 0.3,
  evidence: 0.25,
  freshness: 0.15,
  completeness: 0.15,
  efficiency: 0.1,
  uncertainty: 0.05,
} as const;

export function scoreAttempt(input: Omit<ScoreBreakdown, "total">): ScoreBreakdown {
  const values = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, clamp(Number.isFinite(value) ? value : 0)]),
  ) as Omit<ScoreBreakdown, "total">;

  const total = Object.entries(SCORE_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + values[key as keyof typeof values] * weight,
    0,
  );
  return { ...values, total: Number(total.toFixed(2)) };
}

/** Coverage is a transparent lexical diagnostic, never a substitute for semantic correctness. */
export function deterministicChecks(answer: string, required: string[], forbidden: string[] = []) {
  const normalized = answer.toLocaleLowerCase();
  const matched = required.filter((term) => normalized.includes(term.toLocaleLowerCase()));
  const violations = forbidden.filter((term) => normalized.includes(term.toLocaleLowerCase()));
  return {
    matched,
    missing: required.filter((term) => !matched.includes(term)),
    violations,
    score: required.length
      ? clamp((100 * matched.length) / required.length - violations.length * 25)
      : 0,
  };
}

export interface ClaimAssessment {
  claim: string;
  supported: boolean;
  sourceUrls: string[];
  rationale: string;
}

export function normalizeEvidenceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return null;
  }
}

export function evaluateClaimEvidence(claims: ClaimAssessment[], knownEvidenceUrls: string[]) {
  const known = new Set(
    knownEvidenceUrls.map(normalizeEvidenceUrl).filter((value): value is string => value !== null),
  );
  const assessed = claims.map((claim) => {
    const validSources = [...new Set(claim.sourceUrls
      .map(normalizeEvidenceUrl)
      .filter((value): value is string => value !== null && known.has(value)))];
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

export interface FreshnessEvidence {
  url: string;
  title: string;
  snippet: string;
  publishedAt?: string;
}

/**
 * A transparent temporal proxy. It deliberately treats undated documentation as unknown (50),
 * not fresh. Version compatibility is assessed separately from publication age.
 */
export function scoreSourceFreshness(
  evidence: FreshnessEvidence[],
  targetVersion: string,
  now = new Date(),
) {
  if (!evidence.length) return { score: 0, datedSources: 0, versionMatches: 0, sourceCount: 0 };
  const normalizedTarget = targetVersion.toLowerCase().replace(/\s+/g, " ").trim();
  const versionCandidates = normalizedTarget.split(/\s+vs\.?\s+/i).map((value) => value.replace(/\+/g, "").trim()).filter(Boolean);
  let datedSources = 0;
  let versionMatches = 0;
  const scores = evidence.map((item) => {
    const haystack = [item.url, item.title, item.snippet].join(" ").toLowerCase();
    const versionMatch = versionCandidates.length > 0 && versionCandidates.some((candidate) => haystack.includes(candidate));
    if (versionMatch) versionMatches += 1;

    let temporal = 50;
    if (item.publishedAt) {
      const published = new Date(item.publishedAt);
      if (!Number.isNaN(published.getTime())) {
        datedSources += 1;
        const ageDays = (now.getTime() - published.getTime()) / 86_400_000;
        temporal = ageDays < 0 ? 0 : ageDays <= 365 ? 100 : ageDays <= 730 ? 85 : ageDays <= 1460 ? 65 : 40;
      }
    }
    // Version signal is weighted more heavily than recency: a recent wrong-version page is not fresh.
    return versionMatch ? temporal : temporal * 0.6;
  });
  return {
    score: Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2)),
    datedSources,
    versionMatches,
    sourceCount: evidence.length,
  };
}
