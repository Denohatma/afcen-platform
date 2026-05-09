import { z } from "zod";

// ─── Document context for uploaded files ───

export interface DocumentContext {
  filename: string;
  documentType: string;
  extractedText: string;
}

// ─── Core agent types ───

export interface AgentOutput<T = unknown> {
  agentName: string;
  tier: 1 | 2 | 3;
  data: T;
  confidence: number;
  provenance: string[];
  dataGaps: string[];
  runTimeMs: number;
}

export interface PipelineStatus {
  studyId: string;
  assetId: string;
  status: "running" | "completed" | "failed";
  currentAgent: string | null;
  completedAgents: string[];
  totalAgents: number;
  error?: string;
}

// ─── Site research schema ───

export const SiteResearchSchema = z.object({
  name: z.string(),
  country: z.string(),
  sector: z.string(),
  capacityMW: z.number().nullable(),
  ownershipType: z.string(),
  subCategory: z.string(),
  status: z.string(),
  commissionedYear: z.number().nullable(),
  originalCostUsd: z.number().nullable(),
  description: z.string(),
  strategicContext: z.string(),
  operator: z.string().nullable(),
  developer: z.string().nullable(),
  waterBody: z.string().nullable(),
  region: z.string().nullable(),
});

export type SiteResearch = z.infer<typeof SiteResearchSchema>;

// ─── Tier 1 output schemas ───

