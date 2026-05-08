# AfCEN Agent Architecture — Pre-Feasibility Study
## Hydro Asset Specification, with Dodo HPP as Worked Example

**Version:** 0.1 (draft)
**Audience:** AfCEN engineering team and AI coding agents
**Purpose:** Specify the agent decomposition required to produce a Pre-Feasibility Study output for a hydropower asset, with Dodo HPP (Sierra Leone, 6 MW, stranded brownfield) as the worked example.
**Companion documents:** Build Brief v0.3, Bumbuna 1 Pre-Feasibility v0.1, Comparative Scorecard v0.1.

---

## 1. Architectural Principles (LOCKED)

Before listing the agents, the principles that govern how they're built. These flow directly from the moat strategy in the build brief — violate them and the platform's defensibility erodes.

1. **LLM extracts, rules engine scores.** No agent generates a numerical score, financial model output, or capital-stack composition directly via an LLM. Those come from deterministic rules engines reading structured features that LLM agents have produced.
2. **Each agent has bounded scope.** An agent does one thing well. The Hydrology Agent does not opine on capital structure. The Capital Stack Architect does not estimate flow yield.
3. **Each agent emits a structured output schema with confidence scores and provenance.** No free-text outputs that downstream agents have to re-parse. JSON or equivalent, with every field traceable to an input source.
4. **Agents run sovereign.** Open-weight models on AfCEN-controlled infrastructure. Frontier APIs forbidden in any path that touches sensitive data; permitted only for general-knowledge tasks on public data.
5. **Agents are composable across asset types.** The Hydrology Agent serves hydropower assessments. For a port asset it would be replaced by a Maritime Agent. The orchestrator selects the agent set based on asset type.
6. **Agents are observable.** Every agent run logs inputs, intermediate reasoning, outputs, and confidence. The Validator Agent cross-checks outputs and flags inconsistencies.

---

## 2. Three-Tier Architecture

The agent stack has three tiers:

- **Tier 1 — Domain-Specialist Agents** (14 for hydro): Gather, structure, and feature-engineer the inputs. Mostly LLM-driven extraction with domain-specific tools.
- **Tier 2 — Synthesis Agents** (9): Consume Tier 1 outputs and build the actual Pre-Feasibility Study sections. Mix of rules-engine and LLM agents.
- **Tier 3 — Orchestration & Quality** (3): Coordinate the workflow, validate cross-agent consistency, maintain provenance and audit trail.

```
┌──────────────────────────────────────────────────────────────────┐
│                    TIER 3 — ORCHESTRATION                        │
│       Orchestrator → Validator → Provenance Manager              │
└──────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│                    TIER 2 — SYNTHESIS AGENTS                     │
│  Scoring Engine • Capital Stack Architect • Business Model       │
│  Evaluator • Returns Modeller • Risk Register Compiler           │
│  Strategic Rationale Writer • Policy Brief Writer •              │
│  Questions Generator • Executive Summary Writer                  │
└──────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│                  TIER 1 — DOMAIN-SPECIALIST AGENTS               │
│  Hydrology • Topography & Civil • Electromechanical •            │
│  Transmission & Grid • Energy Yield • Demand & Market •          │
│  Commercial • Regulatory & Permits • ESG • Carbon •              │
│  Comparables • Macro & Country • Financial • Modernisation Scope │
└──────────────────────────────────────────────────────────────────┘
                                ↓
                    INPUT DOCUMENTS & DATA SOURCES
```

---

## 3. Tier 1 — Domain-Specialist Agents (14 total for hydro)

