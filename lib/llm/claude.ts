import Anthropic from "@anthropic-ai/sdk";
import type { ZodSchema } from "zod";
import type { LLMAdapter, LLMRequest } from "./adapter";

export class ClaudeAdapter implements LLMAdapter {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(req: LLMRequest): Promise<string> {
    if (req.dataClassification === "sensitive") {
      console.warn(
        "[AfCEN SOVEREIGNTY] Sensitive data sent to external API (Claude) — dev mode only"
      );
    }

    const message = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: req.maxTokens ?? 4096,
      system: req.systemPrompt ?? "",
      messages: [{ role: "user", content: req.prompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error(`Unexpected response type: ${block.type}`);
    }
    return block.text;
  }

  async extractStructured<T>(
    req: LLMRequest,
    schema: ZodSchema<T>
  ): Promise<T> {
    const raw = await this.complete(req);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("LLM response did not contain valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return schema.parse(parsed);
  }
}
