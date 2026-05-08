"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CompositeBadge } from "./CompositeBadge";
import { SignalBadge } from "./SignalBadge";
import { SECTOR_LABELS } from "@/lib/scoring/labels";
import type { Signal } from "@/lib/scoring/thresholds";
import type { Sector } from "@prisma/client";

interface Comparable {
  id: string;
  name: string;
  country: string;
  sector: Sector;
  composite: number;
  signal: Signal;
  sameSector: boolean;
}

export function ComparablesPanel({ assetId }: { assetId: string }) {
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/comparables/${assetId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setComparables)
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading) {
    return (
      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground animate-pulse">
        Loading comparables...
      </div>
    );
  }

  if (comparables.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No comparable assets found. Add more assets to enable comparison.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {comparables.map((c) => (
        <Link
          key={c.id}
          href={`/assets/${c.id}`}
          className="rounded-lg border p-4 space-y-2 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium truncate">{c.name}</h4>
            <CompositeBadge score={c.composite} />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {c.country}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {SECTOR_LABELS[c.sector]}
            </Badge>
            <SignalBadge signal={c.signal} />
          </div>
          {c.sameSector && (
            <p className="text-xs text-afcen-green-600">Same sector</p>
          )}
        </Link>
      ))}
    </div>
  );
}
