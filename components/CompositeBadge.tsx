import { cn } from "@/lib/utils";

export function CompositeBadge({
  score,
  size = "default",
}: {
  score: number;
  size?: "default" | "large";
}) {
  const color =
    score >= 7.0
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : score >= 5.5
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg border font-bold tabular-nums",
        color,
        size === "large" ? "px-4 py-2 text-3xl" : "px-2.5 py-1 text-lg"
      )}
    >
      {score.toFixed(2)}
    </div>
  );
}
