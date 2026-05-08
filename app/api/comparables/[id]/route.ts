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
    include: { scores: true },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const thisComposite = computeComposite(asset.scores);

  const others = await prisma.asset.findMany({
    where: { id: { not: id } },
    include: { scores: true },
  });

  const withComposite = others
    .map((a) => {
      const comp = computeComposite(a.scores);
      return {
        id: a.id,
        name: a.name,
        country: a.country,
        sector: a.sector,
        composite: Math.round(comp * 100) / 100,
        signal: signal(comp),
        sameSector: a.sector === asset.sector,
        distance: Math.abs(comp - thisComposite),
      };
    })
    .sort((a, b) => {
      if (a.sameSector !== b.sameSector) return a.sameSector ? -1 : 1;
      return a.distance - b.distance;
    })
    .slice(0, 5);

  return NextResponse.json(withComposite);
}
