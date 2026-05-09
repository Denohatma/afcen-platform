import { getLLMAdapter } from "@/lib/llm/adapter";
import { computeComposite } from "@/lib/scoring/engine";
import { signal } from "@/lib/scoring/thresholds";
import { RUBRICS } from "@/lib/scoring/rubrics";
import { Dimension } from "@prisma/client";
import type { AgentOutput, Tier1Outputs } from "./types";
import {
  ScoringOutputSchema,
  CapitalStackOutputSchema,
  BusinessModelOutputSchema,
  ReturnsOutputSchema,
  RiskRegisterOutputSchema,
  QuestionsOutputSchema,
} from "./types";

interface AssetProfile {
  name: string;
  country: string;
  sector: string;
  capacityMW: number | null;
  status: string;
  ownershipType: string;
  subCategory: string;
  description: string;
  strategicContext: string | null;
}

// ─── Tier 2.1: Scoring Engine (DETERMINISTIC — uses LLM only for evidence-based scoring) ───

export async function scoringEngine(
  asset: AssetProfile,
  tier1: Tier1Outputs
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const dimensions = Object.values(Dimension);
  const tier1Summary = Object.entries(tier1)
    .map(([k, v]) => `${k}: confidence=${v.confidence}, gaps=[${v.dataGaps.join(", ")}]`)
    .join("\n");

  const result = await adapter.extractStructured(
    {
      systemPrompt: `You are the AfCEN Scoring Engine. You score infrastructure assets across 6 dimensions on a 1-10 scale. You use EVIDENCE from the Tier 1 agent outputs below to justify each score. You are conservative — low confidence in upstream data should pull scores down. You MUST follow the rubrics provided.

RUBRICS:
${dimensions.map((d) => `${d}:\n  Low (1-3): ${RUBRICS[d].low}\n  Mid (4-6): ${RUBRICS[d].mid}\n  High (7-10): ${RUBRICS[d].high}`).join("\n\n")}`,
      prompt: `ASSET: ${asset.name} (${asset.country}, ${asset.sector}, ${asset.capacityMW ?? "N/A"} MW, ${asset.status})

TIER 1 AGENT OUTPUTS:
${Object.entries(tier1).map(([, v]) => `\n--- ${v.agentName} (confidence: ${v.confidence}) ---\n${JSON.stringify(v.data, null, 1)}`).join("\n")}

TIER 1 SUMMARY:
${tier1Summary}

Score all 6 dimensions. For each, provide a score (1-10), rationale citing specific Tier 1 evidence, and confidence (0-1). Then derive the Path-to-GO actions (what would move the score up).

Return JSON:
{
  "dimensions": [{"dimension": "REVENUE_MATURITY|DEBT_COMPLEXITY|...", "score": 1-10, "rationale": "string", "confidence": 0.0-1.0}],
  "composite": weighted_average,
  "signal": "GO|CONDITIONAL|NO_GO",
  "path_to_go": [{"action": "string", "affects_dimension": "string", "score_uplift": number, "estimated_cost": "string|null", "estimated_time": "string|null"}]
}

The composite is the weighted average: REVENUE_MATURITY×0.2 + DEBT_COMPLEXITY×0.15 + CONCESSION_READINESS×0.2 + DATA_AVAILABILITY×0.15 + REGULATORY_ENVIRONMENT×0.15 + MODERNISATION_RISK×0.15.
Signal: GO ≥ 7.0, CONDITIONAL 5.5-7.0, NO_GO < 5.5.`,
      dataClassification: "sensitive",
      maxTokens: 4000,
    },
    ScoringOutputSchema
  );

  const scorePairs = result.dimensions.map((d) => ({
    dimension: d.dimension as Dimension,
    score: d.score,
  }));
  const composite = computeComposite(scorePairs);
  const sig = signal(composite);

  result.composite = Math.round(composite * 100) / 100;
  result.signal = sig;

  return {
    agentName: "Scoring Engine",
    tier: 2,
    data: result,
    confidence: Math.min(...result.dimensions.map((d) => d.confidence)),
    provenance: ["Deterministic scoring with LLM-assisted evidence extraction"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}

// ─── Tier 2.2: Capital Stack Architect ───

export async function capitalStackArchitect(
  asset: AssetProfile,
  tier1: Tier1Outputs,
  scoring: AgentOutput
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const data = await adapter.extractStructured(
    {
      systemPrompt: "You are the Capital Stack Architect for AfCEN. You design financing structures for African infrastructure assets, identifying appropriate DFI lenders, equity investors, and blended finance instruments. You are realistic about what capital is available for the asset's risk profile.",
      prompt: `ASSET: ${asset.name} (${asset.country}, ${asset.capacityMW ?? "N/A"} MW, ${asset.subCategory})

SCORING: ${JSON.stringify(scoring.data)}
COMMERCIAL: ${JSON.stringify(tier1.commercial.data)}
FINANCIAL: ${JSON.stringify(tier1.financial.data)}
MACRO: ${JSON.stringify(tier1.macro_country.data)}
MODERNISATION: ${JSON.stringify(tier1.modernisation.data)}
CARBON: ${JSON.stringify(tier1.carbon.data)}

Design the capital stack. Return JSON:
{
  "total_project_cost_usd_m": number|null,
  "equity_share_pct": number|null,
  "debt_share_pct": number|null,
  "recommended_lenders": [{"name": "string", "type": "DFI|MDB|commercial|grant", "role": "senior_debt|mezzanine|equity|grant|guarantee", "indicative_amount_usd_m": number|null}],
  "anchor_investor_role": "description of Africa50's role",
  "blended_finance_opportunity": "string|null",
  "confidence_overall": 0.0-1.0
}`,
      dataClassification: "sensitive",
      maxTokens: 2500,
    },
    CapitalStackOutputSchema
  );

  return {
    agentName: "Capital Stack Architect",
    tier: 2,
    data,
    confidence: data.confidence_overall,
    provenance: ["LLM synthesis from commercial, financial, and macro data"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}

// ─── Tier 2.3: Business Model Evaluator ───

export async function businessModelEvaluator(
  asset: AssetProfile,
  tier1: Tier1Outputs
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const data = await adapter.extractStructured(
    {
      systemPrompt: "You are the Business Model Evaluator for AfCEN. You assess which business model best fits the asset — pure asset recycling, stranded brownfield revival, IPP refinancing, concession structuring, or greenfield IPT. You consider the commercial, regulatory, and market context.",
      prompt: `ASSET: ${asset.name} (${asset.country}, ${asset.subCategory})

COMMERCIAL: ${JSON.stringify(tier1.commercial.data)}
REGULATORY: ${JSON.stringify(tier1.regulatory.data)}
COMPARABLES: ${JSON.stringify(tier1.comparables.data)}
DEMAND & MARKET: ${JSON.stringify(tier1.demand_market.data)}
MODERNISATION: ${JSON.stringify(tier1.modernisation.data)}

Evaluate business models. Return JSON:
{
  "recommended_model": "string",
  "rationale": "2-3 sentences",
  "alternatives_considered": [{"model": "string", "pros": "string", "cons": "string", "viable": boolean}],
  "confidence_overall": 0.0-1.0
}`,
      dataClassification: "sensitive",
      maxTokens: 2000,
    },
    BusinessModelOutputSchema
  );

  return {
    agentName: "Business Model Evaluator",
    tier: 2,
    data,
    confidence: data.confidence_overall,
    provenance: ["LLM synthesis from commercial, regulatory, and market data"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}

// ─── Tier 2.4: Returns Modeller ───

export async function returnsModeller(
  asset: AssetProfile,
  tier1: Tier1Outputs,
  capitalStack: AgentOutput
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const data = await adapter.extractStructured(
    {
      systemPrompt: "You are the Returns Modeller for AfCEN. You estimate indicative equity IRR, project IRR, payback period, and DSCR based on energy yield, tariff, capex, and capital structure. You are conservative and flag key assumptions.",
      prompt: `ASSET: ${asset.name} (${asset.country}, ${asset.capacityMW ?? "N/A"} MW)

ENERGY YIELD: ${JSON.stringify(tier1.energy_yield.data)}
COMMERCIAL: ${JSON.stringify(tier1.commercial.data)}
FINANCIAL: ${JSON.stringify(tier1.financial.data)}
MODERNISATION: ${JSON.stringify(tier1.modernisation.data)}
CAPITAL STACK: ${JSON.stringify(capitalStack.data)}
CARBON: ${JSON.stringify(tier1.carbon.data)}

Model indicative returns. Return JSON:
{
  "equity_irr_base_pct": number|null,
  "equity_irr_upside_pct": number|null,
  "equity_irr_downside_pct": number|null,
  "project_irr_pct": number|null,
  "payback_period_years": number|null,
  "dscr_minimum": number|null,
  "carbon_irr_uplift_bps": number|null,
  "key_assumptions": ["list of key assumptions"],
  "confidence_overall": 0.0-1.0
}`,
      dataClassification: "sensitive",
      maxTokens: 2000,
    },
    ReturnsOutputSchema
  );

  return {
    agentName: "Returns Modeller",
    tier: 2,
    data,
    confidence: data.confidence_overall,
    provenance: ["LLM-assisted financial modelling from yield, tariff, and capex data"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}

// ─── Tier 2.5: Risk Register Compiler ───

export async function riskRegisterCompiler(
  asset: AssetProfile,
  tier1: Tier1Outputs
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const data = await adapter.extractStructured(
    {
      systemPrompt: "You are the Risk Register Compiler for AfCEN. You extract risks and data gaps from ALL Tier 1 agent outputs and compile a structured risk register with mitigants and conditions precedent.",
      prompt: `ASSET: ${asset.name} (${asset.country}, ${asset.subCategory})

ALL TIER 1 OUTPUTS:
${Object.entries(tier1).map(([, v]) => `--- ${v.agentName} ---\nConfidence: ${v.confidence}\nData Gaps: ${v.dataGaps.join(", ") || "none"}\nData: ${JSON.stringify(v.data, null, 1)}`).join("\n\n")}

Compile the risk register. Return JSON:
{
  "risks": [{"category": "Technical|Commercial|Regulatory|Financial|ESG|Political", "risk": "description", "severity": "critical|high|medium|low", "likelihood": "high|medium|low", "mitigant": "description", "residual_rating": "high|medium|low"}],
  "top_risk": "the single most important risk",
  "conditions_precedent": ["list of conditions that must be met before investment"]
}`,
      dataClassification: "sensitive",
      maxTokens: 3000,
    },
    RiskRegisterOutputSchema
  );

  return {
    agentName: "Risk Register Compiler",
    tier: 2,
    data,
    confidence: 0.7,
    provenance: ["LLM compilation from all Tier 1 agent risk and gap data"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}

// ─── Tier 2.6: Strategic Rationale Writer ───

export async function strategicRationaleWriter(
  asset: AssetProfile,
  tier1: Tier1Outputs,
  scoring: AgentOutput
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const text = await adapter.complete({
    systemPrompt: "You are a senior investment strategist at Africa50. Write concise, IC-grade strategic rationale. 300-500 words. Formal infrastructure-finance prose.",
    prompt: `Write the Strategic Rationale section for the Pre-Feasibility Study.

ASSET: ${asset.name} (${asset.country}, ${asset.capacityMW ?? "N/A"} MW, ${asset.subCategory})
SCORING: ${JSON.stringify(scoring.data)}
DEMAND: ${JSON.stringify(tier1.demand_market.data)}
COMPARABLES: ${JSON.stringify(tier1.comparables.data)}
MACRO: ${JSON.stringify(tier1.macro_country.data)}

Cover: (1) why this asset matters to Africa50's mandate, (2) replicability potential, (3) development impact, (4) strategic timing.`,
    dataClassification: "sensitive",
    maxTokens: 1500,
  });

  return {
    agentName: "Strategic Rationale Writer",
    tier: 2,
    data: { text },
    confidence: 0.8,
    provenance: ["LLM narrative synthesis"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}

// ─── Tier 2.7: Policy Brief Writer ───

export async function policyBriefWriter(
  asset: AssetProfile,
  tier1: Tier1Outputs,
  scoring: AgentOutput,
  returns: AgentOutput
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const text = await adapter.complete({
    systemPrompt: "You are a policy advisor at Africa50. Write a concise policy brief for government stakeholders. 200-400 words. Formal, actionable.",
    prompt: `Write the Policy Brief section for the Pre-Feasibility Study.

ASSET: ${asset.name} (${asset.country}, ${asset.capacityMW ?? "N/A"} MW)
SCORING: ${JSON.stringify(scoring.data)}
REGULATORY: ${JSON.stringify(tier1.regulatory.data)}
DEMAND: ${JSON.stringify(tier1.demand_market.data)}
MACRO: ${JSON.stringify(tier1.macro_country.data)}
RETURNS: ${JSON.stringify(returns.data)}

Cover: (1) what government action would enable this investment, (2) regulatory reforms needed, (3) sequencing recommendation relative to other assets in the country.`,
    dataClassification: "sensitive",
    maxTokens: 1200,
  });

  return {
    agentName: "Policy Brief Writer",
    tier: 2,
    data: { text },
    confidence: 0.8,
    provenance: ["LLM policy synthesis"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}

// ─── Tier 2.8: Questions Generator ───

export async function questionsGenerator(
  asset: AssetProfile,
  tier1: Tier1Outputs
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const gaps = Object.entries(tier1).flatMap(([, output]) =>
    output.dataGaps.map((gap: string) => `${output.agentName}: ${gap}`)
  );

  const lowConfidence = Object.entries(tier1)
    .filter(([, output]) => output.confidence < 0.6)
    .map(([, output]) => `${output.agentName} (confidence: ${output.confidence})`);

  const data = await adapter.extractStructured(
    {
      systemPrompt: "You are the Questions Generator for AfCEN. You convert data gaps and low-confidence findings into actionable feasibility-stage questions, each mapped to a workstream and expected source of answer.",
      prompt: `ASSET: ${asset.name} (${asset.country})

DATA GAPS FROM TIER 1 AGENTS:
${gaps.join("\n")}

LOW CONFIDENCE AGENTS:
${lowConfidence.join("\n")}

Generate feasibility-stage questions. Return JSON:
{
  "questions": [{"workstream": "Technical|Commercial|Legal|Financial|Regulatory & ESG|Strategic", "question": "specific question", "source_agent": "which agent flagged this", "expected_source": "where to find the answer", "priority": "critical|high|medium"}]
}

Generate 15-30 questions covering all gaps.`,
      dataClassification: "sensitive",
      maxTokens: 3000,
    },
    QuestionsOutputSchema
  );

  return {
    agentName: "Questions Generator",
    tier: 2,
    data,
    confidence: 0.9,
    provenance: ["Gap-driven question generation from all Tier 1 outputs"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}

// ─── Tier 2.9: Executive Summary Writer (runs last) ───

export async function executiveSummaryWriter(
  asset: AssetProfile,
  tier1: Tier1Outputs,
  scoring: AgentOutput,
  capitalStack: AgentOutput,
  businessModel: AgentOutput,
  returns: AgentOutput,
  riskRegister: AgentOutput,
  strategicRationale: AgentOutput,
  policyBrief: AgentOutput,
  questions: AgentOutput
): Promise<AgentOutput> {
  const start = Date.now();
  const adapter = getLLMAdapter();

  const text = await adapter.complete({
    systemPrompt: "You are drafting the Executive Summary for an Africa50 Pre-Feasibility Study. This is a 500-800 word summary that an Investment Committee member reads first. It must include: the signal (GO/CONDITIONAL/NO_GO), composite score, key findings, top risk, recommended next steps, and a clear recommendation. Formal IC-grade prose. Markdown format.",
    prompt: `Write the Executive Summary for the Pre-Feasibility Study.

ASSET: ${asset.name} (${asset.country}, ${asset.sector}, ${asset.capacityMW ?? "N/A"} MW, ${asset.status}, ${asset.subCategory})

SCORING: ${JSON.stringify(scoring.data)}
CAPITAL STACK: ${JSON.stringify(capitalStack.data)}
BUSINESS MODEL: ${JSON.stringify(businessModel.data)}
RETURNS: ${JSON.stringify(returns.data)}
RISK REGISTER TOP RISK: ${JSON.stringify((riskRegister.data as Record<string, unknown>).top_risk)}
CONDITIONS PRECEDENT: ${JSON.stringify((riskRegister.data as Record<string, unknown>).conditions_precedent)}
STRATEGIC RATIONALE: ${(strategicRationale.data as Record<string, string>).text?.slice(0, 500)}
POLICY BRIEF: ${(policyBrief.data as Record<string, string>).text?.slice(0, 300)}
QUESTIONS COUNT: ${((questions.data as Record<string, unknown[]>).questions)?.length ?? 0}

KEY TIER 1 FINDINGS:
- Hydrology confidence: ${tier1.hydrology.confidence}
- Transmission constraint: ${JSON.stringify((tier1.transmission_grid.data as Record<string, unknown>).constraint_severity)}
- Energy yield P50: ${JSON.stringify((tier1.energy_yield.data as Record<string, unknown>).p50_annual_gwh)} GWh/yr
- Commercial: PPA exists = ${JSON.stringify((tier1.commercial.data as Record<string, unknown>).ppa_exists)}

Write the executive summary now. Include the scoring table and clear recommendation.`,
    dataClassification: "sensitive",
    maxTokens: 2500,
  });

  return {
    agentName: "Executive Summary Writer",
    tier: 2,
    data: { text },
    confidence: 0.85,
    provenance: ["Final synthesis of all Tier 1 and Tier 2 outputs"],
    dataGaps: [],
    runTimeMs: Date.now() - start,
  };
}
