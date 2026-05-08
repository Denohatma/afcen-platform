import type { ZodSchema } from "zod";
import type { LLMAdapter, LLMRequest } from "./adapter";

export class OllamaAdapter implements LLMAdapter {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_HOST || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama3.1:8b";
  }

  async complete(req: LLMRequest): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: req.systemPrompt
          ? `${req.systemPrompt}\n\n${req.prompt}`
          : req.prompt,
        stream: false,
        options: {
          num_predict: req.maxTokens ?? 4096,
          temperature: 0.3,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.response;
  }

  async extractStructured<T>(
    req: LLMRequest,
    schema: ZodSchema<T>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: req.systemPrompt
          ? `${req.systemPrompt}\n\n${req.prompt}`
          : req.prompt,
        stream: false,
        format: "json",
        options: {
          num_predict: req.maxTokens ?? 4096,
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    const raw = data.response;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Ollama response did not contain valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return schema.parse(parsed);
  }
}
