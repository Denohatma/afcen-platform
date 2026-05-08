import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeComposite } from "@/lib/scoring/engine";
import { signal } from "@/lib/scoring/thresholds";
import { z } from "zod";

const CreateAssetSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  sector: z.enum([
    "POWER_HYDRO",
    "POWER_SOLAR",
    "POWER_THERMAL",
    "POWER_TRANSMISSION",
    "TRANSPORT_ROAD",
    "TRANSPORT_RAIL",
    "TRANSPORT_BRIDGE",
    "TRANSPORT_PORT",
    "MIDSTREAM_GAS",
    "ICT_DATACENTER",
  ]),
  ownershipType: z.enum([
    "STATE_FULL",
    "STATE_MAJORITY",
    "IPP_PRIVATE",
    "IPP_MIXED",
    "CONCESSIONED",
  ]),
  subCategory: z.enum([
    "STRANDED_BROWNFIELD",
    "UNDERPERFORMING_BROWNFIELD",
    "OPERATIONAL_IPP_REFINANCING",
    "OPERATIONAL_PUBLIC_FOR_CONCESSION",
    "GREENFIELD_IPT",
  ]),
  status: z.enum([
    "OPERATIONAL",
    "OPERATIONAL_BELOW_CAPACITY",
    "MOTHBALLED",
    "UNDER_REFURB",
  ]),
  capacityMW: z.number().positive().optional(),
  capacityValue: z.number().positive().optional(),
  capacityUnit: z.string().optional(),
  commissionedYear: z.number().int().min(1900).max(2030).optional(),
  originalCostUsd: z.number().positive().optional(),
  description: z.string().min(1),
  strategicContext: z.string().optional(),
});

export async function GET() {
  const assets = await prisma.asset.findMany({
    include: { scores: true },
    orderBy: { createdAt: "asc" },
  });

  const result = assets.map((asset) => {
    const composite = computeComposite(asset.scores);
    return {
      id: asset.id,
      name: asset.name,
      country: asset.country,
      sector: asset.sector,
      subCategory: asset.subCategory,
      status: asset.status,
      capacityMW: asset.capacityMW,
      capacityValue: asset.capacityValue,
      capacityUnit: asset.capacityUnit,
      ownershipType: asset.ownershipType,
      composite: Math.round(composite * 100) / 100,
      signal: signal(composite),
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const asset = await prisma.asset.create({
    data: {
      name: data.name,
      country: data.country,
      sector: data.sector,
      ownershipType: data.ownershipType,
      subCategory: data.subCategory,
      status: data.status,
      capacityMW: data.capacityMW ?? null,
      capacityValue: data.capacityValue ?? null,
      capacityUnit: data.capacityUnit ?? null,
      commissionedYear: data.commissionedYear ?? null,
      originalCostUsd: data.originalCostUsd ?? null,
      description: data.description,
      strategicContext: data.strategicContext ?? null,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
