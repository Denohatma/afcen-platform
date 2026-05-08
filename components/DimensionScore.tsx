import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIMENSION_LABELS } from "@/lib/scoring/labels";
import { DEFAULT_WEIGHTS } from "@/lib/scoring/weights";
import type { Dimension } from "@prisma/client";

interface DimensionScoreProps {
  dimension: Dimension;
  score: number;
  rationale: string;
  confidence: number;
  scoredBy: string;
}

export function DimensionScoreCard({
  dimension,
  score,
  rationale,
  confidence,
  scoredBy,
}: DimensionScoreProps) {
  const weight = DEFAULT_WEIGHTS[dimension];
  const barColor =
    score >= 7
      ? "bg-emerald-500"
      : score >= 4
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">
            {DIMENSION_LABELS[dimension]}
          </h4>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {(weight * 100).toFixed(0)}%
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {confidence < 0.6 && (
            <span
              className="text-amber-600 text-xs font-medium"
              title="Low confidence — under-evidenced"
            >
              Low confidence
            </span>
          )}
          <span
            className={cn(
              "text-2xl font-bold tabular-nums",
              score >= 7
                ? "text-emerald-700"
                : score >= 4
                  ? "text-amber-700"
                  : "text-red-700"
            )}
          >
            {score}
          </span>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${score * 10}%` }}
        />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {rationale}
      </p>

      <div className="text-xs text-muted-foreground">
        Scored by: {scoredBy}
      </div>
    </div>
  );
}
