import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  extract: vi.fn(),
}));

vi.mock("@tavily/core", () => ({
  tavily: () => ({ search: mocks.search, extract: mocks.extract }),
}));

import { retrieveEvidence } from "./tavily";

describe("Tavily evidence retrieval", () => {
  beforeEach(() => {
    process.env.TAVILY_API_KEY = "test-key";
    mocks.search.mockReset();
    mocks.extract.mockReset();
    mocks.search.mockResolvedValue({
      results: [{
        url: "https://react.dev/reference/react/forwardRef",
        title: "forwardRef",
        content: "Search snippet",
        score: 0.91,
        publishedDate: "2026-09-01",
      }],
    });
    mocks.extract.mockResolvedValue({
      results: [{
        url: "https://react.dev/reference/react/forwardRef",
        rawContent: "Extracted official documentation",
      }],
    });
  });

  afterEach(() => {
    delete process.env.TAVILY_API_KEY;
  });

  it("prefers extracted content and preserves source metadata", async () => {
    const result = await retrieveEvidence("React 19 ref");
    expect(result).toHaveLength(1);
    expect(result[0]?.snippet).toBe("Extracted official documentation");
    expect(result[0]?.publishedAt).toBe("2026-09-01");
    expect(result[0]?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.search).toHaveBeenCalledWith("React 19 ref", expect.objectContaining({
      searchDepth: "advanced",
      maxResults: 5,
      includePublishedDate: true,
    }));
  });

  it("falls back to the bounded search snippet when extraction fails", async () => {
    mocks.extract.mockRejectedValue(new Error("extract unavailable"));
    const result = await retrieveEvidence("React 19 ref");
    expect(result[0]?.snippet).toBe("Search snippet");
  });

  it("fails closed when the API key is missing", async () => {
    delete process.env.TAVILY_API_KEY;
    await expect(retrieveEvidence("React 19 ref")).rejects.toThrow("TAVILY_API_KEY is not configured");
    expect(mocks.search).not.toHaveBeenCalled();
  });
});
