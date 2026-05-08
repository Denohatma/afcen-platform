import { Dimension } from "@prisma/client";

export const RUBRICS: Record<
  Dimension,
  { low: string; mid: string; high: string }
> = {
  REVENUE_MATURITY: {
    low: "Asset is operational on paper but not earning a tariff, or has <2 years of cash flow history, or revenue is highly volatile.",
    mid: "Asset has 2-10 years of operating revenue with some volatility or below-rated performance. PPA exists but with structural concerns.",
    high: "Asset has >10 years of stable, predictable cash flows under a long-term PPA with creditworthy offtaker. Already refinanced or exited at least once.",
  },
  DEBT_COMPLEXITY: {
    low: "Multiple layers of concessional + commercial debt with complex intercreditor agreements. Change-of-control triggers unknown or hostile.",
    mid: "Some DFI debt with known consent mechanisms. Intercreditor structure documented but untested in practice.",
    high: "Clean capital structure — either debt-free, single-lender, or previously restructured with proven consent process.",
  },
  CONCESSION_READINESS: {
    low: "No legal framework for private operation. No precedent transactions in-country or in-sector. Government position unclear.",
    mid: "Legal framework exists but untested for this asset class. Adjacent precedents exist (different sector or neighboring country).",
    high: "Proven concession/PPP framework. Government actively seeking private participation. Precedent transactions completed successfully.",
  },
  DATA_AVAILABILITY: {
    low: "Minimal documentation. No audited financials. Sparse technical records. Significant data gaps for due diligence.",
    mid: "Partial documentation available — some technical reports, limited financial history. Key gaps remain but are addressable.",
    high: "Comprehensive data room — audited financials, technical assessments, regulatory filings, operational history. DFI-quality documentation.",
  },
  REGULATORY_ENVIRONMENT: {
    low: "No independent regulator. Tariffs politically set. High sovereign risk. No FX convertibility guarantees.",
    mid: "Independent regulator exists but with limited track record. Tariffs partially cost-reflective. Some FX risk.",
    high: "Mature regulatory framework with independent regulator. Cost-reflective tariffs. Manageable sovereign and FX risk.",
  },
  MODERNISATION_RISK: {
    low: "Asset requires fundamental rebuild — civil, electromechanical, and governance overhaul. Cost estimates unvalidated. High technical uncertainty.",
    mid: "Asset needs significant but bounded modernization. Technical scope defined. Some cost certainty from comparable projects.",
    high: "Asset in good condition. Standard maintenance cycle. Modernization needs are modest and well-understood.",
  },
};
