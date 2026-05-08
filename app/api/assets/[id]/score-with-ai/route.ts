import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLLMAdapter } from "@/lib/llm/adapter";
import { scoreDimensionPrompt } from "@/lib/llm/prompts";
import type { Dimension } from "@/lib/generated/prisma/client";
import { z } from "zod";

const VALID_DIMENSIONS: Dimension[] = [
  "REVENUE_MATURITY",
  "DEBT_COMPLEXITY",
  "CONCESSION_READINESS",
  "DATA_AVAILABILITY",
  "REGULATORY_ENVIRONMENT",
  "MODERNISATION_RISK",
];

const RequestSchema = z.object({
  dimension: z.enum(VALID_DIMENSIONS as [Dimension, ...Dimension[]]),
});

const AIScoreSchema = z.object({
  score: z.number().int().min(1).max(10),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  evidenceCitations: z.array(z.string()),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { documents: true },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid dimension", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { dimension } = parsed.data;

  const documentExcerpts = asset.documents
    .filter((d) => d.extractedText)
    .map((d) => d.extractedText!.slice(0, 10000));

  const prompt = scoreDimensionPrompt(asset, dimension, documentExcerpts);

  try {
    const adapter = getLLMAdapter();
    const result = await adapter.extractStructured(prompt, AIScoreSchema);

    return NextResponse.json({
      dimension,
      suggestion: result,
    });
  } catch (err) {
    console.error(`[AfCEN] AI scoring failed for ${dimension}:`, err);
    return NextResponse.json(
      { error: "AI scoring failed. Check LLM configuration." },
      { status: 502 }
    );
  }
}