### 3.1 Hydrology Agent
**Scope:** Long-term flow yield, climate variability, climate-change resilience, sediment regime.
**Inputs:** Flow gauging records (NWRMA, USGS, regional databases); rainfall (national met office, ECOWREX, WorldClim 2.1); catchment characteristics (SRTM DEM, land cover, soil maps); climate projections (ECREEE/Poyry, CORDEX-Africa); satellite imagery for land-use change.
**Tools:** GIS toolkit (GDAL, rasterio, geopandas); hydrology library (HydroBASINS, custom flow-duration curve generator); climate data API connectors; satellite imagery APIs (Sentinel Hub, USGS Earth Explorer).
**Output schema:** catchment_area_km2, mean_annual_flow_m3s, flow_duration_curve, monthly_flow_distribution, dry_season_firm_flow, wet_season_peak_flow, flow_record_years, flow_record_quality, climate_change_2050_projection, sediment_yield, confidence_overall, provenance, data_gaps.
**Model size:** 7B–13B for extraction; calls deterministic hydrology library for calculations.
**Dodo example:** Catchment ~430 km², 5-yr historic record only, dry-to-wet flow ratio ~25×, **confidence LOW** — binding gap that drives the Path-to-GO move "fresh hydrology study."

### 3.2 Topography & Civil Works Agent
**Scope:** Site topography, foundation geology, condition of dam/weir/intake/penstock/powerhouse/tailrace.
**Inputs:** SRTM 30m DEM + higher-resolution DEMs; 3D point-cloud scans (SAEMS provides these for SL); engineering drawings; geological surveys (NMA, BGS); inspection reports; UAV imagery.
**Tools:** DEM analysis; point-cloud processing (Open3D, PDAL); engineering-document extraction; image analysis for visual condition assessment.
**Output schema:** gross_head_m, available_head_m, penstock spec (length/diameter/wall_thickness), civil_condition per component (rating, RUL, concerns), modernisation_scope, confidence, provenance.
**Model size:** 13B for engineering-document extraction + image understanding.
**Dodo example:** Earthfill dam + concrete ogee spillway, 36 yrs old, fair condition; penstock DN 1600 / 13.7 mm wall / 650 m / fair with surface corrosion; powerhouse roof wooden — risk flagged.

### 3.3 Electromechanical Agent
**Scope:** Turbines, generators, transformers, switchgear, controls, balance-of-plant.
**Inputs:** OEM equipment data (Kunming, Hunan Linglin); engineering drawings; O&M records; site photos; nameplate data.
**Tools:** Equipment-specific extraction prompts; OEM database lookup; image analysis.
**Output schema:** turbines (type, manufacturer, capacity, status, condition, RUL); generators; transformers; switchgear; control system; modernisation priorities with indicative capex.
**Dodo example:** 4×1.5 MW Francis (Kunming, 2007); Unit 1 operational, Unit 2 OOS since 2014, Unit 3 in repair, Unit 4 never commissioned; SCADA on single computer (no backup) flagged as risk.

### 3.4 Transmission & Grid Agent
**Scope:** Existing transmission infrastructure, evacuation capacity, grid integration, regional power pool access.
**Inputs:** Transmission line maps (ECOWREX, OSM); distribution network capacity; regional interconnector data (CLSG, WAPP); substation capacity; system loss data.
**Tools:** GIS for adjacency; grid topology analysis; WAPP/regional data connectors.
**Output schema:** evacuation (voltage, capacity, distance, constraint_severity); regional_pool_access (interconnector, export market available); distribution_constraint; transmission_upgrade_required (scope, cost).
**Dodo example:** **CRITICAL** — 33 kV Bo-Kenema network exists but Bo-Kenema is currently supplied via CLSG imports, displacing Dodo's market. CLSG 225 kV line nearby creates regional export option. Constraint severity: binding. This is the trigger for the "Stranded Brownfield" sub-category label.

### 3.5 Energy Yield Agent (deterministic — not an LLM)
**Scope:** Long-term annual energy generation, firm energy, capacity factor.
**Inputs:** Outputs of Hydrology + Topography & Civil + Electromechanical agents.
**Tools:** Deterministic hydropower yield calculator (P = η × ρ × g × h × Q); Monte Carlo simulation; climate scenario modelling.
**Output schema:** energy_yield (P50/P90 annual GWh, firm energy, capacity factor); uprate_scenarios; climate_resilience_2050.
**Dodo example:** P50 ~22 GWh/yr at 6 MW (~42% CF); firm ~12 GWh; 8 MW uprate flagged as needing hydrology validation; **confidence LOW** because hydrology data is poor.

