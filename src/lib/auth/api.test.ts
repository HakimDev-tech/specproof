import { afterEach, describe, expect, it } from "vitest";
import { requireApiToken } from "./api";

afterEach(() => {
  delete process.env.SPECPROOF_API_TOKEN;
});

describe("API bearer authentication", () => {
  it("fails closed when no token is configured", () => {
    const result = requireApiToken(new Request("https://example.test/api/runs"));
    expect(result?.status).toBe(503);
  });

  it("rejects requests without a bearer token", () => {
    process.env.SPECPROOF_API_TOKEN = "a".repeat(64);
    const result = requireApiToken(new Request("https://example.test/api/runs"));
    expect(result?.status).toBe(401);
  });

  it("accepts the configured bearer token", () => {
    const token = "b".repeat(64);
    process.env.SPECPROOF_API_TOKEN = token;
    const result = requireApiToken(
      new Request("https://example.test/api/runs", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(result).toBeNull();
  });

  it("rejects an invalid bearer token", () => {
    process.env.SPECPROOF_API_TOKEN = "c".repeat(64);
    const result = requireApiToken(
      new Request("https://example.test/api/runs", {
        headers: { authorization: `Bearer ${"d".repeat(64)}` },
      }),
    );
    expect(result?.status).toBe(401);
  });
});
