import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeComposite } from "@/lib/scoring/engine";
import { signal } from "@/lib/scoring/thresholds";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      scores: true,
      pathActions: true,
      documents: true,
      briefs: { orderBy: { version: "desc" } },
    },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const composite = computeComposite(asset.scores);

  return NextResponse.json({
    ...asset,
    composite: Math.round(composite * 100) / 100,
    signal: signal(composite),
  });
}
