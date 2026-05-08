import { cn } from "@/lib/utils";
import { THRESHOLDS } from "@/lib/scoring/thresholds";

interface ChartAsset {
  name: string;
  composite: number;
}

export function CompositeChart({ assets }: { assets: ChartAsset[] }) {
  const maxScore = 10;
  const sorted = [...assets].sort((a, b) => b.composite - a.composite);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Pipeline Composite Scores
      </h3>
      <div className="space-y-2">
        {sorted.map((asset) => {
          const pct = (asset.composite / maxScore) * 100;
          const color =
            asset.composite >= THRESHOLDS.GO
              ? "bg-emerald-500"
              : asset.composite >= THRESHOLDS.CONDITIONAL
                ? "bg-amber-500"
                : "bg-red-500";

          return (
            <div key={asset.name} className="flex items-center gap-3">
              <span className="text-sm w-40 truncate text-right">
                {asset.name}
              </span>
              <div className="flex-1 relative h-7 bg-muted rounded overflow-hidden">
                {/* Threshold lines */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-amber-400 z-10"
                  style={{ left: `${(THRESHOLDS.CONDITIONAL / maxScore) * 100}%` }}
                  title={`Conditional: ${THRESHOLDS.CONDITIONAL}`}
                />
                <div
                  className="absolute top-0 bottom-0 w-px bg-emerald-400 z-10"
                  style={{ left: `${(THRESHOLDS.GO / maxScore) * 100}%` }}
                  title={`GO: ${THRESHOLDS.GO}`}
                />
                {/* Bar */}
                <div
                  className={cn(
                    "h-full rounded transition-all flex items-center justify-end pr-2",
                    color
                  )}
                  style={{ width: `${pct}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {asset.composite.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Conditional (
          {THRESHOLDS.CONDITIONAL})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> GO (
          {THRESHOLDS.GO})
        </span>
      </div>
    </div>
  );
}