export const HydrologyOutputSchema = z.object({
  catchment_area_km2: z.number().nullable(),
  mean_annual_flow_m3s: z.number().nullable(),
  dry_season_firm_flow: z.number().nullable(),
  wet_season_peak_flow: z.number().nullable(),
  flow_record_years: z.number().nullable(),
  flow_record_quality: z.string(),
  monthly_flow_distribution: z.string().nullable(),
  climate_change_2050_projection: z.string().nullable(),
  sediment_yield: z.string().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const TopographyCivilOutputSchema = z.object({
  gross_head_m: z.number().nullable(),
  available_head_m: z.number().nullable(),
  dam_type: z.string().nullable(),
  dam_height_m: z.number().nullable(),
  dam_condition: z.string(),
  spillway_type: z.string().nullable(),
  spillway_condition: z.string(),
  penstock_length_m: z.number().nullable(),
  penstock_diameter_mm: z.number().nullable(),
  penstock_condition: z.string(),
  powerhouse_condition: z.string(),
  tailrace_condition: z.string(),
  civil_remaining_useful_life_years: z.number().nullable(),
  modernisation_scope: z.string(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const ElectromechanicalOutputSchema = z.object({
  turbines: z.array(z.object({
    unit_number: z.number(),
    type: z.string(),
    manufacturer: z.string().nullable(),
    capacity_mw: z.number().nullable(),
    status: z.string(),
    condition: z.string(),
    remaining_useful_life_years: z.number().nullable(),
  })),
  generators: z.string(),
  transformers: z.string(),
  switchgear: z.string(),
  control_system: z.string(),
  modernisation_priorities: z.array(z.string()),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const TransmissionGridOutputSchema = z.object({
  evacuation_voltage_kv: z.number().nullable(),
  evacuation_capacity_mw: z.number().nullable(),
  transmission_distance_km: z.number().nullable(),
  constraint_severity: z.string(),
  grid_connection_status: z.string(),
  regional_pool_access: z.string().nullable(),
  distribution_constraint: z.string().nullable(),
  transmission_upgrade_required: z.string().nullable(),
  transmission_upgrade_cost_usd: z.number().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const EnergyYieldOutputSchema = z.object({
  p50_annual_gwh: z.number().nullable(),
  p90_annual_gwh: z.number().nullable(),
  firm_energy_gwh: z.number().nullable(),
  capacity_factor_pct: z.number().nullable(),
  uprate_potential_mw: z.number().nullable(),
  uprate_conditional_on: z.string().nullable(),
  climate_resilience_2050: z.string().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const DemandMarketOutputSchema = z.object({
  national_peak_demand_mw: z.number().nullable(),
  demand_growth_rate_pct: z.number().nullable(),
  electrification_rate_pct: z.number().nullable(),
  rural_electrification_pct: z.number().nullable(),
  supply_mix: z.string(),
  demand_supply_gap: z.string(),
  end_user_tariff_usd_kwh: z.number().nullable(),
  tariff_affordability: z.string().nullable(),
  regional_power_pool: z.string().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const CommercialOutputSchema = z.object({
  ppa_exists: z.boolean(),
  ppa_counterparty: z.string().nullable(),
  ppa_term_years: z.number().nullable(),
  ppa_tariff_usd_kwh: z.number().nullable(),
  ppa_currency: z.string().nullable(),
  ppa_indexation: z.string().nullable(),
  offtaker_credit_rating: z.string().nullable(),
  offtaker_payment_performance: z.string(),
  sovereign_guarantee: z.boolean().nullable(),
  revenue_maturity_assessment: z.string(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const RegulatoryOutputSchema = z.object({
  regulator: z.string().nullable(),
  regulator_independence: z.string(),
  national_electricity_act: z.string().nullable(),
  ppp_framework: z.string().nullable(),
  concession_precedent: z.string(),
  water_rights_status: z.string(),
  environmental_permits_status: z.string(),
  change_of_control_consents: z.string(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const ESGOutputSchema = z.object({
  esia_status: z.string(),
  esia_age_years: z.number().nullable(),
  ifc_ps_compliance: z.string(),
  resettlement_status: z.string(),
  community_engagement_rating: z.string(),
  climate_resilience: z.string(),
  flood_drought_risk: z.string(),
  biodiversity_concerns: z.string().nullable(),
  carbon_baseline_tco2e_yr: z.number().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const CarbonOutputSchema = z.object({
  eligibility_vcs: z.boolean(),
  eligibility_gold_standard: z.boolean(),
  eligibility_article_6_4: z.boolean(),
  grid_emission_factor_tco2_mwh: z.number().nullable(),
  annual_emissions_displaced_tco2: z.number().nullable(),
  carbon_price_low_usd: z.number().nullable(),
  carbon_price_high_usd: z.number().nullable(),
  annual_carbon_revenue_low_usd: z.number().nullable(),
  annual_carbon_revenue_high_usd: z.number().nullable(),
  irr_uplift_bps: z.number().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const ComparablesOutputSchema = z.object({
  nearest_comparables: z.array(z.object({
    name: z.string(),
    country: z.string(),
    capacity_mw: z.number().nullable(),
    developer: z.string().nullable(),
    similarity_score: z.number(),
    structural_lessons: z.string(),
  })),
  per_mw_benchmark_low_usd: z.number().nullable(),
  per_mw_benchmark_high_usd: z.number().nullable(),
  valuation_low_usd_m: z.number().nullable(),
  valuation_high_usd_m: z.number().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const MacroCountryOutputSchema = z.object({
  sovereign_rating: z.string().nullable(),
  sovereign_outlook: z.string().nullable(),
  currency: z.string(),
  currency_depreciation_10yr_pct: z.number().nullable(),
  fx_convertibility: z.string(),
  recommended_ppa_currency: z.string(),
  political_stability: z.string(),
  expropriation_risk: z.string(),
  election_cycle_note: z.string().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const FinancialOutputSchema = z.object({
  audited_financials_available: z.boolean(),
  revenue_history: z.string().nullable(),
  ebitda_history: z.string().nullable(),
  outstanding_debt: z.array(z.object({
    lender: z.string(),
    amount_usd: z.number().nullable(),
    status: z.string(),
  })),
  capex_estimate_low_usd_m: z.number().nullable(),
  capex_estimate_central_usd_m: z.number().nullable(),
  capex_estimate_high_usd_m: z.number().nullable(),
  capex_source: z.string().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

export const ModernisationOutputSchema = z.object({
  scope_summary: z.string(),
  components: z.array(z.object({
    action: z.string(),
    capex_usd_m: z.number().nullable(),
    timeline: z.string().nullable(),
    criticality: z.string(),
  })),
  total_capex_low_usd_m: z.number().nullable(),
  total_capex_central_usd_m: z.number().nullable(),
  total_capex_high_usd_m: z.number().nullable(),
  uprate_potential: z.string().nullable(),
  confidence_overall: z.number(),
  data_gaps: z.array(z.string()),
});

// ─── Tier 2 output schemas ───

export const ScoringOutputSchema = z.object({
  dimensions: z.array(z.object({
    dimension: z.string(),
    score: z.number(),
    rationale: z.string(),
    confidence: z.number(),
  })),
  composite: z.number(),
  signal: z.string(),
  path_to_go: z.array(z.object({
    action: z.string(),
    affects_dimension: z.string(),
    score_uplift: z.number(),
    estimated_cost: z.string().nullable(),
    estimated_time: z.string().nullable(),
  })),
});

export const CapitalStackOutputSchema = z.object({
  total_project_cost_usd_m: z.number().nullable(),
  equity_share_pct: z.number().nullable(),
  debt_share_pct: z.number().nullable(),
  recommended_lenders: z.array(z.object({
    name: z.string(),
    type: z.string(),
    role: z.string(),
    indicative_amount_usd_m: z.number().nullable(),
  })),
  anchor_investor_role: z.string(),
  blended_finance_opportunity: z.string().nullable(),
  confidence_overall: z.number(),
});

export const BusinessModelOutputSchema = z.object({
  recommended_model: z.string(),
  rationale: z.string(),
  alternatives_considered: z.array(z.object({
    model: z.string(),
    pros: z.string(),
    cons: z.string(),
    viable: z.boolean(),
  })),
  confidence_overall: z.number(),
});

export const ReturnsOutputSchema = z.object({
  equity_irr_base_pct: z.number().nullable(),
  equity_irr_upside_pct: z.number().nullable(),
  equity_irr_downside_pct: z.number().nullable(),
  project_irr_pct: z.number().nullable(),
  payback_period_years: z.number().nullable(),
  dscr_minimum: z.number().nullable(),
  carbon_irr_uplift_bps: z.number().nullable(),
  key_assumptions: z.array(z.string()),
  confidence_overall: z.number(),
});

export const RiskRegisterOutputSchema = z.object({
  risks: z.array(z.object({
    category: z.string(),
    risk: z.string(),
    severity: z.string(),
    likelihood: z.string(),
    mitigant: z.string(),
    residual_rating: z.string(),
  })),
  top_risk: z.string(),
  conditions_precedent: z.array(z.string()),
});

export const QuestionsOutputSchema = z.object({
  questions: z.array(z.object({
    workstream: z.string(),
    question: z.string(),
    source_agent: z.string(),
    expected_source: z.string(),
    priority: z.string(),
  })),
});

// ─── Aggregated pipeline result ───

export interface Tier1Outputs {
  hydrology: AgentOutput;
  topography_civil: AgentOutput;
  electromechanical: AgentOutput;
  transmission_grid: AgentOutput;
  energy_yield: AgentOutput;
  demand_market: AgentOutput;
  commercial: AgentOutput;
  regulatory: AgentOutput;
  esg: AgentOutput;
  carbon: AgentOutput;
  comparables: AgentOutput;
  macro_country: AgentOutput;
  financial: AgentOutput;
  modernisation: AgentOutput;
}

export interface Tier2Outputs {
  scoring: AgentOutput;
  capital_stack: AgentOutput;
  business_model: AgentOutput;
  returns: AgentOutput;
  risk_register: AgentOutput;
  strategic_rationale: AgentOutput;
  policy_brief: AgentOutput;
  questions: AgentOutput;
  executive_summary: AgentOutput;
}

export interface PipelineResult {
  tier1: Tier1Outputs;
  tier2: Tier2Outputs;
  validation: { passed: boolean; warnings: string[]; errors: string[] };
  provenance: { total_sources: number; agents_run: number; total_time_ms: number };
  document: string;
}
