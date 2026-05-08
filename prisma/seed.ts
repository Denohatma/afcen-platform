import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.pathToGoAction.deleteMany();
  await prisma.dimensionScore.deleteMany();
  await prisma.document.deleteMany();
  await prisma.iCBrief.deleteMany();
  await prisma.asset.deleteMany();

  // ============================================================
  // ASSET 1: DODO HPP — STRANDED BROWNFIELD — NO-GO (4.40)
  // ============================================================
  const dodo = await prisma.asset.create({
    data: {
      name: "Dodo HPP (Goma)",
      country: "Sierra Leone",
      sector: "POWER_HYDRO",
      capacityMW: 6,
      capacityUnit: "MW",
      capacityValue: 6,
      ownershipType: "STATE_FULL",
      subCategory: "STRANDED_BROWNFIELD",
      status: "OPERATIONAL_BELOW_CAPACITY",
      commissionedYear: 1986,
      description:
        "6 MW run-of-river hydro on the Pampana River, Eastern Province. Originally commissioned 1986 at 4 MW; uprated to 6 MW in 2007. Owned by EGTC. Connected to 33 kV Bo-Kenema network and adjacent to 225 kV CLSG regional interconnector.",
      strategicContext:
        "Asset is currently stranded — only Unit 1 functional, powering staff quarters only. CLSG imports have displaced the Bo-Kenema market. Refurb-and-uprate proposal to 8 MW costs EUR 13.8M (EGTC) / EUR 12.3M (Salini Impregilo).",
      scores: {
        create: [
          {
            dimension: "REVENUE_MATURITY",
            score: 3,
            confidence: 0.85,
            scoredBy: "analyst:dennis",
            rationale:
              'Asset is "stranded" — operational on paper but not earning a tariff. CLSG imports have displaced the market. No active PPA visible.',
          },
          {
            dimension: "DEBT_COMPLEXITY",
            score: 8,
            confidence: 0.7,
            scoredBy: "analyst:dennis",
            rationale:
              "No visible DFI debt. State-funded refurb history. High structuring flexibility for a new concessionaire.",
          },
          {
            dimension: "CONCESSION_READINESS",
            score: 4,
            confidence: 0.8,
            scoredBy: "analyst:dennis",
            rationale:
              "Legal framework exists (NEA 2011, SLEWRC) but no precedent for hydro concession in Sierra Leone. Karpowership precedent is thermal IPP only.",
          },
          {
            dimension: "DATA_AVAILABILITY",
            score: 4,
            confidence: 0.9,
            scoredBy: "analyst:dennis",
            rationale:
              "Strong technical pass via SAEMS field inspection (3D scan, condition report). Weak operational records, sparse hydrology (5 yrs 1972-76 + limited recent), no audited financials visible.",
          },
          {
            dimension: "REGULATORY_ENVIRONMENT",
            score: 5,
            confidence: 0.7,
            scoredBy: "analyst:dennis",
            rationale:
              "SLEWRC independent on paper. Tariffs among ECOWAS highest in absolute terms but unaffordable for end users (>25% of household income).",
          },
          {
            dimension: "MODERNISATION_RISK",
            score: 3,
            confidence: 0.85,
            scoredBy: "analyst:dennis",
            rationale:
              "Effectively a rebuild — civil, electromechanical, governance, O&M competency. EUR 13.8M is unconfirmed for hydrology, penstock capacity at 8 MW, environmental compliance.",
          },
        ],
      },
      pathActions: {
        create: [
          {
            description:
              "Resolve offtake — bankable PPA at CLSG-competitive tariff OR pivot to WAPP regional export",
            affectsDimension: "REVENUE_MATURITY",
            scoreUplift: 4,
            estimatedCost: "TBD",
            estimatedTime: "6-12 months",
          },
          {
            description: "Fresh hydrology study to validate 8 MW yield",
            affectsDimension: "MODERNISATION_RISK",
            scoreUplift: 3,
            estimatedCost: "EUR 50-100k",
            estimatedTime: "3-4 months",
          },
          {
            description:
              "Government concession framework for hydro (Letter of Support + template concession)",
            affectsDimension: "CONCESSION_READINESS",
            scoreUplift: 3,
            estimatedCost: "TA-funded",
            estimatedTime: "6-9 months",
          },
          {
            description:
              "Pre-identified O&M operator via PPP (per SAEMS recommendation)",
            affectsDimension: "MODERNISATION_RISK",
            scoreUplift: 2,
            estimatedCost: "TBD",
            estimatedTime: "3-6 months",
          },
        ],
      },
    },
  });

  // ============================================================
  // ASSET 2: BUMBUNA 1 HPP — UNDERPERFORMING BROWNFIELD — CONDITIONAL (5.55)
  // ============================================================
  const bumbuna = await prisma.asset.create({
    data: {
      name: "Bumbuna 1 HPP",
      country: "Sierra Leone",
      sector: "POWER_HYDRO",
      capacityMW: 50,
      capacityUnit: "MW",
      capacityValue: 50,
      ownershipType: "STATE_FULL",
      subCategory: "UNDERPERFORMING_BROWNFIELD",
      status: "OPERATIONAL_BELOW_CAPACITY",
      commissionedYear: 2009,
      originalCostUsd: 327_000_000,
      description:
        "50 MW run-of-river hydro on the Seli River, Tonkolili District, ~200 km NE of Freetown. Sierra Leone's largest hydro asset. Construction 1975-1997 (halted civil war), restarted 2005, commissioned 2009. AfDB $103M + World Bank $50.5M anchor financing. Owned by GoSL via EGTC. 161 kV Bumbuna-Kingtom 205 km transmission line to Freetown.",
      strategicContext:
        "Operates well below installed capacity (~35 MW peak vs 50 MW; <20 MW dry season). Adjacent Bumbuna II (143 MW) being structured by Joule Africa + ESCO under SHPL JV — strong precedent for IPP structure. President Bio publicly endorsed modernization mid-2024. CLSG line creates regional export optionality.",
      scores: {
        create: [
          {
            dimension: "REVENUE_MATURITY",
            score: 5,
            confidence: 0.7,
            scoredBy: "analyst:dennis",
            rationale:
              "16 years of operating history. PPA with EDSA exists but capacity-payment structure unclear. Below-rated output and seasonal volatility erode cash-flow predictability.",
          },
          {
            dimension: "DEBT_COMPLEXITY",
            score: 5,
            confidence: 0.6,
            scoredBy: "analyst:dennis",
            rationale:
              "Original AfDB + World Bank loans likely amortized or near-amortized after 16 years. Any change-of-control would require AfDB/IDA consents. Manageable but non-trivial.",
          },
          {
            dimension: "CONCESSION_READINESS",
            score: 7,
            confidence: 0.8,
            scoredBy: "analyst:dennis",
            rationale:
              "Bumbuna II IPP precedent next door (Joule Africa + ESCO under 25-year PPA with EDSA, AfDB + EU + PIDG + EAIF financed) is highly material. Government publicly aligned via PI-CREF.",
          },
          {
            dimension: "DATA_AVAILABILITY",
            score: 6,
            confidence: 0.75,
            scoredBy: "analyst:dennis",
            rationale:
              "AfDB Project Completion Report (2013), Joule Africa technical studies for Bumbuna II (same hydrology), 16 years of operational data with EGTC. Audited financials not publicly visible.",
          },
          {
            dimension: "REGULATORY_ENVIRONMENT",
            score: 5,
            confidence: 0.7,
            scoredBy: "analyst:dennis",
            rationale:
              "SLEWRC framework as for Dodo. Same EDSA payment risk, same end-user affordability constraint. CLSG/WAPP integration adds export optionality.",
          },
          {
            dimension: "MODERNISATION_RISK",
            score: 5,
            confidence: 0.7,
            scoredBy: "analyst:dennis",
            rationale:
              "16-year-old plant with documented under-performance. Civil structures sound. Electromechanical refresh and turbine work likely needed. Active discussion of adding 120 MW expansion.",
          },
        ],
      },
      pathActions: {
        create: [
          {
            description:
              "Cap-and-floor PPA renegotiation locking dispatch and indexing capacity payments",
            affectsDimension: "REVENUE_MATURITY",
            scoreUplift: 3,
            estimatedCost: "TA-funded",
            estimatedTime: "6-9 months",
          },
          {
            description:
              "Bundle with Bumbuna II concession — single concessionaire, both assets",
            affectsDimension: "CONCESSION_READINESS",
            scoreUplift: 2,
            estimatedCost: "Structuring fee",
            estimatedTime: "9-12 months",
          },
          {
            description:
              "Independent technical assessment for modernization + 120 MW expansion economics",
            affectsDimension: "MODERNISATION_RISK",
            scoreUplift: 2,
            estimatedCost: "EUR 200-400k",
            estimatedTime: "4-6 months",
          },
        ],
      },
    },
  });

  // ============================================================
  // ASSET 3: BUJAGALI HPP — OPERATIONAL IPP REFINANCING — GO (8.10)
  // ============================================================
  const bujagali = await prisma.asset.create({
    data: {
      name: "Bujagali HPP",
      country: "Uganda",
      sector: "POWER_HYDRO",
      capacityMW: 250,
      capacityUnit: "MW",
      capacityValue: 250,
      ownershipType: "IPP_PRIVATE",
      subCategory: "OPERATIONAL_IPP_REFINANCING",
      status: "OPERATIONAL",
      commissionedYear: 2012,
      originalCostUsd: 902_000_000,
      description:
        "250 MW run-of-river hydro on the Victoria Nile near Jinja. Operational since 2012. Owned and operated by Bujagali Energy Limited (BEL) under a 30-year BOOT concession with GoU. Shareholders: AKFED/IPS Group + SN Power (Scatec ASA, Norway) + GoU residual. Generates ~45% of Uganda's electricity.",
      strategicContext:
        "Single most successful African hydro refinancing precedent. In July 2018, BEL's debt was refinanced ($400M+ across IFC, AfDB, Proparco, FMO, KfW, Absa, Nedbank) with tenor extended from 2023 to 2032. GoU granted 15-year tax waiver. Saves UETCL ~$40M/year in capacity payments. The gold-standard reference transaction for the AfCEN framework.",
      scores: {
        create: [
          {
            dimension: "REVENUE_MATURITY",
            score: 9,
            confidence: 0.95,
            scoredBy: "analyst:dennis",
            rationale:
              "14 years of operational data; 30-year PPA; 45% of national generation; cash flows highly stable; refinancing already executed once successfully.",
          },
          {
            dimension: "DEBT_COMPLEXITY",
            score: 6,
            confidence: 0.85,
            scoredBy: "analyst:dennis",
            rationale:
              "Multiple senior/sub lenders, but the 2018 refinancing demonstrated the consent process is tractable. Future re-refinancing would face known parties.",
          },
          {
            dimension: "CONCESSION_READINESS",
            score: 9,
            confidence: 0.9,
            scoredBy: "analyst:dennis",
            rationale:
              'BOOT structure in place since 2005, 16 years remaining on concession. Asset is already private; "recycling" here means equity transfer or debt re-refi rather than new concession.',
          },
          {
            dimension: "DATA_AVAILABILITY",
            score: 9,
            confidence: 0.95,
            scoredBy: "analyst:dennis",
            rationale:
              "Comprehensive — IFC/AfDB/Proparco public docs, IEA case study, BEL fact sheets, audited financial reporting through DFI lenders.",
          },
          {
            dimension: "REGULATORY_ENVIRONMENT",
            score: 7,
            confidence: 0.85,
            scoredBy: "analyst:dennis",
            rationale:
              "Uganda has cost-reflective tariffs. Independent regulator (ERA). UETCL is moderately reliable single-buyer. Tariff political sensitivity remains.",
          },
          {
            dimension: "MODERNISATION_RISK",
            score: 8,
            confidence: 0.8,
            scoredBy: "analyst:dennis",
            rationale:
              "14-year-old asset, well-maintained by Scatec/AKFED. Standard mid-life refurb cycle approaching but no structural risk.",
          },
        ],
      },
      pathActions: {
        create: [
          {
            description:
              "Already GO. Path forward: secondary equity transfer to institutional capital (African pension funds via Africa50 Acceleration Fund) OR further DFI re-refi as 2027-28 mid-tenor approaches.",
            affectsDimension: "CONCESSION_READINESS",
            scoreUplift: 0,
            estimatedCost: "n/a",
            estimatedTime: "n/a",
          },
        ],
      },
    },
  });

  // ============================================================
  // ASSET 4: SENEGAMBIA BRIDGE — OPERATIONAL PUBLIC FOR CONCESSION — GO (7.25) — DEAL CLOSED
  // ============================================================
  const senegambia = await prisma.asset.create({
    data: {
      name: "Senegambia Bridge",
      country: "The Gambia",
      sector: "TRANSPORT_BRIDGE",
      capacityValue: 942,
      capacityUnit: "meters",
      ownershipType: "CONCESSIONED",
      subCategory: "OPERATIONAL_PUBLIC_FOR_CONCESSION",
      status: "OPERATIONAL",
      commissionedYear: 2019,
      description:
        "942-meter road bridge over the Gambia River at Farafenni. Connects northern and southern Senegal across the Gambia. Reduced travel time from 16 hours (ferry) to under 4 hours. Built by GoG with Chinese contractor financing. Toll collection from 2019.",
      strategicContext:
        "Africa50's first asset recycling transaction in Africa. October 2024: $100M concession with Government of The Gambia, with $15.5M first tranche disbursed. Africa50 takes demand and revenue risk; handback at end-of-term in original-or-improved condition. Model precedent for everything that follows. Validates framework calibration.",
      scores: {
        create: [
          {
            dimension: "REVENUE_MATURITY",
            score: 8,
            confidence: 0.85,
            scoredBy: "analyst:dennis",
            rationale:
              "Five years of toll-collection data since 2019; demonstrated traffic patterns; cross-border commercial flows established.",
          },
          {
            dimension: "DEBT_COMPLEXITY",
            score: 6,
            confidence: 0.7,
            scoredBy: "analyst:dennis",
            rationale:
              "Built with Chinese contractor financing (likely Exim Bank). Some change-of-control consents required. Manageable but not trivial.",
          },
          {
            dimension: "CONCESSION_READINESS",
            score: 8,
            confidence: 0.9,
            scoredBy: "analyst:dennis",
            rationale:
              "Strong bilateral framework between Senegal and Gambia. Transport infrastructure has clear regulatory architecture. Government of The Gambia explicitly initiated the recycling.",
          },
          {
            dimension: "DATA_AVAILABILITY",
            score: 7,
            confidence: 0.8,
            scoredBy: "analyst:dennis",
            rationale:
              "Toll-revenue data, traffic counts, contractor handover documentation, structural condition reports. Solid for a 5-year-old asset.",
          },
          {
            dimension: "REGULATORY_ENVIRONMENT",
            score: 6,
            confidence: 0.75,
            scoredBy: "analyst:dennis",
            rationale:
              "Cross-border regulatory complexity. Gambia sovereign rating modest but improving. Some FX risk.",
          },
          {
            dimension: "MODERNISATION_RISK",
            score: 8,
            confidence: 0.85,
            scoredBy: "analyst:dennis",
            rationale:
              "5-year-old asset in good condition. Standard scheduled-maintenance under concession. Africa50 required to return asset in original-or-improved state.",
          },
        ],
      },
      pathActions: {
        create: [
          {
            description:
              "Deal closed Oct 2024. Operational — first $15.5M tranche disbursed. No further path actions required.",
            affectsDimension: "CONCESSION_READINESS",
            scoreUplift: 0,
            estimatedCost: "n/a",
            estimatedTime: "closed",
          },
        ],
      },
    },
  });

  console.log("Seeded 4 assets:", {
    dodo: dodo.id,
    bumbuna: bumbuna.id,
    bujagali: bujagali.id,
    senegambia: senegambia.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
