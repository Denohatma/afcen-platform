"use client";

import { useState } from "react";
import { InteractiveDimensionScore } from "./InteractiveDimensionScore";
import { CompositeBadge } from "./CompositeBadge";
import { SignalBadge } from "./SignalBadge";
import { computeComposite } from "@/lib/scoring/engine";
import { signal } from "@/lib/scoring/thresholds";
import type { Dimension } from "@prisma/client";

export interface ScoreData {
  dimension: Dimension;
  score: number;
  rationale: string;
  confidence: number;
  scoredBy: string;
}

const DIMENSION_ORDER: Dimension[] = [
  "REVENUE_MATURITY",
  "DEBT_COMPLEXITY",
  "CONCESSION_READINESS",
  "DATA_AVAILABILITY",
  "REGULATORY_ENVIRONMENT",
  "MODERNISATION_RISK",
];

export function Scorecard({
  scores: initialScores,
  assetId,
}: {
  scores: ScoreData[];
  assetId: string;
}) {
  const [scores, setScores] = useState<ScoreData[]>(initialScores);

  const composite = computeComposite(scores);
  const sig = signal(composite);

  const ordered = DIMENSION_ORDER.map(
    (d) => scores.find((s) => s.dimension === d)!
  ).filter(Boolean);

  function handleScoreUpdate(dimension: Dimension, updated: ScoreData) {
    setScores((prev) =>
      prev.map((s) => (s.dimension === dimension ? updated : s))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
        <CompositeBadge score={composite} size="large" />
        <div>
          <SignalBadge signal={sig} size="large" />
          <p className="text-sm text-muted-foreground mt-1">
            Composite score across 6 dimensions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ordered.map((s) => (
          <InteractiveDimensionScore
            key={s.dimension}
            assetId={assetId}
            dimension={s.dimension}
            score={s.score}
            rationale={s.rationale}
            confidence={s.confidence}
            scoredBy={s.scoredBy}
            onUpdate={(updated) => handleScoreUpdate(s.dimension, updated)}
          />
        ))}
      </div>
    </div>
  );
}
