import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scorecard } from "@/components/Scorecard";
import { PathToGo } from "@/components/PathToGo";
import { ComparablesPanel } from "@/components/ComparablesPanel";
import { DocumentsSection } from "@/components/DocumentsSection";
import {
  SECTOR_LABELS,
  OWNERSHIP_LABELS,
  SUBCATEGORY_LABELS,
  STATUS_LABELS,
  COUNTRY_FLAGS,
} from "@/lib/scoring/labels";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  if (!asset) notFound();

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to Pipeline
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">
          {COUNTRY_FLAGS[asset.country] ?? ""} {asset.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{asset.country}</Badge>
          <Badge variant="secondary">{SECTOR_LABELS[asset.sector]}</Badge>
          {asset.capacityValue && asset.capacityUnit && (
            <Badge variant="outline">
              {asset.capacityValue} {asset.capacityUnit}
            </Badge>
          )}
          <Badge variant="outline">
            {OWNERSHIP_LABELS[asset.ownershipType]}
          </Badge>
          <Badge variant="outline">{STATUS_LABELS[asset.status]}</Badge>
          <Badge>{SUBCATEGORY_LABELS[asset.subCategory]}</Badge>
        </div>

        {asset.description && (
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {asset.description}
          </p>
        )}
        {asset.strategicContext && (
          <div className="rounded-lg bg-afcen-blue-50 border border-afcen-blue-200 p-4 max-w-3xl">
            <p className="text-xs font-medium text-afcen-blue-800 mb-1">
              Strategic Context
            </p>
            <p className="text-sm text-afcen-blue-700 leading-relaxed">
              {asset.strategicContext}
            </p>
          </div>
        )}
      </div>

      {/* Scorecard */}
      <section>
        <h2 className="text-lg font-semibold mb-4">AfCEN Scorecard</h2>
        <Scorecard scores={asset.scores} assetId={asset.id} />
      </section>

      {/* Path to GO */}
      <section>
        <PathToGo actions={asset.pathActions} />
      </section>

      {/* Comparables */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Comparables</h2>
        <ComparablesPanel assetId={asset.id} />
      </section>

      {/* Documents */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Documents</h2>
        <DocumentsSection
          assetId={asset.id}
          initialDocs={asset.documents.map((d) => ({
            id: d.id,
            filename: d.filename,
            documentType: d.documentType,
            extractedText: d.extractedText,
            uploadedAt: d.uploadedAt.toISOString(),
          }))}
        />
      </section>

      {/* Actions */}
      <section className="flex gap-3 pt-4 border-t">
        <Link href={`/assets/${asset.id}/brief`}>
          <Button>Generate IC Brief</Button>
        </Link>
        <Button variant="outline" disabled>
          Compare with...
        </Button>
        <Button variant="outline" disabled>
          Re-score with AI
        </Button>
      </section>
    </div>
  );
}
