import { createHash } from "node:crypto";
import { tavily } from "@tavily/core";

export async function retrieveEvidence(query: string) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not configured");

  const client = tavily({ apiKey });
  const search = await client.search(query, {
    searchDepth: "advanced",
    maxResults: 5,
    includeAnswer: false,
    includePublishedDate: true,
  });

  const extractedByUrl = new Map<string, string>();
  const urlsToExtract = search.results.slice(0, 3).map((item) => item.url);

  if (urlsToExtract.length > 0) {
    try {
      const extracted = await client.extract(urlsToExtract, {
        extractDepth: "advanced",
        format: "markdown",
      });
      for (const item of extracted.results) {
        if (item.rawContent) extractedByUrl.set(item.url, item.rawContent);
      }
    } catch {
      // Keep the ranked Search snippets as a bounded fallback if Extract fails.
    }
  }

  return search.results.map((item) => {
    const content = (
      extractedByUrl.get(item.url) ??
      item.content ??
      ""
    ).slice(0, 7_000);

    return {
      url: item.url,
      title: item.title ?? "",
      snippet: content,
      score: item.score ?? 0,
      publishedAt: item.publishedDate ?? undefined,
      contentHash: createHash("sha256").update(content).digest("hex"),
    };
  });
}
