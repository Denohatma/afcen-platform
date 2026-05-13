import { getLLMAdapter } from "@/lib/llm/adapter";
import { firecrawlSearch } from "@/lib/llm/firecrawl-search";
import { SiteResearchSchema, type SiteResearch } from "./types";

export async function researchSite(siteName: string): Promise<SiteResearch> {
  const adapter = getLLMAdapter();

  const webEvidence = await firecrawlSearch(siteName);
  const evidenceSection = webEvidence
    ? `\n\nWEB EVIDENCE (live search results — use these facts preferentially over training data):\n${webEvidence}`
    : "\n\nNo web evidence available — use your training knowledge.";

  return adapter.extractStructured(
    {
      systemPrompt: `You are a senior infrastructure-finance analyst at AfCEN (Africa50 Centre of Excellence for Infrastructure). You research African infrastructure assets and return structured data. You are thorough and precise. If you cannot find a specific detail, return null for that field. Do not invent facts not supported by the evidence.

For sector, use one of: POWER_HYDRO, POWER_SOLAR, POWER_THERMAL, POWER_TRANSMISSION, TRANSPORT_ROAD, TRANSPORT_RAIL, TRANSPORT_BRIDGE, TRANSPORT_PORT, MIDSTREAM_GAS, ICT_DATACENTER.
For ownershipType, use one of: STATE_FULL, STATE_MAJORITY, IPP_PRIVATE, IPP_MIXED, CONCESSIONED.
For subCategory, use one of: STRANDED_BROWNFIELD, UNDERPERFORMING_BROWNFIELD, OPERATIONAL_IPP_REFINANCING, OPERATIONAL_PUBLIC_FOR_CONCESSION, GREENFIELD_IPT.
For status, use one of: OPERATIONAL, OPERATIONAL_BELOW_CAPACITY, MOTHBALLED, UNDER_REFURB.`,
      prompt: `Research the infrastructure asset "${siteName}" and return a JSON object with these fields:

{
  "name": "Official asset name",
  "country": "Country name",
  "sector": "Sector enum value",
  "capacityMW": number or null,
  "ownershipType": "Ownership enum value",
  "subCategory": "SubCategory enum value",
  "status": "Status enum value",
  "commissionedYear": number or null,
  "originalCostUsd": number or null,
  "description": "2-4 sentence description of the asset",
  "strategicContext": "2-3 sentence explanation of why this asset is relevant for Africa50's asset recycling pipeline",
  "operator": "Current operator/concessionaire or null",
  "developer": "Original developer or null",
  "waterBody": "River/water body name for hydro, or null",
  "region": "Province/state/region within the country"
}

Return JSON only.${evidenceSection}`,
      dataClassification: "public",
      maxTokens: 2000,
    },
    SiteResearchSchema
  );
}
