export async function firecrawlSearch(query: string): Promise<string> {
  const baseUrl = process.env.FIRECRAWL_BASE_URL;
  if (!baseUrl) return "";

  const url = `${baseUrl.replace(/\/v\d+\/?$/, "")}/v1/search`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `${query} infrastructure project Africa capacity operator commissioning cost`,
        limit: 4,
        scrapeOptions: { formats: ["markdown"] },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return "";
  }

  if (!res.ok) return "";

  const json = (await res.json()) as {
    data?: Array<{ url?: string; title?: string; markdown?: string; description?: string }>;
  };

  return (json.data ?? [])
    .map((r, i) =>
      `--- Source ${i + 1}: ${r.title ?? r.url ?? "unknown"} (${r.url ?? ""})\n${r.markdown ?? r.description ?? ""}`.slice(0, 20_000)
    )
    .join("\n\n");
}