### 3.6 Demand & Market Agent
**Scope:** Demand forecasts, load profiles, market context, electrification targets.
**Inputs:** IRENA country reports; utility IRPs; ECOWREX projections; World Bank country data; national strategies (MTNDP); M300 Compact targets.
**Output schema:** national_demand (current peak, projections, growth rate); electrification (access %, rural, compact target); market_context (supply mix, regional pool role, demand-supply gap); pricing_context (current EUT, affordability, subsidy presence).
**Dodo example:** SL access 26.2%; rural 4.8%; demand growing ~90 GWh/yr through 2030; supply mix hydro-dominated + thermal + small solar; EUT among ECOWAS highest but unaffordable (>25% household income).

### 3.7 Commercial Agent
**Scope:** PPA terms, tariff structure, offtake credit, payment performance.
**Inputs:** PPA documents; utility financials; regulatory tariff orders; comparable PPA terms (Karpowership precedent for SL).
**Output schema:** current_ppa (exists, term, structure, tariff, indexation, currency); offtaker_credit (entity, rating, payment performance, sovereign guarantee); tariff_environment.
**Dodo example:** No active PPA visible — plant displaced by CLSG; EDSA payment performance poor; this is what drives Revenue Maturity = 3 in the scorecard.

### 3.8 Regulatory & Permits Agent
**Scope:** Regulatory regime, water rights, environmental permits, concession framework, change-of-control consents.
**Inputs:** National electricity acts; SLEWRC rulings; water rights legislation; permit records; existing concession agreements.
**Output schema:** regulatory_regime (regulator, independence score, national act, PPP act, concession precedent); consents_required; water_rights; environmental_permits; change_of_control.
**Dodo example:** SLEWRC independent (est. 2011); NEA 2011 + Mini-Grid Regs 2019; **no precedent for hydro concession in SL** — Karpowership is thermal IPP only; no DFI debt → clean change-of-control.

### 3.9 ESG Agent
**Scope:** Environmental impact, social impact, climate resilience, fish passage, resettlement, community benefit.
**Inputs:** Existing ESIA documents; resettlement records; community engagement records; biodiversity surveys; IFC PS / AfDB Safeguards / GCF Standards.
**Output schema:** environmental (ESIA in place + age, IFC PS compliance, concerns); social (resettlement status, claims, engagement rating); climate_resilience (flood/drought risk, climate-proofing capex); carbon_baseline.
**Dodo example:** Original ESIA from 1980s — outdated; resettlement at 2007 uprate limited; climate resilience: dry-season vulnerability; carbon baseline ~10–20k tCO₂e/yr.

### 3.10 Carbon Agent
**Scope:** Emissions baseline, carbon market eligibility, indicative carbon revenue.
**Inputs:** ESG Agent output (baseline emissions); national grid emission factor; carbon methodology databases (VCS, Gold Standard, Article 6.4).
**Output schema:** eligibility (VCS/GS/Art 6.4); emissions_baseline (tCO₂e/yr displaced, grid EF); indicative_revenue (USD/tCO₂ range, annual revenue, IRR uplift bps).
**Dodo example:** Eligible for VCS or Article 6.4 (small hydro <15 MW); ~USD 120k–360k/yr revenue, 30–60 bps equity IRR uplift.

### 3.11 Comparables Agent (mostly retrieval — not generative)
**Scope:** Retrieves and ranks comparable transactions from the AfCEN comparables database; produces per-MW pricing benchmarks and structural analogs.
**Tools:** Vector search over comparables database; structured-feature similarity scoring; per-unit pricing aggregation.
**Output schema:** nearest_comparables (with similarity score and structural lessons); pricing_benchmarks (per-MW USD distribution); valuation_triangulation.
**Dodo example:** Nearest comparable Achwa 1 (Uganda, 42 MW, Berkeley Energy); per-MW benchmark USD 4–5M; valuation triangulation USD 25–35M.

