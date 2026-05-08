import { Badge } from "@/components/ui/badge";
import { DIMENSION_LABELS } from "@/lib/scoring/labels";
import type { Dimension } from "@prisma/client";

interface PathAction {
  id: string;
  description: string;
  affectsDimension: Dimension;
  scoreUplift: number;
  estimatedCost: string | null;
  estimatedTime: string | null;
}

export function PathToGo({ actions }: { actions: PathAction[] }) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-base">Path to GO</h3>
      <ol className="space-y-3">
        {actions.map((action, i) => (
          <li key={action.id} className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="space-y-2 min-w-0">
                <p className="text-sm leading-relaxed">{action.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {DIMENSION_LABELS[action.affectsDimension]}
                  </Badge>
                  {action.scoreUplift > 0 && (
                    <Badge className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      +{action.scoreUplift} pts
                    </Badge>
                  )}
                  {action.estimatedCost && (
                    <Badge variant="outline" className="text-xs">
                      {action.estimatedCost}
                    </Badge>
                  )}
                  {action.estimatedTime && (
                    <Badge variant="outline" className="text-xs">
                      {action.estimatedTime}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
