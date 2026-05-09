import { getLLMAdapter } from "@/lib/llm/adapter";
import type { AgentOutput } from "./types";
import {
  HydrologyOutputSchema,
  TopographyCivilOutputSchema,
  ElectromechanicalOutputSchema,
  TransmissionGridOutputSchema,
  EnergyYieldOutputSchema,
  DemandMarketOutputSchema,
  CommercialOutputSchema,
  RegulatoryOutputSchema,
  ESGOutputSchema,
  CarbonOutputSchema,
  ComparablesOutputSchema,
  MacroCountryOutputSchema,
  FinancialOutputSchema,
  ModernisationOutputSchema,
} from "./types";
import type { ZodSchema } from "zod";

interface AssetProfile {
  name: string;
  country: string;
  sector: string;
  capacityMW: number | null;
  commissionedYear: number | null;
  originalCostUsd: number | null;
  status: string;
  ownershipType: string;
  subCategory: string;
  description: string;
  strategicContext: string | null;
  operator?: string | null;
  developer?: string | null;
  waterBody?: string | null;
  region?: string | null;
}

const SYSTEM_BASE = `You are a domain-specialist agent in the AfCEN Pre-Feasibility Study system. You analyse African infrastructure assets and return ONLY structured JSON. Every field must be sourced from your knowledge — do NOT invent data. If a field is unknown, use null. Include a confidence_overall score (0.0-1.0) reflecting data quality, and list any data_gaps.`;

function profileBlock(asset: AssetProfile): string {
  return `ASSET PROFILE:
Name: ${asset.name}
Country: ${asset.country}
Sector: ${asset.sector}
Capacity: ${asset.capacityMW ?? "unknown"} MW
Commissioned: ${asset.commissionedYear ?? "unknown"}
Original Cost: ${asset.originalCostUsd ? `USD ${(asset.originalCostUsd / 1e6).toFixed(1)}M` : "unknown"}
Status: ${asset.status}
Ownership: ${asset.ownershipType}
Sub-Category: ${asset.subCategory}
${asset.operator ? `Operator: ${asset.operator}` : ""}
${asset.developer ? `Developer: ${asset.developer}` : ""}
${asset.waterBody ? `Water Body: ${asset.waterBody}` : ""}
${asset.region ? `Region: ${asset.region}` : ""}

DESCRIPTION: ${asset.description}
${asset.strategicContext ? `STRATEGIC CONTEXT: ${asset.strategicContext}` : ""}`;
}

async function runAgent<T>(
  agentName: string,
  systemPrompt: string,
  prompt: string,
  schema: ZodSchema<T>,
  classification: "public" | "sensitive" = "public"
): Promise<AgentOutput<T>> {
  const adapter = getLLMAdapter();
  const start = Date.now();

  const data = await adapter.extractStructured(
    {
      systemPrompt: `${SYSTEM_BASE}\n\nAGENT ROLE: ${systemPrompt}`,
      prompt,
      dataClassification: classification,
      maxTokens: 3000,
    },
    schema
  );

  const raw = data as Record<string, unknown>;

  return {
    agentName,
    tier: 1,
    data,
    confidence: (raw.confidence_overall as number) ?? 0.5,
    provenance: [`LLM extraction from public knowledge for ${agentName}`],
    dataGaps: (raw.data_gaps as string[]) ?? [],
    runTimeMs: Date.now() - start,
  };
}

// ─── 14 Tier 1 Agents ───

export async function hydrologyAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Hydrology Agent",
    "You are the Hydrology Agent. Analyse long-term flow yield, climate variability, climate-change resilience, and sediment regime for hydropower assets.",
    `${profileBlock(asset)}

Analyse the hydrology of this asset and return JSON:
{
  "catchment_area_km2": number|null,
  "mean_annual_flow_m3s": number|null,
  "dry_season_firm_flow": number|null,
  "wet_season_peak_flow": number|null,
  "flow_record_years": number|null,
  "flow_record_quality": "good|fair|poor|unknown",
  "monthly_flow_distribution": "description or null",
  "climate_change_2050_projection": "description or null",
  "sediment_yield": "description or null",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list of missing data"]
}`,
    HydrologyOutputSchema
  );
}

export async function topographyCivilAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Topography & Civil Works Agent",
    "You are the Topography & Civil Works Agent. Analyse site topography, dam/weir/intake/penstock/powerhouse/tailrace condition and remaining useful life.",
    `${profileBlock(asset)}

Analyse the topography and civil infrastructure and return JSON:
{
  "gross_head_m": number|null,
  "available_head_m": number|null,
  "dam_type": "string|null",
  "dam_height_m": number|null,
  "dam_condition": "good|fair|poor|unknown",
  "spillway_type": "string|null",
  "spillway_condition": "good|fair|poor|unknown",
  "penstock_length_m": number|null,
  "penstock_diameter_mm": number|null,
  "penstock_condition": "good|fair|poor|unknown",
  "powerhouse_condition": "good|fair|poor|unknown",
  "tailrace_condition": "good|fair|poor|unknown",
  "civil_remaining_useful_life_years": number|null,
  "modernisation_scope": "description",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    TopographyCivilOutputSchema
  );
}

export async function electromechanicalAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Electromechanical Agent",
    "You are the Electromechanical Agent. Analyse turbines, generators, transformers, switchgear, controls, and balance-of-plant.",
    `${profileBlock(asset)}

