import {
  Dimension,
  Sector,
  OwnershipType,
  SubCategory,
  AssetStatus,
} from "@prisma/client";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  REVENUE_MATURITY: "Revenue Maturity",
  DEBT_COMPLEXITY: "Debt Complexity",
  CONCESSION_READINESS: "Concession Readiness",
  DATA_AVAILABILITY: "Data Availability",
  REGULATORY_ENVIRONMENT: "Regulatory Environment",
  MODERNISATION_RISK: "Modernisation Risk",
};

export const SECTOR_LABELS: Record<Sector, string> = {
  POWER_HYDRO: "Hydro Power",
  POWER_SOLAR: "Solar Power",
  POWER_THERMAL: "Thermal Power",
  POWER_TRANSMISSION: "Power Transmission",
  TRANSPORT_ROAD: "Road Transport",
  TRANSPORT_RAIL: "Rail Transport",
  TRANSPORT_BRIDGE: "Bridge",
  TRANSPORT_PORT: "Port",
  MIDSTREAM_GAS: "Midstream Gas",
  ICT_DATACENTER: "Data Center",
};

export const OWNERSHIP_LABELS: Record<OwnershipType, string> = {
  STATE_FULL: "State-Owned",
  STATE_MAJORITY: "State Majority",
  IPP_PRIVATE: "Private IPP",
  IPP_MIXED: "Mixed IPP",
  CONCESSIONED: "Concessioned",
};

export const SUBCATEGORY_LABELS: Record<SubCategory, string> = {
  STRANDED_BROWNFIELD: "Stranded Brownfield",
  UNDERPERFORMING_BROWNFIELD: "Underperforming Brownfield",
  OPERATIONAL_IPP_REFINANCING: "Operational IPP Refinancing",
  OPERATIONAL_PUBLIC_FOR_CONCESSION: "Operational Public for Concession",
  GREENFIELD_IPT: "Greenfield IPT",
};

export const STATUS_LABELS: Record<AssetStatus, string> = {
  OPERATIONAL: "Operational",
  OPERATIONAL_BELOW_CAPACITY: "Below Capacity",
  MOTHBALLED: "Mothballed",
  UNDER_REFURB: "Under Refurbishment",
};

export const COUNTRY_FLAGS: Record<string, string> = {
  "Sierra Leone": "\u{1F1F8}\u{1F1F1}",
  Uganda: "\u{1F1FA}\u{1F1EC}",
  "The Gambia": "\u{1F1EC}\u{1F1F2}",
  Kenya: "\u{1F1F0}\u{1F1EA}",
  Nigeria: "\u{1F1F3}\u{1F1EC}",
  Ghana: "\u{1F1EC}\u{1F1ED}",
  Senegal: "\u{1F1F8}\u{1F1F3}",
  "South Africa": "\u{1F1FF}\u{1F1E6}",
  Ethiopia: "\u{1F1EA}\u{1F1F9}",
  Tanzania: "\u{1F1F9}\u{1F1FF}",
  Mozambique: "\u{1F1F2}\u{1F1FF}",
};