### 3.12 Macro & Country Agent
**Scope:** Sovereign rating, FX risk, political stability, country economic context.
**Inputs:** World Bank country data; IMF Article IV; sovereign credit ratings; political risk indices; currency depreciation history.
**Output schema:** sovereign (ratings + outlook); fx_risk (currency, depreciation, convertibility, recommended PPA currency); political_economy (election cycle, policy continuity, expropriation risk).
**Dodo example:** SL sovereign B-/Caa1 (stressed); Leone -70% over 10 yrs; recommended PPA in USD; political stability since 2002.

### 3.13 Financial Agent
**Scope:** Audited financial extraction, capex/opex modelling, debt schedule analysis.
**Inputs:** Audited financials; loan agreements; operations cost records; refurbishment cost estimates from prior reports.
**Output schema:** financials (revenue/EBITDA history, audit quality); debt_schedule (outstanding principal, lenders, covenants, COC consents); capex_estimates (refurb, uprate, source).
**Dodo example:** Audited financials missing — flagged for feasibility stage; no DFI debt; capex EUR 13.8M central (EGTC) / EUR 12.3M (Salini Impregilo).

### 3.14 Modernisation Scope Agent (synthesis)
**Scope:** Synthesises Topography & Civil + Electromechanical + Transmission & Grid + ESG into a structured modernisation scope and capex envelope.
**Inputs:** Outputs of agents 3.2, 3.3, 3.4, 3.9.
**Output schema:** scope_summary; components (action, capex, timeline, criticality); total_capex (low/central/high); uprate_potential.
**Dodo example:** Full electromechanical rebuild (Units 2,3,4) + civil refurb + control system upgrade + transmission integration; total capex USD 15M; uprate +USD 5M conditional on hydrology.

---

## 4. Tier 2 — Synthesis Agents (9 total)

| Agent | Type | Pre-Feasibility Section | Key Tier 1 Inputs |
|---|---|---|---|
| **Scoring Engine** | Rules engine (NOT LLM) | §2 Scoring Outcome | All 14 Tier 1 agents |
| **Capital Stack Architect** | Rules engine + LLM hybrid | §7 Capital Stack & Co-Funders | 3.7, 3.8, 3.10, 3.11, 3.12, 3.13, 3.14 |
| **Business Model Evaluator** | LLM + rules engine | §5 Business Model Options | 3.7, 3.11, 3.12, 3.14 |
| **Returns Modeller** | Rules engine (NOT LLM) | §6 Indicative Returns | 3.5, 3.6, 3.7, 3.13, 3.14 + Capital Stack output |
| **Risk Register Compiler** | LLM + rules engine | §8 Risk Register & CPs | All 14 (gap and risk extraction) |
| **Strategic Rationale Writer** | LLM | §3 Strategic Rationale | 3.6, 3.11, 3.12 |
| **Policy Brief Writer** | LLM | §10 Policy Brief | 3.6, 3.8, 3.12 + Returns Modeller |
| **Questions Generator** | Rules engine | §11 Questions for Feasibility Stage | All 14 — every "data_gap" or "low confidence" auto-generates a question |
| **Executive Summary Writer** | LLM | §0 Executive Summary | All Tier 2 (runs last) |

### 4.1 The Scoring Engine — deterministic core
The Scoring Engine is **deterministic** — takes structured features from Tier 1, produces the 6 dimension scores, composite, signal (GO/CONDITIONAL/NO-GO), and Path-to-GO. **The LLM is forbidden from producing scores directly.** This is the auditability guarantee that makes the output IC-grade.