Analyse the electromechanical equipment and return JSON:
{
  "turbines": [{"unit_number": 1, "type": "Francis|Pelton|Kaplan|etc", "manufacturer": "string|null", "capacity_mw": number|null, "status": "operational|out_of_service|under_repair|never_commissioned", "condition": "good|fair|poor|unknown", "remaining_useful_life_years": number|null}],
  "generators": "description",
  "transformers": "description",
  "switchgear": "description",
  "control_system": "description",
  "modernisation_priorities": ["list"],
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    ElectromechanicalOutputSchema
  );
}

export async function transmissionGridAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Transmission & Grid Agent",
    "You are the Transmission & Grid Agent. Analyse evacuation capacity, grid integration, and regional power pool access.",
    `${profileBlock(asset)}

Analyse the transmission and grid connection and return JSON:
{
  "evacuation_voltage_kv": number|null,
  "evacuation_capacity_mw": number|null,
  "transmission_distance_km": number|null,
  "constraint_severity": "none|moderate|binding|critical",
  "grid_connection_status": "description",
  "regional_pool_access": "string|null",
  "distribution_constraint": "string|null",
  "transmission_upgrade_required": "string|null",
  "transmission_upgrade_cost_usd": number|null,
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    TransmissionGridOutputSchema
  );
}

export async function energyYieldAgent(
  asset: AssetProfile,
  hydrology: AgentOutput,
  topography: AgentOutput,
  electromechanical: AgentOutput
): Promise<AgentOutput> {
  return runAgent(
    "Energy Yield Agent",
    "You are the Energy Yield Agent. Calculate long-term energy generation using P = η × ρ × g × h × Q. Use upstream agent data for flow, head, and installed capacity.",
    `${profileBlock(asset)}

UPSTREAM DATA:
Hydrology: ${JSON.stringify(hydrology.data)}
Topography: ${JSON.stringify(topography.data)}
Electromechanical: ${JSON.stringify(electromechanical.data)}

Calculate energy yield and return JSON:
{
  "p50_annual_gwh": number|null,
  "p90_annual_gwh": number|null,
  "firm_energy_gwh": number|null,
  "capacity_factor_pct": number|null,
  "uprate_potential_mw": number|null,
  "uprate_conditional_on": "string|null",
  "climate_resilience_2050": "string|null",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    EnergyYieldOutputSchema
  );
}

export async function demandMarketAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Demand & Market Agent",
    "You are the Demand & Market Agent. Analyse demand forecasts, load profiles, electrification targets, tariff environment, and regional power pool context.",
    `${profileBlock(asset)}

Analyse the demand and market context and return JSON:
{
  "national_peak_demand_mw": number|null,
  "demand_growth_rate_pct": number|null,
  "electrification_rate_pct": number|null,
  "rural_electrification_pct": number|null,
  "supply_mix": "description of generation mix",
  "demand_supply_gap": "description",
  "end_user_tariff_usd_kwh": number|null,
  "tariff_affordability": "string|null",
  "regional_power_pool": "string|null",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    DemandMarketOutputSchema
  );
}

export async function commercialAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Commercial Agent",
    "You are the Commercial Agent. Analyse PPA terms, tariff structure, offtake credit quality, and payment performance.",
    `${profileBlock(asset)}

Analyse the commercial arrangements and return JSON:
{
  "ppa_exists": boolean,
  "ppa_counterparty": "string|null",
  "ppa_term_years": number|null,
  "ppa_tariff_usd_kwh": number|null,
  "ppa_currency": "string|null",
  "ppa_indexation": "string|null",
  "offtaker_credit_rating": "string|null",
  "offtaker_payment_performance": "good|fair|poor|unknown",
  "sovereign_guarantee": boolean|null,
  "revenue_maturity_assessment": "description",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    CommercialOutputSchema
  );
}

export async function regulatoryAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Regulatory & Permits Agent",
    "You are the Regulatory & Permits Agent. Analyse the regulatory regime, water rights, permits, concession framework, and change-of-control requirements.",
    `${profileBlock(asset)}

Analyse the regulatory environment and return JSON:
{
  "regulator": "string|null",
  "regulator_independence": "independent|semi_independent|government_controlled|unknown",
  "national_electricity_act": "string|null",
  "ppp_framework": "string|null",
  "concession_precedent": "description of precedent or lack thereof",
  "water_rights_status": "description",
  "environmental_permits_status": "description",
  "change_of_control_consents": "description",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    RegulatoryOutputSchema
  );
}

export async function esgAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "ESG Agent",
    "You are the ESG Agent. Analyse environmental impact, social impact, climate resilience, and IFC PS / AfDB Safeguards compliance.",
    `${profileBlock(asset)}

