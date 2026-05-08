import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompositeBadge } from "./CompositeBadge";
import { SignalBadge } from "./SignalBadge";
import { signal } from "@/lib/scoring/thresholds";
import {
  SECTOR_LABELS,
  SUBCATEGORY_LABELS,
  COUNTRY_FLAGS,
} from "@/lib/scoring/labels";
import type { Sector, SubCategory } from "@prisma/client";

interface AssetCardProps {
  id: string;
  name: string;
  country: string;
  sector: Sector;
  subCategory: SubCategory;
  capacityValue: number | null;
  capacityUnit: string | null;
  composite: number;
}

export function AssetCard({
  id,
  name,
  country,
  sector,
  subCategory,
  capacityValue,
  capacityUnit,
  composite,
}: AssetCardProps) {
  const sig = signal(composite);
  const flag = COUNTRY_FLAGS[country] ?? "";

  return (
    <Link href={`/assets/${id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {flag} {country}
              </p>
            </div>
            <CompositeBadge score={composite} />
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {SECTOR_LABELS[sector]}
            </Badge>
            {capacityValue && capacityUnit && (
              <Badge variant="outline" className="text-xs">
                {capacityValue} {capacityUnit}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {SUBCATEGORY_LABELS[subCategory]}
            </span>
            <SignalBadge signal={sig} />
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            View scorecard &rarr;
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
