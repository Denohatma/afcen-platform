import type { ZodSchema } from "zod";
import { ClaudeAdapter } from "./claude";
import { OllamaAdapter } from "./ollama";

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  dataClassification: "public" | "sensitive";
  maxTokens?: number;
}

export interface LLMAdapter {
  complete(req: LLMRequest): Promise<string>;
  extractStructured<T>(req: LLMRequest, schema: ZodSchema<T>): Promise<T>;
}

export function getLLMAdapter(): LLMAdapter {
  const env = process.env.AFCEN_DEPLOYMENT;

  if (env === "production") {
    return new OllamaAdapter();
  }

  if (env === "sovereign-cloud") {
    throw new Error(
      "vLLM adapter not yet implemented — set AFCEN_DEPLOYMENT=dev or production"
    );
  }

  return new ClaudeAdapter();
}
