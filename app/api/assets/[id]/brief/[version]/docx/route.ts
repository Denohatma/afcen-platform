import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

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

  const children: Paragraph[] = [
    new Paragraph({
      text: `IC Concept-Stage Brief: ${brief.asset.name}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Version ${brief.version} | Generated ${new Date(brief.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
          italics: true,
          size: 20,
          color: "666666",
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  const lines = brief.content.split("\n");
  for (const line of lines) {
    if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          text: line.replace("## ", ""),
          heading: HeadingLevel.HEADING_2,
        })
      );
    } else if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          text: line.replace("### ", ""),
          heading: HeadingLevel.HEADING_3,
        })
      );
    } else if (line.startsWith("# ")) {
      children.push(
        new Paragraph({
          text: line.replace("# ", ""),
          heading: HeadingLevel.HEADING_1,
        })
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      children.push(
        new Paragraph({
          text: line.replace(/^[-*] /, ""),
          bullet: { level: 0 },
        })
      );
    } else if (line.match(/^\d+\. /)) {
      children.push(
        new Paragraph({
          text: line.replace(/^\d+\. /, ""),
          numbering: { reference: "default-numbering", level: 0 },
        })
      );
    } else if (line.trim()) {
      children.push(new Paragraph({ text: line }));
    } else {
      children.push(new Paragraph({ text: "" }));
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: "decimal" as const,
              text: "%1.",
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${brief.asset.name.replace(/[^a-zA-Z0-9]/g, "_")}_IC_Brief_v${version}.docx"`,
    },
  });
}
