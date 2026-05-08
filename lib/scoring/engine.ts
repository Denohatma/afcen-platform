import { Dimension } from "@prisma/client";
import { DEFAULT_WEIGHTS } from "./weights";

export function computeComposite(
  scores: { dimension: Dimension; score: number }[]
): number {
  let total = 0;
  let weightSum = 0;
  for (const s of scores) {
    const w = DEFAULT_WEIGHTS[s.dimension];
    total += s.score * w;
    weightSum += w;
  }
  return weightSum > 0 ? total / weightSum : 0;
}
