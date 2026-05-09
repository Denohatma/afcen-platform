import * as T1 from "./tier1";
import * as T2 from "./tier2";
import type { AgentOutput, DocumentContext, Tier1Outputs, Tier2Outputs, PipelineResult } from "./types";

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

export type ProgressCallback = (update: {
  phase: string;
  agent: string;
  status: "running" | "completed" | "failed";
  completedCount: number;
  totalCount: number;
}) => void;

export async function runPipeline(
  asset: AssetProfile,
  onProgress?: ProgressCallback,
  documents?: DocumentContext[]
): Promise<PipelineResult> {
  const totalAgents = 23;
  let completedCount = 0;
  const pipelineStart = Date.now();
  const docs = documents ?? [];

  function progress(phase: string, agent: string, status: "running" | "completed" | "failed") {
    if (status === "completed") completedCount++;
    onProgress?.({ phase, agent, status, completedCount, totalCount: totalAgents });
  }

  // ─── TIER 1: Parallel independent agents (10 agents) ───

  progress("Tier 1", "Parallel extraction", "running");

  const [hydrology, topoCivil, emec, transGrid, demandMkt, commercial, regulatory, esg, comparables, macro, financial] =
    await Promise.all([
      runSafe("Hydrology Agent", () => T1.hydrologyAgent(asset, docs), progress),
      runSafe("Topography & Civil Agent", () => T1.topographyCivilAgent(asset, docs), progress),
      runSafe("Electromechanical Agent", () => T1.electromechanicalAgent(asset, docs), progress),
      runSafe("Transmission & Grid Agent", () => T1.transmissionGridAgent(asset, docs), progress),
      runSafe("Demand & Market Agent", () => T1.demandMarketAgent(asset, docs), progress),
      runSafe("Commercial Agent", () => T1.commercialAgent(asset, docs), progress),
      runSafe("Regulatory Agent", () => T1.regulatoryAgent(asset, docs), progress),
      runSafe("ESG Agent", () => T1.esgAgent(asset, docs), progress),
      runSafe("Comparables Agent", () => T1.comparablesAgent(asset, docs), progress),
      runSafe("Macro & Country Agent", () => T1.macroCountryAgent(asset, docs), progress),
      runSafe("Financial Agent", () => T1.financialAgent(asset, docs), progress),
    ]);

  // ─── TIER 1: Dependent agents (4 agents, sequential) ───

  const energyYield = await runSafe(
    "Energy Yield Agent",
    () => T1.energyYieldAgent(asset, hydrology, topoCivil, emec, docs),
    progress
  );

  const carbon = await runSafe(
    "Carbon Agent",
    () => T1.carbonAgent(asset, esg, macro, docs),
    progress
  );

  const modernisation = await runSafe(
    "Modernisation Scope Agent",
    () => T1.modernisationAgent(asset, topoCivil, emec, transGrid, esg, docs),
    progress
  );

  const tier1: Tier1Outputs = {
    hydrology,
    topography_civil: topoCivil,
    electromechanical: emec,
    transmission_grid: transGrid,
    energy_yield: energyYield,
    demand_market: demandMkt,
    commercial,
    regulatory,
    esg,
    carbon,
    comparables,
    macro_country: macro,
    financial,
    modernisation,
  };

  // ─── TIER 2: Synthesis agents (sequenced by dependency) ───

  const scoring = await runSafe(
    "Scoring Engine",
    () => T2.scoringEngine(asset, tier1),
    progress
  );

  const [capitalStack, businessModel, riskRegister] = await Promise.all([
    runSafe("Capital Stack Architect", () => T2.capitalStackArchitect(asset, tier1, scoring), progress),
    runSafe("Business Model Evaluator", () => T2.businessModelEvaluator(asset, tier1), progress),
    runSafe("Risk Register Compiler", () => T2.riskRegisterCompiler(asset, tier1), progress),
  ]);

  const returns = await runSafe(
    "Returns Modeller",
    () => T2.returnsModeller(asset, tier1, capitalStack),
    progress
  );

  const [strategicRationale, policyBrief, questions] = await Promise.all([
    runSafe("Strategic Rationale Writer", () => T2.strategicRationaleWriter(asset, tier1, scoring), progress),
    runSafe("Policy Brief Writer", () => T2.policyBriefWriter(asset, tier1, scoring, returns), progress),
    runSafe("Questions Generator", () => T2.questionsGenerator(asset, tier1), progress),
  ]);

  const executiveSummary = await runSafe(
    "Executive Summary Writer",
    () => T2.executiveSummaryWriter(
      asset, tier1, scoring, capitalStack, businessModel, returns,
      riskRegister, strategicRationale, policyBrief, questions
    ),
    progress
  );

  const tier2: Tier2Outputs = {
    scoring,
    capital_stack: capitalStack,
    business_model: businessModel,
    returns,
    risk_register: riskRegister,
    strategic_rationale: strategicRationale,
    policy_brief: policyBrief,
    questions,
    executive_summary: executiveSummary,
  };

  // ─── TIER 3: Validation ───

  const warnings: string[] = [];
  const errors: string[] = [];

  for (const [key, output] of Object.entries(tier1)) {
    if (output.confidence < 0.3) {
      warnings.push(`${output.agentName}: very low confidence (${output.confidence})`);
    }
    if (output.dataGaps.length > 3) {
      warnings.push(`${output.agentName}: ${output.dataGaps.length} data gaps`);
    }
  }

  const scoringData = scoring.data as Record<string, unknown>;
  if ((scoringData.composite as number) < 5.5) {
    warnings.push(`Composite score ${scoringData.composite} is below CONDITIONAL threshold`);
  }

  // ─── Render final document ───

  const document = renderPreFeasibilityDocument(asset, tier1, tier2);

  return {
    tier1,
    tier2,
    validation: { passed: errors.length === 0, warnings, errors },
    provenance: {
      total_sources: Object.values(tier1).reduce((acc, o) => acc + o.provenance.length, 0),
      agents_run: totalAgents,
      total_time_ms: Date.now() - pipelineStart,
    },
    document,
  };
}

