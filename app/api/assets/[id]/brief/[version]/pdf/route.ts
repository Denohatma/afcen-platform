import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ReactPDF from "@react-pdf/renderer";
import { ICBriefPDF } from "@/components/ICBriefPDF";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id, version: versionStr } = await params;
  const version = parseInt(versionStr);

  if (isNaN(version)) {
    return NextResponse.json(
      { error: "Invalid version number" },
      { status: 400 }
    );
  }

  const brief = await prisma.iCBrief.findFirst({
    where: { assetId: id, version },
    include: { asset: true },
  });

  if (!brief) {
    return NextResponse.json({ error: "Brief not found" }, { status: 404 });
  }

  const pdfBuffer = await ReactPDF.renderToBuffer(
    ICBriefPDF({
      assetName: brief.asset.name,
      content: brief.content,
      version: brief.version,
      generatedAt: brief.generatedAt.toISOString(),
    })
  );
  const uint8 = new Uint8Array(pdfBuffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${brief.asset.name.replace(/[^a-zA-Z0-9]/g, "_")}_IC_Brief_v${version}.pdf"`,
    },
  });
}