### 4.2 The Questions Generator — gap-driven workstream planner
Reads every Tier 1 agent's output and identifies fields with `confidence < 0.6`, `data_gap` flags, and scoring-rationale items where the score was bounded by data quality rather than asset quality. Each becomes a templated question in §11, mapped to a workstream (Technical / Commercial / Legal / Financial / Regulatory & ESG / Strategic) with an "expected source of answer." This is what makes §11 asset-specific and actionable rather than a generic checklist.

---

## 5. Tier 3 — Orchestration & Quality (3 components)

| Agent | Role |
|---|---|
| **Orchestrator** | Manages dependency graph; runs Tier 1 in parallel; sequences Tier 2 by data dependencies; handles errors/retries; emits run logs |
| **Validator** | Cross-checks outputs across agents — e.g. flags if Energy Yield assumes flow values inconsistent with Hydrology output, or if Returns Modeller cash flows don't sum |
| **Provenance Manager** | Maintains the audit trail; ensures every claim in every output traces to an input; produces the provenance manifest that ships with the Pre-Feasibility |

---

## 6. Agent Dependency Graph

```
                           [Input documents + data sources]
                                          ↓
                ┌─────────────────────────┼─────────────────────────┐
                ↓                         ↓                         ↓
    PARALLEL TIER 1 EXTRACTION (run concurrently):
    - Hydrology                   - Topography & Civil
    - Electromechanical           - Transmission & Grid
    - Demand & Market             - Commercial
    - Regulatory & Permits        - ESG
    - Macro & Country             - Financial
                                          ↓
                          DEPENDENT TIER 1:
                          - Energy Yield (needs Hydrology + Topography + EMEC)
                          - Carbon (needs ESG + Macro)
                          - Comparables (needs upstream profile)
                          - Modernisation Scope (needs Topo + EMEC + Trans + ESG)
                                          ↓
                          TIER 2 SYNTHESIS (in order):
                          1. Scoring Engine (first — drives the signal)
                          2. Capital Stack Architect
                          3. Business Model Evaluator
                          4. Returns Modeller (consumes Capital Stack)
                          5. Risk Register Compiler
                          6. Strategic Rationale Writer
                          7. Policy Brief Writer
                          8. Questions Generator
                          9. Executive Summary Writer (last — synthesises everything)
                                          ↓
                              VALIDATOR cross-checks
                                          ↓
                          PROVENANCE MANAGER finalises audit trail
                                          ↓
                          Pre-Feasibility Study output (.md / .docx)
```

---

## 7. Hydro-Specific Considerations

The agent set is the standard hydro stack. A few hydro-specific things to bake in:
- **Run-of-river vs reservoir** — fundamentally different energy-yield calculation and resilience profile
- **Sediment regime** — Charlotte Falls (SL) is a textbook example of catchment-driven siltation killing operability
- **Environmental flow obligations** — increasingly required by IFC PS6 and AfDB safeguards
- **Cavitation risk on Francis turbines** at off-design points — modernisation-risk multiplier
- **Reservoir storage curve** for storage projects — needed for dispatch modelling
- **Climate resilience** — Hydrology Agent's 2050 projection matters more for hydro than any other asset class; can swing the whole project economics

---

## 8. Worked End-to-End Run for Dodo HPP

**Tier 1 outputs (key):**
- Hydrology: catchment 430 km²; 5-yr historic only; **confidence LOW**; data gap flagged
- Topography & Civil: 88 m head; civil works fair; penstock 13.7 mm wall, fair
- Electromechanical: 1 of 4 units operational; full rebuild scope; **confidence MEDIUM**
- Transmission & Grid: **CRITICAL FINDING** — current market displaced by CLSG; binding constraint
- Energy Yield: P50 22 GWh/yr; firm ~12 GWh; uprate to 8 MW unconfirmed (gated by hydrology)
- Demand & Market: Bo-Kenema demand exists but met by CLSG; alternative WAPP export possible
- Commercial: no active PPA visible; Revenue Maturity = 3
- Regulatory & Permits: SLEWRC framework solid; no hydro concession precedent in SL
- ESG: ESIA 40+ years old; needs full update
- Carbon: eligible; ~USD 200k/yr revenue uplift
- Comparables: Achwa 1 nearest analog; valuation USD 25–35M
- Macro & Country: SL sovereign B-; FX risk material; USD-denominated PPA recommended
- Financial: audited financials missing; capex EUR 13.8M central
- Modernisation Scope: full rebuild USD 15M; uprate +USD 5M conditional

