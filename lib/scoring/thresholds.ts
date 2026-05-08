export const THRESHOLDS = {
  GO: 7.0,
  CONDITIONAL: 5.5,
};

export type Signal = "GO" | "CONDITIONAL" | "NO_GO";

export function signal(composite: number): Signal {
  if (composite >= THRESHOLDS.GO) return "GO";
  if (composite >= THRESHOLDS.CONDITIONAL) return "CONDITIONAL";
  return "NO_GO";
}
