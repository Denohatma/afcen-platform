import { NextResponse } from "next/server";
import { generateICBrief } from "@/lib/brief/generator";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  try {
    const briefId = await generateICBrief(id);
    return NextResponse.json({ briefId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Brief generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const briefs = await prisma.iCBrief.findMany({
    where: { assetId: id },
    orderBy: { version: "desc" },
  });

  return NextResponse.json(briefs);
}