**Tier 2 outputs:**
- Scoring Engine: composite 4.40 → **NO-GO at current state**
- Path to GO auto-derived: (1) resolve offtake (CLSG displacement); (2) hydrology validation; (3) government concession framework; (4) O&M operator pre-identification → composite ~6.8–7.2
- Capital Stack Architect: small-scale; AfDB SEFA + EAIF + Africa50 anchor; ~USD 25–40M total
- Business Model Evaluator: recommends "Stranded Brownfield revival via WAPP export"; pure recycling not viable until offtake resolved
- Returns Modeller: equity IRR ~10–12% if offtake resolved at WAPP price; <8% at EDSA price
- Risk Register: top risk = offtake; mitigants include CLSG export rights and DFI payment guarantees
- Strategic Rationale: replicability play — Dodo is template for SL's other small hydro brownfields
- Policy Brief: recommends GoSL prioritise Bumbuna 1 first, sequence Dodo as second-wave
- Questions Generator: auto-generates ~30 feasibility questions, hydrology-heavy
- Executive Summary: "NO-GO at current state; not yet deal-ready; recommend defer until offtake question resolved"

This is the Dodo Pre-Feasibility output — a structured "no, not yet, here's what would change that" output that is more valuable to Africa50 than a generic positive recommendation would be.

---

## 9. Build Sequencing Recommendation

**Sprint 1 (MVP for Molly demo):**
1. Orchestrator skeleton + Provenance Manager
2. Tier 1: Hydrology, Topography & Civil, Electromechanical
3. Tier 1: Commercial, Regulatory & Permits, Financial
4. Tier 1: Comparables (database query layer)
5. Tier 2: Scoring Engine (deterministic, rule-based)
6. Tier 2: Executive Summary + Strategic Rationale Writer (LLM agents)

This is enough to produce a Pre-Feasibility for Bumbuna 1 with most of the value.

**Sprint 2:**
7. Tier 1: Transmission & Grid, Demand & Market, Macro & Country, ESG, Carbon
8. Tier 1: Energy Yield (deterministic), Modernisation Scope (synthesis)
9. Tier 2: Capital Stack Architect, Returns Modeller (deterministic financials)

**Sprint 3:**
10. Tier 2: Business Model Evaluator, Risk Register Compiler, Policy Brief Writer, Questions Generator
11. Validator
12. Output rendering (.md → .docx)

**Sprint 4 (V1):**
- Cross-asset-type extension (parameterise agents for transport, ports)
- Comparables-database write-back automation
- Africa50 user UI

---

## 10. Open Decisions for the Team

These need human sign-off before serious build work; an AI coding agent should NOT decide these autonomously:

1. **Open-weight model selection per agent tier.** Tier 1 extraction agents likely 7B–13B; Tier 2 narrative writers 30B+; Scoring Engine has no LLM. Recommend testing Llama 3.1 family, Mistral Large, Qwen 2.5 — each on a representative document set.
2. **Agent framework.** Build on LangGraph, LlamaIndex agents, custom orchestration, or hybrid? Recommend LangGraph for the orchestrator + custom Pydantic schemas for output contracts.
3. **Output schema versioning.** How are Tier 1 output schemas versioned and how do downstream agents handle schema changes?
4. **Cross-agent caching.** When the same input document is re-run, which agents re-execute and which cache?
5. **Confidence threshold for triggering Questions Generator.** Default 0.6 — refine after first runs.
6. **Validator rules.** Which cross-agent consistency checks are mandatory vs warnings?
