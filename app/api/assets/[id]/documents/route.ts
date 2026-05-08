import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const documents = await prisma.document.findMany({
    where: { assetId: id },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const docType = (formData.get("documentType") as string) || "OTHER";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentHash = createHash("sha256").update(buffer).digest("hex");

  // Forward to Python sidecar for extraction
  const sidecarUrl = process.env.PYTHON_SIDECAR_URL || "http://localhost:8000";
  let extractedText: string | null = null;

  try {
    const sidecarForm = new FormData();
    sidecarForm.append("file", file);

    const extractRes = await fetch(`${sidecarUrl}/extract`, {
      method: "POST",
      body: sidecarForm,
      signal: AbortSignal.timeout(60000),
    });

    if (extractRes.ok) {
      const data = await extractRes.json();
      extractedText = data.text || null;
    }
  } catch {
    // Sidecar unavailable — save document without extraction
  }

  // Provenance: log filename + hash, never content
  console.log(
    `[AfCEN PROVENANCE] Document uploaded: ${file.name}, hash: ${contentHash}, asset: ${id}`
  );

  const document = await prisma.document.create({
    data: {
      assetId: id,
      filename: file.name,
      documentType: docType as "TECHNICAL_REPORT" | "FINANCIAL_REPORT" | "REGULATORY_FILING" | "PPA" | "CONCESSION_AGREEMENT" | "IC_TEMPLATE" | "OTHER",
      contentHash,
      extractedText,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