Analyse the ESG profile and return JSON:
{
  "esia_status": "description",
  "esia_age_years": number|null,
  "ifc_ps_compliance": "compliant|partial|non_compliant|unknown",
  "resettlement_status": "description",
  "community_engagement_rating": "good|fair|poor|unknown",
  "climate_resilience": "description",
  "flood_drought_risk": "description",
  "biodiversity_concerns": "string|null",
  "carbon_baseline_tco2e_yr": number|null,
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    ESGOutputSchema
  );
}

export async function carbonAgent(
  asset: AssetProfile,
  esg: AgentOutput,
  macro: AgentOutput
): Promise<AgentOutput> {
  return runAgent(
    "Carbon Agent",
    "You are the Carbon Agent. Assess emissions baseline, carbon market eligibility (VCS, Gold Standard, Article 6.4), and indicative carbon revenue.",
    `${profileBlock(asset)}

UPSTREAM DATA:
ESG: ${JSON.stringify(esg.data)}
Macro & Country: ${JSON.stringify(macro.data)}

Analyse carbon market opportunity and return JSON:
{
  "eligibility_vcs": boolean,
  "eligibility_gold_standard": boolean,
  "eligibility_article_6_4": boolean,
  "grid_emission_factor_tco2_mwh": number|null,
  "annual_emissions_displaced_tco2": number|null,
  "carbon_price_low_usd": number|null,
  "carbon_price_high_usd": number|null,
  "annual_carbon_revenue_low_usd": number|null,
  "annual_carbon_revenue_high_usd": number|null,
  "irr_uplift_bps": number|null,
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    CarbonOutputSchema
  );
}

export async function comparablesAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Comparables Agent",
    "You are the Comparables Agent. Identify comparable infrastructure transactions in Africa — similar sector, scale, and development stage. Provide per-MW pricing benchmarks and structural analogs.",
    `${profileBlock(asset)}

Identify the 3-5 nearest comparable transactions and return JSON:
{
  "nearest_comparables": [{"name": "string", "country": "string", "capacity_mw": number|null, "developer": "string|null", "similarity_score": 0.0-1.0, "structural_lessons": "description"}],
  "per_mw_benchmark_low_usd": number|null,
  "per_mw_benchmark_high_usd": number|null,
  "valuation_low_usd_m": number|null,
  "valuation_high_usd_m": number|null,
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    ComparablesOutputSchema
  );
}

export async function macroCountryAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Macro & Country Agent",
    "You are the Macro & Country Agent. Analyse sovereign rating, FX risk, political stability, and economic context.",
    `${profileBlock(asset)}

Analyse the macro and country risk context and return JSON:
{
  "sovereign_rating": "string|null (e.g. B-/B3)",
  "sovereign_outlook": "stable|positive|negative|null",
  "currency": "currency name",
  "currency_depreciation_10yr_pct": number|null,
  "fx_convertibility": "good|restricted|heavily_restricted",
  "recommended_ppa_currency": "USD|EUR|local",
  "political_stability": "description",
  "expropriation_risk": "low|moderate|high",
  "election_cycle_note": "string|null",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    MacroCountryOutputSchema
  );
}

export async function financialAgent(asset: AssetProfile): Promise<AgentOutput> {
  return runAgent(
    "Financial Agent",
    "You are the Financial Agent. Analyse financials, capex/opex estimates, and existing debt. Use known project cost data.",
    `${profileBlock(asset)}

Analyse the financial profile and return JSON:
{
  "audited_financials_available": boolean,
  "revenue_history": "string|null",
  "ebitda_history": "string|null",
  "outstanding_debt": [{"lender": "string", "amount_usd": number|null, "status": "string"}],
  "capex_estimate_low_usd_m": number|null,
  "capex_estimate_central_usd_m": number|null,
  "capex_estimate_high_usd_m": number|null,
  "capex_source": "string|null",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    FinancialOutputSchema
  );
}

export async function modernisationAgent(
  asset: AssetProfile,
  topography: AgentOutput,
  electromechanical: AgentOutput,
  transmission: AgentOutput,
  esg: AgentOutput
): Promise<AgentOutput> {
  return runAgent(
    "Modernisation Scope Agent",
    "You are the Modernisation Scope Agent. Synthesise civil, electromechanical, transmission, and ESG findings into a structured modernisation scope with capex envelope.",
    `${profileBlock(asset)}

UPSTREAM DATA:
Topography & Civil: ${JSON.stringify(topography.data)}
Electromechanical: ${JSON.stringify(electromechanical.data)}
Transmission & Grid: ${JSON.stringify(transmission.data)}
ESG: ${JSON.stringify(esg.data)}

Synthesise the modernisation scope and return JSON:
{
  "scope_summary": "description",
  "components": [{"action": "string", "capex_usd_m": number|null, "timeline": "string|null", "criticality": "critical|high|medium|low"}],
  "total_capex_low_usd_m": number|null,
  "total_capex_central_usd_m": number|null,
  "total_capex_high_usd_m": number|null,
  "uprate_potential": "string|null",
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["list"]
}`,
    ModernisationOutputSchema
  );
}