async function runSafe(
  name: string,
  fn: () => Promise<AgentOutput>,
  progress: (phase: string, agent: string, status: "running" | "completed" | "failed") => void
): Promise<AgentOutput> {
  progress("Running", name, "running");
  try {
    const result = await fn();
    progress("Running", name, "completed");
    return result;
  } catch (err) {
    console.error(`[AfCEN] Agent "${name}" failed:`, err);
    progress("Running", name, "failed");
    return {
      agentName: name,
      tier: 1,
      data: {},
      confidence: 0,
      provenance: [`FAILED: ${err instanceof Error ? err.message : "unknown error"}`],
      dataGaps: ["Agent execution failed"],
      runTimeMs: 0,
    };
  }
}

function renderPreFeasibilityDocument(
  asset: AssetProfile,
  tier1: Tier1Outputs,
  tier2: Tier2Outputs
): string {
  const scoring = tier2.scoring.data as Record<string, unknown>;
  const dims = (scoring.dimensions as Array<Record<string, unknown>>) ?? [];
  const pathToGo = (scoring.path_to_go as Array<Record<string, unknown>>) ?? [];
  const capitalStack = tier2.capital_stack.data as Record<string, unknown>;
  const businessModel = tier2.business_model.data as Record<string, unknown>;
  const returns = tier2.returns.data as Record<string, unknown>;
  const riskRegister = tier2.risk_register.data as Record<string, unknown>;
  const risks = (riskRegister.risks as Array<Record<string, unknown>>) ?? [];
  const cps = (riskRegister.conditions_precedent as string[]) ?? [];
  const questions = ((tier2.questions.data as Record<string, unknown>).questions as Array<Record<string, unknown>>) ?? [];
  const execSummary = (tier2.executive_summary.data as Record<string, string>).text ?? "";
  const strategicText = (tier2.strategic_rationale.data as Record<string, string>).text ?? "";
  const policyText = (tier2.policy_brief.data as Record<string, string>).text ?? "";

  const lenders = (capitalStack.recommended_lenders as Array<Record<string, unknown>>) ?? [];

  return `# Pre-Feasibility Study: ${asset.name}

**Country:** ${asset.country} | **Sector:** ${asset.sector} | **Capacity:** ${asset.capacityMW ?? "N/A"} MW
**Status:** ${asset.status} | **Sub-Category:** ${asset.subCategory}
**Commissioned:** ${asset.commissionedYear ?? "Unknown"} | **Ownership:** ${asset.ownershipType}

---

## 0. Executive Summary

${execSummary}

---

## 1. AfCEN Scorecard

| Dimension | Score | Confidence | Rationale |
|-----------|-------|------------|-----------|
${dims.map((d) => `| ${d.dimension} | ${d.score}/10 | ${((d.confidence as number) * 100).toFixed(0)}% | ${d.rationale} |`).join("\n")}

**Composite Score:** ${scoring.composite} / 10.0
**Signal:** ${scoring.signal}

---

## 2. Path to GO

${pathToGo.map((a, i) => `${i + 1}. **${a.action}** — affects ${a.affects_dimension}, uplift +${a.score_uplift}, cost: ${a.estimated_cost ?? "TBD"}, time: ${a.estimated_time ?? "TBD"}`).join("\n")}

---

## 3. Strategic Rationale

${strategicText}

---

## 4. Business Model

**Recommended Model:** ${businessModel.recommended_model}

${businessModel.rationale}

---

## 5. Capital Stack & Co-Funders

**Total Project Cost:** USD ${capitalStack.total_project_cost_usd_m ?? "TBD"}M
**Equity:** ${capitalStack.equity_share_pct ?? "TBD"}% | **Debt:** ${capitalStack.debt_share_pct ?? "TBD"}%

| Lender | Type | Role | Amount (USD M) |
|--------|------|------|----------------|
${lenders.map((l) => `| ${l.name} | ${l.type} | ${l.role} | ${l.indicative_amount_usd_m ?? "TBD"} |`).join("\n")}

**Africa50 Role:** ${capitalStack.anchor_investor_role}

---

## 6. Indicative Returns

| Metric | Value |
|--------|-------|
| Equity IRR (base) | ${returns.equity_irr_base_pct ?? "TBD"}% |
| Equity IRR (upside) | ${returns.equity_irr_upside_pct ?? "TBD"}% |
| Equity IRR (downside) | ${returns.equity_irr_downside_pct ?? "TBD"}% |
| Project IRR | ${returns.project_irr_pct ?? "TBD"}% |
| Payback Period | ${returns.payback_period_years ?? "TBD"} years |
| Min DSCR | ${returns.dscr_minimum ?? "TBD"}x |
| Carbon IRR Uplift | ${returns.carbon_irr_uplift_bps ?? "TBD"} bps |

**Key Assumptions:** ${(returns.key_assumptions as string[])?.join("; ") ?? "None stated"}

---

## 7. Risk Register & Conditions Precedent

**Top Risk:** ${riskRegister.top_risk}

| Category | Risk | Severity | Likelihood | Mitigant | Residual |
|----------|------|----------|------------|----------|----------|
${risks.map((r) => `| ${r.category} | ${r.risk} | ${r.severity} | ${r.likelihood} | ${r.mitigant} | ${r.residual_rating} |`).join("\n")}

### Conditions Precedent
${cps.map((c, i) => `${i + 1}. ${c}`).join("\n")}

---

## 8. Policy Brief

${policyText}

---

## 9. Questions for Feasibility Stage

${questions.map((q, i) => `${i + 1}. **[${q.workstream}]** ${q.question} _(Source: ${q.source_agent}, Expected: ${q.expected_source})_`).join("\n")}

---

*Generated by AfCEN Pre-Feasibility Agent Pipeline v0.1*
*Total agents: 23 | Generated: ${new Date().toISOString()}*
`;
}
