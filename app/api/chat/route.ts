import { NextResponse } from "next/server";
import { z } from "zod";
import { getLLMAdapter } from "@/lib/llm/adapter";

const RequestSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).default([]),
});

const ResponseSchema = z.object({
  reply: z.string(),
  action: z.enum(["none", "research_site", "view_pipeline", "view_asset"]).nullable(),
  siteName: z.string().nullable(),
  assetId: z.string().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history } = RequestSchema.parse(body);

    const adapter = getLLMAdapter();

    const conversationContext = history
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const result = await adapter.extractStructured(
      {
        systemPrompt: `You are the AfCEN assistant — a conversational interface for Africa50's Asset Recycling platform. You help users evaluate African infrastructure assets for investment.

Your capabilities:
1. **Research a site** — look up an infrastructure asset (hydropower, solar, thermal, transport, etc.) and run a 23-agent pre-feasibility study
2. **View the pipeline** — show the user's asset pipeline dashboard
3. **General questions** — answer questions about asset recycling, infrastructure finance, AfCEN methodology

When the user mentions a specific infrastructure asset they want to evaluate, set action to "research_site" and extract the site name.
When the user wants to see their assets or pipeline, set action to "view_pipeline".
Otherwise set action to "none" and just reply conversationally.

Keep replies concise (2-4 sentences). Be professional but approachable. If the user's intent is unclear, ask a clarifying question.`,
        prompt: `${conversationContext ? `CONVERSATION SO FAR:\n${conversationContext}\n\n` : ""}User: ${message}

Return JSON:
{
  "reply": "your response to the user",
  "action": "none|research_site|view_pipeline|view_asset",
  "siteName": "extracted site name or null",
  "assetId": "asset id or null"
}`,
        dataClassification: "public",
        maxTokens: 1000,
      },
      ResponseSchema
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("[AfCEN] Chat failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}
