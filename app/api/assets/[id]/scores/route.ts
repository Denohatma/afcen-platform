import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeComposite } from "@/lib/scoring/engine";
import { signal } from "@/lib/scoring/thresholds";
import type { Dimension } from "@prisma/client";
import { z } from "zod";

const VALID_DIMENSIONS: Dimension[] = [
  "REVENUE_MATURITY",
  "DEBT_COMPLEXITY",
  "CONCESSION_READINESS",
  "DATA_AVAILABILITY",
  "REGULATORY_ENVIRONMENT",
  "MODERNISATION_RISK",
];

const ScoreUpdateSchema = z.object({
  dimension: z.enum(VALID_DIMENSIONS as [Dimension, ...Dimension[]]),
  score: z.number().int().min(1).max(10),
  rationale: z.string().min(1),
  confidence: z.number().min(0).max(1),
  scoredBy: z.string().min(1),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ScoreUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid score data", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { dimension, score, rationale, confidence, scoredBy } = parsed.data;

  const updated = await prisma.dimensionScore.upsert({
    where: { assetId_dimension: { assetId: id, dimension } },
    update: { score, rationale, confidence, scoredBy, scoredAt: new Date() },
    create: {
      assetId: id,
      dimension,
      score,
      rationale,
      confidence,
      scoredBy,
    },
  });

  const allScores = await prisma.dimensionScore.findMany({
    where: { assetId: id },
  });

  const composite = computeComposite(allScores);
  const sig = signal(composite);

  return NextResponse.json({
    updated,
    composite,
    signal: sig,
    allScores,
  });
}
