import { getLLMAdapter } from "@/lib/llm/adapter";
import { SiteResearchSchema, type SiteResearch } from "./types";

export async function researchSite(siteName: string): Promise<SiteResearch> {
  const adapter = getLLMAdapter();

  return adapter.extractStructured(
    {
      systemPrompt: `You are a senior infrastructure-finance analyst at AfCEN (Africa50 Centre of Excellence for Infrastructure). You research African infrastructure assets and return structured data. You are thorough and precise. If you cannot find a specific detail, return null for that field. Do not invent facts.

For sector, use one of: POWER_HYDRO, POWER_SOLAR, POWER_THERMAL, POWER_TRANSMISSION, TRANSPORT_ROAD, TRANSPORT_RAIL, TRANSPORT_BRIDGE, TRANSPORT_PORT, MIDSTREAM_GAS, ICT_DATACENTER.
For ownershipType, use one of: STATE_FULL, STATE_MAJORITY, IPP_PRIVATE, IPP_MIXED, CONCESSIONED.
For subCategory, use one of: STRANDED_BROWNFIELD, UNDERPERFORMING_BROWNFIELD, OPERATIONAL_IPP_REFINANCING, OPERATIONAL_PUBLIC_FOR_CONCESSION, GREENFIELD_IPT.
For status, use one of: OPERATIONAL, OPERATIONAL_BELOW_CAPACITY, MOTHBALLED, UNDER_REFURB.`,
      prompt: `Research the infrastructure asset "${siteName}" and return a JSON object with these fields:

{
  "name": "Official asset name",
  "country": "Country name",
  "sector": "Sector enum value",
  "capacityMW": number or null (installed capacity in MW, or equivalent),
  "ownershipType": "Ownership enum value",
  "subCategory": "SubCategory enum value",
  "status": "Status enum value",
  "commissionedYear": number or null,
  "originalCostUsd": number or null (total project cost in USD),
  "description": "2-4 sentence description of the asset, its current state, infrastructure type, and key technical characteristics",
  "strategicContext": "2-3 sentence explanation of why this asset is relevant for Africa50's asset recycling pipeline and its strategic significance",
  "operator": "Current operator/concessionaire or null",
  "developer": "Original developer or null",
  "waterBody": "River/water body name for hydro, or null",
  "region": "Province/state/region within the country"
}

Be specific with numbers. For originalCostUsd, provide the total project cost at commissioning in US dollars. For capacityMW, provide installed/nameplate capacity. Return JSON only.`,
      dataClassification: "public",
      maxTokens: 2000,
    },
    SiteResearchSchema
  );
}
