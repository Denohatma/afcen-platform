import { Dimension } from "@/lib/generated/prisma/client";

export const DEFAULT_WEIGHTS: Record<Dimension, number> = {
  REVENUE_MATURITY: 0.2,
  DEBT_COMPLEXITY: 0.15,
  CONCESSION_READINESS: 0.2,
  DATA_AVAILABILITY: 0.15,
  REGULATORY_ENVIRONMENT: 0.15,
  MODERNISATION_RISK: 0.15,
};
