import { cn } from "@/lib/utils";
import type { Signal } from "@/lib/scoring/thresholds";

const SIGNAL_STYLES: Record<Signal, string> = {
  GO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  CONDITIONAL: "bg-amber-100 text-amber-800 border-amber-300",
  NO_GO: "bg-red-100 text-red-800 border-red-300",
};

const SIGNAL_LABELS: Record<Signal, string> = {
  GO: "GO",
  CONDITIONAL: "CONDITIONAL",
  NO_GO: "NO-GO",
};

export function SignalBadge({
  signal,
  size = "default",
}: {
  signal: Signal;
  size?: "default" | "large";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-semibold uppercase tracking-wide",
        SIGNAL_STYLES[signal],
        size === "large" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      )}
    >
      {SIGNAL_LABELS[signal]}
    </span>
  );
}
