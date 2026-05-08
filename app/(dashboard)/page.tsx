export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeComposite } from "@/lib/scoring/engine";
import { AssetCard } from "@/components/AssetCard";
import { CompositeChart } from "@/components/CompositeChart";

export default async function PipelineDashboard() {
  const assets = await prisma.asset.findMany({
    include: { scores: true },
    orderBy: { createdAt: "asc" },
  });

  const assetsWithComposite = assets.map((asset) => ({
    ...asset,
    composite: computeComposite(asset.scores),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {assets.length} assets under evaluation
          </p>
        </div>
        <Link
          href="/assets/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + New Asset
        </Link>
      </div>

      <div className="rounded-lg border p-6 bg-white">
        <CompositeChart
          assets={assetsWithComposite.map((a) => ({
            name: a.name,
            composite: a.composite,
          }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {assetsWithComposite.map((asset) => (
          <AssetCard
            key={asset.id}
            id={asset.id}
            name={asset.name}
            country={asset.country}
            sector={asset.sector}
            subCategory={asset.subCategory}
            capacityValue={asset.capacityValue}
            capacityUnit={asset.capacityUnit}
            composite={asset.composite}
          />
        ))}
      </div>
    </div>
  );
}
