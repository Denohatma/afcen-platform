import type { LLMRequest } from "./adapter";
import { RUBRICS } from "@/lib/scoring/rubrics";
import type {
  Asset,
  Dimension,
  DimensionScore,
  PathToGoAction,
} from "@prisma/client";

export function extractAssetDataPrompt(documentText: string): LLMRequest {
  return {
    systemPrompt:
      "You are a senior infrastructure-finance analyst at AfCEN. Your job is to extract structured asset data from technical and financial documents about African infrastructure assets. You output ONLY JSON. You do not invent facts. If a field is not present, return null.",
    prompt: `Extract the following fields from this document. Return JSON matching this schema:
{
  "assetName": string | null,
  "country": string | null,
  "sector": string | null,
  "capacityMW": number | null,
  "ownershipType": string | null,
  "commissionedYear": number | null,
  "originalCostUsd": number | null,
  "currentOperationalStatus": string | null,
  "ppaExists": boolean | null,
  "ppaCounterparty": string | null,
  "existingDebt": Array<{lender: string, amount: number, currency: string}> | null,
  "modernizationNeeds": string | null,
  "regulatoryAuthority": string | null
}

DOCUMENT:
${documentText.slice(0, 50000)}

JSON:`,
    dataClassification: "sensitive",
    maxTokens: 2000,
  };
}

export function scoreDimensionPrompt(
  asset: Asset,
  dimension: Dimension,
  documentExcerpts: string[]
): LLMRequest {
  const rubric = RUBRICS[dimension];

  return {
    systemPrompt:
      'You are an infrastructure-finance analyst scoring an asset against the AfCEN Asset Recycling framework. You score one dimension at a time on a 1-10 scale, with a written rationale citing specific evidence from the documents. You do NOT compute composite scores. You output ONLY JSON: {"score": number, "rationale": string, "confidence": number, "evidenceCitations": string[]}.',
    prompt: `ASSET: ${asset.name} (${asset.country}, ${asset.sector}, ${asset.capacityMW ?? "N/A"}MW)
DIMENSION TO SCORE: ${dimension}

RUBRIC:
- Low (1-3): ${rubric.low}
- Mid (4-6): ${rubric.mid}
- High (7-10): ${rubric.high}

EVIDENCE:
${documentExcerpts.length > 0 ? documentExcerpts.join("\n\n---\n\n") : "No documents uploaded. Score based on the asset profile above."}

Score this dimension. Output JSON only.`,
    dataClassification: "sensitive",
    maxTokens: 800,
  };
}

export function generateBriefPrompt(
  asset: Asset,
  scores: DimensionScore[],
  pathActions: PathToGoAction[]
): LLMRequest {
  return {
    systemPrompt:
      "You are drafting an Investment Committee Concept-Stage Brief for Africa50. The brief is structured into seven sections: Investment Overview, Strategic Rationale, AfCEN Scorecard, Path to GO, Comparable Transactions, Risks & Conditions Precedent, Recommendation. You write in clear, formal infrastructure-finance prose. You cite the AfCEN scorecard explicitly. Length: 1500-2500 words. Output: markdown.",
    prompt: `Generate the IC Concept-Stage Brief.

ASSET DATA:
${JSON.stringify(
  {
    name: asset.name,
    country: asset.country,
    sector: asset.sector,
    capacityMW: asset.capacityMW,
    capacityValue: asset.capacityValue,
    capacityUnit: asset.capacityUnit,
    ownershipType: asset.ownershipType,
    subCategory: asset.subCategory,
    status: asset.status,
    commissionedYear: asset.commissionedYear,
    originalCostUsd: asset.originalCostUsd,
    description: asset.description,
    strategicContext: asset.strategicContext,
  },
  null,
  2
)}

SCORECARD:
${scores.map((s) => `- ${s.dimension}: ${s.score}/10 (${s.rationale})`).join("\n")}

PATH TO GO:
${pathActions.map((a, i) => `${i + 1}. ${a.description} (uplift: +${a.scoreUplift}, cost: ${a.estimatedCost}, time: ${a.estimatedTime})`).join("\n")}

Generate the brief now.`,
    dataClassification: "sensitive",
    maxTokens: 4000,
  };
}
