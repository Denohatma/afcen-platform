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
      ? "text-afcen-green-700 bg-afcen-green-50 border-afcen-green-200"
      : score >= 5.5
        ? "text-afcen-orange-700 bg-afcen-orange-50 border-afcen-orange-200"
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
